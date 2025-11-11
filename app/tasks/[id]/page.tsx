import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Task, TaskLog, Agent, AnalysisHistory } from '@/types'
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, User, Calendar } from 'lucide-react'
import Link from 'next/link'

interface TaskDetailPageProps {
  params: {
    id: string
  }
}

async function getTaskDetails(taskId: string) {
  const supabase = await createClient()

  // Fetch task with project info
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (
        id,
        name
      )
    `)
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return null
  }

  // Fetch assigned agent if exists
  let agent: Agent | null = null
  if (task.assigned_agent_id) {
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .eq('id', task.assigned_agent_id)
      .single()
    agent = agentData
  }

  // Fetch task logs
  const { data: logs } = await supabase
    .from('task_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  // Fetch related analyses
  const { data: analyses } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { descending: true })

  return {
    task: task as Task & { projects: { id: string; name: string } },
    agent,
    logs: logs || [],
    analyses: analyses || []
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'in_progress':
    case 'assigned':
      return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
    default:
      return <AlertCircle className="w-5 h-5 text-neutral-500" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-500 border-green-500/30'
    case 'failed':
      return 'bg-red-500/10 text-red-500 border-red-500/30'
    case 'in_progress':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
    case 'assigned':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/30'
    case 'pending':
      return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
    case 'cancelled':
      return 'bg-neutral-600/10 text-neutral-500 border-neutral-600/30'
    default:
      return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
  }
}

function getLogLevelColor(level: string) {
  switch (level) {
    case 'error':
      return 'text-red-400'
    case 'warning':
      return 'text-yellow-400'
    case 'debug':
      return 'text-neutral-500'
    default:
      return 'text-neutral-300'
  }
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const details = await getTaskDetails(params.id)

  if (!details) {
    notFound()
  }

  const { task, agent, logs, analyses } = details

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/tasks"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white">{task.title}</h1>
              <p className="text-sm text-neutral-400 mt-1">
                {task.projects?.name || 'Unknown Project'}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-2 ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
              {task.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Task Details</h2>

              {task.description && (
                <div className="mb-6">
                  <p className="text-neutral-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Type</span>
                  <p className="text-white mt-1 capitalize">{task.type}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Priority</span>
                  <p className="text-white mt-1">{task.priority}/10</p>
                </div>
                <div>
                  <span className="text-neutral-500">Created</span>
                  <p className="text-white mt-1">{new Date(task.created_at).toLocaleString()}</p>
                </div>
                {task.completed_at && (
                  <div>
                    <span className="text-neutral-500">Completed</span>
                    <p className="text-white mt-1">{new Date(task.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {task.required_capabilities.length > 0 && (
                <div className="mt-6">
                  <span className="text-neutral-500 text-sm">Required Capabilities</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.required_capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 text-xs"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.error_message && (
                <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-medium text-red-400 mb-1">Error</p>
                  <p className="text-sm text-red-300">{task.error_message}</p>
                </div>
              )}
            </div>

            {/* Input/Output Data */}
            {(Object.keys(task.input_data || {}).length > 0 || task.output_data) && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Data</h2>

                {Object.keys(task.input_data || {}).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-neutral-400 mb-2">Input Data</h3>
                    <pre className="bg-neutral-900 rounded-lg p-4 text-sm text-neutral-300 overflow-x-auto">
                      {JSON.stringify(task.input_data, null, 2)}
                    </pre>
                  </div>
                )}

                {task.output_data && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-400 mb-2">Output Data</h3>
                    <pre className="bg-neutral-900 rounded-lg p-4 text-sm text-neutral-300 overflow-x-auto">
                      {JSON.stringify(task.output_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Task Logs */}
            {logs.length > 0 && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Execution Logs</h2>
                <div className="space-y-3">
                  {logs.map((log: TaskLog) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <span className="text-neutral-600 font-mono shrink-0">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium uppercase text-xs shrink-0 ${getLogLevelColor(log.level)}`}>
                        [{log.level}]
                      </span>
                      <p className="text-neutral-300 flex-1">{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Analyses */}
            {analyses.length > 0 && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Intelligence Insights</h2>
                <div className="space-y-4">
                  {analyses.map((analysis: AnalysisHistory) => (
                    <Link
                      key={analysis.id}
                      href={`/intelligence/${analysis.id}`}
                      className="block p-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-white capitalize">
                          {analysis.analysis_type.replace(/_/g, ' ')}
                        </span>
                        {analysis.priority_score && (
                          <span className="text-xs text-neutral-500">
                            Priority: {analysis.priority_score}/10
                          </span>
                        )}
                      </div>
                      {analysis.findings && typeof analysis.findings === 'object' && 'summary' in analysis.findings && (
                        <p className="text-sm text-neutral-400">
                          {String(analysis.findings.summary)}
                        </p>
                      )}
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${getStatusColor(analysis.status)}`}>
                        {analysis.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Agent */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Assigned Agent</h2>
              {agent ? (
                <Link
                  href={`/agents/${agent.id}`}
                  className="block p-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{agent.name}</p>
                      <p className="text-xs text-neutral-500 capitalize">{agent.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.slice(0, 3).map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-0.5 rounded text-xs bg-neutral-800 text-neutral-400"
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-neutral-800 text-neutral-400">
                        +{agent.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <p className="text-neutral-500 text-sm">No agent assigned</p>
              )}
            </div>

            {/* Timeline */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                    </div>
                    {(task.started_at || task.completed_at) && (
                      <div className="w-px h-full bg-neutral-800 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-white">Created</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {task.started_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-500" />
                      </div>
                      {task.completed_at && (
                        <div className="w-px h-full bg-neutral-800 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-white">Started</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(task.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {task.completed_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        task.status === 'completed'
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white capitalize">
                        {task.status}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(task.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
