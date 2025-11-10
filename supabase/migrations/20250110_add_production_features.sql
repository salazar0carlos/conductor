-- Add agent API keys table
CREATE TABLE agent_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_api_keys_agent_id ON agent_api_keys(agent_id);
CREATE INDEX idx_agent_api_keys_key_hash ON agent_api_keys(key_hash);

-- Add background jobs table
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_background_jobs_status ON background_jobs(status);
CREATE INDEX idx_background_jobs_type ON background_jobs(type);
CREATE INDEX idx_background_jobs_scheduled_at ON background_jobs(scheduled_at);
CREATE INDEX idx_background_jobs_next_retry_at ON background_jobs(next_retry_at);

CREATE TRIGGER update_background_jobs_updated_at BEFORE UPDATE ON background_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add GitHub integration columns to projects
ALTER TABLE projects ADD COLUMN github_installation_id TEXT;
ALTER TABLE projects ADD COLUMN github_access_token TEXT;
ALTER TABLE projects ADD COLUMN github_webhook_id TEXT;

-- Add GitHub data to tasks
ALTER TABLE tasks ADD COLUMN github_pr_number INTEGER;
ALTER TABLE tasks ADD COLUMN github_pr_url TEXT;
ALTER TABLE tasks ADD COLUMN github_branch TEXT;
ALTER TABLE tasks ADD COLUMN github_commit_sha TEXT;

-- Add rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);

-- Enable RLS on new tables
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Enable read access for all users" ON agent_api_keys FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agent_api_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agent_api_keys FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON agent_api_keys FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON background_jobs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON background_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON background_jobs FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON rate_limits FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON rate_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON rate_limits FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON rate_limits FOR DELETE USING (true);
