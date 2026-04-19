import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GPU_SEED, computePPDFromMarket, comparePPD } from '@gpuwatch/domain'
import { StockBadge, ValueRatingBadge, PPDBar, BuildCompatibility, ComparisonCell } from '@gpuwatch/charts'

export async function generateStaticParams() {
    const params: Array<{ model: string; other: string }> = []
    for (const a of GPU_SEED) {
        for (const b of GPU_SEED) {
            if (a.slug < b.slug) params.push({ model: a.slug, other: b.slug })
        }
    }
    return params
}

export async function generateMetadata(
    { params }: { params: { model: string; other: string } }
): Promise<Metadata> {
    const a = GPU_SEED.find(g => g.slug === params.model)
    const b = GPU_SEED.find(g => g.slug === params.other)
    if (!a || !b) return {}
    return {
        title: `${a.model} vs ${b.model} — GPU Comparison`,
        description: `Compare ${a.model} and ${b.model}: performance per dollar, price, specs, PSU requirements, and value rating.`,
    }
}

export const revalidate = 300

export default async function ComparePage({ params }: { params: { model: string; other: string } }) {
    const gpuA = GPU_SEED.find(g => g.slug === params.model)
    const gpuB = GPU_SEED.find(g => g.slug === params.other)
    if (!gpuA || !gpuB) return notFound()

    // Use MSRP as fallback price for PPD (live prices would need DB access)
    const ppdA = computePPDFromMarket(gpuA.benchmark_score, gpuA.msrp_usd)
    const ppdB = computePPDFromMarket(gpuB.benchmark_score, gpuB.msrp_usd)
    const comparisonText = comparePPD(gpuA.model, ppdA, gpuB.model, ppdB)

    return (
        <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, flexWrap: 'wrap' }}>
                <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
                <span>/</span>
                <Link href={`/gpu/${gpuA.slug}`} style={{ color: 'var(--text-muted)' }}>{gpuA.model}</Link>
                <span>vs</span>
                <Link href={`/gpu/${gpuB.slug}`} style={{ color: 'var(--text-muted)' }}>{gpuB.model}</Link>
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 style={{ marginBottom: 12 }}>
                    {gpuA.model} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> {gpuB.model}
                </h1>
                {comparisonText && (
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto' }}>
                        {comparisonText}
                    </p>
                )}
            </div>

            {/* Side by side cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                {[gpuA, gpuB].map(gpu => (
                    <div key={gpu.slug} className="card">
                        <div style={{ marginBottom: 16 }}>
                            <span className="badge badge--blue">{gpu.architecture}</span>
                            <span className="badge badge--blue" style={{ marginLeft: 4 }}>{gpu.vram_gb}GB VRAM</span>
                        </div>
                        <h2 style={{ marginBottom: 8 }}>{gpu.model}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            {gpu.brand.toUpperCase()} · {gpu.generation}
                        </p>
                        <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>
                            ${gpu.msrp_usd}
                        </div>
                    </div>
                ))}
            </div>

            {/* Specs comparison table */}
            <div className="card" style={{ padding: 0, marginBottom: 24 }}>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Spec</th>
                                <th>{gpuA.model}</th>
                                <th>{gpuB.model}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: 'MSRP', aVal: `$${gpuA.msrp_usd}`, bVal: `$${gpuB.msrp_usd}`, winner: gpuA.msrp_usd < gpuB.msrp_usd ? 'a' : gpuA.msrp_usd > gpuB.msrp_usd ? 'b' : null },
                                { label: 'VRAM', aVal: `${gpuA.vram_gb}GB`, bVal: `${gpuB.vram_gb}GB`, winner: gpuA.vram_gb > gpuB.vram_gb ? 'a' : gpuA.vram_gb < gpuB.vram_gb ? 'b' : null },
                                { label: 'TDP', aVal: gpuA.tdp_watts ? `${gpuA.tdp_watts}W` : 'N/A', bVal: gpuB.tdp_watts ? `${gpuB.tdp_watts}W` : 'N/A', winner: gpuA.tdp_watts && gpuB.tdp_watts ? (gpuA.tdp_watts < gpuB.tdp_watts ? 'a' : gpuA.tdp_watts > gpuB.tdp_watts ? 'b' : null) : null },
                                { label: 'Architecture', aVal: gpuA.architecture, bVal: gpuB.architecture, winner: null },
                                { label: 'Benchmark Score', aVal: gpuA.benchmark_score?.toLocaleString() ?? 'N/A', bVal: gpuB.benchmark_score?.toLocaleString() ?? 'N/A', winner: gpuA.benchmark_score && gpuB.benchmark_score ? (gpuA.benchmark_score > gpuB.benchmark_score ? 'a' : gpuA.benchmark_score < gpuB.benchmark_score ? 'b' : null) : null },
                                { label: 'Recommended PSU', aVal: gpuA.recommended_psu ? `${gpuA.recommended_psu}W` : 'N/A', bVal: gpuB.recommended_psu ? `${gpuB.recommended_psu}W` : 'N/A', winner: null },
                            ].map(({ label, aVal, bVal, winner }) => (
                                <tr key={label}>
                                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</td>
                                    <td style={{ color: winner === 'a' ? 'var(--green)' : 'var(--text-primary)', fontWeight: winner === 'a' ? 600 : 400 }}>{aVal}</td>
                                    <td style={{ color: winner === 'b' ? 'var(--green)' : 'var(--text-primary)', fontWeight: winner === 'b' ? 600 : 400 }}>{bVal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PPD Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {[gpuA, gpuB].map(gpu => {
                    const ppd = gpu === gpuA ? ppdA : ppdB
                    return (
                        <div key={gpu.slug} className="card">
                            <h4 style={{ marginBottom: 12 }}>{gpu.model} Value</h4>
                            {ppd ? (
                                <>
                                    <PPDBar ppd={ppd} />
                                    <div style={{ marginTop: 12 }}>
                                        <ValueRatingBadge ppd={ppd} />
                                    </div>
                                </>
                            ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No benchmark data</span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Build Compatibility side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {[gpuA, gpuB].map(gpu => (
                    <BuildCompatibility
                        key={gpu.slug}
                        gpuModel={gpu.model}
                        tdpWatts={gpu.tdp_watts}
                        recommendedPsu={gpu.recommended_psu}
                    />
                ))}
            </div>

            {/* Back links */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 40 }}>
                <Link href={`/gpu/${gpuA.slug}`} className="btn btn--outline">
                    ← {gpuA.model} Details
                </Link>
                <Link href={`/gpu/${gpuB.slug}`} className="btn btn--outline">
                    ← {gpuB.model} Details
                </Link>
            </div>
        </div>
    )
}
