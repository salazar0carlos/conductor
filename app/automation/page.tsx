'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  GitBranch,
  Loader2,
  RefreshCw,
  Plus,
  Settings,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface WorkflowInstance {
  id: string
  task_id: string
  current_phase: string
  status: 'active' | 'completed' | 'failed' | 'paused'
  progress_percentage: number
  created_at: string
  updated_at: string
  task?: {
    title: string
    description: string
  }
}

interface BackgroundJob {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  attempts: number
  max_attempts: number
  scheduled_at: string
  next_retry_at?: string
  error_message?: string
  result?: any
}

interface IntegrationHealth {
  id: string
  integration_type: string
  integration_name: string
  status: 'active' | 'inactive' | 'expired' | 'error'
  last_used?: string
}

interface AutomationStats {
  total_workflows: number
  active_workflows: number
  completed_workflows: number
  failed_workflows: number
  total_jobs: number
  pending_jobs: number
  running_jobs: number
  failed_jobs: number
  success_rate: number
}

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([])
  const [jobs, setJobs] = useState<BackgroundJob[]>([])
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([])
  const [stats, setStats] = useState<AutomationStats>({
    total_workflows: 0,
    active_workflows: 0,
    completed_workflows: 0,
    failed_workflows: 0,
    total_jobs: 0,
    pending_jobs: 0,
    running_jobs: 0,
    failed_jobs: 0,
    success_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    if (!loading) setRefreshing(true)

    try {
      const [workflowsRes, jobsRes, integrationsRes] = await Promise.all([
        fetch('/api/workflows?limit=10&status=active'),
        fetch('/api/jobs?limit=20'),
        fetch('/api/settings/integrations')
      ])

      if (workflowsRes.ok) {
        const data = await workflowsRes.json()
        setWorkflows(data.data || [])
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json()
        setJobs(data.data || [])
      }

      if (integrationsRes.ok) {
        const data = await integrationsRes.json()
        setIntegrations(data.data || [])
      }

      // Calculate stats
      calculateStats()
    } catch (error) {
      console.error('Failed to fetch automation data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateStats = () => {
    // This would normally come from an API endpoint
    setStats({
      total_workflows: workflows.length,
      active_workflows: workflows.filter(w => w.status === 'active').length,
      completed_workflows: workflows.filter(w => w.status === 'completed').length,
      failed_workflows: workflows.filter(w => w.status === 'failed').length,
      total_jobs: jobs.length,
      pending_jobs: jobs.filter(j => j.status === 'pending').length,
      running_jobs: jobs.filter(j => j.status === 'running').length,
      failed_jobs: jobs.filter(j => j.status === 'failed').length,
      success_rate: jobs.length > 0
        ? Math.round((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100)
        : 0
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'failed':
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending':
      case 'retrying':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'paused':
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'requirements':
        return '📋'
      case 'architecture':
        return '🏗️'
      case 'development':
        return '💻'
      case 'security':
        return '🔒'
      case 'performance':
        return '⚡'
      case 'testing':
        return '🧪'
      case 'documentation':
        return '📚'
      case 'deployment_prep':
        return '🚀'
      case 'final_review':
        return '✅'
      default:
        return '📦'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-900">
        <Nav />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Nav />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Automation</h1>
            <p className="text-neutral-400">Monitor workflows, jobs, and integrations</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/automation/workflows/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Workflow
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={GitBranch}
            label="Active Workflows"
            value={stats.active_workflows}
            total={stats.total_workflows}
            color="blue"
          />
          <StatsCard
            icon={Zap}
            label="Running Jobs"
            value={stats.running_jobs}
            total={stats.total_jobs}
            color="purple"
          />
          <StatsCard
            icon={TrendingUp}
            label="Success Rate"
            value={`${stats.success_rate}%`}
            color="green"
          />
          <StatsCard
            icon={Activity}
            label="Integrations"
            value={integrations.filter(i => i.status === 'active').length}
            total={integrations.length}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Workflows */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Active Workflows
                </h2>
                <Link href="/workflows">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>

              {workflows.length === 0 ? (
                <div className="text-center py-8">
                  <PlayCircle className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400">No active workflows</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <Link
                      key={workflow.id}
                      href={`/tasks/${workflow.task_id}`}
                      className="block p-4 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{getPhaseIcon(workflow.current_phase)}</span>
                            <h3 className="font-medium text-white">
                              {workflow.task?.title || `Workflow ${workflow.id.slice(0, 8)}`}
                            </h3>
                          </div>
                          <p className="text-sm text-neutral-400 line-clamp-1">
                            {workflow.task?.description || 'No description'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-400">
                            Phase: <span className="text-white capitalize">{workflow.current_phase.replace('_', ' ')}</span>
                          </span>
                          <span className="text-neutral-400">{workflow.progress_percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${workflow.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Background Jobs */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Background Jobs
                </h2>
                <Link href="/automation/jobs">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400">No background jobs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 10).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-700"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {job.status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {job.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                        {job.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                        {job.status === 'retrying' && <RefreshCw className="w-4 h-4 text-orange-400" />}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white capitalize">
                            {job.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Attempt {job.attempts}/{job.max_attempts}
                            {job.next_retry_at && ` • Retry at ${new Date(job.next_retry_at).toLocaleTimeString()}`}
                          </p>
                        </div>
                      </div>

                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Integration Health */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Integrations
                </h2>
                <Link href="/settings?tab=integrations">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {integrations.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 mb-2">No integrations</p>
                  <Link href="/settings?tab=integrations">
                    <Button size="sm" variant="outline">Add Integration</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-700"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {integration.integration_name}
                        </p>
                        <p className="text-xs text-neutral-400 capitalize">
                          {integration.integration_type}
                        </p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          integration.status === 'active'
                            ? 'bg-green-400'
                            : integration.status === 'error'
                            ? 'bg-red-400'
                            : 'bg-yellow-400'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/automation/workflows/new">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="w-4 h-4" />
                    Create Workflow
                  </Button>
                </Link>
                <Link href="/settings?tab=integrations">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Activity className="w-4 h-4" />
                    Manage Integrations
                  </Button>
                </Link>
                <Link href="/automation/jobs">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View Job History
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

interface StatsCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  total?: number
  color: 'blue' | 'purple' | 'green' | 'orange'
}

function StatsCard({ icon: Icon, label, value, total, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
  }

  const iconColorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
      </div>
      <div className="mb-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        {total !== undefined && (
          <span className="text-lg text-neutral-400 ml-1">/ {total}</span>
        )}
      </div>
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  )
}
