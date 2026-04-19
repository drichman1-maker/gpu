import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'
import { PRICE_TIERS } from '@gpuwatch/domain'
import Link from 'next/link'
import { fetchAllGPUs } from '../../lib/api'

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
    const all = await fetchAllGPUs()
    return all
        .filter(g => g.lowestPrice !== null && g.lowestPrice <= maxPrice)
        .sort((a, b) => {
            const dealDiff = (b.dealScore?.pct_below_avg ?? 0) - (a.dealScore?.pct_below_avg ?? 0)
            if (dealDiff !== 0) return dealDiff
            return (a.lowestPrice ?? 0) - (b.lowestPrice ?? 0)
        })
        .slice(0, 20)
        .map(g => ({
            gpu: g.gpu,
            offer: g.bestOffer!,
            deal: g.dealScore,
        }))
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
