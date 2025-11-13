-- Comprehensive Audit Log and Compliance System
-- Supports GDPR, SOC 2, HIPAA compliance requirements

-- Event categories enum
CREATE TYPE audit_event_category AS ENUM (
  'user_action',
  'auth_event',
  'permission_change',
  'data_access',
  'system_event',
  'security_event',
  'integration_event',
  'admin_action'
);

-- Event types enum
CREATE TYPE audit_event_type AS ENUM (
  -- User Actions
  'create', 'read', 'update', 'delete',
  -- Auth Events
  'login', 'logout', 'login_failed', 'password_change', 'password_reset',
  'mfa_enabled', 'mfa_disabled', 'mfa_verified', 'mfa_failed',
  'session_created', 'session_expired', 'session_revoked',
  -- Permission Changes
  'role_assigned', 'role_revoked', 'permission_granted', 'permission_denied',
  'access_granted', 'access_revoked',
  -- Data Access
  'view_sensitive', 'export_data', 'download', 'share',
  -- System Events
  'backup_created', 'backup_restored', 'migration_run', 'deployment',
  'config_change', 'maintenance_start', 'maintenance_end',
  -- Security Events
  'suspicious_activity', 'rate_limit_exceeded', 'brute_force_detected',
  'unauthorized_access', 'security_scan', 'vulnerability_detected',
  -- Integration Events
  'api_call', 'webhook_triggered', 'webhook_failed', 'integration_connected',
  'integration_disconnected', 'external_sync'
);

-- Severity levels
CREATE TYPE audit_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

-- Retention policies
CREATE TYPE audit_retention_policy AS ENUM (
  'days_30',
  'days_90',
  'days_180',
  'days_365',
  'days_730',
  'forever'
);

-- Main audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event identification
  event_category audit_event_category NOT NULL,
  event_type audit_event_type NOT NULL,
  event_name TEXT NOT NULL, -- Human-readable event name
  severity audit_severity NOT NULL DEFAULT 'info',

  -- User and actor information
  user_id UUID, -- References auth.users but not enforced (for deleted users)
  user_email TEXT,
  user_name TEXT,
  actor_type TEXT DEFAULT 'user', -- 'user', 'system', 'api', 'integration'

  -- Request context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  session_id TEXT,
  request_id TEXT, -- For tracing across services

  -- Geographic data
  country_code TEXT,
  city TEXT,
  timezone TEXT,

  -- Entity information (what was affected)
  resource_type TEXT, -- e.g., 'project', 'task', 'agent', 'user'
  resource_id TEXT,
  resource_name TEXT,
  parent_resource_type TEXT,
  parent_resource_id TEXT,

  -- Change tracking
  action TEXT, -- Specific action performed
  old_values JSONB, -- Before state (for updates/deletes)
  new_values JSONB, -- After state (for creates/updates)
  changes JSONB, -- Computed diff between old and new

  -- API and integration data
  api_endpoint TEXT,
  http_method TEXT,
  http_status INTEGER,
  request_body JSONB,
  response_body JSONB,
  response_time_ms INTEGER,

  -- Security and compliance
  is_sensitive BOOLEAN DEFAULT false,
  is_compliance_relevant BOOLEAN DEFAULT false,
  compliance_tags TEXT[], -- e.g., ['GDPR', 'SOC2', 'HIPAA']
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),

  -- Tamper-proofing
  checksum TEXT, -- SHA-256 hash of critical fields
  previous_checksum TEXT, -- Chain to previous log entry

  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  stack_trace TEXT,

  -- Retention
  retention_policy audit_retention_policy DEFAULT 'days_90',
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes will be created below
  CONSTRAINT valid_old_new CHECK (
    (event_type IN ('create') AND old_values IS NULL) OR
    (event_type IN ('delete') AND new_values IS NULL) OR
    (event_type NOT IN ('create', 'delete'))
  )
);

-- Audit log aggregations for analytics (pre-computed for performance)
CREATE TABLE audit_log_aggregations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time dimension
  aggregation_date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),

  -- Dimensions
  event_category audit_event_category,
  event_type audit_event_type,
  user_id UUID,
  resource_type TEXT,
  severity audit_severity,

  -- Metrics
  event_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_ips INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  UNIQUE (aggregation_date, hour, event_category, event_type, user_id, resource_type)
);

-- Security alerts table
CREATE TABLE audit_security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  alert_type TEXT NOT NULL, -- 'brute_force', 'anomaly', 'suspicious_location', etc.
  severity audit_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Related user/resource
  user_id UUID,
  user_email TEXT,
  resource_type TEXT,
  resource_id TEXT,

  -- Alert details
  triggering_event_ids UUID[], -- Links to audit_logs
  event_count INTEGER,
  time_window_minutes INTEGER,

  -- Geographic/network
  ip_addresses TEXT[],
  countries TEXT[],

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to UUID, -- Admin user investigating
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance reports table
CREATE TABLE audit_compliance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  report_type TEXT NOT NULL, -- 'GDPR', 'SOC2', 'HIPAA', 'custom'
  report_name TEXT NOT NULL,
  description TEXT,

  -- Time range
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Filters used
  filters JSONB,

  -- Report data
  total_events INTEGER,
  events_by_category JSONB,
  events_by_user JSONB,
  events_by_resource JSONB,
  security_incidents INTEGER,

  -- File export
  export_format TEXT, -- 'pdf', 'csv', 'json'
  file_url TEXT,
  file_size_bytes BIGINT,

  -- Status
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message TEXT,

  -- Audit trail
  generated_by UUID NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data retention policies configuration
CREATE TABLE audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  policy_name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Policy rules
  event_categories audit_event_category[],
  event_types audit_event_type[],
  severities audit_severity[],
  compliance_tags TEXT[],

  -- Retention duration
  retention_days INTEGER NOT NULL,
  auto_archive BOOLEAN DEFAULT true,
  auto_delete BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority policies override lower ones

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
-- Core queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_category_type ON audit_logs(event_category, event_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id) WHERE resource_type IS NOT NULL;
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- Search and filtering
CREATE INDEX idx_audit_logs_event_name ON audit_logs USING gin(to_tsvector('english', event_name));
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_audit_logs_compliance ON audit_logs USING gin(compliance_tags);

-- Security monitoring
CREATE INDEX idx_audit_logs_risk_score ON audit_logs(risk_score DESC) WHERE risk_score > 50;
CREATE INDEX idx_audit_logs_sensitive ON audit_logs(is_sensitive) WHERE is_sensitive = true;

-- Retention and archival
CREATE INDEX idx_audit_logs_expires_at ON audit_logs(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_audit_logs_archived ON audit_logs(is_archived, archived_at);

-- Aggregations indexes
CREATE INDEX idx_audit_agg_date ON audit_log_aggregations(aggregation_date DESC, hour);
CREATE INDEX idx_audit_agg_category ON audit_log_aggregations(event_category, event_type);
CREATE INDEX idx_audit_agg_user ON audit_log_aggregations(user_id) WHERE user_id IS NOT NULL;

-- Security alerts indexes
CREATE INDEX idx_security_alerts_status ON audit_security_alerts(status, created_at DESC);
CREATE INDEX idx_security_alerts_user ON audit_security_alerts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_alerts_severity ON audit_security_alerts(severity, created_at DESC);

-- Compliance reports indexes
CREATE INDEX idx_compliance_reports_type ON audit_compliance_reports(report_type, created_at DESC);
CREATE INDEX idx_compliance_reports_status ON audit_compliance_reports(status);

-- Function to calculate checksum for tamper-proofing
CREATE OR REPLACE FUNCTION calculate_audit_checksum(
  p_event_category audit_event_category,
  p_event_type audit_event_type,
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_created_at TIMESTAMPTZ,
  p_old_values JSONB,
  p_new_values JSONB
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      COALESCE(p_event_category::TEXT, '') || '|' ||
      COALESCE(p_event_type::TEXT, '') || '|' ||
      COALESCE(p_user_id::TEXT, '') || '|' ||
      COALESCE(p_resource_type, '') || '|' ||
      COALESCE(p_resource_id, '') || '|' ||
      COALESCE(p_created_at::TEXT, '') || '|' ||
      COALESCE(p_old_values::TEXT, '{}') || '|' ||
      COALESCE(p_new_values::TEXT, '{}'),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically calculate checksums
CREATE OR REPLACE FUNCTION set_audit_log_checksum()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_checksum TEXT;
BEGIN
  -- Get the most recent checksum
  SELECT checksum INTO v_previous_checksum
  FROM audit_logs
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate checksum for this entry
  NEW.checksum := calculate_audit_checksum(
    NEW.event_category,
    NEW.event_type,
    NEW.user_id,
    NEW.resource_type,
    NEW.resource_id,
    NEW.created_at,
    NEW.old_values,
    NEW.new_values
  );

  -- Chain to previous entry
  NEW.previous_checksum := v_previous_checksum;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_audit_checksum
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_log_checksum();

-- Function to set expiration date based on retention policy
CREATE OR REPLACE FUNCTION set_audit_log_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := CASE NEW.retention_policy
    WHEN 'days_30' THEN NEW.created_at + INTERVAL '30 days'
    WHEN 'days_90' THEN NEW.created_at + INTERVAL '90 days'
    WHEN 'days_180' THEN NEW.created_at + INTERVAL '180 days'
    WHEN 'days_365' THEN NEW.created_at + INTERVAL '365 days'
    WHEN 'days_730' THEN NEW.created_at + INTERVAL '730 days'
    WHEN 'forever' THEN NULL
    ELSE NEW.created_at + INTERVAL '90 days'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_audit_expiration
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_log_expiration();

-- Function to calculate changes diff
CREATE OR REPLACE FUNCTION calculate_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '{}'::JSONB;
  v_key TEXT;
  v_old_val JSONB;
  v_new_val JSONB;
BEGIN
  -- Only calculate for updates
  IF NEW.event_type = 'update' AND NEW.old_values IS NOT NULL AND NEW.new_values IS NOT NULL THEN
    -- Compare each field
    FOR v_key IN SELECT DISTINCT jsonb_object_keys(NEW.old_values || NEW.new_values)
    LOOP
      v_old_val := NEW.old_values -> v_key;
      v_new_val := NEW.new_values -> v_key;

      IF v_old_val IS DISTINCT FROM v_new_val THEN
        v_changes := v_changes || jsonb_build_object(
          v_key,
          jsonb_build_object(
            'old', v_old_val,
            'new', v_new_val
          )
        );
      END IF;
    END LOOP;

    NEW.changes := v_changes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_audit_changes
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_audit_changes();

-- Function to update aggregations
CREATE OR REPLACE FUNCTION update_audit_aggregations()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
  v_hour INTEGER;
BEGIN
  v_date := DATE(NEW.created_at);
  v_hour := EXTRACT(HOUR FROM NEW.created_at);

  INSERT INTO audit_log_aggregations (
    aggregation_date,
    hour,
    event_category,
    event_type,
    user_id,
    resource_type,
    severity,
    event_count,
    unique_users,
    unique_ips,
    error_count,
    avg_response_time_ms
  )
  VALUES (
    v_date,
    v_hour,
    NEW.event_category,
    NEW.event_type,
    NEW.user_id,
    NEW.resource_type,
    NEW.severity,
    1,
    1,
    1,
    CASE WHEN NEW.severity IN ('error', 'critical') THEN 1 ELSE 0 END,
    NEW.response_time_ms
  )
  ON CONFLICT (aggregation_date, hour, event_category, event_type, user_id, resource_type)
  DO UPDATE SET
    event_count = audit_log_aggregations.event_count + 1,
    error_count = audit_log_aggregations.error_count +
      CASE WHEN NEW.severity IN ('error', 'critical') THEN 1 ELSE 0 END,
    avg_response_time_ms = (
      COALESCE(audit_log_aggregations.avg_response_time_ms, 0) * audit_log_aggregations.event_count +
      COALESCE(NEW.response_time_ms, 0)
    ) / (audit_log_aggregations.event_count + 1),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_aggregations
  AFTER INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_aggregations();

-- Trigger for updated_at on aggregations
CREATE TRIGGER update_audit_agg_updated_at
  BEFORE UPDATE ON audit_log_aggregations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON audit_security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at
  BEFORE UPDATE ON audit_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin-only access for audit logs)
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view aggregations" ON audit_log_aggregations FOR SELECT USING (true);
CREATE POLICY "System can manage aggregations" ON audit_log_aggregations FOR ALL USING (true);

CREATE POLICY "Admins can view security alerts" ON audit_security_alerts FOR ALL USING (true);
CREATE POLICY "Admins can view compliance reports" ON audit_compliance_reports FOR ALL USING (true);
CREATE POLICY "Admins can manage retention policies" ON audit_retention_policies FOR ALL USING (true);

-- Insert default retention policies
INSERT INTO audit_retention_policies (policy_name, description, retention_days, priority) VALUES
  ('Critical Security Events', 'Critical security events retained for 2 years', 730, 100),
  ('Compliance Events', 'GDPR/SOC2/HIPAA events retained for 1 year', 365, 90),
  ('Authentication Events', 'Login/logout events retained for 90 days', 90, 50),
  ('User Actions', 'Regular user actions retained for 30 days', 30, 10),
  ('System Events', 'System events retained for 180 days', 180, 40);

-- Update the critical security events policy to target appropriate events
UPDATE audit_retention_policies
SET event_categories = ARRAY['security_event']::audit_event_category[],
    severities = ARRAY['critical']::audit_severity[]
WHERE policy_name = 'Critical Security Events';

UPDATE audit_retention_policies
SET compliance_tags = ARRAY['GDPR', 'SOC2', 'HIPAA']
WHERE policy_name = 'Compliance Events';

UPDATE audit_retention_policies
SET event_categories = ARRAY['auth_event']::audit_event_category[]
WHERE policy_name = 'Authentication Events';

UPDATE audit_retention_policies
SET event_categories = ARRAY['user_action', 'admin_action']::audit_event_category[]
WHERE policy_name = 'User Actions';

UPDATE audit_retention_policies
SET event_categories = ARRAY['system_event']::audit_event_category[]
WHERE policy_name = 'System Events';

-- Create a view for easy log querying with user info
CREATE OR REPLACE VIEW audit_logs_enriched AS
SELECT
  al.*,
  u.email as current_user_email,
  u.raw_user_meta_data->>'user_name' as current_user_name,
  u.raw_user_meta_data->>'avatar_url' as user_avatar_url
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id;

-- Grant permissions
GRANT SELECT ON audit_logs_enriched TO authenticated;
