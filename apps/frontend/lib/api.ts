/**
 * GPU Drip API client — fetches from the unified agg-api-hub backend.
 * Maps the unified Product schema to the domain types the UI expects.
 */
import type { GPU, RetailerOffer, DealScore } from '@gpuwatch/domain'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://agg-api-hub.fly.dev'
const SITE = 'gpudrip'

// ─── Raw API shape ────────────────────────────────────────────────────────────

interface ApiPrice {
  price: number
  status: 'in_stock' | 'out_of_stock' | 'backordered' | 'not_carried'
  url: string
  affiliateUrl: string | null
  verified: boolean
  updatedAt: string
}

interface ApiProduct {
  id: string
  name: string
  slug: string
  category: string  // 'nvidia' | 'amd'
  msrp: number | null
  specs: {
    vram?: string
    architecture?: string
    tdp?: string
    benchmark?: number
  } | null
  imageUrl: string | null
  isRefurb: boolean
  prices: Record<string, ApiPrice>
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function toGPU(p: ApiProduct): GPU {
  const vram_gb = p.specs?.vram
    ? parseInt(p.specs.vram.replace(/\D/g, ''), 10) || 8
    : 8
  const tdp_str = p.specs?.tdp
  const tdp_watts = tdp_str ? parseInt(tdp_str.replace(/\D/g, ''), 10) || null : null
  const brand = (p.category === 'amd' ? 'amd' : p.category === 'intel' ? 'intel' : 'nvidia') as 'nvidia' | 'amd' | 'intel'
  const arch = p.specs?.architecture ?? (brand === 'nvidia' ? 'Blackwell' : brand === 'intel' ? 'Xe2' : 'RDNA 4')

  return {
    id: p.id,
    slug: p.slug,
    model: p.name,
    brand,
    benchmark_score: null,
    recommended_psu: null,
    architecture: arch as GPU['architecture'],
    generation: (brand === 'intel' ? 'Arc Battlemage'
      : brand === 'amd'
        ? (p.name.match(/9\d{3}/) ? 'RX 9000' : 'RX 7000')
      : p.name.match(/RTX\s*50\d{2}/) ? 'RTX 5000'
      : p.name.match(/RTX\s*30\d{2}/) ? 'RTX 3000'
      : 'RTX 4000') as GPU['generation'],
    vram_gb,
    tdp_watts,
    msrp_usd: p.msrp ?? 0,
    release_date: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function toOffer(p: ApiProduct, retailer: string, price: ApiPrice): RetailerOffer {
  return {
    id: `${p.id}-${retailer}`,
    gpu_id: p.id,
    retailer: retailer as RetailerOffer['retailer'],
    sku: p.slug,
    price_usd: price.price,
    regular_price_usd: p.msrp ?? null,
    sale_price_usd: price.price < (p.msrp ?? Infinity) ? price.price : null,
    stock_status: price.status === 'in_stock' ? 'in_stock'
      : price.status === 'out_of_stock' ? 'out_of_stock'
      : price.status === 'backordered' ? 'out_of_stock'
      : 'unknown',
    stock_quantity: null,
    affiliate_url: price.affiliateUrl ?? `/out/${p.slug}/${retailer}`,
    direct_url: price.url,
    last_checked_at: price.updatedAt,
    created_at: price.updatedAt,
  }
}

function computeDealScore(p: ApiProduct, retailer: string, price: ApiPrice): DealScore | null {
  const msrp = p.msrp
  if (!msrp || !price.price) return null

  const pct_below_avg = Math.round(((msrp - price.price) / msrp) * 100 * 10) / 10
  const is_deal = pct_below_avg >= 5

  return {
    id: `${p.id}-${retailer}-score`,
    gpu_id: p.id,
    retailer: retailer as DealScore['retailer'],
    current_price_usd: price.price,
    rolling_30d_avg_usd: msrp,  // approximate: use MSRP as baseline
    msrp_usd: msrp,
    pct_below_avg,
    msrp_delta_pct: pct_below_avg,
    volatility_score: 0,
    is_deal,
    deal_reason: is_deal ? `${pct_below_avg}% below MSRP` : null,
    computed_at: price.updatedAt,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GPUWithData {
  gpu: GPU
  offers: RetailerOffer[]
  bestOffer: RetailerOffer | null
  dealScore: DealScore | null
  lowestPrice: number | null
  bestRetailer: string | null
}

function mapProducts(raw: ApiProduct[]): GPUWithData[] {
  return raw.map(p => {
      const gpu = toGPU(p)
      const offers = Object.entries(p.prices)
        .filter(([, price]) => price.status !== 'not_carried' && price.price > 0)
        .map(([retailer, price]) => toOffer(p, retailer, price))
        .sort((a, b) => a.price_usd - b.price_usd)

      const bestOffer = offers.find(o => o.stock_status === 'in_stock') ?? offers[0] ?? null
      const dealScore = bestOffer
        ? computeDealScore(p, bestOffer.retailer, p.prices[bestOffer.retailer]!)
        : null

      return {
        gpu,
        offers,
        bestOffer,
        dealScore,
        lowestPrice: bestOffer?.price_usd ?? null,
        bestRetailer: bestOffer?.retailer ?? null,
      }
    })
}

async function fetchRawProducts(): Promise<ApiProduct[]> {
  const res = await fetch(`${API_BASE}/api/${SITE}/products`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchAllGPUs(): Promise<GPUWithData[]> {
  const raw = await fetchRawProducts()
  return mapProducts(raw.filter(p => !p.isRefurb))
}

export async function fetchRefurbGPUs(): Promise<GPUWithData[]> {
  const raw = await fetchRawProducts()
  return mapProducts(raw.filter(p => p.isRefurb))
}

export async function fetchGPU(slug: string): Promise<GPUWithData | null> {
  const raw = await fetchRawProducts()
  const all = mapProducts(raw)
  return all.find(g => g.gpu.slug === slug) ?? null
}

export async function fetchDeals(limit = 8): Promise<GPUWithData[]> {
  const all = await fetchAllGPUs()
  return all
    .filter(g => g.dealScore?.is_deal)
    .sort((a, b) => (b.dealScore?.pct_below_avg ?? 0) - (a.dealScore?.pct_below_avg ?? 0))
    .slice(0, limit)
}
