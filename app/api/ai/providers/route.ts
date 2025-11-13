/**
 * AI Providers API
 * GET - List all providers with stats
 * POST - Create/update provider configuration
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, AIProviderStats } from '@/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/ai/providers
 * List all providers with statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const userId = searchParams.get('user_id')
    const projectId = searchParams.get('project_id')

    // Get all providers
    let query = supabase
      .from('ai_providers')
      .select('*')
      .eq('status', 'active')

    if (category) {
      query = query.eq('category', category)
    }

    const { data: providers, error } = await query.order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get stats for each provider
    const providersWithStats: AIProviderStats[] = await Promise.all(
      providers.map(async (provider) => {
        // Get provider config
        const { data: config } = await supabase
          .from('ai_provider_configs')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('user_id', userId || null)
          .eq('project_id', projectId || null)
          .single()

        // Get health status
        const { data: health } = await supabase
          .from('ai_provider_health')
          .select('*')
          .eq('provider_id', provider.id)
          .single()

        // Get today's usage
        const today = new Date().toISOString().split('T')[0]
        const { data: todayUsage } = await supabase
          .from('ai_usage_logs')
          .select('total_tokens, cost_usd')
          .eq('provider_id', provider.id)
          .gte('created_at', today)

        const todayStats = todayUsage?.reduce(
          (acc, log) => ({
            requests: acc.requests + 1,
            tokens: acc.tokens + log.total_tokens,
            cost_usd: acc.cost_usd + Number(log.cost_usd),
          }),
          { requests: 0, tokens: 0, cost_usd: 0 }
        ) || { requests: 0, tokens: 0, cost_usd: 0 }

        // Get this month's usage
        const monthStart = new Date()
        monthStart.setDate(1)
        const { data: monthUsage } = await supabase
          .from('ai_usage_logs')
          .select('total_tokens, cost_usd')
          .eq('provider_id', provider.id)
          .gte('created_at', monthStart.toISOString())

        const monthStats = monthUsage?.reduce(
          (acc, log) => ({
            requests: acc.requests + 1,
            tokens: acc.tokens + log.total_tokens,
            cost_usd: acc.cost_usd + Number(log.cost_usd),
          }),
          { requests: 0, tokens: 0, cost_usd: 0 }
        ) || { requests: 0, tokens: 0, cost_usd: 0 }

        // Get budgets
        const { data: dailyBudget } = await supabase
          .from('ai_usage_budgets')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('period', 'daily')
          .eq('period_start', today)
          .single()

        const { data: monthlyBudget } = await supabase
          .from('ai_usage_budgets')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('period', 'monthly')
          .eq('period_start', monthStart.toISOString().split('T')[0])
          .single()

        // Get available models
        const { data: models } = await supabase
          .from('ai_models')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('status', 'active')
          .order('name')

        return {
          provider,
          config: config || undefined,
          health: health || {
            id: '',
            provider_id: provider.id,
            is_available: true,
            last_check_at: new Date().toISOString(),
            response_time_ms: null,
            error_rate: null,
            success_count: 0,
            error_count: 0,
            last_error: null,
            last_error_at: null,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          usage: {
            today: todayStats,
            this_month: monthStats,
          },
          budget: {
            daily: dailyBudget || null,
            monthly: monthlyBudget || null,
          },
          available_models: models || [],
        }
      })
    )

    return NextResponse.json(providersWithStats)
  } catch (error: any) {
    console.error('Failed to fetch providers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/providers
 * Create or update provider configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      provider_id,
      api_key,
      user_id,
      project_id,
      is_enabled = true,
      priority = 0,
      daily_budget_usd,
      monthly_budget_usd,
      default_parameters = {},
      metadata = {},
    } = body

    if (!provider_id || !api_key) {
      return NextResponse.json(
        { error: 'provider_id and api_key are required' },
        { status: 400 }
      )
    }

    // In production, encrypt the API key
    // For now, we'll store it as-is (NOT RECOMMENDED)
    const apiKeyEncrypted = api_key

    // Upsert provider config
    const { data, error } = await supabase
      .from('ai_provider_configs')
      .upsert({
        provider_id,
        user_id: user_id || null,
        project_id: project_id || null,
        api_key_encrypted: apiKeyEncrypted,
        is_enabled,
        priority,
        daily_budget_usd: daily_budget_usd || null,
        monthly_budget_usd: monthly_budget_usd || null,
        default_parameters,
        metadata,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to create provider config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create provider config' },
      { status: 500 }
    )
  }
}
