import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { parseExpression } from 'cron-parser'
import { addMinutes, addHours, addDays } from 'date-fns'

// Mock database - In production, use Supabase or your database
let mockJobs: any[] = [
  {
    id: uuidv4(),
    name: 'Daily Database Backup',
    description: 'Automated backup of production database',
    schedule_type: 'cron',
    schedule_config: { cron_expression: '0 2 * * *' },
    job_type: 'backup',
    job_config: {
      source: 'postgresql://prod',
      destination: 's3://backups/',
    },
    status: 'active',
    timezone: 'UTC',
    priority: 8,
    retry_config: {
      max_attempts: 3,
      initial_delay_seconds: 60,
      max_delay_seconds: 3600,
      backoff_multiplier: 2,
    },
    timeout_seconds: 3600,
    max_concurrent: 1,
    conditions: null,
    dependencies: null,
    last_run_at: new Date(Date.now() - 86400000).toISOString(),
    next_run_at: calculateNextRun('cron', { cron_expression: '0 2 * * *' }, 'UTC'),
    run_count: 147,
    success_count: 145,
    failure_count: 2,
    created_by: null,
    metadata: {},
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Hourly API Health Check',
    description: 'Check API endpoint health and send alerts if down',
    schedule_type: 'interval',
    schedule_config: { interval_value: 1, interval_unit: 'hours' },
    job_type: 'http_request',
    job_config: {
      url: 'https://api.example.com/health',
      method: 'GET',
      headers: { 'User-Agent': 'Conductor-Scheduler' },
    },
    status: 'active',
    timezone: 'UTC',
    priority: 7,
    retry_config: {
      max_attempts: 2,
      initial_delay_seconds: 30,
      max_delay_seconds: 300,
      backoff_multiplier: 2,
    },
    timeout_seconds: 30,
    max_concurrent: 1,
    conditions: null,
    dependencies: null,
    last_run_at: new Date(Date.now() - 3600000).toISOString(),
    next_run_at: new Date(Date.now() + 600000).toISOString(),
    run_count: 2160,
    success_count: 2158,
    failure_count: 2,
    created_by: null,
    metadata: {},
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Weekly Report Generation',
    description: 'Generate and email weekly analytics report',
    schedule_type: 'recurring',
    schedule_config: {
      recurring_pattern: {
        frequency: 'weekly',
        time: '09:00',
        days_of_week: [1], // Monday
      },
    },
    job_type: 'report',
    job_config: {
      variables: { report_type: 'weekly_analytics' },
      notifications: {
        on_success: ['team@example.com'],
        on_failure: ['admin@example.com'],
        channels: ['email'],
      },
    },
    status: 'active',
    timezone: 'America/New_York',
    priority: 6,
    retry_config: {
      max_attempts: 3,
      initial_delay_seconds: 60,
      max_delay_seconds: 1800,
      backoff_multiplier: 2,
    },
    timeout_seconds: 600,
    max_concurrent: 1,
    conditions: null,
    dependencies: null,
    last_run_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    next_run_at: calculateNextMonday('09:00', 'America/New_York'),
    run_count: 12,
    success_count: 12,
    failure_count: 0,
    created_by: null,
    metadata: {},
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function calculateNextRun(
  scheduleType: string,
  config: any,
  timezone: string
): string | null {
  try {
    const now = new Date()

    switch (scheduleType) {
      case 'cron':
        if (config.cron_expression) {
          const interval = parseExpression(config.cron_expression, {
            currentDate: now,
            tz: timezone,
          })
          return interval.next().toISOString()
        }
        break

      case 'interval':
        if (config.interval_value && config.interval_unit) {
          switch (config.interval_unit) {
            case 'minutes':
              return addMinutes(now, config.interval_value).toISOString()
            case 'hours':
              return addHours(now, config.interval_value).toISOString()
            case 'days':
              return addDays(now, config.interval_value).toISOString()
          }
        }
        break

      case 'one-time':
        return config.run_at || null

      case 'recurring':
        // Simplified calculation - in production, implement proper recurring logic
        return addDays(now, 1).toISOString()

      default:
        return null
    }
  } catch (error) {
    console.error('Error calculating next run:', error)
    return null
  }

  return null
}

function calculateNextMonday(time: string, timezone: string): string {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  const nextMonday = addDays(now, daysUntilMonday)
  nextMonday.setHours(hours, minutes, 0, 0)
  return nextMonday.toISOString()
}

// GET - List all jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const jobType = searchParams.get('job_type')

    let filteredJobs = [...mockJobs]

    if (status && status !== 'all') {
      filteredJobs = filteredJobs.filter((job) => job.status === status)
    }

    if (jobType && jobType !== 'all') {
      filteredJobs = filteredJobs.filter((job) => job.job_type === jobType)
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newJob = {
      id: uuidv4(),
      name: body.name,
      description: body.description || null,
      schedule_type: body.schedule_type,
      schedule_config: body.schedule_config,
      job_type: body.job_type,
      job_config: body.job_config,
      status: 'active',
      timezone: body.timezone || 'UTC',
      priority: body.priority || 5,
      retry_config: body.retry_config || {
        max_attempts: 3,
        initial_delay_seconds: 60,
        max_delay_seconds: 3600,
        backoff_multiplier: 2,
      },
      timeout_seconds: body.timeout_seconds || 300,
      max_concurrent: body.max_concurrent || 1,
      conditions: body.conditions || null,
      dependencies: body.dependencies || null,
      last_run_at: null,
      next_run_at: calculateNextRun(
        body.schedule_type,
        body.schedule_config,
        body.timezone || 'UTC'
      ),
      run_count: 0,
      success_count: 0,
      failure_count: 0,
      created_by: null,
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockJobs.push(newJob)

    return NextResponse.json(newJob, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

// PUT - Update job (handled in [id]/route.ts)
// DELETE - Delete job (handled in [id]/route.ts)
