import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogger } from '@/lib/audit/logger'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'

/**
 * POST /api/audit/export
 * Export audit logs in various formats
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format, filters, fields } = body

    if (!format || !['csv', 'json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Must be csv, json, or pdf' },
        { status: 400 }
      )
    }

    const logger = getAuditLogger()

    // Get logs with filters (no limit for export)
    const result = await logger.query({
      ...filters,
      limit: 10000, // Max export limit
    })

    const logs = result.logs

    // Select specific fields if provided
    const exportData = logs.map(log => {
      if (fields && Array.isArray(fields)) {
        const selected: any = {}
        fields.forEach(field => {
          selected[field] = log[field]
        })
        return selected
      }
      return log
    })

    // Format based on requested type
    if (format === 'csv') {
      const csv = Papa.unparse(exportData)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
      })
    }

    if (format === 'json') {
      const json = JSON.stringify(exportData, null, 2)

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.json"`,
        },
      })
    }

    if (format === 'pdf') {
      // For PDF, we'll return JSON with instruction to generate PDF on client
      // or implement server-side PDF generation with a library like puppeteer
      return NextResponse.json({
        success: false,
        error: 'PDF export not yet implemented. Use CSV or JSON for now.',
      }, { status: 501 })
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown export format',
    }, { status: 400 })

  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export logs',
      },
      { status: 500 }
    )
  }
}
