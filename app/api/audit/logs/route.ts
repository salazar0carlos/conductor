import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogger } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/audit/logs
 * Query audit logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const logger = getAuditLogger()

    // Parse filters from query params
    const filters = {
      user_id: searchParams.get('user_id') || undefined,
      event_category: searchParams.get('event_category') as any || undefined,
      event_type: searchParams.get('event_type') as any || undefined,
      resource_type: searchParams.get('resource_type') || undefined,
      resource_id: searchParams.get('resource_id') || undefined,
      severity: searchParams.get('severity') as any || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      ip_address: searchParams.get('ip_address') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await logger.query(filters)

    return NextResponse.json({
      success: true,
      data: result.logs,
      total: result.total,
      filters,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
      },
      { status: 500 }
    )
  }
}
