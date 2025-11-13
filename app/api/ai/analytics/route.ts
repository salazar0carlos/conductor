/**
 * AI Analytics API
 * GET - Fetch usage analytics and insights
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, AIUsageAnalytics } from '@/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/ai/analytics
 * Get usage analytics with various aggregations
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const projectId = searchParams.get('project_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const groupBy = searchParams.get('group_by') || 'day'

    // Build base query
    let query = supabase.from('ai_usage_logs').select(`
      *,
      ai_providers (id, name, display_name, category),
      ai_models (id, name, display_name, category)
    `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: logs, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!logs) {
      return NextResponse.json({ error: 'No logs found' }, { status: 404 })
    }

    // Calculate aggregated metrics
    const totalRequests = logs.length
    const totalTokens = logs.reduce((sum: number, log: any) => sum + (log.total_tokens || 0), 0)
    const totalCost = logs.reduce(
      (sum: number, log: any) => sum + Number(log.cost_usd || 0),
      0
    )
    const successfulRequests = logs.filter((log: any) => log.status === 'success')
      .length
    const totalDuration = logs
      .filter((log: any) => log.duration_ms)
      .reduce((sum: number, log: any) => sum + (log.duration_ms || 0), 0)

    // By provider
    const byProvider = Object.values(
      logs.reduce((acc: any, log: any) => {
        const providerId = log.provider_id
        if (!acc[providerId]) {
          acc[providerId] = {
            provider: log.ai_providers,
            requests: 0,
            cost_usd: 0,
            tokens: 0,
          }
        }
        acc[providerId].requests++
        acc[providerId].cost_usd += Number(log.cost_usd)
        acc[providerId].tokens += log.total_tokens
        return acc
      }, {})
    )

    // By model
    const byModel = Object.values(
      logs.reduce((acc: any, log: any) => {
        const modelId = log.model_id
        if (!acc[modelId]) {
          acc[modelId] = {
            model: log.ai_models,
            requests: 0,
            cost_usd: 0,
            tokens: 0,
          }
        }
        acc[modelId].requests++
        acc[modelId].cost_usd += Number(log.cost_usd)
        acc[modelId].tokens += log.total_tokens
        return acc
      }, {})
    )

    // By task type
    const byTaskType = Object.values(
      logs.reduce((acc: any, log: any) => {
        const taskType = log.task_type || 'unknown'
        if (!acc[taskType]) {
          acc[taskType] = {
            task_type: taskType,
            requests: 0,
            cost_usd: 0,
            average_quality_score: 0,
            total_quality_score: 0,
            quality_count: 0,
          }
        }
        acc[taskType].requests++
        acc[taskType].cost_usd += Number(log.cost_usd)
        if (log.response_quality_score) {
          acc[taskType].total_quality_score += Number(
            log.response_quality_score
          )
          acc[taskType].quality_count++
        }
        return acc
      }, {})
    ).map((item: any) => ({
      task_type: item.task_type,
      requests: item.requests,
      cost_usd: item.cost_usd,
      average_quality_score:
        item.quality_count > 0
          ? item.total_quality_score / item.quality_count
          : 0,
    }))

    // Timeline
    const timeline = Object.values(
      logs.reduce((acc: any, log: any) => {
        const date = log.created_at.split('T')[0]
        if (!acc[date]) {
          acc[date] = {
            date,
            requests: 0,
            cost_usd: 0,
            tokens: 0,
          }
        }
        acc[date].requests++
        acc[date].cost_usd += Number(log.cost_usd)
        acc[date].tokens += log.total_tokens
        return acc
      }, {})
    ).sort((a: any, b: any) => a.date.localeCompare(b.date))

    const analytics: AIUsageAnalytics = {
      total_requests: totalRequests,
      total_tokens: totalTokens,
      total_cost_usd: totalCost,
      average_cost_per_request:
        totalRequests > 0 ? totalCost / totalRequests : 0,
      average_response_time_ms:
        successfulRequests > 0
          ? totalDuration / successfulRequests
          : 0,
      success_rate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      by_provider: byProvider as any,
      by_model: byModel as any,
      by_task_type: byTaskType as any,
      timeline: timeline as any,
    }

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
