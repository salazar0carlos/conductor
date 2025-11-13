import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/utils/api-helpers'
import type { TaskType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch data
    const [tasksResult, agentsResult, logsResult] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('agents').select('*'),
      supabase.from('task_logs').select('*').order('created_at', { ascending: false }).limit(100)
    ])

    const tasks = tasksResult.data || []
    const agents = agentsResult.data || []
    const logs = logsResult.data || []

    // Agent Performance Analysis
    const agentPerformance = agents.map(agent => {
      const agentTasks = tasks.filter(t => t.assigned_agent_id === agent.id)
      const completedTasks = agentTasks.filter(t => t.status === 'completed')
      const failedTasks = agentTasks.filter(t => t.status === 'failed')

      const successRate = agentTasks.length > 0
        ? Math.round((completedTasks.length / agentTasks.length) * 100)
        : 0

      // Calculate average response time (time from task creation to start)
      const responseTimes = agentTasks
        .filter(t => t.started_at)
        .map(t => {
          const created = new Date(t.created_at).getTime()
          const started = new Date(t.started_at!).getTime()
          return (started - created) / 1000 // seconds
        })

      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0

      // Calculate efficiency (tasks completed / tasks attempted)
      const avgEfficiency = successRate

      return {
        id: agent.id,
        name: agent.name,
        tasksCompleted: completedTasks.length,
        avgEfficiency,
        successRate,
        avgResponseTime,
        status: agent.status
      }
    }).sort((a, b) => b.successRate - a.successRate)

    // Task Statistics by Type
    const taskTypes = ['feature', 'bugfix', 'refactor', 'test', 'docs', 'analysis', 'review'] as TaskType[]
    const taskStatistics = taskTypes.map(type => {
      const typeTasks = tasks.filter(t => t.type === type)
      const completed = typeTasks.filter(t => t.status === 'completed').length
      const failed = typeTasks.filter(t => t.status === 'failed').length

      // Calculate average duration for completed tasks
      const durations = typeTasks
        .filter(t => t.started_at && t.completed_at)
        .map(t => {
          const started = new Date(t.started_at!).getTime()
          const completed = new Date(t.completed_at!).getTime()
          return (completed - started) / (1000 * 60) // minutes
        })

      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0

      const successRate = typeTasks.length > 0
        ? Math.round((completed / typeTasks.length) * 100)
        : 0

      return {
        type,
        total: typeTasks.length,
        completed,
        failed,
        avgDuration,
        successRate
      }
    }).filter(stat => stat.total > 0)

    // Bottleneck Detection
    const bottlenecks = []

    // Check for agents with high failure rates
    const problematicAgents = agentPerformance.filter(a => a.successRate < 70 && a.tasksCompleted > 5)
    if (problematicAgents.length > 0) {
      problematicAgents.forEach(agent => {
        bottlenecks.push({
          id: `agent-${agent.id}`,
          type: 'agent' as const,
          description: `Agent "${agent.name}" has a low success rate of ${agent.successRate}%`,
          severity: agent.successRate < 50 ? 'critical' as const : 'high' as const,
          affectedTasks: agent.tasksCompleted,
          suggestedAction: `Review agent configuration and recent task logs to identify failure patterns`
        })
      })
    }

    // Check for task types with high failure rates
    const problematicTaskTypes = taskStatistics.filter(t => t.successRate < 70 && t.total > 5)
    if (problematicTaskTypes.length > 0) {
      problematicTaskTypes.forEach(taskType => {
        bottlenecks.push({
          id: `task-type-${taskType.type}`,
          type: 'task' as const,
          description: `Task type "${taskType.type}" has a ${taskType.successRate}% success rate`,
          severity: taskType.successRate < 50 ? 'critical' as const : 'high' as const,
          affectedTasks: taskType.total,
          suggestedAction: `Analyze failed ${taskType.type} tasks to identify common patterns or missing capabilities`
        })
      })
    }

    // Check for dependency issues (tasks waiting for dependencies)
    const tasksWithDependencies = tasks.filter(t => t.dependencies && t.dependencies.length > 0 && t.status === 'pending')
    if (tasksWithDependencies.length > 5) {
      bottlenecks.push({
        id: 'dependency-bottleneck',
        type: 'dependency' as const,
        description: `${tasksWithDependencies.length} tasks are blocked waiting for dependencies`,
        severity: tasksWithDependencies.length > 20 ? 'high' as const : 'medium' as const,
        affectedTasks: tasksWithDependencies.length,
        suggestedAction: 'Review dependency chains and consider parallel execution where possible'
      })
    }

    // Check for slow response times
    const slowAgents = agentPerformance.filter(a => a.avgResponseTime > 60) // > 1 minute
    if (slowAgents.length > 0) {
      slowAgents.forEach(agent => {
        bottlenecks.push({
          id: `slow-agent-${agent.id}`,
          type: 'agent' as const,
          description: `Agent "${agent.name}" has slow response time (${agent.avgResponseTime}s average)`,
          severity: agent.avgResponseTime > 300 ? 'high' as const : 'medium' as const,
          affectedTasks: agent.tasksCompleted,
          suggestedAction: 'Investigate agent workload and consider scaling or optimization'
        })
      })
    }

    // Pattern Analysis
    const errorLogs = logs.filter(l => l.level === 'error')
    const errorCounts = errorLogs.reduce((acc, log) => {
      const errorMsg = log.message.substring(0, 100) // First 100 chars
      acc[errorMsg] = (acc[errorMsg] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Peak hours analysis
    const tasksByHour = tasks.reduce((acc, task) => {
      const hour = new Date(task.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      taskCount: tasksByHour[hour] || 0
    }))

    // Success patterns
    const successPatterns = []

    // Identify high-performing agent types
    const agentTypeSuccess = agents.reduce((acc, agent) => {
      const agentTasks = tasks.filter(t => t.assigned_agent_id === agent.id)
      const completedTasks = agentTasks.filter(t => t.status === 'completed')
      if (!acc[agent.type]) {
        acc[agent.type] = { total: 0, completed: 0 }
      }
      acc[agent.type].total += agentTasks.length
      acc[agent.type].completed += completedTasks.length
      return acc
    }, {} as Record<string, { total: number; completed: number }>)

    Object.entries(agentTypeSuccess).forEach(([type, stats]) => {
      const s = stats as { total: number; completed: number }
      if (s.total > 5 && s.completed / s.total > 0.8) {
        successPatterns.push({
          pattern: `${type} agents perform well`,
          impact: `${Math.round((s.completed / s.total) * 100)}% success rate across ${s.total} tasks`
        })
      }
    })

    // Identify successful task types
    const successfulTaskTypes = taskStatistics.filter(t => t.successRate > 85 && t.total > 5)
    if (successfulTaskTypes.length > 0) {
      successPatterns.push({
        pattern: `${successfulTaskTypes.map(t => t.type).join(', ')} tasks consistently succeed`,
        impact: 'These task types are well-configured and should be used as templates'
      })
    }

    const analyticsData = {
      agentPerformance,
      taskStatistics,
      bottlenecks,
      patterns: {
        commonErrors,
        peakHours,
        successPatterns
      }
    }

    return apiSuccess(analyticsData)

  } catch (error) {
    return handleApiError(error)
  }
}
