# Conductor Orchestration System - Usage Guide

## Overview

The Conductor Orchestration System is a production-grade, multi-agent coordination framework that ensures every application built by Conductor follows standardized processes with quality gates, redundancy checks, and deployment readiness validation.

## Architecture

### Key Components

1. **Orchestrator Agent** (`lib/ai/orchestrator-agent.ts`)
   - Decomposes high-level tasks into detailed workflows
   - Intelligently assigns tasks to specialist agents
   - Monitors progress and quality gates
   - Ensures redundancy requirements are met

2. **Workflow Templates** (`lib/workflows/templates/`)
   - Pre-defined workflows for different app types (Next.js, React, etc.)
   - Standardized phases with quality checkpoints
   - Redundancy requirements for critical work

3. **Feedback Loop** (`lib/ai/feedback-loop.ts`)
   - Automatically converts approved intelligence suggestions into tasks
   - Closes the improvement loop

4. **Quality Gates** (Database: `quality_gates` table)
   - Security audits (multi-agent approval)
   - Performance benchmarks
   - Test coverage requirements
   - Documentation completeness

## How It Works

### The Standard App Generation Process

When you create a task like "Build a Next.js todo app", the orchestrator automatically:

1. **Decomposes the task** into a complete workflow with subtasks
2. **Creates quality gates** that must pass at each phase
3. **Assigns tasks intelligently** to specialist agents based on:
   - Agent capabilities
   - Current workload
   - Historical performance
   - Specialization

4. **Monitors execution** with automatic status updates
5. **Enforces redundancy** for critical phases (security, architecture, deployment)
6. **Generates deployment checklist** when workflow completes

### Workflow Phases

Every Next.js app goes through these phases:

1. **Requirements & Planning**
   - Requirements Analyst + System Architect review
   - Both agents must approve (redundancy)

2. **Architecture Design**
   - System architecture
   - Database schema design
   - API structure design
   - Multi-agent architecture review

3. **Development**
   - Setup Next.js project
   - Database and migrations
   - API routes implementation
   - UI components
   - Frontend-backend integration
   - **Quality Gates**: Linting, TypeScript type checking

4. **Security Review**
   - Security audit by Security Engineer
   - Dependency vulnerability scan
   - Second review by System Architect (redundancy)
   - **Quality Gates**: No critical vulnerabilities, secure authentication

5. **Performance Optimization**
   - Performance audit by Performance Engineer
   - Second review by System Architect (redundancy)
   - **Quality Gates**: Lighthouse score > 90, API latency < 200ms

6. **Testing**
   - Unit tests (>80% coverage)
   - Integration tests
   - E2E tests
   - **Quality Gates**: All tests pass, coverage threshold met

7. **Documentation**
   - API documentation
   - User documentation
   - Deployment guide
   - **Quality Gates**: Complete documentation

8. **Deployment Preparation**
   - Deployment configuration
   - Production build testing
   - Multi-agent deployment review (redundancy)
   - **Quality Gates**: Build success, valid config

9. **Final Review**
   - Multi-agent sign-off (System Architect + Security Engineer + Performance Engineer)
   - All three agents must approve
   - Deployment readiness checklist generated

## API Endpoints

### 1. Decompose Task into Workflow

**Endpoint**: `POST /api/tasks/decompose`

**Purpose**: Converts a high-level task into a complete workflow with subtasks, quality gates, and redundancy requirements.

**Request Body**:
```json
{
  "task_id": "uuid-of-parent-task",
  "project_id": "uuid-of-project",
  "task_description": "Build a Next.js todo app",
  "app_type": "nextjs",
  "user_requirements": "User should be able to create, edit, delete todos. Use Supabase for database."
}
```

**Response**:
```json
{
  "success": true,
  "workflow_instance_id": "uuid-of-workflow",
  "subtasks_created": 25,
  "quality_gates_created": 10,
  "subtasks": [
    {
      "id": "uuid",
      "title": "Gather and document requirements",
      "description": "...",
      "phase": "requirements",
      "assigned_agent_type": "requirements_analyst"
    }
  ],
  "quality_gates": [
    {
      "gate_id": "linting_check",
      "phase": "development",
      "status": "pending"
    }
  ]
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/tasks/decompose \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "123e4567-e89b-12d3-a456-426614174000",
    "project_id": "123e4567-e89b-12d3-a456-426614174001",
    "task_description": "Build a Next.js todo app with Supabase",
    "app_type": "nextjs",
    "user_requirements": "Users should be able to create, edit, and delete todos. Include authentication."
  }'
```

---

### 2. Intelligent Task Assignment

**Endpoint**: `POST /api/tasks/assign`

**Purpose**: Intelligently assigns a task to the best available agent based on capabilities, workload, and performance history.

**Request Body**:
```json
{
  "task_id": "uuid-of-task",
  "task_type": "feature",
  "required_capabilities": ["frontend", "react", "typescript"],
  "preferred_agent_types": ["frontend_architect"],
  "requires_redundancy": false
}
```

**Response**:
```json
{
  "success": true,
  "assigned_agent_id": "uuid-of-agent",
  "confidence_score": 0.95,
  "reasoning": "Agent has highest quality score for frontend tasks and lowest current workload",
  "estimated_duration_hours": 8,
  "backup_agent_ids": []
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/tasks/assign \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "123e4567-e89b-12d3-a456-426614174002",
    "task_type": "feature",
    "required_capabilities": ["backend", "database", "api_development"],
    "preferred_agent_types": ["backend_architect"],
    "requires_redundancy": false
  }'
```

---

### 3. Generate Deployment Checklist

**Endpoint**: `GET /api/workflows/{workflow_id}/checklist`

**Purpose**: Generates a deployment readiness checklist, checking all quality gates, redundancy requirements, and identifying blockers.

**Response**:
```json
{
  "success": true,
  "checklist": {
    "workflow_instance_id": "uuid",
    "all_phases_completed": true,
    "all_quality_gates_passed": true,
    "all_redundancies_satisfied": true,
    "deployment_ready": true,
    "blockers": []
  }
}
```

**Example Usage**:
```bash
curl http://localhost:3000/api/workflows/123e4567-e89b-12d3-a456-426614174003/checklist
```

---

### 4. Convert Intelligence Suggestions to Tasks

**Endpoint**: `POST /api/intelligence/{analysis_id}/convert-to-tasks`

**Purpose**: Converts all approved improvement suggestions from an intelligence analysis into actionable tasks (feedback loop closure).

**Response**:
```json
{
  "success": true,
  "tasks_created": 3,
  "tasks": [
    {
      "task_id": "uuid",
      "title": "Optimize database query performance",
      "assigned": true,
      "assigned_agent_id": "uuid"
    }
  ]
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3000/api/intelligence/123e4567-e89b-12d3-a456-426614174004/convert-to-tasks
```

---

## Database Schema

### New Tables

#### `workflow_instances`
Tracks workflow execution with phases and status.

```sql
- id: UUID (primary key)
- workflow_template_id: TEXT
- project_id: UUID
- parent_task_id: UUID
- status: TEXT (not_started | in_progress | blocked | completed | failed)
- current_phase: TEXT
- phases_completed: TEXT[]
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- metadata: JSONB
```

#### `quality_gates`
Quality gates that must pass before proceeding.

```sql
- id: UUID (primary key)
- workflow_instance_id: UUID
- gate_id: TEXT
- gate_name: TEXT
- phase: TEXT
- status: TEXT (pending | passed | failed | skipped)
- required: BOOLEAN
- criteria: JSONB
- checked_by_agent_ids: UUID[]
- checked_at: TIMESTAMPTZ
```

#### `agent_approvals`
Multi-agent approvals for tasks requiring redundancy.

```sql
- id: UUID (primary key)
- task_id: UUID
- agent_id: UUID
- approval_type: TEXT (approve | reject | request_changes)
- phase: TEXT
- comments: TEXT
- created_at: TIMESTAMPTZ
```

#### `deployment_checklists`
Deployment readiness with blockers.

```sql
- id: UUID (primary key)
- workflow_instance_id: UUID
- all_phases_completed: BOOLEAN
- all_quality_gates_passed: BOOLEAN
- all_redundancies_satisfied: BOOLEAN
- deployment_ready: BOOLEAN
- checklist_items: JSONB
- blockers: JSONB
```

#### `supervisor_assignments`
Tracks supervisor task assignment decisions.

```sql
- id: UUID (primary key)
- task_id: UUID
- supervisor_agent_id: UUID
- assigned_agent_id: UUID
- confidence_score: REAL
- reasoning: TEXT
- estimated_duration_hours: REAL
- actual_duration_hours: REAL
- assignment_quality_score: REAL
```

#### `agent_performance_metrics`
Agent performance for intelligent routing.

```sql
- id: UUID (primary key)
- agent_id: UUID
- task_type: TEXT
- tasks_completed: INTEGER
- tasks_failed: INTEGER
- avg_quality_score: REAL
- avg_duration_hours: REAL
- success_rate: REAL
- specialties: TEXT[]
```

#### `agent_capacity`
Agent availability and concurrent task capacity.

```sql
- id: UUID (primary key)
- agent_id: UUID
- max_concurrent_tasks: INTEGER (default: 3)
- current_task_count: INTEGER
- is_available: BOOLEAN
- last_heartbeat_at: TIMESTAMPTZ
```

### Updated Tables

#### `tasks` (new columns)
```sql
- parent_task_id: UUID (for task hierarchy)
- task_depth: INTEGER (0 = root, 1 = child, 2 = grandchild)
- workflow_instance_id: UUID (links to workflow)
- is_workflow_root: BOOLEAN (true if this task spawned a workflow)
```

---

## Quality Gates

### Automated Gates

| Gate | Phase | Check | Threshold |
|------|-------|-------|-----------|
| Linting | Development | ESLint errors | 0 errors |
| Type Checking | Development | TypeScript errors | 0 errors |
| Vulnerability Scan | Security | npm audit | No high-severity |
| Performance Benchmark | Performance | Lighthouse score | > 90 |
| Bundle Size | Performance | Bundle size | < 200KB |
| Unit Test Coverage | Testing | Coverage % | > 80% |
| Integration Tests | Testing | Test pass rate | 100% |
| E2E Tests | Testing | Test pass rate | 100% |
| Build Success | Deployment Prep | Production build | Success |

### Agent Review Gates

| Gate | Phase | Reviewers | Approval Rule |
|------|-------|-----------|---------------|
| Security Audit | Security | Security Engineer | Required |
| Auth Review | Security | Security Engineer + System Architect | Both approve |
| Architecture Review | Architecture | System Architect + Backend Architect + Frontend Architect | All approve |
| Performance Review | Performance | Performance Engineer + System Architect | Both approve |
| Deployment Review | Deployment Prep | Backend Architect + System Architect | Both approve |
| Final Review | Final Review | System Architect + Security Engineer + Performance Engineer | All approve |

---

## Redundancy Requirements

Critical phases require multiple agents to review and approve work to ensure quality and catch issues.

### Phases with Redundancy

1. **Requirements** → Requirements Analyst + System Architect (both approve)
2. **Architecture** → System Architect + Backend Architect + Frontend Architect (all approve)
3. **Security** → Security Engineer + System Architect (both approve)
4. **Performance** → Performance Engineer + System Architect (both approve)
5. **Deployment Prep** → Backend Architect + System Architect (both approve)
6. **Final Review** → System Architect + Security Engineer + Performance Engineer (all approve)

---

## Background Jobs

The orchestration system uses background jobs to automate workflows:

### Job Types

1. **`analyze_task`** - Analyzes completed task and generates improvement suggestions
2. **`detect_patterns`** - Detects patterns across multiple completed tasks (every 5 tasks)
3. **`review_suggestions`** - Supervisor reviews pending suggestions (every 10 analyses)
4. **`process_approved_suggestions`** - Converts approved suggestions to tasks (every 5 approved analyses)

### Job Triggers

- **Task completion** → Triggers `analyze_task`
- **Every 5 completed tasks** → Triggers `detect_patterns`
- **10+ pending analyses** → Triggers `review_suggestions`
- **Every 5 approved analyses** → Triggers `process_approved_suggestions`

---

## Example: Creating a Next.js App End-to-End

### Step 1: Create Project and Root Task

```bash
# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Todo App",
    "description": "A todo application with authentication"
  }'

# Create root task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "PROJECT_ID",
    "title": "Build Next.js todo app with authentication",
    "description": "Full-featured todo app with user authentication, CRUD operations, and real-time updates",
    "type": "feature",
    "priority": 10
  }'
```

### Step 2: Decompose Task into Workflow

```bash
curl -X POST http://localhost:3000/api/tasks/decompose \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "TASK_ID",
    "project_id": "PROJECT_ID",
    "task_description": "Build Next.js todo app with authentication",
    "app_type": "nextjs",
    "user_requirements": "Users should be able to sign up, log in, create todos, edit todos, delete todos, and mark todos as complete. Use Supabase for authentication and database."
  }'
```

This creates:
- **25+ subtasks** across 9 phases
- **10+ quality gates** at critical checkpoints
- **Workflow instance** to track progress

### Step 3: Agents Execute Tasks

Agents automatically poll for tasks and execute them:

1. Requirements Analyst gathers requirements
2. System Architect reviews requirements (redundancy)
3. System Architect designs architecture
4. Backend Architect designs database schema
5. Backend Architect designs API structure
6. Multiple architects review architecture (redundancy)
7. Frontend Architect sets up Next.js project
8. Backend Architect sets up database
9. Backend Architect implements API routes
10. Frontend Architect builds UI components
11. Integration work
12. Security Engineer performs security audit
13. System Architect reviews security (redundancy)
14. Performance Engineer optimizes performance
15. System Architect reviews performance (redundancy)
16. Testing phase (unit, integration, E2E)
17. Technical Writer creates documentation
18. Deployment preparation
19. Final multi-agent review

### Step 4: Check Deployment Readiness

```bash
curl http://localhost:3000/api/workflows/WORKFLOW_ID/checklist
```

Response shows:
- ✅ All phases completed
- ✅ All quality gates passed
- ✅ All redundancies satisfied
- ✅ Deployment ready
- No blockers

### Step 5: App is Ready for Marketplace

The app is now production-ready with:
- ✅ Complete implementation
- ✅ Security audited (2 agents)
- ✅ Performance optimized (2 agents)
- ✅ >80% test coverage
- ✅ Full documentation
- ✅ Deployment configuration
- ✅ Multi-agent final approval

---

## Benefits

### 1. Standardized Quality
Every app follows the same rigorous process with:
- Security audits
- Performance optimization
- Comprehensive testing
- Complete documentation

### 2. Redundancy for Critical Work
Multiple specialist agents review:
- Architecture decisions
- Security implementations
- Performance optimizations
- Deployment configurations

### 3. Intelligent Assignment
Tasks are assigned based on:
- Agent specialization
- Current workload
- Historical performance
- Success rates

### 4. Automated Feedback Loop
Improvement suggestions automatically become tasks, creating a continuous improvement cycle.

### 5. Deployment Readiness
Automated checklist validates all requirements before deployment.

---

## Configuration

### Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-xxx
```

The orchestrator uses Claude Sonnet 4 for:
- Task decomposition refinement
- Intelligent agent assignment
- Quality analysis

### Workflow Templates

Located in `lib/workflows/templates/`:
- `nextjs-fullstack.ts` - Next.js fullstack applications

To add more templates, create new files following the same structure.

---

## Monitoring

### View Workflow Progress

Query the database:

```sql
-- Get workflow status
SELECT * FROM workflow_instances WHERE id = 'WORKFLOW_ID';

-- Get all subtasks
SELECT * FROM tasks WHERE workflow_instance_id = 'WORKFLOW_ID' ORDER BY task_depth, created_at;

-- Get quality gates status
SELECT * FROM quality_gates WHERE workflow_instance_id = 'WORKFLOW_ID';

-- Get agent approvals
SELECT * FROM agent_approvals WHERE task_id IN (
  SELECT id FROM tasks WHERE workflow_instance_id = 'WORKFLOW_ID'
);

-- Get deployment checklist
SELECT * FROM deployment_checklists WHERE workflow_instance_id = 'WORKFLOW_ID';
```

---

## Troubleshooting

### Problem: Task decomposition fails

**Solution**: Check that:
1. `ANTHROPIC_API_KEY` is set
2. Parent task exists in database
3. Project exists in database
4. Valid `app_type` provided

### Problem: No agents available for assignment

**Solution**:
1. Check agent capacity: `SELECT * FROM agent_capacity WHERE is_available = true`
2. Ensure agents have required capabilities
3. Check if agents are overwhelmed (increase `max_concurrent_tasks`)

### Problem: Quality gates not passing

**Solution**:
1. Check specific gate criteria: `SELECT * FROM quality_gates WHERE status = 'failed'`
2. Review failure reasons
3. Re-run automated checks or request agent review

### Problem: Deployment checklist shows blockers

**Solution**:
1. Review blockers in checklist
2. Complete missing tasks
3. Pass failed quality gates
4. Ensure redundancy approvals are satisfied

---

## Next Steps

1. **Apply Database Migration**:
   ```bash
   # Connect to Supabase and run migration
   psql $DATABASE_URL -f supabase/migrations/20250111_orchestration_system.sql
   ```

2. **Deploy Agents**:
   - Ensure all 11 specialist agents are deployed
   - Each agent should have correct capabilities configured
   - Set `max_concurrent_tasks` based on agent capacity

3. **Test End-to-End**:
   - Create a test project
   - Create a root task
   - Decompose into workflow
   - Monitor agent execution
   - Verify quality gates
   - Generate deployment checklist

4. **Build Dashboard** (optional):
   - Visualize workflow progress
   - Show quality gate status
   - Display agent workloads
   - Track redundancy approvals

---

## Summary

The Conductor Orchestration System transforms your multi-agent platform into a **production-grade software factory** that:

- ✅ Decomposes high-level tasks into detailed workflows
- ✅ Assigns tasks intelligently based on agent expertise and availability
- ✅ Enforces quality gates at every phase
- ✅ Requires redundant reviews for critical work
- ✅ Automatically converts improvement suggestions into tasks
- ✅ Validates deployment readiness
- ✅ Ensures every app is marketplace-ready

This ensures **consistent, high-quality output** from your agent team, just like a real engineering organization.
