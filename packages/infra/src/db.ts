import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | null = null

export function getDB() {
    if (_sql) return _sql
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    _sql = postgres(url, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    })
    return _sql
}

// Typed query helper
export type SQL = ReturnType<typeof getDB>
