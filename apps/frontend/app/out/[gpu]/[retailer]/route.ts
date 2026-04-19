import { redirect } from 'next/navigation'
import { fetchGPU } from '../../../../lib/api'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { gpu: string; retailer: string } }
) {
  const { gpu: gpuSlug, retailer } = params

  try {
    const data = await fetchGPU(gpuSlug)
    const offer = data?.offers.find(o => o.retailer === retailer)
    if (offer?.direct_url) {
      redirect(offer.direct_url)
    }
  } catch {
    // fall through to GPU page
  }

  redirect(`/gpu/${gpuSlug}`)
}
