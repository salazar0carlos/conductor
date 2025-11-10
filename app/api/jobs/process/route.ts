import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { processPendingJobs } from '@/lib/jobs/background-jobs'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (in production, use a secret token)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.INTERNAL_JOB_TOKEN || 'dev-token'

    if (authHeader !== `Bearer ${expectedToken}`) {
      return apiError('Unauthorized', 401)
    }

    const processed = await processPendingJobs()

    return apiSuccess({
      message: 'Jobs processed',
      processed_count: processed
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export const runtime = 'edge'
export const maxDuration = 60
