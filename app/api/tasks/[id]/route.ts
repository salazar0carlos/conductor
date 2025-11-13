import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { UpdateTaskRequest } from '@/types'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(*), agents(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return apiError('Task not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body: UpdateTaskRequest = await request.json()

    const { data, error } = await supabase
      .from('tasks')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return apiError('Task not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error

    return apiSuccess({ message: 'Task deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
