import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils/api-helpers'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()

    if (!status) {
      return apiError('Status is required')
    }

    // In a real implementation, you would update the recommendation in the database
    // For now, we'll just return success since recommendations are generated on the fly

    return apiSuccess({
      id: params.id,
      status,
      updated: true
    })

  } catch (error) {
    return apiError('Failed to update recommendation')
  }
}
