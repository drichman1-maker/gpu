import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog-data';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PageProps {
    params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  Category colours (matches blog listing page)                       */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, string> = {
    'Buying Guide': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Comparison': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Trend Report': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Price Analysis': 'bg-green-500/10 text-green-400 border-green-500/20',
};

/* ------------------------------------------------------------------ */
/*  Static params for SSG                                              */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return { title: 'Post Not Found — RobotAtlas' };
    }

    return {
        title: `${post.title} — RobotAtlas`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.date,
        },
    };
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) notFound();

    const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    // Related posts: same category, exclude current, limit 3
    const relatedPosts = BLOG_POSTS.filter(
        (p) => p.category === post.category && p.slug !== post.slug,
    ).slice(0, 3);

    const postBody = post.body;

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <Navbar />

            {/* Back link */}
            <div className="pt-28 px-4 max-w-4xl mx-auto">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-8"
                >
                    <span aria-hidden="true">←</span> All Articles
                </Link>
            </div>

            {/* Article header */}
            <header className="px-4 max-w-4xl mx-auto mb-10">
                {/* Category + Featured badge */}
                <div className="flex gap-3 mb-5 flex-wrap">
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[post.category]}`}
                    >
                        {post.category}
                    </span>
                    {post.featured && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                            ★ Featured
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-5">
                    {post.title}
                </h1>

                {/* Date + read time */}
                <div className="flex gap-4 text-sm text-gray-500">
                    <time dateTime={post.date}>{formattedDate}</time>
                    <span>·</span>
                    <span>{post.readTime} read</span>
                </div>
            </header>

            <div className="px-4 max-w-4xl mx-auto">
                {/* Hero Stats Bar */}
                {post.heroStats && post.heroStats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 p-5 rounded-xl bg-white/[0.03] border border-white/10">
                        {post.heroStats.map((stat) => (
                            <div key={stat.label} className="text-center sm:text-left">
                                <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
                                    <span className="text-2xl md:text-3xl font-bold text-cyan-400">
                                        {stat.value}
                                    </span>
                                    {stat.sub && (
                                        <span className="text-sm text-gray-500">{stat.sub}</span>
                                    )}
                                </div>
                                <p className="text-[11px] md:text-xs text-gray-500 uppercase tracking-wider mt-1">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Key Takeaways */}
                {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                    <section className="mb-10 p-5 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
                        <h2 className="text-base font-bold text-cyan-400 mb-4 flex items-center gap-2">
                            <span aria-hidden="true">💡</span> Key Takeaways
                        </h2>
                        <ul className="space-y-2.5">
                            {post.keyTakeaways.map((takeaway, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed">
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 shrink-0" />
                                    <span>{takeaway}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Article Body */}
                {postBody && (
                    <article
                        className="prose-article mb-10 text-gray-300 leading-relaxed text-[15px] md:text-base"
                        dangerouslySetInnerHTML={{ __html: postBody }}
                    />
                )}

                {/* Comparison Table */}
                {post.comparisonTable && (
                    <section className="mb-12">
                        <h2 className="text-xl font-bold mb-5 text-white">Comparison</h2>
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                            <table className="w-full min-w-[520px] text-sm">
                                <thead>
                                    <tr className="bg-white/[0.04] border-b border-white/10">
                                        {post.comparisonTable.headers.map((h) => (
                                            <th
                                                key={h}
                                                className="text-left px-4 py-3 font-semibold text-white whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {post.comparisonTable.rows.map((row, rowIdx) => (
                                        <tr
                                            key={rowIdx}
                                            className={`border-b border-white/5 last:border-b-0 ${
                                                rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                                            }`}
                                        >
                                            {row.map((cell, cellIdx) => (
                                                <td
                                                    key={cellIdx}
                                                    className={`px-4 py-3 whitespace-nowrap ${
                                                        cellIdx === 0
                                                            ? 'font-medium text-white'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="px-4 max-w-4xl mx-auto mb-14">
                    <h2 className="text-xl font-bold mb-6 text-white">Related Articles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {relatedPosts.map((related) => (
                            <Link
                                key={related.slug}
                                href={`/blog/${related.slug}`}
                                className="group block rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all duration-300 p-5"
                            >
                                <span
                                    className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full border mb-3 ${CATEGORY_COLORS[related.category]}`}
                                >
                                    {related.category}
                                </span>
                                <h3 className="text-sm font-bold mb-2 group-hover:text-cyan-400 transition-colors leading-snug">
                                    {related.title}
                                </h3>
                                <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">
                                    {related.excerpt}
                                </p>
                                <span className="text-[11px] text-gray-600">{related.readTime}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Back to Blog CTA */}
            <div className="px-4 max-w-4xl mx-auto">
                <Link
                    href="/blog"
                    className="block text-center py-4 px-8 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all duration-300 text-sm font-semibold text-gray-300 hover:text-cyan-400"
                >
                    ← Back to Blog
                </Link>
            </div>
        </main>
    );
}
