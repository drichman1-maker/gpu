import AddRobotForm from '@/components/admin/AddRobotForm'

export const metadata = {
  title: 'Admin — RobotAtlas',
  robots: 'noindex',
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-sm font-bold tracking-tighter opacity-60 hover:opacity-100 transition">
            ROBOT<span className="text-cyan-400">ATLAS</span>
          </a>
          <span className="text-xs text-gray-600 uppercase tracking-widest">Admin Console</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-10">
          <div className="text-xs text-cyan-400 uppercase tracking-widest mb-2">Admin</div>
          <h1 className="text-4xl font-bold tracking-tight">Add Robot</h1>
          <p className="text-gray-500 mt-2">Manually add a robot to the RobotAtlas index.</p>
        </div>

        {/* Form */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <AddRobotForm />
        </div>

        {/* Footer links */}
        <div className="mt-8 flex gap-6 text-sm text-gray-600">
          <a href="/rankings" className="hover:text-white transition">View Rankings →</a>
          <a href="/" className="hover:text-white transition">Homepage →</a>
        </div>
      </div>
    </main>
  )
}
