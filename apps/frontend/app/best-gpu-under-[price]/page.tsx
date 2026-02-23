import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDB, cacheGet, cacheSet, CACHE_TTL } from '@gpuwatch/infra'
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'
import { PRICE_TIERS } from '@gpuwatch/domain'
import Link from 'next/link'

export const revalidate = 300 // 5 min for SEO pages

// Build every /best-gpu-under-[price] at build time
export function generateStaticParams() {
    return PRICE_TIERS.map(price => ({ price: String(price) }))
}

export async function generateMetadata(
    { params }: { params: { price: string } }
): Promise<Metadata> {
    const price = Number(params.price)
    return {
        title: `Best GPU Under $${price} in 2026 — Price Tracker`,
        description: `Find the best graphics cards under $${price} right now. Compare prices, deal scores, and availability across Best Buy, Amazon, and Newegg. Updated daily.`,
        openGraph: {
            title: `Best GPU Under $${price} — GPUWatch`,
        },
    }
}

async function getGPUsUnder(maxPrice: number) {
    const cacheKey = `seo:best-under-${maxPrice}`
    const cached = await cacheGet<{ gpu: GPU; offer: RetailerOffer; deal: DealScore | null }[]>(cacheKey)
    if (cached) return cached

    const sql = getDB()
    const rows = await sql<Array<{
        id: string; slug: string; model: string; brand: string; architecture: string;
        generation: string; vram_gb: number; msrp_usd: number; active: boolean;
        created_at: string; updated_at: string; tdp_watts: number | null; release_date: string | null;
        offer_id: string; retailer: string; price_usd: number; stock_status: string;
        affiliate_url: string; regular_price_usd: number | null; direct_url: string;
        last_checked_at: string; is_deal: boolean | null; pct_below_avg: number | null;
        deal_reason: string | null; volatility_score: number | null;
    }>>`
    SELECT
      g.*,
      ro.id          AS offer_id,
      ro.retailer,
      ro.price_usd,
      ro.stock_status,
      ro.affiliate_url,
      ro.regular_price_usd,
      ro.direct_url,
      ro.last_checked_at,
      ds.is_deal,
      ds.pct_below_avg,
      ds.deal_reason,
      ds.volatility_score
    FROM (
      SELECT gpu_id, MIN(price_usd) AS min_p
      FROM retailer_offers
      WHERE price_usd <= ${maxPrice}
      GROUP BY gpu_id
    ) best
    JOIN retailer_offers ro ON ro.gpu_id = best.gpu_id AND ro.price_usd = best.min_p
    JOIN gpus g ON g.id = ro.gpu_id AND g.active = TRUE
    LEFT JOIN deal_scores ds ON ds.gpu_id = ro.gpu_id AND ds.retailer = ro.retailer
    ORDER BY ds.pct_below_avg DESC NULLS LAST, ro.price_usd ASC
    LIMIT 20
  `

    const result = rows.map(row => ({
        gpu: {
            id: row.id, slug: row.slug, model: row.model, brand: row.brand as 'nvidia' | 'amd',
            architecture: row.architecture as any, generation: row.generation as any,
            vram_gb: row.vram_gb, tdp_watts: row.tdp_watts, msrp_usd: row.msrp_usd,
            release_date: row.release_date, active: row.active,
            created_at: row.created_at, updated_at: row.updated_at,
        },
        offer: {
            id: row.offer_id, gpu_id: row.id, retailer: row.retailer as any,
            sku: '', price_usd: row.price_usd, regular_price_usd: row.regular_price_usd,
            sale_price_usd: null, stock_status: row.stock_status as any, stock_quantity: null,
            affiliate_url: row.affiliate_url, direct_url: row.direct_url,
            last_checked_at: row.last_checked_at, created_at: row.created_at,
        },
        deal: row.is_deal ? {
            id: '', gpu_id: row.id, retailer: row.retailer as any,
            current_price_usd: row.price_usd, rolling_30d_avg_usd: 0, msrp_usd: row.msrp_usd,
            pct_below_avg: row.pct_below_avg ?? 0, msrp_delta_pct: 0,
            volatility_score: row.volatility_score ?? 0, is_deal: true,
            deal_reason: row.deal_reason, computed_at: '',
        } : null,
    }))

    await cacheSet(cacheKey, result, CACHE_TTL.GPU_LIST)
    return result
}

const RETAILER_LABELS: Record<string, string> = {
    bestbuy: 'Best Buy', amazon: 'Amazon', newegg: 'Newegg', bh_photo: 'B&H Photo',
}

export default async function BestGPUUnderPage({ params }: { params: { price: string } }) {
    const maxPrice = Number(params.price)
    if (!PRICE_TIERS.includes(maxPrice as any)) return notFound()

    const gpus = await getGPUsUnder(maxPrice)

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Best GPUs Under $${maxPrice}`,
        itemListElement: gpus.map(({ gpu, offer }, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': 'Product',
                name: gpu.model,
                offers: {
                    '@type': 'Offer',
                    price: offer.price_usd.toFixed(2),
                    priceCurrency: 'USD',
                },
            },
        })),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
                <div style={{ marginBottom: 8 }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Home</Link>
                    <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>/</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Best GPU Under ${maxPrice}</span>
                </div>

                <h1 style={{ marginBottom: 8 }}>Best GPU Under ${maxPrice}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 40, maxWidth: 600 }}>
                    The cheapest GPUs available right now under ${maxPrice}, ranked by deal score and value.
                    Prices updated every 4–8 hours from major retailers.
                </p>

                {gpus.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                        <p style={{ color: 'var(--text-muted)' }}>No GPUs found under ${maxPrice} right now. Check back soon.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {gpus.map(({ gpu, offer, deal }, i) => (
                            <div key={gpu.id} className="card card--hover" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)', minWidth: 40 }}>
                                    #{i + 1}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                        {deal && <span className="badge badge--green" style={{ fontSize: 10 }}>🔥 Deal</span>}
                                        <span className="badge badge--blue" style={{ fontSize: 10 }}>{gpu.architecture}</span>
                                        <span className="badge badge--blue" style={{ fontSize: 10 }}>{gpu.vram_gb}GB VRAM</span>
                                    </div>
                                    <Link href={`/gpu/${gpu.slug}`} style={{ fontWeight: 700, fontSize: 16 }}>
                                        {gpu.model}
                                    </Link>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {RETAILER_LABELS[offer.retailer] ?? offer.retailer} ·{' '}
                                        MSRP ${gpu.msrp_usd.toFixed(0)}
                                        {deal?.deal_reason && ` · ${deal.deal_reason}`}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div className="price price--md" style={{ color: deal ? 'var(--green)' : 'var(--text-primary)' }}>
                                        ${offer.price_usd.toFixed(2)}
                                    </div>
                                    <span className={`badge badge--${offer.stock_status === 'in_stock' ? 'green' : 'red'}`} style={{ fontSize: 10 }}>
                                        {offer.stock_status === 'in_stock' ? 'In Stock' : 'OOS'}
                                    </span>
                                </div>

                                <a
                                    href={`/out/${gpu.slug}/${offer.retailer}`}
                                    className="btn btn--primary"
                                    style={{ whiteSpace: 'nowrap', fontSize: 13 }}
                                >
                                    Buy Now →
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {/* Cross-navigation to adjacent price tiers */}
                <div style={{ marginTop: 48, padding: '24px 0', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: 16, fontSize: 15 }}>Browse Other Budgets</h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {PRICE_TIERS.map(tier => (
                            <Link
                                key={tier}
                                href={`/best-gpu-under-${tier}`}
                                className={`btn ${tier === maxPrice ? 'btn--primary' : 'btn--outline'}`}
                                style={{ fontSize: 13, padding: '7px 14px' }}
                            >
                                Under ${tier}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
