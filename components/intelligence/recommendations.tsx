'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'performance' | 'efficiency' | 'reliability' | 'cost' | 'security'
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact: {
    score: number
    description: string
  }
  effort: {
    level: 'low' | 'medium' | 'high'
    estimatedTime: string
  }
  implementation: {
    steps: string[]
    prerequisites: string[]
    risks: string[]
  }
  metrics: {
    before: string
    after: string
  }
  status: 'new' | 'in_progress' | 'completed' | 'dismissed'
  createdAt: string
}

interface RecommendationsData {
  recommendations: Recommendation[]
  summary: {
    total: number
    highPriority: number
    avgImpactScore: number
    potentialSavings: string
  }
}

export function Recommendations() {
  const [data, setData] = useState<RecommendationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/intelligence/recommendations')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/intelligence/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      })
      fetchRecommendations()
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error)
    }
  }

  const handleMarkInProgress = async (id: string) => {
    try {
      await fetch(`/api/intelligence/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      })
      fetchRecommendations()
    } catch (error) {
      console.error('Failed to update recommendation:', error)
    }
  }

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-800 rounded w-1/3"></div>
          <div className="h-32 bg-neutral-800 rounded"></div>
          <div className="h-32 bg-neutral-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6 text-center">
        <p className="text-neutral-400">No recommendations available</p>
      </div>
    )
  }

  const filteredRecommendations = data.recommendations.filter(rec => {
    if (filter === 'all') return rec.status === 'new' || rec.status === 'in_progress'
    return (rec.status === 'new' || rec.status === 'in_progress') && rec.priority === filter
  })

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">AI-Generated Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-sm text-neutral-400 mb-1">Total Recommendations</p>
            <p className="text-2xl font-semibold text-white">{data.summary.total}</p>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-sm text-neutral-400 mb-1">High Priority</p>
            <p className="text-2xl font-semibold text-orange-400">{data.summary.highPriority}</p>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-sm text-neutral-400 mb-1">Avg Impact Score</p>
            <p className="text-2xl font-semibold text-green-400">{data.summary.avgImpactScore}/10</p>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-sm text-neutral-400 mb-1">Potential Savings</p>
            <p className="text-2xl font-semibold text-blue-400">{data.summary.potentialSavings}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'high' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('high')}
        >
          High Priority
        </Button>
        <Button
          variant={filter === 'medium' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('medium')}
        >
          Medium
        </Button>
        <Button
          variant={filter === 'low' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('low')}
        >
          Low
        </Button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {sortedRecommendations.length === 0 ? (
          <div className="border border-neutral-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-neutral-400">No recommendations match your filter</p>
          </div>
        ) : (
          sortedRecommendations.map((rec) => {
            const isExpanded = expandedId === rec.id

            return (
              <div
                key={rec.id}
                className={`border rounded-lg transition-all ${
                  rec.priority === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                  rec.priority === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
                  rec.priority === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                  'border-neutral-800 bg-neutral-900/50'
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          rec.priority === 'critical' ? 'error' :
                          rec.priority === 'high' ? 'warning' :
                          rec.priority === 'medium' ? 'warning' :
                          'neutral'
                        }>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                        {rec.status === 'in_progress' && (
                          <Badge variant="primary">In Progress</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-white">{rec.title}</h3>
                      <p className="text-sm text-neutral-300 mt-2">{rec.description}</p>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="ml-4 p-2 hover:bg-neutral-800 rounded transition-colors"
                    >
                      <svg
                        className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Impact Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${rec.impact.score * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-white">{rec.impact.score}/10</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Effort Level</p>
                      <Badge variant={
                        rec.effort.level === 'low' ? 'success' :
                        rec.effort.level === 'medium' ? 'warning' :
                        'error'
                      }>
                        {rec.effort.level} - {rec.effort.estimatedTime}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Created</p>
                      <p className="text-sm text-neutral-300">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-neutral-800">
                      {/* Impact Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Expected Impact</h4>
                        <p className="text-sm text-neutral-300">{rec.impact.description}</p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="p-3 bg-neutral-800/50 rounded">
                            <p className="text-xs text-neutral-500 mb-1">Current State</p>
                            <p className="text-sm text-neutral-200">{rec.metrics.before}</p>
                          </div>
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                            <p className="text-xs text-green-400 mb-1">Expected Result</p>
                            <p className="text-sm text-green-200">{rec.metrics.after}</p>
                          </div>
                        </div>
                      </div>

                      {/* Implementation Steps */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Implementation Guide</h4>
                        <div className="space-y-2">
                          {rec.implementation.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-neutral-300 flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prerequisites */}
                      {rec.implementation.prerequisites.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Prerequisites</h4>
                          <ul className="space-y-1">
                            {rec.implementation.prerequisites.map((prereq, idx) => (
                              <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                {prereq}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risks */}
                      {rec.implementation.risks.length > 0 && (
                        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded">
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Risks & Considerations</h4>
                          <ul className="space-y-1">
                            {rec.implementation.risks.map((risk, idx) => (
                              <li key={idx} className="text-sm text-yellow-200 flex items-start gap-2">
                                <span className="text-yellow-400 mt-0.5">⚠</span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {rec.status === 'new' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleMarkInProgress(rec.id)}
                          >
                            Start Implementation
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismiss(rec.id)}
                        >
                          Dismiss
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Copy implementation guide
                            const guide = rec.implementation.steps.join('\n')
                            navigator.clipboard.writeText(guide)
                          }}
                        >
                          Copy Guide
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
