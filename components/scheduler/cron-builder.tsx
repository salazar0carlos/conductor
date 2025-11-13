'use client'

import { useState, useEffect } from 'react'
import cronstrue from 'cronstrue'
import { parseExpression } from 'cron-parser'
import { format, addMinutes } from 'date-fns'
import { Clock, Calendar, AlertCircle, Info } from 'lucide-react'

interface CronBuilderProps {
  value?: string
  onChange: (cronExpression: string) => void
  timezone?: string
}

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every weekday at 9am', value: '0 9 * * 1-5' },
  { label: 'Every Monday at 9am', value: '0 9 * * 1' },
  { label: 'First day of month at midnight', value: '0 0 1 * *' },
]

const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function CronBuilder({ value = '0 0 * * *', onChange, timezone = 'UTC' }: CronBuilderProps) {
  const [mode, setMode] = useState<'preset' | 'visual' | 'advanced'>('preset')
  const [cronExpression, setCronExpression] = useState(value)
  const [humanReadable, setHumanReadable] = useState('')
  const [nextExecutions, setNextExecutions] = useState<Date[]>([])
  const [error, setError] = useState('')

  // Visual builder state
  const [minute, setMinute] = useState('0')
  const [hour, setHour] = useState('0')
  const [dayOfMonth, setDayOfMonth] = useState('*')
  const [month, setMonth] = useState('*')
  const [dayOfWeek, setDayOfWeek] = useState('*')

  useEffect(() => {
    validateAndUpdateCron(cronExpression)
  }, [cronExpression, timezone])

  useEffect(() => {
    // Update cron expression when visual builder values change
    if (mode === 'visual') {
      const newCron = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
      setCronExpression(newCron)
    }
  }, [minute, hour, dayOfMonth, month, dayOfWeek, mode])

  const validateAndUpdateCron = (cron: string) => {
    try {
      // Validate cron expression
      const interval = parseExpression(cron, { tz: timezone })

      // Generate human-readable description
      const readable = cronstrue.toString(cron, {
        throwExceptionOnParseError: true,
        verbose: true
      })
      setHumanReadable(readable)

      // Calculate next 10 execution times
      const executions: Date[] = []
      for (let i = 0; i < 10; i++) {
        executions.push(interval.next().toDate())
      }
      setNextExecutions(executions)

      setError('')
      onChange(cron)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid cron expression')
      setNextExecutions([])
    }
  }

  const handlePresetSelect = (preset: string) => {
    setCronExpression(preset)
  }

  const handleAdvancedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCron = e.target.value
    setCronExpression(newCron)
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode('preset')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            mode === 'preset'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setMode('visual')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            mode === 'visual'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Visual Builder
        </button>
        <button
          onClick={() => setMode('advanced')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            mode === 'advanced'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Advanced
        </button>
      </div>

      {/* Preset Mode */}
      {mode === 'preset' && (
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className={`p-3 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors ${
                cronExpression === preset.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="font-medium text-gray-900">{preset.label}</div>
              <div className="text-xs text-gray-500 mt-1 font-mono">{preset.value}</div>
            </button>
          ))}
        </div>
      )}

      {/* Visual Builder Mode */}
      {mode === 'visual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minute */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Minute
              </label>
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="*">Every minute</option>
                <option value="*/5">Every 5 minutes</option>
                <option value="*/10">Every 10 minutes</option>
                <option value="*/15">Every 15 minutes</option>
                <option value="*/30">Every 30 minutes</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    At {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            {/* Hour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Hour
              </label>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="*">Every hour</option>
                <option value="*/2">Every 2 hours</option>
                <option value="*/3">Every 3 hours</option>
                <option value="*/6">Every 6 hours</option>
                <option value="*/12">Every 12 hours</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    At {h.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Day of Month
              </label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="*">Every day</option>
                <option value="*/2">Every 2 days</option>
                <option value="1">First day of month</option>
                <option value="15">15th of month</option>
                <option value="L">Last day of month</option>
                {DAYS_OF_MONTH.map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="*">Every month</option>
                <option value="*/3">Every 3 months</option>
                <option value="*/6">Every 6 months</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="*">Every day of week</option>
                <option value="1-5">Weekdays (Mon-Fri)</option>
                <option value="0,6">Weekends (Sat-Sun)</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Mode */}
      {mode === 'advanced' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cron Expression
          </label>
          <input
            type="text"
            value={cronExpression}
            onChange={handleAdvancedChange}
            placeholder="* * * * *"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Format: minute hour day-of-month month day-of-week
          </p>
        </div>
      )}

      {/* Current Expression Display */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-mono text-sm text-gray-900 mb-1">{cronExpression}</div>
            {humanReadable && (
              <div className="text-sm text-gray-700">{humanReadable}</div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Executions */}
      {nextExecutions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Next 10 Executions ({timezone})
          </h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {nextExecutions.map((execution, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <span className="text-gray-600">#{index + 1}</span>
                <span className="font-medium text-gray-900">
                  {format(execution, 'MMM dd, yyyy HH:mm:ss')}
                </span>
                <span className="text-gray-500">
                  {format(execution, 'EEEE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
