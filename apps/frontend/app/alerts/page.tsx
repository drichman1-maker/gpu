import type { Metadata } from 'next'
import { GPU_SEED } from '@gpuwatch/domain'
import { revalidatePath } from 'next/cache'

export const metadata: Metadata = {
    title: 'Price Alerts — GPUWatch',
    description: 'Get email alerts when your target GPU hits your price. Set your target and we\'ll notify you instantly.',
}

async function createWatch(formData: FormData) {
    'use server'
    const { getDB } = await import('@gpuwatch/infra')
    const sql = getDB()

    const email = formData.get('email') as string
    const gpuId = formData.get('gpu_id') as string
    const targetPrice = formData.get('target_price') ? Number(formData.get('target_price')) : null
    const notifyInStock = formData.get('notify_in_stock') === 'on'

    if (!email || !gpuId) return

    await sql`
    INSERT INTO gpu_watches (email, gpu_id, target_price_usd, notify_in_stock)
    VALUES (${email}, ${gpuId}, ${targetPrice}, ${notifyInStock})
    ON CONFLICT (email, gpu_id) DO UPDATE SET
      target_price_usd = EXCLUDED.target_price_usd,
      notify_in_stock = EXCLUDED.notify_in_stock
  `
    revalidatePath('/alerts')
}

// Load GPU list from DB for the select
async function getGPUList() {
    const { getDB } = await import('@gpuwatch/infra')
    const sql = getDB()
    return sql`SELECT id, model, slug, msrp_usd FROM gpus WHERE active = TRUE ORDER BY msrp_usd ASC`
}

export default async function AlertsPage({
    searchParams,
}: {
    searchParams: { gpu?: string; success?: string }
}) {
    const gpus = await getGPUList()
    const preselectedGpu = gpus.find((g: any) => g.slug === searchParams.gpu)

    return (
        <div className="container container--narrow" style={{ paddingTop: 60, paddingBottom: 80 }}>
            <h1 style={{ marginBottom: 8 }}>GPU Price Alerts</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 40 }}>
                Set your target price and we'll email you the moment a GPU drops below it.
                No account required.
            </p>

            {searchParams.success && (
                <div
                    className="badge badge--green"
                    style={{ marginBottom: 24, padding: '12px 16px', fontSize: 13, borderRadius: 8, display: 'block', width: '100%', textAlign: 'center' }}
                >
                    ✅ Alert set! You'll receive an email when that GPU hits your price.
                </div>
            )}

            <form action={createWatch} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <label htmlFor="gpu_id" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        GPU to Watch
                    </label>
                    <select
                        id="gpu_id"
                        name="gpu_id"
                        className="input"
                        defaultValue={preselectedGpu?.id ?? ''}
                        required
                    >
                        <option value="">Select a GPU...</option>
                        {(gpus as any[]).map((g: any) => (
                            <option key={g.id} value={g.id}>
                                {g.model} (MSRP ${Number(g.msrp_usd).toFixed(0)})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="email" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="input"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="target_price" style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Target Price (USD) — <span style={{ color: 'var(--text-muted)' }}>leave blank for any drop</span>
                    </label>
                    <input
                        id="target_price"
                        name="target_price"
                        type="number"
                        step="0.01"
                        min="1"
                        className="input"
                        placeholder="e.g. 499.99"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                        id="notify_in_stock"
                        name="notify_in_stock"
                        type="checkbox"
                        style={{ width: 16, height: 16, accentColor: 'var(--blue)' }}
                    />
                    <label htmlFor="notify_in_stock" style={{ fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        Also notify me when this GPU comes back in stock
                    </label>
                </div>

                <button type="submit" className="btn btn--primary" style={{ fontSize: 15, padding: '12px 24px', justifyContent: 'center' }}>
                    🔔 Set Alert
                </button>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    We only email when your alert triggers. No marketing. Ever.
                    See our <a href="/privacy" style={{ color: 'var(--blue)' }}>Privacy Policy</a>.
                </p>
            </form>
        </div>
    )
}
