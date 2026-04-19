import type { PPDMetric, ValueRating } from '@gpuwatch/domain'
import { getPPDColor, getPSUColor } from '@gpuwatch/domain'

// ─── Value Badge (top 20% indicator) ──────────────────────────────────────────

export function ValueBadge({ ppd }: { ppd: PPDMetric | null }) {
    if (!ppd || !ppd.isTop20) return null
    return (
        <span className="ppd-badge ppd-badge--best" title={`PPD Score: ${ppd.normalizedScore}/100`}>
            Best Value
        </span>
    )
}

// ─── Value Rating Badge (shows tier for any product) ──────────────────────────

const RATING_STYLES: Record<ValueRating, { cls: string; icon: string }> = {
    Elite: { cls: 'ppd-rating ppd-rating--elite', icon: '💎' },
    Great: { cls: 'ppd-rating ppd-rating--great', icon: '⭐' },
    Good: { cls: 'ppd-rating ppd-rating--good', icon: '👍' },
    Fair: { cls: 'ppd-rating ppd-rating--fair', icon: '👌' },
    Poor: { cls: 'ppd-rating ppd-rating--poor', icon: '📉' },
}

export function ValueRatingBadge({ ppd }: { ppd: PPDMetric | null }) {
    if (!ppd) return null
    const style = RATING_STYLES[ppd.valueRating]
    return (
        <span className={style.cls} title={`PPD Score: ${ppd.normalizedScore}/100`}>
            {style.icon} {ppd.valueRating} Value
        </span>
    )
}

// ─── PPD Bar (color-coded progress bar) ────────────────────────────────────────

export function PPDBar({ ppd }: { ppd: PPDMetric | null }) {
    if (!ppd) return null
    const color = getPPDColor(ppd.normalizedScore)
    return (
        <div className="ppd-bar-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Value Score</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {ppd.normalizedScore}/100
                </span>
            </div>
            <div className="ppd-bar">
                <div
                    className="ppd-bar__fill"
                    style={{ width: `${ppd.normalizedScore}%`, background: color }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Poor</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Elite</span>
            </div>
        </div>
    )
}

// ─── Build Compatibility (PSU recommendation) ─────────────────────────────────

export function BuildCompatibility({
    gpuModel,
    tdpWatts,
    recommendedPsu,
}: {
    gpuModel: string
    tdpWatts: number | null
    recommendedPsu: number | null
}) {
    if (!recommendedPsu) return null

    const color = getPSUColor(recommendedPsu)
    const barWidth = Math.min(100, (recommendedPsu / 1200) * 100)

    return (
        <div className="build-compat">
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Build Compatibility</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Recommended PSU</span>
                    <span style={{ fontWeight: 600, color }}>{recommendedPsu}W</span>
                </div>
                <div className="psu-bar">
                    <div
                        className="psu-bar__fill"
                        style={{ width: `${barWidth}%`, background: color }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>500W</span>
                    <span>1200W+</span>
                </div>
                {tdpWatts && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Card TDP</span>
                        <span style={{ fontWeight: 500 }}>{tdpWatts}W</span>
                    </div>
                )}
                <p className="build-compat__note">
                    {recommendedPsu >= 850
                        ? `${gpuModel} is a high-power GPU. Ensure your PSU has adequate 12V rails and consider transient spike headroom.`
                        : recommendedPsu >= 700
                            ? `${gpuModel} needs a solid power supply. Budget for quality 80+ Gold units.`
                            : `${gpuModel} is power-efficient. Most mid-range PSUs will handle this comfortably.`}
                </p>
            </div>
        </div>
    )
}

// ─── Comparison Cell (for comparison table) ────────────────────────────────────

export function ComparisonCell({
    ppd,
    isWinner,
}: {
    ppd: PPDMetric | null
    isWinner: boolean
}) {
    if (!ppd) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
    return (
        <div className={`ppd-compare-cell ${isWinner ? 'ppd-compare-cell--winner' : ''}`}>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>
                {ppd.normalizedScore}
            </div>
            <ValueRatingBadge ppd={ppd} />
            {isWinner && <span className="ppd-compare-cell__crown">👑</span>}
        </div>
    )
}
