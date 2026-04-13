import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { getRobotBySlug } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const robot = await getRobotBySlug(slug);
  if (!robot) return { title: 'Robot Not Found | RobotAtlas' };
  return {
    title: `${robot.modelName} Review & Specs | RobotAtlas`,
    description: robot.metaDescription ?? `Full specs, autonomy score, and pricing for the ${robot.modelName}.`,
  };
}

const AUTONOMY_METRICS = [
  { key: 'navigationScore', label: 'Navigation Intelligence', description: 'Mapping accuracy and path efficiency' },
  { key: 'obstacleAvoidanceScore', label: 'Obstacle Avoidance', description: 'Real-world object detection & avoidance' },
  { key: 'automationLevel', label: 'Automation Level', description: 'Hands-off operation capability' },
  { key: 'maintenanceIndependence', label: 'Maintenance Independence', description: 'Self-cleaning and self-emptying ability' },
] as const;

export default async function RobotDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const robot = await getRobotBySlug(slug);

  if (!robot) notFound();

  const brandDisplay = robot.brandName ?? robot.brandId;

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-24 pb-0 px-4 max-w-7xl mx-auto">
        <div className="text-sm text-gray-500">
          <a href="/" className="hover:text-white transition">Home</a>
          <span className="mx-2">/</span>
          <a href="/category/robot-vacuums" className="hover:text-white transition capitalize">{brandDisplay}</a>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{robot.modelName}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="pt-6 pb-12 px-4 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        {/* Image */}
        <div className="w-full md:w-1/2 aspect-square relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
          {robot.mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={robot.mainImage}
              alt={robot.modelName}
              className="w-full h-full object-contain p-8 opacity-90"
              onError={undefined}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-900 to-black">
              <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
              </svg>
              <span className="text-gray-600 text-xs uppercase tracking-widest">Image unavailable</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-full text-xs font-bold uppercase tracking-wider">
              {robot.status}
            </span>
          </div>
          {robot.autonomyScore != null && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/80 backdrop-blur rounded-lg text-sm border border-white/20">
              RAI <span className="text-cyan-400 font-bold font-mono">{robot.autonomyScore}</span>
              <span className="text-gray-500">/100</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <div className="text-xs text-cyan-400 uppercase tracking-widest mb-2">{brandDisplay}</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{robot.modelName}</h1>
          {robot.metaDescription && (
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">{robot.metaDescription}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            {robot.lowestPrice != null && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Price</div>
                <div className="text-3xl font-bold text-green-400 font-mono">${robot.lowestPrice.toLocaleString()}</div>
              </div>
            )}
            {robot.autonomyScore != null && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Autonomy Score</div>
                <div className="text-3xl font-bold text-violet-400 font-mono">
                  {robot.autonomyScore}<span className="text-sm text-gray-500 font-normal">/100</span>
                </div>
              </div>
            )}
          </div>

          {robot.affiliateUrl ? (
            <a
              href={robot.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition text-center block"
            >
              Check Best Price →
            </a>
          ) : (
            <button className="w-full py-4 bg-white/10 text-gray-400 font-bold rounded-xl cursor-not-allowed">
              Price Unavailable
            </button>
          )}
        </div>
      </section>

      {/* Autonomy Intelligence Profile */}
      {(robot.navigationScore != null || robot.obstacleAvoidanceScore != null) && (
        <section className="py-12 px-4 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-4 mb-8">
              <h2 className="text-2xl font-bold">Autonomy Intelligence Profile</h2>
              <span className="text-gray-500 text-sm mb-0.5">Patent-pending RAI scoring system</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AUTONOMY_METRICS.map(({ key, label, description }) => {
                const score = robot[key] ?? null;
                const pct = score != null ? score : 0;
                return (
                  <div key={key} className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-white">{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                      </div>
                      <div className="text-2xl font-bold font-mono text-cyan-400 ml-4">
                        {score ?? '—'}
                        {score != null && <span className="text-sm text-gray-500 font-normal">/100</span>}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA footer */}
      <section className="py-12 px-4 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Compare {robot.modelName}</h3>
            <p className="text-gray-500 text-sm">See how it stacks up against the competition.</p>
          </div>
          <div className="flex gap-4">
            <a
              href={`/compare/${robot.slug}-vs-placeholder`}
              className="px-6 py-3 border border-white/20 hover:border-cyan-500/50 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Compare →
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition"
            >
              ← Back to Rankings
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
