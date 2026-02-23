import type { RetailerOffer } from '@gpuwatch/domain'

interface RetailerTableProps {
    offers: RetailerOffer[]
    gpuSlug: string
}

const RETAILER_LABELS: Record<string, string> = {
    bestbuy: 'Best Buy',
    amazon: 'Amazon',
    newegg: 'Newegg',
    bh_photo: 'B&H Photo',
    microcenter: 'Micro Center',
}

export function RetailerTable({ offers, gpuSlug }: RetailerTableProps) {
    const sorted = [...offers].sort((a, b) => a.price_usd - b.price_usd)

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th>Retailer</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Updated</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((offer, i) => (
                        <tr key={offer.id}>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {i === 0 && (
                                        <span className="badge badge--green" style={{ fontSize: 9 }}>BEST</span>
                                    )}
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {RETAILER_LABELS[offer.retailer] ?? offer.retailer}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <span className="price price--md mono" style={{ color: i === 0 ? 'var(--green)' : 'var(--text-primary)' }}>
                                    ${offer.price_usd.toFixed(2)}
                                </span>
                                {offer.regular_price_usd && offer.regular_price_usd > offer.price_usd && (
                                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                        ${offer.regular_price_usd.toFixed(2)}
                                    </span>
                                )}
                            </td>
                            <td>
                                <StockIndicator status={offer.stock_status} />
                            </td>
                            <td>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                    {formatRelativeTime(offer.last_checked_at)}
                                </span>
                            </td>
                            <td>
                                <a
                                    href={`/out/${gpuSlug}/${offer.retailer}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn--primary"
                                    style={{ padding: '7px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                                >
                                    Buy →
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function StockIndicator({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        in_stock: { label: 'In Stock', cls: 'badge--green' },
        limited: { label: 'Limited', cls: 'badge--yellow' },
        out_of_stock: { label: 'Out of Stock', cls: 'badge--red' },
        preorder: { label: 'Preorder', cls: 'badge--purple' },
        unknown: { label: 'Unknown', cls: 'badge--blue' },
    }
    const { label, cls } = map[status] ?? map.unknown
    return (
        <span className={`badge ${cls}`} style={{ fontSize: 10 }}>
            <span className={`stock-dot stock-dot--${status}`} />
            {label}
        </span>
    )
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}
