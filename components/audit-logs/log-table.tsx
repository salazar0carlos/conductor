'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

export interface AuditLog {
  id: string
  event_category: string
  event_type: string
  event_name: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  user_id?: string
  user_email?: string
  user_name?: string
  current_user_email?: string
  current_user_name?: string
  ip_address?: string
  resource_type?: string
  resource_id?: string
  resource_name?: string
  http_method?: string
  http_status?: number
  response_time_ms?: number
  risk_score?: number
  is_sensitive?: boolean
  created_at: string
  old_values?: any
  new_values?: any
  changes?: any
  metadata?: any
}

interface LogTableProps {
  logs: AuditLog[]
  loading?: boolean
  onSelectLog?: (log: AuditLog) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function LogTable({
  logs,
  loading,
  onSelectLog,
  currentPage,
  totalPages,
  onPageChange,
}: LogTableProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
      default:
        return 'neutral'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security_event':
        return 'error'
      case 'admin_action':
        return 'warning'
      case 'auth_event':
        return 'primary'
      case 'data_access':
        return 'warning'
      default:
        return 'neutral'
    }
  }

  const formatEventName = (name: string) => {
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        <p className="text-neutral-400 mt-4">Loading audit logs...</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
        <p className="text-neutral-400">No audit logs found</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950">
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Time
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Event
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Category
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                User
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Resource
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Severity
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                IP Address
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Status
              </th>
              <th className="text-left px-4 py-3 text-neutral-400 font-medium text-xs uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors cursor-pointer"
                onClick={() => onSelectLog?.(log)}
              >
                <td className="px-4 py-3">
                  <div className="text-sm text-white">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-white font-medium">
                    {log.event_name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {formatEventName(log.event_type)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getCategoryColor(log.event_category) as any}>
                    {formatEventName(log.event_category)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {log.current_user_email || log.user_email ? (
                    <div>
                      <div className="text-sm text-white">
                        {log.current_user_name || log.user_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {log.current_user_email || log.user_email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">System</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {log.resource_type ? (
                    <div>
                      <div className="text-sm text-white">
                        {log.resource_name || log.resource_id}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatEventName(log.resource_type)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(log.severity) as any}>
                      {log.severity}
                    </Badge>
                    {log.risk_score && log.risk_score > 50 && (
                      <span className="text-xs text-orange-400">
                        Risk: {log.risk_score}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-300 font-mono">
                    {log.ip_address || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {log.http_status ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.http_status >= 500 ? 'error' :
                          log.http_status >= 400 ? 'warning' :
                          'success'
                        }
                      >
                        {log.http_status}
                      </Badge>
                      {log.response_time_ms && (
                        <span className="text-xs text-neutral-500">
                          {log.response_time_ms}ms
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectLog?.(log)
                    }}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-neutral-800 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
