'use client'

import type { Metadata } from 'next'
import { useState, useEffect } from 'react'
import { Bell, Check, AlertTriangle, Loader2, Mail } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gpudrip-backend.fly.dev'
const MAX_GPUS = 5

interface GPU {
    id: string
    model: string
    slug: string
    msrp_usd: number
}

export default function AlertsPage() {
    const [gpus, setGpus] = useState<GPU[]>([])
    const [selectedGPUs, setSelectedGPUs] = useState<string[]>([])
    const [targetPrices, setTargetPrices] = useState<Record<string, string>>({})
    const [email, setEmail] = useState('')
    const [notifyInStock, setNotifyInStock] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'success' | 'error' | null>(null)
    const [message, setMessage] = useState('')

    // Load GPU list
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/gpus`)
            .then(r => r.json())
            .then(data => {
                const activeGpus = (data.gpus || data || []).filter((g: GPU) => g.model)
                setGpus(activeGpus.sort((a: GPU, b: GPU) => a.msrp_usd - b.msrp_usd))
            })
    }, [])

    const toggleGPU = (gpuId: string) => {
        if (selectedGPUs.includes(gpuId)) {
            setSelectedGPUs(selectedGPUs.filter(id => id !== gpuId))
            const newPrices = { ...targetPrices }
            delete newPrices[gpuId]
            setTargetPrices(newPrices)
        } else {
            if (selectedGPUs.length >= MAX_GPUS) return
            setSelectedGPUs([...selectedGPUs, gpuId])
        }
    }

    const updateTargetPrice = (gpuId: string, price: string) => {
        setTargetPrices({ ...targetPrices, [gpuId]: price })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || selectedGPUs.length === 0) return

        setLoading(true)
        setStatus(null)

        try {
            const results = []

            for (const gpuId of selectedGPUs) {
                const gpu = gpus.find(g => g.id === gpuId)
                if (!gpu) continue

                const response = await fetch(`${API_BASE_URL}/api/alerts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        gpu_id: gpuId,
                        gpu_name: gpu.model,
                        target_price: targetPrices[gpuId] ? parseFloat(targetPrices[gpuId]) : null,
                        notify_on_any_drop: notifyInStock
                    }),
                })

                const data = await response.json()
                results.push({ gpu: gpu.model, success: response.ok })
            }

            const successCount = results.filter(r => r.success).length

            if (successCount === selectedGPUs.length) {
                setStatus('success')
                setMessage(`Alerts set for ${successCount} GPU${successCount > 1 ? 's' : ''}!`)
                setSelectedGPUs([])
                setTargetPrices({})
            } else {
                setStatus('error')
                setMessage(`${successCount}/${selectedGPUs.length} alerts created.`)
            }
        } catch {
            setStatus('error')
            setMessage('Network error. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container container--narrow" style={{ paddingTop: 60, paddingBottom: 80 }}>
            <div className="text-center mb-8">
                <div style={{ 
                    width: 64, height: 64, 
                    background: 'var(--blue)', 
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <Bell size={32} color="white" />
                </div>
                <h1 style={{ marginBottom: 8 }}>GPU Price Alerts</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    Get notified when GPU prices drop. Select up to {MAX_GPUS} GPUs.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Email */}
                <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <Mail size={14} style={{ display: 'inline', marginRight: 6 }} />
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="input"
                    />
                </div>

                {/* GPU Selection */}
                <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Select GPUs ({selectedGPUs.length}/{MAX_GPUS})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                        {gpus.map((gpu) => {
                            const selected = selectedGPUs.includes(gpu.id)
                            const disabled = !selected && selectedGPUs.length >= MAX_GPUS
                            return (
                                <button
                                    key={gpu.id}
                                    type="button"
                                    onClick={() => toggleGPU(gpu.id)}
                                    disabled={disabled}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 16px',
                                        background: selected ? 'var(--blue)' : 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 8,
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        opacity: disabled ? 0.5 : 1,
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{
                                        width: 20, height: 20,
                                        borderRadius: 4,
                                        background: selected ? 'white' : 'transparent',
                                        border: '2px solid ' + (selected ? 'white' : 'var(--text-muted)'),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {selected && <Check size={14} color="var(--blue)" />}
                                    </div>
                                    <span style={{ flex: 1, color: selected ? 'white' : 'var(--text)' }}>
                                        {gpu.model}
                                    </span>
                                    <span style={{ color: selected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', fontSize: 13 }}>
                                        MSRP ${gpu.msrp_usd}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Target Prices */}
                {selectedGPUs.length > 0 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Target Prices (optional)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {selectedGPUs.map(gpuId => {
                                const gpu = gpus.find(g => g.id === gpuId)
                                if (!gpu) return null
                                return (
                                    <div key={gpuId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ flex: 1, fontSize: 14 }}>{gpu.model}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>MSRP ${gpu.msrp_usd}</span>
                                        <input
                                            type="number"
                                            placeholder="Target $"
                                            value={targetPrices[gpuId] || ''}
                                            onChange={(e) => updateTargetPrice(gpuId, e.target.value)}
                                            className="input"
                                            style={{ width: 110 }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* In Stock Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                        id="notify_in_stock"
                        type="checkbox"
                        checked={notifyInStock}
                        onChange={(e) => setNotifyInStock(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--blue)' }}
                    />
                    <label htmlFor="notify_in_stock" style={{ fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        Also notify when GPUs come back in stock
                    </label>
                </div>

                {/* Status */}
                {status && (
                    <div style={{
                        padding: 12, borderRadius: 8,
                        background: status === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                        border: '1px solid ' + (status === 'success' ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)'),
                        color: status === 'success' ? '#4caf50' : '#f44336',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        {status === 'error' && <AlertTriangle size={16} />}
                        {message}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || !email || selectedGPUs.length === 0}
                    className="btn btn--primary"
                    style={{ 
                        fontSize: 15, 
                        padding: '14px 24px',
                        justifyContent: 'center',
                        opacity: (loading || !email || selectedGPUs.length === 0) ? 0.5 : 1
                    }}
                >
                    {loading ? (
                        <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Setting alerts...</>
                    ) : (
                        <><Bell size={18} /> Set {selectedGPUs.length} Alert{selectedGPUs.length !== 1 ? 's' : ''}</>
                    )}
                </button>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    We only email when your alert triggers. No spam. 
                    <a href="/privacy" style={{ color: 'var(--blue)' }}>Privacy Policy</a>
                </p>
            </form>
        </div>
    )
}
