import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-helpers'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'project' or 'integration'
    const projectId = searchParams.get('project_id')

    const clientId = process.env.GITHUB_CLIENT_ID

    if (!clientId) {
      return apiError('GitHub OAuth not configured', 500)
    }

    // Determine state and scope based on type
    let state: string
    let scope: string

    if (type === 'integration') {
      // For user-level integration
      state = JSON.stringify({ type: 'integration' })
      scope = 'repo,read:user,admin:repo_hook'
    } else if (type === 'project' && projectId) {
      // For project-level integration
      state = JSON.stringify({ type: 'project', project_id: projectId })
      scope = 'repo'
    } else {
      return apiError('Invalid OAuth type or missing project_id', 400)
    }

    // GitHub OAuth authorization URL
    const authUrl = new URL('https://github.com/login/oauth/authorize')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/github/oauth/callback`)
    authUrl.searchParams.append('scope', scope)
    authUrl.searchParams.append('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error)
    return apiError('Failed to initiate GitHub OAuth', 500)
  }
}
