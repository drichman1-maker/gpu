import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@gpuwatch/infra'

function isAuthorized(req: NextRequest): boolean {
    const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
    return key === process.env.ADMIN_KEY
}

export async function GET(req: NextRequest) {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sql = getDB()

    // Get all retailer offers with their direct URLs
    const offers = await sql`
    SELECT g.slug, g.model, ro.retailer, ro.direct_url, ro.affiliate_url, ro.last_checked_at
    FROM retailer_offers ro
    JOIN gpus g ON g.id = ro.gpu_id
    WHERE g.active = TRUE
    ORDER BY g.model, ro.retailer
  `

    // Check each URL with a HEAD request (non-blocking, fast)
    const results = await Promise.allSettled(
        (offers as any[]).map(async (offer: any) => {
            const startMs = Date.now()
            try {
                const res = await fetch(offer.directUrl, {
                    method: 'HEAD',
                    redirect: 'follow',
                    signal: AbortSignal.timeout(8_000),
                    headers: { 'User-Agent': 'GPUWatch-LinkValidator/1.0' },
                })
                return {
                    gpu: offer.model,
                    retailer: offer.retailer,
                    url: offer.directUrl,
                    status: res.ok ? 'ok' as const : 'error' as const,
                    httpStatus: res.status,
                    latencyMs: Date.now() - startMs,
                }
            } catch (err) {
                return {
                    gpu: offer.model,
                    retailer: offer.retailer,
                    url: offer.directUrl,
                    status: 'error' as const,
                    httpStatus: 0,
                    latencyMs: Date.now() - startMs,
                    error: err instanceof Error ? err.message : 'Unknown error',
                }
            }
        })
    )

    const validationResults = results.map(r =>
        r.status === 'fulfilled' ? r.value : { gpu: '?', retailer: '?', url: '?', status: 'error' as const, httpStatus: 0, latencyMs: 0 }
    )

    const summary = {
        total: validationResults.length,
        ok: validationResults.filter(r => r.status === 'ok').length,
        errors: validationResults.filter(r => r.status === 'error').length,
    }

    return NextResponse.json({ summary, results: validationResults })
}
