export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white tracking-tight">
              Conductor
            </h1>
            <p className="text-2xl text-slate-400">
              AI Agent Orchestration System
            </p>
          </div>

          {/* Description */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 space-y-4">
            <p className="text-lg text-slate-300">
              Build, manage, and orchestrate AI agents with visual workflows.
              Create complex multi-agent systems with ease.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-3">
              <div className="text-3xl">🤖</div>
              <h3 className="text-xl font-semibold text-white">Agent Management</h3>
              <p className="text-slate-400">
                Create and configure AI agents with custom capabilities and behaviors
              </p>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-3">
              <div className="text-3xl">🔄</div>
              <h3 className="text-xl font-semibold text-white">Workflow Builder</h3>
              <p className="text-slate-400">
                Design complex workflows with visual drag-and-drop interface
              </p>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-3">
              <div className="text-3xl">⚡</div>
              <h3 className="text-xl font-semibold text-white">Real-time Execution</h3>
              <p className="text-slate-400">
                Monitor and control agent execution in real-time with detailed logs
              </p>
            </div>
          </div>

          {/* Stack Info */}
          <div className="mt-16 pt-8 border-t border-slate-700">
            <p className="text-sm text-slate-500">
              Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
