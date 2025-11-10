import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/utils/api-helpers'
import type { DashboardStats } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get project stats
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('status')

    if (projectsError) throw projectsError

    // Get task stats
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status')

    if (tasksError) throw tasksError

    // Get agent stats
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('status')

    if (agentsError) throw agentsError

    // Get analysis stats
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis_history')
      .select('status')

    if (analysisError) throw analysisError

    const stats: DashboardStats = {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        paused: projects.filter(p => p.status === 'paused').length,
        archived: projects.filter(p => p.status === 'archived').length
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length
      },
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        idle: agents.filter(a => a.status === 'idle').length,
        busy: agents.filter(a => a.status === 'busy').length,
        offline: agents.filter(a => a.status === 'offline').length,
        error: agents.filter(a => a.status === 'error').length
      },
      analysis: {
        total: analysis.length,
        pending: analysis.filter(a => a.status === 'pending').length,
        reviewed: analysis.filter(a => a.status === 'reviewed').length,
        approved: analysis.filter(a => a.status === 'approved').length
      }
    }

    return apiSuccess(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
