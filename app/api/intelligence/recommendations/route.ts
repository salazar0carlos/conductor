import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/utils/api-helpers'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch data for analysis
    const [tasksResult, agentsResult, analysisResult] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('agents').select('*'),
      supabase.from('analysis_history').select('*')
    ])

    const tasks = tasksResult.data || []
    const agents = agentsResult.data || []
    const analyses = analysisResult.data || []

    const recommendations = []

    // Recommendation 1: Agent scaling based on task backlog
    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length

    if (pendingTasks > 10 && activeAgents < 5) {
      recommendations.push({
        id: 'scale-agents',
        title: 'Scale Up Agent Capacity',
        description: `You have ${pendingTasks} pending tasks but only ${activeAgents} active agents. Scaling up could improve throughput.`,
        category: 'performance' as const,
        priority: pendingTasks > 50 ? 'critical' as const : pendingTasks > 25 ? 'high' as const : 'medium' as const,
        impact: {
          score: 8,
          description: 'Significantly reduce task queue wait times and improve overall system throughput'
        },
        effort: {
          level: 'medium' as const,
          estimatedTime: '2-4 hours'
        },
        implementation: {
          steps: [
            'Review current agent capacity and capabilities',
            'Identify which agent types are most needed based on pending task requirements',
            'Deploy additional agents with appropriate configurations',
            'Monitor task assignment rates and adjust as needed',
            'Set up auto-scaling policies for future demand'
          ],
          prerequisites: [
            'Sufficient infrastructure resources available',
            'Agent deployment automation configured'
          ],
          risks: [
            'Increased infrastructure costs',
            'Potential for resource contention if not properly managed'
          ]
        },
        metrics: {
          before: `${pendingTasks} tasks waiting, avg wait time unknown`,
          after: `Expected 60-80% reduction in task queue size within 24 hours`
        },
        status: 'new' as const,
        createdAt: new Date().toISOString()
      })
    }

    // Recommendation 2: Optimize failing tasks
    const failedTasks = tasks.filter(t => t.status === 'failed')
    if (failedTasks.length > 5) {
      const failureRate = (failedTasks.length / tasks.length) * 100

      recommendations.push({
        id: 'optimize-failures',
        title: 'Investigate and Reduce Task Failures',
        description: `${failedTasks.length} tasks have failed (${failureRate.toFixed(1)}% failure rate). Analyzing failure patterns could improve reliability.`,
        category: 'reliability' as const,
        priority: failureRate > 20 ? 'high' as const : 'medium' as const,
        impact: {
          score: 7,
          description: 'Improve success rate and reduce wasted compute resources on retries'
        },
        effort: {
          level: 'medium' as const,
          estimatedTime: '4-6 hours'
        },
        implementation: {
          steps: [
            'Group failed tasks by error type and pattern',
            'Identify the top 3 most common failure reasons',
            'Review agent configurations for tasks with high failure rates',
            'Update task definitions with better error handling or prerequisites',
            'Implement retry logic with exponential backoff where appropriate'
          ],
          prerequisites: [
            'Access to detailed task logs',
            'Understanding of task requirements and agent capabilities'
          ],
          risks: [
            'Some failures may be due to external dependencies beyond control'
          ]
        },
        metrics: {
          before: `${failureRate.toFixed(1)}% task failure rate`,
          after: `Target: <10% failure rate after optimization`
        },
        status: 'new' as const,
        createdAt: new Date().toISOString()
      })
    }

    // Recommendation 3: Agent capability optimization
    const agentTaskCounts = agents.map(agent => ({
      agent,
      taskCount: tasks.filter(t => t.assigned_agent_id === agent.id).length
    }))

    const idleAgents = agentTaskCounts.filter(a => a.taskCount === 0 && a.agent.status === 'active')
    if (idleAgents.length > 2) {
      recommendations.push({
        id: 'optimize-idle-agents',
        title: 'Optimize Idle Agent Utilization',
        description: `${idleAgents.length} agents are active but have no assigned tasks. Consider adjusting capabilities or pausing unused agents.`,
        category: 'efficiency' as const,
        priority: 'medium' as const,
        impact: {
          score: 6,
          description: 'Reduce infrastructure costs by optimizing agent allocation'
        },
        effort: {
          level: 'low' as const,
          estimatedTime: '1-2 hours'
        },
        implementation: {
          steps: [
            'Review capabilities of idle agents',
            'Check if pending tasks require capabilities these agents have',
            'Update agent capabilities to match current task requirements',
            'Consider pausing or deactivating agents that are not needed',
            'Set up monitoring alerts for extended idle periods'
          ],
          prerequisites: [
            'List of current and planned task types',
            'Agent management permissions'
          ],
          risks: [
            'May need to reactivate agents quickly if demand spikes'
          ]
        },
        metrics: {
          before: `${idleAgents.length} idle agents consuming resources`,
          after: `0-1 idle agents, potential 15-30% cost savings`
        },
        status: 'new' as const,
        createdAt: new Date().toISOString()
      })
    }

    // Recommendation 4: Task dependency optimization
    const tasksWithDeps = tasks.filter(t => t.dependencies && t.dependencies.length > 0)
    const blockedTasks = tasksWithDeps.filter(t => t.status === 'pending')

    if (blockedTasks.length > 5) {
      recommendations.push({
        id: 'optimize-dependencies',
        title: 'Optimize Task Dependency Chains',
        description: `${blockedTasks.length} tasks are blocked by dependencies. Review dependency structure for parallelization opportunities.`,
        category: 'performance' as const,
        priority: 'medium' as const,
        impact: {
          score: 7,
          description: 'Reduce overall execution time through better parallelization'
        },
        effort: {
          level: 'high' as const,
          estimatedTime: '6-8 hours'
        },
        implementation: {
          steps: [
            'Map out current dependency chains visually',
            'Identify critical path and longest dependency chains',
            'Look for false dependencies that can be removed',
            'Break large tasks into smaller parallel subtasks where possible',
            'Implement smart dependency resolution to start tasks as soon as prerequisites are met'
          ],
          prerequisites: [
            'Understanding of task workflows and relationships',
            'Ability to modify task definitions'
          ],
          risks: [
            'Some dependencies may be necessary for correctness',
            'Changes could introduce race conditions if not carefully reviewed'
          ]
        },
        metrics: {
          before: `${blockedTasks.length} tasks blocked, unknown throughput`,
          after: `Target: 30-50% reduction in average task completion time`
        },
        status: 'new' as const,
        createdAt: new Date().toISOString()
      })
    }

    // Recommendation 5: Intelligence analysis review
    const pendingAnalyses = analyses.filter(a => a.status === 'pending')
    if (pendingAnalyses.length > 10) {
      recommendations.push({
        id: 'review-analyses',
        title: 'Review Pending Intelligence Analyses',
        description: `${pendingAnalyses.length} intelligence analyses are pending review. Regular review helps identify improvement opportunities.`,
        category: 'efficiency' as const,
        priority: 'low' as const,
        impact: {
          score: 5,
          description: 'Uncover insights and improvement opportunities from AI analysis'
        },
        effort: {
          level: 'low' as const,
          estimatedTime: '30-60 minutes'
        },
        implementation: {
          steps: [
            'Review pending analyses sorted by priority score',
            'Approve actionable suggestions',
            'Dismiss irrelevant or outdated analyses',
            'Create tasks for approved improvements',
            'Set up regular review schedule (e.g., weekly)'
          ],
          prerequisites: [
            'Understanding of system goals and priorities'
          ],
          risks: []
        },
        metrics: {
          before: `${pendingAnalyses.length} unreviewed analyses`,
          after: `All analyses reviewed, actionable items implemented`
        },
        status: 'new' as const,
        createdAt: new Date().toISOString()
      })
    }

    // Calculate summary
    const highPriorityCount = recommendations.filter(r =>
      r.priority === 'high' || r.priority === 'critical'
    ).length

    const avgImpactScore = recommendations.length > 0
      ? (recommendations.reduce((sum, r) => sum + r.impact.score, 0) / recommendations.length).toFixed(1)
      : '0.0'

    const recommendationsData = {
      recommendations,
      summary: {
        total: recommendations.length,
        highPriority: highPriorityCount,
        avgImpactScore: parseFloat(avgImpactScore),
        potentialSavings: '15-40%'
      }
    }

    return apiSuccess(recommendationsData)

  } catch (error) {
    return handleApiError(error)
  }
}
