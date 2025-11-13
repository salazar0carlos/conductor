# Advanced Scheduling System

A comprehensive job scheduling system with visual cron builder, multiple schedule types, and real-time monitoring.

## Features

### 1. Visual Cron Builder
- **Human-readable interface**: "Every Monday at 9am" format
- **Three modes**:
  - **Presets**: Quick selection of common schedules
  - **Visual Builder**: Dropdown-based configuration for minute, hour, day, month, and day of week
  - **Advanced**: Direct cron expression input
- **Real-time validation**: Instant feedback on cron expression validity
- **Next 10 executions preview**: See when your job will run
- **Timezone support**: Schedule jobs in any timezone

### 2. Schedule Types
- **Cron**: Traditional cron expressions with full flexibility
- **Interval**: Run every X minutes/hours/days
- **One-time**: Execute once at a specific date and time
- **Recurring**: Daily/Weekly/Monthly with custom patterns
  - Daily at specific time
  - Weekly on selected days
  - Monthly on specific day

### 3. Job Types
- **HTTP Request**: Make API calls with custom headers, body, and authentication
- **Database Query**: Execute database queries with parameters
- **Script Execution**: Run JavaScript, Python, or shell scripts
- **AI Task**: Execute AI-powered tasks with custom prompts
- **Workflow**: Trigger workflow execution
- **Data Sync**: Synchronize data between systems
- **Backup**: Create automated backups
- **Report Generation**: Generate and send reports

### 4. Job Management
- **CRUD Operations**: Create, edit, delete, pause, and resume jobs
- **Priority Levels**: Set job priority (1-10)
- **Timeout Settings**: Configure maximum execution time
- **Concurrency Limits**: Control parallel execution
- **Retry Configuration**:
  - Max attempts
  - Initial delay
  - Max delay
  - Backoff multiplier
  - Conditional retry (specific error codes)

### 5. Execution Monitoring
- **Real-time Status**: Track job execution status
- **Execution Logs**: Detailed logs with filtering and search
- **Performance Metrics**:
  - Execution duration
  - Success rate
  - Attempt number
- **Execution Details**:
  - Timing information (scheduled, started, completed)
  - Output data
  - Error messages and stack traces
  - Metadata

### 6. Calendar View
- **Visual Schedule**: See all jobs and executions on a calendar
- **Multiple Views**: Day, week, and month views
- **Color Coding**:
  - Blue: Scheduled jobs
  - Green: Completed executions
  - Red: Failed executions
  - Yellow: Paused jobs
- **Interactive**: Click on events to view details

### 7. Dashboard Statistics
- Total jobs count
- Active jobs count
- Total executions
- Successful executions
- Failed executions
- Overall success rate

## File Structure

```
/app
  /scheduler
    page.tsx                 # Main scheduler page
  /api
    /scheduler
      /jobs
        route.ts            # Job CRUD API
        /[id]
          route.ts          # Individual job operations
      /execute
        route.ts            # Job execution API

/components
  /scheduler
    cron-builder.tsx        # Visual cron expression builder
    schedule-config.tsx     # Schedule type configuration
    job-form.tsx           # Job creation/editing form
    job-list.tsx           # Jobs table with filters
    execution-log.tsx      # Execution history viewer
    calendar-view.tsx      # Calendar visualization

/types
  index.ts                 # TypeScript type definitions
```

## Usage

### Creating a Job

1. Click "Create Job" button
2. Enter basic information (name, description)
3. Select job type (HTTP Request, Database Query, etc.)
4. Configure job-specific settings
5. Choose schedule type (Cron, Interval, One-time, Recurring)
6. Set schedule parameters
7. Configure advanced settings (timezone, priority, timeout, retry)
8. Click "Create Job"

### Visual Cron Builder

**Preset Mode:**
- Select from common patterns like "Every hour", "Daily at midnight", etc.

**Visual Builder Mode:**
- Use dropdowns to select:
  - Minute (0-59 or intervals like */5)
  - Hour (0-23 or intervals like */2)
  - Day of Month (1-31 or every day)
  - Month (1-12 or every month)
  - Day of Week (0-6 or weekdays/weekends)

**Advanced Mode:**
- Enter cron expression directly: `minute hour day month day-of-week`
- Example: `0 9 * * 1-5` (Every weekday at 9am)

### Schedule Types

**Cron:**
```javascript
{
  schedule_type: 'cron',
  schedule_config: {
    cron_expression: '0 9 * * 1-5'
  }
}
```

**Interval:**
```javascript
{
  schedule_type: 'interval',
  schedule_config: {
    interval_value: 30,
    interval_unit: 'minutes'
  }
}
```

**One-time:**
```javascript
{
  schedule_type: 'one-time',
  schedule_config: {
    run_at: '2025-12-31T23:59:59Z'
  }
}
```

**Recurring:**
```javascript
{
  schedule_type: 'recurring',
  schedule_config: {
    recurring_pattern: {
      frequency: 'weekly',
      time: '09:00',
      days_of_week: [1, 3, 5] // Mon, Wed, Fri
    }
  }
}
```

### Job Configuration Examples

**HTTP Request:**
```javascript
{
  job_type: 'http_request',
  job_config: {
    url: 'https://api.example.com/data',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token'
    },
    body: {
      key: 'value'
    }
  }
}
```

**Database Query:**
```javascript
{
  job_type: 'database_query',
  job_config: {
    connection_id: 'prod-db',
    query: 'SELECT * FROM users WHERE created_at > :start_date',
    parameters: {
      start_date: '2025-01-01'
    }
  }
}
```

**AI Task:**
```javascript
{
  job_type: 'ai_task',
  job_config: {
    ai_provider: 'openai',
    ai_model: 'gpt-4',
    prompt: 'Analyze the daily metrics and provide insights',
    ai_parameters: {
      temperature: 0.7,
      max_tokens: 1000
    }
  }
}
```

## API Endpoints

### Jobs

**GET /api/scheduler/jobs**
- List all jobs
- Query params: `status`, `job_type`

**POST /api/scheduler/jobs**
- Create new job
- Body: `CreateScheduledJobRequest`

**GET /api/scheduler/jobs/[id]**
- Get single job

**PATCH /api/scheduler/jobs/[id]**
- Update job
- Body: `UpdateScheduledJobRequest`

**DELETE /api/scheduler/jobs/[id]**
- Delete job

### Execution

**POST /api/scheduler/execute**
- Execute job manually
- Body: `{ job_id: string, variables?: object }`

**GET /api/scheduler/execute**
- Get execution history
- Query params: `job_id`, `status`, `limit`

## Database Schema

The scheduler uses the following main tables:

**scheduled_jobs**
- Job configuration and metadata
- Schedule configuration
- Status and statistics
- Retry and timeout settings

**job_executions**
- Execution history
- Status and timing information
- Output data and errors
- Attempt tracking

**job_alerts** (optional)
- Alert configuration
- Notification history

## Integration with Database

To integrate with your Supabase database:

1. Create the tables using the types defined in `/types/index.ts`
2. Replace mock data in API routes with actual database queries
3. Set up row-level security policies
4. Configure real-time subscriptions for live updates

Example Supabase setup:

```sql
-- Create scheduled_jobs table
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL,
  schedule_config JSONB NOT NULL,
  job_type TEXT NOT NULL,
  job_config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  priority INTEGER DEFAULT 5,
  retry_config JSONB NOT NULL,
  timeout_seconds INTEGER,
  max_concurrent INTEGER DEFAULT 1,
  conditions JSONB,
  dependencies TEXT[],
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_executions table
CREATE TABLE job_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  triggered_by UUID REFERENCES auth.users(id),
  attempt_number INTEGER DEFAULT 1,
  duration_ms INTEGER,
  output JSONB,
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at);
CREATE INDEX idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_created_at ON job_executions(created_at DESC);
```

## Background Worker

For production use, implement a background worker that:

1. Polls for jobs that need to run
2. Executes jobs based on their configuration
3. Handles retries with exponential backoff
4. Updates execution status and statistics
5. Sends notifications on success/failure

Example worker structure:

```typescript
// workers/scheduler-worker.ts
async function runScheduler() {
  while (true) {
    // 1. Find jobs that need to run
    const jobsToRun = await findJobsDueForExecution()

    // 2. Execute each job
    for (const job of jobsToRun) {
      await executeJob(job)
    }

    // 3. Wait before next poll
    await sleep(10000) // 10 seconds
  }
}
```

## Dependencies

- `cronstrue`: Human-readable cron descriptions
- `cron-parser`: Cron expression parsing and validation
- `date-fns`: Date manipulation and formatting
- `react-hook-form`: Form management
- `@fullcalendar/react`: Calendar visualization
- `lucide-react`: Icons
- `sonner`: Toast notifications

## Best Practices

1. **Always set appropriate timeouts** to prevent jobs from running indefinitely
2. **Configure retry settings** based on job criticality
3. **Use meaningful job names** that describe what the job does
4. **Monitor execution logs** regularly for failures
5. **Set up notifications** for critical job failures
6. **Use timezone-aware scheduling** when needed
7. **Test cron expressions** using the preview feature before saving
8. **Limit concurrent executions** for resource-intensive jobs

## Troubleshooting

**Job not executing:**
- Check if job status is "active"
- Verify next_run_at is in the future
- Check execution logs for errors
- Ensure background worker is running

**Cron expression validation errors:**
- Use the visual builder instead of manual entry
- Verify expression format: minute hour day month day-of-week
- Test expression in advanced mode

**Execution timeouts:**
- Increase timeout_seconds setting
- Optimize job logic for faster execution
- Consider splitting into smaller jobs

## Future Enhancements

- Job dependencies (run after X completes)
- Conditional execution (only if Y succeeded)
- Job chaining and workflows
- Dead letter queue for failed jobs
- Variable injection from environment
- Environment-specific schedules
- Webhook triggers
- Email/Slack notifications
- Execution metrics and analytics
- Job templates
- Bulk operations
