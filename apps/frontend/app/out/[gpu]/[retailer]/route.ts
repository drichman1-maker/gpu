import { redirect } from 'next/navigation'
import { getDB } from '@gpuwatch/infra'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { gpu: string; retailer: string } }
) {
  const { gpu: gpuSlug, retailer } = params
  const sql = getDB()

  // Log the outbound click
  try {
    const [gpuRow] = await sql`SELECT id FROM gpus WHERE slug = ${gpuSlug} AND active = TRUE LIMIT 1`
    if (gpuRow) {
      await sql`
        INSERT INTO outbound_clicks (gpu_id, retailer, ref_url, user_agent, clicked_at)
        VALUES (
          ${gpuRow.id},
          ${retailer},
          ${request.headers.get('referer') ?? null},
          ${request.headers.get('user-agent') ?? null},
          NOW()
        )
      `
    }
  } catch {
    // Non-blocking — don't fail redirect on tracking error
  }

  // Get the direct retailer URL
  const [offer] = await sql`
    SELECT ro.direct_url
    FROM retailer_offers ro
    JOIN gpus g ON g.id = ro.gpu_id
    WHERE g.slug = ${gpuSlug} AND ro.retailer = ${retailer}
    LIMIT 1
  `

  if (offer?.direct_url) {
    redirect(offer.direct_url)
  }

  // Fallback: redirect to GPU page
  redirect(`/gpu/${gpuSlug}`)
}
