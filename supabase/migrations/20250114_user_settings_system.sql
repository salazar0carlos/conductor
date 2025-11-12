-- ============================================================================
-- User Settings & Integrations System
-- Manages user preferences, integration credentials, and account settings
-- ============================================================================

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_design_template TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  desktop_notifications BOOLEAN DEFAULT FALSE,
  auto_assign_tasks BOOLEAN DEFAULT TRUE,

  -- Display preferences
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),

  -- Editor preferences
  editor_theme TEXT DEFAULT 'dark',
  editor_font_size INTEGER DEFAULT 14 CHECK (editor_font_size >= 10 AND editor_font_size <= 24),
  editor_tab_size INTEGER DEFAULT 2 CHECK (editor_tab_size IN (2, 4, 8)),
  editor_word_wrap BOOLEAN DEFAULT TRUE,

  -- Privacy
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'team')),
  show_activity BOOLEAN DEFAULT TRUE,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- User integrations table (API keys, OAuth tokens)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'anthropic',
    'github',
    'openai',
    'google',
    'slack',
    'discord',
    'linear',
    'notion',
    'vercel',
    'stripe'
  )),

  integration_name TEXT NOT NULL, -- User-friendly name

  -- Credentials (encrypted at rest)
  api_key TEXT, -- For API key auth
  oauth_token TEXT, -- For OAuth
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMPTZ,

  -- Configuration
  config JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'error')),
  last_used_at TIMESTAMPTZ,
  error_message TEXT,

  -- Metadata
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON user_integrations(integration_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_integrations_unique ON user_integrations(user_id, integration_type, integration_name);

-- User API keys table (for Conductor API access)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk-proj-")

  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  rate_limit_per_hour INTEGER DEFAULT 1000,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Usage tracking
  total_requests INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_hash ON user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_status ON user_api_keys(status);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login',
    'logout',
    'settings_updated',
    'integration_added',
    'integration_removed',
    'api_key_created',
    'api_key_revoked',
    'password_changed',
    'email_changed',
    'subscription_updated',
    'project_created',
    'project_deleted'
  )),

  activity_description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);

-- Function: Create default settings for new user
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create settings on user signup
DROP TRIGGER IF EXISTS trigger_create_default_user_settings ON auth.users;
CREATE TRIGGER trigger_create_default_user_settings
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_settings();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER trigger_update_user_integrations_updated_at
BEFORE UPDATE ON user_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER trigger_update_user_api_keys_updated_at
BEFORE UPDATE ON user_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function: Log activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_description,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_description,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Get user settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS TABLE (
  theme TEXT,
  default_design_template TEXT,
  email_notifications BOOLEAN,
  desktop_notifications BOOLEAN,
  auto_assign_tasks BOOLEAN,
  timezone TEXT,
  language TEXT,
  date_format TEXT,
  time_format TEXT,
  editor_theme TEXT,
  editor_font_size INTEGER,
  editor_tab_size INTEGER,
  editor_word_wrap BOOLEAN,
  profile_visibility TEXT,
  show_activity BOOLEAN,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.theme,
    s.default_design_template,
    s.email_notifications,
    s.desktop_notifications,
    s.auto_assign_tasks,
    s.timezone,
    s.language,
    s.date_format,
    s.time_format,
    s.editor_theme,
    s.editor_font_size,
    s.editor_tab_size,
    s.editor_word_wrap,
    s.profile_visibility,
    s.show_activity,
    s.metadata
  FROM user_settings s
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update user settings
CREATE OR REPLACE FUNCTION update_user_settings(
  p_user_id UUID,
  p_settings JSONB
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE user_settings
  SET
    theme = COALESCE((p_settings->>'theme')::TEXT, theme),
    default_design_template = COALESCE(p_settings->>'default_design_template', default_design_template),
    email_notifications = COALESCE((p_settings->>'email_notifications')::BOOLEAN, email_notifications),
    desktop_notifications = COALESCE((p_settings->>'desktop_notifications')::BOOLEAN, desktop_notifications),
    auto_assign_tasks = COALESCE((p_settings->>'auto_assign_tasks')::BOOLEAN, auto_assign_tasks),
    timezone = COALESCE(p_settings->>'timezone', timezone),
    language = COALESCE(p_settings->>'language', language),
    date_format = COALESCE(p_settings->>'date_format', date_format),
    time_format = COALESCE((p_settings->>'time_format')::TEXT, time_format),
    editor_theme = COALESCE(p_settings->>'editor_theme', editor_theme),
    editor_font_size = COALESCE((p_settings->>'editor_font_size')::INTEGER, editor_font_size),
    editor_tab_size = COALESCE((p_settings->>'editor_tab_size')::INTEGER, editor_tab_size),
    editor_word_wrap = COALESCE((p_settings->>'editor_word_wrap')::BOOLEAN, editor_word_wrap),
    profile_visibility = COALESCE((p_settings->>'profile_visibility')::TEXT, profile_visibility),
    show_activity = COALESCE((p_settings->>'show_activity')::BOOLEAN, show_activity),
    metadata = COALESCE(p_settings->'metadata', metadata),
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING jsonb_build_object(
    'theme', theme,
    'default_design_template', default_design_template,
    'email_notifications', email_notifications,
    'desktop_notifications', desktop_notifications,
    'auto_assign_tasks', auto_assign_tasks,
    'timezone', timezone,
    'language', language,
    'date_format', date_format,
    'time_format', time_format,
    'editor_theme', editor_theme,
    'editor_font_size', editor_font_size,
    'editor_tab_size', editor_tab_size,
    'editor_word_wrap', editor_word_wrap,
    'profile_visibility', profile_visibility,
    'show_activity', show_activity,
    'metadata', metadata
  ) INTO result;

  -- Log the activity
  PERFORM log_user_activity(
    p_user_id,
    'settings_updated',
    'User updated their settings',
    jsonb_build_object('settings_changed', p_settings)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active integrations for user
CREATE OR REPLACE FUNCTION get_user_integrations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  integration_type TEXT,
  integration_name TEXT,
  status TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.integration_type,
    i.integration_name,
    i.status,
    i.last_used_at,
    i.created_at
  FROM user_integrations i
  WHERE i.user_id = p_user_id
  AND i.status != 'inactive'
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Views for analytics

-- User settings summary
CREATE OR REPLACE VIEW user_settings_summary AS
SELECT
  u.id as user_id,
  u.email,
  s.theme,
  s.default_design_template,
  s.timezone,
  s.language,
  s.created_at as settings_created_at,
  s.updated_at as settings_updated_at
FROM auth.users u
LEFT JOIN user_settings s ON s.user_id = u.id;

-- Integration usage summary
CREATE OR REPLACE VIEW integration_usage_summary AS
SELECT
  user_id,
  integration_type,
  COUNT(*) as integration_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  MAX(last_used_at) as last_used
FROM user_integrations
GROUP BY user_id, integration_type;

-- Comments
COMMENT ON TABLE user_settings IS 'User preferences and settings';
COMMENT ON TABLE user_integrations IS 'User integration credentials (API keys, OAuth tokens)';
COMMENT ON TABLE user_api_keys IS 'API keys for Conductor API access';
COMMENT ON TABLE user_activity_log IS 'Audit log of user activities';
COMMENT ON FUNCTION get_user_settings IS 'Get user settings with all values';
COMMENT ON FUNCTION update_user_settings IS 'Update user settings and log activity';
COMMENT ON FUNCTION get_user_integrations IS 'Get active integrations for a user';
