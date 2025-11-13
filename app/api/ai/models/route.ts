/**
 * AI Models API
 * GET - List all available models with filtering
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/ai/models
 * List all models with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('provider_id')
    const category = searchParams.get('category')
    const capability = searchParams.get('capability')
    const status = searchParams.get('status') || 'active'

    let query = supabase
      .from('ai_models')
      .select(`
        *,
        ai_providers (
          id,
          name,
          display_name,
          category,
          logo_url,
          status
        )
      `)

    if (providerId) {
      query = query.eq('provider_id', providerId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (capability) {
      query = query.contains('capabilities', [capability])
    }

    const { data: models, error } = await query.order('display_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by provider if requested
    const groupByProvider = searchParams.get('group_by') === 'provider'

    if (groupByProvider) {
      const grouped = models?.reduce((acc: any, model: any) => {
        const providerName = model.ai_providers.name
        if (!acc[providerName]) {
          acc[providerName] = {
            provider: model.ai_providers,
            models: [],
          }
        }
        acc[providerName].models.push(model)
        return acc
      }, {})

      return NextResponse.json(Object.values(grouped || {}))
    }

    return NextResponse.json(models)
  } catch (error: any) {
    console.error('Failed to fetch models:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
