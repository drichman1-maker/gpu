import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'GPU Blog — Buying Guides, News & Price Analysis',
    description: 'GPU buying guides, price drop analysis, and market news from the GPU Drip team. Know when to buy, what to buy, and where to get the best deal.',
    openGraph: {
        title: 'GPU Drip Blog — GPU Buying Guides & Price Analysis',
        description: 'Expert GPU buying guides, price history analysis, and market insights.',
    },
}

const POSTS = [
    {
        slug: 'rtx-5090-worth-it',
        title: 'Is the RTX 5090 Worth It? Price vs Performance Breakdown',
        excerpt: 'The RTX 5090 costs $1,999 MSRP — but street prices are much higher. We break down the performance-per-dollar vs the RTX 4090 and whether it makes sense to buy now or wait.',
        category: 'Buying Guide',
        date: '2026-02-15',
        readTime: '6 min',
    },
    {
        slug: 'best-gpu-under-500',
        title: 'Best GPUs Under $500 in 2026',
        excerpt: 'The mid-range GPU market is more competitive than ever. We rank the RX 9070 XT, RTX 5070, and RTX 4070 Super on pure performance-per-dollar at current street prices.',
        category: 'Buying Guide',
        date: '2026-02-01',
        readTime: '8 min',
    },
    {
        slug: 'refurbished-gpu-guide',
        title: 'Should You Buy a Refurbished GPU? A Complete Guide',
        excerpt: 'Certified refurbished GPUs can save you 20–40% vs new. We explain the difference between certified refurb, open-box, and used — and which retailers to trust.',
        category: 'Buying Guide',
        date: '2026-01-20',
        readTime: '7 min',
    },
    {
        slug: 'rx-9070-xt-price-history',
        title: 'RX 9070 XT Price History: When Will It Hit MSRP?',
        excerpt: 'The RX 9070 XT launched at $599 but has been selling above MSRP. We analyze 60 days of price data to forecast when it\'ll normalize and what triggers price drops.',
        category: 'Price Analysis',
        date: '2026-01-10',
        readTime: '5 min',
    },
    {
        slug: 'microcenter-vs-amazon-gpu',
        title: 'Micro Center vs Amazon for GPUs: Which Is Actually Cheaper?',
        excerpt: 'We compared 22 GPU prices at Micro Center and Amazon over 30 days. The results might surprise you — in-store prices aren\'t always the win they used to be.',
        category: 'Price Analysis',
        date: '2025-12-28',
        readTime: '4 min',
    },
    {
        slug: 'gpu-price-drop-timing',
        title: 'The Best Days and Times to Buy a GPU (Based on 6 Months of Data)',
        excerpt: 'GPU prices fluctuate daily. We analyzed 6 months of price data across Amazon, Best Buy, and Newegg to find patterns — including which day of the week has the most deals.',
        category: 'Price Analysis',
        date: '2025-12-15',
        readTime: '6 min',
    },
]

const CATEGORY_COLORS: Record<string, string> = {
    'Buying Guide': 'badge--blue',
    'Price Analysis': 'badge--green',
    'News': 'badge--yellow',
}

export default function BlogPage() {
    const featured = POSTS[0]!
    const rest = POSTS.slice(1)

    return (
        <div>
            <section style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ maxWidth: 600 }}>
                        <h1 style={{ marginBottom: 12 }}>GPU Drip Blog</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                            Buying guides, price analysis, and GPU market news — backed by real price data.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                {/* Featured post */}
                <div style={{ marginBottom: 48 }}>
                    <Link href={`/blog/${featured.slug}`} className="card card--hover" style={{ display: 'block' }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span className={`badge ${CATEGORY_COLORS[featured.category] ?? 'badge--blue'}`} style={{ fontSize: 11 }}>
                                {featured.category}
                            </span>
                            <span className="badge badge--blue" style={{ fontSize: 11, background: 'var(--blue)', color: 'white' }}>
                                Featured
                            </span>
                        </div>
                        <h2 style={{ marginBottom: 12, fontSize: 22 }}>{featured.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
                            {featured.excerpt}
                        </p>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>{new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span>·</span>
                            <span>{featured.readTime} read</span>
                        </div>
                    </Link>
                </div>

                {/* Category filters */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                    {['All', 'Buying Guide', 'Price Analysis'].map(cat => (
                        <span
                            key={cat}
                            className={`badge ${cat === 'All' ? 'badge--blue' : 'badge--blue'}`}
                            style={{ fontSize: 12, cursor: 'pointer', padding: '4px 12px' }}
                        >
                            {cat}
                        </span>
                    ))}
                </div>

                {/* Post grid */}
                <div className="grid-auto">
                    {rest.map(post => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="card card--hover" style={{ display: 'block' }}>
                            <div style={{ marginBottom: 10 }}>
                                <span className={`badge ${CATEGORY_COLORS[post.category] ?? 'badge--blue'}`} style={{ fontSize: 10 }}>
                                    {post.category}
                                </span>
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>
                                {post.title}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                                {post.excerpt.slice(0, 120)}…
                            </p>
                            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span>·</span>
                                <span>{post.readTime} read</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Newsletter CTA */}
                <div className="card" style={{ marginTop: 48, textAlign: 'center', padding: '40px 24px', borderColor: 'var(--border-focus)', background: 'var(--blue-dim)' }}>
                    <h3 style={{ marginBottom: 8 }}>Get GPU deal alerts + weekly market updates</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                        We'll email you when a GPU you're watching drops in price, plus a weekly roundup of the best deals.
                    </p>
                    <Link href="/alerts" className="btn btn--primary" style={{ fontSize: 15, padding: '10px 24px' }}>
                        🔔 Set Up Alerts
                    </Link>
                </div>
            </div>
        </div>
    )
}
