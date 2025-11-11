import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    // Get Supabase Management API token from env
    const managementToken = process.env.SUPABASE_MANAGEMENT_TOKEN

    if (!managementToken) {
      return apiError('Supabase Management API token not configured. Set SUPABASE_MANAGEMENT_TOKEN environment variable.', 400)
    }

    // Fetch organizations from Supabase Management API
    const response = await fetch('https://api.supabase.com/v1/organizations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return apiError(
        errorData.message || 'Failed to fetch organizations from Supabase',
        response.status
      )
    }

    const organizations = await response.json()

    // Return organizations with id and name
    return apiSuccess({
      organizations: organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        billing_email: org.billing_email,
      }))
    })
  } catch (error) {
    return handleApiError(error)
  }
}
