import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

/**
 * GET /api/settings
 * Get current user settings
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data, error } = await supabase.rpc('get_user_settings', {
      p_user_id: user.id,
    });

    if (error) throw error;

    return apiSuccess(data[0] || {});
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/settings
 * Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const settings = await request.json();

    const { data, error } = await supabase.rpc('update_user_settings', {
      p_user_id: user.id,
      p_settings: settings,
    });

    if (error) throw error;

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
