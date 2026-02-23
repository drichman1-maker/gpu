import Redis from 'ioredis'

let _client: Redis | null = null

export function getRedis(): Redis {
    if (_client) return _client

    const url = process.env.REDIS_URL
    if (url) {
        _client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true })
    } else {
        _client = new Redis({
            host: process.env.REDIS_HOST ?? '127.0.0.1',
            port: Number(process.env.REDIS_PORT ?? 6379),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        })
    }

    _client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message)
    })

    return _client
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
    const redis = getRedis()
    const raw = await redis.get(key)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const redis = getRedis()
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function cacheDel(key: string): Promise<void> {
    const redis = getRedis()
    await redis.del(key)
}

// Price queries: 30s TTL as per spec
export const CACHE_TTL = {
    PRICE_QUERY: 30,       // 30s for price data
    GPU_LIST: 300,         // 5min for GPU list
    CHART_DATA: 900,       // 15min for chart data
    DEAL_SCORES: 120,      // 2min for deal scores
}
