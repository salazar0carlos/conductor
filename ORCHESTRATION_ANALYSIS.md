# Task Orchestration & Agent Coordination System Analysis

## Executive Summary

Your system has **foundational orchestration infrastructure** with **passive agent coordination** and **emerging supervisory review patterns**. The system uses a **pull-based polling model** where agents self-select tasks based on capabilities. There is **no explicit supervisor for task assignment**, but an **intelligence layer provides feedback loops** through asynchronous analysis jobs.

**Current State:** Multi-agent foundation with intelligence analysis
**Gap:** No active orchestration, task decomposition, or parent-child task relationships

---

## 1. TASK ASSIGNMENT LOGIC

### Current Implementation: **Pull-Based Self-Selection**

#### How It Works:
1. **Agents poll for work**: `POST /api/tasks/poll`
   - Agents send their `agent_id` and `capabilities`
   - No scheduler or supervisor assigns tasks
   
2. **Database-driven matching** in `/api/tasks/poll/route.ts`:
   ```typescript
   - Get ALL pending tasks
   - Filter by agent capabilities
   - Check dependency satisfaction
   - Return highest priority available task
   - Update task status to 'assigned'
   ```

3. **Matching Algorithm**:
   - Priority: Sorted `priority DESC, created_at ASC`
   - Requirements: All required_capabilities must be in agent.capabilities[]
   - Dependencies: All task.dependencies[] must have status='completed'
   - First-match wins (no competitive bidding)

#### Key Code Location:
`/home/user/conductor/app/api/tasks/poll/route.ts` (lines 19-55)

#### Characteristics:
- ✅ **Stateless**: No assignment history or tracking
- ✅ **Simple**: Basic capability matching
- ❌ **No supervisor**: No central authority deciding allocation
- ❌ **No optimization**: Doesn't consider agent load/history
- ❌ **No load balancing**: First capable agent wins
- ❌ **No task decomposition**: Agents can't request help or split work

---

## 2. AGENT-TO-AGENT COMMUNICATION

### Current State: **NOT IMPLEMENTED**

#### What's Missing:
1. **No direct agent-to-agent messaging**
2. **No inter-agent task handoff**
3. **No subtask creation from agents**
4. **No collaborative workflows**
5. **No RPC/async messaging between agents**

#### Task Dependency System (The Only Inter-Task Connection):
```sql
-- From tasks table schema
dependencies UUID[] DEFAULT '{}';  -- Array of task IDs that must complete first
```

**Usage**: 
- Tasks can declare dependencies on other tasks
- Polling logic checks: ALL dependencies must be `status='completed'`
- **But**: No agent-to-agent communication about task relationships

#### Example:
```
Task A (assigned to Agent 1) -> must complete before
Task B (will be assigned to Agent 2) can start
```

**How it's enforced** in `/api/tasks/poll/route.ts`:
```typescript
// Check if all dependencies are completed
if (task.dependencies.length > 0) {
  const { data: depTasks } = await supabase
    .from('tasks')
    .select('id, status')
    .in('id', task.dependencies)
  
  const allDepsCompleted = depTasks?.every(dep => dep.status === 'completed')
  if (!allDepsCompleted) continue  // Skip this task
}
```

---

## 3. SUPERVISOR PATTERNS

### Current Implementation: **One Supervisor Agent (Intelligence-Based)**

#### Supervisor Agent: `lib/ai/supervisor-agent.ts`

**Role**: Reviews and prioritizes improvement suggestions (NOT task assignment)

**When it activates**:
```typescript
// From background-jobs.ts line 193
if (analysisCount && analysisCount >= 10) {
  await createJob('review_suggestions', { project_id: task.project_id })
}
```

**What it does**:
1. Queries `analysis_history` table for pending analyses
2. Uses Claude AI to review suggestions
3. Makes decisions: `approved | rejected | needs_review`
4. Assigns final `priority_score` (0-10)
5. Updates `analysis_history.status` based on decisions
6. Stores supervisor reasoning in `metadata.supervisor_review`

**System Prompt** (lines 28-47):
```
"You are a Supervisor Agent responsible for reviewing and prioritizing 
improvement suggestions... Filter out duplicates and low-value suggestions... 
Assign final priorities based on business value, technical impact, and effort"
```

#### Key Limitations:
- ❌ **Not task assignment**: Only reviews improvement suggestions
- ❌ **Reactive only**: Only runs after 10 analyses pile up
- ❌ **No task delegation**: Doesn't create or assign tasks
- ❌ **No orchestration**: Doesn't coordinate multiple agents
- ✅ **Feedback mechanism**: Provides guidance on improvements

---

## 4. FEEDBACK LOOPS

### Current Implementation: **Intelligence Analysis Pipeline**

#### Complete Loop Flow:

```
Task Completion
    ↓
[1] onTaskComplete() triggered 
    (from /api/tasks/[id]/complete/route.ts:57)
    ↓
[2] Create 'analyze_task' background job
    ↓
[3] Background Job Processor (/api/jobs/process)
    ↓
[4] Product Improvement Agent analyzes task
    - Creates analysis_history record
    - Stores findings & suggestions
    - Initial priority_score assigned
    ↓
[5] Periodic Pattern Detection
    (Every 5 completed tasks in same project)
    - Detects systemic issues
    - Cross-task pattern analysis
    ↓
[6] Supervisor Review
    (When ≥10 pending analyses exist)
    - Reviews suggestions
    - Filters duplicates
    - Assigns final priorities
    ↓
[7] Approved suggestions stored
    (analysis_history.status = 'approved')
    ↓
??? FEEDBACK GAP: Nothing acts on approved suggestions
```

#### Key Code Components:

**1. Task Completion Trigger** (`/api/tasks/[id]/complete/route.ts:57`):
```typescript
onTaskComplete(id).catch(err => 
  console.error('Failed to trigger analysis:', err)
)
```

**2. Job Scheduling** (`lib/jobs/background-jobs.ts:168-203`):
```typescript
export async function onTaskComplete(taskId: string): Promise<void> {
  // 1. Create analyze_task job
  await createJob('analyze_task', { task_id: taskId })
  
  // 2. Every 5 completed tasks: detect patterns
  if (count && count % 5 === 0) {
    await createJob('detect_patterns', { project_id: task.project_id })
  }
  
  // 3. Every 10 pending analyses: supervisor review
  if (analysisCount && analysisCount >= 10) {
    await createJob('review_suggestions', { project_id: task.project_id })
  }
}
```

**3. Job Processing** (`lib/jobs/background-jobs.ts:34-141`):
- Fetch job from `background_jobs` table
- Execute based on job.type
- Update job status (completed/failed/retrying)
- Exponential backoff retry (2^attempts minutes)

**4. Analysis Agents**:

**Product Improvement Agent** (`lib/ai/product-improvement-agent.ts`):
- Analyzes individual task completion
- Generates suggestions with categories:
  - code_quality, performance, security, ux, process
- Each suggestion has: impact, effort, priority_score

**Pattern Detection Agent** (`lib/ai/product-improvement-agent.ts:121-224`):
- Analyzes 20 recent completed tasks
- Identifies recurring patterns
- Generates systemic improvement suggestions

#### Analysis Status Lifecycle:

```
pending → reviewed → approved/rejected/needs_review → (nothing happens)
                                    ↓
                    stored in analysis_history table
                    
⚠️ GAP: No automation to convert approved suggestions into tasks
```

#### Database Recording:

```sql
CREATE TABLE analysis_history (
  id UUID,
  analyzer_agent_id UUID,          -- System agent (null)
  task_id UUID,                     -- Original task analyzed
  project_id UUID,                  -- Project context
  analysis_type TEXT,               -- task_completion | pattern_detection
  findings JSONB,                   -- AI findings
  suggestions JSONB,                -- Improvement ideas
  priority_score INTEGER,           -- 0-10 importance
  status TEXT,                      -- pending→reviewed→approved
  reviewed_by_agent_id UUID,        -- Supervisor review
  reviewed_at TIMESTAMPTZ,
  metadata JSONB                    -- supervisor_review, reasoning
)
```

### Feedback Loop Strengths:
✅ Automatic analysis on task completion
✅ Pattern detection across tasks
✅ Supervisor review for prioritization
✅ Historical tracking of suggestions
✅ Async job queue prevents blocking

### Feedback Loop Gaps:
❌ No automation to implement approved suggestions
❌ No feedback to agents about their performance
❌ No loop closure (suggestions → new tasks)
❌ No learning/adaptation of assignment logic
❌ No human-in-the-loop for high-impact suggestions

---

## 5. TASK HIERARCHY

### Current Implementation: **Flat with Dependencies Only**

#### Database Structure:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID,
  title TEXT,
  type TEXT,                        -- feature|bugfix|refactor|test|docs|analysis|review
  status TEXT,                      -- pending|assigned|in_progress|completed|failed|cancelled
  assigned_agent_id UUID,
  dependencies UUID[],              -- ← ONLY hierarchy support
  required_capabilities TEXT[],
  input_data JSONB,
  output_data JSONB,
  ...
)
```

#### What Exists:

1. **Linear Dependencies Only**:
   - Task B depends on Task A completing
   - No parent/child relationship
   - No subtask decomposition
   - No task hierarchy levels

2. **Example**:
   ```
   Task A (Code Review) → must complete before
   Task B (Merge PR)
   ```

3. **Enforcement**:
   - Polling checks dependencies before assignment
   - No automatic subtask creation
   - No task rollup/aggregation

#### What's Missing:

```sql
-- NOT IMPLEMENTED:
parent_task_id UUID              -- Link to parent task
task_depth INTEGER               -- Hierarchy level
parent_status TEXT               -- Inherit parent's status?
rollup_status TEXT               -- Aggregate children status?
```

#### Implications:

- ❌ **No task decomposition**: Agents can't split work into subtasks
- ❌ **No hierarchical status**: Can't see "Feature X → Story Y → Task Z"
- ❌ **No automatic subtask creation**: Must be created manually
- ❌ **No nested workflows**: All tasks are siblings
- ✅ **Linear dependencies work**: Sequential task chains work fine

---

## 6. TASK STATE MACHINE

### Current Implementation: **Linear State Flow**

#### State Diagram:

```
pending
   ↓
assigned (when agent polls & claims task)
   ↓
in_progress (agent sends heartbeat update)
   ↓
[completed] ← primary path
  ↓
(Triggers analysis job)
   
OR

[failed] ← error path
  (no analysis triggered)
  (Task stays failed, can be retried manually)

OR

[cancelled] ← manual cancel
```

#### State Transitions:

| State | Trigger | New State | Location |
|-------|---------|-----------|----------|
| `pending` | Agent polls & claims | `assigned` | `/api/tasks/poll` |
| `assigned` | Agent starts work | `in_progress` | Agent updates (PATCH) |
| `in_progress` | Task finishes | `completed` | `/api/tasks/[id]/complete` |
| `in_progress` | Error occurs | `failed` | `/api/tasks/[id]/fail` |
| `pending/assigned` | Manual cancel | `cancelled` | PATCH (not automated) |
| `completed/failed` | Reset (optional) | `pending` | Manual PATCH |

#### State Control Points:

**Who controls transitions?**

1. **Agent controls**: 
   - Moves own task to `in_progress` (PATCH to task)
   - Marks as `completed` with output data
   - Marks as `failed` with error message

2. **Task poll controls**:
   - Moves `pending` → `assigned`
   - Sets `assigned_agent_id`
   - Sets `started_at` timestamp

3. **Manual/External controls**:
   - Cancel task
   - Reset failed task
   - Manual re-assignment

#### State Data Tracking:

```sql
status TEXT,                      -- Current state
started_at TIMESTAMPTZ,           -- When moved to assigned
completed_at TIMESTAMPTZ,         -- When finished (success or failure)
assigned_agent_id UUID,           -- Which agent has it
error_message TEXT,               -- If failed, why?
output_data JSONB,                -- If completed, what's the result?
```

#### Timestamps:
- `started_at`: Set when assigned (line 67 in poll route)
- `completed_at`: Set when completed OR failed (not distinguished in time)

#### Limitations:

❌ **No explicit in_progress transition**: Agents update status directly via PATCH
❌ **No timeout/watchdog**: Long-running tasks don't auto-fail
❌ **No retry mechanism**: Failed tasks must be manually retried
❌ **No state validation**: Can transition to invalid states
❌ **No state history**: No audit trail of state changes
❌ **No state rollback**: Can't cancel mid-execution

---

## ORCHESTRATION MATURITY ASSESSMENT

### What Exists Today:

✅ **Pull-based polling** - agents poll for work
✅ **Capability matching** - tasks matched to agent skills
✅ **Task dependencies** - linear task sequencing
✅ **Background job queue** - asynchronous processing
✅ **Intelligence analysis** - feedback on completions
✅ **Supervisor review** - prioritizes improvements
✅ **Basic state machine** - task lifecycle tracking
✅ **Multi-agent coexistence** - multiple agents can run

### What Doesn't Exist:

❌ **Task decomposition** - agents can't break work into subtasks
❌ **Supervisor task assignment** - no central orchestrator
❌ **Agent-to-agent communication** - no inter-agent messaging
❌ **Load balancing** - first capable agent wins (no optimization)
❌ **Task hierarchies** - no parent/child relationships
❌ **Autonomous task creation** - agents can't create work
❌ **Feedback closure** - approved suggestions don't become tasks
❌ **Adaptive assignment** - no learning from history
❌ **Agent collaboration** - no parallel subtask execution
❌ **Conflict resolution** - no multi-agent bid/negotiation

---

## WHAT NEEDS TO BE BUILT FOR TRUE MULTI-AGENT ORCHESTRATION

### Tier 1: Essential (Build First)

#### 1. **Supervisor Task Assignment Agent**
```typescript
// NEW: Central orchestrator
interface SupervisorAssignment {
  task_id: string
  selected_agent_id: string
  confidence_score: number
  reasoning: string
  estimated_duration: number
}

// Instead of agents polling:
// Agent says: "I'm ready, what should I do?"
// Supervisor decides: "You should do Task #123 (high confidence)"
```

**Benefits**:
- Load balancing across agents
- Optimal task selection vs first-available
- Can consider agent history/performance
- Can reject tasks if all agents busy

#### 2. **Task Decomposition Support**
```sql
ALTER TABLE tasks ADD COLUMN parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN task_depth INTEGER DEFAULT 0;
-- Enables: Feature → Epic → User Story → Task hierarchy
```

**Features needed**:
- Agents can call: POST /api/tasks with parent_task_id
- Supervisor coordinates subtask execution
- Parent task waits for ALL children to complete
- Status rollup: parent = complete only if all children = complete

#### 3. **Agent Collaboration Messaging**
```typescript
// NEW TABLE: agent_messages
CREATE TABLE agent_messages (
  id UUID,
  from_agent_id UUID,
  to_agent_id UUID,
  task_id UUID,
  message_type TEXT,  -- request_help | share_result | escalate
  payload JSONB,
  created_at TIMESTAMPTZ
)

// Allows agents to:
- Request help from specialist agents
- Share intermediate results
- Escalate to human
- Negotiate task ownership
```

#### 4. **Feedback Loop Closure**
```typescript
// When analysis approved, trigger:
export async function implementApprovedSuggestion(
  analysisId: string,
  suggestion: SuggestionDetail
): Promise<Task> {
  // 1. Convert suggestion to task
  // 2. Create task with:
  //    - title: suggestion.title
  //    - description: suggestion.description
  //    - type: 'improvement' or categorized
  //    - priority: analysis.priority_score
  //    - linked_analysis_id: for tracing
  // 3. Optional: auto-assign to analyzer agent
  // 4. Return new task
}
```

### Tier 2: Enhancement (Build Second)

#### 5. **Supervisor Performance Feedback**
```typescript
// After task completion, supervisor analyzes:
- Did assigned agent perform well?
- How long did it take vs estimated?
- Quality of output?
- Should we reassign to different agent?

// Update agent profile:
interface AgentPerformance {
  agent_id: string
  tasks_completed: number
  avg_quality_score: number
  avg_duration: number
  success_rate: number
  specialties: string[]  // Tasks it excels at
}
```

#### 6. **Intelligent Task Routing**
```typescript
// Instead of "first agent capable":
async function selectBestAgent(task: Task): Promise<Agent> {
  const candidates = agents.filter(a =>
    hasAllCapabilities(a, task.required_capabilities)
  )
  
  // Score each candidate:
  // - Performance history
  // - Current load
  // - Specialization match
  // - Success rate on similar tasks
  
  return candidates.sort((a, b) =>
    scoreAgent(b, task) - scoreAgent(a, task)
  )[0]
}
```

#### 7. **Multi-Level Supervisors**
```
Team Lead (Supervisor Level 1)
  → Assigns to individual contributor agents
  ↓
Project Lead (Supervisor Level 2)
  → Reviews Team Lead decisions
  → Escalates high-impact work
  ↓
Steering Committee (Supervisor Level 3)
  → Strategic decisions
  → Resource allocation
```

#### 8. **Adaptive Learning System**
```typescript
// Track what works:
interface ORMSuggestion {
  task_type: string
  agent_type: string
  success_rate: number
}

// Over time, improve assignment:
// "Backend tasks + Backend Agent = 92% success"
// "Frontend tasks + Backend Agent = 34% success"
// → Route accordingly
```

### Tier 3: Advanced (Build Third)

#### 9. **Dynamic Task Adaptation**
```typescript
// During execution, if task is harder than expected:
agent.canAdaptTask({
  task_id: string
  complexity_adjustment: number  // Scale up/down
  request_help: boolean
  new_estimated_time: number
})
```

#### 10. **Real-Time Monitoring & Auto-Recovery**
```typescript
// Supervisor monitors in real-time:
- Which agents are idle vs overloaded
- Which tasks are delayed
- Which have high error rates

// Auto-recovery actions:
- Reassign stalled tasks
- Request SOS help from specialists
- Rollback and retry failed tasks
- Escalate to human
```

#### 11. **Consensus-Based Important Decisions**
```typescript
// For high-priority/risky tasks:
// Request analysis from multiple agents
// Have supervisor aggregate opinions
// Make decision based on consensus

interface ConsensusDecision {
  task_id: string
  required_agents: AgentType[]
  votes: { agent_id: string, decision: string }[]
  consensus: string
}
```

---

## RECOMMENDED IMPLEMENTATION ROADMAP

### Phase 1: Supervisor Orchestration (2-3 weeks)
1. Create Supervisor Task Assignment Agent
2. Add supervisor decision logging
3. Implement agent capacity tracking
4. Add agent performance metrics

### Phase 2: Task Hierarchy (1-2 weeks)
1. Add parent_task_id and depth to tasks table
2. Create subtask management API
3. Implement status rollup logic
4. Build hierarchy visualization

### Phase 3: Agent Communication (1-2 weeks)
1. Build agent messaging system
2. Implement help requests
3. Add escalation patterns
4. Create collaboration workflows

### Phase 4: Feedback Closure (1 week)
1. Implement suggestion → task conversion
2. Auto-assign improvement tasks
3. Build implementation tracking
4. Create feedback dashboard

### Phase 5: Intelligence & Learning (ongoing)
1. Track agent performance metrics
2. Build routing optimization
3. Implement adaptive assignment
4. Create learning curves per agent

---

## FILES & CODE LOCATIONS REFERENCE

### Core Orchestration Files:

| File | Purpose | Status |
|------|---------|--------|
| `/app/api/tasks/poll/route.ts` | Task assignment logic | ✅ Exists |
| `/app/api/tasks/[id]/complete/route.ts` | Task completion, triggers analysis | ✅ Exists |
| `/lib/jobs/background-jobs.ts` | Job scheduling & execution | ✅ Exists |
| `/lib/ai/supervisor-agent.ts` | Supervisor review logic | ✅ Exists |
| `/lib/ai/product-improvement-agent.ts` | Analysis agents | ✅ Exists |
| `/types/index.ts` | Data structures | ✅ Exists |

### Database Tables:

| Table | Purpose | Has Hierarchy? |
|-------|---------|---|
| `tasks` | Task metadata | ❌ Only dependencies |
| `agents` | Agent registry | ✅ |
| `background_jobs` | Async queue | ✅ |
| `analysis_history` | Feedback records | ✅ |
| `task_logs` | Execution logs | ✅ |

---

## SUMMARY

Your system has **excellent foundational layers** but lacks **central orchestration**. 

**Current Model**: Peer agents + intelligence feedback
**Needed Model**: Supervisor-coordinated hierarchy with task decomposition

The feedback loop exists (tasks → analysis → suggestions) but **lacks closure** (suggestions don't become tasks). No agent-to-agent coordination or task decomposition yet.

The architecture is **ready to add orchestration** - just needs new supervisor logic and task hierarchy tables.
