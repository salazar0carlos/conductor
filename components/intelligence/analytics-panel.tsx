'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface AgentPerformance {
  id: string
  name: string
  tasksCompleted: number
  avgEfficiency: number
  successRate: number
  avgResponseTime: number
  status: string
}

interface TaskStatistics {
  type: string
  total: number
  completed: number
  failed: number
  avgDuration: number
  successRate: number
}

interface Bottleneck {
  id: string
  type: 'agent' | 'task' | 'dependency'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedTasks: number
  suggestedAction: string
}

interface AnalyticsData {
  agentPerformance: AgentPerformance[]
  taskStatistics: TaskStatistics[]
  bottlenecks: Bottleneck[]
  patterns: {
    commonErrors: Array<{ error: string; count: number }>
    peakHours: Array<{ hour: number; taskCount: number }>
    successPatterns: Array<{ pattern: string; impact: string }>
  }
}

export function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('agents')

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 60 seconds
    const interval = setInterval(fetchAnalytics, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/intelligence/analytics')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-800 rounded w-1/3"></div>
          <div className="h-64 bg-neutral-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 text-center">
        <p className="text-neutral-400">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="border border-neutral-800 rounded-lg bg-neutral-900/50">
      <div className="px-6 py-4 border-b border-neutral-800">
        <h2 className="text-lg font-semibold text-white">Performance Analytics</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Deep dive into system performance and efficiency metrics
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
        <TabsList>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="tasks">Task Statistics</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left text-sm font-medium text-neutral-400 pb-3">Agent</th>
                    <th className="text-left text-sm font-medium text-neutral-400 pb-3">Tasks</th>
                    <th className="text-left text-sm font-medium text-neutral-400 pb-3">Success Rate</th>
                    <th className="text-left text-sm font-medium text-neutral-400 pb-3">Efficiency</th>
                    <th className="text-left text-sm font-medium text-neutral-400 pb-3">Avg Response</th>
                    <th className="text-left text-sm font-medium text-neutral-400 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-neutral-400">
                        No agent data available
                      </td>
                    </tr>
                  ) : (
                    data.agentPerformance.map((agent) => (
                      <tr key={agent.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{agent.name}</p>
                            <p className="text-xs text-neutral-500">{agent.id.slice(0, 8)}</p>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-neutral-300">{agent.tasksCompleted}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className={`h-full rounded-full ${
                                  agent.successRate >= 90 ? 'bg-green-500' :
                                  agent.successRate >= 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${agent.successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-neutral-300">{agent.successRate}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={
                            agent.avgEfficiency >= 90 ? 'success' :
                            agent.avgEfficiency >= 70 ? 'warning' :
                            'error'
                          }>
                            {agent.avgEfficiency}%
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-neutral-300">{agent.avgResponseTime}s</td>
                        <td className="py-3">
                          <Badge variant={
                            agent.status === 'active' ? 'success' :
                            agent.status === 'idle' ? 'neutral' :
                            agent.status === 'busy' ? 'warning' :
                            'error'
                          }>
                            {agent.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-4">
            {data.taskStatistics.length === 0 ? (
              <p className="text-center py-8 text-neutral-400">No task statistics available</p>
            ) : (
              data.taskStatistics.map((stat) => (
                <div key={stat.type} className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white capitalize">{stat.type.replace('_', ' ')}</h4>
                      <p className="text-xs text-neutral-500 mt-1">Average duration: {stat.avgDuration} minutes</p>
                    </div>
                    <Badge variant={stat.successRate >= 90 ? 'success' : stat.successRate >= 70 ? 'warning' : 'error'}>
                      {stat.successRate}% Success
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Total</p>
                      <p className="text-lg font-semibold text-white">{stat.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Completed</p>
                      <p className="text-lg font-semibold text-green-400">{stat.completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Failed</p>
                      <p className="text-lg font-semibold text-red-400">{stat.failed}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="bg-green-500"
                        style={{ width: `${(stat.completed / stat.total) * 100}%` }}
                      ></div>
                      <div
                        className="bg-red-500"
                        style={{ width: `${(stat.failed / stat.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="bottlenecks">
          <div className="space-y-4">
            {data.bottlenecks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-neutral-400">No bottlenecks detected</p>
                <p className="text-sm text-neutral-500 mt-1">System is running smoothly</p>
              </div>
            ) : (
              data.bottlenecks.map((bottleneck) => (
                <div
                  key={bottleneck.id}
                  className={`border rounded-lg p-4 ${
                    bottleneck.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                    bottleneck.severity === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
                    bottleneck.severity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          bottleneck.severity === 'critical' ? 'error' :
                          bottleneck.severity === 'high' ? 'warning' :
                          bottleneck.severity === 'medium' ? 'warning' :
                          'primary'
                        }>
                          {bottleneck.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{bottleneck.type}</Badge>
                      </div>
                      <p className="text-sm text-white font-medium">{bottleneck.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-white">{bottleneck.affectedTasks}</p>
                      <p className="text-xs text-neutral-500">Affected Tasks</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-neutral-900/50 rounded border border-neutral-800">
                    <p className="text-xs text-neutral-400 mb-1">Suggested Action:</p>
                    <p className="text-sm text-neutral-200">{bottleneck.suggestedAction}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Common Errors */}
            <div className="border border-neutral-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Common Errors</h4>
              <div className="space-y-2">
                {data.patterns.commonErrors.length === 0 ? (
                  <p className="text-sm text-neutral-400">No errors detected</p>
                ) : (
                  data.patterns.commonErrors.map((error, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-neutral-800/50 rounded">
                      <p className="text-sm text-neutral-300 flex-1 truncate">{error.error}</p>
                      <Badge variant="error" className="ml-2">{error.count}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Success Patterns */}
            <div className="border border-neutral-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Success Patterns</h4>
              <div className="space-y-2">
                {data.patterns.successPatterns.length === 0 ? (
                  <p className="text-sm text-neutral-400">No patterns identified yet</p>
                ) : (
                  data.patterns.successPatterns.map((pattern, idx) => (
                    <div key={idx} className="p-3 bg-green-500/5 border border-green-500/20 rounded">
                      <p className="text-sm text-green-300 font-medium">{pattern.pattern}</p>
                      <p className="text-xs text-neutral-400 mt-1">{pattern.impact}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="border border-neutral-800 rounded-lg p-4 lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-3">Peak Activity Hours</h4>
              <div className="flex items-end gap-2 h-32">
                {data.patterns.peakHours.map((hour) => {
                  const maxTasks = Math.max(...data.patterns.peakHours.map(h => h.taskCount))
                  const height = (hour.taskCount / maxTasks) * 100
                  return (
                    <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-400 transition-colors cursor-pointer"
                          style={{ height: `${height}%` }}
                          title={`${hour.taskCount} tasks`}
                        ></div>
                      </div>
                      <span className="text-xs text-neutral-500">{hour.hour}h</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
