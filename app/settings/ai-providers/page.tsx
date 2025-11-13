'use client'

/**
 * AI Providers Settings Page
 * Main interface for managing AI providers, models, and usage
 */

import { useState, useEffect } from 'react'
import { ProviderCard } from '@/components/ai-providers/provider-card'
import { UsageDashboard } from '@/components/ai-providers/usage-dashboard'
import type { AIProviderStats } from '@/types'
import {
  Settings,
  Sparkles,
  BarChart3,
  Filter,
  Plus,
  RefreshCw,
} from 'lucide-react'

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProviderStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'providers' | 'analytics'>(
    'providers'
  )
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  )

  useEffect(() => {
    fetchProviders()
  }, [categoryFilter])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      const response = await fetch(`/api/ai/providers?${params.toString()}`)
      const data = await response.json()
      setProviders(data)
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigure = (providerId: string) => {
    setSelectedProviderId(providerId)
    setShowConfigModal(true)
  }

  const handleToggle = async (providerId: string, enabled: boolean) => {
    try {
      // Update provider config
      const response = await fetch(`/api/ai/providers/${providerId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: enabled }),
      })

      if (response.ok) {
        // Refresh providers
        fetchProviders()
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error)
    }
  }

  // Group providers by category
  const groupedProviders = providers.reduce((acc, provider) => {
    const category = provider.provider.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(provider)
    return acc
  }, {} as Record<string, AIProviderStats[]>)

  // Calculate summary stats
  const totalRequests = providers.reduce(
    (sum, p) => sum + p.usage.today.requests,
    0
  )
  const totalCost = providers.reduce(
    (sum, p) => sum + p.usage.today.cost_usd,
    0
  )
  const totalModels = providers.reduce(
    (sum, p) => sum + p.available_models.length,
    0
  )
  const configuredProviders = providers.filter((p) => p.config).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-600" />
                AI Providers
              </h1>
              <p className="mt-2 text-gray-600">
                Manage AI models, monitor usage, and optimize costs
              </p>
            </div>
            <button
              onClick={fetchProviders}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="text-sm font-medium text-blue-900 mb-1">
                Configured Providers
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {configuredProviders}/{providers.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="text-sm font-medium text-purple-900 mb-1">
                Available Models
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {totalModels}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="text-sm font-medium text-green-900 mb-1">
                Requests Today
              </div>
              <div className="text-3xl font-bold text-green-900">
                {totalRequests.toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
              <div className="text-sm font-medium text-orange-900 mb-1">
                Cost Today
              </div>
              <div className="text-3xl font-bold text-orange-900">
                ${totalCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setActiveTab('providers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'providers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Providers
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'providers' && (
          <div>
            {/* Filters */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Category:
                </span>
              </div>
              <div className="flex gap-2">
                {['all', 'text', 'image', 'audio', 'code'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      categoryFilter === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Providers Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedProviders).map(
                  ([category, categoryProviders]) => (
                    <div key={category}>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                        {category} Generation
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryProviders.map((provider) => (
                          <ProviderCard
                            key={provider.provider.id}
                            providerStats={provider}
                            onConfigure={handleConfigure}
                            onToggle={handleToggle}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {providers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No providers found for this category
                </p>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Show all providers
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && <UsageDashboard />}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedProviderId && (
        <ConfigurationModal
          providerId={selectedProviderId}
          onClose={() => {
            setShowConfigModal(false)
            setSelectedProviderId(null)
            fetchProviders()
          }}
        />
      )}
    </div>
  )
}

// Configuration Modal Component
function ConfigurationModal({
  providerId,
  onClose,
}: {
  providerId: string
  onClose: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [dailyBudget, setDailyBudget] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          api_key: apiKey,
          daily_budget_usd: dailyBudget ? parseFloat(dailyBudget) : null,
          monthly_budget_usd: monthlyBudget ? parseFloat(monthlyBudget) : null,
        }),
      })

      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Configure Provider
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Budget (USD)
            </label>
            <input
              type="number"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Budget (USD)
            </label>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey || saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
