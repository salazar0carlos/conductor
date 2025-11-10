import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { CreateProjectRequest } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: CreateProjectRequest = await request.json()

    // Validation
    if (!body.name || body.name.trim() === '') {
      return apiError('Project name is required')
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: body.name,
        description: body.description || null,
        github_repo: body.github_repo || null,
        github_branch: body.github_branch || 'main',
        status: 'active',
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
