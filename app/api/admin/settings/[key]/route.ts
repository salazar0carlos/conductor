import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { requireAdmin, createAuditLog } from '@/lib/auth/admin-middleware'
import { updateSystemSettingSchema } from '@/lib/validation/schemas'
import type { UpdateSystemSettingRequest } from '@/types'

/**
 * GET /api/admin/settings/[key]
 * Get a single system setting by key (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', params.key)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return apiError('Setting not found', 404)
      }
      console.error('Failed to fetch setting:', error)
      return apiError('Failed to fetch setting')
    }

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/admin/settings/[key]
 * Update a system setting by key (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const body: UpdateSystemSettingRequest = await request.json()

    // Validate request body
    const validatedData = updateSystemSettingSchema.parse(body)

    const supabase = await createClient()

    // Get current setting for audit log
    const { data: oldSetting } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', params.key)
      .single()

    if (!oldSetting) {
      return apiError('Setting not found', 404)
    }

    // Check if setting is editable
    if (!oldSetting.is_editable) {
      return apiError('This setting cannot be modified', 403)
    }

    // Get user profile for audit log
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', auth.user?.email || '')
      .single()

    // Update the setting
    const updateData: Record<string, unknown> = {}
    if (validatedData.value !== undefined) updateData.value = validatedData.value
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.is_public !== undefined) updateData.is_public = validatedData.is_public
    if (validatedData.is_editable !== undefined) updateData.is_editable = validatedData.is_editable
    if (profile?.id) updateData.updated_by = profile.id

    const { data, error } = await supabase
      .from('system_settings')
      .update(updateData)
      .eq('key', params.key)
      .select()
      .single()

    if (error) {
      console.error('Failed to update setting:', error)
      return apiError('Failed to update setting')
    }

    // Create audit log
    await createAuditLog({
      userId: profile?.id,
      action: 'update',
      resourceType: 'setting',
      resourceId: data.id,
      oldValue: oldSetting as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/settings/[key]
 * Delete a system setting by key (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = await createClient()

    // Get current setting for audit log and validation
    const { data: setting } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', params.key)
      .single()

    if (!setting) {
      return apiError('Setting not found', 404)
    }

    // Check if setting is editable
    if (!setting.is_editable) {
      return apiError('This setting cannot be deleted', 403)
    }

    // Get user profile for audit log
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', auth.user?.email || '')
      .single()

    // Delete the setting
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', params.key)

    if (error) {
      console.error('Failed to delete setting:', error)
      return apiError('Failed to delete setting')
    }

    // Create audit log
    await createAuditLog({
      userId: profile?.id,
      action: 'delete',
      resourceType: 'setting',
      resourceId: setting.id,
      oldValue: setting as unknown as Record<string, unknown>,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return apiSuccess({ message: 'Setting deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
