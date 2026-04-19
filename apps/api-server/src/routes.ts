import { Router } from 'express'
import { getDB } from '@gpuwatch/infra'
import { sendWelcomeEmail } from '@gpuwatch/notif'

const router = Router()
const sql = getDB()

// GPU Catalog (from gpudrip-backend)
const GPU_CATALOG = [
    // NVIDIA Blackwell (RTX 5000)
    { id: 'rtx-5090', slug: 'rtx-5090', model: 'RTX 5090', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 32, tdp_watts: 575, msrp_usd: 1999, current_price_usd: 2399, in_stock: false, price_change_percent: 20, release_date: '2025-01-30', active: true },
    { id: 'rtx-5080', slug: 'rtx-5080', model: 'RTX 5080', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 16, tdp_watts: 360, msrp_usd: 999, current_price_usd: 1199, in_stock: false, price_change_percent: 20, release_date: '2025-01-30', active: true },
    { id: 'rtx-5070-ti', slug: 'rtx-5070-ti', model: 'RTX 5070 Ti', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 16, tdp_watts: 300, msrp_usd: 749, current_price_usd: 849, in_stock: false, price_change_percent: 13, release_date: '2025-02-20', active: true },
    { id: 'rtx-5070', slug: 'rtx-5070', model: 'RTX 5070', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 12, tdp_watts: 250, msrp_usd: 549, current_price_usd: 629, in_stock: true, price_change_percent: 15, release_date: '2025-03-05', active: true },
    { id: 'rtx-5060-ti', slug: 'rtx-5060-ti', model: 'RTX 5060 Ti', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 16, tdp_watts: 180, msrp_usd: 429, current_price_usd: 459, in_stock: true, price_change_percent: 7, release_date: '2025-03-20', active: true },
    { id: 'rtx-5060', slug: 'rtx-5060', model: 'RTX 5060', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 8, tdp_watts: 150, msrp_usd: 299, current_price_usd: 329, in_stock: true, price_change_percent: 10, release_date: '2025-04-15', active: true },
    // NVIDIA Ada Lovelace (RTX 4000)
    { id: 'rtx-4090', slug: 'rtx-4090', model: 'RTX 4090', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 24, tdp_watts: 450, msrp_usd: 1599, current_price_usd: 1799, in_stock: false, price_change_percent: 13, release_date: '2022-10-12', active: true },
    { id: 'rtx-4080-super', slug: 'rtx-4080-super', model: 'RTX 4080 Super', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 16, tdp_watts: 320, msrp_usd: 999, current_price_usd: 1049, in_stock: true, price_change_percent: 5, release_date: '2024-01-31', active: true },
    { id: 'rtx-4080', slug: 'rtx-4080', model: 'RTX 4080', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 16, tdp_watts: 320, msrp_usd: 1199, current_price_usd: 999, in_stock: true, price_change_percent: -17, release_date: '2022-11-16', active: true },
    { id: 'rtx-4070-ti-super', slug: 'rtx-4070-ti-super', model: 'RTX 4070 Ti Super', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 16, tdp_watts: 285, msrp_usd: 799, current_price_usd: 849, in_stock: true, price_change_percent: 6, release_date: '2024-01-24', active: true },
    { id: 'rtx-4070-ti', slug: 'rtx-4070-ti', model: 'RTX 4070 Ti', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 12, tdp_watts: 285, msrp_usd: 799, current_price_usd: 699, in_stock: true, price_change_percent: -13, release_date: '2023-01-05', active: true },
    { id: 'rtx-4070-super', slug: 'rtx-4070-super', model: 'RTX 4070 Super', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 12, tdp_watts: 220, msrp_usd: 599, current_price_usd: 629, in_stock: true, price_change_percent: 5, release_date: '2024-01-17', active: true },
    { id: 'rtx-4070', slug: 'rtx-4070', model: 'RTX 4070', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 12, tdp_watts: 200, msrp_usd: 599, current_price_usd: 549, in_stock: true, price_change_percent: -8, release_date: '2023-04-13', active: true },
    { id: 'rtx-4060-ti', slug: 'rtx-4060-ti', model: 'RTX 4060 Ti', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 8, tdp_watts: 160, msrp_usd: 399, current_price_usd: 379, in_stock: true, price_change_percent: -5, release_date: '2023-05-24', active: true },
    { id: 'rtx-4060', slug: 'rtx-4060', model: 'RTX 4060', brand: 'nvidia', architecture: 'Ada Lovelace', generation: 'RTX 4000', vram_gb: 8, tdp_watts: 115, msrp_usd: 299, current_price_usd: 289, in_stock: true, price_change_percent: -3, release_date: '2023-06-29', active: true },
    // AMD RDNA 4 (RX 9000)
    { id: 'rx-9070-xt', slug: 'rx-9070-xt', model: 'RX 9070 XT', brand: 'amd', architecture: 'RDNA 4', generation: 'RX 9000', vram_gb: 16, tdp_watts: 304, msrp_usd: 599, current_price_usd: 649, in_stock: false, price_change_percent: 8, release_date: '2025-03-19', active: true },
    { id: 'rx-9070', slug: 'rx-9070', model: 'RX 9070', brand: 'amd', architecture: 'RDNA 4', generation: 'RX 9000', vram_gb: 16, tdp_watts: 220, msrp_usd: 549, current_price_usd: 579, in_stock: true, price_change_percent: 5, release_date: '2025-03-19', active: true },
    { id: 'rx-9060-xt', slug: 'rx-9060-xt', model: 'RX 9060 XT', brand: 'amd', architecture: 'RDNA 4', generation: 'RX 9000', vram_gb: 16, tdp_watts: 150, msrp_usd: 299, current_price_usd: 329, in_stock: true, price_change_percent: 10, release_date: '2025-06-05', active: true },
    // AMD RDNA 3 (RX 7000)
    { id: 'rx-7900-xtx', slug: 'rx-7900-xtx', model: 'RX 7900 XTX', brand: 'amd', architecture: 'RDNA 3', generation: 'RX 7000', vram_gb: 24, tdp_watts: 355, msrp_usd: 999, current_price_usd: 899, in_stock: true, price_change_percent: -10, release_date: '2022-12-13', active: true },
    { id: 'rx-7900-xt', slug: 'rx-7900-xt', model: 'RX 7900 XT', brand: 'amd', architecture: 'RDNA 3', generation: 'RX 7000', vram_gb: 20, tdp_watts: 300, msrp_usd: 899, current_price_usd: 749, in_stock: true, price_change_percent: -17, release_date: '2022-12-13', active: true },
    { id: 'rx-7800-xt', slug: 'rx-7800-xt', model: 'RX 7800 XT', brand: 'amd', architecture: 'RDNA 3', generation: 'RX 7000', vram_gb: 16, tdp_watts: 263, msrp_usd: 499, current_price_usd: 479, in_stock: true, price_change_percent: -4, release_date: '2023-09-06', active: true },
    { id: 'rx-7700-xt', slug: 'rx-7700-xt', model: 'RX 7700 XT', brand: 'amd', architecture: 'RDNA 3', generation: 'RX 7000', vram_gb: 12, tdp_watts: 245, msrp_usd: 449, current_price_usd: 419, in_stock: true, price_change_percent: -7, release_date: '2023-09-07', active: true },
    { id: 'rx-7600', slug: 'rx-7600', model: 'RX 7600', brand: 'amd', architecture: 'RDNA 3', generation: 'RX 7000', vram_gb: 8, tdp_watts: 165, msrp_usd: 269, current_price_usd: 259, in_stock: true, price_change_percent: -4, release_date: '2023-05-25', active: true },
]

const RETAILERS = ['amazon', 'bestbuy', 'newegg', 'bh_photo', 'micro_center', 'adorama', 'antonline', 'cdw']

const RETAILER_LABELS: Record<string, string> = {
    amazon: 'Amazon',
    bestbuy: 'Best Buy',
    newegg: 'Newegg',
    bh_photo: 'B&H Photo',
    micro_center: 'Micro Center',
    adorama: 'Adorama',
    antonline: 'Antonline',
    cdw: 'CDW'
}

// Affiliate URL generation
const AFFILIATE_IDS: Record<string, string> = {
    amazon: process.env.AMAZON_AFFILIATE_ID || '',
    ebay: process.env.EBAY_AFFILIATE_ID || '',
    newegg: process.env.NEWEGG_AFFILIATE_ID || '',
    bh_photo: process.env.BH_AFFILIATE_ID || '',
    bestbuy: process.env.BESTBUY_AFFILIATE_ID || '',
    adorama: process.env.ADORAMA_AFFILIATE_ID || '',
    antonline: process.env.ANTONLINE_AFFILIATE_ID || '',
    cdw: process.env.CDW_AFFILIATE_ID || '',
    micro_center: process.env.MICROCENTER_AFFILIATE_ID || '',
}

function generateSearchUrl(retailer: string, gpuModel: string): string {
    const query = encodeURIComponent(gpuModel)
    const searchUrls: Record<string, string> = {
        amazon: `https://www.amazon.com/s?k=${query.replace(/ /g, '+')}`,
        bestbuy: `https://www.bestbuy.com/site/searchpage.jsp?st=${query.replace(/ /g, '+')}`,
        newegg: `https://www.newegg.com/p/pl?d=${query.replace(/ /g, '+')}`,
        bh_photo: `https://bhphotovideo.com/c/search?q=${query.replace(/ /g, '%20')}`,
        micro_center: `https://www.microcenter.com/search/search_results.aspx?N=&Ntt=${query.replace(/ /g, '+')}`,
        adorama: `https://www.adorama.com/search?query=${query.replace(/ /g, '%20')}`,
        antonline: `https://www.antonline.com/search?q=${query.replace(/ /g, '+')}`,
        cdw: `https://cdw.com/search/?key=${query.replace(/ /g, '%20')}`
    }
    return searchUrls[retailer] || '#'
}

function generateAffiliateUrl(retailer: string, gpuModel: string): string | null {
    const affiliateId = AFFILIATE_IDS[retailer]
    if (!affiliateId) return null

    const query = encodeURIComponent(gpuModel)

    switch (retailer) {
        case 'amazon':
            return `https://www.amazon.com/s?k=${query.replace(/ /g, '+')}&tag=${affiliateId}`
        case 'newegg':
            return `https://www.newegg.com/p/pl?d=${query.replace(/ /g, '+')}&a=${affiliateId}`
        case 'bh_photo':
            return `https://www.bhphotovideo.com/c/search?q=${query.replace(/ /g, '%20')}&aff=${affiliateId}`
        case 'bestbuy':
            return `https://www.bestbuy.com/site/searchpage.jsp?st=${query.replace(/ /g, '+')}&ref=${affiliateId}`
        default:
            return null
    }
}

// ===== GPU API Routes =====

// Get all GPUs
router.get('/gpus', async (req, res) => {
    const { brand, inStock } = req.query

    // Get latest prices from database
    const offers = await sql`
        SELECT DISTINCT ON (gpu_id, retailer) 
            gpu_id, retailer, price, in_stock, updated_at
        FROM retailer_offers
        ORDER BY gpu_id, retailer, updated_at DESC
    `

    const offersMap = new Map()
    for (const offer of offers) {
        if (!offersMap.has(offer.gpu_id)) {
            offersMap.set(offer.gpu_id, [])
        }
        offersMap.get(offer.gpu_id).push(offer)
    }

    let result = GPU_CATALOG.map(gpu => {
        const gpuOffers = offersMap.get(gpu.id) || []
        const retailerData: Record<string, any> = {}

        for (const retailer of RETAILERS) {
            const offer = gpuOffers.find((o: any) => o.retailer === retailer)
            const searchUrl = generateSearchUrl(retailer, gpu.model)
            const affiliateUrl = generateAffiliateUrl(retailer, gpu.model)

            retailerData[retailer] = {
                name: RETAILER_LABELS[retailer],
                url: searchUrl,
                affiliateUrl: affiliateUrl,
                price: offer?.price || gpu.current_price_usd,
                inStock: offer?.in_stock ?? gpu.in_stock,
                verified: !!offer
            }
        }

        const hasVerifiedInStock = Object.values(retailerData).some((r: any) => r.verified && r.inStock)
        const hasVerifiedOutOfStock = Object.values(retailerData).some((r: any) => r.verified && !r.inStock)

        return {
            ...gpu,
            retailers: retailerData,
            stockStatus: hasVerifiedInStock ? 'in_stock' : hasVerifiedOutOfStock ? 'out_of_stock' : 'unknown',
            stockVerified: Object.values(retailerData).some((r: any) => r.verified)
        }
    })

    // Filter by brand
    if (brand) {
        result = result.filter(g => g.brand === (brand as string).toLowerCase())
    }

    // Filter by stock status
    if (inStock === 'true') {
        result = result.filter(g => g.stockStatus === 'in_stock')
    }

    res.json(result)
})

// Get single GPU
router.get('/gpus/:slug', async (req, res) => {
    const gpu = GPU_CATALOG.find(g => g.slug === req.params.slug)
    if (!gpu) return res.status(404).json({ error: 'GPU not found' })

    // Get latest offers from database
    const offers = await sql`
        SELECT DISTINCT ON (retailer) 
            retailer, price, in_stock, updated_at
        FROM retailer_offers
        WHERE gpu_id = ${gpu.id}
        ORDER BY retailer, updated_at DESC
    `

    const offersMap = new Map(offers.map((o: any) => [o.retailer, o]))

    const retailerData: Record<string, any> = {}
    for (const retailer of RETAILERS) {
        const offer = offersMap.get(retailer)
        const searchUrl = generateSearchUrl(retailer, gpu.model)
        const affiliateUrl = generateAffiliateUrl(retailer, gpu.model)

        retailerData[retailer] = {
            name: RETAILER_LABELS[retailer],
            url: searchUrl,
            affiliateUrl: affiliateUrl,
            price: offer?.price || gpu.current_price_usd,
            inStock: offer?.in_stock ?? gpu.in_stock,
            verified: !!offer
        }
    }

    res.json({
        ...gpu,
        retailers: retailerData,
        stockVerified: Object.values(retailerData).some((r: any) => r.verified)
    })
})

// Get retailers list
router.get('/retailers', (_req, res) => {
    const retailerList = RETAILERS.map(id => ({
        id,
        name: RETAILER_LABELS[id],
        url: `https://${id === 'bh_photo' ? 'bhphotovideo.com' : id + '.com'}`
    }))
    res.json(retailerList)
})

// ===== Alert API Routes =====

// Create a price alert
router.post('/alerts', async (req, res) => {
    try {
        const { email, gpu_id, gpu_name, target_price, notify_on_any_drop } = req.body

        if (!email || !gpu_id || !gpu_name) {
            return res.status(400).json({ error: 'Missing required fields: email, gpu_id, gpu_name' })
        }

        // Check if alert already exists
        const [existing] = await sql`
            SELECT id FROM gpu_watches
            WHERE email = ${email} AND gpu_id = ${gpu_id}
        `

        if (existing) {
            // Update existing alert
            await sql`
                UPDATE gpu_watches
                SET target_price_usd = ${target_price || null},
                    notify_on_any_drop = ${notify_on_any_drop || false},
                    updated_at = NOW()
                WHERE id = ${existing.id}
            `
            res.json({ success: true, message: 'Alert updated', alertId: existing.id })
        } else {
            // Create new alert
            const [newAlert] = await sql`
                INSERT INTO gpu_watches (email, gpu_id, target_price_usd, notify_on_any_drop)
                VALUES (${email}, ${gpu_id}, ${target_price || null}, ${notify_on_any_drop || false})
                RETURNING id
            `
            res.json({ success: true, message: 'Alert created', alertId: newAlert.id })
        }
    } catch (error) {
        console.error('Error creating alert:', error)
        res.status(500).json({ error: 'Failed to create alert' })
    }
})

// Get alerts for an email
router.get('/alerts', async (req, res) => {
    try {
        const { email } = req.query

        if (!email) {
            return res.status(400).json({ error: 'Email parameter required' })
        }

        const alerts = await sql`
            SELECT 
                w.id,
                w.gpu_id,
                g.model as gpu_name,
                w.target_price_usd as target_price,
                w.notify_on_any_drop,
                w.created_at,
                w.last_notified_at
            FROM gpu_watches w
            JOIN gpus g ON g.id = w.gpu_id
            WHERE w.email = ${email}
            ORDER BY w.created_at DESC
        `

        res.json({ alerts })
    } catch (error) {
        console.error('Error fetching alerts:', error)
        res.status(500).json({ error: 'Failed to fetch alerts' })
    }
})

// Delete an alert
router.delete('/alerts/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { email } = req.query

        if (!email) {
            return res.status(400).json({ error: 'Email parameter required' })
        }

        const result = await sql`
            DELETE FROM gpu_watches
            WHERE id = ${id} AND email = ${email}
            RETURNING id
        `

        if (result.length === 0) {
            return res.status(404).json({ error: 'Alert not found' })
        }

        res.json({ success: true, message: 'Alert deleted' })
    } catch (error) {
        console.error('Error deleting alert:', error)
        res.status(500).json({ error: 'Failed to delete alert' })
    }
})

// Subscribe to general alerts
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email required' })
        }

        // Upsert subscriber
        await sql`
            INSERT INTO subscribers (email, is_active, subscribed_at)
            VALUES (${email}, true, NOW())
            ON CONFLICT (email) DO UPDATE
            SET is_active = true, unsubscribed_at = NULL
        `

        // Send welcome email asynchronously
        sendWelcomeEmail({ toEmail: email }).catch((err: Error) => {
            console.error('Failed to send welcome email:', err)
        })

        res.json({ success: true, message: 'Subscribed successfully' })
    } catch (error) {
        console.error('Error subscribing:', error)
        res.status(500).json({ error: 'Failed to subscribe' })
    }
})

// Unsubscribe
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email required' })
        }

        await sql`
            UPDATE subscribers
            SET is_active = false, unsubscribed_at = NOW()
            WHERE email = ${email}
        `

        res.json({ success: true, message: 'Unsubscribed successfully' })
    } catch (error) {
        console.error('Error unsubscribing:', error)
        res.status(500).json({ error: 'Failed to unsubscribe' })
    }
})

export { router }
