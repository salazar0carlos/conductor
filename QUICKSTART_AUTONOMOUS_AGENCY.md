# Conductor Autonomous Agency - Quickstart Guide

## What You Built

You now have an **autonomous software development agency** where each project gets its own team of 11 AI agents that work continuously to build and maintain apps.

## Architecture

```
YOU (CEO) → Create Projects → Each Project Gets:
  ├─ 11 Specialist Agents (Backend, Frontend, Security, etc.)
  ├─ Own GitHub Repo
  ├─ Own Supabase Database
  └─ Agents work autonomously 24/7
```

## Setup (Do This Once)

### 1. Apply Database Migration

Go to Supabase SQL Editor and run:

```sql
-- (The project-scoped agents migration SQL - run the file we created)
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add GitHub Token to Environment

Add to your `.env.local`:

```
GITHUB_TOKEN=your_github_personal_access_token
```

## Usage

### Creating Your First Autonomous Team

**Step 1: Create a Project**

```bash
# In your app UI:
1. Go to Projects
2. Click "New Project"
3. Name: "My Todo App"
4. Enable GitHub integration
5. Enable Supabase integration
6. Click Create
```

**Step 2: Spawn Agent Team**

```bash
# Call the API to spawn agents
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/spawn-team
```

This creates 11 agents for your project:
- Backend Architect
- Frontend Architect
- System Architect
- Security Engineer
- Performance Engineer
- Refactoring Expert
- Requirements Analyst
- Technical Writer
- Deep Research Agent
- Learning Guide
- Tech Stack Researcher

**Step 3: Start Agent Workers**

Each agent needs a worker process. Start them:

```bash
# Terminal 1: Backend Architect
npm run worker -- --project {PROJECT_ID} --agent {BACKEND_AGENT_ID}

# Terminal 2: Frontend Architect
npm run worker -- --project {PROJECT_ID} --agent {FRONTEND_AGENT_ID}

# ... repeat for all 11 agents
```

Or use PM2 to manage all workers:

```bash
# Install PM2
npm install -g pm2

# Start all workers (create ecosystem.config.js first)
pm2 start ecosystem.config.js

# Monitor workers
pm2 logs
pm2 monit
```

**Step 4: Assign Work**

```bash
# In your app UI:
1. Go to Tasks
2. Click "New Task"
3. Title: "Build Next.js todo app with authentication"
4. Type: Feature
5. Priority: 10
6. Click Create

# The orchestrator will:
1. Decompose this into 25+ subtasks
2. Assign each to the right specialist
3. Agents poll for their tasks
4. They execute using Claude API
5. They commit code to GitHub
6. They report completion
```

## Example: Full Workflow

```
YOU: "Build a Next.js todo app"
    ↓
Conductor creates task
    ↓
Orchestrator decomposes into:
  ├─ Requirements Analyst: "Gather requirements"
  ├─ System Architect: "Design architecture"
  ├─ Backend Architect: "Design database schema"
  ├─ Backend Architect: "Build API routes"
  ├─ Frontend Architect: "Create UI components"
  ├─ Security Engineer: "Security audit"
  ├─ Performance Engineer: "Performance optimization"
  └─ Technical Writer: "Write documentation"
    ↓
Each agent worker:
  1. Polls for their task
  2. Uses Claude API with their expertise
  3. Writes code
  4. Commits to GitHub
  5. Reports completion
    ↓
Result: Complete todo app in your GitHub repo!
```

## Multi-Project Management

**Create Second Project:**

```bash
# Create "E-commerce Store" project
# Spawn new team for this project
# Start workers for this team
# Now you have 2 teams working independently!
```

**CEO Dashboard** (coming soon):

```
Project 1: Todo App
  ├─ Team: 11 agents (8 working, 3 idle)
  ├─ Tasks: 120 completed
  └─ Health: ✅ 99% uptime

Project 2: E-commerce Store
  ├─ Team: 11 agents (11 working)
  ├─ Tasks: 89 completed
  └─ Health: ✅ 98% uptime
```

## Current Status

✅ **Complete:**
- Agent worker system
- Claude API integration
- Project-scoped agents
- Task polling & execution
- Database migrations

🚧 **In Progress:**
- GitHub commit automation
- Worker process management (PM2/Docker)
- Multi-project dashboard

⏳ **Coming Next:**
- Continuous operation mode
- Auto-healing
- Performance monitoring
- Cost tracking

## Cost Estimates

**Per Project (monthly):**
- Claude API: ~$50-200 (based on usage)
- Worker hosting: $10-20 (Railway/Render)
- Total: **~$60-220/month per project**

## Troubleshooting

**Workers not starting?**
- Check `.env.local` has all required vars
- Verify project_id and agent_id exist in database

**Tasks not being picked up?**
- Check workers are running (`pm2 list`)
- Verify agent capabilities match task requirements
- Check worker logs for errors

**Claude API errors?**
- Verify `ANTHROPIC_API_KEY` is set
- Check API rate limits
- Monitor token usage

## Next Steps

1. **Apply the SQL migration**
2. **Install dependencies** (`npm install`)
3. **Create your first project**
4. **Spawn agent team**
5. **Start workers**
6. **Assign a task**
7. **Watch your agents work!** 🤖

---

**You're now running an autonomous software agency!** 🎉
