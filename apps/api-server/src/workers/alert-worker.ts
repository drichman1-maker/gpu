import 'dotenv/config'
import { Worker } from 'bullmq'
import { getRedis, getDB } from '@gpuwatch/infra'
import { sendPriceAlert, type PriceAlertPayload } from '@gpuwatch/notif'
import type { AlertJobData } from '../queue'

const redis = getRedis()
const sql = getDB()

const alertWorker = new Worker<AlertJobData>(
    'alerts',
    async (job) => {
        const { gpuId, gpuSlug, gpuModel, newPrice, retailer } = job.data

        // Get deal reason for this GPU/retailer
        const [dealScore] = await sql`
      SELECT deal_reason, affiliate_url, current_price_usd
      FROM deal_scores ds
      JOIN retailer_offers ro ON ro.gpu_id = ds.gpu_id AND ro.retailer = ds.retailer
      WHERE ds.gpu_id = ${gpuId} AND ds.retailer = ${retailer}
      LIMIT 1
    `

        // Get all watchers who haven't been notified recently
        const watches = await sql`
      SELECT email, target_price_usd
      FROM gpu_watches
      WHERE gpu_id = ${gpuId}
        AND (last_notified_at IS NULL OR last_notified_at < NOW() - INTERVAL '4 hours')
        AND (target_price_usd IS NULL OR ${newPrice} <= target_price_usd)
    `

        let sent = 0
        for (const watch of watches) {
            try {
                const payload: PriceAlertPayload = {
                    toEmail: watch.email,
                    gpuModel,
                    gpuSlug,
                    newPrice,
                    targetPrice: watch.targetPriceUsd ? Number(watch.targetPriceUsd) : null,
                    retailer,
                    dealReason: dealScore?.dealReason ?? null,
                    affiliateUrl: dealScore?.affiliateUrl ?? `/out/${gpuSlug}/${retailer}`,
                }
                await sendPriceAlert(payload)
                sent++
            } catch (err) {
                console.error(`[Alert] Failed to send to ${watch.email}:`, err)
            }
        }

        console.log(`[Alert] ${gpuModel} @ $${newPrice} — sent ${sent} alerts`)
        return { sent }
    },
    { connection: redis, concurrency: 3 }
)

alertWorker.on('failed', (job, err) => {
    console.error(`[Alert Worker] Job ${job?.id} failed:`, err.message)
})

console.log('[Alert Worker] Listening...')
