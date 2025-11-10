import { createClient } from '@/lib/supabase/server'
import { analyzeTaskCompletion, detectPatterns } from '@/lib/ai/product-improvement-agent'
import { reviewAndPrioritizeSuggestions } from '@/lib/ai/supervisor-agent'

export type JobType = 'analyze_task' | 'detect_patterns' | 'review_suggestions' | 'github_webhook'

export interface JobPayload {
  task_id?: string
  project_id?: string
  [key: string]: unknown
}

export async function createJob(type: JobType, payload: JobPayload, scheduledAt?: Date): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('background_jobs')
    .insert({
      type,
      status: 'pending',
      payload,
      attempts: 0,
      max_attempts: 3,
      scheduled_at: scheduledAt?.toISOString() || new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  return data.id
}

export async function processJob(jobId: string): Promise<boolean> {
  const supabase = await createClient()

  // Get the job
  const { data: job, error: fetchError } = await supabase
    .from('background_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (fetchError || !job) {
    console.error('Failed to fetch job:', fetchError)
    return false
  }

  // Mark as running
  await supabase
    .from('background_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString()
    })
    .eq('id', jobId)

  try {
    let result: unknown = null

    // Execute job based on type
    switch (job.type) {
      case 'analyze_task': {
        const { data: task } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', job.payload.task_id)
          .single()

        if (task) {
          result = await analyzeTaskCompletion(task)
        }
        break
      }

      case 'detect_patterns': {
        if (job.payload.project_id) {
          result = await detectPatterns(job.payload.project_id as string)
        }
        break
      }

      case 'review_suggestions': {
        if (job.payload.project_id) {
          await reviewAndPrioritizeSuggestions(job.payload.project_id as string)
          result = { success: true }
        }
        break
      }

      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }

    // Mark as completed
    await supabase
      .from('background_jobs')
      .update({
        status: 'completed',
        result: result as Record<string, unknown>,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Job ${jobId} failed:`, error)

    const newAttempts = job.attempts + 1
    const shouldRetry = newAttempts < job.max_attempts

    if (shouldRetry) {
      // Exponential backoff: 2^attempts minutes
      const retryDelayMinutes = Math.pow(2, newAttempts)
      const nextRetryAt = new Date(Date.now() + retryDelayMinutes * 60 * 1000)

      await supabase
        .from('background_jobs')
        .update({
          status: 'retrying',
          attempts: newAttempts,
          error_message: errorMessage,
          next_retry_at: nextRetryAt.toISOString()
        })
        .eq('id', jobId)
    } else {
      await supabase
        .from('background_jobs')
        .update({
          status: 'failed',
          attempts: newAttempts,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
    }

    return false
  }
}

export async function processPendingJobs(): Promise<number> {
  const supabase = await createClient()

  // Get pending jobs that are due
  const { data: jobs } = await supabase
    .from('background_jobs')
    .select('id')
    .in('status', ['pending', 'retrying'])
    .lte('scheduled_at', new Date().toISOString())
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .limit(10)

  if (!jobs) return 0

  // Process jobs concurrently
  const results = await Promise.allSettled(
    jobs.map(job => processJob(job.id))
  )

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length

  return successCount
}

// Auto-trigger analysis when task completes
export async function onTaskComplete(taskId: string): Promise<void> {
  const supabase = await createClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single()

  if (!task) return

  // Create analysis job
  await createJob('analyze_task', { task_id: taskId })

  // Check if we should run pattern detection (every 5 completed tasks)
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', task.project_id)
    .eq('status', 'completed')

  if (count && count % 5 === 0) {
    await createJob('detect_patterns', { project_id: task.project_id })
  }

  // Check if we should run supervisor review (every 10 analyses)
  const { count: analysisCount } = await supabase
    .from('analysis_history')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', task.project_id)
    .eq('status', 'pending')

  if (analysisCount && analysisCount >= 10) {
    await createJob('review_suggestions', { project_id: task.project_id })
  }
}
