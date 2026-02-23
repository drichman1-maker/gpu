import { Queue, Worker, QueueScheduler } from 'bullmq'
import { getRedis } from '@gpuwatch/infra'
import type { GPU } from '@gpuwatch/domain'

// ─── Queue Definitions ────────────────────────────────────────────────────────

export type IngestJobData =
    | { type: 'full'; source: 'bestbuy' | 'amazon' | 'newegg' | 'bh_photo' }
    | { type: 'single'; source: string; gpuId: string }

export type DealJobData = { gpuId: string }

export type AlertJobData = {
    gpuId: string
    gpuSlug: string
    gpuModel: string
    newPrice: number
    retailer: string
}

const connection = getRedis()

// Price ingestion queue — run every 4 hours for BestBuy
export const ingestQueue = new Queue<IngestJobData>('ingest', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
})

// Deal computation queue — runs after each ingest batch
export const dealQueue = new Queue<DealJobData>('deal-scores', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: { type: 'fixed', delay: 2000 },
    },
})

// Alert queue — triggered when price drops / stock available
export const alertQueue = new Queue<AlertJobData>('alerts', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
    },
})

// ─── Schedulers (required for delayed/repeatable jobs) ───────────────────────

export function createSchedulers() {
    new QueueScheduler('ingest', { connection })
    new QueueScheduler('deal-scores', { connection })
    new QueueScheduler('alerts', { connection })
}

// ─── Schedule recurring jobs ──────────────────────────────────────────────────

export async function scheduleRecurringJobs() {
    // BestBuy: every 4 hours (well within 50k/day limit)
    await ingestQueue.add(
        'bestbuy-full',
        { type: 'full', source: 'bestbuy' },
        { repeat: { every: 4 * 60 * 60 * 1000 } }
    )

    // Amazon: every 6 hours (rate limited 1 req/sec)
    await ingestQueue.add(
        'amazon-full',
        { type: 'full', source: 'amazon' },
        { repeat: { every: 6 * 60 * 60 * 1000 } }
    )

    // Scrapers: every 8 hours (polite)
    await ingestQueue.add(
        'newegg-full',
        { type: 'full', source: 'newegg' },
        { repeat: { every: 8 * 60 * 60 * 1000 } }
    )

    await ingestQueue.add(
        'bh-photo-full',
        { type: 'full', source: 'bh_photo' },
        { repeat: { every: 8 * 60 * 60 * 1000 } }
    )

    console.log('[Scheduler] Recurring jobs registered')
}
