import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { UpdateProjectRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return apiError('Project not found', 404)

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
    const body: UpdateProjectRequest = await request.json()

    const { data, error } = await supabase
      .from('projects')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return apiError('Project not found', 404)

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
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error

    return apiSuccess({ message: 'Project deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
