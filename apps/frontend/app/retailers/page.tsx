import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'GPU Retailers — Where We Track Prices',
    description: 'GPU Drip tracks GPU prices across Amazon, Best Buy, Newegg, B&H Photo, Adorama, and Micro Center. Learn about each retailer and how we source prices.',
    openGraph: {
        title: 'GPU Retailers Tracked by GPU Drip',
        description: 'Live price data from 6+ major GPU retailers. No affiliate bias, just real prices.',
    },
}

const RETAILERS = [
    {
        name: 'Amazon',
        slug: 'amazon',
        icon: '📦',
        description: 'Largest online retailer. Ships fast with Prime. Prices fluctuate frequently — great for deals. We also track Amazon Renewed for certified refurbished GPUs.',
        pros: ['Fast Prime shipping', 'Price drops often', 'Certified Renewed program', 'Easy returns'],
        url: 'https://www.amazon.com',
        affiliate: true,
    },
    {
        name: 'Best Buy',
        slug: 'bestbuy',
        icon: '🛒',
        description: 'Major US electronics chain with both online and in-store availability. Price-matches competitors. Strong return policy and Geek Squad support.',
        pros: ['Price matching', 'In-store pickup', 'Strong return policy', 'Financing options'],
        url: 'https://www.bestbuy.com',
        affiliate: false,
    },
    {
        name: 'Newegg',
        slug: 'newegg',
        icon: '🖥️',
        description: 'PC components specialist. Often has the widest GPU selection including AIB (aftermarket) variants, bundles, and combo deals.',
        pros: ['Widest GPU selection', 'AIB variants', 'Bundle deals', 'PC builder focus'],
        url: 'https://www.newegg.com',
        affiliate: false,
    },
    {
        name: 'B&H Photo',
        slug: 'bh',
        icon: '📷',
        description: 'Professional electronics retailer. Competitive pricing on workstation-class GPUs and often has stock when others don\'t.',
        pros: ['Pro/workstation GPUs', 'Tax-free in many states', 'Stock availability', 'Expert service'],
        url: 'https://www.bhphotovideo.com',
        affiliate: false,
    },
    {
        name: 'Adorama',
        slug: 'adorama',
        icon: '🎬',
        description: 'Professional electronics and photography retailer. Good alternative to B&H for workstation GPUs and competitive pricing.',
        pros: ['Competitive pricing', 'Pro GPU focus', 'AdoramaRentals', 'Expert staff'],
        url: 'https://www.adorama.com',
        affiliate: false,
    },
    {
        name: 'Micro Center',
        slug: 'microcenter',
        icon: '🏪',
        description: 'Brick-and-mortar PC components chain. Legendary for beating MSRP on CPUs and GPUs. In-store only deals can be significantly below any online price.',
        pros: ['Often below MSRP', 'No shipping wait', 'Expert staff', 'Bundle discounts'],
        url: 'https://www.microcenter.com',
        note: 'Online prices may differ from in-store. Micro Center is known for in-store-only deals.',
    },
    {
        name: 'eBay',
        slug: 'ebay',
        icon: '♻️',
        description: 'Best source for refurbished and open-box GPUs. We specifically track Certified Refurbished and Used Excellent condition listings from trusted sellers.',
        pros: ['Best refurb prices', 'Buyer protection', 'Used Excellent & Certified', 'Wide selection'],
        url: 'https://www.ebay.com',
        affiliate: true,
        note: 'GPU Drip tracks eBay for refurbished and certified listings only.',
    },
]

export default function RetailersPage() {
    return (
        <div>
            <section style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ maxWidth: 600 }}>
                        <h1 style={{ marginBottom: 12 }}>Retailers We Track</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                            GPU Drip aggregates live prices from {RETAILERS.length} major retailers.
                            Here's what you need to know about each one.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* Summary table */}
                <div className="card" style={{ padding: 0, marginBottom: 48 }}>
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Retailer</th>
                                    <th>Best For</th>
                                    <th>Affiliate</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {RETAILERS.map(r => (
                                    <tr key={r.slug}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 20 }}>{r.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {r.pros[0]}
                                        </td>
                                        <td>
                                            {r.affiliate ? (
                                                <span className="badge badge--blue" style={{ fontSize: 11 }}>Affiliate</span>
                                            ) : (
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</span>
                                            )}
                                        </td>
                                        <td>
                                            <a href={`#${r.slug}`} style={{ color: 'var(--blue)', fontSize: 12 }}>Details ↓</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Affiliate disclosure */}
                <div className="card" style={{ background: 'var(--blue-dim)', borderColor: 'var(--border-focus)', marginBottom: 48 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>ℹ️</span>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>Affiliate disclosure</div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                                GPU Drip earns affiliate commissions from Amazon and eBay when you purchase through our links.
                                This does not influence our price data, rankings, or which retailer we recommend —
                                we always show the actual lowest price regardless of affiliate status.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Retailer detail cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {RETAILERS.map(r => (
                        <div key={r.slug} id={r.slug} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <span style={{ fontSize: 28 }}>{r.icon}</span>
                                        <div>
                                            <h3 style={{ margin: 0 }}>{r.name}</h3>
                                            {r.affiliate && (
                                                <span className="badge badge--blue" style={{ fontSize: 10, marginTop: 4 }}>Affiliate partner</span>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                                        {r.description}
                                    </p>
                                    {r.note && (
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                                            Note: {r.note}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {r.pros.map(pro => (
                                            <span key={pro} className="badge badge--green" style={{ fontSize: 11 }}>✓ {pro}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn--outline"
                                        style={{ fontSize: 13 }}
                                    >
                                        Visit {r.name} →
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="card" style={{ marginTop: 48, textAlign: 'center', padding: '40px 24px' }}>
                    <h3 style={{ marginBottom: 8 }}>Want price alerts across all retailers?</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                        We monitor all 7 retailers 24/7. Set an alert and we'll notify you the moment your GPU hits your target price.
                    </p>
                    <Link href="/alerts" className="btn btn--primary" style={{ fontSize: 15, padding: '10px 24px' }}>
                        🔔 Set a Price Alert
                    </Link>
                </div>
            </div>
        </div>
    )
}
