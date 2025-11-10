import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, handleApiError } from '@/lib/utils/api-helpers'
import { requireAdmin } from '@/lib/auth/admin-middleware'

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = await createClient()

    // Use the admin_statistics view
    const { data, error } = await supabase
      .from('admin_statistics')
      .select('*')
      .single()

    if (error) {
      console.error('Failed to fetch admin stats:', error)
      return apiSuccess({
        active_users: 0,
        admin_count: 0,
        active_agents: 0,
        active_tasks: 0,
        settings_count: 0
      })
    }

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}
