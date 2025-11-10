import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { UpdateAnalysisRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return apiError('Analysis not found', 404)

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
    const body: UpdateAnalysisRequest = await request.json()

    const updateData: Record<string, unknown> = { ...body }

    if (body.status === 'reviewed' && !body.reviewed_by_agent_id) {
      return apiError('reviewed_by_agent_id is required when marking as reviewed')
    }

    if (body.status === 'reviewed') {
      updateData.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('analysis_history')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return apiError('Analysis not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}
