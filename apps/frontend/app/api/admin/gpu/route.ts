import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ error: 'Admin API — use unified agg-api-hub instead' }, { status: 501 })
}

export async function POST() {
    return NextResponse.json({ error: 'Admin API — use unified agg-api-hub instead' }, { status: 501 })
}
