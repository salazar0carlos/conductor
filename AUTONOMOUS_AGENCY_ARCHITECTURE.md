# Conductor: Autonomous Agency Platform Architecture

## Vision
An autonomous software development agency where each project has its own dedicated team of AI agents working continuously to build, maintain, and improve applications.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOU (CEO)                                │
│                    Conductor Dashboard                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
   │Project 1│    │Project 2│   │Project 3│
   │E-commerce│   │Todo App │   │  Blog   │
   └────┬────┘    └────┬────┘   └────┬────┘
        │              │              │
   ┌────▼──────────────▼──────────────▼────┐
   │     Dedicated Agent Teams              │
   │  (11 specialists + supervisor + PM)    │
   └────────────────────────────────────────┘
```

## Core Components

### 1. Project Management Layer
**What:** Each project is an isolated workspace
**Has:**
- Unique GitHub repository
- Dedicated Supabase database
- Own deployment pipeline
- Dedicated agent team (11 agents)
- Project supervisor
- Product improvement manager

**Database Schema:**
```sql
projects (
  id,
  name,
  github_repo,
  supabase_project_id,
  deployment_url,
  team_status (spawning|active|paused|archived),
  created_at
)
```

### 2. Agent Worker System
**What:** Actual processes that execute tasks using Claude API

**Agent Worker Process:**
```javascript
class AgentWorker {
  - projectId: UUID
  - agentId: UUID (specific to this project)
  - agentType: 'backend_architect' | 'frontend_architect' | etc.
  - capabilities: string[]
  - githubRepo: string
  - supabaseConnection: string

  lifecycle:
    1. Start polling for tasks (specific to this project)
    2. Get assigned task from Conductor API
    3. Use Claude API with agent personality/expertise
    4. Execute work (write code, run tests, etc.)
    5. Commit to GitHub
    6. Report completion to Conductor
    7. Loop back to step 1
}
```

**Worker Types:**
- **Execution Workers**: Do the actual coding/building
- **Review Workers**: Review code, provide feedback
- **Monitoring Workers**: Watch app health, suggest improvements

### 3. Agent Spawning System
**What:** Automatically creates agent teams when project is created

**Flow:**
```
User creates Project "E-commerce Store"
    ↓
Conductor API: POST /api/projects
    ↓
System spawns:
  ├─ 1 Backend Architect (agent worker process)
  ├─ 1 Frontend Architect
  ├─ 1 System Architect
  ├─ 1 Security Engineer
  ├─ 1 Performance Engineer
  ├─ 1 Refactoring Expert
  ├─ 1 Requirements Analyst
  ├─ 1 Technical Writer
  ├─ 1 Deep Research Agent
  ├─ 1 Learning Guide
  ├─ 1 Tech Stack Researcher
  ├─ 1 Supervisor (orchestrates the team)
  └─ 1 Product Manager (continuous improvement)
    ↓
Each agent starts polling for tasks assigned to this project
```

**Database Schema:**
```sql
-- Existing agents table, but scoped to projects
agents (
  id,
  project_id,  -- NEW: Links agent to specific project
  name,
  type,
  capabilities,
  status (spawning|active|idle|stopped),
  worker_process_id,  -- NEW: PID or container ID
  last_heartbeat_at,
  created_at
)
```

### 4. Worker Lifecycle Management
**What:** Start, stop, monitor, and restart agent workers

**Implementation Options:**

**Option A: Node.js Child Processes**
```javascript
// Simple: Run workers as child processes
const { spawn } = require('child_process');

function startAgentWorker(projectId, agentType) {
  const worker = spawn('node', [
    'workers/agent-worker.js',
    '--project', projectId,
    '--type', agentType
  ]);

  // Track worker
  workers.set(worker.pid, { projectId, agentType, worker });

  return worker.pid;
}
```

**Option B: Docker Containers (Scalable)**
```bash
# Each agent runs in its own container
docker run -d \
  -e PROJECT_ID=abc123 \
  -e AGENT_TYPE=backend_architect \
  conductor-agent-worker
```

**Option C: Serverless Workers (Cloud)**
```javascript
// Deploy workers to cloud (Railway, Render, etc.)
// More expensive but infinitely scalable
```

**Recommendation:** Start with Option A (Node processes), migrate to B (Docker) for scale.

### 5. Task Assignment & Execution
**What:** Intelligent routing of work to the right agent on the right project

**Flow:**
```
User: "Add authentication to my e-commerce store"
    ↓
Conductor creates task:
  - project_id: e-commerce-store-id
  - title: "Add authentication"
  - type: feature
    ↓
Orchestrator decomposes into subtasks:
  ├─ "Design auth schema" → Backend Architect (e-commerce team)
  ├─ "Build auth API" → Backend Architect (e-commerce team)
  ├─ "Create login UI" → Frontend Architect (e-commerce team)
  └─ "Security review" → Security Engineer (e-commerce team)
    ↓
Backend Architect worker (e-commerce team) polls:
  GET /api/tasks/poll
  { project_id: "e-commerce-store-id", agent_id: "backend-arch-123" }
    ↓
Gets: "Design auth schema"
    ↓
Worker executes:
  1. Calls Claude API with context:
     - Agent type: Backend Architect
     - Project: E-commerce Store
     - Task: Design auth schema
     - Existing code context from GitHub
  2. Claude generates SQL schema
  3. Worker creates migration file
  4. Worker commits to e-commerce repo
  5. Worker reports completion
```

### 6. Continuous Operation Mode
**What:** Agents don't stop after initial build - they continuously improve

**Continuous Tasks:**

**1. Monitoring & Health Checks**
```javascript
// Monitoring Agent runs every hour
setInterval(async () => {
  const health = await checkAppHealth(projectId);

  if (health.errors.length > 0) {
    // Auto-create bug fix tasks
    await createTask({
      project_id: projectId,
      type: 'bugfix',
      title: `Fix: ${health.errors[0].message}`,
      priority: 10
    });
  }
}, 60 * 60 * 1000);
```

**2. Performance Optimization**
```javascript
// Performance Agent analyzes weekly
setInterval(async () => {
  const metrics = await getPerformanceMetrics(projectId);

  if (metrics.lighthouse < 90) {
    await createTask({
      type: 'performance',
      title: 'Optimize performance - Lighthouse score dropped'
    });
  }
}, 7 * 24 * 60 * 60 * 1000);
```

**3. Security Audits**
```javascript
// Security Agent scans daily
setInterval(async () => {
  const vulns = await scanDependencies(projectId);

  if (vulns.critical.length > 0) {
    await createTask({
      type: 'security',
      title: 'Critical security vulnerabilities detected',
      priority: 10
    });
  }
}, 24 * 60 * 60 * 1000);
```

**4. Feature Suggestions**
```javascript
// Product Manager analyzes user feedback, usage patterns
// Generates improvement suggestions automatically
// You approve/reject, then agents implement
```

### 7. Multi-Project Dashboard
**What:** CEO view to oversee all projects and their teams

**Dashboard Shows:**
```
┌─────────────────────────────────────────────────────┐
│  CONDUCTOR AGENCY - CEO DASHBOARD                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Active Projects: 3                                  │
│  Total Agents: 39 (13 per project)                  │
│  Tasks Completed Today: 47                           │
│  Apps Deployed: 3                                    │
│                                                      │
├─────────────────────────────────────────────────────┤
│  PROJECT 1: E-commerce Store                        │
│  Status: ● Active                                    │
│  Team: 13 agents (11 working, 2 idle)              │
│  Tasks: 5 in progress, 120 completed               │
│  Health: ✅ 98% uptime, Lighthouse 95              │
│  Recent: "Added payment integration" (2h ago)       │
│  [View Details] [Pause Team] [Create Task]         │
├─────────────────────────────────────────────────────┤
│  PROJECT 2: SaaS Todo App                           │
│  Status: ● Active                                    │
│  Team: 13 agents (8 working, 5 idle)               │
│  Tasks: 3 in progress, 89 completed                │
│  Health: ✅ 99% uptime, Lighthouse 93              │
│  Recent: "Optimized database queries" (4h ago)      │
│  [View Details] [Pause Team] [Create Task]         │
└─────────────────────────────────────────────────────┘
```

### 8. Resource Management
**What:** Don't overwhelm Claude API or your infrastructure

**Rate Limiting:**
```javascript
// Max concurrent Claude API calls
const MAX_CONCURRENT_TASKS = 10;

// Queue system
class TaskQueue {
  queue: Task[] = [];
  processing: number = 0;

  async processNext() {
    if (this.processing >= MAX_CONCURRENT_TASKS) return;
    if (this.queue.length === 0) return;

    const task = this.queue.shift();
    this.processing++;

    await executeTask(task);

    this.processing--;
    this.processNext();
  }
}
```

**Cost Management:**
```javascript
// Track API usage per project
project_api_usage (
  project_id,
  tokens_used_today,
  cost_today,
  monthly_budget,
  auto_pause_if_over_budget
)
```

## Implementation Phases

### Phase 1: Core Agent Worker System (Week 1-2)
- [ ] Create agent worker base class
- [ ] Implement Claude API integration
- [ ] Build task polling mechanism
- [ ] Add GitHub commit capability
- [ ] Test with 1 agent type on 1 project

### Phase 2: Project-Scoped Agents (Week 3)
- [ ] Update agents table with project_id
- [ ] Create agent spawning system
- [ ] Build worker lifecycle management
- [ ] Test spawning full team for 1 project

### Phase 3: Multi-Project Support (Week 4)
- [ ] Enable multiple projects
- [ ] Implement resource allocation
- [ ] Build multi-project dashboard
- [ ] Add project pause/resume

### Phase 4: Continuous Operation (Week 5-6)
- [ ] Add monitoring agents
- [ ] Implement scheduled tasks
- [ ] Build auto-healing capabilities
- [ ] Create feedback loop automation

### Phase 5: Scale & Polish (Week 7-8)
- [ ] Migrate to Docker containers
- [ ] Add advanced analytics
- [ ] Build cost management tools
- [ ] Performance optimization

## Technology Stack

**Backend:**
- Node.js worker processes
- Anthropic Claude API (for agent intelligence)
- Supabase (database, real-time)
- GitHub API (code management)

**Worker Management:**
- PM2 (process manager) or Docker
- Bull/BullMQ (job queue)
- Redis (task queue, caching)

**Frontend:**
- Next.js (existing)
- Real-time updates via Supabase subscriptions

**Deployment:**
- Workers: Railway, Render, or Docker containers
- App: Vercel (existing)
- Database: Supabase (existing)

## Cost Estimates

**Per Project (monthly):**
- Claude API: $50-200 (depends on activity)
- Worker hosting: $10-20 (Railway/Render)
- GitHub: Free (or $4 if private repos)
- Supabase: Free tier or $25

**Total per project:** ~$60-245/month

**For 10 projects:** ~$600-2450/month

## Next Steps

1. Build agent worker base class
2. Create first working agent (Backend Architect)
3. Test end-to-end on 1 project
4. Scale to full team
5. Add second project
6. Build dashboard

Ready to start building? 🚀
