'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Link from 'next/link'

interface BackgroundJob {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying'
  payload: any
  result: any
  error_message?: string
  attempts: number
  max_attempts: number
  scheduled_at: string
  started_at?: string
  completed_at?: string
  next_retry_at?: string
  created_at: string
  updated_at: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<BackgroundJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchQuery, statusFilter])

  const fetchJobs = async () => {
    if (!loading) setRefreshing(true)

    try {
      const response = await fetch('/api/jobs?limit=200')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        job =>
          job.type.toLowerCase().includes(query) ||
          job.id.toLowerCase().includes(query) ||
          job.status.toLowerCase().includes(query)
      )
    }

    setFilteredJobs(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />
      case 'retrying':
        return <RefreshCw className="w-5 h-5 text-orange-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'retrying':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) return 'Just now'

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }

    // More than 24 hours
    return date.toLocaleDateString()
  }

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    retrying: jobs.filter(j => j.status === 'retrying').length
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-900">
        <Nav />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Nav />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/automation">
                <Button variant="ghost" size="sm">← Back</Button>
              </Link>
              <h1 className="text-3xl font-bold text-white">Background Jobs</h1>
            </div>
            <p className="text-neutral-400">Monitor and manage background job execution</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchJobs}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <StatBadge label="Total" count={stats.total} onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
          <StatBadge label="Pending" count={stats.pending} color="yellow" onClick={() => setStatusFilter('pending')} active={statusFilter === 'pending'} />
          <StatBadge label="Running" count={stats.running} color="blue" onClick={() => setStatusFilter('running')} active={statusFilter === 'running'} />
          <StatBadge label="Completed" count={stats.completed} color="green" onClick={() => setStatusFilter('completed')} active={statusFilter === 'completed'} />
          <StatBadge label="Failed" count={stats.failed} color="red" onClick={() => setStatusFilter('failed')} active={statusFilter === 'failed'} />
          <StatBadge label="Retrying" count={stats.retrying} color="orange" onClick={() => setStatusFilter('retrying')} active={statusFilter === 'retrying'} />
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search jobs by type, ID, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400">
                {searchQuery || statusFilter !== 'all' ? 'No jobs match your filters' : 'No background jobs'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-700">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-neutral-900/50 transition-colors">
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  >
                    <div className="mt-1">{getStatusIcon(job.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-white capitalize mb-1">
                            {job.type.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-xs text-neutral-400 font-mono">
                            {job.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          {expandedJob === job.id ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                        <span>
                          Attempts: <span className="text-white">{job.attempts}/{job.max_attempts}</span>
                        </span>
                        <span>
                          Created: <span className="text-white">{formatDate(job.created_at)}</span>
                        </span>
                        {job.next_retry_at && (
                          <span>
                            Next retry: <span className="text-white">{formatDate(job.next_retry_at)}</span>
                          </span>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {expandedJob === job.id && (
                        <div className="mt-4 space-y-3">
                          {job.error_message && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                              <p className="text-sm text-red-300">{job.error_message}</p>
                            </div>
                          )}

                          {job.payload && (
                            <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                              <p className="text-xs font-medium text-neutral-400 mb-2">Payload</p>
                              <pre className="text-xs text-neutral-300 overflow-x-auto">
                                {JSON.stringify(job.payload, null, 2)}
                              </pre>
                            </div>
                          )}

                          {job.result && (
                            <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                              <p className="text-xs font-medium text-neutral-400 mb-2">Result</p>
                              <pre className="text-xs text-neutral-300 overflow-x-auto">
                                {JSON.stringify(job.result, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-neutral-400 mb-1">Scheduled At</p>
                              <p className="text-white">{new Date(job.scheduled_at).toLocaleString()}</p>
                            </div>
                            {job.started_at && (
                              <div>
                                <p className="text-neutral-400 mb-1">Started At</p>
                                <p className="text-white">{new Date(job.started_at).toLocaleString()}</p>
                              </div>
                            )}
                            {job.completed_at && (
                              <div>
                                <p className="text-neutral-400 mb-1">Completed At</p>
                                <p className="text-white">{new Date(job.completed_at).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

interface StatBadgeProps {
  label: string
  count: number
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange'
  onClick: () => void
  active: boolean
}

function StatBadge({ label, count, color, onClick, active }: StatBadgeProps) {
  const colors = {
    blue: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    green: 'border-green-500/50 bg-green-500/10 text-green-400',
    red: 'border-red-500/50 bg-red-500/10 text-red-400',
    yellow: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    orange: 'border-orange-500/50 bg-orange-500/10 text-orange-400'
  }

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border transition-all ${
        active
          ? color
            ? colors[color]
            : 'border-white/50 bg-white/10 text-white'
          : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
      }`}
    >
      <div className="text-2xl font-bold mb-1">{count}</div>
      <div className="text-xs">{label}</div>
    </button>
  )
}
