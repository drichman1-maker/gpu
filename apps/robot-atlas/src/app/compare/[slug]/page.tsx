import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { getRobotBySlug, getRobots } from '@/lib/db';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const parts = slug.split('-vs-');
    if (parts.length < 2) return { title: 'Compare Robots | RobotAtlas' };
    return {
        title: `${parts[0].replace(/-/g, ' ')} vs ${parts[1].replace(/-/g, ' ')} | RobotAtlas`,
        description: `Side-by-side comparison of robot vacuums using the Robot Autonomy Index (RAI).`,
    };
}

// Compare landing page — lists all available comparisons
async function CompareLandingPage() {
    const robots = await getRobots();
    const sorted = [...robots].sort((a, b) => (b.autonomyScore ?? 0) - (a.autonomyScore ?? 0));
    const top = sorted.slice(0, 6);

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <Navbar />
            <div className="pt-32 px-4 max-w-7xl mx-auto">
                <div className="mb-12">
                    <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-mono">Compare</div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">Head-to-Head</h1>
                    <p className="text-gray-400 text-lg max-w-2xl">
                        Pick any two robots from the index and see how they stack up on the RAI scoring system.
                    </p>
                </div>

                <h2 className="text-lg font-semibold text-gray-300 mb-6">Popular Comparisons</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {top.slice(0, 5).map((robotA, i) =>
                        top.slice(i + 1, i + 3).map(robotB => (
                            <Link
                                key={`${robotA.slug}-vs-${robotB.slug}`}
                                href={`/compare/${robotA.slug}-vs-${robotB.slug}`}
                                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/50 transition group"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {robotA.mainImage && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={robotA.mainImage} alt={robotA.modelName} className="w-12 h-12 object-contain opacity-80" />
                                    )}
                                    <span className="text-gray-500 font-bold">VS</span>
                                    {robotB.mainImage && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={robotB.mainImage} alt={robotB.modelName} className="w-12 h-12 object-contain opacity-80" />
                                    )}
                                </div>
                                <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                                    {robotA.modelName} <span className="text-gray-600">vs</span> {robotB.modelName}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    RAI {robotA.autonomyScore ?? '—'} vs RAI {robotB.autonomyScore ?? '—'}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="mt-12">
                    <Link href="/rankings" className="text-sm text-gray-500 hover:text-white transition">
                        ← View full rankings to find robots to compare
                    </Link>
                </div>
            </div>
        </main>
    );
}

const AUTONOMY_METRICS = [
    { key: 'navigationScore', label: 'Navigation Intelligence' },
    { key: 'obstacleAvoidanceScore', label: 'Obstacle Avoidance' },
    { key: 'automationLevel', label: 'Automation Level' },
    { key: 'maintenanceIndependence', label: 'Maintenance Independence' },
] as const;

export default async function ComparisonPage({ params }: PageProps) {
    const { slug } = await params;

    // If no -vs- separator, show the landing page
    if (!slug.includes('-vs-')) {
        return <CompareLandingPage />;
    }

    const vsIdx = slug.indexOf('-vs-');
    const slugA = slug.slice(0, vsIdx);
    const slugB = slug.slice(vsIdx + 4);

    const [robotA, robotB] = await Promise.all([
        getRobotBySlug(slugA),
        getRobotBySlug(slugB),
    ]);

    if (!robotA || !robotB) {
        return (
            <main className="min-h-screen bg-black text-white pb-20">
                <Navbar />
                <div className="pt-32 px-4 max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Comparison not found</h1>
                    <p className="text-gray-500 mb-8">
                        Could not find robots for: <code className="text-cyan-400">{slug}</code>
                    </p>
                    <Link href="/rankings" className="text-cyan-400 hover:text-cyan-300 underline">
                        Browse all robots →
                    </Link>
                </div>
            </main>
        );
    }

    const brandA = robotA.brandName ?? robotA.brandId;
    const brandB = robotB.brandName ?? robotB.brandId;

    const winner = (robotA.autonomyScore ?? 0) >= (robotB.autonomyScore ?? 0) ? robotA : robotB;

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <Navbar />

            {/* Header */}
            <div className="pt-32 pb-8 px-4 max-w-7xl mx-auto">
                <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-mono">Compare</div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                    {robotA.modelName} <span className="text-gray-600">vs</span> {robotB.modelName}
                </h1>
                <p className="text-gray-500 text-sm">Side-by-side RAI breakdown</p>
            </div>

            {/* Hero comparison */}
            <section className="px-4 max-w-7xl mx-auto mb-12">
                <div className="grid grid-cols-2 gap-6">
                    {/* Robot A */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="aspect-[4/3] relative bg-black/20 flex items-center justify-center p-6">
                            {robotA.mainImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={robotA.mainImage} alt={robotA.modelName} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-gray-700 text-sm">No image</div>
                            )}
                            {robotA.autonomyScore != null && (
                                <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 backdrop-blur rounded-lg text-sm border border-cyan-500/30">
                                    RAI <span className="text-cyan-400 font-bold font-mono">{robotA.autonomyScore}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-5">
                            <div className="text-xs text-cyan-400 uppercase tracking-widest mb-1">{brandA}</div>
                            <h2 className="text-xl font-bold mb-2">{robotA.modelName}</h2>
                            {robotA.lowestPrice != null && (
                                <div className="text-2xl font-bold font-mono text-green-400">${robotA.lowestPrice.toLocaleString()}</div>
                            )}
                            {robotA.affiliateUrl && (
                                <a href={robotA.affiliateUrl} target="_blank" rel="noopener noreferrer"
                                    className="mt-3 block w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition text-center text-sm">
                                    Check Price →
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Robot B */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="aspect-[4/3] relative bg-black/20 flex items-center justify-center p-6">
                            {robotB.mainImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={robotB.mainImage} alt={robotB.modelName} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-gray-700 text-sm">No image</div>
                            )}
                            {robotB.autonomyScore != null && (
                                <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 backdrop-blur rounded-lg text-sm border border-violet-500/30">
                                    RAI <span className="text-violet-400 font-bold font-mono">{robotB.autonomyScore}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-5">
                            <div className="text-xs text-violet-400 uppercase tracking-widest mb-1">{brandB}</div>
                            <h2 className="text-xl font-bold mb-2">{robotB.modelName}</h2>
                            {robotB.lowestPrice != null && (
                                <div className="text-2xl font-bold font-mono text-green-400">${robotB.lowestPrice.toLocaleString()}</div>
                            )}
                            {robotB.affiliateUrl && (
                                <a href={robotB.affiliateUrl} target="_blank" rel="noopener noreferrer"
                                    className="mt-3 block w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition text-center text-sm">
                                    Check Price →
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* RAI Breakdown */}
            <section className="px-4 max-w-7xl mx-auto mb-12">
                <h2 className="text-xl font-bold mb-6">Autonomy Intelligence Breakdown</h2>
                <div className="space-y-4">
                    {/* Overall RAI */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <div className="text-right">
                                <div className="text-3xl font-bold font-mono text-cyan-400">{robotA.autonomyScore ?? '—'}</div>
                                <div className="text-xs text-gray-500 mt-0.5">RAI Score</div>
                            </div>
                            <div className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">Overall RAI</div>
                            <div className="text-left">
                                <div className="text-3xl font-bold font-mono text-violet-400">{robotB.autonomyScore ?? '—'}</div>
                                <div className="text-xs text-gray-500 mt-0.5">RAI Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Sub-scores */}
                    {AUTONOMY_METRICS.map(({ key, label }) => {
                        const scoreA = robotA[key] ?? null;
                        const scoreB = robotB[key] ?? null;
                        const aWins = scoreA != null && scoreB != null && scoreA > scoreB;
                        const bWins = scoreA != null && scoreB != null && scoreB > scoreA;
                        return (
                            <div key={key} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold font-mono ${aWins ? 'text-cyan-400' : 'text-gray-400'}`}>
                                            {scoreA ?? '—'}
                                        </div>
                                        {aWins && <div className="text-xs text-cyan-500 mt-0.5">Winner</div>}
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</div>
                                        {scoreA != null && scoreB != null && (
                                            <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                                                <div className="absolute left-0 top-0 h-full bg-cyan-500 rounded-full" style={{ width: `${scoreA}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-2xl font-bold font-mono ${bWins ? 'text-violet-400' : 'text-gray-400'}`}>
                                            {scoreB ?? '—'}
                                        </div>
                                        {bWins && <div className="text-xs text-violet-500 mt-0.5">Winner</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Price comparison */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <div className="text-right">
                                <div className={`text-2xl font-bold font-mono ${
                                    robotA.lowestPrice != null && robotB.lowestPrice != null && robotA.lowestPrice <= robotB.lowestPrice
                                        ? 'text-green-400'
                                        : 'text-gray-400'
                                }`}>
                                    {robotA.lowestPrice != null ? `$${robotA.lowestPrice.toLocaleString()}` : '—'}
                                </div>
                            </div>
                            <div className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest">Price</div>
                            <div className="text-left">
                                <div className={`text-2xl font-bold font-mono ${
                                    robotA.lowestPrice != null && robotB.lowestPrice != null && robotB.lowestPrice <= robotA.lowestPrice
                                        ? 'text-green-400'
                                        : 'text-gray-400'
                                }`}>
                                    {robotB.lowestPrice != null ? `$${robotB.lowestPrice.toLocaleString()}` : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommendation */}
            {(robotA.autonomyScore != null || robotB.autonomyScore != null) && (
                <section className="px-4 max-w-7xl mx-auto mb-12">
                    <div className="p-6 border border-cyan-500/30 bg-cyan-900/10 rounded-2xl">
                        <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-widest text-sm">RAI Verdict</h3>
                        <p className="text-gray-200 text-lg">
                            The <strong className="text-white">{winner.modelName}</strong> leads with an RAI score of{' '}
                            <strong className="text-cyan-400 font-mono">{winner.autonomyScore}</strong>, making it the
                            superior choice for hands-off autonomous cleaning.
                        </p>
                    </div>
                </section>
            )}

            {/* Back links */}
            <div className="px-4 max-w-7xl mx-auto flex gap-6 text-sm">
                <Link href="/rankings" className="text-gray-500 hover:text-white transition">← Full Rankings</Link>
                <Link href={`/robot/${robotA.slug}`} className="text-gray-500 hover:text-cyan-400 transition">{robotA.modelName} Details</Link>
                <Link href={`/robot/${robotB.slug}`} className="text-gray-500 hover:text-violet-400 transition">{robotB.modelName} Details</Link>
            </div>
        </main>
    );
}
