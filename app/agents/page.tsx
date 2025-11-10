import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { AgentList } from '@/components/agents/agent-list'

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
          <Button>Register Agent</Button>
        </div>

        <AgentList />
      </main>
    </div>
  )
}
