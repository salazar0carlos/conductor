-- Migration: Add admin settings and user roles
-- Created: 2025-01-10

-- =====================================================
-- 1. USER PROFILES & ROLES
-- =====================================================

-- Create user_profiles table to extend Supabase auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create index for faster role lookups
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- =====================================================
-- 2. SYSTEM SETTINGS
-- =====================================================

-- Create system_settings table for app-wide configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'agents', 'tasks', 'notifications', 'integrations', 'security')),
  description TEXT,
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
  is_public BOOLEAN NOT NULL DEFAULT false, -- If true, can be read by non-admins
  is_editable BOOLEAN NOT NULL DEFAULT true, -- If false, cannot be modified via API
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster key lookups
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- =====================================================
-- 3. AUDIT LOG
-- =====================================================

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  resource_type TEXT NOT NULL, -- 'setting', 'user', 'agent', 'task', etc.
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all admin tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE email = user_email AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USER_PROFILES policies
-- Admins can do everything
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update user profiles"
  ON user_profiles FOR UPDATE
  USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete user profiles"
  ON user_profiles FOR DELETE
  USING (is_admin(auth.jwt() ->> 'email'));

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

-- SYSTEM_SETTINGS policies
-- Admins can do everything
CREATE POLICY "Admins can view all settings"
  ON system_settings FOR SELECT
  USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can insert settings"
  ON system_settings FOR INSERT
  WITH CHECK (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update settings"
  ON system_settings FOR UPDATE
  USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete settings"
  ON system_settings FOR DELETE
  USING (is_admin(auth.jwt() ->> 'email'));

-- All users can read public settings
CREATE POLICY "Users can view public settings"
  ON system_settings FOR SELECT
  USING (is_public = true);

-- AUDIT_LOGS policies
-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin(auth.jwt() ->> 'email'));

-- Anyone can insert audit logs (system creates them)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 5. SEED DEFAULT SETTINGS
-- =====================================================

-- Insert default system settings
INSERT INTO system_settings (key, value, category, description, data_type, is_public, is_editable)
VALUES
  -- General Settings
  ('app.name', '"Conductor"', 'general', 'Application name', 'string', true, true),
  ('app.description', '"AI Agent Orchestration System"', 'general', 'Application description', 'string', true, true),
  ('app.version', '"1.0.0"', 'general', 'Application version', 'string', true, false),
  ('app.maintenance_mode', 'false', 'general', 'Enable maintenance mode', 'boolean', true, true),

  -- Agent Settings
  ('agents.max_concurrent', '10', 'agents', 'Maximum concurrent agents', 'number', false, true),
  ('agents.heartbeat_interval', '30', 'agents', 'Agent heartbeat interval (seconds)', 'number', false, true),
  ('agents.timeout', '300', 'agents', 'Agent timeout (seconds)', 'number', false, true),
  ('agents.auto_assign', 'true', 'agents', 'Enable automatic task assignment', 'boolean', false, true),

  -- Task Settings
  ('tasks.max_queue_size', '1000', 'tasks', 'Maximum task queue size', 'number', false, true),
  ('tasks.default_priority', '5', 'tasks', 'Default task priority (0-10)', 'number', false, true),
  ('tasks.retry_attempts', '3', 'tasks', 'Default retry attempts for failed tasks', 'number', false, true),
  ('tasks.auto_archive_days', '30', 'tasks', 'Auto-archive completed tasks after N days', 'number', false, true),

  -- Notification Settings
  ('notifications.enabled', 'true', 'notifications', 'Enable system notifications', 'boolean', false, true),
  ('notifications.email_enabled', 'false', 'notifications', 'Enable email notifications', 'boolean', false, true),
  ('notifications.slack_enabled', 'false', 'notifications', 'Enable Slack notifications', 'boolean', false, true),
  ('notifications.webhook_url', '""', 'notifications', 'Webhook URL for notifications', 'string', false, true),

  -- Integration Settings
  ('integrations.github_enabled', 'false', 'integrations', 'Enable GitHub integration', 'boolean', false, true),
  ('integrations.openai_enabled', 'false', 'integrations', 'Enable OpenAI integration', 'boolean', false, true),
  ('integrations.anthropic_enabled', 'true', 'integrations', 'Enable Anthropic integration', 'boolean', false, true),

  -- Security Settings
  ('security.require_api_key', 'true', 'security', 'Require API key for agent access', 'boolean', false, true),
  ('security.session_timeout', '3600', 'security', 'Session timeout (seconds)', 'number', false, true),
  ('security.max_login_attempts', '5', 'security', 'Maximum login attempts before lockout', 'number', false, true),
  ('security.password_min_length', '8', 'security', 'Minimum password length', 'number', false, true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to system_settings
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. HELPFUL VIEWS
-- =====================================================

-- View for admin dashboard statistics
CREATE OR REPLACE VIEW admin_statistics AS
SELECT
  (SELECT COUNT(*) FROM user_profiles WHERE is_active = true) as active_users,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM agents WHERE status = 'active') as active_agents,
  (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as active_tasks,
  (SELECT COUNT(*) FROM system_settings) as settings_count;

-- View for recent admin activity
CREATE OR REPLACE VIEW recent_admin_activity AS
SELECT
  al.id,
  al.action,
  al.resource_type,
  al.resource_id,
  al.created_at,
  up.email as user_email,
  up.full_name as user_name
FROM audit_logs al
LEFT JOIN user_profiles up ON al.user_id = up.id
ORDER BY al.created_at DESC
LIMIT 100;

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE user_profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON TABLE audit_logs IS 'Audit trail for admin actions';
COMMENT ON FUNCTION is_admin(TEXT) IS 'Check if user email has admin role';
