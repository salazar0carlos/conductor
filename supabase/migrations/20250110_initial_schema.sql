-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  github_repo TEXT,
  github_branch TEXT DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('llm', 'tool', 'human', 'supervisor', 'analyzer')),
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'busy', 'offline', 'error')),
  last_heartbeat TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('feature', 'bugfix', 'refactor', 'test', 'docs', 'analysis', 'review')),
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled')),
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  dependencies UUID[] DEFAULT '{}',
  required_capabilities TEXT[] DEFAULT '{}',
  input_data JSONB DEFAULT '{}',
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task logs table
CREATE TABLE task_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analysis history table (for Intelligence Layer)
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analyzer_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('task_completion', 'pattern_detection', 'improvement_suggestion', 'quality_review')),
  findings JSONB NOT NULL,
  suggestions JSONB DEFAULT '[]',
  priority_score INTEGER CHECK (priority_score >= 0 AND priority_score <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'implemented')),
  reviewed_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_agent_id ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_priority ON tasks(priority DESC);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at DESC);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_heartbeat ON agents(last_heartbeat DESC);
CREATE INDEX idx_analysis_history_project_id ON analysis_history(project_id);
CREATE INDEX idx_analysis_history_status ON analysis_history(status);
CREATE INDEX idx_analysis_history_priority_score ON analysis_history(priority_score DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_history_updated_at BEFORE UPDATE ON analysis_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now, can be restricted based on auth requirements)
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON agents FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agents FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON agents FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON tasks FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON task_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON task_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON analysis_history FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON analysis_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON analysis_history FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON analysis_history FOR DELETE USING (true);
