# Conductor Setup Guide

This guide will walk you through setting up and testing the full Conductor AI Agent Orchestration System.

## Prerequisites

- Supabase project created with credentials in `.env.local`
- Anthropic API key configured
- Node.js and npm installed

## Step 1: Run Database Migrations

You need to execute the SQL migrations to create all database tables.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20250110_initial_schema.sql`
5. Paste into the SQL editor and click **Run**
6. Wait for completion (should see "Success" message)
7. Repeat steps 3-6 for `supabase/migrations/20250110_add_production_features.sql`

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project first (one time)
supabase link --project-ref rpteapaxfjmnymibknxr

# Run migrations
supabase db push
```

### Verify Migrations

After running migrations, verify the tables were created:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `projects`
   - `agents`
   - `tasks`
   - `task_logs`
   - `analysis_history`
   - `agent_api_keys`
   - `background_jobs`
   - `rate_limits`

## Step 2: Enable Realtime

For live dashboard updates, enable Realtime on all tables:

1. In Supabase Dashboard, go to **Database** → **Replication**
2. Find each of these tables and toggle **Realtime** ON:
   - `projects`
   - `agents`
   - `tasks`
   - `task_logs`
   - `analysis_history`

## Step 3: Seed Test Data

Now create comprehensive test data to test all features:

```bash
npm run seed
```

This will create:
- **3 test projects** (E-commerce Platform, Mobile App Backend, Analytics Dashboard)
- **5 test agents** with different types (llm, tool, analyzer, supervisor) and statuses
- **10 test tasks** with various statuses (completed, in_progress, pending, failed)
- **Task logs** for completed tasks
- **2 sample analyses** (task completion review and pattern detection)

You should see output like:
```
🌱 Seeding test data...

Creating test projects...
✅ Created 3 projects

Creating test agents...
✅ Created 5 agents

Creating test tasks...
✅ Created 10 tasks

Creating task logs...
✅ Created 10 task logs

Creating sample analysis...
✅ Created 2 analyses

📊 Test Data Summary:
   Projects: 3
   Agents: 5
   Tasks: 10
   Task Logs: 10
   Analyses: 2

✨ Test data created successfully!
🚀 You can now test the application at http://localhost:3000/dashboard
```

## Step 4: Start the Application

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 5: Test Core Features

### Dashboard Stats
Visit http://localhost:3000/dashboard

You should see:
- Total projects count
- Active agents count
- Total tasks count
- Pending tasks count
- Completed tasks count
- Failed tasks count

### Projects API
```bash
# List all projects
curl http://localhost:3000/api/projects

# Get specific project
curl http://localhost:3000/api/projects/{project_id}
```

### Agents API
```bash
# List all agents
curl http://localhost:3000/api/agents

# Get specific agent
curl http://localhost:3000/api/agents/{agent_id}

# Generate API key for an agent
curl -X POST http://localhost:3000/api/agents/api-keys \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "{agent_id}", "name": "Test Key"}'

# Save the returned API key - you'll need it for authenticated requests
```

### Tasks API (Authenticated)
```bash
# Set your API key
export API_KEY="cond_..."

# List tasks for a project
curl http://localhost:3000/api/tasks?project_id={project_id}

# Poll for available tasks (agent perspective)
curl -X POST http://localhost:3000/api/tasks/poll \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "{agent_id}", "capabilities": ["coding", "architecture"]}'

# Accept a task
curl -X POST http://localhost:3000/api/tasks/{task_id}/accept \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "{agent_id}"}'

# Complete a task (triggers AI analysis)
curl -X POST http://localhost:3000/api/tasks/{task_id}/complete \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "{agent_id}",
    "output_data": {
      "files_created": ["app.tsx"],
      "lines_of_code": 150,
      "tests_added": 10
    }
  }'
```

### Intelligence Layer

When you complete a task, the system automatically:

1. **Creates an analysis job** in `background_jobs` table
2. **Runs AI analysis** using Claude Sonnet 4 via the Product Improvement Agent
3. **Stores findings** in `analysis_history` table
4. **Triggers pattern detection** after every 5 completed tasks
5. **Runs supervisor review** after 10 pending analyses accumulate

To process background jobs manually:
```bash
curl -X POST http://localhost:3000/api/jobs/process \
  -H "Authorization: Bearer dev-token"
```

Check the `background_jobs` table in Supabase to see job status.

### Real-Time Updates

Open the dashboard in two browser windows side-by-side. In one window:
- Create a new task via API
- Update an agent status
- Complete a task

The other window should update automatically without refresh.

### Analysis History
```bash
# List all analyses
curl http://localhost:3000/api/analysis

# Get specific analysis
curl http://localhost:3000/api/analysis/{analysis_id}
```

## Step 6: Testing Checklist

- [ ] Dashboard loads and shows correct stats
- [ ] Projects list displays 3 test projects
- [ ] Agents list shows 5 agents with different statuses
- [ ] Tasks list shows 10 tasks across projects
- [ ] Can generate API key for an agent
- [ ] Can poll for tasks using API key (authenticated)
- [ ] Can accept a task using API key
- [ ] Can complete a task and see it trigger analysis job
- [ ] Background job processor runs successfully
- [ ] Analysis appears in analysis_history table
- [ ] Real-time updates work (task status changes reflect immediately)
- [ ] Task logs display correctly
- [ ] Rate limiting triggers after exceeding limits

## Troubleshooting

### Dashboard shows zero stats
**Issue:** Migrations not run or tables empty
**Fix:** Run migrations (Step 1) and seed data (Step 3)

### "Unauthorized" on API requests
**Issue:** Missing or invalid API key
**Fix:** Generate a new API key via `/api/agents/api-keys` and include in `Authorization: Bearer {key}` header

### Background jobs not processing
**Issue:** Job processor not running
**Fix:** Manually trigger via `/api/jobs/process` or set up Vercel cron (see DEPLOYMENT.md)

### Realtime updates not working
**Issue:** Realtime not enabled on tables
**Fix:** Enable Realtime replication for all tables (Step 2)

### "Anthropic API error"
**Issue:** Invalid or missing API key
**Fix:** Check `ANTHROPIC_API_KEY` in `.env.local`

### Rate limit errors
**Issue:** Too many requests from same IP/agent
**Fix:** Wait 1 minute or clear `rate_limits` table in Supabase

## Next Steps

Once you've verified all features work:

1. **Review the code** - Understand how the intelligence layer works
2. **Test edge cases** - Try failing a task, cancelling tasks, etc.
3. **Monitor jobs** - Watch the `background_jobs` table as tasks complete
4. **Review analyses** - Check the `analysis_history` table for AI-generated insights
5. **Deploy to production** - Follow DEPLOYMENT.md guide

## Environment Variables Reference

Make sure these are set in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rpteapaxfjmnymibknxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_key

# Internal (for cron jobs)
INTERNAL_JOB_TOKEN=dev-token

# Optional: GitHub Integration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Optional: Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

## Support

- Check logs in Supabase Dashboard → **Logs**
- Review background job errors in `background_jobs` table
- Check task logs in `task_logs` table for debugging
- Review DEPLOYMENT.md for production setup guidance
