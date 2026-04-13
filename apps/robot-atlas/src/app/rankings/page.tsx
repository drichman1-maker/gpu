import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getRobots } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Full Robot Index | RobotAtlas',
  description: 'Every robot ranked by the Robot Autonomy Index (RAI). Compare autonomous home robots by navigation, obstacle avoidance, and maintenance independence.',
};

export default async function RankingsPage() {
  const robots = await getRobots();
  const ranked = [...robots].sort((a, b) => (b.autonomyScore ?? 0) - (a.autonomyScore ?? 0));

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-mono">RobotAtlas Index</div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            Full Index
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Ranked by Robot Autonomy Index (RAI) — a patent-pending scoring system measuring navigation, obstacle avoidance, automation, and maintenance independence.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 flex gap-12">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Indexed</div>
            <div className="text-2xl font-mono text-cyan-400">{ranked.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Top RAI Score</div>
            <div className="text-2xl font-mono text-white">{ranked[0]?.autonomyScore ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Updated</div>
            <div className="text-2xl font-mono text-violet-400">24h</div>
          </div>
        </div>
      </section>

      {/* Rankings Table */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-gray-500 uppercase tracking-widest border-b border-white/10 mb-2">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Robot</div>
          <div className="col-span-2">Brand</div>
          <div className="col-span-2 text-right">RAI Score</div>
          <div className="col-span-2 text-right">Price</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {ranked.map((robot, i) => (
            <div
              key={robot.id}
              className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/[0.03] transition group"
            >
              {/* Rank */}
              <div className="col-span-1 font-mono text-gray-600 text-sm">
                {i === 0 ? (
                  <span className="text-cyan-400 font-bold">#1</span>
                ) : (
                  `#${i + 1}`
                )}
              </div>

              {/* Name */}
              <div className="col-span-5">
                <Link
                  href={`/robot/${robot.slug}`}
                  className="font-semibold text-white group-hover:text-cyan-300 transition"
                >
                  {robot.modelName}
                </Link>
              </div>

              {/* Brand */}
              <div className="col-span-2 text-sm text-gray-400 uppercase tracking-wider">
                {robot.brandId}
              </div>

              {/* RAI Score */}
              <div className="col-span-2 text-right">
                <span className="font-mono font-bold text-cyan-400 text-lg">
                  {robot.autonomyScore ?? '—'}
                </span>
                {robot.autonomyScore != null && (
                  <span className="text-gray-600 text-xs font-mono">/100</span>
                )}
              </div>

              {/* Price */}
              <div className="col-span-2 text-right font-mono text-white">
                {robot.lowestPrice != null
                  ? `$${robot.lowestPrice.toLocaleString()}`
                  : <span className="text-gray-600">—</span>
                }
              </div>
            </div>
          ))}
        </div>

        {ranked.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            No robots indexed yet.
          </div>
        )}
      </section>

      {/* Back to home */}
      <div className="max-w-7xl mx-auto px-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
