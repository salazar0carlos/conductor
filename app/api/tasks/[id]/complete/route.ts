import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { CompleteTaskRequest } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body: CompleteTaskRequest = await request.json()

    if (!body.agent_id) {
      return apiError('agent_id is required')
    }

    if (!body.output_data) {
      return apiError('output_data is required')
    }

    // Verify task is assigned to this agent
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('assigned_agent_id, status')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!task) return apiError('Task not found', 404)

    if (task.assigned_agent_id !== body.agent_id) {
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
        output_data: body.output_data,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return apiSuccess(updatedTask)
  } catch (error) {
    return handleApiError(error)
  }
}
