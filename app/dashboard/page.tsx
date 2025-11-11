import { Nav } from '@/components/ui/nav'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-neutral-400">Monitor your AI agent orchestration system</p>
        </div>

        <div className="space-y-8">
          <StatsOverview />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>

            <div className="space-y-6">
              {/* Additional widgets can go here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
