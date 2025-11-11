'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/auth-context'
import type { SystemSetting, AdminStatistics, SettingCategory } from '@/types'

export function AdminSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [filteredSettings, setFilteredSettings] = useState<SystemSetting[]>([])
  const [stats, setStats] = useState<AdminStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory | 'all'>('all')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const categories: Array<SettingCategory | 'all'> = [
    'all',
    'general',
    'agents',
    'tasks',
    'notifications',
    'integrations',
    'security'
  ]

  useEffect(() => {
    fetchSettings()
    fetchStats()
  }, [])

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredSettings(settings)
    } else {
      setFilteredSettings(settings.filter(s => s.category === selectedCategory))
    }
  }, [selectedCategory, settings])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/settings')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch settings')
      }

      if (data.success) {
        setSettings(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key)
    setEditValue(JSON.stringify(setting.value))
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const handleSave = async (key: string) => {
    try {
      let parsedValue: unknown
      try {
        parsedValue = JSON.parse(editValue)
      } catch {
        // If parsing fails, treat as string
        parsedValue = editValue
      }

      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parsedValue })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update setting')
      }

      // Refresh settings
      await fetchSettings()
      setEditingKey(null)
      setEditValue('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update setting')
    }
  }

  const renderValue = (setting: SystemSetting) => {
    const value = setting.value

    if (editingKey === setting.key) {
      return (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-white text-sm"
            autoFocus
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleSave(setting.key)}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
        </div>
      )
    }

    // Display value based on type
    let displayValue: string

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'success' : 'error'}>
          {value ? 'Enabled' : 'Disabled'}
        </Badge>
      )
    }

    if (typeof value === 'number') {
      displayValue = value.toString()
    } else if (typeof value === 'string') {
      displayValue = value
    } else {
      displayValue = JSON.stringify(value)
    }

    return <span className="text-neutral-300">{displayValue}</span>
  }

  const getCategoryColor = (category: SettingCategory) => {
    const colors: Record<SettingCategory, string> = {
      general: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      agents: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      tasks: 'bg-green-500/10 text-green-400 border-green-500/20',
      notifications: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      integrations: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      security: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    return colors[category]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-400">Loading settings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Settings</h3>
        <p className="text-neutral-300">{error}</p>
        <p className="text-neutral-400 text-sm mt-2">
          You may not have admin permissions to view this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Account Information */}
      {user && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
          <div className="flex items-center gap-4">
            <img
              src={user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${user.email}`}
              alt="User avatar"
              className="w-16 h-16 rounded-full border border-neutral-700"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{user.user_metadata?.user_name || user.user_metadata?.full_name || 'User'}</p>
              <p className="text-sm text-neutral-400">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="success">GitHub Connected</Badge>
                <Badge variant="primary">Admin</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="text-neutral-400 text-sm mb-1">Active Users</div>
            <div className="text-2xl font-bold text-white">{stats.active_users}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="text-neutral-400 text-sm mb-1">Admins</div>
            <div className="text-2xl font-bold text-white">{stats.admin_count}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="text-neutral-400 text-sm mb-1">Active Agents</div>
            <div className="text-2xl font-bold text-white">{stats.active_agents}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="text-neutral-400 text-sm mb-1">Active Tasks</div>
            <div className="text-2xl font-bold text-white">{stats.active_tasks}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="text-neutral-400 text-sm mb-1">Settings</div>
            <div className="text-2xl font-bold text-white">{stats.settings_count}</div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Settings List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-6 py-4 text-neutral-400 font-medium text-sm">
                  Key
                </th>
                <th className="text-left px-6 py-4 text-neutral-400 font-medium text-sm">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-neutral-400 font-medium text-sm">
                  Value
                </th>
                <th className="text-left px-6 py-4 text-neutral-400 font-medium text-sm">
                  Description
                </th>
                <th className="text-left px-6 py-4 text-neutral-400 font-medium text-sm">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-neutral-400 font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                    No settings found
                  </td>
                </tr>
              ) : (
                filteredSettings.map((setting) => (
                  <tr
                    key={setting.key}
                    className="border-b border-neutral-800 hover:bg-neutral-800/50"
                  >
                    <td className="px-6 py-4">
                      <code className="text-sm text-white font-mono">{setting.key}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(
                          setting.category
                        )}`}
                      >
                        {setting.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{renderValue(setting)}</td>
                    <td className="px-6 py-4 text-neutral-400 text-sm max-w-xs truncate">
                      {setting.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{setting.data_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {setting.is_editable && editingKey !== setting.key && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(setting)}
                        >
                          Edit
                        </Button>
                      )}
                      {!setting.is_editable && (
                        <span className="text-neutral-500 text-xs">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
