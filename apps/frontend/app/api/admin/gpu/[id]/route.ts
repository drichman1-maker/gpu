import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@gpuwatch/infra'

function isAuthorized(req: NextRequest): boolean {
    const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
    return key === process.env.ADMIN_KEY
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const sql = getDB()

    const [gpu] = await sql`
    UPDATE gpus
    SET active = ${body.active}, updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `
    if (!gpu) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ gpu })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sql = getDB()
    // Soft-delete only (set active = false), never hard-delete to preserve price history
    await sql`UPDATE gpus SET active = FALSE, updated_at = NOW() WHERE id = ${params.id}`
    return NextResponse.json({ ok: true })
}
