// ─── Deal Detection Algorithm ─────────────────────────────────────────────────
//
// A GPU offer is a DEAL when:
//   1. price < rolling_30d_avg * 0.92  (>8% below 30-day average), OR
//   2. price <= msrp AND stock = in_stock | limited
//
// Volatility score (0-100):
//   Measures price standard deviation over 30 days, normalized to 0-100.
//   Higher = more price swings = deal windows appear and close fast.

import { getDB } from '@gpuwatch/infra'
import type { DealScore } from '@gpuwatch/domain'

const sql = getDB()

const DEAL_THRESHOLD = 0.92    // 8% below 30d avg
const VOLATILITY_SCALE = 200   // normalization divisor (USD)

export async function computeDealScore(gpuId: string): Promise<DealScore[]> {
    const scores: DealScore[] = []

    // Get current best offer per retailer
    const offers = await sql<{
        gpuId: string
        retailer: string
        priceUsd: number
        stockStatus: string
        msrpUsd: number
    }[]>`
    SELECT
      ro.gpu_id,
      ro.retailer,
      ro.price_usd,
      ro.stock_status,
      g.msrp_usd
    FROM retailer_offers ro
    JOIN gpus g ON g.id = ro.gpu_id
    WHERE ro.gpu_id = ${gpuId}
  `

    for (const offer of offers) {
        // Get 30-day rolling stats from continuous aggregate
        const [stats] = await sql<{
            avg30d: number | null
            min30d: number | null
            max30d: number | null
            stddev30d: number | null
        }[]>`
      SELECT
        AVG(avg_price)::numeric(10,2)    AS avg30d,
        MIN(min_price)::numeric(10,2)    AS min30d,
        MAX(max_price)::numeric(10,2)    AS max30d,
        STDDEV(avg_price)::numeric(10,4) AS stddev30d
      FROM price_30d_avg
      WHERE gpu_id = ${gpuId}
        AND retailer = ${offer.retailer}
        AND bucket >= NOW() - INTERVAL '30 days'
    `

        const avg30d = stats?.avg30d ?? null
        const stddev = stats?.stddev30d ?? 0
        const msrp = Number(offer.msrpUsd)
        const price = Number(offer.priceUsd)

        // Volatility: stddev normalized 0-100, capped at 100
        const volatilityScore = Math.min(100, (Number(stddev) / VOLATILITY_SCALE) * 100)

        // MSRP delta percentage (negative = above MSRP)
        const msrpDeltaPct = ((msrp - price) / msrp) * 100

        // % below 30-day average (positive = cheaper than normal)
        const pctBelowAvg = avg30d ? ((avg30d - price) / avg30d) * 100 : null

        // Deal conditions
        const condition1 = pctBelowAvg !== null && pctBelowAvg >= 8  // >8% below avg
        const condition2 =
            price <= msrp &&
            ['in_stock', 'limited'].includes(offer.stockStatus)

        const isDeal = condition1 || condition2

        let dealReason: string | null = null
        if (condition1) dealReason = `${pctBelowAvg!.toFixed(1)}% below 30-day average`
        else if (condition2) dealReason = 'At or below MSRP and in stock'

        const score: Omit<DealScore, 'id'> = {
            gpu_id: gpuId,
            retailer: offer.retailer as DealScore['retailer'],
            current_price_usd: price,
            rolling_30d_avg_usd: avg30d ?? 0,
            msrp_usd: msrp,
            pct_below_avg: pctBelowAvg ?? 0,
            msrp_delta_pct: msrpDeltaPct,
            volatility_score: volatilityScore,
            is_deal: isDeal,
            deal_reason: dealReason,
            computed_at: new Date().toISOString(),
        }

        // Upsert deal score
        const [inserted] = await sql<DealScore[]>`
      INSERT INTO deal_scores
        (gpu_id, retailer, current_price_usd, rolling_30d_avg, msrp_usd,
         pct_below_avg, msrp_delta_pct, volatility_score, is_deal, deal_reason, computed_at)
      VALUES
        (${score.gpu_id}, ${score.retailer}, ${score.current_price_usd},
         ${score.rolling_30d_avg_usd}, ${score.msrp_usd}, ${score.pct_below_avg},
         ${score.msrp_delta_pct}, ${score.volatility_score}, ${score.is_deal},
         ${score.deal_reason}, NOW())
      ON CONFLICT (gpu_id, retailer) DO UPDATE SET
        current_price_usd = EXCLUDED.current_price_usd,
        rolling_30d_avg   = EXCLUDED.rolling_30d_avg,
        pct_below_avg     = EXCLUDED.pct_below_avg,
        msrp_delta_pct    = EXCLUDED.msrp_delta_pct,
        volatility_score  = EXCLUDED.volatility_score,
        is_deal           = EXCLUDED.is_deal,
        deal_reason       = EXCLUDED.deal_reason,
        computed_at       = NOW()
      RETURNING *
    `
        scores.push(inserted)
    }

    return scores
}

// ─── Weekly compression job (run nightly) ────────────────────────────────────

export async function compressPriceHistory(): Promise<void> {
    // Aggregate price_history older than 180 days into weekly averages
    await sql`
    INSERT INTO price_history_weekly (gpu_id, retailer, week_start, avg_price_usd, min_price_usd, max_price_usd, sample_count)
    SELECT
      gpu_id,
      retailer,
      DATE_TRUNC('week', recorded_at)::DATE AS week_start,
      AVG(price_usd)::NUMERIC(10,2),
      MIN(price_usd)::NUMERIC(10,2),
      MAX(price_usd)::NUMERIC(10,2),
      COUNT(*)::INT
    FROM price_history
    WHERE recorded_at < NOW() - INTERVAL '180 days'
    GROUP BY gpu_id, retailer, DATE_TRUNC('week', recorded_at)
    ON CONFLICT (gpu_id, retailer, week_start) DO NOTHING
  `

    // Delete raw records older than 180 days (TimescaleDB chunk drop is faster)
    await sql`
    SELECT drop_chunks('price_history', NOW() - INTERVAL '180 days')
  `
    console.log('[Compression] Weekly price history compressed')
}
