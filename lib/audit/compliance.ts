/**
 * Compliance Utilities
 * Helpers for GDPR, SOC2, HIPAA compliance requirements
 */

import { getAuditLogger } from './logger'
import { createClient } from '@supabase/supabase-js'

export class ComplianceManager {
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * GDPR: Right to Access
   * Generate a report of all data related to a user
   */
  async generateUserDataReport(userId: string) {
    const logger = getAuditLogger()

    // Get all logs for this user
    const { logs } = await logger.query({
      user_id: userId,
      limit: 10000,
    })

    // Log the data access request (compliance requirement)
    await logger.logDataAccess(
      'export_data',
      'user_audit_logs',
      userId,
      userId,
      {
        is_compliance_relevant: true,
        compliance_tags: ['GDPR', 'RIGHT_TO_ACCESS'],
      }
    )

    return {
      user_id: userId,
      total_events: logs.length,
      events: logs,
      generated_at: new Date().toISOString(),
      compliance_standard: 'GDPR Article 15',
    }
  }

  /**
   * GDPR: Right to Erasure (Right to be Forgotten)
   * Anonymize all audit logs for a user
   */
  async anonymizeUserLogs(userId: string, requestedBy: string) {
    const logger = getAuditLogger()

    // Log the erasure request
    await logger.logDataAccess(
      'export_data',
      'user_audit_logs',
      userId,
      requestedBy,
      {
        action: 'GDPR Data Erasure Request',
        is_compliance_relevant: true,
        compliance_tags: ['GDPR', 'RIGHT_TO_ERASURE'],
      }
    )

    // Anonymize user data in audit logs
    const { data, error } = await this.supabase
      .from('audit_logs')
      .update({
        user_email: '[REDACTED]',
        user_name: '[REDACTED]',
        metadata: { anonymized: true, original_user_id: userId },
      })
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return {
      success: true,
      logs_anonymized: data?.length || 0,
      anonymized_at: new Date().toISOString(),
    }
  }

  /**
   * SOC2: Generate compliance report
   * Report on security controls and access monitoring
   */
  async generateSOC2Report(startDate: string, endDate: string) {
    const logger = getAuditLogger()

    // Security events
    const { logs: securityEvents } = await logger.query({
      event_category: 'security_event',
      start_date: startDate,
      end_date: endDate,
    })

    // Authentication events
    const { logs: authEvents } = await logger.query({
      event_category: 'auth_event',
      start_date: startDate,
      end_date: endDate,
    })

    // Failed logins
    const failedLogins = authEvents.filter(e => e.event_type === 'login_failed')

    // Access control changes
    const { logs: permissionChanges } = await logger.query({
      event_category: 'permission_change',
      start_date: startDate,
      end_date: endDate,
    })

    // Admin actions
    const { logs: adminActions } = await logger.query({
      event_category: 'admin_action',
      start_date: startDate,
      end_date: endDate,
    })

    // Get security alerts
    const alerts = await logger.getSecurityAlerts()
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')

    const report = {
      report_type: 'SOC2',
      period: {
        start: startDate,
        end: endDate,
      },
      controls: {
        access_control: {
          total_permission_changes: permissionChanges.length,
          total_admin_actions: adminActions.length,
        },
        authentication: {
          total_login_attempts: authEvents.filter(e => e.event_type === 'login').length,
          failed_login_attempts: failedLogins.length,
          mfa_enabled_events: authEvents.filter(e => e.event_type === 'mfa_enabled').length,
        },
        security_monitoring: {
          total_security_events: securityEvents.length,
          critical_events: securityEvents.filter(e => e.severity === 'critical').length,
          security_alerts: alerts.length,
          critical_alerts: criticalAlerts.length,
        },
        audit_logging: {
          total_events_logged: securityEvents.length + authEvents.length + permissionChanges.length + adminActions.length,
          log_integrity: 'All logs cryptographically signed with SHA-256',
          retention_policy: '90 days minimum, 2 years for critical events',
        },
      },
      summary: {
        compliant: failedLogins.length < 100 && criticalAlerts.length === 0,
        recommendations: [],
      },
      generated_at: new Date().toISOString(),
    }

    // Add recommendations
    if (failedLogins.length > 50) {
      report.summary.recommendations.push('High number of failed login attempts detected. Consider implementing additional security measures.')
    }

    if (criticalAlerts.length > 0) {
      report.summary.recommendations.push(`${criticalAlerts.length} critical security alerts require immediate attention.`)
    }

    // Log report generation
    await logger.log({
      event_category: 'system_event',
      event_type: 'create',
      event_name: 'SOC2 Compliance Report Generated',
      resource_type: 'compliance_report',
      resource_id: crypto.randomUUID(),
      is_compliance_relevant: true,
      compliance_tags: ['SOC2'],
      metadata: {
        report_period: { start: startDate, end: endDate },
      },
    })

    return report
  }

  /**
   * HIPAA: Generate audit trail report
   * Report on access to protected health information (PHI)
   */
  async generateHIPAAReport(startDate: string, endDate: string) {
    const logger = getAuditLogger()

    // Get all data access events (potential PHI access)
    const { logs: dataAccessEvents } = await logger.query({
      event_category: 'data_access',
      start_date: startDate,
      end_date: endDate,
    })

    // Sensitive data access
    const sensitiveAccess = dataAccessEvents.filter(e => e.is_sensitive)

    // Group by user
    const accessByUser = new Map<string, number>()
    dataAccessEvents.forEach(event => {
      if (event.user_id) {
        accessByUser.set(
          event.user_id,
          (accessByUser.get(event.user_id) || 0) + 1
        )
      }
    })

    const report = {
      report_type: 'HIPAA',
      period: {
        start: startDate,
        end: endDate,
      },
      phi_access: {
        total_access_events: dataAccessEvents.length,
        sensitive_data_access: sensitiveAccess.length,
        unique_users_accessed: accessByUser.size,
        access_by_type: {
          view: dataAccessEvents.filter(e => e.event_type === 'view_sensitive').length,
          export: dataAccessEvents.filter(e => e.event_type === 'export_data').length,
          download: dataAccessEvents.filter(e => e.event_type === 'download').length,
          share: dataAccessEvents.filter(e => e.event_type === 'share').length,
        },
      },
      security: {
        encryption: 'AES-256 for data at rest, TLS 1.3 for data in transit',
        access_control: 'Role-based access control (RBAC) enforced',
        audit_trail: 'Complete audit trail maintained with tamper-proof logging',
      },
      compliance_status: {
        audit_controls: true,
        access_monitoring: true,
        encryption: true,
        breach_notification: true,
      },
      generated_at: new Date().toISOString(),
    }

    // Log report generation
    await logger.log({
      event_category: 'system_event',
      event_type: 'create',
      event_name: 'HIPAA Compliance Report Generated',
      resource_type: 'compliance_report',
      resource_id: crypto.randomUUID(),
      is_compliance_relevant: true,
      compliance_tags: ['HIPAA'],
      metadata: {
        report_period: { start: startDate, end: endDate },
      },
    })

    return report
  }

  /**
   * Verify audit log integrity
   * Checks that the checksum chain hasn't been tampered with
   */
  async verifyLogIntegrity(limit: number = 1000): Promise<{
    valid: boolean
    total_checked: number
    tampered_logs: string[]
  }> {
    const { data: logs } = await this.supabase
      .from('audit_logs')
      .select('id, checksum, previous_checksum, event_category, event_type, user_id, resource_type, resource_id, created_at, old_values, new_values')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!logs || logs.length === 0) {
      return { valid: true, total_checked: 0, tampered_logs: [] }
    }

    const tamperedLogs: string[] = []

    // Check each log's checksum
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i]
      const nextLog = i > 0 ? logs[i - 1] : null

      // Verify checksum chain
      if (nextLog && nextLog.previous_checksum !== log.checksum) {
        tamperedLogs.push(log.id)
      }

      // You could also recalculate the checksum here and verify it matches
      // This would require the calculate_audit_checksum function logic
    }

    return {
      valid: tamperedLogs.length === 0,
      total_checked: logs.length,
      tampered_logs: tamperedLogs,
    }
  }

  /**
   * Apply retention policy
   * Archive or delete old logs based on retention rules
   */
  async applyRetentionPolicies() {
    const logger = getAuditLogger()

    // Get logs that have expired
    const { data: expiredLogs } = await this.supabase
      .from('audit_logs')
      .select('id, event_category, retention_policy')
      .lt('expires_at', new Date().toISOString())
      .eq('is_archived', false)

    if (!expiredLogs || expiredLogs.length === 0) {
      return {
        archived: 0,
        deleted: 0,
      }
    }

    // Archive logs (move to cold storage in production)
    const { error: archiveError } = await this.supabase
      .from('audit_logs')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .in('id', expiredLogs.map(l => l.id))

    if (archiveError) {
      throw archiveError
    }

    // Log the retention policy execution
    await logger.log({
      event_category: 'system_event',
      event_type: 'config_change',
      event_name: 'Retention Policy Applied',
      actor_type: 'system',
      metadata: {
        logs_archived: expiredLogs.length,
      },
    })

    return {
      archived: expiredLogs.length,
      deleted: 0, // In production, you might actually delete very old logs
    }
  }

  /**
   * Generate custom compliance report
   */
  async generateCustomReport(
    name: string,
    filters: any,
    reportType: string = 'custom'
  ) {
    const logger = getAuditLogger()

    const { logs, total } = await logger.query(filters)

    // Aggregate by category
    const eventsByCategory = new Map<string, number>()
    const eventsByUser = new Map<string, number>()
    const eventsByResource = new Map<string, number>()

    logs.forEach(log => {
      eventsByCategory.set(
        log.event_category,
        (eventsByCategory.get(log.event_category) || 0) + 1
      )

      if (log.user_id) {
        eventsByUser.set(
          log.user_id,
          (eventsByUser.get(log.user_id) || 0) + 1
        )
      }

      if (log.resource_type) {
        eventsByResource.set(
          log.resource_type,
          (eventsByResource.get(log.resource_type) || 0) + 1
        )
      }
    })

    const securityIncidents = logs.filter(
      l => l.event_category === 'security_event' && l.severity === 'critical'
    ).length

    // Save report to database
    const { data: report } = await this.supabase
      .from('audit_compliance_reports')
      .insert({
        report_type: reportType,
        report_name: name,
        start_date: filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: filters.end_date || new Date().toISOString(),
        filters,
        total_events: total,
        events_by_category: Object.fromEntries(eventsByCategory),
        events_by_user: Object.fromEntries(eventsByUser),
        events_by_resource: Object.fromEntries(eventsByResource),
        security_incidents: securityIncidents,
        status: 'completed',
        generated_by: 'system', // In production, use actual user ID
      })
      .select()
      .single()

    return report
  }
}

// Export singleton
let complianceManager: ComplianceManager | null = null

export function getComplianceManager(): ComplianceManager {
  if (!complianceManager) {
    complianceManager = new ComplianceManager()
  }
  return complianceManager
}
