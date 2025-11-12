-- ============================================================================
-- Project-Scoped Agents Migration
-- Makes agents specific to projects for multi-project autonomous teams
-- ============================================================================

-- Add project_id to agents (optional - allows system-wide agents too)
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS worker_process_id TEXT,
ADD COLUMN IF NOT EXISTS worker_status TEXT DEFAULT 'stopped' CHECK (worker_status IN ('spawning', 'active', 'idle', 'stopped', 'error'));

-- Create index for project-specific agent queries
CREATE INDEX IF NOT EXISTS idx_agents_project_id ON agents(project_id);
CREATE INDEX IF NOT EXISTS idx_agents_worker_status ON agents(worker_status);

-- Add team management to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS team_status TEXT DEFAULT 'not_spawned' CHECK (team_status IN ('not_spawned', 'spawning', 'active', 'paused', 'archived')),
ADD COLUMN IF NOT EXISTS team_spawned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_spawn_team BOOLEAN DEFAULT TRUE;

-- Track project resource usage
CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  api_tokens_used BIGINT DEFAULT 0,
  api_cost_usd DECIMAL(10, 2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  active_agent_hours DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, date)
);

CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_date ON project_resources(date);

-- Track agent work sessions
CREATE TABLE IF NOT EXISTS agent_work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  tokens_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'interrupted')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_work_sessions_agent_id ON agent_work_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_work_sessions_project_id ON agent_work_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_work_sessions_status ON agent_work_sessions(status);

-- Function to spawn agent team for a project
CREATE OR REPLACE FUNCTION spawn_agent_team(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  agent_types TEXT[] := ARRAY[
    'backend_architect',
    'frontend_architect',
    'system_architect',
    'security_engineer',
    'performance_engineer',
    'refactoring_expert',
    'requirements_analyst',
    'technical_writer',
    'deep_research_agent',
    'learning_guide',
    'tech_stack_researcher'
  ];
  agent_type TEXT;
  new_agent_id UUID;
  spawned_agents JSONB := '[]'::JSONB;
BEGIN
  -- Mark project as spawning
  UPDATE projects
  SET team_status = 'spawning',
      team_spawned_at = now()
  WHERE id = p_project_id;

  -- Create each agent
  FOREACH agent_type IN ARRAY agent_types
  LOOP
    INSERT INTO agents (
      project_id,
      name,
      type,
      status,
      worker_status,
      capabilities,
      config
    )
    VALUES (
      p_project_id,
      CASE agent_type
        WHEN 'backend_architect' THEN 'Backend Architect'
        WHEN 'frontend_architect' THEN 'Frontend Architect'
        WHEN 'system_architect' THEN 'System Architect'
        WHEN 'security_engineer' THEN 'Security Engineer'
        WHEN 'performance_engineer' THEN 'Performance Engineer'
        WHEN 'refactoring_expert' THEN 'Refactoring Expert'
        WHEN 'requirements_analyst' THEN 'Requirements Analyst'
        WHEN 'technical_writer' THEN 'Technical Writer'
        WHEN 'deep_research_agent' THEN 'Deep Research Agent'
        WHEN 'learning_guide' THEN 'Learning Guide'
        WHEN 'tech_stack_researcher' THEN 'Tech Stack Researcher'
      END,
      'llm',
      'idle',
      'stopped',
      ARRAY['general'],
      '{}'::JSONB
    )
    RETURNING id INTO new_agent_id;

    -- Add to spawned list
    spawned_agents := spawned_agents || jsonb_build_object('agent_id', new_agent_id, 'type', agent_type);
  END LOOP;

  -- Mark team as active
  UPDATE projects
  SET team_status = 'active'
  WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'agents_spawned', jsonb_array_length(spawned_agents),
    'agents', spawned_agents
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if project has a complete team
CREATE OR REPLACE FUNCTION has_complete_team(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  agent_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO agent_count
  FROM agents
  WHERE project_id = p_project_id
    AND status != 'archived';

  -- A complete team has at least 11 agents
  RETURN agent_count >= 11;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN agents.project_id IS 'Links agent to specific project. NULL = system-wide agent';
COMMENT ON COLUMN agents.worker_process_id IS 'PID, container ID, or worker identifier';
COMMENT ON COLUMN agents.worker_status IS 'Status of the worker process';
COMMENT ON COLUMN projects.team_status IS 'Status of the project agent team';
COMMENT ON TABLE project_resources IS 'Daily resource usage tracking per project';
COMMENT ON TABLE agent_work_sessions IS 'Tracks individual agent work sessions for billing and analytics';
