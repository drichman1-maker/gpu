import 'dotenv/config'
import * as Sentry from '@sentry/node'
import { createSchedulers, scheduleRecurringJobs } from './queue'

// Boot all workers by importing them
import './workers/ingest-worker'
import './workers/deal-worker'
import './workers/alert-worker'

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
})

async function main() {
    console.log('🚀 GPUWatch API Server starting...')

    createSchedulers()
    await scheduleRecurringJobs()

    console.log('✅ All workers active. Queues scheduled.')
    console.log('   → BestBuy:  every 4 hours')
    console.log('   → Amazon:   every 6 hours')
    console.log('   → Newegg:   every 8 hours')
    console.log('   → B&H Photo: every 8 hours')

    process.on('SIGTERM', async () => {
        console.log('[Shutdown] SIGTERM received, draining queues...')
        process.exit(0)
    })
}

main().catch((err) => {
    Sentry.captureException(err)
    console.error('[Boot] Fatal error:', err)
    process.exit(1)
})
