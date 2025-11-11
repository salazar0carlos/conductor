import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { AgentList } from '@/components/agents/agent-list'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Agents</h1>
            <p className="text-neutral-400">Monitor and manage AI agents</p>
          </div>
          <div className="flex gap-3">
            <Link href="/agents/templates">
              <Button variant="outline" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Browse Templates
              </Button>
            </Link>
            <Button>Register Agent</Button>
          </div>
        </div>

        <AgentList />
      </main>
    </div>
  )
}
