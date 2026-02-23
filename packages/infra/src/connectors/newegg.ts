import * as cheerio from 'cheerio'
import type { GPU } from '@gpuwatch/domain'
import { RetailerConnector, type FetchOffersResult } from './base'

// Scraper adapter for Newegg via Apify actor OR direct HTML parsing
// Primary: Apify actor "dhruvil.newegg-scraper" (structured output)
// Fallback: HTML parse newegg.com search (respects robots.txt: allow /search)

interface ApifyRunResult {
    title: string
    price: number
    url: string
    inStock: boolean
    sku: string
}

export class NeweggConnector extends RetailerConnector {
    readonly retailer = 'newegg' as const
    private apifyToken: string | null

    constructor(apifyToken: string | null = null) {
        super()
        this.apifyToken = apifyToken
    }

    async fetchOffers(
        gpus: Pick<GPU, 'id' | 'slug' | 'model'>[]
    ): Promise<FetchOffersResult> {
        const offers: FetchOffersResult['offers'] = []
        const errors: string[] = []

        for (const gpu of gpus) {
            await this.politeDelay()
            try {
                let result: { price: number; url: string; inStock: boolean; sku: string } | null

                if (this.apifyToken) {
                    result = await this.fetchViaApify(gpu.model)
                } else {
                    result = await this.fetchViaHtml(gpu.model)
                }

                if (!result) {
                    errors.push(`Newegg: no results for ${gpu.slug}`)
                    continue
                }

                offers.push({
                    gpu_id: gpu.id,
                    retailer: 'newegg',
                    sku: result.sku,
                    price_usd: result.price,
                    regular_price_usd: null,
                    sale_price_usd: null,
                    stock_status: this.normalizeStock(result.inStock ? 'in_stock' : 'out_of_stock'),
                    stock_quantity: null,
                    affiliate_url: this.buildAffiliateUrl(gpu.slug),
                    direct_url: result.url,
                    last_checked_at: new Date().toISOString(),
                })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                errors.push(`Newegg error for ${gpu.slug}: ${msg}`)
            }
        }

        return { offers, errors }
    }

    private async fetchViaApify(
        model: string
    ): Promise<{ price: number; url: string; inStock: boolean; sku: string } | null> {
        const actorId = 'dhruvil/newegg-scraper'
        const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`

        const res = await fetch(runUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apifyToken}`,
            },
            body: JSON.stringify({ search: model, maxItems: 3 }),
            signal: AbortSignal.timeout(30_000),
        })

        if (!res.ok) throw new Error(`Apify HTTP ${res.status}`)
        const items = await res.json() as ApifyRunResult[]
        if (!items.length) return null

        const item = items[0]
        return {
            price: item.price,
            url: item.url,
            inStock: item.inStock,
            sku: item.sku,
        }
    }

    private async fetchViaHtml(
        model: string
    ): Promise<{ price: number; url: string; inStock: boolean; sku: string } | null> {
        // Newegg allows search indexing (verified in robots.txt)
        const searchUrl = `https://www.newegg.com/p/pl?d=${encodeURIComponent(model)}&N=100007708`

        const res = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GPUWatchBot/1.0; +https://gpuwatch.com/bot)',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(15_000),
        })

        if (!res.ok) throw new Error(`Newegg HTML fetch HTTP ${res.status}`)
        const html = await res.text()
        const $ = cheerio.load(html)

        const firstItem = $('.item-cell').first()
        if (!firstItem.length) return null

        const priceEl = firstItem.find('.price-current strong').first()
        const centsEl = firstItem.find('.price-current sup').first()
        const linkEl = firstItem.find('a.item-title').first()
        const outOfStockEl = firstItem.find('.item-promo').text()

        const priceStr = priceEl.text().replace(/,/g, '')
        const cents = centsEl.text().trim()
        const price = parseFloat(`${priceStr}.${cents || '00'}`)
        const url = linkEl.attr('href') ?? ''
        const inStock = !outOfStockEl.toLowerCase().includes('out of stock')
        const sku = url.match(/Item=(\w+)/)?.[1] ?? 'unknown'

        if (!price || !url) return null
        return { price, url, inStock, sku }
    }
}
