'use client'

import { useState } from 'react'

const ADMIN_KEY = 'robotatlas-admin-2026'

interface FormData {
  modelName: string
  brand: string
  category: string
  status: string
  price: string
  amazonUrl: string
  mainImage: string
  navigationScore: string
  obstacleAvoidanceScore: string
  automationLevel: string
  maintenanceIndependence: string
}

const defaultForm: FormData = {
  modelName: '',
  brand: '',
  category: 'robot-vacuums',
  status: 'released',
  price: '',
  amazonUrl: '',
  mainImage: '',
  navigationScore: '',
  obstacleAvoidanceScore: '',
  automationLevel: '',
  maintenanceIndependence: '',
}

export default function AddRobotForm() {
  const [form, setForm] = useState<FormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; slug?: string; error?: string } | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/add-robot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify({
          ...form,
          price: form.price ? Number(form.price) : 0,
          navigationScore: form.navigationScore ? Number(form.navigationScore) : null,
          obstacleAvoidanceScore: form.obstacleAvoidanceScore ? Number(form.obstacleAvoidanceScore) : null,
          automationLevel: form.automationLevel ? Number(form.automationLevel) : null,
          maintenanceIndependence: form.maintenanceIndependence ? Number(form.maintenanceIndependence) : null,
        }),
      })

      const data = await res.json()
      setResult(data)
      if (data.success) setForm(defaultForm)
    } catch {
      setResult({ success: false, error: 'Network error — check console' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition text-sm"
  const labelClass = "block text-xs text-gray-500 uppercase tracking-widest mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Result banner */}
      {result && (
        <div className={`p-4 rounded-xl border text-sm ${result.success
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {result.success ? (
            <span>
              ✓ Robot added successfully.{' '}
              <a href={`/robot/${result.slug}`} className="underline hover:text-white transition">
                View {result.slug} →
              </a>
            </span>
          ) : (
            <span>✗ Error: {result.error}</span>
          )}
        </div>
      )}

      {/* Core Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Model Name *</label>
          <input name="modelName" value={form.modelName} onChange={handleChange} required placeholder="e.g. Roborock S8 Pro Ultra" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Brand *</label>
          <input name="brand" value={form.brand} onChange={handleChange} required placeholder="e.g. Roborock" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            <option value="robot-vacuums">Robot Vacuums</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="released">Released</option>
            <option value="announced">Announced</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Pricing & Links */}
      <div className="border-t border-white/5 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Pricing & Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price (USD)</label>
            <input name="price" value={form.price} onChange={handleChange} type="number" min="0" step="0.01" placeholder="799.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Amazon URL</label>
            <input name="amazonUrl" value={form.amazonUrl} onChange={handleChange} type="url" placeholder="https://amazon.com/dp/..." className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Main Image URL</label>
            <input name="mainImage" value={form.mainImage} onChange={handleChange} type="url" placeholder="https://..." className={inputClass} />
          </div>
        </div>
      </div>

      {/* Autonomy Scores */}
      <div className="border-t border-white/5 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Autonomy Scores <span className="text-gray-600">(0–100)</span></h3>
        <p className="text-xs text-gray-600 mb-4">RAI total score is computed as the average of the four sub-scores.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Navigation</label>
            <input name="navigationScore" value={form.navigationScore} onChange={handleChange} type="number" min="0" max="100" placeholder="85" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Obstacle Avoid.</label>
            <input name="obstacleAvoidanceScore" value={form.obstacleAvoidanceScore} onChange={handleChange} type="number" min="0" max="100" placeholder="80" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Automation</label>
            <input name="automationLevel" value={form.automationLevel} onChange={handleChange} type="number" min="0" max="100" placeholder="90" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Maintenance</label>
            <input name="maintenanceIndependence" value={form.maintenanceIndependence} onChange={handleChange} type="number" min="0" max="100" placeholder="88" className={inputClass} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-black font-bold rounded-xl transition text-sm tracking-wide"
      >
        {loading ? 'Adding Robot...' : 'Add Robot to Index'}
      </button>
    </form>
  )
}
