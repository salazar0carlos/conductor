'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Calendar,
  List,
  Activity,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { DashboardLayout, ContentSection } from '@/components/layouts'
import { StatCard } from '@/components/ui/stat-card'
import { ScheduledJob, JobExecution } from '@/types'
import { JobList } from '@/components/scheduler/job-list'
import { JobForm } from '@/components/scheduler/job-form'
import { ExecutionLog } from '@/components/scheduler/execution-log'
import { CalendarView } from '@/components/scheduler/calendar-view'
import { toast } from 'sonner'

type ViewMode = 'list' | 'calendar' | 'logs'

export default function SchedulerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [executions, setExecutions] = useState<JobExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null)
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null)

  useEffect(() => {
    fetchJobs()
    fetchExecutions()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/scheduler/jobs')
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/scheduler/execute')
      const data = await response.json()
      setExecutions(data.executions || [])
    } catch (error) {
      console.error('Error fetching executions:', error)
    }
  }

  const handleCreateJob = async (data: any) => {
    try {
      const response = await fetch('/api/scheduler/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const newJob = await response.json()
        setJobs([...jobs, newJob])
        setShowJobForm(false)
        toast.success('Job created successfully')
      } else {
        toast.error('Failed to create job')
      }
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to create job')
    }
  }

  const handleUpdateJob = async (data: any) => {
    if (!editingJob) return

    try {
      const response = await fetch(`/api/scheduler/jobs/${editingJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedJob = await response.json()
        setJobs(jobs.map((j) => (j.id === editingJob.id ? updatedJob : j)))
        setEditingJob(null)
        setShowJobForm(false)
        toast.success('Job updated successfully')
      } else {
        toast.error('Failed to update job')
      }
    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job')
    }
  }

  const handleDeleteJob = async (job: ScheduledJob) => {
    if (!confirm(`Are you sure you want to delete "${job.name}"?`)) return

    try {
      const response = await fetch(`/api/scheduler/jobs/${job.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setJobs(jobs.filter((j) => j.id !== job.id))
        toast.success('Job deleted successfully')
      } else {
        toast.error('Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
    }
  }

  const handleToggleStatus = async (job: ScheduledJob) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active'

    try {
      const response = await fetch(`/api/scheduler/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedJob = await response.json()
        setJobs(jobs.map((j) => (j.id === job.id ? updatedJob : j)))
        toast.success(`Job ${newStatus === 'active' ? 'resumed' : 'paused'}`)
      } else {
        toast.error('Failed to update job status')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      toast.error('Failed to update job status')
    }
  }

  const handleExecuteJob = async (job: ScheduledJob) => {
    try {
      const response = await fetch('/api/scheduler/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      })

      if (response.ok) {
        toast.success('Job execution started')
        // Refresh executions after a delay
        setTimeout(fetchExecutions, 1000)
      } else {
        toast.error('Failed to execute job')
      }
    } catch (error) {
      console.error('Error executing job:', error)
      toast.error('Failed to execute job')
    }
  }

  const handleViewJob = (job: ScheduledJob) => {
    setSelectedJob(job)
    // Show job details modal or navigate to detail page
    toast.info(`Viewing job: ${job.name}`)
  }

  const handleEditJob = (job: ScheduledJob) => {
    setEditingJob(job)
    setShowJobForm(true)
  }

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.status === 'active').length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter((e) => e.status === 'completed').length,
    failedExecutions: executions.filter((e) => e.status === 'failed').length,
    successRate:
      executions.length > 0
        ? Math.round(
            (executions.filter((e) => e.status === 'completed').length /
              executions.length) *
              100
          )
        : 0,
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Job Scheduler"
      subtitle="Manage and monitor scheduled jobs with advanced cron capabilities"
      headerActions={
        <button
          onClick={() => {
            setEditingJob(null)
            setShowJobForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Job
        </button>
      }
    >
      {/* Stats Dashboard */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Jobs" value={stats.totalJobs} />
          <StatCard label="Active" value={stats.activeJobs} variant="success" />
          <StatCard label="Executions" value={stats.totalExecutions} variant="primary" />
          <StatCard label="Successful" value={stats.successfulExecutions} variant="success" />
          <StatCard label="Failed" value={stats.failedExecutions} variant="error" />
          <StatCard label="Success Rate" value={`${stats.successRate}%`} variant="primary" />
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-neutral-800">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              viewMode === 'list'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <List className="w-4 h-4" />
            Job List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('logs')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              viewMode === 'logs'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Execution Logs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <ContentSection>
        {viewMode === 'list' && (
          <JobList
            jobs={jobs}
            onView={handleViewJob}
            onEdit={handleEditJob}
            onDelete={handleDeleteJob}
            onToggleStatus={handleToggleStatus}
            onExecute={handleExecuteJob}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarView
            jobs={jobs}
            executions={executions}
            onJobClick={handleViewJob}
            onExecutionClick={(execution) => {
              toast.info(`Execution ID: ${execution.id}`)
            }}
          />
        )}

        {viewMode === 'logs' && (
          <ExecutionLog executions={executions} onRefresh={fetchExecutions} />
        )}
      </ContentSection>

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center overflow-y-auto z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-neutral-800">
              <h2 className="text-2xl font-bold text-white">
                {editingJob ? 'Edit Job' : 'Create New Job'}
              </h2>
            </div>
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <JobForm
                initialData={(editingJob as any) || undefined}
                onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
                onCancel={() => {
                  setShowJobForm(false)
                  setEditingJob(null)
                }}
                isEditing={!!editingJob}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
