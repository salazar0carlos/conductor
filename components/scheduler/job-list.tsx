'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Play,
  Pause,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
} from 'lucide-react'
import { ScheduledJob, JobStatus, JobType } from '@/types'

interface JobListProps {
  jobs: ScheduledJob[]
  onView: (job: ScheduledJob) => void
  onEdit: (job: ScheduledJob) => void
  onDelete: (job: ScheduledJob) => void
  onToggleStatus: (job: ScheduledJob) => void
  onExecute: (job: ScheduledJob) => void
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  disabled: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
}

const JOB_TYPE_LABELS = {
  http_request: 'HTTP',
  database_query: 'Database',
  script: 'Script',
  ai_task: 'AI',
  workflow: 'Workflow',
  data_sync: 'Data Sync',
  backup: 'Backup',
  report: 'Report',
}

export function JobList({
  jobs,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onExecute,
}: JobListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === '' ||
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesType = typeFilter === 'all' || job.job_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getSuccessRate = (job: ScheduledJob) => {
    if (job.run_count === 0) return 0
    return Math.round((job.success_count / job.run_count) * 100)
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
            placeholder="Search jobs..."
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
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Types</option>
          {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <button
                          onClick={() => onView(job)}
                          className="font-medium text-gray-900 hover:text-blue-600 text-left"
                        >
                          {job.name}
                        </button>
                        {job.description && (
                          <span className="text-sm text-gray-500 mt-1">
                            {job.description.length > 60
                              ? `${job.description.slice(0, 60)}...`
                              : job.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {JOB_TYPE_LABELS[job.job_type]}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="capitalize">{job.schedule_type}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[job.status]
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {job.last_run_at
                        ? formatDistanceToNow(new Date(job.last_run_at), {
                            addSuffix: true,
                          })
                        : 'Never'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {job.next_run_at
                        ? formatDistanceToNow(new Date(job.next_run_at), {
                            addSuffix: true,
                          })
                        : '-'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getSuccessRate(job) >= 80
                                ? 'bg-green-500'
                                : getSuccessRate(job) >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${getSuccessRate(job)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 min-w-[3rem]">
                          {getSuccessRate(job)}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onExecute(job)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Run now"
                        >
                          <Play className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(job)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title={job.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {job.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => onEdit(job)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onView(job)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDelete(job)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Total Jobs</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{jobs.length}</div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {jobs.filter((j) => j.status === 'active').length}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Paused</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {jobs.filter((j) => j.status === 'paused').length}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Average Success Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {jobs.length > 0
              ? Math.round(
                  jobs.reduce((acc, job) => acc + getSuccessRate(job), 0) /
                    jobs.length
                )
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  )
}
