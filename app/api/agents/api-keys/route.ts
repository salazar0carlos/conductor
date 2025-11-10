import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { generateApiKey } from '@/lib/auth/api-keys'
import { createApiKeySchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate input
    const validation = createApiKeySchema.safeParse(body)
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400)
    }

    const { agent_id, name } = validation.data

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return apiError('Agent not found', 404)
    }

    // Generate API key
    const { key, keyPrefix } = await generateApiKey(agent_id, name)

    return apiSuccess({
      api_key: key,
      key_prefix: keyPrefix,
      message: 'API key generated successfully. Save it securely - it will not be shown again.'
    }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const agent_id = searchParams.get('agent_id')

    let query = supabase
      .from('agent_api_keys')
      .select('id, agent_id, key_prefix, name, scopes, last_used_at, expires_at, created_at')
      .order('created_at', { ascending: false })

    if (agent_id) {
      query = query.eq('agent_id', agent_id)
    }

    const { data, error } = await query

    if (error) throw error

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}
