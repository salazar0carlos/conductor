import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { CreateAgentRequest } from '@/types'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agents')
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
    const body: CreateAgentRequest = await request.json()

    // Validation
    if (!body.name || body.name.trim() === '') {
      return apiError('Agent name is required')
    }

    if (!body.type) {
      return apiError('Agent type is required')
    }

    if (!body.capabilities || body.capabilities.length === 0) {
      return apiError('Agent must have at least one capability')
    }

    const { data, error } = await supabase
      .from('agents')
      .insert([{
        name: body.name,
        type: body.type,
        capabilities: body.capabilities,
        config: body.config || {},
        status: 'idle',
        last_heartbeat: null,
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
