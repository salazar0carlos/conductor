import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogger } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/audit/analytics
 * Get analytics data for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    const logger = getAuditLogger()

    const analytics = await logger.getAnalytics(days)

    // Process aggregations for charts
    const timeSeriesData = analytics.aggregations.reduce((acc, agg) => {
      const date = agg.aggregation_date
      if (!acc[date]) {
        acc[date] = { date, total: 0, errors: 0 }
      }
      acc[date].total += agg.event_count || 0
      acc[date].errors += agg.error_count || 0
      return acc
    }, {} as Record<string, any>)

    const timeSeries = Object.values(timeSeriesData).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    )

    // Get hourly distribution for peak times
    const hourlyDistribution = analytics.aggregations.reduce((acc, agg) => {
      const hour = agg.hour || 0
      if (!acc[hour]) {
        acc[hour] = 0
      }
      acc[hour] += agg.event_count || 0
      return acc
    }, {} as Record<number, number>)

    return NextResponse.json({
      success: true,
      data: {
        timeSeries,
        topUsers: analytics.topUsers,
        eventDistribution: analytics.eventDistribution,
        hourlyDistribution: Object.entries(hourlyDistribution).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
