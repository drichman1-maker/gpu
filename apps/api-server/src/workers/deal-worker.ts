import 'dotenv/config'
import { Worker } from 'bullmq'
import { getRedis, getDB } from '@gpuwatch/infra'
import { computeDealScore } from '../services/deal-detector'
import { alertQueue, type DealJobData } from '../queue'

const redis = getRedis()
const sql = getDB()

const dealWorker = new Worker<DealJobData>(
    'deal-scores',
    async (job) => {
        const { gpuId } = job.data
        const scores = await computeDealScore(gpuId)

        // Trigger alerts for qualifying watches
        for (const score of scores) {
            if (!score.is_deal) continue

            const watches = await sql`
        SELECT w.*, g.slug AS gpu_slug, g.model AS gpu_model
        FROM gpu_watches w
        JOIN gpus g ON g.id = w.gpu_id
        WHERE w.gpu_id = ${gpuId}
          AND (
            (w.target_price_usd IS NOT NULL AND ${score.current_price_usd} <= w.target_price_usd)
            OR
            (w.notify_in_stock = TRUE AND ${score.current_price_usd} > 0)
          )
          AND (w.last_notified_at IS NULL OR w.last_notified_at < NOW() - INTERVAL '4 hours')
      `

            for (const watch of watches) {
                await alertQueue.add(`alert-${watch.id}`, {
                    gpuId,
                    gpuSlug: watch.gpuSlug,
                    gpuModel: watch.gpuModel,
                    newPrice: score.current_price_usd,
                    retailer: score.retailer,
                })

                // Update last_notified_at to prevent spam
                await sql`
          UPDATE gpu_watches SET last_notified_at = NOW() WHERE id = ${watch.id}
        `
            }
        }

        return { scored: scores.length, deals: scores.filter(s => s.is_deal).length }
    },
    { connection: redis, concurrency: 5 }
)

dealWorker.on('failed', (job, err) => {
    console.error(`[Deal Worker] Job ${job?.id} failed:`, err.message)
})

console.log('[Deal Worker] Listening...')
