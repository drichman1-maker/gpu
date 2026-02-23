import type { Metadata } from 'next'
import { getDB } from '@gpuwatch/infra'
import type { GPU } from '@gpuwatch/domain'
import { AdminPanel } from '@/components/admin-panel'

export const metadata: Metadata = {
    title: 'Admin — GPUWatch',
    robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function getGPUs(): Promise<GPU[]> {
    const sql = getDB()
    return sql`SELECT * FROM gpus ORDER BY msrp_usd ASC`
}

export default async function AdminPage() {
    const gpus = await getGPUs()

    return (
        <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
            <div style={{ marginBottom: 32 }}>
                <div className="badge badge--yellow" style={{ marginBottom: 12 }}>Admin</div>
                <h1 style={{ marginBottom: 8 }}>GPUWatch Control Panel</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Manage GPU catalog, SKU mappings, and validate affiliate links. Changes take effect immediately.
                </p>
            </div>

            <AdminPanel gpus={gpus} />
        </div>
    )
}
