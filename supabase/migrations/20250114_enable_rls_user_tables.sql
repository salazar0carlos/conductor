-- ============================================================================
-- Enable Row Level Security (RLS) for User Tables
-- CRITICAL FIX: Allows users to manage their own integrations and settings
-- ============================================================================

-- Enable RLS on all user-related tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for user_settings
-- ============================================================================

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
ON user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
ON user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
ON user_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
ON user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for user_integrations
-- ============================================================================

-- Users can view their own integrations
CREATE POLICY "Users can view own integrations"
ON user_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "Users can insert own integrations"
ON user_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update own integrations"
ON user_integrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete own integrations"
ON user_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for user_api_keys
-- ============================================================================

-- Users can view their own API keys
CREATE POLICY "Users can view own api keys"
ON user_api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert own api keys"
ON user_api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own api keys"
ON user_api_keys
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own api keys"
ON user_api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for user_activity_log
-- ============================================================================

-- Users can view their own activity log
CREATE POLICY "Users can view own activity log"
ON user_activity_log
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own activity log entries
CREATE POLICY "Users can insert own activity log"
ON user_activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: Activity logs are typically append-only, no UPDATE or DELETE policies

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Users can view own settings" ON user_settings IS 'Allow users to view their own settings';
COMMENT ON POLICY "Users can insert own integrations" ON user_integrations IS 'Allow users to add new integrations';
COMMENT ON POLICY "Users can delete own integrations" ON user_integrations IS 'Allow users to remove their integrations';
