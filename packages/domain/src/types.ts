import { z } from 'zod'

// ─── GPU Architecture ─────────────────────────────────────────────────────────

export type GPUArchitecture = 'Ada Lovelace' | 'Blackwell' | 'RDNA 3' | 'RDNA 4'

export type GPUGeneration = 'RTX 4000' | 'RTX 5000' | 'RX 7000' | 'RX 9000'

export type StockStatus = 'in_stock' | 'out_of_stock' | 'limited' | 'preorder' | 'unknown'

export type Retailer =
    | 'bestbuy'
    | 'amazon'
    | 'newegg'
    | 'bh_photo'
    | 'microcenter'

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface GPU {
    id: string                      // UUID
    slug: string                    // e.g. "rtx-5090"
    model: string                   // e.g. "RTX 5090"
    brand: 'nvidia' | 'amd'
    architecture: GPUArchitecture
    generation: GPUGeneration
    vram_gb: number
    tdp_watts: number | null
    msrp_usd: number
    release_date: string | null     // ISO date string
    active: boolean                 // soft-delete / deactivate
    created_at: string
    updated_at: string
}

export interface RetailerOffer {
    id: string
    gpu_id: string
    retailer: Retailer
    sku: string                     // retailer-specific SKU
    price_usd: number
    regular_price_usd: number | null
    sale_price_usd: number | null
    stock_status: StockStatus
    stock_quantity: number | null   // if available
    affiliate_url: string           // /out/{slug}/{retailer}
    direct_url: string              // actual retailer URL
    last_checked_at: string         // ISO
    created_at: string
}

export interface PriceHistoryPoint {
    id: string
    gpu_id: string
    retailer: Retailer
    price_usd: number
    stock_status: StockStatus
    recorded_at: string             // ISO - TimescaleDB indexes on this
}

// Compressed point for older history (weekly averages after 180 days)
export interface PriceHistoryCompressed {
    gpu_id: string
    retailer: Retailer
    week_start: string
    avg_price_usd: number
    min_price_usd: number
    max_price_usd: number
    sample_count: number
}

export interface DealScore {
    id: string
    gpu_id: string
    retailer: Retailer
    current_price_usd: number
    rolling_30d_avg_usd: number
    msrp_usd: number
    pct_below_avg: number           // negative = above avg, positive = below avg
    msrp_delta_pct: number          // pct difference from MSRP
    volatility_score: number        // 0–100, higher = more volatile
    is_deal: boolean
    deal_reason: string | null      // "8% below 30d avg" | "at MSRP, in stock"
    computed_at: string
}

export interface SKUMapping {
    id: string
    gpu_id: string
    retailer: Retailer
    retailer_sku: string
    retailer_model_name: string     // retailer's display name
    affiliate_url: string
    active: boolean
    created_at: string
}

export interface GPUWatch {
    id: string
    email: string
    gpu_id: string
    target_price_usd: number | null // null = any price drop
    notify_in_stock: boolean
    created_at: string
    last_notified_at: string | null
}

export interface OutboundClick {
    id: string
    gpu_id: string
    retailer: Retailer
    ref_url: string | null
    user_agent: string | null
    clicked_at: string
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface GPUWithOffers extends GPU {
    offers: RetailerOffer[]
    best_price: RetailerOffer | null
    deal_score: DealScore | null
}

export interface PriceChartData {
    gpu_id: string
    retailer: Retailer
    range: '7d' | '30d' | '90d' | '180d' | '1y' | 'all'
    points: Array<{
        time: string   // YYYY-MM-DD for Lightweight Charts
        value: number
    }>
    min: number
    max: number
    avg: number
}

export interface MarketSummary {
    total_deals: number
    avg_price_rtx5090: number | null
    top_movers: Array<{
        gpu: GPU
        price_change_pct: number
        now: number
        was: number
    }>
    new_stock_drops: Array<{
        gpu: GPU
        retailer: Retailer
        price: number
        dropped_at: string
    }>
}

// ─── Zod Schemas (runtime validation) ────────────────────────────────────────

export const GPUSchema = z.object({
    id: z.string().uuid(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    model: z.string().min(1),
    brand: z.enum(['nvidia', 'amd']),
    architecture: z.enum(['Ada Lovelace', 'Blackwell', 'RDNA 3', 'RDNA 4']),
    generation: z.enum(['RTX 4000', 'RTX 5000', 'RX 7000', 'RX 9000']),
    vram_gb: z.number().positive(),
    tdp_watts: z.number().positive().nullable(),
    msrp_usd: z.number().positive(),
    release_date: z.string().nullable(),
    active: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
})

export const RetailerOfferSchema = z.object({
    id: z.string().uuid(),
    gpu_id: z.string().uuid(),
    retailer: z.enum(['bestbuy', 'amazon', 'newegg', 'bh_photo', 'microcenter']),
    sku: z.string(),
    price_usd: z.number().positive(),
    regular_price_usd: z.number().positive().nullable(),
    sale_price_usd: z.number().positive().nullable(),
    stock_status: z.enum(['in_stock', 'out_of_stock', 'limited', 'preorder', 'unknown']),
    stock_quantity: z.number().int().nullable(),
    affiliate_url: z.string(),
    direct_url: z.string().url(),
    last_checked_at: z.string(),
    created_at: z.string(),
})

export const GPUWatchSchema = z.object({
    email: z.string().email(),
    gpu_id: z.string().uuid(),
    target_price_usd: z.number().positive().nullable(),
    notify_in_stock: z.boolean().default(false),
})

export type GPUWatchInput = z.infer<typeof GPUWatchSchema>
