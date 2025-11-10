import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // project_id

    if (!code || !state) {
      return apiError('Missing code or state parameter', 400)
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

    // Store access token in project
    const supabase = await createClient()
    await supabase
      .from('projects')
      .update({ github_access_token: accessToken })
      .eq('id', state)

    return apiSuccess({
      message: 'GitHub connected successfully',
      redirect_url: `/projects/${state}`
    })
  } catch (error) {
    return handleApiError(error)
  }
}
