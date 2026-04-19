import type { Metadata } from 'next'
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'
import Link from 'next/link'
import { fetchDeals } from '../../lib/api'

export const metadata: Metadata = {
    title: 'GPU Price Drops Today — Real-Time Deal Tracker',
    description: 'GPU price drops happening right now. All GPUs at or below 30-day average prices across Best Buy, Amazon, Newegg. Updated hourly.',
}

export const revalidate = 300

async function getTodaysDrops() {
    const deals = await fetchDeals(50)
    const result = deals
        .filter(g => g.bestOffer !== null && g.dealScore !== null)
        .map(g => ({
            gpu: g.gpu,
            offer: g.bestOffer!,
            deal: g.dealScore!,
        }))

    return result
}

const RETAILER_LABELS: Record<string, string> = {
    bestbuy: 'Best Buy', amazon: 'Amazon', newegg: 'Newegg', bh_photo: 'B&H Photo',
}

export default async function PriceDropsTodayPage() {
    const drops = await getTodaysDrops()
    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    return (
        <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ marginBottom: 8 }}>GPU Price Drops — {now}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    {drops.length} active deals detected across all tracked GPUs.
                    Updated every 4 hours from Best Buy, Amazon, and Newegg.
                </p>
            </div>

            {drops.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                    <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>No deals detected in the last 6 hours</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Prices are currently stable or above average. Check back after the next ingest cycle.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {drops.map(({ gpu, offer, deal }) => (
                        <div key={`${gpu.id}-${offer.retailer}`} className="card card--hover">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                {/* Rank indicator */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', background: 'var(--green-dim)',
                                    color: 'var(--green)', fontWeight: 800, fontFamily: 'var(--font-mono)',
                                    fontSize: 15, flexShrink: 0,
                                }}>
                                    -{deal.pct_below_avg.toFixed(0)}%
                                </div>

                                {/* GPU info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span className="badge badge--green" style={{ fontSize: 10 }}>🔥 Deal</span>
                                        <span className="badge badge--blue" style={{ fontSize: 10 }}>{gpu.vram_gb}GB VRAM</span>
                                    </div>
                                    <Link href={`/gpu/${gpu.slug}`} style={{ fontWeight: 700, fontSize: 15 }}>
                                        {gpu.model}
                                    </Link>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {RETAILER_LABELS[offer.retailer] ?? offer.retailer} ·{' '}
                                        {deal.deal_reason ?? `${deal.pct_below_avg.toFixed(1)}% below 30d average`}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div style={{ textAlign: 'right' }}>
                                    <div className="price price--md" style={{ color: 'var(--green)' }}>
                                        ${offer.price_usd.toFixed(2)}
                                    </div>
                                    {deal.rolling_30d_avg_usd > 0 && (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                            avg ${deal.rolling_30d_avg_usd.toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* Stock + CTA */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                    <span className={`badge badge--${offer.stock_status === 'in_stock' ? 'green' : offer.stock_status === 'limited' ? 'yellow' : 'red'}`} style={{ fontSize: 10 }}>
                                        <span className={`stock-dot stock-dot--${offer.stock_status}`} />
                                        {offer.stock_status === 'in_stock' ? 'In Stock' : offer.stock_status === 'limited' ? 'Limited' : 'OOS'}
                                    </span>
                                    <a href={`/out/${gpu.slug}/${offer.retailer}`} className="btn btn--primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                                        Buy →
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
