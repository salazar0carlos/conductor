import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { requireAdmin, createAuditLog } from '@/lib/auth/admin-middleware'
import { createSystemSettingSchema } from '@/lib/validation/schemas'
import type { CreateSystemSettingRequest } from '@/types'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/settings
 * List all system settings (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch settings:', error)
      return apiError('Failed to fetch settings')
    }

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/settings
 * Create a new system setting (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const body: CreateSystemSettingRequest = await request.json()

    // Validate request body
    const validatedData = createSystemSettingSchema.parse(body)

    const supabase = await createClient()

    // Get user profile for audit log
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', auth.user?.email || '')
      .single()

    // Insert the setting
    const { data, error } = await supabase
      .from('system_settings')
      .insert({
        key: validatedData.key,
        value: validatedData.value,
        category: validatedData.category,
        description: validatedData.description || null,
        data_type: validatedData.data_type,
        is_public: validatedData.is_public ?? false,
        is_editable: validatedData.is_editable ?? true,
        updated_by: profile?.id || null
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return apiError('Setting with this key already exists', 409)
      }
      console.error('Failed to create setting:', error)
      return apiError('Failed to create setting')
    }

    // Create audit log
    await createAuditLog({
      userId: profile?.id,
      action: 'create',
      resourceType: 'setting',
      resourceId: data.id,
      newValue: data as unknown as Record<string, unknown>,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return apiSuccess(data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
