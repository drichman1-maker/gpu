import Bottleneck from 'bottleneck'
import type { GPU } from '@gpuwatch/domain'
import { RetailerConnector, type FetchOffersResult } from './base'

// Best Buy Products API
// Docs: https://developer.bestbuy.com/documentation/products-api
// Max 50,000 req/day → plan 4-6hr refresh cycles (12 GPUs × 2 retailers-worth)

const BB_BASE = 'https://api.bestbuy.com/v1'

// Conservative: ~8 req/sec to stay well within daily cap
const limiter = new Bottleneck({ minTime: 125, maxConcurrent: 1 })

interface BBProduct {
    sku: number
    name: string
    salePrice: number
    regularPrice: number
    onSale: boolean
    inStoreAvailability: boolean
    onlineAvailability: boolean
    url: string
    addToCartUrl: string
}

interface BBSearchResponse {
    from: number
    to: number
    total: number
    currentPage: number
    totalPages: number
    products: BBProduct[]
}

// Map GPU slug to Best Buy search terms
const BB_SEARCH_MAP: Record<string, string> = {
    'rtx-5090': 'RTX 5090',
    'rtx-5080': 'RTX 5080',
    'rtx-5070-ti': 'RTX 5070 Ti',
    'rtx-5070': 'RTX 5070',
    'rtx-5060-ti': 'RTX 5060 Ti',
    'rtx-4090': 'RTX 4090',
    'rtx-4080-super': 'RTX 4080 Super',
    'rtx-4070-super': 'RTX 4070 Super',
    'rx-9070-xt': 'RX 9070 XT',
    'rx-9060-xt': 'RX 9060 XT',
    'rx-7900-xtx': 'RX 7900 XTX',
    'rx-7700-xt': 'RX 7700 XT',
}

export class BestBuyConnector extends RetailerConnector {
    readonly retailer = 'bestbuy' as const
    private apiKey: string

    constructor(apiKey: string) {
        super()
        this.apiKey = apiKey
    }

    async fetchOffers(
        gpus: Pick<GPU, 'id' | 'slug' | 'model'>[]
    ): Promise<FetchOffersResult> {
        const offers: FetchOffersResult['offers'] = []
        const errors: string[] = []

        for (const gpu of gpus) {
            const searchTerm = BB_SEARCH_MAP[gpu.slug]
            if (!searchTerm) continue

            try {
                const results = await limiter.schedule(() => this.searchProducts(searchTerm))
                if (!results.products.length) {
                    errors.push(`BestBuy: no products found for ${gpu.slug}`)
                    continue
                }

                // Take first (most relevant) result
                const product = results.products[0]
                const inStock = product.onlineAvailability || product.inStoreAvailability

                offers.push({
                    gpu_id: gpu.id,
                    retailer: 'bestbuy',
                    sku: String(product.sku),
                    price_usd: product.salePrice,
                    regular_price_usd: product.regularPrice,
                    sale_price_usd: product.onSale ? product.salePrice : null,
                    stock_status: this.normalizeStock(inStock ? 'in_stock' : 'out_of_stock'),
                    stock_quantity: null,
                    affiliate_url: this.buildAffiliateUrl(gpu.slug),
                    direct_url: product.url,
                    last_checked_at: new Date().toISOString(),
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                errors.push(`BestBuy error for ${gpu.slug}: ${msg}`)
            }
        }

        return { offers, errors }
    }

    private async searchProducts(term: string): Promise<BBSearchResponse> {
        const apiKey = this.apiKey
        // Search GPU category (abcat0500000 = Computer Components > Video Cards)
        const categoryId = 'abcat0505018'
        const query = encodeURIComponent(`search=${term}&categoryId=${categoryId}`)
        const fields = 'sku,name,salePrice,regularPrice,onSale,onlineAvailability,inStoreAvailability,url,addToCartUrl'
        const url = `${BB_BASE}/products(search=${encodeURIComponent(term)}&categoryId=${categoryId})?format=json&pageSize=5&show=${fields}&apiKey=${apiKey}`

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10_000),
        })

        if (!res.ok) {
            if (res.status === 429) throw new Error('BestBuy rate limit hit')
            throw new Error(`BestBuy HTTP ${res.status} for "${term}"`)
        }

        return res.json() as Promise<BBSearchResponse>
    }
}
