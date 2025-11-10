import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { PollTaskRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: PollTaskRequest = await request.json()

    if (!body.agent_id) {
      return apiError('agent_id is required')
    }

    if (!body.capabilities || body.capabilities.length === 0) {
      return apiError('capabilities array is required')
    }

    // Find the highest priority pending task that matches agent capabilities
    // and has no unmet dependencies
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (tasksError) throw tasksError

    // Filter tasks by capabilities and dependencies
    let assignableTask = null

    for (const task of tasks || []) {
      // Check if agent has required capabilities
      const hasCapabilities = task.required_capabilities.length === 0 ||
        task.required_capabilities.every((cap: string) => body.capabilities.includes(cap))

      if (!hasCapabilities) continue

      // Check if all dependencies are completed
      if (task.dependencies.length > 0) {
        const { data: depTasks, error: depError } = await supabase
          .from('tasks')
          .select('id, status')
          .in('id', task.dependencies)

        if (depError) continue

        const allDepsCompleted = depTasks?.every(dep => dep.status === 'completed') ?? false
        if (!allDepsCompleted) continue
      }

      assignableTask = task
      break
    }

    if (!assignableTask) {
      return apiSuccess({ task: null })
    }

    // Assign task to agent
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'assigned',
        assigned_agent_id: body.agent_id,
        started_at: new Date().toISOString()
      })
      .eq('id', assignableTask.id)
      .select()
      .single()

    if (updateError) throw updateError

    return apiSuccess({ task: updatedTask })
  } catch (error) {
    return handleApiError(error)
  }
}
