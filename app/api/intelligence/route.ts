import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { CreateAnalysisRequest } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('analysis_history')
      .select('*')
      .order('priority_score', { ascending: false })
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
    const body: CreateAnalysisRequest = await request.json()

    // Validation
    if (!body.analysis_type) {
      return apiError('analysis_type is required')
    }

    if (!body.findings) {
      return apiError('findings is required')
    }

    const { data, error } = await supabase
      .from('analysis_history')
      .insert([{
        analyzer_agent_id: body.analyzer_agent_id || null,
        task_id: body.task_id || null,
        project_id: body.project_id || null,
        analysis_type: body.analysis_type,
        findings: body.findings,
        suggestions: body.suggestions || [],
        priority_score: body.priority_score || null,
        status: 'pending',
        reviewed_by_agent_id: null,
        reviewed_at: null,
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
