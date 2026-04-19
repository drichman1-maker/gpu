import type { Metadata } from 'next'
import Link from 'next/link'
import { GPU_SEED } from '@gpuwatch/domain'

export const metadata: Metadata = {
    title: 'Compare GPUs — Side-by-Side Price & Performance',
    description: 'Compare any two GPUs side by side. See price, VRAM, TDP, performance per dollar, and live prices across retailers.',
    openGraph: {
        title: 'GPU Comparison Tool — GPU Drip',
        description: 'Side-by-side GPU comparison: specs, value ratings, live prices.',
    },
}

const POPULAR_COMPARISONS: [string, string][] = [
    ['rtx-5090', 'rtx-5080'],
    ['rtx-4090', 'rtx-4080-super'],
    ['rx-9070-xt', 'rtx-5070'],
    ['rtx-5070', 'rtx-4070-super'],
    ['rx-9070-xt', 'rx-9070'],
    ['rtx-4080-super', 'rx-7900-xtx'],
    ['rtx-5060-ti', 'rx-9060-xt'],
    ['rtx-4070', 'rx-7800-xt'],
]

export default function ComparePage() {
    const gpuList = GPU_SEED.filter(g => g.active).sort((a, b) => b.msrp_usd - a.msrp_usd)

    return (
        <div>
            <section style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ maxWidth: 600 }}>
                        <h1 style={{ marginBottom: 12 }}>Compare GPUs</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                            Side-by-side comparison of specs, performance per dollar, and live prices.
                            Select a popular comparison below or browse any GPU to compare from its detail page.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* Popular comparisons */}
                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ marginBottom: 20, fontSize: 18 }}>Popular Comparisons</h2>
                    <div className="grid-auto">
                        {POPULAR_COMPARISONS.map(([a, b]) => {
                            const gpuA = GPU_SEED.find(g => g.slug === a)
                            const gpuB = GPU_SEED.find(g => g.slug === b)
                            if (!gpuA || !gpuB) return null
                            return (
                                <Link
                                    key={`${a}-${b}`}
                                    href={`/gpu/${a}/vs/${b}`}
                                    className="card card--hover"
                                    style={{ display: 'block' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{gpuA.model}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {gpuA.brand.toUpperCase()} · ${gpuA.msrp_usd.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>vs</div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{gpuB.model}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {gpuB.brand.toUpperCase()} · ${gpuB.msrp_usd.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--blue)', textAlign: 'center' }}>
                                        Compare →
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Browse all GPUs to compare */}
                <div>
                    <h2 style={{ marginBottom: 8, fontSize: 18 }}>Compare Any GPU</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                        Open any GPU's page and use the "Compare" links in the sidebar.
                    </p>
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>GPU</th>
                                        <th>Brand</th>
                                        <th>VRAM</th>
                                        <th>MSRP</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gpuList.slice(0, 16).map(g => (
                                        <tr key={g.slug}>
                                            <td style={{ fontWeight: 600, fontSize: 14 }}>{g.model}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{g.brand}</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{g.vram_gb}GB</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>${g.msrp_usd.toLocaleString()}</td>
                                            <td>
                                                <Link href={`/gpu/${g.slug}`} className="btn btn--ghost" style={{ fontSize: 12 }}>
                                                    View & Compare →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                        <Link href="/gpu" style={{ color: 'var(--blue)', fontSize: 13 }}>View all {gpuList.length} GPUs →</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
