'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ScheduledJob, JobExecution } from '@/types'

interface CalendarViewProps {
  jobs: ScheduledJob[]
  executions: JobExecution[]
  onJobClick?: (job: ScheduledJob) => void
  onExecutionClick?: (execution: JobExecution) => void
  onDateClick?: (date: Date) => void
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end?: Date
  backgroundColor: string
  borderColor: string
  extendedProps: {
    type: 'job' | 'execution'
    data: ScheduledJob | JobExecution
  }
}

const JOB_COLORS = {
  active: { bg: '#3B82F6', border: '#2563EB' }, // blue
  paused: { bg: '#EAB308', border: '#CA8A04' }, // yellow
  disabled: { bg: '#6B7280', border: '#4B5563' }, // gray
  expired: { bg: '#EF4444', border: '#DC2626' }, // red
}

const EXECUTION_COLORS = {
  pending: { bg: '#9CA3AF', border: '#6B7280' },
  running: { bg: '#3B82F6', border: '#2563EB' },
  completed: { bg: '#10B981', border: '#059669' },
  failed: { bg: '#EF4444', border: '#DC2626' },
  cancelled: { bg: '#6B7280', border: '#4B5563' },
  timeout: { bg: '#F59E0B', border: '#D97706' },
}

export function CalendarView({
  jobs,
  executions,
  onJobClick,
  onExecutionClick,
  onDateClick,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<'all' | 'scheduled' | 'executions'>('all')

  useEffect(() => {
    const calendarEvents: CalendarEvent[] = []

    // Add scheduled jobs (upcoming runs)
    if (view === 'all' || view === 'scheduled') {
      jobs.forEach((job) => {
        if (job.next_run_at && job.status === 'active') {
          const colors = JOB_COLORS[job.status]
          calendarEvents.push({
            id: `job-${job.id}`,
            title: `⏱️ ${job.name}`,
            start: new Date(job.next_run_at),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            extendedProps: {
              type: 'job',
              data: job,
            },
          })
        }
      })
    }

    // Add execution history
    if (view === 'all' || view === 'executions') {
      executions.forEach((execution) => {
        const colors = EXECUTION_COLORS[execution.status]
        const startTime = execution.started_at || execution.scheduled_at
        const endTime = execution.completed_at

        calendarEvents.push({
          id: `execution-${execution.id}`,
          title: `${execution.status === 'completed' ? '✓' : execution.status === 'failed' ? '✗' : '○'} Execution #${execution.attempt_number}`,
          start: new Date(startTime),
          end: endTime ? new Date(endTime) : undefined,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          extendedProps: {
            type: 'execution',
            data: execution,
          },
        })
      })
    }

    setEvents(calendarEvents)
  }, [jobs, executions, view])

  const handleEventClick = (info: any) => {
    const event = info.event
    const { type, data } = event.extendedProps

    if (type === 'job' && onJobClick) {
      onJobClick(data as ScheduledJob)
    } else if (type === 'execution' && onExecutionClick) {
      onExecutionClick(data as JobExecution)
    }
  }

  const handleDateClick = (info: any) => {
    if (onDateClick) {
      onDateClick(info.date)
    }
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setView('scheduled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'scheduled'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Scheduled Only
          </button>
          <button
            onClick={() => setView('executions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'executions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Executions Only
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600">Failed</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
          }}
          nowIndicator
          editable={false}
          selectable
          selectMirror
          dayMaxEvents={3}
          eventDisplay="block"
          displayEventTime={true}
          displayEventEnd={false}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Upcoming Jobs</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {jobs.filter((j) => j.next_run_at && j.status === 'active').length}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Total Executions</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {executions.length}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {executions.filter((e) => e.status === 'completed').length}
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {executions.filter((e) => e.status === 'failed').length}
          </div>
        </div>
      </div>
    </div>
  )
}
