-- ============================================================
-- GPUWatch Schema
-- Postgres + TimescaleDB
-- Run against Supabase or any Postgres >= 14
-- ============================================================

-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()

-- ─── GPUs (canonical catalog) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gpus (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,           -- rtx-5090
  model          TEXT NOT NULL,                  -- RTX 5090
  brand          TEXT NOT NULL CHECK (brand IN ('nvidia', 'amd')),
  architecture   TEXT NOT NULL,                  -- Blackwell | Ada Lovelace | RDNA 4
  generation     TEXT NOT NULL,                  -- RTX 5000 | RX 9000
  vram_gb        INT NOT NULL,
  tdp_watts      INT,
  msrp_usd       NUMERIC(10, 2) NOT NULL,
  release_date   DATE,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gpus_slug ON gpus (slug);
CREATE INDEX idx_gpus_active ON gpus (active) WHERE active = TRUE;

-- ─── SKU Mappings (retailer SKU → canonical GPU) ───────────────────────────

CREATE TABLE IF NOT EXISTS sku_mappings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id               UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer             TEXT NOT NULL,
  retailer_sku         TEXT NOT NULL,
  retailer_model_name  TEXT,
  affiliate_url        TEXT,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (retailer, retailer_sku)
);

CREATE INDEX idx_sku_mappings_gpu_id ON sku_mappings (gpu_id);
CREATE INDEX idx_sku_mappings_retailer_sku ON sku_mappings (retailer, retailer_sku);

-- ─── Retailer Offers (current / latest price snapshot) ────────────────────

CREATE TABLE IF NOT EXISTS retailer_offers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id               UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer             TEXT NOT NULL,
  sku                  TEXT NOT NULL,
  price_usd            NUMERIC(10, 2) NOT NULL,
  regular_price_usd    NUMERIC(10, 2),
  sale_price_usd       NUMERIC(10, 2),
  stock_status         TEXT NOT NULL DEFAULT 'unknown'
                         CHECK (stock_status IN ('in_stock','out_of_stock','limited','preorder','unknown')),
  stock_quantity       INT,
  affiliate_url        TEXT NOT NULL,
  direct_url           TEXT NOT NULL,
  last_checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gpu_id, retailer)
);

CREATE INDEX idx_retailer_offers_gpu_id ON retailer_offers (gpu_id);
CREATE INDEX idx_retailer_offers_price ON retailer_offers (price_usd);

-- ─── Price History (TimescaleDB hypertable) ────────────────────────────────

CREATE TABLE IF NOT EXISTS price_history (
  id           UUID NOT NULL DEFAULT gen_random_uuid(),
  gpu_id       UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer     TEXT NOT NULL,
  price_usd    NUMERIC(10, 2) NOT NULL,
  stock_status TEXT NOT NULL DEFAULT 'unknown',
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable partitioned by recorded_at (7-day chunks)
SELECT create_hypertable('price_history', 'recorded_at', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);

-- Critical composite index: gpu_id + timestamp for chart queries
CREATE INDEX idx_price_history_gpu_time ON price_history (gpu_id, recorded_at DESC);
CREATE INDEX idx_price_history_retailer_time ON price_history (gpu_id, retailer, recorded_at DESC);

-- TimescaleDB: auto-compress chunks older than 30 days
ALTER TABLE price_history SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'gpu_id, retailer'
);
SELECT add_compression_policy('price_history', INTERVAL '30 days');

-- Continuous aggregate: 30-day rolling average per GPU/retailer
CREATE MATERIALIZED VIEW price_30d_avg
WITH (timescaledb.continuous) AS
  SELECT
    gpu_id,
    retailer,
    time_bucket('1 day', recorded_at) AS bucket,
    AVG(price_usd) AS avg_price,
    MIN(price_usd) AS min_price,
    MAX(price_usd) AS max_price,
    COUNT(*)       AS sample_count
  FROM price_history
  GROUP BY gpu_id, retailer, bucket
WITH NO DATA;

SELECT add_continuous_aggregate_policy('price_30d_avg',
  start_offset => INTERVAL '31 days',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);

-- ─── Price History (compressed weekly averages for data > 180d) ────────────

CREATE TABLE IF NOT EXISTS price_history_weekly (
  gpu_id        UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer      TEXT NOT NULL,
  week_start    DATE NOT NULL,
  avg_price_usd NUMERIC(10,2) NOT NULL,
  min_price_usd NUMERIC(10,2) NOT NULL,
  max_price_usd NUMERIC(10,2) NOT NULL,
  sample_count  INT NOT NULL,
  PRIMARY KEY (gpu_id, retailer, week_start)
);

-- ─── Deal Scores (computed continuously) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS deal_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id            UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer          TEXT NOT NULL,
  current_price_usd NUMERIC(10,2) NOT NULL,
  rolling_30d_avg   NUMERIC(10,2),
  msrp_usd          NUMERIC(10,2) NOT NULL,
  pct_below_avg     NUMERIC(6,3),    -- positive = below average (good)
  msrp_delta_pct    NUMERIC(6,3),    -- negative = above MSRP
  volatility_score  NUMERIC(5,2),    -- 0–100
  is_deal           BOOLEAN NOT NULL DEFAULT FALSE,
  deal_reason       TEXT,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gpu_id, retailer)
);

CREATE INDEX idx_deal_scores_is_deal ON deal_scores (is_deal, computed_at DESC) WHERE is_deal = TRUE;

-- ─── GPU Watches (alert subscriptions) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS gpu_watches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL,
  gpu_id            UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  target_price_usd  NUMERIC(10,2),         -- NULL = any price drop
  notify_in_stock   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at  TIMESTAMPTZ,
  UNIQUE (email, gpu_id)
);

CREATE INDEX idx_gpu_watches_gpu_id ON gpu_watches (gpu_id);

-- ─── Outbound Clicks (affiliate analytics) ────────────────────────────────

CREATE TABLE IF NOT EXISTS outbound_clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id      UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer    TEXT NOT NULL,
  ref_url     TEXT,
  user_agent  TEXT,
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable for efficient time-range analytics
SELECT create_hypertable('outbound_clicks', 'clicked_at', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);

CREATE INDEX idx_outbound_clicks_gpu ON outbound_clicks (gpu_id, clicked_at DESC);

-- ─── Ingestion Run Log (observability) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL,        -- bestbuy | amazon | newegg | bh_photo
  status        TEXT NOT NULL,        -- success | error | partial
  gpus_updated  INT DEFAULT 0,
  errors        JSONB,
  duration_ms   INT,
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Utility: updated_at trigger ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gpus_updated_at
  BEFORE UPDATE ON gpus
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
