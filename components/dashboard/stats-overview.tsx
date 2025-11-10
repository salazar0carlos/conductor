'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import type { DashboardStats } from '@/types'

export function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Refresh every 10s

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-neutral-400">Loading stats...</div>
  }

  if (!stats) {
    return <div className="text-neutral-400">Failed to load stats</div>
  }

  return (
    <div className="space-y-8">
      {/* Projects */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Projects</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.projects.total} />
          <StatCard label="Active" value={stats.projects.active} variant="success" />
          <StatCard label="Paused" value={stats.projects.paused} variant="warning" />
          <StatCard label="Archived" value={stats.projects.archived} variant="default" />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Tasks</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.tasks.total} />
          <StatCard label="Pending" value={stats.tasks.pending} variant="warning" />
          <StatCard label="In Progress" value={stats.tasks.in_progress} variant="primary" />
          <StatCard label="Completed" value={stats.tasks.completed} variant="success" />
          <StatCard label="Failed" value={stats.tasks.failed} variant="error" />
        </div>
      </div>

      {/* Agents */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Agents</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard label="Total" value={stats.agents.total} />
          <StatCard label="Active" value={stats.agents.active} variant="success" />
          <StatCard label="Idle" value={stats.agents.idle} variant="default" />
          <StatCard label="Busy" value={stats.agents.busy} variant="primary" />
          <StatCard label="Offline" value={stats.agents.offline} variant="warning" />
          <StatCard label="Error" value={stats.agents.error} variant="error" />
        </div>
      </div>

      {/* Analysis */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Intelligence Layer</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.analysis.total} />
          <StatCard label="Pending" value={stats.analysis.pending} variant="warning" />
          <StatCard label="Reviewed" value={stats.analysis.reviewed} variant="primary" />
          <StatCard label="Approved" value={stats.analysis.approved} variant="success" />
        </div>
      </div>
    </div>
  )
}
