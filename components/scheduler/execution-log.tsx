'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  Ban,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { JobExecution, ExecutionStatus } from '@/types'

interface ExecutionLogProps {
  executions: JobExecution[]
  onRefresh?: () => void
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  running: { icon: Loader, color: 'text-blue-500', bg: 'bg-blue-100' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  cancelled: { icon: Ban, color: 'text-gray-500', bg: 'bg-gray-100' },
  timeout: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-100' },
}

export function ExecutionLog({ executions, onRefresh }: ExecutionLogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const filteredExecutions = executions.filter((exec) => {
    const matchesSearch =
      searchQuery === '' ||
      exec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.job_id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search executions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Execution List */}
      <div className="space-y-2">
        {filteredExecutions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
            No executions found
          </div>
        ) : (
          filteredExecutions.map((execution) => {
            const StatusIcon = STATUS_CONFIG[execution.status].icon
            const isExpanded = expandedIds.has(execution.id)

            return (
              <div
                key={execution.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Execution Header */}
                <div
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpanded(execution.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Expand/Collapse */}
                    <button className="text-gray-400 hover:text-gray-600">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {/* Status Icon */}
                    <div
                      className={`p-2 rounded-full ${
                        STATUS_CONFIG[execution.status].bg
                      }`}
                    >
                      <StatusIcon
                        className={`w-5 h-5 ${
                          STATUS_CONFIG[execution.status].color
                        } ${execution.status === 'running' ? 'animate-spin' : ''}`}
                      />
                    </div>

                    {/* Execution Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-gray-600">
                          {execution.id.slice(0, 8)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_CONFIG[execution.status].bg
                          } ${STATUS_CONFIG[execution.status].color}`}
                        >
                          {execution.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          Attempt #{execution.attempt_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>
                          {execution.started_at
                            ? format(
                                new Date(execution.started_at),
                                'MMM dd, yyyy HH:mm:ss'
                              )
                            : format(
                                new Date(execution.scheduled_at),
                                'MMM dd, yyyy HH:mm:ss'
                              )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(execution.duration_ms)}
                        </span>
                        <span className="capitalize">{execution.trigger_type}</span>
                      </div>
                    </div>

                    {/* Quick Error Preview */}
                    {execution.error_message && !isExpanded && (
                      <div className="max-w-md text-sm text-red-600 truncate">
                        {execution.error_message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Execution Details (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                    {/* Timing Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Scheduled At</div>
                        <div className="text-sm text-gray-900">
                          {format(
                            new Date(execution.scheduled_at),
                            'MMM dd, yyyy HH:mm:ss'
                          )}
                        </div>
                      </div>

                      {execution.started_at && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Started At</div>
                          <div className="text-sm text-gray-900">
                            {format(
                              new Date(execution.started_at),
                              'MMM dd, yyyy HH:mm:ss'
                            )}
                          </div>
                        </div>
                      )}

                      {execution.completed_at && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Completed At</div>
                          <div className="text-sm text-gray-900">
                            {format(
                              new Date(execution.completed_at),
                              'MMM dd, yyyy HH:mm:ss'
                            )}
                          </div>
                        </div>
                      )}

                      {execution.duration_ms !== null && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Duration</div>
                          <div className="text-sm text-gray-900">
                            {formatDuration(execution.duration_ms)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Output */}
                    {execution.output && Object.keys(execution.output).length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Output</div>
                        <pre className="p-3 bg-white border border-gray-200 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(execution.output, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Error Details */}
                    {execution.error_message && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Error</div>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-sm text-red-900 font-medium mb-2">
                            {execution.error_message}
                          </div>
                          {execution.error_stack && (
                            <pre className="text-xs text-red-800 overflow-x-auto">
                              {execution.error_stack}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {execution.metadata && Object.keys(execution.metadata).length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Metadata</div>
                        <pre className="p-3 bg-white border border-gray-200 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(execution.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = executions.filter((e) => e.status === status).length
          const Icon = config.icon
          return (
            <div
              key={status}
              className="p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-full ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className="text-xs text-gray-600 capitalize">{status}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
