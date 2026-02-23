import type { Metadata } from 'next'
import Link from 'next/link'
import { getDB, cacheGet, cacheSet, CACHE_TTL } from '@gpuwatch/infra'
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'

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
}> {
    const cacheKey = 'homepage:v1'
    const cached = await cacheGet<Awaited<ReturnType<typeof fetchFromDB>>>(cacheKey)
    if (cached) return cached

    const data = await fetchFromDB()
    await cacheSet(cacheKey, data, CACHE_TTL.DEAL_SCORES)
    return data
}

async function fetchFromDB() {
    const sql = getDB()

    // Active deals with best price
    const deals = await sql<Array<{
        gpu_id: string; slug: string; model: string; brand: string; architecture: string;
        generation: string; vram_gb: number; msrp_usd: number; active: boolean;
        created_at: string; updated_at: string; tdp_watts: number | null; release_date: string | null;
        retailer: string; price_usd: number; stock_status: string; affiliate_url: string;
        regular_price_usd: number | null; direct_url: string; last_checked_at: string;
        offer_id: string; pct_below_avg: number; volatility_score: number; deal_reason: string | null;
    }>>`
    SELECT
      g.*,
      ro.id AS offer_id,
      ro.retailer,
      ro.price_usd,
      ro.stock_status,
      ro.affiliate_url,
      ro.regular_price_usd,
      ro.direct_url,
      ro.last_checked_at,
      ds.pct_below_avg,
      ds.volatility_score,
      ds.deal_reason
    FROM deal_scores ds
    JOIN retailer_offers ro ON ro.gpu_id = ds.gpu_id AND ro.retailer = ds.retailer
    JOIN gpus g ON g.id = ds.gpu_id
    WHERE ds.is_deal = TRUE AND g.active = TRUE
    ORDER BY ds.pct_below_avg DESC
    LIMIT 8
  `

    const allGPUs = await sql<Array<{
        id: string; slug: string; model: string; brand: string; architecture: string;
        generation: string; vram_gb: number; msrp_usd: number; active: boolean;
        created_at: string; updated_at: string; tdp_watts: number | null; release_date: string | null;
        lowest_price: number | null; best_retailer: string | null;
    }>>`
    SELECT
      g.*,
      MIN(ro.price_usd)                                             AS lowest_price,
      (ARRAY_AGG(ro.retailer ORDER BY ro.price_usd ASC))[1] AS best_retailer
    FROM gpus g
    LEFT JOIN retailer_offers ro ON ro.gpu_id = g.id
    WHERE g.active = TRUE
    GROUP BY g.id
    ORDER BY g.msrp_usd ASC
  `

    return {
        deals: deals.map(row => ({
            gpu: {
                id: row.gpu_id, slug: row.slug, model: row.model, brand: row.brand as 'nvidia' | 'amd',
                architecture: row.architecture as any, generation: row.generation as any,
                vram_gb: row.vram_gb, tdp_watts: row.tdp_watts, msrp_usd: row.msrp_usd,
                release_date: row.release_date, active: row.active,
                created_at: row.created_at, updated_at: row.updated_at,
            },
            bestOffer: {
                id: row.offer_id, gpu_id: row.gpu_id, retailer: row.retailer as any,
                sku: '', price_usd: row.price_usd, regular_price_usd: row.regular_price_usd,
                sale_price_usd: null, stock_status: row.stock_status as any, stock_quantity: null,
                affiliate_url: row.affiliate_url, direct_url: row.direct_url,
                last_checked_at: row.last_checked_at, created_at: row.created_at,
            },
            dealScore: {
                id: '', gpu_id: row.gpu_id, retailer: row.retailer as any,
                current_price_usd: row.price_usd, rolling_30d_avg_usd: 0, msrp_usd: row.msrp_usd,
                pct_below_avg: row.pct_below_avg, msrp_delta_pct: 0,
                volatility_score: row.volatility_score, is_deal: true,
                deal_reason: row.deal_reason, computed_at: '',
            },
        })),
        allGPUs: allGPUs.map(row => ({
            id: row.id, slug: row.slug, model: row.model, brand: row.brand as 'nvidia' | 'amd',
            architecture: row.architecture as any, generation: row.generation as any,
            vram_gb: row.vram_gb, tdp_watts: row.tdp_watts, msrp_usd: row.msrp_usd,
            release_date: row.release_date, active: row.active,
            created_at: row.created_at, updated_at: row.updated_at,
            lowestPrice: row.lowest_price,
            bestRetailer: row.best_retailer,
        })),
    }
}

const RETAILER_LABELS: Record<string, string> = {
    bestbuy: 'Best Buy', amazon: 'Amazon', newegg: 'Newegg', bh_photo: 'B&H Photo',
}

export default async function HomePage() {
    const { deals, allGPUs } = await getHomepageData()

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
