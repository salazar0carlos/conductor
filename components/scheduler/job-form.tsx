'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Globe,
  Database,
  Code,
  Brain,
  Workflow,
  RefreshCw,
  Archive,
  FileText,
  Save,
  X,
} from 'lucide-react'
import {
  JobType,
  JobConfig,
  RetryConfig,
  CreateScheduledJobRequest,
  UpdateScheduledJobRequest,
} from '@/types'
import { ScheduleConfigComponent } from './schedule-config'

interface JobFormProps {
  initialData?: Partial<CreateScheduledJobRequest>
  onSubmit: (data: CreateScheduledJobRequest | UpdateScheduledJobRequest) => void
  onCancel: () => void
  isEditing?: boolean
}

const JOB_TYPES = [
  {
    type: 'http_request' as JobType,
    label: 'HTTP Request',
    description: 'Make HTTP/REST API calls',
    icon: Globe,
  },
  {
    type: 'database_query' as JobType,
    label: 'Database Query',
    description: 'Execute database queries',
    icon: Database,
  },
  {
    type: 'script' as JobType,
    label: 'Script Execution',
    description: 'Run custom scripts',
    icon: Code,
  },
  {
    type: 'ai_task' as JobType,
    label: 'AI Task',
    description: 'Execute AI-powered tasks',
    icon: Brain,
  },
  {
    type: 'workflow' as JobType,
    label: 'Workflow',
    description: 'Trigger workflow execution',
    icon: Workflow,
  },
  {
    type: 'data_sync' as JobType,
    label: 'Data Sync',
    description: 'Synchronize data between systems',
    icon: RefreshCw,
  },
  {
    type: 'backup' as JobType,
    label: 'Backup',
    description: 'Create backups',
    icon: Archive,
  },
  {
    type: 'report' as JobType,
    label: 'Report Generation',
    description: 'Generate and send reports',
    icon: FileText,
  },
]

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

export function JobForm({ initialData, onSubmit, onCancel, isEditing = false }: JobFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      timezone: initialData?.timezone || 'UTC',
      priority: initialData?.priority || 5,
      timeout_seconds: initialData?.timeout_seconds || 300,
      max_concurrent: initialData?.max_concurrent || 1,
    },
  })

  const [jobType, setJobType] = useState<JobType>(
    initialData?.job_type || 'http_request'
  )
  const [jobConfig, setJobConfig] = useState<JobConfig>(
    initialData?.job_config || {}
  )
  const [scheduleConfig, setScheduleConfig] = useState({
    type: initialData?.schedule_type || ('cron' as const),
    config: initialData?.schedule_config || { cron_expression: '0 0 * * *' },
  })
  const [retryConfig, setRetryConfig] = useState<RetryConfig>(
    initialData?.retry_config || {
      max_attempts: 3,
      initial_delay_seconds: 60,
      max_delay_seconds: 3600,
      backoff_multiplier: 2,
    }
  )

  const handleFormSubmit = (data: any) => {
    const submitData = {
      ...data,
      job_type: jobType,
      job_config: jobConfig,
      schedule_type: scheduleConfig.type,
      schedule_config: scheduleConfig.config,
      retry_config: retryConfig,
    }

    onSubmit(submitData)
  }

  const updateJobConfig = (updates: Partial<JobConfig>) => {
    setJobConfig({ ...jobConfig, ...updates })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Name *
          </label>
          <input
            {...register('name', { required: 'Job name is required' })}
            type="text"
            placeholder="e.g., Daily Report Generation"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe what this job does..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Job Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Job Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {JOB_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.type}
                type="button"
                onClick={() => {
                  setJobType(type.type)
                  setJobConfig({}) // Reset config when changing type
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  jobType === type.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mb-2 ${
                    jobType === type.type ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                <div
                  className={`text-sm font-medium mb-1 ${
                    jobType === type.type ? 'text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {type.label}
                </div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Job Configuration (Type-specific) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Job Configuration</h3>

        {/* HTTP Request */}
        {jobType === 'http_request' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <input
                type="url"
                value={jobConfig.url || ''}
                onChange={(e) => updateJobConfig({ url: e.target.value })}
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                value={jobConfig.method || 'GET'}
                onChange={(e) => updateJobConfig({ method: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {HTTP_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers (JSON)
              </label>
              <textarea
                value={JSON.stringify(jobConfig.headers || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value)
                    updateJobConfig({ headers })
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={4}
                placeholder='{"Content-Type": "application/json"}'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {jobConfig.method !== 'GET' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body (JSON)
                </label>
                <textarea
                  value={
                    typeof jobConfig.body === 'string'
                      ? jobConfig.body
                      : JSON.stringify(jobConfig.body || {}, null, 2)
                  }
                  onChange={(e) => {
                    try {
                      const body = JSON.parse(e.target.value)
                      updateJobConfig({ body })
                    } catch (err) {
                      updateJobConfig({ body: e.target.value })
                    }
                  }}
                  rows={6}
                  placeholder='{"key": "value"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Database Query */}
        {jobType === 'database_query' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection ID
              </label>
              <input
                type="text"
                value={jobConfig.connection_id || ''}
                onChange={(e) => updateJobConfig({ connection_id: e.target.value })}
                placeholder="Database connection identifier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SQL Query
              </label>
              <textarea
                value={jobConfig.query || ''}
                onChange={(e) => updateJobConfig({ query: e.target.value })}
                rows={8}
                placeholder="SELECT * FROM users WHERE created_at > :start_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Script Execution */}
        {jobType === 'script' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={jobConfig.language || 'javascript'}
                onChange={(e) =>
                  updateJobConfig({ language: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="shell">Shell</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script
              </label>
              <textarea
                value={jobConfig.script || ''}
                onChange={(e) => updateJobConfig({ script: e.target.value })}
                rows={12}
                placeholder="// Your script here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* AI Task */}
        {jobType === 'ai_task' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <input
                type="text"
                value={jobConfig.ai_provider || ''}
                onChange={(e) => updateJobConfig({ ai_provider: e.target.value })}
                placeholder="e.g., openai, anthropic"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={jobConfig.ai_model || ''}
                onChange={(e) => updateJobConfig({ ai_model: e.target.value })}
                placeholder="e.g., gpt-4, claude-3-opus"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={jobConfig.prompt || ''}
                onChange={(e) => updateJobConfig({ prompt: e.target.value })}
                rows={6}
                placeholder="Enter the AI prompt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Workflow */}
        {jobType === 'workflow' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow ID
              </label>
              <input
                type="text"
                value={jobConfig.workflow_id || ''}
                onChange={(e) => updateJobConfig({ workflow_id: e.target.value })}
                placeholder="Workflow identifier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Other job types can be added similarly */}
      </div>

      {/* Schedule Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
        <ScheduleConfigComponent
          value={scheduleConfig}
          onChange={setScheduleConfig}
          timezone={watch('timezone')}
        />
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              {...register('timezone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (1-10)
            </label>
            <input
              {...register('priority', { min: 1, max: 10 })}
              type="number"
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (seconds)
            </label>
            <input
              {...register('timeout_seconds')}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Retry Configuration */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <h4 className="font-medium text-gray-900">Retry Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Max Attempts
              </label>
              <input
                type="number"
                min="1"
                value={retryConfig.max_attempts}
                onChange={(e) =>
                  setRetryConfig({
                    ...retryConfig,
                    max_attempts: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Initial Delay (seconds)
              </label>
              <input
                type="number"
                min="1"
                value={retryConfig.initial_delay_seconds}
                onChange={(e) =>
                  setRetryConfig({
                    ...retryConfig,
                    initial_delay_seconds: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Max Delay (seconds)
              </label>
              <input
                type="number"
                min="1"
                value={retryConfig.max_delay_seconds}
                onChange={(e) =>
                  setRetryConfig({
                    ...retryConfig,
                    max_delay_seconds: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Backoff Multiplier
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={retryConfig.backoff_multiplier}
                onChange={(e) =>
                  setRetryConfig({
                    ...retryConfig,
                    backoff_multiplier: parseFloat(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isEditing ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  )
}
