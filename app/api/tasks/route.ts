import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { CreateTaskRequest } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('tasks')
      .select('*, projects(*), agents(*)')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: CreateTaskRequest = await request.json()

    // Validation
    if (!body.title || body.title.trim() === '') {
      return apiError('Task title is required')
    }

    if (!body.project_id) {
      return apiError('project_id is required')
    }

    if (!body.type) {
      return apiError('Task type is required')
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        project_id: body.project_id,
        title: body.title,
        description: body.description || null,
        type: body.type,
        priority: body.priority ?? 5,
        status: 'pending',
        assigned_agent_id: null,
        dependencies: body.dependencies || [],
        required_capabilities: body.required_capabilities || [],
        input_data: body.input_data || {},
        output_data: null,
        error_message: null,
        started_at: null,
        completed_at: null,
        metadata: body.metadata || {}
      }])
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
