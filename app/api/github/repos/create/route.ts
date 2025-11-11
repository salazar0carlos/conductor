import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user and session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return apiError('Not authenticated', 401)
    }

    // Get the GitHub provider token from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return apiError('No active session', 401)
    }

    // Extract GitHub access token from provider_token
    const githubToken = session.provider_token
    if (!githubToken) {
      return apiError('GitHub not connected. Please sign in with GitHub to create repositories.', 400)
    }

    const body = await request.json()
    const { name, description, private: isPrivate = true } = body

    if (!name || name.trim() === '') {
      return apiError('Repository name is required', 400)
    }

    // Validate repo name (GitHub rules: alphanumeric, hyphens, underscores, max 100 chars)
    const repoNameRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!repoNameRegex.test(name)) {
      return apiError('Invalid repository name. Use only letters, numbers, hyphens, and underscores (max 100 characters)', 400)
    }

    // Create repository via GitHub API
    const githubResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: description || '',
        private: isPrivate,
        auto_init: true, // Initialize with README
      })
    })

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json()

      // Handle specific GitHub errors
      if (githubResponse.status === 422 && errorData.errors?.some((e: any) => e.message?.includes('already exists'))) {
        return apiError('A repository with this name already exists in your account', 409)
      }

      return apiError(
        errorData.message || 'Failed to create GitHub repository',
        githubResponse.status
      )
    }

    const repoData = await githubResponse.json()

    // Return repository information
    return apiSuccess({
      repo: {
        name: repoData.name,
        full_name: repoData.full_name,
        html_url: repoData.html_url,
        clone_url: repoData.clone_url,
        ssh_url: repoData.ssh_url,
        private: repoData.private,
        default_branch: repoData.default_branch || 'main',
        created_at: repoData.created_at,
      }
    }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
