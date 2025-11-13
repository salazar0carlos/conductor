'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface LogFilters {
  search?: string
  event_category?: string
  event_type?: string
  severity?: string
  user_id?: string
  resource_type?: string
  start_date?: string
  end_date?: string
  ip_address?: string
}

interface LogFiltersProps {
  filters: LogFilters
  onFiltersChange: (filters: LogFilters) => void
  onReset: () => void
}

export function LogFilters({ filters, onFiltersChange, onReset }: LogFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LogFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleChange = (key: keyof LogFilters, value: string) => {
    const newFilters = {
      ...localFilters,
      [key]: value || undefined,
    }
    setLocalFilters(newFilters)
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
  }

  const handleReset = () => {
    setLocalFilters({})
    onReset()
  }

  const eventCategories = [
    { value: 'user_action', label: 'User Action' },
    { value: 'auth_event', label: 'Auth Event' },
    { value: 'permission_change', label: 'Permission Change' },
    { value: 'data_access', label: 'Data Access' },
    { value: 'system_event', label: 'System Event' },
    { value: 'security_event', label: 'Security Event' },
    { value: 'integration_event', label: 'Integration Event' },
    { value: 'admin_action', label: 'Admin Action' },
  ]

  const severities = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' },
  ]

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" variant="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Search
          </label>
          <Input
            placeholder="Search logs..."
            value={localFilters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Event Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Event Category
          </label>
          <select
            value={localFilters.event_category || ''}
            onChange={(e) => handleChange('event_category', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="">All Categories</option>
            {eventCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Severity
          </label>
          <select
            value={localFilters.severity || ''}
            onChange={(e) => handleChange('severity', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="">All Severities</option>
            {severities.map((sev) => (
              <option key={sev.value} value={sev.value}>
                {sev.label}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Resource Type
          </label>
          <Input
            placeholder="e.g., project, task, user"
            value={localFilters.resource_type || ''}
            onChange={(e) => handleChange('resource_type', e.target.value)}
          />
        </div>

        {/* IP Address */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            IP Address
          </label>
          <Input
            placeholder="192.168.1.1"
            value={localFilters.ip_address || ''}
            onChange={(e) => handleChange('ip_address', e.target.value)}
          />
        </div>

        {/* User ID */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            User ID
          </label>
          <Input
            placeholder="User UUID"
            value={localFilters.user_id || ''}
            onChange={(e) => handleChange('user_id', e.target.value)}
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={localFilters.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            End Date
          </label>
          <input
            type="datetime-local"
            value={localFilters.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>
    </div>
  )
}
