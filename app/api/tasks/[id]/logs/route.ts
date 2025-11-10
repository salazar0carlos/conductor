import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { CreateTaskLogRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body: CreateTaskLogRequest = await request.json()

    if (!body.message) {
      return apiError('message is required')
    }

    if (!body.level) {
      return apiError('level is required')
    }

    const { data, error } = await supabase
      .from('task_logs')
      .insert([{
        task_id: id,
        agent_id: body.agent_id || null,
        level: body.level,
        message: body.message,
        data: body.data || {}
      }])
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
