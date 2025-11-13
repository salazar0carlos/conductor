import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogger } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/audit/alerts
 * Get security alerts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as any || undefined
    const logger = getAuditLogger()

    const alerts = await logger.getSecurityAlerts(status)

    return NextResponse.json({
      success: true,
      data: alerts,
    })
  } catch (error) {
    console.error('Error fetching security alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/audit/alerts
 * Update security alert status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alert_id, status, resolution_notes, assigned_to } = body

    if (!alert_id || !status) {
      return NextResponse.json(
        { success: false, error: 'alert_id and status are required' },
        { status: 400 }
      )
    }

    const logger = getAuditLogger()
    const supabase = (logger as any).supabase

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes
    }

    if (assigned_to) {
      updateData.assigned_to = assigned_to
    }

    if (status === 'resolved' || status === 'false_positive') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('audit_security_alerts')
      .update(updateData)
      .eq('id', alert_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update alert',
      },
      { status: 500 }
    )
  }
}
