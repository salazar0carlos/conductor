import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      organization_id,
      db_pass,
      region = 'us-east-1',
      plan = 'free'
    } = body

    if (!name || name.trim() === '') {
      return apiError('Project name is required', 400)
    }

    if (!organization_id || organization_id.trim() === '') {
      return apiError('Organization ID is required', 400)
    }

    // Get Supabase Management API token from env or request
    const managementToken = process.env.SUPABASE_MANAGEMENT_TOKEN || body.management_token

    if (!managementToken) {
      return apiError('Supabase Management API token is required. Set SUPABASE_MANAGEMENT_TOKEN env variable or provide management_token.', 400)
    }

    // Generate a secure database password if not provided
    const dbPassword = db_pass || generateSecurePassword()

    // Create project via Supabase Management API
    const response = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        organization_id,
        db_pass: dbPassword,
        region,
        plan,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return apiError(
        errorData.message || 'Failed to create Supabase project',
        response.status
      )
    }

    const projectData = await response.json()

    // Return project information
    return apiSuccess({
      project: {
        id: projectData.id,
        name: projectData.name,
        organization_id: projectData.organization_id,
        region: projectData.region,
        status: projectData.status,
        database: {
          host: projectData.database?.host,
          version: projectData.database?.version,
        },
        // Connection details (will be available once project is ready)
        endpoint: `https://${projectData.id}.supabase.co`,
        anon_key: projectData.anon_key,
        service_role_key: projectData.service_role_key,
        db_password: dbPassword, // Return this once so user can save it
        created_at: projectData.created_at,
      }
    }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// Helper function to generate secure password
function generateSecurePassword(): string {
  const length = 24
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''

  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
