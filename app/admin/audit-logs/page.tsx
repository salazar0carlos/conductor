'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { LogFilters, type LogFilters as LogFiltersType } from '@/components/audit-logs/log-filters'
import { LogTable, type AuditLog } from '@/components/audit-logs/log-table'
import { LogDetail } from '@/components/audit-logs/log-detail'
import { AnalyticsDashboard } from '@/components/audit-logs/analytics-dashboard'
import { SecurityDashboard } from '@/components/audit-logs/security-dashboard'
import { Download, BarChart3, Shield, List } from 'lucide-react'

type ViewMode = 'logs' | 'analytics' | 'security'

export default function AuditLogsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('logs')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<LogFiltersType>({})
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [exportLoading, setExportLoading] = useState(false)
  const pageSize = 50

  useEffect(() => {
    if (viewMode === 'logs') {
      fetchLogs()
    }
  }, [filters, currentPage, viewMode])

  const fetchLogs = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.event_category) params.append('event_category', filters.event_category)
      if (filters.event_type) params.append('event_type', filters.event_type)
      if (filters.severity) params.append('severity', filters.severity)
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.resource_type) params.append('resource_type', filters.resource_type)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.ip_address) params.append('ip_address', filters.ip_address)

      params.append('limit', pageSize.toString())
      params.append('offset', ((currentPage - 1) * pageSize).toString())

      const res = await fetch(`/api/audit/logs?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.data)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: LogFiltersType) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleResetFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExportLoading(true)

      const res = await fetch('/api/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          filters,
          fields: [
            'created_at',
            'event_name',
            'event_category',
            'event_type',
            'severity',
            'user_email',
            'resource_type',
            'resource_id',
            'ip_address',
            'http_status',
          ],
        }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to export logs')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export logs')
    } finally {
      setExportLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Audit Logs & Compliance
          </h1>
          <p className="text-neutral-400">
            Enterprise-grade audit logging for security, compliance, and operational monitoring
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'logs'
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <List className="w-4 h-4" />
              Audit Logs
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'analytics'
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setViewMode('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'security'
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security Alerts
            </button>
          </div>

          {viewMode === 'logs' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={exportLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'logs' && (
          <div className="space-y-6">
            {/* Filters */}
            <LogFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="text-neutral-400 text-sm mb-1">Total Logs</div>
                <div className="text-2xl font-bold text-white">
                  {total.toLocaleString()}
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="text-neutral-400 text-sm mb-1">Current Page</div>
                <div className="text-2xl font-bold text-white">
                  {currentPage} / {totalPages || 1}
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="text-neutral-400 text-sm mb-1">Page Size</div>
                <div className="text-2xl font-bold text-white">{pageSize}</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="text-neutral-400 text-sm mb-1">Results</div>
                <div className="text-2xl font-bold text-white">{logs.length}</div>
              </div>
            </div>

            {/* Logs Table */}
            <LogTable
              logs={logs}
              loading={loading}
              onSelectLog={setSelectedLog}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {viewMode === 'analytics' && <AnalyticsDashboard days={30} />}

        {viewMode === 'security' && <SecurityDashboard />}

        {/* Log Detail Modal */}
        {selectedLog && (
          <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </main>
    </div>
  )
}
