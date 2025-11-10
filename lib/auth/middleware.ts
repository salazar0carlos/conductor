import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/auth/api-keys'

export async function authMiddleware(request: NextRequest): Promise<{ authenticated: boolean; agentId?: string }> {
  const authHeader = request.headers.get('authorization')
  const apiKey = extractApiKey(authHeader)

  if (!apiKey) {
    return { authenticated: false }
  }

  const { valid, agentId } = await verifyApiKey(apiKey)

  return { authenticated: valid, agentId }
}

export function requireAuth(handler: (request: NextRequest, context: { agentId: string }) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const { authenticated, agentId } = await authMiddleware(request)

    if (!authenticated || !agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Valid API key required' },
        { status: 401 }
      )
    }

    return handler(request, { agentId })
  }
}
