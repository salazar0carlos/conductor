import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { z } from 'zod'

const createPRSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  head: z.string(),
  base: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const validation = createPRSchema.safeParse(body)
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400)
    }

    const { task_id, title, body: prBody, head, base } = validation.data

    // Get task and project
    const { data: task } = await supabase
      .from('tasks')
      .select('*, projects(*)')
      .eq('id', task_id)
      .single()

    if (!task || !task.projects) {
      return apiError('Task or project not found', 404)
    }

    const project = task.projects as any

    if (!project.github_repo || !project.github_access_token) {
      return apiError('GitHub not configured for this project', 400)
    }

    // Extract owner and repo from github_repo
    const [owner, repo] = project.github_repo.split('/').slice(-2)

    // Create PR using GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${project.github_access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        title,
        body: prBody,
        head,
        base: base || project.github_branch || 'main'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return apiError(`GitHub API error: ${error.message}`, response.status)
    }

    const pr = await response.json()

    // Update task with PR info
    await supabase
      .from('tasks')
      .update({
        github_pr_number: pr.number,
        github_pr_url: pr.html_url,
        github_branch: head
      })
      .eq('id', task_id)

    return apiSuccess({
      pr_number: pr.number,
      pr_url: pr.html_url,
      message: 'Pull request created successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
