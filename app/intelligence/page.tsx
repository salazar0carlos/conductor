import { Nav } from '@/components/ui/nav'
import { AnalysisList } from '@/components/intelligence/analysis-list'

export default function IntelligencePage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Intelligence Layer</h1>
          <p className="text-neutral-400">
            AI-powered analysis and improvement suggestions from your agent system
          </p>
        </div>

        <AnalysisList />
      </main>
    </div>
  )
}
