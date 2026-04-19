import type { Metadata } from 'next'
import Link from 'next/link'
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'
import { fetchAllGPUs, fetchDeals, fetchRefurbGPUs } from '../lib/api'

export const metadata: Metadata = {
    title: 'GPU Price Tracker — Live Prices, Deals & Stock Alerts',
    description: 'Track RTX 5090, RTX 5080, RX 9070 XT prices in real time. See deals, stock availability, and price history across Best Buy, Amazon, Newegg and more.',
}

export const revalidate = 60

type DealGPU = {
    gpu: GPU
    bestOffer: RetailerOffer
    dealScore: DealScore | null
}

async function getHomepageData(): Promise<{
    deals: DealGPU[]
    allGPUs: (GPU & { lowestPrice: number | null; bestRetailer: string | null })[]
    topRefurbs: { name: string; slug: string; price: number; msrp: number; savings: number; retailer: string }[]
}> {
    const [dealData, allData, refurbData] = await Promise.all([fetchDeals(8), fetchAllGPUs(), fetchRefurbGPUs()])

    const deals: DealGPU[] = dealData
        .filter(g => g.bestOffer !== null)
        .map(g => ({
            gpu: g.gpu,
            bestOffer: g.bestOffer!,
            dealScore: g.dealScore,
        }))

    const allGPUs = allData.map(g => ({
        ...g.gpu,
        lowestPrice: g.lowestPrice,
        bestRetailer: g.bestRetailer,
    }))

    const topRefurbs = refurbData
        .filter(g => g.bestOffer?.stock_status === 'in_stock' && g.gpu.msrp_usd > 0)
        .map(g => ({
            name: g.gpu.model,
            slug: g.gpu.slug,
            price: g.bestOffer!.price_usd,
            msrp: g.gpu.msrp_usd,
            savings: Math.round(((g.gpu.msrp_usd - g.bestOffer!.price_usd) / g.gpu.msrp_usd) * 100),
            retailer: g.bestOffer!.retailer,
        }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 4)

    return { deals, allGPUs, topRefurbs }
}

const RETAILER_LABELS: Record<string, string> = {
    bestbuy: 'Best Buy', amazon: 'Amazon', newegg: 'Newegg', bh: 'B&H Photo',
    adorama: 'Adorama', ebay: 'eBay', microcenter: 'Micro Center',
}

export default async function HomePage() {
    const { deals, allGPUs, topRefurbs } = await getHomepageData()

    return (
        <div>
            {/* Hero */}
            <section style={{ padding: '60px 0 40px', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ maxWidth: 620 }}>
                        <div className="badge badge--blue" style={{ marginBottom: 16 }}>
                            ⚡ Live Price Intelligence
                        </div>
                        <h1 style={{ marginBottom: 16 }}>
                            Find the best GPU price.<br />
                            <span style={{ color: 'var(--blue)' }}>Before anyone else.</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.6, marginBottom: 28 }}>
                            Real-time price tracking across Best Buy, Amazon, Newegg and more.
                            Instant alerts when deals drop. 180-day price history.
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <Link href="/gpu" className="btn btn--primary" style={{ fontSize: 15, padding: '11px 22px' }}>
                                Browse All GPUs →
                            </Link>
                            <Link href="/alerts" className="btn btn--outline" style={{ fontSize: 15, padding: '11px 22px' }}>
                                🔔 Set Price Alert
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            <section style={{ borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                        {[
                            { label: 'GPUs Tracked', value: allGPUs.length.toString() },
                            { label: 'Active Deals', value: deals.length.toString() },
                            { label: 'Retailers', value: '4' },
                            { label: 'Last Updated', value: 'Live' },
                        ].map(({ label, value }) => (
                            <div key={label} className="stat">
                                <div className="stat__label">{label}</div>
                                <div className="stat__value" style={{ fontSize: '1.2rem' }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Current Deals */}
            {deals.length > 0 && (
                <section style={{ padding: '48px 0' }}>
                    <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                            <h2>🔥 Current Deals</h2>
                            <Link href="/gpu-price-drops-today" style={{ color: 'var(--blue)', fontSize: 14 }}>
                                View all drops →
                            </Link>
                        </div>
                        <div className="grid-auto">
                            {deals.map(({ gpu, bestOffer, dealScore }) => (
                                <Link
                                    key={gpu.id}
                                    href={`/gpu/${gpu.slug}`}
                                    className="card card--hover deal-card"
                                    style={{ display: 'block' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>
                                                {gpu.brand.toUpperCase()} · {gpu.vram_gb}GB
                                            </div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{gpu.model}</h3>
                                        </div>
                                        {dealScore && dealScore.pct_below_avg > 1 && (
                                            <span className="badge badge--green" style={{ fontSize: 10 }}>
                                                🔥 {dealScore.pct_below_avg.toFixed(1)}% off avg
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span className="price price--lg" style={{ color: 'var(--green)' }}>
                                            ${bestOffer.price_usd.toFixed(2)}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            MSRP ${gpu.msrp_usd.toFixed(0)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {RETAILER_LABELS[bestOffer.retailer] ?? bestOffer.retailer}
                                        </span>
                                        <span className={`badge badge--${bestOffer.stock_status === 'in_stock' ? 'green' : bestOffer.stock_status === 'limited' ? 'yellow' : 'red'}`} style={{ fontSize: 10 }}>
                                            <span className={`stock-dot stock-dot--${bestOffer.stock_status}`} />
                                            {bestOffer.stock_status === 'in_stock' ? 'In Stock' : bestOffer.stock_status === 'limited' ? 'Limited' : 'OOS'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Refurb Spotlight */}
            {topRefurbs.length > 0 && (
                <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
                    <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2>♻️ Refurb Deals</h2>
                            <Link href="/gpu/refurb" style={{ color: 'var(--blue)', fontSize: 14 }}>
                                View all refurbs →
                            </Link>
                        </div>
                        <div className="grid-auto">
                            {topRefurbs.map(r => (
                                <Link key={r.slug} href={`/gpu/${r.slug}`} className="card card--hover" style={{ display: 'block' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                                                REFURBISHED
                                            </div>
                                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</h3>
                                        </div>
                                        {r.savings > 0 && (
                                            <span className="badge badge--green" style={{ fontSize: 10 }}>
                                                -{r.savings}% vs new
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ margin: '12px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span className="price price--lg" style={{ color: 'var(--green)' }}>
                                            ${r.price.toFixed(2)}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'line-through' }}>
                                            ${r.msrp.toFixed(0)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        via {RETAILER_LABELS[r.retailer] ?? r.retailer}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* All GPUs Table */}
            <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <h2 style={{ marginBottom: 24 }}>All GPUs</h2>
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>GPU</th>
                                        <th>Architecture</th>
                                        <th>VRAM</th>
                                        <th>MSRP</th>
                                        <th>Lowest Price</th>
                                        <th>Best At</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allGPUs.map(gpu => (
                                        <tr key={gpu.id}>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{gpu.model}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{gpu.brand.toUpperCase()}</div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{gpu.architecture}</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{gpu.vram_gb}GB</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
                                                ${gpu.msrp_usd.toFixed(0)}
                                            </td>
                                            <td>
                                                {gpu.lowestPrice ? (
                                                    <span className="price price--sm mono" style={{
                                                        color: gpu.lowestPrice <= gpu.msrp_usd ? 'var(--green)' : 'var(--text-primary)'
                                                    }}>
                                                        ${gpu.lowestPrice.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No data</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {gpu.bestRetailer ? RETAILER_LABELS[gpu.bestRetailer] ?? gpu.bestRetailer : '—'}
                                            </td>
                                            <td>
                                                <Link href={`/gpu/${gpu.slug}`} className="btn btn--ghost" style={{ fontSize: 12 }}>
                                                    Track →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
