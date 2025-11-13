'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AuditLog } from './log-table'

interface LogDetailProps {
  log: AuditLog | null
  onClose: () => void
}

export function LogDetail({ log, onClose }: LogDetailProps) {
  if (!log) return null

  const formatEventName = (name: string) => {
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const renderJsonDiff = () => {
    if (!log.changes || Object.keys(log.changes).length === 0) {
      return <p className="text-neutral-400 text-sm">No changes recorded</p>
    }

    return (
      <div className="space-y-3">
        {Object.entries(log.changes).map(([key, value]: [string, any]) => (
          <div key={key} className="bg-neutral-950 rounded p-3">
            <div className="font-mono text-sm text-white mb-2">{key}</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-red-400 mb-1">Old Value</div>
                <pre className="text-xs text-neutral-300 bg-red-950/20 border border-red-900/20 rounded p-2 overflow-x-auto">
                  {JSON.stringify(value.old, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs text-green-400 mb-1">New Value</div>
                <pre className="text-xs text-neutral-300 bg-green-950/20 border border-green-900/20 rounded p-2 overflow-x-auto">
                  {JSON.stringify(value.new, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderJson = (data: any, title: string) => {
    if (!data || Object.keys(data).length === 0) return null

    return (
      <div>
        <h4 className="text-sm font-medium text-neutral-400 mb-2">{title}</h4>
        <pre className="text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded p-3 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{log.event_name}</h2>
            <p className="text-sm text-neutral-400">
              {new Date(log.created_at).toLocaleString()}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Event Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Category
              </label>
              <Badge variant="primary">{formatEventName(log.event_category)}</Badge>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Event Type
              </label>
              <Badge variant="neutral">{formatEventName(log.event_type)}</Badge>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Severity
              </label>
              <Badge
                variant={
                  log.severity === 'critical' || log.severity === 'error' ? 'error' :
                  log.severity === 'warning' ? 'warning' :
                  'success'
                }
              >
                {log.severity}
              </Badge>
            </div>
            {log.risk_score && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Risk Score
                </label>
                <Badge variant={log.risk_score > 70 ? 'error' : log.risk_score > 40 ? 'warning' : 'neutral'}>
                  {log.risk_score}/100
                </Badge>
              </div>
            )}
          </div>

          {/* User Information */}
          {(log.user_email || log.current_user_email) && (
            <div className="bg-neutral-950 border border-neutral-800 rounded p-4">
              <h3 className="text-sm font-semibold text-white mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-500">Name:</span>{' '}
                  <span className="text-white">{log.current_user_name || log.user_name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Email:</span>{' '}
                  <span className="text-white">{log.current_user_email || log.user_email}</span>
                </div>
                {log.user_id && (
                  <div className="col-span-2">
                    <span className="text-neutral-500">User ID:</span>{' '}
                    <span className="text-white font-mono text-xs">{log.user_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resource Information */}
          {log.resource_type && (
            <div className="bg-neutral-950 border border-neutral-800 rounded p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Resource Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-500">Type:</span>{' '}
                  <span className="text-white">{formatEventName(log.resource_type)}</span>
                </div>
                <div>
                  <span className="text-neutral-500">ID:</span>{' '}
                  <span className="text-white font-mono text-xs">{log.resource_id}</span>
                </div>
                {log.resource_name && (
                  <div className="col-span-2">
                    <span className="text-neutral-500">Name:</span>{' '}
                    <span className="text-white">{log.resource_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Request Details */}
          {(log.http_method || log.http_status) && (
            <div className="bg-neutral-950 border border-neutral-800 rounded p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Request Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {log.http_method && (
                  <div>
                    <span className="text-neutral-500">Method:</span>{' '}
                    <Badge variant="neutral">{log.http_method}</Badge>
                  </div>
                )}
                {log.http_status && (
                  <div>
                    <span className="text-neutral-500">Status:</span>{' '}
                    <Badge
                      variant={
                        log.http_status >= 500 ? 'error' :
                        log.http_status >= 400 ? 'warning' :
                        'success'
                      }
                    >
                      {log.http_status}
                    </Badge>
                  </div>
                )}
                {log.response_time_ms && (
                  <div>
                    <span className="text-neutral-500">Response Time:</span>{' '}
                    <span className="text-white">{log.response_time_ms}ms</span>
                  </div>
                )}
                {log.ip_address && (
                  <div>
                    <span className="text-neutral-500">IP Address:</span>{' '}
                    <span className="text-white font-mono">{log.ip_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes (Diff) */}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <div className="bg-neutral-950 border border-neutral-800 rounded p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Changes</h3>
              {renderJsonDiff()}
            </div>
          )}

          {/* Old Values */}
          {log.old_values && renderJson(log.old_values, 'Previous State')}

          {/* New Values */}
          {log.new_values && renderJson(log.new_values, 'New State')}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && renderJson(log.metadata, 'Additional Metadata')}

          {/* Security Indicators */}
          {(log.is_sensitive || log.risk_score) && (
            <div className="bg-red-950/20 border border-red-900/20 rounded p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Security Information</h3>
              <div className="space-y-2 text-sm">
                {log.is_sensitive && (
                  <div className="flex items-center gap-2">
                    <Badge variant="error">Sensitive Data</Badge>
                    <span className="text-neutral-300">This event involves sensitive information</span>
                  </div>
                )}
                {log.risk_score && log.risk_score > 50 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">High Risk</Badge>
                    <span className="text-neutral-300">Risk score: {log.risk_score}/100</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
