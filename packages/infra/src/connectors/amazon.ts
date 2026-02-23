import Bottleneck from 'bottleneck'
import type { GPU } from '@gpuwatch/domain'
import { RetailerConnector, type FetchOffersResult } from './base'

// Amazon Product Advertising API v5
// Rate limit: 1 req/sec — supplemental pricing ONLY
// Requires Associate tag with validated account

// Amazon PA API 5.0 SDK would normally be used here.
// We implement a lightweight manual HMAC-SHA256 signed request for zero extra deps.

const limiter = new Bottleneck({
    minTime: 1100,    // 1 req/sec + buffer
    maxConcurrent: 1,
})

// Map GPU slug → ASIN (add more as discovered)
const ASIN_MAP: Record<string, string> = {
    'rtx-5090': 'B0CXXX5090',  // placeholder — update with real ASINs
    'rtx-5080': 'B0CXXX5080',
    'rtx-5070-ti': 'B0CXXX507T',
    'rtx-4090': 'B09NYPD8H7',
    'rtx-4080-super': 'B0CXXX408S',
    'rtx-4070-super': 'B0CXXX407S',
    'rx-9070-xt': 'B0CXXX9070',
    'rx-7900-xtx': 'B0BRVSXLYH',
}

export class AmazonConnector extends RetailerConnector {
    readonly retailer = 'amazon' as const

    private accessKey: string
    private secretKey: string
    private partnerTag: string
    private region: string

    constructor(opts: {
        accessKey: string
        secretKey: string
        partnerTag: string
        region?: string
    }) {
        super()
        this.accessKey = opts.accessKey
        this.secretKey = opts.secretKey
        this.partnerTag = opts.partnerTag
        this.region = opts.region ?? 'us-east-1'
    }

    async fetchOffers(
        gpus: Pick<GPU, 'id' | 'slug' | 'model'>[]
    ): Promise<FetchOffersResult> {
        const offers: FetchOffersResult['offers'] = []
        const errors: string[] = []

        for (const gpu of gpus) {
            const asin = ASIN_MAP[gpu.slug]
            if (!asin || asin.includes('XXX')) {
                // Skip placeholder ASINs — real ASINs need to be populated
                continue
            }

            try {
                const data = await limiter.schedule(() => this.getItemPricing(asin))
                if (!data) continue

                offers.push({
                    gpu_id: gpu.id,
                    retailer: 'amazon',
                    sku: asin,
                    price_usd: data.price,
                    regular_price_usd: data.listPrice ?? null,
                    sale_price_usd: null,
                    stock_status: this.normalizeStock(data.availability),
                    stock_quantity: null,
                    affiliate_url: this.buildAffiliateUrl(gpu.slug),
                    direct_url: `https://www.amazon.com/dp/${asin}?tag=${this.partnerTag}`,
                    last_checked_at: new Date().toISOString(),
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                errors.push(`Amazon error for ${gpu.slug}: ${msg}`)
            }
        }

        return { offers, errors }
    }

    private async getItemPricing(
        asin: string
    ): Promise<{ price: number; listPrice?: number; availability: string } | null> {
        // NOTE: In production use the official @aws-sdk/client-paapi5 package.
        // This stub returns null until real API credentials are configured.
        // The structure is kept for easy drop-in replacement.
        console.warn(`[Amazon] PA API stub called for ASIN ${asin} — integrate @aws-sdk/client-paapi5`)
        return null
    }

    // Called from admin to update the ASIN map without deploys
    static updateAsinMap(slug: string, asin: string) {
        ASIN_MAP[slug] = asin
    }
}
