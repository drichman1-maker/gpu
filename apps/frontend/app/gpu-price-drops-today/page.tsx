import type { Metadata } from 'next'
import { getDB, cacheGet, cacheSet, CACHE_TTL } from '@gpuwatch/infra'
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'GPU Price Drops Today — Real-Time Deal Tracker',
    description: 'GPU price drops happening right now. All GPUs at or below 30-day average prices across Best Buy, Amazon, Newegg. Updated hourly.',
}

export const revalidate = 300

async function getTodaysDrops() {
    const cacheKey = 'price-drops-today:v1'
    const cached = await cacheGet<{ gpu: GPU; offer: RetailerOffer; deal: DealScore }[]>(cacheKey)
    if (cached) return cached

    const sql = getDB()

    const rows = await sql`
    SELECT
      g.id, g.slug, g.model, g.brand, g.architecture, g.generation,
      g.vram_gb, g.tdp_watts, g.msrp_usd, g.release_date, g.active,
      g.created_at, g.updated_at,
      ro.id AS offer_id, ro.retailer, ro.price_usd, ro.stock_status,
      ro.affiliate_url, ro.regular_price_usd, ro.direct_url, ro.last_checked_at,
      ds.pct_below_avg, ds.msrp_delta_pct, ds.volatility_score,
      ds.deal_reason, ds.rolling_30d_avg, ds.computed_at
    FROM deal_scores ds
    JOIN retailer_offers ro ON ro.gpu_id = ds.gpu_id AND ro.retailer = ds.retailer
    JOIN gpus g ON g.id = ds.gpu_id AND g.active = TRUE
    WHERE ds.is_deal = TRUE
      AND ds.computed_at >= NOW() - INTERVAL '6 hours'
    ORDER BY ds.pct_below_avg DESC, ro.price_usd ASC
    LIMIT 50
  `

    const result = (rows as any[]).map((row: any) => ({
        gpu: {
            id: row.id, slug: row.slug, model: row.model, brand: row.brand,
            architecture: row.architecture, generation: row.generation,
            vram_gb: row.vram_gb, tdp_watts: row.tdp_watts, msrp_usd: row.msrp_usd,
            release_date: row.release_date, active: row.active,
            created_at: row.created_at, updated_at: row.updated_at,
        } as GPU,
        offer: {
            id: row.offer_id, gpu_id: row.id, retailer: row.retailer,
            sku: '', price_usd: row.price_usd, regular_price_usd: row.regular_price_usd,
            sale_price_usd: null, stock_status: row.stock_status, stock_quantity: null,
            affiliate_url: row.affiliate_url, direct_url: row.direct_url,
            last_checked_at: row.last_checked_at, created_at: row.created_at,
        } as RetailerOffer,
        deal: {
            id: '', gpu_id: row.id, retailer: row.retailer,
            current_price_usd: row.price_usd, rolling_30d_avg_usd: row.rolling_30d_avg,
            msrp_usd: row.msrp_usd, pct_below_avg: row.pct_below_avg,
            msrp_delta_pct: row.msrp_delta_pct, volatility_score: row.volatility_score,
            is_deal: true, deal_reason: row.deal_reason, computed_at: row.computed_at,
        } as DealScore,
    }))

    await cacheSet(cacheKey, result, CACHE_TTL.DEAL_SCORES)
    return result
}

const RETAILER_LABELS: Record<string, string> = {
    bestbuy: 'Best Buy', amazon: 'Amazon', newegg: 'Newegg', bh_photo: 'B&H Photo',
}

export default async function PriceDropsTodayPage() {
    const drops = await getTodaysDrops()
    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    return (
        <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ marginBottom: 8 }}>GPU Price Drops — {now}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    {drops.length} active deals detected across all tracked GPUs.
                    Updated every 4 hours from Best Buy, Amazon, and Newegg.
                </p>
            </div>

            {drops.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                    <h3 style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>No deals detected in the last 6 hours</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Prices are currently stable or above average. Check back after the next ingest cycle.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {drops.map(({ gpu, offer, deal }) => (
                        <div key={`${gpu.id}-${offer.retailer}`} className="card card--hover">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                {/* Rank indicator */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', background: 'var(--green-dim)',
                                    color: 'var(--green)', fontWeight: 800, fontFamily: 'var(--font-mono)',
                                    fontSize: 15, flexShrink: 0,
                                }}>
                                    -{deal.pct_below_avg.toFixed(0)}%
                                </div>

                                {/* GPU info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span className="badge badge--green" style={{ fontSize: 10 }}>🔥 Deal</span>
                                        <span className="badge badge--blue" style={{ fontSize: 10 }}>{gpu.vram_gb}GB VRAM</span>
                                    </div>
                                    <Link href={`/gpu/${gpu.slug}`} style={{ fontWeight: 700, fontSize: 15 }}>
                                        {gpu.model}
                                    </Link>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {RETAILER_LABELS[offer.retailer] ?? offer.retailer} ·{' '}
                                        {deal.deal_reason ?? `${deal.pct_below_avg.toFixed(1)}% below 30d average`}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div style={{ textAlign: 'right' }}>
                                    <div className="price price--md" style={{ color: 'var(--green)' }}>
                                        ${offer.price_usd.toFixed(2)}
                                    </div>
                                    {deal.rolling_30d_avg_usd > 0 && (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                            avg ${deal.rolling_30d_avg_usd.toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* Stock + CTA */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                    <span className={`badge badge--${offer.stock_status === 'in_stock' ? 'green' : offer.stock_status === 'limited' ? 'yellow' : 'red'}`} style={{ fontSize: 10 }}>
                                        <span className={`stock-dot stock-dot--${offer.stock_status}`} />
                                        {offer.stock_status === 'in_stock' ? 'In Stock' : offer.stock_status === 'limited' ? 'Limited' : 'OOS'}
                                    </span>
                                    <a href={`/out/${gpu.slug}/${offer.retailer}`} className="btn btn--primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                                        Buy →
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
