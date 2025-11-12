'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { Settings, User, Palette, Bell, Lock, Code, Loader2, Trash2, Plus } from 'lucide-react'

type Tab = 'general' | 'integrations' | 'preferences' | 'privacy'

interface Integration {
  id: string
  integration_type: string
  integration_name: string
  status: string
  created_at: string
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  notifications_email: boolean
  notifications_in_app: boolean
  editor_font_size: number
  editor_theme: string
  privacy_analytics: boolean
  privacy_telemetry: boolean
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    notifications_email: true,
    notifications_in_app: true,
    editor_font_size: 14,
    editor_theme: 'dark',
    privacy_analytics: true,
    privacy_telemetry: true,
  })

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrations()
    }
  }, [activeTab])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.success && data.data) {
        setSettings(data.data)
      }
    } catch {
      // Use default settings
    }
  }

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true)
    try {
      const response = await fetch('/api/settings/integrations')
      const data = await response.json()
      if (data.success) {
        setIntegrations(data.data)
      }
    } catch {
      setError('Failed to load integrations')
    } finally {
      setLoadingIntegrations(false)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Settings saved successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch {
      setError('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to remove this integration?')) return

    try {
      const response = await fetch(`/api/settings/integrations?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setIntegrations(integrations.filter((i) => i.id !== id))
        setSuccess('Integration removed successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to remove integration')
      }
    } catch {
      setError('Failed to remove integration')
    }
  }

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Settings },
    { id: 'integrations' as Tab, label: 'Integrations', icon: Code },
    { id: 'preferences' as Tab, label: 'Preferences', icon: Palette },
    { id: 'privacy' as Tab, label: 'Privacy', icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-neutral-400">Manage your account settings and preferences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Tabs and Content */}
        <div className="grid lg:grid-cols-[240px,1fr] gap-6">
          {/* Tab Navigation */}
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">General Settings</h2>
                  <p className="text-sm text-neutral-400">
                    Manage your account and application settings
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Theme</label>
                    <select
                      value={settings.theme}
                      onChange={(e) =>
                        setSettings({ ...settings, theme: e.target.value as UserSettings['theme'] })
                      }
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications_email}
                          onChange={(e) =>
                            setSettings({ ...settings, notifications_email: e.target.checked })
                          }
                          className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-600"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-white">Email Notifications</div>
                          <div className="text-xs text-neutral-400">
                            Receive updates via email
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications_in_app}
                          onChange={(e) =>
                            setSettings({ ...settings, notifications_in_app: e.target.checked })
                          }
                          className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-600"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-white">In-App Notifications</div>
                          <div className="text-xs text-neutral-400">
                            Show notifications in the app
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">Integrations</h2>
                    <p className="text-sm text-neutral-400">
                      Manage external service connections
                    </p>
                  </div>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Integration
                  </Button>
                </div>

                {loadingIntegrations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Code className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-2">No integrations yet</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      Connect external services to enhance your workflow
                    </p>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Integration
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-neutral-800 border border-neutral-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Code className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {integration.integration_name}
                            </div>
                            <div className="text-sm text-neutral-400">
                              {integration.integration_type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              integration.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {integration.status}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRemoveIntegration(integration.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Preferences</h2>
                  <p className="text-sm text-neutral-400">Customize your workspace</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Editor Font Size
                    </label>
                    <input
                      type="number"
                      value={settings.editor_font_size}
                      onChange={(e) =>
                        setSettings({ ...settings, editor_font_size: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      min="10"
                      max="24"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Size in pixels (10-24)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Editor Theme
                    </label>
                    <select
                      value={settings.editor_theme}
                      onChange={(e) => setSettings({ ...settings, editor_theme: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="monokai">Monokai</option>
                      <option value="solarized">Solarized</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Privacy & Data</h2>
                  <p className="text-sm text-neutral-400">Control your data and privacy settings</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy_analytics}
                      onChange={(e) =>
                        setSettings({ ...settings, privacy_analytics: e.target.checked })
                      }
                      className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white">Analytics</div>
                      <div className="text-xs text-neutral-400">
                        Help us improve by sharing anonymous usage data
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy_telemetry}
                      onChange={(e) =>
                        setSettings({ ...settings, privacy_telemetry: e.target.checked })
                      }
                      className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white">Telemetry</div>
                      <div className="text-xs text-neutral-400">
                        Share diagnostic and performance data
                      </div>
                    </div>
                  </label>

                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-yellow-400 mt-0.5" />
                      <div className="flex-1 text-sm text-yellow-400">
                        Your privacy is important to us. We only collect data necessary to improve
                        the service and never sell your information.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
