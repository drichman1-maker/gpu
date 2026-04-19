-- Migration: Add benchmark_score and recommended_psu to gpus table
-- Run: sqlite3 gpu-drip.db < migrations/001_add_benchmark_psu.sql

-- Add columns if they don't exist
ALTER TABLE gpus ADD COLUMN benchmark_score INT;
ALTER TABLE gpus ADD COLUMN recommended_psu INT;

-- Backfill with synthetic composite scores and PSU recommendations
-- NVIDIA Blackwell (RTX 5000)
UPDATE gpus SET benchmark_score = 35200, recommended_psu = 1000 WHERE slug = 'rtx-5090';
UPDATE gpus SET benchmark_score = 26800, recommended_psu = 850 WHERE slug = 'rtx-5080';
UPDATE gpus SET benchmark_score = 22400, recommended_psu = 750 WHERE slug = 'rtx-5070-ti';
UPDATE gpus SET benchmark_score = 18900, recommended_psu = 650 WHERE slug = 'rtx-5070';
UPDATE gpus SET benchmark_score = 15600, recommended_psu = 600 WHERE slug = 'rtx-5060-ti';
UPDATE gpus SET benchmark_score = 12800, recommended_psu = 550 WHERE slug = 'rtx-5060';

-- NVIDIA Ada Lovelace (RTX 4000)
UPDATE gpus SET benchmark_score = 32100, recommended_psu = 850 WHERE slug = 'rtx-4090';
UPDATE gpus SET benchmark_score = 24900, recommended_psu = 750 WHERE slug = 'rtx-4080-super';
UPDATE gpus SET benchmark_score = 23700, recommended_psu = 750 WHERE slug = 'rtx-4080';
UPDATE gpus SET benchmark_score = 21700, recommended_psu = 700 WHERE slug = 'rtx-4070-ti-super';
UPDATE gpus SET benchmark_score = 20400, recommended_psu = 700 WHERE slug = 'rtx-4070-ti';
UPDATE gpus SET benchmark_score = 18900, recommended_psu = 650 WHERE slug = 'rtx-4070-super';
UPDATE gpus SET benchmark_score = 17500, recommended_psu = 650 WHERE slug = 'rtx-4070';
UPDATE gpus SET benchmark_score = 14200, recommended_psu = 550 WHERE slug = 'rtx-4060-ti';
UPDATE gpus SET benchmark_score = 11300, recommended_psu = 500 WHERE slug = 'rtx-4060';

-- AMD RDNA 4 (RX 9000)
UPDATE gpus SET benchmark_score = 24100, recommended_psu = 750 WHERE slug = 'rx-9070-xt';
UPDATE gpus SET benchmark_score = 20400, recommended_psu = 650 WHERE slug = 'rx-9070';
UPDATE gpus SET benchmark_score = 14600, recommended_psu = 550 WHERE slug = 'rx-9060-xt';

-- AMD RDNA 3 (RX 7000)
UPDATE gpus SET benchmark_score = 23500, recommended_psu = 850 WHERE slug = 'rx-7900-xtx';
UPDATE gpus SET benchmark_score = 20900, recommended_psu = 750 WHERE slug = 'rx-7900-xt';
UPDATE gpus SET benchmark_score = 16400, recommended_psu = 650 WHERE slug = 'rx-7800-xt';
UPDATE gpus SET benchmark_score = 14200, recommended_psu = 600 WHERE slug = 'rx-7700-xt';
UPDATE gpus SET benchmark_score = 10800, recommended_psu = 500 WHERE slug = 'rx-7600';

-- NVIDIA Ampere (RTX 3000)
UPDATE gpus SET benchmark_score = 24000, recommended_psu = 850 WHERE slug = 'rtx-3090';
UPDATE gpus SET benchmark_score = 21500, recommended_psu = 850 WHERE slug = 'rtx-3080-ti';
UPDATE gpus SET benchmark_score = 19500, recommended_psu = 750 WHERE slug = 'rtx-3080';
UPDATE gpus SET benchmark_score = 17000, recommended_psu = 700 WHERE slug = 'rtx-3070-ti';
UPDATE gpus SET benchmark_score = 15500, recommended_psu = 650 WHERE slug = 'rtx-3070';
UPDATE gpus SET benchmark_score = 13500, recommended_psu = 600 WHERE slug = 'rtx-3060-ti';
UPDATE gpus SET benchmark_score = 10500, recommended_psu = 550 WHERE slug = 'rtx-3060';

-- AMD RDNA 2 (RX 6000)
UPDATE gpus SET benchmark_score = 19500, recommended_psu = 750 WHERE slug = 'rx-6950-xt';
UPDATE gpus SET benchmark_score = 18500, recommended_psu = 750 WHERE slug = 'rx-6900-xt';
UPDATE gpus SET benchmark_score = 17500, recommended_psu = 750 WHERE slug = 'rx-6800-xt';
UPDATE gpus SET benchmark_score = 16000, recommended_psu = 650 WHERE slug = 'rx-6800';
UPDATE gpus SET benchmark_score = 13000, recommended_psu = 650 WHERE slug = 'rx-6700-xt';
UPDATE gpus SET benchmark_score = 11500, recommended_psu = 550 WHERE slug = 'rx-6600-xt';
UPDATE gpus SET benchmark_score = 10000, recommended_psu = 500 WHERE slug = 'rx-6600';

-- Intel Arc (Alchemist)
UPDATE gpus SET benchmark_score = 14000, recommended_psu = 650 WHERE slug = 'arc-a770';
UPDATE gpus SET benchmark_score = 13000, recommended_psu = 650 WHERE slug = 'arc-a750';
