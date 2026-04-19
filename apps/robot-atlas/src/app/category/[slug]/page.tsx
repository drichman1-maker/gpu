import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { getRobots } from '@/lib/db';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const categoryName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
        title: `${categoryName} | RobotAtlas`,
        description: `Browse the best ${categoryName.toLowerCase()} ranked by the Robot Autonomy Index (RAI).`,
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { slug } = await params;

    const allRobots = await getRobots();
    const categoryRobots = allRobots
        .filter(r => r.categoryId === slug)
        .sort((a, b) => (b.autonomyScore ?? 0) - (a.autonomyScore ?? 0));

    if (categoryRobots.length === 0) {
        notFound();
    }

    const categoryName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <Navbar />

            <div className="pt-32 px-4 max-w-7xl mx-auto">
                <div className="mb-12">
                    <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-mono">Category</div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">{categoryName}</h1>
                    <p className="text-gray-400 mt-4 max-w-2xl text-lg">
                        {categoryRobots.length} robots ranked by the Robot Autonomy Index (RAI) — measuring navigation, obstacle avoidance, automation, and maintenance independence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categoryRobots.map((robot, i) => (
                        <div key={robot.id} className="relative">
                            {i === 0 && (
                                <div className="absolute -top-3 left-4 z-10 px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full shadow-lg shadow-cyan-500/20">
                                    #1 TOP RATED
                                </div>
                            )}
                            <ProductCard robot={robot} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
