'use client'
import { useState } from 'react'
import type { GPU } from '@gpuwatch/domain'

export function AdminPanel({ gpus }: { gpus: GPU[] }) {
    const [activeTab, setActiveTab] = useState<'gpus' | 'skus' | 'links'>('gpus')

    return (
        <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                {([['gpus', '📦 GPUs'], ['skus', '🔗 SKU Mapper'], ['links', '✅ Link Validator']] as const).map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn ${activeTab === tab ? 'btn--primary' : 'btn--ghost'}`}
                        style={{ fontSize: 13 }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'gpus' && <GPUManager gpus={gpus} />}
            {activeTab === 'skus' && <SKUMapper gpus={gpus} />}
            {activeTab === 'links' && <LinkValidator gpus={gpus} />}
        </div>
    )
}

// ─── GPU Manager ────────────────────────────────────────────────────────────
function GPUManager({ gpus }: { gpus: GPU[] }) {
    const [adding, setAdding] = useState(false)
    const [form, setForm] = useState({
        model: '', slug: '', brand: 'nvidia', architecture: 'Blackwell',
        generation: 'RTX 5000', vram_gb: 8, tdp_watts: '', msrp_usd: '', release_date: '',
    })

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        const res = await fetch('/api/admin/gpu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            setAdding(false)
            setForm({ model: '', slug: '', brand: 'nvidia', architecture: 'Blackwell', generation: 'RTX 5000', vram_gb: 8, tdp_watts: '', msrp_usd: '', release_date: '' })
            window.location.reload()
        }
    }

    async function toggleActive(id: string, active: boolean) {
        await fetch(`/api/admin/gpu/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !active }),
        })
        window.location.reload()
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>GPU Catalog ({gpus.length} total)</h3>
                <button onClick={() => setAdding(true)} className="btn btn--primary" style={{ fontSize: 13 }}>
                    + Add GPU
                </button>
            </div>

            {adding && (
                <form onSubmit={handleAdd} className="card" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <h4>Add New GPU</h4>
                    <div className="grid-2">
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Model Name *</label>
                            <input className="input" placeholder="RTX 5070" value={form.model}
                                onChange={e => setForm(f => ({ ...f, model: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Slug *</label>
                            <input className="input" placeholder="rtx-5070" value={form.slug}
                                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Brand</label>
                            <select className="input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                                <option value="nvidia">NVIDIA</option>
                                <option value="amd">AMD</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Architecture</label>
                            <select className="input" value={form.architecture} onChange={e => setForm(f => ({ ...f, architecture: e.target.value }))}>
                                {['Blackwell', 'Ada Lovelace', 'RDNA 4', 'RDNA 3'].map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>VRAM (GB) *</label>
                            <input type="number" className="input" value={form.vram_gb} min={1}
                                onChange={e => setForm(f => ({ ...f, vram_gb: Number(e.target.value) }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MSRP (USD) *</label>
                            <input type="number" className="input" placeholder="499" value={form.msrp_usd}
                                onChange={e => setForm(f => ({ ...f, msrp_usd: e.target.value }))} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TDP Watts</label>
                            <input type="number" className="input" placeholder="250" value={form.tdp_watts}
                                onChange={e => setForm(f => ({ ...f, tdp_watts: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Release Date</label>
                            <input type="date" className="input" value={form.release_date}
                                onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn--primary" style={{ fontSize: 13 }}>Save GPU</button>
                        <button type="button" onClick={() => setAdding(false)} className="btn btn--outline" style={{ fontSize: 13 }}>Cancel</button>
                    </div>
                </form>
            )}

            <div className="card" style={{ padding: 0 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Brand</th>
                            <th>VRAM</th>
                            <th>MSRP</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gpus.map(gpu => (
                            <tr key={gpu.id} style={{ opacity: gpu.active ? 1 : 0.45 }}>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{gpu.model}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{gpu.slug}</div>
                                </td>
                                <td style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{gpu.brand}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{gpu.vram_gb}GB</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>${gpu.msrp_usd.toFixed(0)}</td>
                                <td>
                                    <span className={`badge ${gpu.active ? 'badge--green' : 'badge--red'}`} style={{ fontSize: 10 }}>
                                        {gpu.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => toggleActive(gpu.id, gpu.active)}
                                        className={`btn btn--ghost`}
                                        style={{ fontSize: 12 }}
                                    >
                                        {gpu.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── SKU Mapper ─────────────────────────────────────────────────────────────
function SKUMapper({ gpus }: { gpus: GPU[] }) {
    const [form, setForm] = useState({ gpu_id: '', retailer: 'bestbuy', retailer_sku: '', retailer_model_name: '', affiliate_url: '' })

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        await fetch('/api/admin/sku', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setForm({ gpu_id: '', retailer: 'bestbuy', retailer_sku: '', retailer_model_name: '', affiliate_url: '' })
    }

    return (
        <div>
            <h3 style={{ marginBottom: 20 }}>SKU Mapper</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Map retailer-specific SKUs to canonical GPUs. This lets connectors look up the right product ID without code changes.
            </p>
            <form onSubmit={handleAdd} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div className="grid-2">
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>GPU *</label>
                        <select className="input" value={form.gpu_id} onChange={e => setForm(f => ({ ...f, gpu_id: e.target.value }))} required>
                            <option value="">Select GPU...</option>
                            {gpus.map(g => <option key={g.id} value={g.id}>{g.model}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Retailer *</label>
                        <select className="input" value={form.retailer} onChange={e => setForm(f => ({ ...f, retailer: e.target.value }))}>
                            {['bestbuy', 'amazon', 'newegg', 'bh_photo'].map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Retailer SKU *</label>
                        <input className="input" placeholder="e.g. 6614151 (BB) or B09NYPD8H7 (ASIN)" value={form.retailer_sku}
                            onChange={e => setForm(f => ({ ...f, retailer_sku: e.target.value }))} required />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Retailer Model Name</label>
                        <input className="input" placeholder="As shown on retailer site" value={form.retailer_model_name}
                            onChange={e => setForm(f => ({ ...f, retailer_model_name: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Custom Affiliate URL (optional)</label>
                        <input className="input" placeholder="Leave blank — auto-generated from /out/{slug}/{retailer}" value={form.affiliate_url}
                            onChange={e => setForm(f => ({ ...f, affiliate_url: e.target.value }))} />
                    </div>
                </div>
                <button type="submit" className="btn btn--primary" style={{ fontSize: 13, alignSelf: 'flex-start' }}>Add SKU Mapping</button>
            </form>
        </div>
    )
}

// ─── Link Validator ──────────────────────────────────────────────────────────
function LinkValidator({ gpus }: { gpus: GPU[] }) {
    const [results, setResults] = useState<Array<{ gpu: string; retailer: string; url: string; status: 'ok' | 'error' | 'checking' }>>([])
    const [running, setRunning] = useState(false)

    async function runValidation() {
        setRunning(true)
        const res = await fetch('/api/admin/validate-links')
        if (res.ok) {
            const data = await res.json()
            setResults(data.results)
        }
        setRunning(false)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h3>Affiliate Link Validator</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Bulk-checks all /out/ redirect links and retailer URLs for 200 responses.
                    </p>
                </div>
                <button onClick={runValidation} disabled={running} className="btn btn--primary" style={{ fontSize: 13 }}>
                    {running ? '⏳ Checking...' : '▶ Run Validation'}
                </button>
            </div>

            {results.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr><th>GPU</th><th>Retailer</th><th>Status</th><th>URL</th></tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, fontSize: 13 }}>{r.gpu}</td>
                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.retailer}</td>
                                    <td>
                                        <span className={`badge ${r.status === 'ok' ? 'badge--green' : 'badge--red'}`} style={{ fontSize: 10 }}>
                                            {r.status === 'ok' ? '✓ OK' : '✗ Error'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.url}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
