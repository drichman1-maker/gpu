import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
    if (_resend) return _resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(apiKey)
    return _resend
}

const FROM = process.env.RESEND_FROM ?? 'alerts@gpuwatch.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gpuwatch.com'

// ─── Email Templates ──────────────────────────────────────────────────────────

export interface PriceAlertPayload {
    toEmail: string
    gpuModel: string
    gpuSlug: string
    newPrice: number
    targetPrice: number | null
    retailer: string
    dealReason: string | null
    affiliateUrl: string
}

export async function sendPriceAlert(payload: PriceAlertPayload): Promise<void> {
    const resend = getResend()
    const {
        toEmail, gpuModel, gpuSlug, newPrice, targetPrice, retailer, dealReason, affiliateUrl
    } = payload

    const priceFormatted = `$${newPrice.toFixed(2)}`
    const gpuUrl = `${APP_URL}/gpu/${gpuSlug}`
    const outUrl = `${APP_URL}${affiliateUrl}`

    const subject = `🔥 ${gpuModel} price alert: ${priceFormatted} at ${retailerLabel(retailer)}`

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="background:#0d0d0d;color:#e5e5e5;font-family:Inter,system-ui,sans-serif;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px;">
      
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
        <span style="font-size:22px;font-weight:700;color:#fff;">⚡ GPUWatch</span>
      </div>
      
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#fff;">
        Price Alert Triggered
      </h1>
      <p style="margin:0 0 24px;color:#888;font-size:14px;">
        ${gpuModel} is now available at your target price.
      </p>
      
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#888;margin-bottom:4px;">CURRENT PRICE</div>
        <div style="font-size:36px;font-weight:800;color:#4ade80;">${priceFormatted}</div>
        ${targetPrice ? `<div style="font-size:13px;color:#666;margin-top:4px;">Your target: $${targetPrice.toFixed(2)}</div>` : ''}
        ${dealReason ? `<div style="margin-top:12px;background:#14532d;color:#4ade80;padding:6px 10px;border-radius:4px;font-size:12px;font-weight:600;">✓ ${dealReason}</div>` : ''}
      </div>
      
      <div style="margin-bottom:24px;">
        <div style="font-size:12px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Retailer</div>
        <div style="font-size:15px;color:#ccc;font-weight:600;">${retailerLabel(retailer)}</div>
      </div>
      
      <a href="${outUrl}"
         style="display:block;background:#2563eb;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-size:15px;font-weight:700;margin-bottom:16px;">
        Buy Now at ${retailerLabel(retailer)} →
      </a>
      <a href="${gpuUrl}"
         style="display:block;background:transparent;color:#888;text-decoration:none;text-align:center;padding:10px;border-radius:8px;font-size:13px;border:1px solid #222;">
        View full price history
      </a>
    </div>
    
    <p style="text-align:center;color:#555;font-size:11px;margin-top:20px;">
      GPUWatch · <a href="${APP_URL}/privacy" style="color:#666;">Privacy</a> · 
      <a href="${APP_URL}/api/unwatch?email=${encodeURIComponent(toEmail)}&gpu=${gpuSlug}" style="color:#666;">Unsubscribe</a><br/>
      Prices subject to change. We don't sell products. Affiliate disclosure: we may earn a commission.
    </p>
  </div>
</body>
</html>`

    await resend.emails.send({
        from: FROM,
        to: [toEmail],
        subject,
        html,
        text: `${gpuModel} is now ${priceFormatted} at ${retailerLabel(retailer)}.\n\nBuy now: ${outUrl}\nView price history: ${gpuUrl}\n\n--\nGPUWatch. Prices subject to change. Affiliate disclosure applies.`,
    })
}

function retailerLabel(retailer: string): string {
    const labels: Record<string, string> = {
        bestbuy: 'Best Buy',
        amazon: 'Amazon',
        newegg: 'Newegg',
        bh_photo: 'B&H Photo',
        microcenter: 'Micro Center',
    }
    return labels[retailer] ?? retailer
}

export { getResend }
