export function StockBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
        in_stock: { label: 'In Stock', cls: 'badge--green', dot: 'stock-dot--in_stock' },
        limited: { label: 'Limited', cls: 'badge--yellow', dot: 'stock-dot--limited' },
        out_of_stock: { label: 'Out of Stock', cls: 'badge--red', dot: 'stock-dot--out_of_stock' },
        preorder: { label: 'Pre-order', cls: 'badge--purple', dot: 'stock-dot--preorder' },
        unknown: { label: 'Unknown', cls: 'badge--blue', dot: 'stock-dot--unknown' },
    }
    const { label, cls, dot } = map[status] ?? map.unknown
    return (
        <span className={`badge ${cls}`}>
            <span className={`stock-dot ${dot}`} />
            {label}
        </span>
    )
}

export function DealBadge({ reason, pctBelow }: { reason: string | null; pctBelow: number }) {
    if (!reason || pctBelow < 1) return null
    return (
        <span
            className="badge badge--green"
            title={reason}
            style={{ fontSize: 10, gap: 3 }}
        >
            🔥 {pctBelow.toFixed(1)}% below avg
        </span>
    )
}

export function VolatilityBar({ score }: { score: number }) {
    const color =
        score >= 70 ? 'var(--red)' :
            score >= 40 ? 'var(--yellow)' :
                'var(--green)'

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="volatility-bar" style={{ flex: 1 }}>
                <div
                    className="volatility-bar__fill"
                    style={{ width: `${score}%`, background: color }}
                />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 28 }}>
                {score.toFixed(0)}
            </span>
        </div>
    )
}
