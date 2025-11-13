import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { completeTaskSchema } from '@/lib/validation/schemas'
import { onTaskComplete } from '@/lib/jobs/background-jobs'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validation = completeTaskSchema.safeParse(body)
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400)
    }

    const { agent_id, output_data } = validation.data

    // Verify task is assigned to this agent
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('assigned_agent_id, status')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!task) return apiError('Task not found', 404)

    if (task.assigned_agent_id !== agent_id) {
      return apiError('Task is not assigned to this agent', 403)
    }

    if (!['assigned', 'in_progress'].includes(task.status)) {
      return apiError('Task is not in a valid state for completion', 400)
    }

    // Mark task as completed
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        output_data,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Trigger intelligence layer analysis (async)
    onTaskComplete(id).catch(err => console.error('Failed to trigger analysis:', err))

    return apiSuccess(updatedTask)
  } catch (error) {
    return handleApiError(error)
  }
}
