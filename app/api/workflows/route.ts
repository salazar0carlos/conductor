import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    let query = supabase
      .from('workflow_instances')
      .select(`
        *,
        task:tasks!workflow_instances_task_id_fkey (
          id,
          title,
          description,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching workflows:', error)
      return apiError('Failed to fetch workflows', 500)
    }

    return apiSuccess({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { task_id, phases, quality_gates } = body

    if (!task_id || !phases || !Array.isArray(phases)) {
      return apiError('Missing required fields: task_id, phases', 400)
    }

    // Create workflow instance
    const { data: workflow, error: workflowError } = await supabase
      .from('workflow_instances')
      .insert({
        task_id,
        current_phase: phases[0],
        status: 'active',
        progress_percentage: 0
      })
      .select()
      .single()

    if (workflowError) {
      console.error('Error creating workflow:', workflowError)
      return apiError('Failed to create workflow', 500)
    }

    // Create quality gates for each phase
    if (quality_gates) {
      const gateInserts = []
      for (const [phase, gates] of Object.entries(quality_gates)) {
        if (Array.isArray(gates)) {
          for (const gate of gates) {
            gateInserts.push({
              workflow_instance_id: workflow.id,
              gate_type: gate,
              phase: phase,
              status: 'pending'
            })
          }
        }
      }

      if (gateInserts.length > 0) {
        const { error: gatesError } = await supabase
          .from('quality_gates')
          .insert(gateInserts)

        if (gatesError) {
          console.error('Error creating quality gates:', gatesError)
          // Don't fail the whole operation, just log the error
        }
      }
    }

    return apiSuccess({ data: workflow })
  } catch (error) {
    return handleApiError(error)
  }
}
