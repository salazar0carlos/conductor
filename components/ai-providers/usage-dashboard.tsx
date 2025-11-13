'use client'

/**
 * AI Usage Dashboard Component
 * Displays analytics, charts, and usage trends
 */

import { useState, useEffect } from 'react'
import type { AIUsageAnalytics } from '@/types'
import {
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  BarChart3,
} from 'lucide-react'

interface UsageDashboardProps {
  userId?: string
  projectId?: string
  startDate?: string
  endDate?: string
}

export function UsageDashboard({
  userId,
  projectId,
  startDate,
  endDate,
}: UsageDashboardProps) {
  const [analytics, setAnalytics] = useState<AIUsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [userId, projectId, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('user_id', userId)
      if (projectId) params.append('project_id', projectId)

      // Calculate date range
      const end = new Date()
      const start = new Date()
      if (timeRange === '24h') {
        start.setDate(start.getDate() - 1)
      } else if (timeRange === '7d') {
        start.setDate(start.getDate() - 7)
      } else if (timeRange === '30d') {
        start.setDate(start.getDate() - 30)
      } else if (timeRange === '90d') {
        start.setDate(start.getDate() - 90)
      }

      params.append('start_date', start.toISOString())
      params.append('end_date', end.toISOString())

      const response = await fetch(`/api/ai/analytics?${params.toString()}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Usage Analytics</h2>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          title="Total Requests"
          value={analytics.total_requests.toLocaleString()}
          subtext={`${analytics.success_rate.toFixed(1)}% success rate`}
          trend="+12.5%"
        />
        <SummaryCard
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          title="Total Tokens"
          value={(analytics.total_tokens / 1000000).toFixed(2) + 'M'}
          subtext="Input + Output"
          trend="+8.3%"
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          title="Total Cost"
          value={`$${analytics.total_cost_usd.toFixed(2)}`}
          subtext={`$${analytics.average_cost_per_request.toFixed(4)} avg`}
          trend="-5.2%"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
          title="Avg Response"
          value={`${analytics.average_response_time_ms.toFixed(0)}ms`}
          subtext="Response time"
          trend="-15.8%"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Provider */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Usage by Provider</h3>
          </div>
          <div className="space-y-3">
            {analytics.by_provider.map((item) => {
              const maxRequests = Math.max(
                ...analytics.by_provider.map((p) => p.requests)
              )
              const percentage = (item.requests / maxRequests) * 100

              return (
                <div key={item.provider.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {item.provider.display_name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.requests} requests
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {(item.tokens / 1000).toFixed(1)}K tokens
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      ${item.cost_usd.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Usage by Model */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Top Models</h3>
          </div>
          <div className="space-y-3">
            {analytics.by_model.slice(0, 5).map((item) => {
              const maxRequests = Math.max(
                ...analytics.by_model.map((m) => m.requests)
              )
              const percentage = (item.requests / maxRequests) * 100

              return (
                <div key={item.model.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {item.model.display_name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.requests}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${item.cost_usd.toFixed(2)} spent
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Usage Timeline</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {analytics.timeline.map((item) => {
            const maxCost = Math.max(
              ...analytics.timeline.map((t) => t.cost_usd)
            )
            const height = maxCost > 0 ? (item.cost_usd / maxCost) * 100 : 0

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${item.date}: $${item.cost_usd.toFixed(2)} (${
                      item.requests
                    } requests)`}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Types */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Usage by Task Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.by_task_type.map((item) => (
            <div
              key={item.task_type}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <h4 className="font-medium text-gray-900 capitalize mb-2">
                {item.task_type.replace('_', ' ')}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requests:</span>
                  <span className="font-medium text-gray-900">
                    {item.requests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-gray-900">
                    ${item.cost_usd.toFixed(2)}
                  </span>
                </div>
                {item.average_quality_score > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-medium text-gray-900">
                      {(item.average_quality_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper component for summary cards
function SummaryCard({
  icon,
  title,
  value,
  subtext,
  trend,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtext: string
  trend?: string
}) {
  const isPositive = trend?.startsWith('+')
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        {trend && (
          <span className={`text-sm font-medium ${trendColor}`}>{trend}</span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  )
}
