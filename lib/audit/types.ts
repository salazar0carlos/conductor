/**
 * Shared types for the audit logging system
 */

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

export interface AuditLog {
  id: string

  // Event identification
  event_category: AuditEventCategory
  event_type: AuditEventType
  event_name: string
  severity: AuditSeverity

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
  changes?: Record<string, any>

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

  // Tamper-proofing
  checksum?: string
  previous_checksum?: string

  // Additional data
  metadata?: Record<string, any>
  error_message?: string
  stack_trace?: string

  // Retention
  retention_policy?: AuditRetentionPolicy
  expires_at?: string
  is_archived?: boolean
  archived_at?: string

  // Timestamps
  created_at: string
  updated_at?: string
}

export interface SecurityAlert {
  id: string
  alert_type: string
  severity: AuditSeverity
  title: string
  description: string

  user_id?: string
  user_email?: string
  resource_type?: string
  resource_id?: string

  triggering_event_ids?: string[]
  event_count?: number
  time_window_minutes?: number

  ip_addresses?: string[]
  countries?: string[]

  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolved_at?: string
  resolution_notes?: string

  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ComplianceReport {
  id: string
  report_type: string
  report_name: string
  description?: string

  start_date: string
  end_date: string

  filters?: Record<string, any>

  total_events: number
  events_by_category?: Record<string, number>
  events_by_user?: Record<string, number>
  events_by_resource?: Record<string, number>
  security_incidents?: number

  export_format?: string
  file_url?: string
  file_size_bytes?: number

  status: 'generating' | 'completed' | 'failed'
  error_message?: string

  generated_by: string
  generated_at: string

  metadata?: Record<string, any>
  created_at: string
}

export interface RetentionPolicy {
  id: string
  policy_name: string
  description?: string

  event_categories?: AuditEventCategory[]
  event_types?: AuditEventType[]
  severities?: AuditSeverity[]
  compliance_tags?: string[]

  retention_days: number
  auto_archive?: boolean
  auto_delete?: boolean

  is_active?: boolean
  priority?: number

  created_at: string
  updated_at: string
}

export interface AuditLogAggregation {
  id: string
  aggregation_date: string
  hour?: number

  event_category?: AuditEventCategory
  event_type?: AuditEventType
  user_id?: string
  resource_type?: string
  severity?: AuditSeverity

  event_count: number
  unique_users?: number
  unique_ips?: number
  error_count?: number
  avg_response_time_ms?: number

  created_at: string
  updated_at: string
}
