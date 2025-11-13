import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import type { AgentHeartbeatRequest } from '@/types'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: AgentHeartbeatRequest = await request.json()

    if (!body.agent_id) {
      return apiError('agent_id is required')
    }

    const { data, error } = await supabase
      .from('agents')
      .update({
        last_heartbeat: new Date().toISOString(),
        status: body.status || 'active'
      })
      .eq('id', body.agent_id)
      .select()
      .single()

    if (error) throw error
    if (!data) return apiError('Agent not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}
