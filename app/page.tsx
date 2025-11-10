import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white tracking-tight">
              Conductor
            </h1>
            <p className="text-2xl text-neutral-400">
              AI Agent Orchestration System
            </p>
          </div>

          {/* Description */}
          <div className="border border-neutral-800 rounded-lg p-8 space-y-4">
            <p className="text-lg text-neutral-300">
              A meta-application where AI agents poll for tasks, execute them autonomously,
              and report back. Build intelligent systems with task queues, agent management,
              and an AI-powered intelligence layer.
            </p>
          </div>

          {/* CTA */}
          <Link href="/dashboard">
            <Button size="lg">Open Dashboard</Button>
          </Link>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="border border-neutral-800 rounded-lg p-6 space-y-3">
              <div className="text-3xl">🤖</div>
              <h3 className="text-lg font-semibold text-white">Agent Management</h3>
              <p className="text-sm text-neutral-400">
                Register agents, track capabilities, monitor heartbeats and status
              </p>
            </div>

            <div className="border border-neutral-800 rounded-lg p-6 space-y-3">
              <div className="text-3xl">📋</div>
              <h3 className="text-lg font-semibold text-white">Task Queue</h3>
              <p className="text-sm text-neutral-400">
                Priority-based task assignment with dependencies and capability matching
              </p>
            </div>

            <div className="border border-neutral-800 rounded-lg p-6 space-y-3">
              <div className="text-3xl">🧠</div>
              <h3 className="text-lg font-semibold text-white">Intelligence Layer</h3>
              <p className="text-sm text-neutral-400">
                AI agents analyze work and suggest improvements automatically
              </p>
            </div>
          </div>

          {/* Stack Info */}
          <div className="mt-16 pt-8 border-t border-neutral-800">
            <p className="text-sm text-neutral-500">
              Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
