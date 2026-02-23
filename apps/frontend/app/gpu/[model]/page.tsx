import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getDB, cacheGet, cacheSet, CACHE_TTL } from '@gpuwatch/infra'
import { GPU_SEED } from '@gpuwatch/domain'
import type { GPU, RetailerOffer, DealScore, PriceChartData } from '@gpuwatch/domain'
import { RetailerTable, StockBadge, DealBadge, VolatilityBar } from '@gpuwatch/charts'

// Dynamic import for chart — Lightweight Charts requires browser APIs
const PriceChart = dynamic(
    () => import('@gpuwatch/charts').then(m => m.PriceChart),
    { ssr: false, loading: () => <div className="skeleton" style={{ height: 280, borderRadius: 10 }} /> }
)

// ─── Static params (build-time ISR) ──────────────────────────────────────────
export async function generateStaticParams() {
    return GPU_SEED.map(g => ({ model: g.slug }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
    { params }: { params: { model: string } }
): Promise<Metadata> {
    const gpu = GPU_SEED.find(g => g.slug === params.model)
    if (!gpu) return {}
    return {
        title: `${gpu.model} Price Tracker — Live Prices, Deals & History`,
        description: `Track ${gpu.model} prices across Best Buy, Amazon, Newegg. See 30-day price history, deal alerts, and stock availability. Currently starting at MSRP $${gpu.msrp_usd}.`,
        openGraph: {
            title: `${gpu.model} GPU Prices — GPUWatch`,
            description: `Best ${gpu.model} prices right now. Price history, deals, stock alerts.`,
        },
    }
}

export const revalidate = 60

// ─── Data fetching ─────────────────────────────────────────────────────────────
async function getGPUData(slug: string) {
    const cacheKey = `gpu:${slug}:v1`
    const cached = await cacheGet<{
        gpu: GPU
        offers: RetailerOffer[]
        dealScores: DealScore[]
        chartData: PriceChartData[]
    }>(cacheKey)
    if (cached) return cached

    const sql = getDB()

    const [gpu] = await sql<GPU[]>`
    SELECT * FROM gpus WHERE slug = ${slug} AND active = TRUE LIMIT 1
  `
    if (!gpu) return null

    const offers = await sql<RetailerOffer[]>`
    SELECT * FROM retailer_offers WHERE gpu_id = ${gpu.id} ORDER BY price_usd ASC
  `

    const dealScores = await sql<DealScore[]>`
    SELECT * FROM deal_scores WHERE gpu_id = ${gpu.id}
  `

    // 30-day chart data per retailer
    const history = await sql<{ retailer: string; bucket: string; avg_price: number }[]>`
    SELECT retailer, bucket::text, avg_price
    FROM price_30d_avg
    WHERE gpu_id = ${gpu.id}
      AND bucket >= NOW() - INTERVAL '30 days'
    ORDER BY retailer, bucket ASC
  `

    // Group by retailer
    const retailerMap = new Map<string, { time: string; value: number }[]>()
    for (const row of history) {
        if (!retailerMap.has(row.retailer)) retailerMap.set(row.retailer, [])
        retailerMap.get(row.retailer)!.push({
            time: row.bucket.slice(0, 10),
            value: Number(row.avg_price),
        })
    }

    const chartData: PriceChartData[] = Array.from(retailerMap.entries()).map(([retailer, points]) => ({
        gpu_id: gpu.id,
        retailer: retailer as any,
        range: '30d',
        points,
        min: Math.min(...points.map(p => p.value)),
        max: Math.max(...points.map(p => p.value)),
        avg: points.reduce((s, p) => s + p.value, 0) / points.length,
    }))

    const result = { gpu, offers, dealScores, chartData }
    await cacheSet(cacheKey, result, CACHE_TTL.CHART_DATA)
    return result
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function GPUPage({ params }: { params: { model: string } }) {
    const data = await getGPUData(params.model)
    if (!data) return notFound()

    const { gpu, offers, dealScores, chartData } = data
    const bestOffer = offers[0] ?? null
    const bestDeal = dealScores.find(d => d.is_deal) ?? null
    const topDealScore = dealScores.sort((a, b) => b.pct_below_avg - a.pct_below_avg)[0]

    // Structured data — Product + Offer schema
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: gpu.model,
        brand: { '@type': 'Brand', name: gpu.brand === 'nvidia' ? 'NVIDIA' : 'AMD' },
        description: `${gpu.model} — ${gpu.architecture}, ${gpu.vram_gb}GB VRAM${gpu.tdp_watts ? `, ${gpu.tdp_watts}W TDP` : ''}`,
        offers: offers.map(o => ({
            '@type': 'Offer',
            price: o.price_usd.toFixed(2),
            priceCurrency: 'USD',
            availability: o.stock_status === 'in_stock'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `${process.env.NEXT_PUBLIC_APP_URL}/out/${gpu.slug}/${o.retailer}`,
            seller: { '@type': 'Organization', name: o.retailer },
        })),
    }

    // Best chart data (use lowest priced retailer's history)
    const primaryChart = chartData[0] ?? null

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
                    <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
                    <span>/</span>
                    <Link href="/gpu" style={{ color: 'var(--text-muted)' }}>GPUs</Link>
                    <span>/</span>
                    <span style={{ color: 'var(--text-primary)' }}>{gpu.model}</span>
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
                    <div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span className="badge badge--blue">{gpu.architecture}</span>
                            <span className="badge badge--blue">{gpu.vram_gb}GB VRAM</span>
                            {bestOffer && <StockBadge status={bestOffer.stock_status} />}
                            {bestDeal && <DealBadge reason={bestDeal.deal_reason} pctBelow={bestDeal.pct_below_avg} />}
                        </div>
                        <h1 style={{ marginBottom: 8 }}>{gpu.model}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                            {gpu.brand.toUpperCase()} · {gpu.architecture} · {gpu.generation}
                            {gpu.tdp_watts ? ` · ${gpu.tdp_watts}W TDP` : ''}
                        </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        {bestOffer ? (
                            <>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>BEST PRICE NOW</div>
                                <div className="price price--lg" style={{ color: bestDeal ? 'var(--green)' : 'var(--text-primary)' }}>
                                    ${bestOffer.price_usd.toFixed(2)}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    MSRP ${gpu.msrp_usd.toFixed(0)}
                                </div>
                            </>
                        ) : (
                            <div style={{ color: 'var(--text-muted)' }}>No price data yet</div>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid-4" style={{ marginBottom: 32 }}>
                    {[
                        { label: 'MSRP', value: `$${gpu.msrp_usd.toFixed(0)}` },
                        { label: 'Lowest Now', value: bestOffer ? `$${bestOffer.price_usd.toFixed(2)}` : '—' },
                        { label: '30d Avg', value: topDealScore?.rolling_30d_avg_usd ? `$${topDealScore.rolling_30d_avg_usd.toFixed(0)}` : '—' },
                        { label: 'Volatility', value: topDealScore ? `${topDealScore.volatility_score.toFixed(0)}/100` : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="card">
                            <div className="stat">
                                <div className="stat__label">{label}</div>
                                <div className="stat__value" style={{ fontSize: '1.3rem' }}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
                    <div>
                        {/* Price Chart */}
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3>Price History (30 days)</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['7d', '30d', '90d'].map(range => (
                                        <button key={range} className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {primaryChart ? (
                                <PriceChart
                                    data={primaryChart.points}
                                    height={280}
                                    msrp={gpu.msrp_usd}
                                />
                            ) : (
                                <div style={{
                                    height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-muted)', fontSize: 14,
                                    border: '1px dashed var(--border)', borderRadius: 8,
                                }}>
                                    Price history building — check back after first ingest cycle
                                </div>
                            )}
                        </div>

                        {/* Retailer Table */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                <h3>Best Prices by Retailer</h3>
                            </div>
                            {offers.length > 0 ? (
                                <RetailerTable offers={offers} gpuSlug={gpu.slug} />
                            ) : (
                                <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
                                    No retailer prices available yet. Ingest cycle runs every 4 hours.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Specs */}
                        <div className="card">
                            <h4 style={{ marginBottom: 16 }}>Specifications</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    ['Brand', gpu.brand.toUpperCase()],
                                    ['Architecture', gpu.architecture],
                                    ['Generation', gpu.generation],
                                    ['VRAM', `${gpu.vram_gb}GB`],
                                    ['TDP', gpu.tdp_watts ? `${gpu.tdp_watts}W` : 'N/A'],
                                    ['MSRP', `$${gpu.msrp_usd}`],
                                    ['Released', gpu.release_date ?? 'TBD'],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                        <span style={{ fontWeight: 500 }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Volatility */}
                        {topDealScore && (
                            <div className="card">
                                <h4 style={{ marginBottom: 12 }}>Price Volatility</h4>
                                <VolatilityBar score={topDealScore.volatility_score} />
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                                    {topDealScore.volatility_score >= 70
                                        ? 'High volatility — prices change frequently. Act fast on deals.'
                                        : topDealScore.volatility_score >= 40
                                            ? 'Moderate volatility — watch for periodic price swings.'
                                            : 'Low volatility — prices are relatively stable.'}
                                </p>
                            </div>
                        )}

                        {/* Alert CTA */}
                        <div className="card" style={{ borderColor: 'var(--border-focus)', background: 'var(--blue-dim)' }}>
                            <h4 style={{ marginBottom: 8 }}>Get Price Alerts</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                We'll email you when {gpu.model} hits your target price.
                            </p>
                            <Link
                                href={`/alerts?gpu=${gpu.slug}`}
                                className="btn btn--primary"
                                style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
                            >
                                🔔 Watch This GPU
                            </Link>
                        </div>

                        {/* Compare links */}
                        <div className="card">
                            <h4 style={{ marginBottom: 12 }}>Compare</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {GPU_SEED.filter(g => g.slug !== gpu.slug && g.brand === gpu.brand).slice(0, 4).map(other => (
                                    <Link
                                        key={other.slug}
                                        href={`/gpu/${gpu.slug}/vs/${other.slug}`}
                                        style={{ fontSize: 13, color: 'var(--blue)' }}
                                    >
                                        {gpu.model} vs {other.model} →
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
