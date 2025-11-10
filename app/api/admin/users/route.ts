import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { requireAdmin, createAuditLog } from '@/lib/auth/admin-middleware'
import { createUserProfileSchema } from '@/lib/validation/schemas'
import type { CreateUserProfileRequest } from '@/types'

/**
 * GET /api/admin/users
 * List all user profiles (admin only)
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
    const role = searchParams.get('role')
    const is_active = searchParams.get('is_active')

    // Build query
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by role if provided
    if (role) {
      query = query.eq('role', role)
    }

    // Filter by active status if provided
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch users:', error)
      return apiError('Failed to fetch users')
    }

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/users
 * Create a new user profile (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.response
    }

    const body: CreateUserProfileRequest = await request.json()

    // Validate request body
    const validatedData = createUserProfileSchema.parse(body)

    const supabase = await createClient()

    // Get current user's profile for audit log
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', auth.user?.email || '')
      .single()

    // Insert the user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: null, // Will be set when user signs up
        email: validatedData.email,
        full_name: validatedData.full_name || null,
        role: validatedData.role,
        is_active: validatedData.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return apiError('User with this email already exists', 409)
      }
      console.error('Failed to create user:', error)
      return apiError('Failed to create user')
    }

    // Create audit log
    await createAuditLog({
      userId: adminProfile?.id,
      action: 'create',
      resourceType: 'user',
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
