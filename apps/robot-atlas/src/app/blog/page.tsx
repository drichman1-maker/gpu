import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BLOG_POSTS } from '@/lib/blog-data';

export const metadata: Metadata = {
    title: 'Robot Vacuum Blog — Buying Guides, Comparisons & 2026 Trends',
    description: 'Expert robot vacuum buying guides, head-to-head comparisons, price analysis, and industry trends from RobotAtlas. Data-backed recommendations powered by the Robot Autonomy Index.',
    openGraph: {
        title: 'RobotAtlas Blog — Robot Vacuum Buying Guides & Trends',
        description: 'Expert buying guides, brand comparisons, and 2026 trend analysis powered by the Robot Autonomy Index.',
    },
};

const CATEGORY_COLORS: Record<string, string> = {
    'Buying Guide': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Comparison': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Trend Report': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Price Analysis': 'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function BlogPage() {
    const featured = BLOG_POSTS.find(p => p.featured) ?? BLOG_POSTS[0]!;
    const rest = BLOG_POSTS.filter(p => p.slug !== featured.slug);
    const categories = ['All', ...new Set(BLOG_POSTS.map(p => p.category))];

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-28 pb-12 px-4 max-w-7xl mx-auto border-b border-white/5">
                <div className="inline-block px-3 py-1 mb-4 border border-cyan-500/30 bg-cyan-900/10 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full">
                    RobotAtlas Blog
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    Guides, Comparisons &<br className="hidden md:block" /> Industry Intelligence
                </h1>
                <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                    Data-backed robot vacuum recommendations powered by the Robot Autonomy Index. No sponsored picks, no fluff.
                </p>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Featured Post */}
                <Link
                    href={`/blog/${featured.slug}`}
                    className="block group mb-16 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
                >
                    <div className="p-8 md:p-10">
                        <div className="flex gap-3 mb-5 flex-wrap">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[featured.category]}`}>
                                {featured.category}
                            </span>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                                ★ Featured
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-cyan-400 transition-colors leading-tight">
                            {featured.title}
                        </h2>
                        <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-3xl">
                            {featured.excerpt}
                        </p>

                        {/* Hero Stats Bar */}
                        {featured.heroStats && (
                            <div className="flex flex-wrap gap-6 mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                {featured.heroStats.map(stat => (
                                    <div key={stat.label} className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-cyan-400">{stat.value}</span>
                                        {stat.sub && <span className="text-sm text-gray-500">{stat.sub}</span>}
                                        <span className="text-xs text-gray-500 uppercase tracking-wider ml-1">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4 text-sm text-gray-500">
                            <span>{new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span>·</span>
                            <span>{featured.readTime} read</span>
                        </div>
                    </div>
                </Link>

                {/* Category Filters */}
                <div className="flex gap-2 mb-10 flex-wrap">
                    {categories.map(cat => (
                        <span
                            key={cat}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-colors ${
                                cat === 'All'
                                    ? 'bg-white/10 text-white border-white/20'
                                    : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                            }`}
                        >
                            {cat}
                        </span>
                    ))}
                </div>

                {/* Post Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map(post => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group block rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all duration-300 p-6"
                        >
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full border mb-4 ${CATEGORY_COLORS[post.category]}`}>
                                {post.category}
                            </span>
                            <h3 className="text-base font-bold mb-3 group-hover:text-cyan-400 transition-colors leading-snug">
                                {post.title}
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                {post.excerpt}
                            </p>
                            <div className="flex gap-3 text-xs text-gray-600">
                                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span>·</span>
                                <span>{post.readTime}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
