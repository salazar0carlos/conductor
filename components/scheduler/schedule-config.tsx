'use client'

import { useState } from 'react'
import { Calendar, Clock, Repeat, Zap } from 'lucide-react'
import { ScheduleType, ScheduleConfig } from '@/types'
import { CronBuilder } from './cron-builder'

interface ScheduleConfigProps {
  value: {
    type: ScheduleType
    config: ScheduleConfig
  }
  onChange: (value: { type: ScheduleType; config: ScheduleConfig }) => void
  timezone?: string
}

const SCHEDULE_TYPES = [
  {
    type: 'cron' as ScheduleType,
    label: 'Cron Expression',
    description: 'Traditional cron scheduling with full flexibility',
    icon: Clock,
  },
  {
    type: 'interval' as ScheduleType,
    label: 'Interval',
    description: 'Run every X minutes, hours, or days',
    icon: Repeat,
  },
  {
    type: 'one-time' as ScheduleType,
    label: 'One-time',
    description: 'Execute once at a specific date and time',
    icon: Zap,
  },
  {
    type: 'recurring' as ScheduleType,
    label: 'Recurring',
    description: 'Daily, weekly, or monthly patterns',
    icon: Calendar,
  },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

export function ScheduleConfigComponent({ value, onChange, timezone = 'UTC' }: ScheduleConfigProps) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>(value.type)
  const [config, setConfig] = useState<ScheduleConfig>(value.config)

  const handleTypeChange = (type: ScheduleType) => {
    setScheduleType(type)

    // Initialize default config based on type
    let defaultConfig: ScheduleConfig = {}

    switch (type) {
      case 'cron':
        defaultConfig = { cron_expression: '0 0 * * *' }
        break
      case 'interval':
        defaultConfig = { interval_value: 1, interval_unit: 'hours' }
        break
      case 'one-time':
        defaultConfig = { run_at: new Date(Date.now() + 3600000).toISOString() }
        break
      case 'recurring':
        defaultConfig = {
          recurring_pattern: {
            frequency: 'daily',
            time: '09:00',
          },
        }
        break
    }

    setConfig(defaultConfig)
    onChange({ type, config: defaultConfig })
  }

  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onChange({ type: scheduleType, config: newConfig })
  }

  return (
    <div className="space-y-6">
      {/* Schedule Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Schedule Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCHEDULE_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.type}
                onClick={() => handleTypeChange(type.type)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  scheduleType === type.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`w-5 h-5 mt-0.5 ${
                      scheduleType === type.type ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`font-medium mb-1 ${
                        scheduleType === type.type ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {type.label}
                    </div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cron Configuration */}
      {scheduleType === 'cron' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Cron Schedule
          </label>
          <CronBuilder
            value={config.cron_expression}
            onChange={(cron) => updateConfig({ cron_expression: cron })}
            timezone={timezone}
          />
        </div>
      )}

      {/* Interval Configuration */}
      {scheduleType === 'interval' && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-900">
            Interval Schedule
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-2">Every</label>
              <input
                type="number"
                min="1"
                value={config.interval_value || 1}
                onChange={(e) =>
                  updateConfig({ interval_value: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-2">Unit</label>
              <select
                value={config.interval_unit || 'hours'}
                onChange={(e) =>
                  updateConfig({
                    interval_unit: e.target.value as 'minutes' | 'hours' | 'days',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Job will run every {config.interval_value || 1}{' '}
              {config.interval_unit || 'hours'}
            </p>
          </div>
        </div>
      )}

      {/* One-time Configuration */}
      {scheduleType === 'one-time' && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-900">
            Execution Date & Time
          </label>
          <input
            type="datetime-local"
            value={
              config.run_at
                ? new Date(config.run_at).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              updateConfig({ run_at: new Date(e.target.value).toISOString() })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {config.run_at && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Job will execute once on{' '}
                {new Date(config.run_at).toLocaleString('en-US', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                  timeZone: timezone,
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recurring Configuration */}
      {scheduleType === 'recurring' && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-900">
            Recurring Pattern
          </label>

          {/* Frequency */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Frequency</label>
            <select
              value={config.recurring_pattern?.frequency || 'daily'}
              onChange={(e) =>
                updateConfig({
                  recurring_pattern: {
                    ...config.recurring_pattern,
                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Time</label>
            <input
              type="time"
              value={config.recurring_pattern?.time || '09:00'}
              onChange={(e) =>
                updateConfig({
                  recurring_pattern: {
                    ...config.recurring_pattern,
                    time: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Days of Week (Weekly) */}
          {config.recurring_pattern?.frequency === 'weekly' && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">Days of Week</label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = config.recurring_pattern?.days_of_week?.includes(
                    day.value
                  )
                  return (
                    <button
                      key={day.value}
                      onClick={() => {
                        const current = config.recurring_pattern?.days_of_week || []
                        const updated = isSelected
                          ? current.filter((d) => d !== day.value)
                          : [...current, day.value].sort()
                        updateConfig({
                          recurring_pattern: {
                            ...config.recurring_pattern,
                            days_of_week: updated,
                          },
                        })
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Day of Month (Monthly) */}
          {config.recurring_pattern?.frequency === 'monthly' && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={config.recurring_pattern?.day_of_month || 1}
                onChange={(e) =>
                  updateConfig({
                    recurring_pattern: {
                      ...config.recurring_pattern,
                      day_of_month: parseInt(e.target.value) || 1,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              {config.recurring_pattern?.frequency === 'daily' &&
                `Job will run every day at ${config.recurring_pattern?.time || '09:00'}`}
              {config.recurring_pattern?.frequency === 'weekly' &&
                `Job will run every ${
                  config.recurring_pattern?.days_of_week?.length
                    ? DAYS_OF_WEEK.filter((d) =>
                        config.recurring_pattern?.days_of_week?.includes(d.value)
                      )
                        .map((d) => d.label)
                        .join(', ')
                    : 'week'
                } at ${config.recurring_pattern?.time || '09:00'}`}
              {config.recurring_pattern?.frequency === 'monthly' &&
                `Job will run on day ${config.recurring_pattern?.day_of_month || 1} of every month at ${
                  config.recurring_pattern?.time || '09:00'
                }`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
