import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/utils/api-helpers'

/**
 * Admin authorization middleware for API routes
 * Checks if the authenticated user has admin role
 */
export async function requireAdmin(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user from Supabase auth
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        response: apiError('Unauthorized: Please log in', 401)
      }
    }

    // Check if user has admin role in user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('email', user.email)
      .single()

    if (profileError || !profile) {
      return {
        authorized: false,
        response: apiError('User profile not found', 403)
      }
    }

    // Verify user is an active admin
    if (profile.role !== 'admin') {
      return {
        authorized: false,
        response: apiError('Forbidden: Admin access required', 403)
      }
    }

    if (!profile.is_active) {
      return {
        authorized: false,
        response: apiError('Forbidden: User account is inactive', 403)
      }
    }

    // User is authorized
    return {
      authorized: true,
      user,
      profile
    }
  } catch (error) {
    console.error('Admin middleware error:', error)
    return {
      authorized: false,
      response: apiError('Internal server error', 500)
    }
  }
}

/**
 * Check if user has operator or admin role (for read-only access)
 */
export async function requireOperator(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user from Supabase auth
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        response: apiError('Unauthorized: Please log in', 401)
      }
    }

    // Check if user has operator or admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('email', user.email)
      .single()

    if (profileError || !profile) {
      return {
        authorized: false,
        response: apiError('User profile not found', 403)
      }
    }

    // Verify user is an active operator or admin
    if (profile.role !== 'admin' && profile.role !== 'operator') {
      return {
        authorized: false,
        response: apiError('Forbidden: Operator or admin access required', 403)
      }
    }

    if (!profile.is_active) {
      return {
        authorized: false,
        response: apiError('Forbidden: User account is inactive', 403)
      }
    }

    // User is authorized
    return {
      authorized: true,
      user,
      profile
    }
  } catch (error) {
    console.error('Operator middleware error:', error)
    return {
      authorized: false,
      response: apiError('Internal server error', 500)
    }
  }
}

/**
 * Get current user profile (if any)
 * Does not require authentication
 */
export async function getCurrentUserProfile() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .single()

    return profile
  } catch (error) {
    console.error('Get current user profile error:', error)
    return null
  }
}

/**
 * Create audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  oldValue,
  newValue,
  ipAddress,
  userAgent
}: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const supabase = await createClient()

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_value: oldValue,
      new_value: newValue,
      ip_address: ipAddress,
      user_agent: userAgent
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging failure shouldn't break the request
  }
}
