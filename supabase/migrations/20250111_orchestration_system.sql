-- ============================================================================
-- Orchestration System Schema
-- Adds support for task hierarchies, workflows, quality gates, and redundancy
-- ============================================================================

-- Add task hierarchy columns to tasks table
ALTER TABLE tasks
ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
ADD COLUMN task_depth INTEGER DEFAULT 0,
ADD COLUMN workflow_instance_id UUID,
ADD COLUMN is_workflow_root BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_workflow_instance_id ON tasks(workflow_instance_id);
CREATE INDEX idx_tasks_task_depth ON tasks(task_depth);

-- ============================================================================
-- Workflow Instances Table
-- ============================================================================
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed', 'failed')),
  current_phase TEXT,
  phases_completed TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workflow_instances_project_id ON workflow_instances(project_id);
CREATE INDEX idx_workflow_instances_parent_task_id ON workflow_instances(parent_task_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);

-- ============================================================================
-- Quality Gates Table
-- ============================================================================
CREATE TABLE quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  gate_id TEXT NOT NULL,
  gate_name TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'skipped')),
  required BOOLEAN DEFAULT TRUE,
  criteria JSONB DEFAULT '[]',
  checked_by_agent_ids UUID[] DEFAULT '{}',
  checked_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quality_gates_workflow_instance_id ON quality_gates(workflow_instance_id);
CREATE INDEX idx_quality_gates_status ON quality_gates(status);
CREATE INDEX idx_quality_gates_phase ON quality_gates(phase);

-- ============================================================================
-- Agent Approvals Table (for redundancy tracking)
-- ============================================================================
CREATE TABLE agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL CHECK (approval_type IN ('approve', 'reject', 'request_changes')),
  phase TEXT,
  comments TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_approvals_task_id ON agent_approvals(task_id);
CREATE INDEX idx_agent_approvals_agent_id ON agent_approvals(agent_id);
CREATE UNIQUE INDEX idx_agent_approvals_unique ON agent_approvals(task_id, agent_id);

-- ============================================================================
-- Deployment Checklist Table
-- ============================================================================
CREATE TABLE deployment_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  all_phases_completed BOOLEAN DEFAULT FALSE,
  all_quality_gates_passed BOOLEAN DEFAULT FALSE,
  all_redundancies_satisfied BOOLEAN DEFAULT FALSE,
  deployment_ready BOOLEAN DEFAULT FALSE,
  checklist_items JSONB DEFAULT '[]',
  blockers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deployment_checklists_workflow_instance_id ON deployment_checklists(workflow_instance_id);
CREATE INDEX idx_deployment_checklists_deployment_ready ON deployment_checklists(deployment_ready);

-- ============================================================================
-- Supervisor Assignments Table
-- ============================================================================
CREATE TABLE supervisor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  supervisor_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  assigned_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning TEXT,
  estimated_duration_hours REAL,
  actual_duration_hours REAL,
  assignment_quality_score REAL CHECK (assignment_quality_score >= 0 AND assignment_quality_score <= 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_supervisor_assignments_task_id ON supervisor_assignments(task_id);
CREATE INDEX idx_supervisor_assignments_supervisor_agent_id ON supervisor_assignments(supervisor_agent_id);
CREATE INDEX idx_supervisor_assignments_assigned_agent_id ON supervisor_assignments(assigned_agent_id);

-- ============================================================================
-- Agent Performance Metrics Table
-- ============================================================================
CREATE TABLE agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_type TEXT,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  avg_quality_score REAL DEFAULT 0,
  avg_duration_hours REAL DEFAULT 0,
  success_rate REAL DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_performance_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX idx_agent_performance_metrics_task_type ON agent_performance_metrics(task_type);
CREATE UNIQUE INDEX idx_agent_performance_metrics_unique ON agent_performance_metrics(agent_id, task_type);

-- ============================================================================
-- Agent Capacity Tracking Table
-- ============================================================================
CREATE TABLE agent_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  max_concurrent_tasks INTEGER DEFAULT 3,
  current_task_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  last_heartbeat_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_capacity_agent_id ON agent_capacity(agent_id);
CREATE INDEX idx_agent_capacity_is_available ON agent_capacity(is_available);
CREATE UNIQUE INDEX idx_agent_capacity_agent_id_unique ON agent_capacity(agent_id);

-- ============================================================================
-- Task Templates Table (for workflow templates)
-- ============================================================================
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  workflow_template_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  required_capabilities TEXT[] DEFAULT '{}',
  preferred_agent_types TEXT[] DEFAULT '{}',
  requires_redundancy BOOLEAN DEFAULT FALSE,
  redundancy_agent_types TEXT[] DEFAULT '{}',
  estimated_hours REAL,
  acceptance_criteria JSONB DEFAULT '[]',
  quality_checks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_templates_workflow_template_id ON task_templates(workflow_template_id);
CREATE INDEX idx_task_templates_phase ON task_templates(phase);
CREATE UNIQUE INDEX idx_task_templates_template_id_unique ON task_templates(template_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to get child tasks
CREATE OR REPLACE FUNCTION get_child_tasks(parent_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  task_depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.status, t.task_depth
  FROM tasks t
  WHERE t.parent_task_id = parent_id
  ORDER BY t.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to check if all child tasks are completed
CREATE OR REPLACE FUNCTION all_children_completed(parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  incomplete_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO incomplete_count
  FROM tasks
  WHERE parent_task_id = parent_id
    AND status NOT IN ('completed', 'cancelled');

  RETURN incomplete_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update parent task status when all children complete
CREATE OR REPLACE FUNCTION check_parent_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.parent_task_id IS NOT NULL THEN
    IF all_children_completed(NEW.parent_task_id) THEN
      UPDATE tasks
      SET status = 'completed',
          completed_at = now()
      WHERE id = NEW.parent_task_id
        AND status = 'in_progress';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete parent tasks
CREATE TRIGGER trigger_check_parent_task_completion
AFTER UPDATE OF status ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION check_parent_task_completion();

-- Function to update agent capacity
CREATE OR REPLACE FUNCTION update_agent_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Task started
    IF OLD.status = 'pending' AND NEW.status IN ('assigned', 'in_progress') THEN
      UPDATE agent_capacity
      SET current_task_count = current_task_count + 1,
          is_available = (current_task_count + 1) < max_concurrent_tasks,
          updated_at = now()
      WHERE agent_id = NEW.assigned_agent_id;

    -- Task completed or failed
    ELSIF OLD.status IN ('assigned', 'in_progress') AND NEW.status IN ('completed', 'failed', 'cancelled') THEN
      UPDATE agent_capacity
      SET current_task_count = GREATEST(0, current_task_count - 1),
          is_available = TRUE,
          updated_at = now()
      WHERE agent_id = NEW.assigned_agent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update agent capacity
CREATE TRIGGER trigger_update_agent_capacity
AFTER UPDATE OF status ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_agent_capacity();

-- ============================================================================
-- Initial Data: Create agent capacity records for existing agents
-- ============================================================================
INSERT INTO agent_capacity (agent_id, max_concurrent_tasks, current_task_count, is_available)
SELECT id, 3, 0, TRUE
FROM agents
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE workflow_instances IS 'Tracks workflow execution instances with phases and status';
COMMENT ON TABLE quality_gates IS 'Quality gates that must pass before proceeding to next phase';
COMMENT ON TABLE agent_approvals IS 'Multi-agent approvals for tasks requiring redundancy';
COMMENT ON TABLE deployment_checklists IS 'Deployment readiness checklists with blockers';
COMMENT ON TABLE supervisor_assignments IS 'Tracks supervisor task assignment decisions';
COMMENT ON TABLE agent_performance_metrics IS 'Agent performance metrics for intelligent routing';
COMMENT ON TABLE agent_capacity IS 'Agent availability and concurrent task capacity';
COMMENT ON TABLE task_templates IS 'Reusable task templates for workflows';
