import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@gpuwatch/infra'
import { z } from 'zod'

const AddGPUSchema = z.object({
    model: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    brand: z.enum(['nvidia', 'amd']),
    architecture: z.string().min(1),
    generation: z.string().min(1),
    vram_gb: z.number().int().positive(),
    tdp_watts: z.number().int().positive().optional(),
    msrp_usd: z.number().positive(),
    release_date: z.string().optional(),
})

function isAuthorized(req: NextRequest): boolean {
    const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
    return key === process.env.ADMIN_KEY
}

export async function GET() {
    const sql = getDB()
    const gpus = await sql`SELECT * FROM gpus ORDER BY msrp_usd ASC`
    return NextResponse.json({ gpus })
}

export async function POST(req: NextRequest) {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = AddGPUSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const sql = getDB()
    const { model, slug, brand, architecture, generation, vram_gb, tdp_watts, msrp_usd, release_date } = parsed.data

    const [gpu] = await sql`
    INSERT INTO gpus (model, slug, brand, architecture, generation, vram_gb, tdp_watts, msrp_usd, release_date, active)
    VALUES (${model}, ${slug}, ${brand}, ${architecture}, ${generation}, ${vram_gb}, ${tdp_watts ?? null}, ${msrp_usd}, ${release_date ?? null}, TRUE)
    RETURNING *
  `

    return NextResponse.json({ gpu }, { status: 201 })
}
