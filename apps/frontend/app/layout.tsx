import type { Metadata } from 'next'
import './globals.css'
import { NavBar } from '@/components/nav-bar'

export const metadata: Metadata = {
    title: { default: 'GPUWatch — GPU Price Tracker & Deal Alerts', template: '%s | GPUWatch' },
    description: 'Track GPU prices across Best Buy, Amazon, Newegg and more. Get deal alerts, price history charts, and stock notifications for RTX 5090, RTX 5080, RX 9070 XT, and all major GPUs.',
    keywords: ['GPU price tracker', 'RTX 5090 price', 'GPU deals', 'graphics card price comparison', 'GPU stock alerts'],
    authors: [{ name: 'GPUWatch' }],
    openGraph: {
        type: 'website',
        siteName: 'GPUWatch',
        title: 'GPUWatch — GPU Price Tracker & Deal Alerts',
        description: 'Real-time GPU price tracking, deal detection, and stock alerts across all major retailers.',
    },
    twitter: {
        card: 'summary_large_image',
    },
    robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <NavBar />
                <main>{children}</main>
                <footer style={{
                    borderTop: '1px solid var(--border)',
                    padding: '32px 0',
                    marginTop: '80px',
                }}>
                    <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, fontSize: 15 }}>⚡ GPU<span style={{ color: 'var(--blue)' }}>Watch</span></span>
                                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>— Price intelligence for GPUs</span>
                            </div>
                            <div style={{ display: 'flex', gap: 20 }}>
                                {[['Terms', '/terms'], ['Privacy', '/privacy'], ['About', '/about']].map(([label, href]) => (
                                    <a key={href} href={href} style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</a>
                                ))}
                            </div>
                        </div>
                        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                            Prices subject to change. GPUWatch does not sell products. We may earn affiliate commissions from qualifying purchases — this does not affect our pricing data or rankings. Data refreshed every 4–8 hours.
                        </p>
                    </div>
                </footer>
            </body>
        </html>
    )
}
