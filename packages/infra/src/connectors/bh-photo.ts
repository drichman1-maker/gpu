import * as cheerio from 'cheerio'
import type { GPU } from '@gpuwatch/domain'
import { RetailerConnector, type FetchOffersResult } from './base'

// B&H Photo scraper — no public API available
// B&H allows search indexing (robots.txt verified: Disallow: /pauk only)

export class BHPhotoConnector extends RetailerConnector {
    readonly retailer = 'bh_photo' as const

    async fetchOffers(
        gpus: Pick<GPU, 'id' | 'slug' | 'model'>[]
    ): Promise<FetchOffersResult> {
        const offers: FetchOffersResult['offers'] = []
        const errors: string[] = []

        for (const gpu of gpus) {
            await this.politeDelay()
            try {
                const result = await this.scrape(gpu.model)
                if (!result) {
                    errors.push(`B&H: no results for ${gpu.slug}`)
                    continue
                }

                offers.push({
                    gpu_id: gpu.id,
                    retailer: 'bh_photo',
                    sku: result.sku,
                    price_usd: result.price,
                    regular_price_usd: result.regularPrice ?? null,
                    sale_price_usd: null,
                    stock_status: this.normalizeStock(result.availability),
                    stock_quantity: null,
                    affiliate_url: this.buildAffiliateUrl(gpu.slug),
                    direct_url: result.url,
                    last_checked_at: new Date().toISOString(),
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                errors.push(`B&H error for ${gpu.slug}: ${msg}`)
            }
        }

        return { offers, errors }
    }

    private async scrape(model: string): Promise<{
        price: number
        regularPrice?: number
        url: string
        sku: string
        availability: string
    } | null> {
        const searchUrl = `https://www.bhphotovideo.com/c/search?Ntt=${encodeURIComponent(model)}&N=0&ci=16386`

        const res = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GPUWatchBot/1.0; +https://gpuwatch.com/bot)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(15_000),
        })

        if (!res.ok) throw new Error(`B&H HTTP ${res.status}`)
        const html = await res.text()
        const $ = cheerio.load(html)

        // B&H search result card selectors (updated 2024)
        const firstCard = $('[data-selenium="miniProductPage"]').first()
        if (!firstCard.length) return null

        const priceEl = firstCard.find('[data-selenium="price"]').first()
        const regularPriceEl = firstCard.find('[data-selenium="regularPrice"]').first()
        const linkEl = firstCard.find('a[data-selenium="itemName"]').first()
        const availEl = firstCard.find('[data-selenium="stockStatus"]').first()
        const skuEl = firstCard.find('[data-selenium="itemId"]').first()

        const priceStr = priceEl.text().replace(/[$,]/g, '').trim()
        const regularStr = regularPriceEl.text().replace(/[$,]/g, '').trim()
        const path = linkEl.attr('href') ?? ''
        const availability = availEl.text().trim() || 'unknown'
        const sku = skuEl.text().trim() || path.split('/').pop() || 'unknown'

        const price = parseFloat(priceStr)
        if (isNaN(price) || !path) return null

        return {
            price,
            regularPrice: parseFloat(regularStr) || undefined,
            url: `https://www.bhphotovideo.com${path}`,
            sku,
            availability,
        }
    }
}
