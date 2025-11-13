import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify GitHub webhook signature (if GITHUB_WEBHOOK_SECRET is set)
    // const signature = request.headers.get('x-hub-signature-256')
    // TODO: Implement signature verification for production
    const event = request.headers.get('x-github-event')

    if (!event) {
      return apiError('Missing x-github-event header', 400)
    }

    const payload = await request.json()

    // Handle different GitHub events
    switch (event) {
      case 'push':
        // Handle push events - could trigger CI/CD tasks
        console.log('Push event:', payload.repository?.full_name, payload.ref)
        break

      case 'workflow_run':
        // Handle workflow run completion
        console.log('Workflow run:', payload.workflow_run?.conclusion)

        // You could create analysis records based on CI/CD results
        if (payload.workflow_run?.conclusion === 'failure') {
          await supabase.from('analysis_history').insert({
            analysis_type: 'quality_review',
            findings: {
              type: 'ci_failure',
              workflow: payload.workflow_run.name,
              conclusion: payload.workflow_run.conclusion,
              html_url: payload.workflow_run.html_url
            },
            suggestions: [{
              type: 'investigate_failure',
              message: 'CI/CD workflow failed - requires investigation'
            }],
            priority_score: 8,
            status: 'pending',
            metadata: {
              github_event: event,
              repository: payload.repository?.full_name
            }
          })
        }
        break

      case 'pull_request':
        // Handle PR events
        console.log('PR event:', payload.action, payload.pull_request?.number)
        break

      default:
        console.log('Unhandled GitHub event:', event)
    }

    return apiSuccess({ received: true })
  } catch (error) {
    return handleApiError(error)
  }
}
