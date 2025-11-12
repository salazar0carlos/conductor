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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    // Check subscription limits before creating project
    const { data: canCreate, error: checkError } = await supabase.rpc('can_create_project', {
      p_user_id: user.id,
    })

    if (checkError) {
      console.error('Error checking project limit:', checkError)
      // Fail open - allow creation if check fails
    } else if (!canCreate) {
      // User has reached their project limit
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, max_projects')
        .eq('user_id', user.id)
        .single()

      const currentPlan = subscription?.plan || 'free'
      const maxProjects = subscription?.max_projects || 1

      return apiError(
        `Project limit reached. Your ${currentPlan} plan allows ${maxProjects} project${maxProjects > 1 ? 's' : ''}. Please upgrade your subscription to create more projects.`,
        403
      )
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
