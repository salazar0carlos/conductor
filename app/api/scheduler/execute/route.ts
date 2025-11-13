import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Mock executions database
const mockExecutions: any[] = [
  {
    id: uuidv4(),
    job_id: 'sample-job-1',
    scheduled_at: new Date(Date.now() - 3600000).toISOString(),
    started_at: new Date(Date.now() - 3599000).toISOString(),
    completed_at: new Date(Date.now() - 3590000).toISOString(),
    status: 'completed',
    trigger_type: 'scheduled',
    triggered_by: null,
    attempt_number: 1,
    duration_ms: 9000,
    output: { success: true, records_processed: 1543 },
    error_message: null,
    error_stack: null,
    metadata: {},
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuidv4(),
    job_id: 'sample-job-2',
    scheduled_at: new Date(Date.now() - 7200000).toISOString(),
    started_at: new Date(Date.now() - 7199000).toISOString(),
    completed_at: new Date(Date.now() - 7198500).toISOString(),
    status: 'failed',
    trigger_type: 'scheduled',
    triggered_by: null,
    attempt_number: 1,
    duration_ms: 500,
    output: null,
    error_message: 'Connection timeout',
    error_stack: 'Error: Connection timeout\n  at ...',
    metadata: {},
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

// POST - Execute job manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id, variables } = body

    // Create new execution record
    const execution = {
      id: uuidv4(),
      job_id,
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: null,
      status: 'running',
      trigger_type: 'manual',
      triggered_by: null, // In production, use authenticated user ID
      attempt_number: 1,
      duration_ms: null,
      output: null,
      error_message: null,
      error_stack: null,
      metadata: { variables: variables || {} },
      created_at: new Date().toISOString(),
    }

    mockExecutions.push(execution)

    // In production, this would trigger actual job execution
    // For now, simulate async execution
    setTimeout(() => {
      const exec = mockExecutions.find((e) => e.id === execution.id)
      if (exec) {
        exec.status = 'completed'
        exec.completed_at = new Date().toISOString()
        exec.duration_ms = 2500
        exec.output = { success: true, manual_execution: true }
      }
    }, 2500)

    return NextResponse.json(execution, { status: 201 })
  } catch (error) {
    console.error('Error executing job:', error)
    return NextResponse.json(
      { error: 'Failed to execute job' },
      { status: 500 }
    )
  }
}

// GET - Get execution history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let filteredExecutions = [...mockExecutions]

    if (jobId) {
      filteredExecutions = filteredExecutions.filter((e) => e.job_id === jobId)
    }

    if (status && status !== 'all') {
      filteredExecutions = filteredExecutions.filter((e) => e.status === status)
    }

    // Sort by created_at descending
    filteredExecutions.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Limit results
    filteredExecutions = filteredExecutions.slice(0, limit)

    return NextResponse.json({
      executions: filteredExecutions,
      total: filteredExecutions.length,
    })
  } catch (error) {
    console.error('Error fetching executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}
