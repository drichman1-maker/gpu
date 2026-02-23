import 'dotenv/config'
import { Worker } from 'bullmq'
import * as Sentry from '@sentry/node'
import { getRedis, getDB, BestBuyConnector, AmazonConnector, NeweggConnector, BHPhotoConnector } from '@gpuwatch/infra'
import { dealQueue, type IngestJobData } from '../queue'

// Initialize Sentry
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV })

const redis = getRedis()
const sql = getDB()

// ─── Connector factory ────────────────────────────────────────────────────────

function getConnector(source: string) {
    switch (source) {
        case 'bestbuy':
            return new BestBuyConnector(process.env.BESTBUY_API_KEY!)
        case 'amazon':
            return new AmazonConnector({
                accessKey: process.env.AMAZON_ACCESS_KEY!,
                secretKey: process.env.AMAZON_SECRET_KEY!,
                partnerTag: process.env.AMAZON_PARTNER_TAG!,
            })
        case 'newegg':
            return new NeweggConnector(process.env.APIFY_API_TOKEN ?? null)
        case 'bh_photo':
            return new BHPhotoConnector()
        default:
            throw new Error(`Unknown source: ${source}`)
    }
}

// ─── Main Ingestion Worker ────────────────────────────────────────────────────

const ingestWorker = new Worker<IngestJobData>(
    'ingest',
    async (job) => {
        const { type, source } = job.data
        const runStart = Date.now()
        console.log(`[Ingest] Starting ${source} (${type})`)

        // Load active GPUs
        const gpus = await sql`
      SELECT id, slug, model FROM gpus WHERE active = TRUE ORDER BY model
    `

        const targetGpus = type === 'single' && 'gpuId' in job.data
            ? gpus.filter(g => g.id === job.data.gpuId)
            : gpus

        const connector = getConnector(source)
        const result = await connector.fetchOffers(targetGpus)

        let upsertCount = 0

        for (const offer of result.offers) {
            try {
                // Upsert current offer
                await sql`
          INSERT INTO retailer_offers
            (gpu_id, retailer, sku, price_usd, regular_price_usd, sale_price_usd,
             stock_status, stock_quantity, affiliate_url, direct_url, last_checked_at)
          VALUES
            (${offer.gpu_id}, ${offer.retailer}, ${offer.sku}, ${offer.price_usd},
             ${offer.regular_price_usd}, ${offer.sale_price_usd}, ${offer.stock_status},
             ${offer.stock_quantity}, ${offer.affiliate_url}, ${offer.direct_url}, NOW())
          ON CONFLICT (gpu_id, retailer) DO UPDATE SET
            sku               = EXCLUDED.sku,
            price_usd         = EXCLUDED.price_usd,
            regular_price_usd = EXCLUDED.regular_price_usd,
            sale_price_usd    = EXCLUDED.sale_price_usd,
            stock_status      = EXCLUDED.stock_status,
            stock_quantity    = EXCLUDED.stock_quantity,
            affiliate_url     = EXCLUDED.affiliate_url,
            direct_url        = EXCLUDED.direct_url,
            last_checked_at   = NOW()
        `

                // Append to price history
                await sql`
          INSERT INTO price_history (gpu_id, retailer, price_usd, stock_status, recorded_at)
          VALUES (${offer.gpu_id}, ${offer.retailer}, ${offer.price_usd}, ${offer.stock_status}, NOW())
        `

                upsertCount++

                // Enqueue deal score recalculation
                await dealQueue.add(`deal-${offer.gpu_id}`, { gpuId: offer.gpu_id }, {
                    jobId: `deal-${offer.gpu_id}`,  // deduplicate
                    delay: 1000,
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                result.errors.push(`DB upsert error (${offer.gpu_id}/${offer.retailer}): ${msg}`)
                Sentry.captureException(err)
            }
        }

        // Log ingestion run
        await sql`
      INSERT INTO ingestion_runs (source, status, gpus_updated, errors, duration_ms)
      VALUES (
        ${source},
        ${result.errors.length === 0 ? 'success' : result.offers.length > 0 ? 'partial' : 'error'},
        ${upsertCount},
        ${JSON.stringify(result.errors)}::jsonb,
        ${Date.now() - runStart}
      )
    `

        // Alert Sentry if stale >6hrs for any GPU
        await checkStaleness()

        if (result.errors.length > 0) {
            console.warn(`[Ingest] ${source} completed with ${result.errors.length} errors:`, result.errors)
        }
        console.log(`[Ingest] ${source} done — ${upsertCount} upserted in ${Date.now() - runStart}ms`)
        return { upsertCount, errors: result.errors }
    },
    { connection: redis, concurrency: 1 }
)

async function checkStaleness() {
    const stale = await sql`
    SELECT gpu_id, retailer, last_checked_at
    FROM retailer_offers
    WHERE last_checked_at < NOW() - INTERVAL '6 hours'
    LIMIT 10
  `
    if (stale.length > 0) {
        Sentry.captureMessage(
            `Stale data detected: ${stale.length} offers not updated in >6hrs`,
            'warning'
        )
    }
}

ingestWorker.on('failed', (job, err) => {
    console.error(`[Ingest] Job ${job?.id} failed:`, err.message)
    Sentry.captureException(err, { tags: { job: job?.id } })
})

console.log('[Ingest Worker] Listening...')
