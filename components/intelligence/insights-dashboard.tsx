'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'

interface InsightData {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  avgCompletionTime: number
  activeAgents: number
  totalAgents: number
  successRate: number
  pendingAnalyses: number
  criticalIssues: number
  trends: {
    tasks: number
    performance: number
    efficiency: number
  }
  topPerformers: Array<{
    id: string
    name: string
    score: number
  }>
  recentAlerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: string
  }>
}

export function InsightsDashboard() {
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
    // Refresh every 30 seconds
    const interval = setInterval(fetchInsights, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/intelligence/insights')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch insights')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 text-center">
        <p className="text-red-400">{error || 'Failed to load insights'}</p>
        <button
          onClick={fetchInsights}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Task Success Rate"
            value={`${data.successRate}%`}
            variant={data.successRate >= 90 ? 'success' : data.successRate >= 70 ? 'warning' : 'error'}
          />
          <StatCard
            label="Active Agents"
            value={`${data.activeAgents}/${data.totalAgents}`}
            variant={data.activeAgents > 0 ? 'success' : 'warning'}
          />
          <StatCard
            label="Avg Completion Time"
            value={`${data.avgCompletionTime}m`}
            variant="primary"
          />
          <StatCard
            label="Pending Analyses"
            value={data.pendingAnalyses}
            variant={data.pendingAnalyses > 10 ? 'warning' : 'default'}
          />
        </div>
      </div>

      {/* Trends */}
      <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50">
        <h3 className="text-md font-semibold text-white mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrendCard
            label="Task Volume"
            value={data.trends.tasks}
            description="vs last week"
          />
          <TrendCard
            label="Performance Score"
            value={data.trends.performance}
            description="vs last week"
          />
          <TrendCard
            label="System Efficiency"
            value={data.trends.efficiency}
            description="vs last week"
          />
        </div>
      </div>

      {/* Top Performers & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50">
          <h3 className="text-md font-semibold text-white mb-4">Top Performing Agents</h3>
          <div className="space-y-3">
            {data.topPerformers.length === 0 ? (
              <p className="text-neutral-400 text-sm">No agent data available</p>
            ) : (
              data.topPerformers.map((agent, idx) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-neutral-400/20 text-neutral-400' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-neutral-700 text-neutral-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{agent.name}</p>
                      <p className="text-xs text-neutral-500">Agent ID: {agent.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{agent.score}%</p>
                    <p className="text-xs text-neutral-500">Score</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50">
          <h3 className="text-md font-semibold text-white mb-4">
            System Alerts
            {data.criticalIssues > 0 && (
              <Badge variant="error" className="ml-2">{data.criticalIssues} Critical</Badge>
            )}
          </h3>
          <div className="space-y-3">
            {data.recentAlerts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-400">All systems operational</p>
                </div>
              </div>
            ) : (
              data.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'error' ? 'bg-red-500/5 border-red-500/20' :
                    alert.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                    'bg-blue-500/5 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {alert.type === 'error' && (
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {alert.type === 'warning' && (
                        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      {alert.type === 'info' && (
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        alert.type === 'error' ? 'text-red-300' :
                        alert.type === 'warning' ? 'text-yellow-300' :
                        'text-blue-300'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visual Performance Chart */}
      <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50">
        <h3 className="text-md font-semibold text-white mb-4">Task Completion Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">Completed</span>
              <span className="text-green-400 font-medium">{data.completedTasks}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(data.completedTasks / data.totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">Failed</span>
              <span className="text-red-400 font-medium">{data.failedTasks}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${(data.failedTasks / data.totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">In Progress</span>
              <span className="text-blue-400 font-medium">{data.totalTasks - data.completedTasks - data.failedTasks}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((data.totalTasks - data.completedTasks - data.failedTasks) / data.totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrendCard({ label, value, description }: { label: string; value: number; description: string }) {
  const isPositive = value > 0
  const isNeutral = value === 0

  return (
    <div>
      <p className="text-sm text-neutral-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-white">
          {isPositive ? '+' : ''}{value}%
        </p>
        {!isNeutral && (
          <div className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <svg
              className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs text-neutral-500 mt-1">{description}</p>
    </div>
  )
}
