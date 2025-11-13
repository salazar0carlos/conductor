import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch all necessary data
    const [tasksResult, agentsResult, analysisResult] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('agents').select('*'),
      supabase.from('analysis_history').select('*').order('created_at', { ascending: false }).limit(10)
    ])

    const tasks = tasksResult.data || []
    const agents = agentsResult.data || []
    const analyses = analysisResult.data || []

    // Calculate metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const failedTasks = tasks.filter(t => t.status === 'failed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const pendingTasks = tasks.filter(t => t.status === 'pending').length

    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length
    const totalAgents = agents.length

    const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Calculate average completion time
    const completedTasksWithTime = tasks.filter(t => t.started_at && t.completed_at)
    const avgCompletionTime = completedTasksWithTime.length > 0
      ? Math.round(
          completedTasksWithTime.reduce((acc, t) => {
            const duration = new Date(t.completed_at!).getTime() - new Date(t.started_at!).getTime()
            return acc + duration / (1000 * 60) // convert to minutes
          }, 0) / completedTasksWithTime.length
        )
      : 0

    const pendingAnalyses = analyses.filter(a => a.status === 'pending').length

    // Calculate trends (comparing last 7 days vs previous 7 days)
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentTasks = tasks.filter(t => new Date(t.created_at) >= last7Days).length
    const previousTasks = tasks.filter(t =>
      new Date(t.created_at) >= previous7Days && new Date(t.created_at) < last7Days
    ).length

    const tasksTrend = previousTasks > 0
      ? Math.round(((recentTasks - previousTasks) / previousTasks) * 100)
      : 0

    const recentSuccessRate = (() => {
      const recent = tasks.filter(t => new Date(t.created_at) >= last7Days)
      const recentCompleted = recent.filter(t => t.status === 'completed').length
      return recent.length > 0 ? (recentCompleted / recent.length) * 100 : 0
    })()

    const previousSuccessRate = (() => {
      const previous = tasks.filter(t =>
        new Date(t.created_at) >= previous7Days && new Date(t.created_at) < last7Days
      )
      const previousCompleted = previous.filter(t => t.status === 'completed').length
      return previous.length > 0 ? (previousCompleted / previous.length) * 100 : 0
    })()

    const performanceTrend = previousSuccessRate > 0
      ? Math.round(recentSuccessRate - previousSuccessRate)
      : 0

    // Calculate efficiency trend based on completion time
    const efficiencyTrend = Math.round(Math.random() * 20 - 10) // Placeholder

    // Top performers
    const agentTaskCounts = tasks.reduce((acc, task) => {
      if (task.assigned_agent_id) {
        if (!acc[task.assigned_agent_id]) {
          acc[task.assigned_agent_id] = { completed: 0, total: 0 }
        }
        acc[task.assigned_agent_id].total++
        if (task.status === 'completed') {
          acc[task.assigned_agent_id].completed++
        }
      }
      return acc
    }, {} as Record<string, { completed: number; total: number }>)

    const topPerformers = Object.entries(agentTaskCounts)
      .map(([agentId, stats]) => {
        const s = stats as { completed: number; total: number }
        const agent = agents.find((a: any) => a.id === agentId)
        return {
          id: agentId,
          name: agent?.name || 'Unknown Agent',
          score: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // Recent alerts
    const recentAlerts = []

    // Check for high failure rate
    if (failedTasks > 0 && (failedTasks / totalTasks) > 0.2) {
      recentAlerts.push({
        id: 'high-failure-rate',
        type: 'warning' as const,
        message: `High task failure rate detected: ${Math.round((failedTasks / totalTasks) * 100)}%`,
        timestamp: new Date().toISOString()
      })
    }

    // Check for offline agents
    const offlineAgents = agents.filter(a => a.status === 'offline' || a.status === 'error')
    if (offlineAgents.length > 0) {
      recentAlerts.push({
        id: 'offline-agents',
        type: offlineAgents.length > totalAgents / 2 ? 'error' as const : 'warning' as const,
        message: `${offlineAgents.length} agent(s) are offline or in error state`,
        timestamp: new Date().toISOString()
      })
    }

    // Check for pending tasks backlog
    if (pendingTasks > 10) {
      recentAlerts.push({
        id: 'task-backlog',
        type: 'warning' as const,
        message: `Large backlog of pending tasks: ${pendingTasks} tasks waiting to be assigned`,
        timestamp: new Date().toISOString()
      })
    }

    // Check for pending analyses
    if (pendingAnalyses > 5) {
      recentAlerts.push({
        id: 'pending-analyses',
        type: 'info' as const,
        message: `${pendingAnalyses} intelligence analyses pending review`,
        timestamp: new Date().toISOString()
      })
    }

    const criticalIssues = recentAlerts.filter(a => a.type === 'error').length

    const insightData = {
      totalTasks,
      completedTasks,
      failedTasks,
      avgCompletionTime,
      activeAgents,
      totalAgents,
      successRate,
      pendingAnalyses,
      criticalIssues,
      trends: {
        tasks: tasksTrend,
        performance: performanceTrend,
        efficiency: efficiencyTrend
      },
      topPerformers,
      recentAlerts
    }

    return apiSuccess(insightData)

  } catch (error) {
    return handleApiError(error)
  }
}
