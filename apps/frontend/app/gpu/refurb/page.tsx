import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchRefurbGPUs } from '../../../lib/api'

export const metadata: Metadata = {
    title: 'Refurbished GPU Prices — Certified & Used GPUs Tracked Live',
    description: 'Track certified refurbished GPU prices across Amazon, eBay, and major retailers. RTX 4090, RTX 4080, RX 7900 XTX refurbs with live price data.',
    openGraph: {
        title: 'Refurbished GPU Price Tracker — GPUDrip',
        description: 'Certified refurbished GPU prices tracked in real time. Save 20-40% vs new.',
    },
}

export const revalidate = 60

const RETAILER_LABELS: Record<string, string> = {
    amazon: 'Amazon', bestbuy: 'Best Buy', newegg: 'Newegg',
    bh: 'B&H Photo', adorama: 'Adorama', ebay: 'eBay',
    microcenter: 'Micro Center',
}

export default async function RefurbPage() {
    const refurbs = await fetchRefurbGPUs()
    const inStock = refurbs.filter(g => g.bestOffer?.stock_status === 'in_stock')
    const outOfStock = refurbs.filter(g => g.bestOffer?.stock_status !== 'in_stock')

    return (
        <div>
            {/* Hero */}
            <section style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ maxWidth: 620 }}>
                        <div className="badge badge--blue" style={{ marginBottom: 16 }}>
                            ♻️ Certified Refurbished
                        </div>
                        <h1 style={{ marginBottom: 12 }}>
                            Refurbished GPU Prices<br />
                            <span style={{ color: 'var(--green)' }}>Save 20–40% vs new.</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6 }}>
                            Live prices on certified refurbished and open-box GPUs from Amazon, eBay,
                            and authorized resellers. Same performance, lower price.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Refurb GPUs Tracked', value: refurbs.length.toString() },
                            { label: 'In Stock Now', value: inStock.length.toString() },
                            { label: 'Avg Savings vs MSRP', value: refurbs.length ? Math.round(refurbs.filter(g => g.bestOffer && g.gpu.msrp_usd).reduce((sum, g) => sum + (((g.gpu.msrp_usd - (g.bestOffer?.price_usd ?? g.gpu.msrp_usd)) / g.gpu.msrp_usd) * 100), 0) / refurbs.filter(g => g.bestOffer && g.gpu.msrp_usd).length) + '%' : '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="stat">
                                <div className="stat__label">{label}</div>
                                <div className="stat__value" style={{ fontSize: '1.1rem' }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* Info banner */}
                <div className="card" style={{ background: 'var(--blue-dim)', borderColor: 'var(--border-focus)', marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 20 }}>ℹ️</span>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>About refurbished GPUs</div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                                Certified refurbs are tested, cleaned, and re-boxed by the manufacturer or a certified reseller.
                                Amazon Renewed and eBay Certified Refurbished items include a warranty.
                                Open-box items are returned products sold at a discount — inspect the listing carefully.
                            </p>
                        </div>
                    </div>
                </div>

                {/* In-stock refurbs */}
                {inStock.length > 0 && (
                    <div style={{ marginBottom: 48 }}>
                        <h2 style={{ marginBottom: 20 }}>✅ In Stock Now</h2>
                        <div className="card" style={{ padding: 0 }}>
                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>GPU</th>
                                            <th>VRAM</th>
                                            <th>MSRP (New)</th>
                                            <th>Refurb Price</th>
                                            <th>Savings</th>
                                            <th>Best At</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inStock.sort((a, b) => (a.bestOffer?.price_usd ?? 0) - (b.bestOffer?.price_usd ?? 0)).map(({ gpu, bestOffer }) => {
                                            const savings = gpu.msrp_usd && bestOffer ? Math.round(((gpu.msrp_usd - bestOffer.price_usd) / gpu.msrp_usd) * 100) : null
                                            return (
                                                <tr key={gpu.id}>
                                                    <td>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{gpu.model}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                {gpu.brand.toUpperCase()} · Refurbished
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{gpu.vram_gb}GB</td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                                                        ${gpu.msrp_usd.toFixed(0)}
                                                    </td>
                                                    <td>
                                                        {bestOffer ? (
                                                            <span className="price price--sm" style={{ color: 'var(--green)' }}>
                                                                ${bestOffer.price_usd.toFixed(2)}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td>
                                                        {savings !== null && savings > 0 ? (
                                                            <span className="badge badge--green" style={{ fontSize: 11 }}>
                                                                -{savings}%
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                        {bestOffer ? (RETAILER_LABELS[bestOffer.retailer] ?? bestOffer.retailer) : '—'}
                                                    </td>
                                                    <td>
                                                        <Link href={`/gpu/${gpu.slug}`} className="btn btn--ghost" style={{ fontSize: 12 }}>
                                                            Details →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Out of stock refurbs */}
                {outOfStock.length > 0 && (
                    <div>
                        <h2 style={{ marginBottom: 8 }}>🔔 Watch List</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                            Currently out of stock or no data — set an alert to be notified when they drop.
                        </p>
                        <div className="card" style={{ padding: 0 }}>
                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>GPU</th>
                                            <th>VRAM</th>
                                            <th>MSRP (New)</th>
                                            <th>Last Price</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outOfStock.map(({ gpu, bestOffer }) => (
                                            <tr key={gpu.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{gpu.model}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{gpu.brand.toUpperCase()} · Refurbished</div>
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{gpu.vram_gb}GB</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                                                    ${gpu.msrp_usd.toFixed(0)}
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                                                    {bestOffer ? `$${bestOffer.price_usd.toFixed(2)}` : '—'}
                                                </td>
                                                <td>
                                                    <span className="badge badge--red" style={{ fontSize: 11 }}>Out of Stock</span>
                                                </td>
                                                <td>
                                                    <Link href={`/alerts?gpu=${gpu.slug}`} className="btn btn--ghost" style={{ fontSize: 12 }}>
                                                        🔔 Alert →
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {refurbs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>♻️</div>
                        <h3>Refurb data loading...</h3>
                        <p>First ingest cycle runs daily at 8am ET.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
