/**
 * Enterprise Audit Logging System
 * Provides comprehensive logging for compliance, security, and operational monitoring
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Enums matching database schema
export type AuditEventCategory =
  | 'user_action'
  | 'auth_event'
  | 'permission_change'
  | 'data_access'
  | 'system_event'
  | 'security_event'
  | 'integration_event'
  | 'admin_action'

export type AuditEventType =
  // User Actions
  | 'create' | 'read' | 'update' | 'delete'
  // Auth Events
  | 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset'
  | 'mfa_enabled' | 'mfa_disabled' | 'mfa_verified' | 'mfa_failed'
  | 'session_created' | 'session_expired' | 'session_revoked'
  // Permission Changes
  | 'role_assigned' | 'role_revoked' | 'permission_granted' | 'permission_denied'
  | 'access_granted' | 'access_revoked'
  // Data Access
  | 'view_sensitive' | 'export_data' | 'download' | 'share'
  // System Events
  | 'backup_created' | 'backup_restored' | 'migration_run' | 'deployment'
  | 'config_change' | 'maintenance_start' | 'maintenance_end'
  // Security Events
  | 'suspicious_activity' | 'rate_limit_exceeded' | 'brute_force_detected'
  | 'unauthorized_access' | 'security_scan' | 'vulnerability_detected'
  // Integration Events
  | 'api_call' | 'webhook_triggered' | 'webhook_failed' | 'integration_connected'
  | 'integration_disconnected' | 'external_sync'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export type AuditRetentionPolicy = 'days_30' | 'days_90' | 'days_180' | 'days_365' | 'days_730' | 'forever'

export interface AuditLogEntry {
  // Event identification
  event_category: AuditEventCategory
  event_type: AuditEventType
  event_name: string
  severity?: AuditSeverity

  // User and actor
  user_id?: string
  user_email?: string
  user_name?: string
  actor_type?: 'user' | 'system' | 'api' | 'integration'

  // Request context
  ip_address?: string
  user_agent?: string
  device_fingerprint?: string
  session_id?: string
  request_id?: string

  // Geographic
  country_code?: string
  city?: string
  timezone?: string

  // Entity/Resource
  resource_type?: string
  resource_id?: string
  resource_name?: string
  parent_resource_type?: string
  parent_resource_id?: string

  // Change tracking
  action?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>

  // API details
  api_endpoint?: string
  http_method?: string
  http_status?: number
  request_body?: Record<string, any>
  response_body?: Record<string, any>
  response_time_ms?: number

  // Security and compliance
  is_sensitive?: boolean
  is_compliance_relevant?: boolean
  compliance_tags?: string[]
  risk_score?: number

  // Additional data
  metadata?: Record<string, any>
  error_message?: string
  stack_trace?: string

  // Retention
  retention_policy?: AuditRetentionPolicy
}

export interface AuditLogFilter {
  user_id?: string
  event_category?: AuditEventCategory
  event_type?: AuditEventType
  resource_type?: string
  resource_id?: string
  severity?: AuditSeverity
  start_date?: string
  end_date?: string
  ip_address?: string
  search?: string
  limit?: number
  offset?: number
}

export class AuditLogger {
  /**
   * Get Supabase client - created on demand to avoid build-time env var access
   * IMPORTANT: Never initialize Supabase at module or constructor level!
   */
  private getSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const supabase = this.getSupabaseClient()
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_category: entry.event_category,
          event_type: entry.event_type,
          event_name: entry.event_name,
          severity: entry.severity || 'info',
          user_id: entry.user_id,
          user_email: entry.user_email,
          user_name: entry.user_name,
          actor_type: entry.actor_type || 'user',
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          device_fingerprint: entry.device_fingerprint,
          session_id: entry.session_id,
          request_id: entry.request_id,
          country_code: entry.country_code,
          city: entry.city,
          timezone: entry.timezone,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          resource_name: entry.resource_name,
          parent_resource_type: entry.parent_resource_type,
          parent_resource_id: entry.parent_resource_id,
          action: entry.action,
          old_values: entry.old_values,
          new_values: entry.new_values,
          api_endpoint: entry.api_endpoint,
          http_method: entry.http_method,
          http_status: entry.http_status,
          request_body: entry.request_body,
          response_body: entry.response_body,
          response_time_ms: entry.response_time_ms,
          is_sensitive: entry.is_sensitive || false,
          is_compliance_relevant: entry.is_compliance_relevant || false,
          compliance_tags: entry.compliance_tags,
          risk_score: entry.risk_score,
          metadata: entry.metadata,
          error_message: entry.error_message,
          stack_trace: entry.stack_trace,
          retention_policy: entry.retention_policy || 'days_90',
        })

      if (error) {
        console.error('Failed to log audit event:', error)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw - audit logging should never break application flow
    }
  }

  /**
   * Helper methods for common log types
   */

  async logUserAction(
    action: 'create' | 'read' | 'update' | 'delete',
    resource_type: string,
    resource_id: string,
    userId?: string,
    options?: Partial<AuditLogEntry>
  ): Promise<void> {
    await this.log({
      event_category: 'user_action',
      event_type: action,
      event_name: `${action.toUpperCase()} ${resource_type}`,
      resource_type,
      resource_id,
      user_id: userId,
      ...options,
    })
  }

  async logAuth(
    event_type: AuditEventType,
    userId?: string,
    options?: Partial<AuditLogEntry>
  ): Promise<void> {
    const severity: AuditSeverity =
      event_type.includes('failed') ? 'warning' :
      event_type.includes('revoked') ? 'warning' : 'info'

    await this.log({
      event_category: 'auth_event',
      event_type,
      event_name: event_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      severity,
      user_id: userId,
      is_compliance_relevant: true,
      compliance_tags: ['SOC2', 'GDPR'],
      ...options,
    })
  }

  async logSecurityEvent(
    event_type: AuditEventType,
    severity: AuditSeverity,
    description: string,
    options?: Partial<AuditLogEntry>
  ): Promise<void> {
    const riskScore = severity === 'critical' ? 90 :
                     severity === 'error' ? 70 :
                     severity === 'warning' ? 50 : 20

    await this.log({
      event_category: 'security_event',
      event_type,
      event_name: description,
      severity,
      risk_score: riskScore,
      is_compliance_relevant: true,
      compliance_tags: ['SOC2', 'SECURITY'],
      ...options,
    })
  }

  async logDataAccess(
    action: 'view_sensitive' | 'export_data' | 'download' | 'share',
    resource_type: string,
    resource_id: string,
    userId?: string,
    options?: Partial<AuditLogEntry>
  ): Promise<void> {
    await this.log({
      event_category: 'data_access',
      event_type: action,
      event_name: `${action.split('_').join(' ').toUpperCase()} - ${resource_type}`,
      resource_type,
      resource_id,
      user_id: userId,
      is_sensitive: true,
      is_compliance_relevant: true,
      compliance_tags: ['GDPR', 'HIPAA', 'SOC2'],
      ...options,
    })
  }

  async logApiCall(
    method: string,
    endpoint: string,
    status: number,
    responseTimeMs: number,
    userId?: string,
    options?: Partial<AuditLogEntry>
  ): Promise<void> {
    const severity: AuditSeverity =
      status >= 500 ? 'error' :
      status >= 400 ? 'warning' : 'info'

    await this.log({
      event_category: 'integration_event',
      event_type: 'api_call',
      event_name: `API ${method} ${endpoint}`,
      severity,
      user_id: userId,
      api_endpoint: endpoint,
      http_method: method,
      http_status: status,
      response_time_ms: responseTimeMs,
      ...options,
    })
  }

  async logAdminAction(
    action: string,
    resource_type: string,
    resource_id: string,
    userId: string,
    options?: Partial<AuditLogEntry>
  ): Promise<void> {
    await this.log({
      event_category: 'admin_action',
      event_type: 'update',
      event_name: `Admin: ${action}`,
      resource_type,
      resource_id,
      user_id: userId,
      severity: 'info',
      is_compliance_relevant: true,
      compliance_tags: ['SOC2'],
      ...options,
    })
  }

  /**
   * Extract request context from Next.js request
   */
  extractRequestContext(request: NextRequest) {
    const headers = request.headers
    const ip = headers.get('x-forwarded-for')?.split(',')[0] ||
               headers.get('x-real-ip') ||
               'unknown'

    return {
      ip_address: ip,
      user_agent: headers.get('user-agent') || undefined,
      api_endpoint: request.nextUrl.pathname,
      http_method: request.method,
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(filter: AuditLogFilter = {}) {
    const supabase = this.getSupabaseClient()
    let query = supabase
      .from('audit_logs_enriched')
      .select('*', { count: 'exact' })

    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id)
    }

    if (filter.event_category) {
      query = query.eq('event_category', filter.event_category)
    }

    if (filter.event_type) {
      query = query.eq('event_type', filter.event_type)
    }

    if (filter.resource_type) {
      query = query.eq('resource_type', filter.resource_type)
    }

    if (filter.resource_id) {
      query = query.eq('resource_id', filter.resource_id)
    }

    if (filter.severity) {
      query = query.eq('severity', filter.severity)
    }

    if (filter.start_date) {
      query = query.gte('created_at', filter.start_date)
    }

    if (filter.end_date) {
      query = query.lte('created_at', filter.end_date)
    }

    if (filter.ip_address) {
      query = query.eq('ip_address', filter.ip_address)
    }

    if (filter.search) {
      query = query.or(
        `event_name.ilike.%${filter.search}%,` +
        `user_email.ilike.%${filter.search}%,` +
        `resource_type.ilike.%${filter.search}%`
      )
    }

    query = query.order('created_at', { ascending: false })

    if (filter.limit) {
      query = query.limit(filter.limit)
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      logs: data || [],
      total: count || 0,
    }
  }

  /**
   * Get analytics for dashboard
   */
  async getAnalytics(days: number = 7) {
    const supabase = this.getSupabaseClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get aggregated data
    const { data: aggregations } = await supabase
      .from('audit_log_aggregations')
      .select('*')
      .gte('aggregation_date', startDate.toISOString().split('T')[0])
      .order('aggregation_date', { ascending: true })

    // Get top users
    const { data: topUsers } = await supabase
      .from('audit_logs')
      .select('user_id, user_email, user_name')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'is', null)

    // Count by user
    const userCounts = new Map<string, { email: string; name?: string; count: number }>()
    topUsers?.forEach(log => {
      const current = userCounts.get(log.user_id) || { email: log.user_email, name: log.user_name, count: 0 }
      current.count++
      userCounts.set(log.user_id, current)
    })

    const topUsersList = Array.from(userCounts.entries())
      .map(([id, data]) => ({ user_id: id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get event distribution
    const { data: eventDistribution } = await supabase
      .from('audit_logs')
      .select('event_category')
      .gte('created_at', startDate.toISOString())

    const categoryCount = new Map<string, number>()
    eventDistribution?.forEach(log => {
      categoryCount.set(log.event_category, (categoryCount.get(log.event_category) || 0) + 1)
    })

    return {
      aggregations: aggregations || [],
      topUsers: topUsersList,
      eventDistribution: Array.from(categoryCount.entries()).map(([category, count]) => ({
        category,
        count,
      })),
    }
  }

  /**
   * Get security alerts
   */
  async getSecurityAlerts(status?: 'open' | 'investigating' | 'resolved' | 'false_positive') {
    const supabase = this.getSupabaseClient()
    let query = supabase
      .from('audit_security_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  }

  /**
   * Create a security alert
   */
  async createSecurityAlert(
    alert_type: string,
    severity: AuditSeverity,
    title: string,
    description: string,
    options?: {
      user_id?: string
      user_email?: string
      event_ids?: string[]
      ip_addresses?: string[]
      countries?: string[]
      metadata?: Record<string, any>
    }
  ) {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('audit_security_alerts')
      .insert({
        alert_type,
        severity,
        title,
        description,
        user_id: options?.user_id,
        user_email: options?.user_email,
        triggering_event_ids: options?.event_ids,
        ip_addresses: options?.ip_addresses,
        countries: options?.countries,
        metadata: options?.metadata,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null

export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger()
  }
  return auditLogger
}

// Export convenience function
export const auditLog = {
  userAction: (action: 'create' | 'read' | 'update' | 'delete', resource_type: string, resource_id: string, userId?: string, options?: Partial<AuditLogEntry>) =>
    getAuditLogger().logUserAction(action, resource_type, resource_id, userId, options),

  auth: (event_type: AuditEventType, userId?: string, options?: Partial<AuditLogEntry>) =>
    getAuditLogger().logAuth(event_type, userId, options),

  security: (event_type: AuditEventType, severity: AuditSeverity, description: string, options?: Partial<AuditLogEntry>) =>
    getAuditLogger().logSecurityEvent(event_type, severity, description, options),

  dataAccess: (action: 'view_sensitive' | 'export_data' | 'download' | 'share', resource_type: string, resource_id: string, userId?: string, options?: Partial<AuditLogEntry>) =>
    getAuditLogger().logDataAccess(action, resource_type, resource_id, userId, options),

  api: (method: string, endpoint: string, status: number, responseTimeMs: number, userId?: string, options?: Partial<AuditLogEntry>) =>
    getAuditLogger().logApiCall(method, endpoint, status, responseTimeMs, userId, options),

  admin: (action: string, resource_type: string, resource_id: string, userId: string, options?: Partial<AuditLogEntry>) =>
    getAuditLogger().logAdminAction(action, resource_type, resource_id, userId, options),
}
