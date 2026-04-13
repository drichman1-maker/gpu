import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { getRobots } from '@/lib/db';
import { generateIntentMetadata } from '@/lib/seo/metadata';

interface PageProps {
    params: Promise<{ intent: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { intent } = await params;
    return generateIntentMetadata(intent, 2026);
}

export default async function IntentPage({ params }: PageProps) {
    const { intent } = await params;
    const intentStr = String(intent).toLowerCase();
    if (!intentStr) notFound();

    const allRobots = await getRobots();
    const sorted = [...allRobots].sort((a, b) => (b.autonomyScore ?? 0) - (a.autonomyScore ?? 0));

    let relevantRobots = sorted;
    let title = '';
    let description = '';

    if (intentStr.includes('pet-hair')) {
        title = 'Best Robot Vacuums for Pet Hair (2026)';
        description = 'High suction (6000Pa+) and tangle-free brush systems are critical for pet owners. These robots score highest on our Autonomy Index for maintenance independence.';
        relevantRobots = sorted.filter(r => (r.lowestPrice || 0) > 600);
    } else if (intentStr.includes('under-500')) {
        title = 'Best Budget Robot Vacuums Under $500';
        description = "You don't need to spend a fortune for autonomous cleaning. These robots offer the best value-to-autonomy ratio in 2026.";
        relevantRobots = sorted.filter(r => (r.lowestPrice || 0) <= 500);
    } else if (intentStr.includes('self-emptying')) {
        title = 'Top Self-Emptying Robot Vacuums';
        description = 'Never touch dust again. These systems automatically empty their bins, holding up to 60 days of debris.';
    } else {
        title = `Top Rated Robots: ${intentStr.replace(/-/g, ' ')}`;
        description = 'Ranked by the Robot Autonomy Index (RAI) — the definitive measure of autonomous cleaning capability.';
    }

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <Navbar />

            <header className="pt-32 px-4 max-w-7xl mx-auto mb-16">
                <div className="inline-block px-3 py-1 mb-4 border border-cyan-500/30 bg-cyan-900/10 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full">
                    2026 Buying Guide
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight max-w-4xl">
                    {title}
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                    {description}
                </p>
            </header>

            {/* Analysis Section */}
            <section className="px-4 max-w-7xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6 text-gray-300 leading-relaxed">
                    <h3 className="text-2xl font-bold text-white">Why Trust RobotAtlas?</h3>
                    <p>
                        Unlike generic review sites, we use the <strong className="text-white">Robot Autonomy Index (RAI)</strong> to quantify performance.
                        We specifically weight maintenance independence and suction power for the best picks in this category.
                    </p>
                </div>
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 h-fit">
                    <h4 className="font-bold text-white mb-4">Key Decision Factors</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shrink-0" />
                            Suction Power {'>'} 5000Pa
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shrink-0" />
                            AI Object Recognition
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full shrink-0" />
                            Base Station Auto-Empty
                        </li>
                    </ul>
                </div>
            </section>

            {/* Product Grid */}
            <section className="px-4 max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-8">Top Ranked Models</h2>
                {relevantRobots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relevantRobots.map((robot, idx) => (
                            <div key={robot.id} className="relative">
                                {idx === 0 && (
                                    <div className="absolute -top-3 left-4 z-10 bg-yellow-400 text-black font-bold text-xs px-3 py-1 rounded-full shadow-lg shadow-yellow-400/20">
                                        #1 EDITOR&apos;S CHOICE
                                    </div>
                                )}
                                <ProductCard robot={robot} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 py-12 text-center border border-white/10 rounded-xl border-dashed">
                        No robots found matching current filters.
                    </div>
                )}
            </section>
        </main>
    );
}
