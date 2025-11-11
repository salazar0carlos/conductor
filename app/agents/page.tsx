'use client'

import { useState } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { AgentList } from '@/components/agents/agent-list'
import { RegisterAgentModal } from '@/components/agents/register-agent-modal'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AgentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
              <Button variant="secondary" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Browse Templates
              </Button>
            </Link>
            <Button onClick={() => setIsModalOpen(true)}>Register Agent</Button>
          </div>
        </div>

        <AgentList />
      </main>

      <RegisterAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
