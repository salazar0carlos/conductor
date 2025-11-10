'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { AnalysisHistory } from '@/types'

export function AnalysisList() {
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const fetchAnalyses = async () => {
    try {
      const res = await fetch('/api/intelligence')
      const data = await res.json()
      if (data.success) {
        setAnalyses(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Loading intelligence data...</div>
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'reviewed': return 'primary'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      case 'implemented': return 'success'
      default: return 'neutral'
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'task_completion': return '✅'
      case 'pattern_detection': return '🔍'
      case 'improvement_suggestion': return '💡'
      case 'quality_review': return '⭐'
      default: return '📊'
    }
  }

  return (
    <div className="space-y-4">
      {analyses.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-400">No intelligence data yet</p>
        </div>
      ) : (
        analyses.map((analysis) => (
          <div
            key={analysis.id}
            className="border border-neutral-800 rounded-lg p-5 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-xl">{typeIcon(analysis.analysis_type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-white capitalize">
                      {analysis.analysis_type.replace('_', ' ')}
                    </h3>
                    {analysis.priority_score !== null && (
                      <Badge variant={analysis.priority_score >= 7 ? 'error' : 'warning'}>
                        P{analysis.priority_score}
                      </Badge>
                    )}
                  </div>

                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="space-y-2">
                      {analysis.suggestions.map((suggestion: Record<string, unknown>, idx: number) => (
                        <div key={idx} className="text-sm text-neutral-300">
                          💡 {JSON.stringify(suggestion)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={statusVariant(analysis.status)}>{analysis.status}</Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
              {analysis.reviewed_at && (
                <>
                  <span>•</span>
                  <span>Reviewed {new Date(analysis.reviewed_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
