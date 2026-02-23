import type { RetailerOffer, StockStatus, GPU } from '@gpuwatch/domain'

export interface FetchOffersResult {
    offers: Omit<RetailerOffer, 'id' | 'created_at'>[]
    errors: string[]
}

// Base interface all retailer connectors must implement
export abstract class RetailerConnector {
    abstract readonly retailer: string

    abstract fetchOffers(
        gpus: Pick<GPU, 'id' | 'slug' | 'model'>[]
    ): Promise<FetchOffersResult>

    // Utility: normalize stock status string from retailer-specific values
    protected normalizeStock(raw: string | boolean | undefined | null): StockStatus {
        if (raw === true || raw === 'true') return 'in_stock'
        if (raw === false || raw === 'false') return 'out_of_stock'
        if (!raw) return 'unknown'
        const s = String(raw).toLowerCase()
        if (s.includes('available') || s.includes('in stock') || s === 'instock') return 'in_stock'
        if (s.includes('preorder') || s.includes('pre-order')) return 'preorder'
        if (s.includes('limited') || s.includes('low stock')) return 'limited'
        if (s.includes('unavailable') || s.includes('sold out') || s.includes('out of stock')) return 'out_of_stock'
        return 'unknown'
    }

    protected buildAffiliateUrl(gpu_slug: string): string {
        return `/out/${gpu_slug}/${this.retailer}`
    }

    // Random delay for polite scraping (1000–3000ms)
    protected async politeDelay(): Promise<void> {
        const ms = 1000 + Math.random() * 2000
        await new Promise(r => setTimeout(r, ms))
    }
}
