# Task Orchestration - Architecture Diagrams & Data Flow

## Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONDUCTOR SYSTEM                            │
└─────────────────────────────────────────────────────────────────┘

AGENT LAYER (Pull-Based)
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Agent 1   │  │   Agent 2   │  │   Agent 3   │
│  (Backend)  │  │  (Frontend) │  │(Specialist) │
│ Caps: [api] │  │ Caps: [ui]  │  │ Caps: [qa]  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────┬───┴────────────┬───┘
                    │                │
                    v                v
        ┌──────────────────────────────────┐
        │   POST /api/tasks/poll           │
        │  (Poll for assigned tasks)       │
        │                                  │
        │  Matching Algorithm:             │
        │  1. Get ALL pending tasks        │
        │  2. Filter by capabilities[]    │
        │  3. Check dependencies OK?      │
        │  4. Return first match (priority DESC)
        │  5. Mark as 'assigned'          │
        └──────────────────┬───────────────┘
                           │
                           v
                  ┌─────────────────────┐
                  │ TASK STATE MACHINE  │
                  ├─────────────────────┤
                  │ pending → assigned  │
                  │ assigned → in_prog  │
                  │ in_prog → complete  │
                  │ in_prog → failed    │
                  └────────┬────────────┘
                           │
         ┌─────────────────┴──────────────────┐
         │                                    │
         v                                    v
    ┌──────────────┐              ┌──────────────────┐
    │  Complete    │              │  Failed          │
    │  Tasks       │              │  (stays failed)  │
    └──────┬───────┘              └──────────────────┘
           │
           v
    ┌──────────────────────────────────────┐
    │  onTaskComplete() hook               │
    │  (from /api/tasks/[id]/complete)    │
    └──────────┬───────────────────────────┘
               │
               v
    ┌──────────────────────────────────────┐
    │  INTELLIGENCE LAYER                  │
    │  (Async Background Jobs)             │
    ├──────────────────────────────────────┤
    │                                      │
    │  [1] Task Analysis Job               │
    │      (every task completion)         │
    │      → Product Improvement Agent    │
    │      → Finds suggestions            │
    │      → Creates analysis_history     │
    │      → status = 'pending'           │
    │                                      │
    │  [2] Pattern Detection Job           │
    │      (every 5 completions/project)  │
    │      → Pattern Detection Agent      │
    │      → Finds systemic issues        │
    │      → Creates analysis_history     │
    │                                      │
    │  [3] Supervisor Review Job           │
    │      (when ≥10 pending analyses)    │
    │      → Supervisor Agent             │
    │      → Reviews suggestions          │
    │      → Filters duplicates           │
    │      → Updates status to            │
    │        'approved/rejected/reviewed' │
    │                                      │
    └──────────────┬───────────────────────┘
                   │
                   v
        ┌──────────────────────────┐
        │  analysis_history table  │
        ├──────────────────────────┤
        │ - findings               │
        │ - suggestions[]          │
        │ - priority_score         │
        │ - status                 │
        │ - metadata               │
        │   {supervisor_review}    │
        └──────────┬───────────────┘
                   │
                   v
         ??? GAP: No closure
         Approved suggestions
         don't become tasks
```

## Task Polling Sequence Diagram

```
Agent                  /api/tasks/poll      Database
  │                          │                  │
  ├─ POST                    │                  │
  │  (agent_id,              │                  │
  │   capabilities=[])       │                  │
  ├──────────────────────────>                  │
  │                          │                  │
  │                          ├─ SELECT pending  │
  │                          │  WHERE status    │
  │                          │  = 'pending'    │
  │                          ├─────────────────>
  │                          │                  │
  │                          │<────────────────┤
  │                          │  [Task[], ...]   │
  │                          │                  │
  │                          ├─ FILTER by      │
  │                          │  capabilities   │
  │                          │                  │
  │                          ├─ FILTER by      │
  │                          │  dependencies   │
  │                          │  (all complete?)│
  │                          │                  │
  │                          ├─ SORT by        │
  │                          │  priority DESC  │
  │                          │                  │
  │                          ├─ UPDATE first   │
  │                          │  match:         │
  │                          │  status='assign'│
  │                          │  assigned_agent │
  │                          │  started_at     │
  │                          ├─────────────────>
  │                          │                  │
  │<────────────────────────┤                   │
  │  { task: {...} }         │                  │
  │  or { task: null }       │                  │
  │                          │                  │
```

## Task Completion & Analysis Flow

```
Agent completes task
         │
         v
    POST /api/tasks/[id]/complete
    { agent_id, output_data }
         │
         v
    ┌─────────────────────────┐
    │ Verify assignment       │
    │ Check status OK?        │
    │ Update task status      │
    │ Set completed_at        │
    │ Store output_data       │
    └──────┬──────────────────┘
           │
           v
    ┌─────────────────────────┐
    │ onTaskComplete()        │
    │ (async, non-blocking)   │
    └──────┬──────────────────┘
           │
           ├─> createJob('analyze_task')
           │   └─> Job: { type, payload, status: pending }
           │       Stored in background_jobs table
           │
           ├─> IF completed_tasks % 5 == 0
           │   └─> createJob('detect_patterns')
           │       └─> Analyze 20 recent tasks
           │
           └─> IF pending_analyses >= 10
               └─> createJob('review_suggestions')
                   └─> Supervisor review


Background Job Processor (via /api/jobs/process)
┌────────────────────────────────────────────────┐
│  Process pending/retrying jobs (max 10)        │
│                                                │
│  For each job:                                 │
│  1. Fetch job from DB                         │
│  2. Mark status = 'running'                   │
│  3. Execute based on job.type                 │
│     ├─ analyze_task                           │
│     │  └─ Call analyzeTaskCompletion()       │
│     │     └─ AI analysis                      │
│     │     └─ Store in analysis_history        │
│     ├─ detect_patterns                        │
│     │  └─ Call detectPatterns()               │
│     │     └─ AI pattern detection             │
│     │     └─ Store in analysis_history        │
│     └─ review_suggestions                     │
│        └─ Call reviewAndPrioritize()         │
│           └─ AI supervisor review             │
│           └─ Update analysis_history.status   │
│                                                │
│  4. On success: status = 'completed'          │
│  5. On error: status = 'retrying'             │
│     with exponential backoff (2^attempts)     │
│                                                │
└────────────────────────────────────────────────┘
                        │
                        v
            ┌───────────────────────┐
            │ analysis_history      │
            │ (Feedback Records)    │
            ├───────────────────────┤
            │ id                    │
            │ analyzer_agent_id     │
            │ task_id               │
            │ project_id            │
            │ analysis_type         │
            │ findings JSONB        │
            │ suggestions JSONB     │
            │ priority_score        │
            │ status                │
            │  pending              │
            │  → reviewed           │
            │  → approved/rejected  │
            │ reviewed_by_agent_id  │
            │ metadata:             │
            │  {supervisor_review}  │
            └───────────────────────┘
```

## Current Task Hierarchy (Flat with Dependencies)

```
WHAT EXISTS:

Task A (Code Review)
├─ status: completed
├─ output_data: { review_comments: [...] }
└─ (triggers analysis)

Task B (Merge PR)
├─ status: pending
├─ dependencies: [Task A ID]  ← Must wait for Task A
└─ (assigned only after Task A completes)

Task C (Deploy)
├─ status: pending
├─ dependencies: [Task B ID]
└─ Linear sequence: A → B → C


WHAT'S MISSING (Hierarchical Structure):

Feature: User Authentication
├─ Epic: Backend Login
│  ├─ Story: Email/Password Auth
│  │  ├─ Task: Design schema
│  │  ├─ Task: Implement login endpoint
│  │  └─ Task: Write tests
│  └─ Story: OAuth Integration
│     ├─ Task: Setup OAuth provider
│     └─ Task: Implement OAuth flow
└─ Epic: Frontend Login
   ├─ Story: Login UI
   │  └─ Task: Build login form
   └─ Story: Session Management
      └─ Task: Add session handling

(Each level waits for children to complete)
(Status rolls up: Feature complete only when all Epics done)
```

## What Needs To Be Built: Supervisor-Driven Architecture

```
FUTURE STATE (After implementing Tier 1):

┌──────────────────────────────────────────────┐
│          SUPERVISOR AGENT (NEW!)             │
│  "Intelligent Task Assignment & Orchestration"
│                                              │
│  - Tracks agent capacity & load              │
│  - Maintains agent performance metrics       │
│  - Makes optimal task assignments            │
│  - Considers:                                │
│    • Agent skills                            │
│    • Current workload                        │
│    • Historical performance                  │
│    • Task complexity                         │
│    • Estimated duration                      │
└──────────────────┬───────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │              │
        v                     v              v
    ┌─────────┐         ┌─────────┐    ┌──────────┐
    │ Agent 1 │         │ Agent 2 │    │ Agent 3  │
    │ (Load: │         │ (Load: │    │(Load:   │
    │  2/5)  │         │  4/5)  │    │  1/5)   │
    └─────────┘         └─────────┘    └──────────┘
        │                   │              │
        └───────────────────┼──────────────┘
                            │
                    ┌───────▼────────┐
                    │ Task Pool      │
                    │ (waiting for   │
                    │  assignment)   │
                    └────────────────┘


AGENTS NO LONGER POLL:
Instead:
┌────────────────────────────────────────────┐
│ Agent sends heartbeat:                     │
│ POST /api/agents/[id]/ready                │
│ { agent_id, current_load, capabilities }  │
│                                            │
│ Response from Supervisor:                  │
│ { task, confidence_score, reason }         │
│ or                                         │
│ { task: null, message: "Keep working" }   │
└────────────────────────────────────────────┘


TASK DECOMPOSITION (NEW!):

Parent Task: "Implement User Auth"
├─ Subtask: "Design DB Schema"
│  ├─ Assigned to: Agent 1 (Architect)
│  └─ Status: depends on parent being 'ready'
│
├─ Subtask: "Setup OAuth Provider"
│  ├─ Assigned to: Agent 2 (Ops)
│  └─ Status: depends on parent being 'ready'
│
└─ Subtask: "Build Login UI"
   ├─ Assigned to: Agent 3 (Frontend)
   └─ Status: depends on parent being 'ready'

Parent status = complete only when ALL subtasks = complete


FEEDBACK CLOSURE (NEW!):

Approved Suggestion (from intelligence layer)
    │
    v
Supervisor evaluates: "Should we implement this?"
    │
    ├─ YES: Create improvement task
    │       Assign appropriate agent
    │       Track in analysis_history.status = 'implemented'
    │
    └─ NO:  Mark as analyzed but rejected
            Record decision reasoning
```

## Agent Communication (Future Tier 3)

```
Multi-Agent Collaboration:

┌──────────────────────────────────────────────────┐
│  agent_messages Table (NEW!)                    │
├──────────────────────────────────────────────────┤
│ from_agent_id │ to_agent_id │ message_type      │
├───────────────┼─────────────┼──────────────────┤
│ Agent 1       │ Agent 2     │ request_help     │
│ Agent 2       │ Agent 1     │ share_result     │
│ Agent 3       │ Supervisor  │ escalate         │
│ Supervisor    │ Agent 1     │ reassign_task    │
└──────────────┬──────────────┴──────────────────┘
               │
        Message Types:
        • request_help: "I need assistance with X"
        • share_result: "Intermediate result: Y"
        • escalate: "This needs human review"
        • reassign_task: "Please take on Task Z"
        • coordination: "Task A depends on your Task B"
        • capacity: "I'm overloaded, request help"


Workflow Example:

Frontend Agent gets task: "Build Payment Form"
    │
    ├─ Starts work
    ├─ Encounters: "Need to integrate with payment gateway"
    │
    └─> Send message to Backend Agent:
        "request_help: Design payment API endpoint"
        
        Backend Agent receives request
        └─> Evaluates capability match
        └─> If capable: accept and create subtask
        └─> If busy: defer or reject
        
        Completes API
        └─> Send to Frontend Agent:
            "share_result: API endpoint ready at /api/payments"
            
        Frontend Agent receives result
        └─> Integrates payment API
        └─> Completes form task
```

## Performance Feedback System (Future Tier 2)

```
┌───────────────────────────────────────────────┐
│  agent_performance Table (NEW!)               │
├───────────────────────────────────────────────┤
│ agent_id                                      │
│ tasks_completed                               │
│ avg_quality_score (0-10)                      │
│ avg_duration_actual vs estimated              │
│ success_rate (%)                              │
│ specialties: [task_types they excel at]       │
│ problem_areas: [task_types they struggle]    │
│ learning_curve: how quickly they improved     │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┴──────────────┬────────────┐
    │                             │            │
    v                             v            v
 Affects             Triggers      Enables
 Assignment          Retraining    Adaptive
 Decisions           Programs      Strategies

Example:
Agent: Backend Architect
├─ Tasks Completed: 47
├─ Avg Quality: 8.9/10
├─ Success Rate: 94%
├─ Specialties: ["API design", "database", "architecture"]
├─ Problem Areas: ["UI/UX", "mobile"]
│
└─> Supervisor Decision:
    "Route API tasks → Backend Architect (high confidence)"
    "Route UI tasks → Frontend Agent (better match)"
    "Pair challenging tasks with mentorship"
```

## Current Database Schema (Relevant Tables)

```
┌──────────────────────────────────────┐
│            TASKS TABLE               │
├──────────────────────────────────────┤
│ id                                   │
│ project_id                           │
│ title                                │
│ type (feature|bugfix|...)           │
│ status (pending|assigned|...) ◄──┐  │
│ priority (0-10)                  │  │
│ assigned_agent_id          ────────┼──┤
│ dependencies [] (task IDs) ────────┤  │
│ required_capabilities []           │  │
│ input_data JSONB                   │  │
│ output_data JSONB                  │  │
│ error_message                      │  │
│ started_at                         │  │
│ completed_at                       │  │
│ metadata JSONB                     │  │
│ created_at, updated_at             │  │
│                                    │  │
│ ❌ MISSING:                       │  │
│ parent_task_id (hierarchy)        │  │
│ task_depth (level)                 │  │
│ supervisor_assignment (notes)      │  │
│ estimated_duration_sec             │  │
│ linked_analysis_id                 │  │
└──────────────────────────────────────┘
        │                  ▲
        │                  │
        v                  │
┌──────────────────────────┼──────────────┐
│       AGENTS TABLE       │              │
├──────────────────────────┼──────────────┤
│ id                       │              │
│ name                     │              │
│ type                     │              │
│ capabilities []          │              │
│ status (idle|busy|...)   │              │
│ last_heartbeat           │              │
│ config JSONB             │              │
│ metadata JSONB           │              │
│                          │              │
│ ❌ MISSING:             │              │
│ current_load (tasks)    │              │
│ performance_score       │              │
│ specialties             │              │
│ max_concurrent_tasks    │              │
└──────────────────────────┼──────────────┘
                           │
        ┌──────────────────┘
        │
        v
┌──────────────────────────────────────┐
│   ANALYSIS_HISTORY TABLE             │
├──────────────────────────────────────┤
│ id                                   │
│ analyzer_agent_id                    │
│ task_id                              │
│ project_id                           │
│ analysis_type                        │
│ findings JSONB                       │
│ suggestions JSONB                    │
│ priority_score                       │
│ status (pending|reviewed|approved)   │
│ reviewed_by_agent_id                 │
│ metadata JSONB                       │
│ {supervisor_review: {...}}           │
└──────────────────────────────────────┘
        ▲
        │
        │
┌──────┴──────────────────────────────┐
│  BACKGROUND_JOBS TABLE              │
├─────────────────────────────────────┤
│ id                                  │
│ type (analyze|detect|review)        │
│ status (pending|running|completed)  │
│ payload JSONB                       │
│ result JSONB                        │
│ attempts, max_attempts              │
│ scheduled_at                        │
│ started_at, completed_at            │
│ next_retry_at                       │
└─────────────────────────────────────┘
```

---

## Summary: Current vs. Future State

```
╔═══════════════════════════════════════════════════════════════════╗
║                    CURRENT STATE (TODAY)                         ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  Agents    ┌─────────────────────────────────────────┐            ║
║   ↓        │  Task Pool                              │            ║
║  Poll      │  (pending tasks)                        │            ║
║   ↓        └────────────┬────────────────────────────┘            ║
║  Match                   │                                        ║
║   ↓                      v                                        ║
║  Assign  ◄── Database pulls all, returns first match              ║
║   ↓                                                               ║
║  Work      ┌──────────────────────────────────────┐               ║
║   ↓        │  Complete → Intelligence Analysis   │               ║
║  Complete  │                                      │               ║
║   ↓        │  ✓ Product analysis                │               ║
║  Analyze   │  ✓ Pattern detection               │               ║
║            │  ✓ Supervisor review               │               ║
║            │                                      │               ║
║            │  ✗ No closure                       │               ║
║            │  (suggestions don't become tasks)   │               ║
║            └──────────────────────────────────────┘               ║
║                                                                   ║
║  Key Features:                                                    ║
║  ✓ Basic multi-agent coexistence                                 ║
║  ✓ Capability-based matching                                     ║
║  ✓ Task dependencies (sequential)                                ║
║  ✓ Intelligence feedback                                         ║
║  ✗ No supervisor orchestration                                   ║
║  ✗ No task hierarchies                                           ║
║  ✗ No agent-to-agent communication                               ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                   FUTURE STATE (ROADMAP)                          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ┌──────────────────────────────────────────┐                    ║
║  │    SUPERVISOR AGENT (Intelligent)        │                    ║
║  │    - Load balancing                      │                    ║
║  │    - Performance tracking                │                    ║
║  │    - Optimal assignment                  │                    ║
║  │    - Hierarchical decomposition          │                    ║
║  │    - Escalation handling                 │                    ║
║  └─────────────┬──────────────────────────┘                      ║
║                │                                                  ║
║    ┌───────────┼──────────────────────────┐                      ║
║    │           │                          │                      ║
║    v           v                          v                      ║
║  ┌─────┐    ┌─────┐    ┌─────┐  ┌──────────────┐                 ║
║  │Ag 1 │    │Ag 2 │    │Ag 3 │  │Task Pool     │                 ║
║  │Assign◄───┤Ready├────┤Assigned(hierarchical)│                 ║
║  │Work │    │     │    │Done │  └──────────────┘                 ║
║  │Done │    │     │    │     │                                   ║
║  └────┬┘    └─────┘    └─────┘                                   ║
║       │                                                           ║
║       v                                                           ║
║  ┌────────────────────────────────────────┐                      ║
║  │  Intelligence Analysis                 │                      ║
║  │  +                                      │                      ║
║  │  Feedback Loop Closure                 │                      ║
║  │                                         │                      ║
║  │  ✓ All previous                         │                      ║
║  │  ✓ Supervisor assignment               │                      ║
║  │  ✓ Task hierarchies                    │                      ║
║  │  ✓ Agent collaboration                 │                      ║
║  │  ✓ Suggestions → tasks                 │                      ║
║  │  ✓ Performance learning                │                      ║
║  │  ✓ Escalation handling                 │                      ║
║  └────────────────────────────────────────┘                      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

