# Database Setup Guide

This guide will help you set up the Supabase database for Conductor.

## Prerequisites

- A Supabase account (create one at https://supabase.com)
- Your Supabase credentials added to `.env.local`

## Setup Steps

### 1. Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Name your project (e.g., "conductor")
5. Set a strong database password
6. Choose a region close to you
7. Click "Create new project"

### 2. Run the Database Migration

Once your project is created:

1. Go to the SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy the contents of `supabase/migrations/20250110_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the migration

This will create:
- All necessary tables (projects, agents, tasks, task_logs, analysis_history)
- Indexes for optimal performance
- RLS (Row Level Security) policies
- Triggers for automatic timestamp updates

### 3. Verify the Setup

Check that all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see:
- projects
- agents
- tasks
- task_logs
- analysis_history

### 4. Optional: Add Sample Data

You can add sample data to test the system:

```sql
-- Insert a sample project
INSERT INTO projects (name, description, status)
VALUES ('Sample Project', 'A test project for Conductor', 'active');

-- Insert a sample agent
INSERT INTO agents (name, type, capabilities, status)
VALUES ('Test Agent', 'llm', ARRAY['coding', 'analysis'], 'idle');

-- Insert a sample task
INSERT INTO tasks (project_id, title, type, priority, status)
VALUES (
  (SELECT id FROM projects WHERE name = 'Sample Project' LIMIT 1),
  'Test Task',
  'feature',
  5,
  'pending'
);
```

## Environment Variables

Make sure your `.env.local` file has these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in:
- Supabase Dashboard → Settings → API
- The URL is your Project URL
- The anon key is the "anon" / "public" key
- The service role key is under "service_role" (keep this secret!)

## Security Notes

### Row Level Security (RLS)

The migration enables RLS on all tables with permissive policies. For production:

1. **Add authentication**: Implement Supabase Auth
2. **Restrict policies**: Update RLS policies to limit access based on user roles
3. **API access**: Consider requiring API keys for agent access

Example restrictive policy:

```sql
-- Only allow authenticated users to read projects
DROP POLICY "Enable read access for all users" ON projects;
CREATE POLICY "Authenticated users can read projects"
ON projects FOR SELECT
USING (auth.role() = 'authenticated');
```

### Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY`:
- Bypasses RLS policies
- Should ONLY be used in server-side code
- Never expose in client-side code
- Keep secure in production environments

## Troubleshooting

### Migration Fails

If the migration fails:
1. Check for syntax errors in the SQL
2. Ensure you have necessary permissions
3. Try running sections of the migration separately

### Connection Issues

If you can't connect:
1. Verify credentials in `.env.local`
2. Check that your project is fully initialized (can take a few minutes)
3. Ensure no firewall is blocking Supabase
4. Check Supabase status page for outages

### Performance Issues

If queries are slow:
1. Check that indexes were created (they should be automatic)
2. Monitor query performance in Supabase Dashboard → Database → Query Performance
3. Consider adding additional indexes for your specific query patterns

## Next Steps

After setup:
1. Start the development server: `npm run dev`
2. Open http://localhost:3000/dashboard
3. Register your first agent via the Agents page
4. Create a project and tasks
5. Test the agent polling endpoint: `POST /api/tasks/poll`

## Schema Overview

- **projects**: Top-level containers for work
- **agents**: Registered AI agents with capabilities
- **tasks**: Work items with priorities and dependencies
- **task_logs**: Execution logs for debugging
- **analysis_history**: Intelligence layer insights

For detailed schema information, see `types/index.ts`.
