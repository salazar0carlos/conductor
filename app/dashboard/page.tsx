import { Nav } from '@/components/ui/nav'
import { StatsOverview } from '@/components/dashboard/stats-overview'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-neutral-400">Monitor your AI agent orchestration system</p>
        </div>

        <StatsOverview />
      </main>
    </div>
  )
}
