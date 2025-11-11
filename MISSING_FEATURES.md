# Missing Features & Non-Functional UI Elements

This document outlines all the UI elements and features that are currently scaffolded but not yet implemented.

## 🔐 Authentication System

**Status:** ❌ Not Implemented

**What's Missing:**
- No user authentication system (sign in / sign up)
- No user session management
- No protected routes (anyone can access all pages)
- No user profile or settings

**What Exists:**
- ✅ API key authentication for agents (via `/api/agents/api-keys`)
- ✅ Auth middleware for API routes (`lib/auth/middleware.ts`)
- ✅ Rate limiting system

**Recommendation:**
- Implement Supabase Auth for user login
- Add sign in / sign up pages
- Protect dashboard routes (require user login)
- Add user context/provider

---

## 🚫 Non-Functional Buttons

### Projects Page (`/projects`)

**Button:** "New Project"
- **Status:** ❌ No click handler
- **Expected:** Opens modal or navigates to form to create new project
- **API Endpoint:** ✅ Exists at `POST /api/projects`

**Button:** "Create Your First Project" (empty state)
- **Status:** ❌ No click handler
- **Expected:** Same as "New Project"

### Tasks Page (`/tasks`)

**Button:** "New Task"
- **Status:** ❌ No click handler
- **Expected:** Opens modal or navigates to form to create new task
- **API Endpoint:** ✅ Exists at `POST /api/tasks`

### Agents Page (`/agents`)

**Button:** "Register Agent"
- **Status:** ❌ No click handler
- **Expected:** Opens modal or navigates to form to register new agent
- **API Endpoint:** ✅ Exists at `POST /api/agents`

---

## 📝 Missing Forms & Modals

All create/edit operations are missing UI forms:

### 1. Create Project Form
**Needs:**
- Project name (required)
- Description (optional)
- GitHub repository URL (optional)
- GitHub branch (optional)
- Status selector (active/paused/archived)

**API Ready:** ✅ `POST /api/projects`

**Validation Schema:** ✅ Exists in `lib/validation/schemas.ts`

### 2. Create Task Form
**Needs:**
- Project selector (dropdown)
- Task title (required)
- Description (optional)
- Type selector (feature/bugfix/refactor/test/docs/analysis/review)
- Priority (0-10 slider)
- Required capabilities (multi-select tags)
- Dependencies (multi-select other tasks)
- Input data (JSON editor)

**API Ready:** ✅ `POST /api/tasks`

**Validation Schema:** ✅ Exists in `lib/validation/schemas.ts`

### 3. Register Agent Form
**Needs:**
- Agent name (required)
- Type selector (llm/tool/human/supervisor/analyzer)
- Capabilities (multi-input tags)
- Configuration (JSON editor)
- Status selector (active/idle/busy/offline/error)

**API Ready:** ✅ `POST /api/agents`

**Validation Schema:** ✅ Exists in `lib/validation/schemas.ts`

### 4. Edit Forms
**Missing:**
- Edit project form
- Edit task form
- Edit agent form

**API Ready:**
- ✅ `PUT /api/projects/[id]`
- ✅ `PUT /api/tasks/[id]`
- ✅ `PUT /api/agents/[id]`

---

## 🖱️ Missing Click Interactions

### Project Cards
**Current:** Display only
**Missing:**
- Click to view project details
- View associated tasks
- View GitHub integration status
- Edit project button
- Archive/Delete project button
- Connect GitHub button (if not connected)

### Task Cards
**Current:** Display only
**Missing:**
- Click to view task details
- View task logs (`GET /api/tasks/[id]/logs` ✅ exists)
- View assigned agent
- View task dependencies
- Manual task assignment UI
- Cancel task button
- Retry failed task button

### Agent Cards
**Current:** Display only
**Missing:**
- Click to view agent details
- View agent's task history
- Generate API key button (UI for existing endpoint)
- View API keys for agent
- Edit agent configuration
- Deactivate/reactivate agent

### Analysis Cards
**Current:** Display only, suggestions shown as raw JSON
**Missing:**
- Click to view full analysis details
- Better formatting for suggestions
- Approve/reject suggestion buttons
- Mark as implemented button
- Link to related task

---

## 📄 Missing Detail Pages

### Project Detail Page (`/projects/[id]`)
**Status:** ❌ Does not exist

**Should Include:**
- Project overview (name, description, status)
- GitHub integration info (repo, branch, last sync)
- Associated tasks list (filtered by this project)
- Project settings/edit
- Delete project option

### Task Detail Page (`/tasks/[id]`)
**Status:** ❌ Does not exist

**Should Include:**
- Task details (title, description, type, priority)
- Status timeline
- Assigned agent info
- Task logs (using existing `GET /api/tasks/[id]/logs`)
- Input/output data
- Dependencies graph
- Manual assignment controls (for humans)
- Complete/fail buttons (for testing)

### Agent Detail Page (`/agents/[id]`)
**Status:** ❌ Does not exist

**Should Include:**
- Agent info (name, type, capabilities, status)
- Heartbeat history
- Task history (completed tasks)
- API keys management (generate, revoke, view)
- Agent configuration
- Edit agent settings

### Analysis Detail Page (`/intelligence/[id]`)
**Status:** ❌ Does not exist

**Should Include:**
- Full analysis findings (formatted nicely)
- Suggestions list with categories
- Related task link
- Priority score explanation
- Approval/review controls
- Implementation tracking

---

## 🔍 Missing Search & Filter Features

### Projects List
- Search by name
- Filter by status (active/paused/archived)
- Sort by created date, name, etc.

### Tasks List
- Search by title
- Filter by status (pending/in_progress/completed/failed)
- Filter by type (feature/bugfix/etc.)
- Filter by project
- Filter by priority
- Sort by priority, created date, etc.

### Agents List
- Search by name
- Filter by type (llm/tool/etc.)
- Filter by status (active/idle/busy/offline/error)
- Filter by capabilities
- Sort by name, last heartbeat, etc.

### Intelligence List
- Filter by status (pending/reviewed/approved/rejected)
- Filter by type (task_completion/pattern_detection/etc.)
- Filter by priority score
- Sort by priority, created date, etc.

---

## 🔄 Missing Real-Time UI Features

**What Exists:**
- ✅ Real-time subscriptions (`lib/realtime/subscriptions.ts`)
- ✅ React hooks (`hooks/use-realtime-subscription.ts`)
- ✅ Auto-refresh on dashboard (every 10s)
- ✅ Auto-refresh on agents (every 5s)

**What's Missing:**
- Projects list doesn't use real-time (needs to integrate subscription)
- Tasks list doesn't use real-time (needs to integrate subscription)
- Intelligence list doesn't use real-time (needs to integrate subscription)
- No toast notifications when updates occur
- No "new item" highlight animation

---

## 🔗 Missing GitHub Integration UI

**What Exists:**
- ✅ OAuth callback endpoint (`/api/github/oauth/callback`)
- ✅ Create PR endpoint (`/api/github/pr/create`)
- ✅ Webhook processor (`/api/webhooks/github`)

**What's Missing:**
- "Connect GitHub" button on project cards
- GitHub OAuth flow initiation (redirect to GitHub)
- Display GitHub connection status
- "Create PR" button on completed tasks
- Display PR status/link on tasks
- GitHub webhook configuration instructions
- Repository selector (fetch user's repos from GitHub)

---

## 🎯 Missing Intelligence Layer UI

**What Exists:**
- ✅ Background job processor (`/api/jobs/process`)
- ✅ AI analysis runs automatically on task completion
- ✅ Pattern detection every 5 tasks
- ✅ Supervisor review every 10 analyses

**What's Missing:**
- Manual trigger buttons (analyze this task now)
- Job queue visualization (show pending/running/failed jobs)
- View job details/errors
- Retry failed jobs button
- Background job monitoring dashboard
- Analysis suggestions formatted nicely (currently raw JSON)
- Approval workflow UI
- Implementation tracking

---

## 📊 Missing Dashboard Features

**What Exists:**
- ✅ Stats overview (projects, tasks, agents, analysis counts)
- ✅ Auto-refresh every 10s

**What's Missing:**
- Recent activity feed
- Task completion chart (graph over time)
- Agent utilization chart
- Failed tasks alerts/warnings
- Quick actions (create task, register agent)
- System health status
- Background jobs status

---

## ⚙️ Missing Settings & Configuration

**What's Missing:**
- User settings page
- System configuration page
- API key management for users
- Webhook configuration UI
- Rate limit configuration UI
- Email notifications settings
- Slack/Discord integration settings

---

## 📱 Missing Mobile Responsiveness

**Current State:**
- Basic Tailwind responsive classes (`md:grid-cols-2`, etc.)

**Issues:**
- Mobile nav needs hamburger menu
- Tables/lists need better mobile layout
- Forms need mobile-optimized inputs
- Modals need mobile-appropriate sizing

---

## Summary of Implementation Priority

### High Priority (Core Functionality)
1. ✅ User authentication (Supabase Auth)
2. ✅ Create Project modal/form
3. ✅ Create Task modal/form
4. ✅ Register Agent modal/form
5. ✅ Task detail page with logs
6. ✅ Agent API key management UI

### Medium Priority (Enhanced UX)
7. ✅ Project detail page
8. ✅ Agent detail page
9. ✅ Analysis detail page with formatted suggestions
10. ✅ Search and filter on all lists
11. ✅ Real-time updates on all lists (not just auto-refresh)
12. ✅ GitHub "Connect" button and OAuth flow

### Low Priority (Nice to Have)
13. ✅ Edit forms for all entities
14. ✅ Mobile responsive improvements
15. ✅ Dashboard activity feed and charts
16. ✅ Background jobs monitoring UI
17. ✅ Settings pages
18. ✅ Toast notifications

---

## Next Steps

**Immediate:**
1. First, complete the setup from SETUP.md (run migrations, seed data)
2. Then choose which features to implement based on priority

**Recommended Order:**
1. Add user authentication system
2. Implement create forms (Project, Task, Agent)
3. Add detail pages for viewing items
4. Add edit functionality
5. Enhance with search/filter
6. Add real-time UI updates
7. Implement GitHub integration UI
