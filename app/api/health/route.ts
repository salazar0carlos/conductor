import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient()
    const { error: dbError } = await supabase.from('projects').select('count').limit(1).single()

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbError ? 'unhealthy' : 'healthy',
        api: 'healthy'
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    if (dbError) {
      health.status = 'degraded'
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
