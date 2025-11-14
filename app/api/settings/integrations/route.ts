import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

/**
 * GET /api/settings/integrations
 * Get user's integrations
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

    const { data, error } = await supabase.rpc('get_user_integrations', {
      p_user_id: user.id,
    });

    if (error) throw error;

    return apiSuccess(data || []);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/settings/integrations
 * Add a new integration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json();

    // Validation
    if (!body.integration_type || !body.integration_name) {
      return apiError('Missing required fields: integration_type, integration_name');
    }

    // Trim and validate integration name
    const integrationName = body.integration_name.trim();
    if (!integrationName) {
      return apiError('Integration name cannot be empty');
    }

    const { data, error } = await supabase
      .from('user_integrations')
      .insert([
        {
          user_id: user.id,
          integration_type: body.integration_type,
          integration_name: integrationName,
          api_key: body.api_key,
          oauth_token: body.oauth_token,
          oauth_refresh_token: body.oauth_refresh_token,
          oauth_expires_at: body.oauth_expires_at,
          config: body.config || {},
          scopes: body.scopes || [],
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        return apiError(
          `An integration with the name "${integrationName}" already exists. Please choose a different name.`,
          409
        );
      }

      // Check for RLS policy violations (CRITICAL ERROR)
      if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
        return apiError(
          'Database security policies not configured. Please contact support or run the RLS migration.',
          500
        );
      }

      // Check for foreign key constraint violations
      if (error.code === '23503') {
        return apiError('Invalid user reference. Please try logging out and back in.', 400);
      }

      // Check for validation errors
      if (error.code === '23514' || error.message?.includes('check constraint')) {
        return apiError('Invalid integration type or configuration. Please check your inputs.', 400);
      }

      // Generic error with detailed message for debugging
      console.error('Integration save error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      throw error;
    }

    // Log activity (optional - don't fail if logging fails)
    try {
      await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'integration_added',
        p_description: `Added ${body.integration_type} integration: ${body.integration_name}`,
        p_metadata: { integration_id: data.id, integration_type: body.integration_type },
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
      // Continue anyway - logging is optional
    }

    return apiSuccess(data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/settings/integrations/:id
 * Remove an integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const url = new URL(request.url);
    const integrationId = url.searchParams.get('id');

    if (!integrationId) {
      return apiError('Integration ID is required');
    }

    // Get integration details before deleting
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('integration_type, integration_name')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Log activity (optional - don't fail if logging fails)
    if (integration) {
      try {
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'integration_removed',
          p_description: `Removed ${integration.integration_type} integration: ${integration.integration_name}`,
          p_metadata: { integration_id: integrationId },
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
        // Continue anyway - logging is optional
      }
    }

    return apiSuccess({ message: 'Integration removed successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
