import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { getTopRobots, getRobotCount, getAvgAutonomyScore, getBrandCount } from '../lib/db';

export default async function Home() {
  const [topRated, robotCount, avgAutonomy, brandCount] = await Promise.all([
    getTopRobots(3),
    getRobotCount(),
    getAvgAutonomyScore(),
    getBrandCount(),
  ]);

  return (
    <main className="min-h-screen pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-400 to-gray-600">
            ROBOT<span className="text-cyan-400">ATLAS</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            The definitive intelligence layer for consumer robotics.
            <br />
            Ranked by the <span className="text-white font-semibold">Robot Autonomy Index</span> — the only score that measures true hands-off capability.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Robots Indexed</div>
            <div className="text-3xl font-mono text-cyan-400">{robotCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Brands Tracked</div>
            <div className="text-3xl font-mono text-violet-400">{brandCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Avg RAI Score</div>
            <div className="text-3xl font-mono text-white">{avgAutonomy}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Price Updates</div>
            <div className="text-3xl font-mono text-green-400">24h</div>
          </div>
        </div>
      </section>

      {/* Trending Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold">
            Autonomy Leaders{' '}
            <span className="text-gray-600 text-lg font-normal ml-2">2026 Season</span>
          </h2>
          <a href="/rankings" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
            View Full Index →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topRated.map(robot => (
            <ProductCard key={robot.id} robot={robot} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/rankings"
            className="group p-6 bg-white/5 border border-white/10 hover:border-cyan-500/40 rounded-2xl transition"
          >
            <div className="text-xs text-cyan-400 uppercase tracking-widest mb-2">Rankings</div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition mb-1">
              Full Robot Index →
            </h3>
            <p className="text-gray-500 text-sm">
              All {robotCount} robots ranked by RAI score.
            </p>
          </a>
          <a
            href="/compare"
            className="group p-6 bg-white/5 border border-white/10 hover:border-violet-500/40 rounded-2xl transition"
          >
            <div className="text-xs text-violet-400 uppercase tracking-widest mb-2">Compare</div>
            <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition mb-1">
              Head-to-Head →
            </h3>
            <p className="text-gray-500 text-sm">
              Pick any two robots and see how they stack up.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
