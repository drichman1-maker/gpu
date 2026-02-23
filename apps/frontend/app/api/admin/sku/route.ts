import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@gpuwatch/infra'
import { z } from 'zod'

export async function POST(req: NextRequest) {
    if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const Schema = z.object({
        gpu_id: z.string().uuid(),
        retailer: z.string(),
        retailer_sku: z.string(),
        retailer_model_name: z.string().optional(),
        affiliate_url: z.string().optional(),
    })

    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const sql = getDB()
    const { gpu_id, retailer, retailer_sku, retailer_model_name, affiliate_url } = parsed.data

    // Auto-generate affiliate_url if not provided
    const [gpu] = await sql`SELECT slug FROM gpus WHERE id = ${gpu_id} LIMIT 1`
    const finalUrl = affiliate_url || `/out/${gpu?.slug ?? 'unknown'}/${retailer}`

    const [mapping] = await sql`
    INSERT INTO sku_mappings (gpu_id, retailer, retailer_sku, retailer_model_name, affiliate_url, active)
    VALUES (${gpu_id}, ${retailer}, ${retailer_sku}, ${retailer_model_name ?? null}, ${finalUrl}, TRUE)
    ON CONFLICT (retailer, retailer_sku) DO UPDATE SET
      gpu_id               = EXCLUDED.gpu_id,
      retailer_model_name  = EXCLUDED.retailer_model_name,
      affiliate_url        = EXCLUDED.affiliate_url,
      active               = TRUE
    RETURNING *
  `

    return NextResponse.json({ mapping }, { status: 201 })
}

function isAuthorized(req: NextRequest): boolean {
    const key = req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')
    return key === process.env.ADMIN_KEY
}
