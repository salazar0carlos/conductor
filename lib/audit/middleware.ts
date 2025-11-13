/**
 * Audit Logging Middleware
 * Automatically logs API requests and responses for compliance and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogger, AuditEventType } from './logger'
import { createClient } from '@supabase/supabase-js'

// Routes that should not be logged (to prevent log spam)
const IGNORED_ROUTES = [
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/api/audit/logs', // Don't log audit log queries themselves
]

// Sensitive headers that should not be logged
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
]

// Sensitive fields in request/response bodies
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'credit_card',
  'ssn',
]

/**
 * Sanitize object by removing sensitive fields
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj }

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase()

    // Remove sensitive fields
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Extract user information from request
 */
async function getUserFromRequest(request: NextRequest) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return null
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    return user
  } catch {
    return null
  }
}

/**
 * Determine event type based on HTTP method
 */
function getEventTypeFromMethod(method: string): AuditEventType {
  switch (method) {
    case 'POST': return 'create'
    case 'GET': return 'read'
    case 'PUT':
    case 'PATCH': return 'update'
    case 'DELETE': return 'delete'
    default: return 'api_call'
  }
}

/**
 * Determine resource type and ID from URL
 */
function parseResourceFromUrl(url: string): { type?: string; id?: string } {
  const parts = url.split('/').filter(Boolean)

  // Common pattern: /api/{resource_type}/{id}
  if (parts.length >= 3 && parts[0] === 'api') {
    return {
      type: parts[1],
      id: parts[2] !== '' ? parts[2] : undefined,
    }
  }

  return {}
}

/**
 * Calculate risk score based on various factors
 */
function calculateRiskScore(
  method: string,
  path: string,
  status: number,
  user: any,
  ip: string
): number {
  let score = 0

  // High-risk methods
  if (['DELETE', 'PATCH', 'PUT'].includes(method)) score += 20

  // Admin routes
  if (path.includes('/admin/')) score += 30

  // Failed authentication
  if (status === 401 || status === 403) score += 40

  // Server errors
  if (status >= 500) score += 30

  // No user context for non-public route
  if (!user && !path.includes('/auth/')) score += 20

  // Suspicious IP patterns (example - you can enhance this)
  if (ip === 'unknown') score += 10

  return Math.min(score, 100)
}

/**
 * Determine if route should be logged
 */
function shouldLogRoute(pathname: string): boolean {
  return !IGNORED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Main audit logging middleware wrapper
 */
export function withAuditLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const logger = getAuditLogger()
    const pathname = req.nextUrl.pathname

    // Skip logging for ignored routes
    if (!shouldLogRoute(pathname)) {
      return handler(req)
    }

    // Extract request context
    const requestContext = logger.extractRequestContext(req)
    const user = await getUserFromRequest(req)
    const requestId = crypto.randomUUID()

    let response: NextResponse | undefined = undefined
    let requestBody: any = null
    let responseBody: any = null
    let error: Error | null = null

    try {
      // Try to parse request body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          const clonedReq = req.clone()
          requestBody = await clonedReq.json()
        } catch {
          // Body might not be JSON, that's okay
        }
      }

      // Execute the actual handler
      response = await handler(req)

      // Try to parse response body
      try {
        const clonedRes = response.clone()
        const text = await clonedRes.text()
        if (text) {
          responseBody = JSON.parse(text)
        }
      } catch {
        // Response might not be JSON, that's okay
      }

    } catch (err) {
      error = err as Error
      // Create error response
      response = NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    } finally {
      const responseTime = Date.now() - startTime
      const status = response?.status || (error ? 500 : 200)

      // Determine if this is a sensitive operation
      const isSensitive =
        pathname.includes('/admin') ||
        pathname.includes('/settings') ||
        pathname.includes('/users') ||
        requestBody?.sensitive === true

      // Calculate risk score
      const riskScore = calculateRiskScore(
        req.method,
        pathname,
        status,
        user,
        requestContext.ip_address || 'unknown'
      )

      // Parse resource information
      const resource = parseResourceFromUrl(pathname)

      // Log the request/response
      await logger.log({
        event_category: pathname.includes('/admin/') ? 'admin_action' : 'user_action',
        event_type: getEventTypeFromMethod(req.method),
        event_name: `${req.method} ${pathname}`,
        severity: status >= 500 ? 'error' :
                 status >= 400 ? 'warning' : 'info',

        // User context
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.user_metadata?.user_name || user?.user_metadata?.full_name,

        // Request context
        ...requestContext,
        request_id: requestId,

        // Resource
        resource_type: resource.type,
        resource_id: resource.id,

        // API details
        request_body: requestBody ? sanitizeObject(requestBody) : undefined,
        response_body: responseBody ? sanitizeObject(responseBody) : undefined,
        response_time_ms: responseTime,
        http_status: status,

        // Security
        is_sensitive: isSensitive,
        risk_score: riskScore,

        // Error tracking
        error_message: error?.message,
        stack_trace: error?.stack,

        // Compliance
        is_compliance_relevant: isSensitive || pathname.includes('/admin/'),
        compliance_tags: isSensitive ? ['SOC2'] : undefined,
      })

      // Create security alert for high-risk events
      if (riskScore >= 70) {
        await logger.createSecurityAlert(
          'high_risk_activity',
          riskScore >= 90 ? 'critical' : 'warning',
          `High-risk ${req.method} request to ${pathname}`,
          `Risk score: ${riskScore}, Status: ${status}`,
          {
            user_id: user?.id,
            user_email: user?.email,
            ip_addresses: requestContext.ip_address ? [requestContext.ip_address] : undefined,
            metadata: {
              method: req.method,
              path: pathname,
              status,
              response_time_ms: responseTime,
            },
          }
        )
      }
    }

    return response!
  }
}

/**
 * Simplified middleware for specific event types
 */
export const auditMiddleware = {
  /**
   * Log authentication events
   */
  auth: (eventType: AuditEventType) => {
    return async (req: NextRequest, userId?: string) => {
      const logger = getAuditLogger()
      const context = logger.extractRequestContext(req)

      await logger.logAuth(eventType, userId, {
        ...context,
      })
    }
  },

  /**
   * Log data access events
   */
  dataAccess: (action: 'view_sensitive' | 'export_data' | 'download' | 'share') => {
    return async (
      req: NextRequest,
      resourceType: string,
      resourceId: string,
      userId?: string
    ) => {
      const logger = getAuditLogger()
      const context = logger.extractRequestContext(req)

      await logger.logDataAccess(action, resourceType, resourceId, userId, {
        ...context,
      })
    }
  },

  /**
   * Log admin actions
   */
  admin: (action: string) => {
    return async (
      req: NextRequest,
      resourceType: string,
      resourceId: string,
      userId: string,
      oldValues?: any,
      newValues?: any
    ) => {
      const logger = getAuditLogger()
      const context = logger.extractRequestContext(req)

      await logger.logAdminAction(action, resourceType, resourceId, userId, {
        ...context,
        old_values: oldValues,
        new_values: newValues,
      })
    }
  },
}

/**
 * Detect brute force attacks
 */
export async function detectBruteForce(
  ip: string,
  userId?: string,
  timeWindowMinutes: number = 10,
  maxAttempts: number = 5
): Promise<boolean> {
  const logger = getAuditLogger()
  const startTime = new Date()
  startTime.setMinutes(startTime.getMinutes() - timeWindowMinutes)

  const { logs } = await logger.query({
    event_type: 'login_failed',
    ip_address: ip,
    start_date: startTime.toISOString(),
  })

  if (logs.length >= maxAttempts) {
    // Create security alert
    await logger.createSecurityAlert(
      'brute_force_detected',
      'critical',
      `Brute force attack detected from ${ip}`,
      `${logs.length} failed login attempts in ${timeWindowMinutes} minutes`,
      {
        user_id: userId,
        ip_addresses: [ip],
        event_ids: logs.map(l => l.id),
        metadata: {
          attempt_count: logs.length,
          time_window_minutes: timeWindowMinutes,
        },
      }
    )

    return true
  }

  return false
}

/**
 * Detect anomalous user behavior
 */
export async function detectAnomalies(userId: string): Promise<void> {
  const logger = getAuditLogger()

  // Check for rapid location changes (impossible travel)
  const recentLogs = await logger.query({
    user_id: userId,
    limit: 10,
  })

  const locations = new Set(recentLogs.logs.map(l => l.country_code).filter(Boolean))

  if (locations.size >= 3) {
    await logger.createSecurityAlert(
      'impossible_travel',
      'warning',
      'Suspicious: User accessed from multiple countries',
      `User ${userId} accessed system from ${locations.size} different countries in short time`,
      {
        user_id: userId,
        countries: Array.from(locations) as string[],
        metadata: {
          location_count: locations.size,
        },
      }
    )
  }

  // Check for unusual activity patterns
  const last24h = new Date()
  last24h.setHours(last24h.getHours() - 24)

  const { logs: recentActivity } = await logger.query({
    user_id: userId,
    start_date: last24h.toISOString(),
  })

  // Baseline: if user suddenly has 10x normal activity
  const normalActivity = 50 // This should be calculated from historical data
  if (recentActivity.length > normalActivity * 10) {
    await logger.createSecurityAlert(
      'anomaly',
      'warning',
      'Unusual activity spike detected',
      `User ${userId} has ${recentActivity.length} events in 24h (normal: ~${normalActivity})`,
      {
        user_id: userId,
        metadata: {
          event_count: recentActivity.length,
          baseline: normalActivity,
        },
      }
    )
  }
}
