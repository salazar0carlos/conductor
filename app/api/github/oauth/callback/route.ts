import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')

    if (!code || !stateParam) {
      return apiError('Missing code or state parameter', 400)
    }

    // Parse state to determine flow type
    let state: { type: string; project_id?: string }
    try {
      state = JSON.parse(stateParam)
    } catch {
      // Legacy format: state is just project_id
      state = { type: 'project', project_id: stateParam }
    }

    // Exchange code for access token
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return apiError('GitHub OAuth not configured', 500)
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return apiError(`GitHub OAuth error: ${tokenData.error_description}`, 400)
    }

    const accessToken = tokenData.access_token
    const supabase = await createClient()

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    })

    const githubUser = await userResponse.json()

    // Handle based on flow type
    if (state.type === 'integration') {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return apiError('Unauthorized', 401)
      }

      // Store in user_integrations table
      const { error: insertError } = await supabase
        .from('user_integrations')
        .insert({
          user_id: user.id,
          integration_type: 'github',
          integration_name: `GitHub (${githubUser.login})`,
          oauth_token: accessToken,
          status: 'active',
          scopes: ['repo', 'read:user', 'admin:repo_hook'],
          config: {
            username: githubUser.login,
            user_id: githubUser.id,
            avatar_url: githubUser.avatar_url
          }
        })

      if (insertError) {
        console.error('Error storing GitHub integration:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=failed_to_store`
        )
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&success=github`
      )
    } else if (state.type === 'project' && state.project_id) {
      // Store access token in project
      const { error: updateError } = await supabase
        .from('projects')
        .update({ github_access_token: accessToken })
        .eq('id', state.project_id)

      if (updateError) {
        console.error('Error updating project with GitHub token:', updateError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/projects/${state.project_id}?error=failed_to_connect`
        )
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/projects/${state.project_id}?success=github`
      )
    } else {
      return apiError('Invalid state type', 400)
    }
  } catch (error) {
    return handleApiError(error)
  }
}
