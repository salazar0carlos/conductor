import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { defaultPlatformTheme } from '@/lib/platform-theme'

export const dynamic = 'force-dynamic'

// GET /api/platform-theme - Get user's platform theme
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
      .from('platform_theme_settings')
      .select('theme_data')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      throw error
    }

    // Return user's theme or default
    const theme = data?.theme_data || defaultPlatformTheme

    return apiSuccess(theme)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/platform-theme - Update user's platform theme
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const theme = await request.json()

    // Check if theme exists
    const { data: existing } = await supabase
      .from('platform_theme_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing theme
      const { error } = await supabase
        .from('platform_theme_settings')
        .update({ theme_data: theme })
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      // Insert new theme
      const { error } = await supabase
        .from('platform_theme_settings')
        .insert({ user_id: user.id, theme_data: theme })

      if (error) throw error
    }

    return apiSuccess(theme)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/platform-theme - Reset to default theme
export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { error } = await supabase
      .from('platform_theme_settings')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return apiSuccess(defaultPlatformTheme)
  } catch (error) {
    return handleApiError(error)
  }
}
