'use client'

/**
 * AI Provider Card Component
 * Displays provider info, health status, usage stats, and configuration
 */

import { useState } from 'react'
import type { AIProviderStats } from '@/types'
import { Activity, AlertCircle, CheckCircle, DollarSign, Settings, Zap } from 'lucide-react'

interface ProviderCardProps {
  providerStats: AIProviderStats
  onConfigure?: (providerId: string) => void
  onToggle?: (providerId: string, enabled: boolean) => void
}

export function ProviderCard({
  providerStats,
  onConfigure,
  onToggle,
}: ProviderCardProps) {
  const { provider, config, health, usage, budget, available_models } = providerStats
  const [isExpanded, setIsExpanded] = useState(false)

  const isConfigured = !!config
  const isEnabled = config?.is_enabled ?? false
  const isHealthy = health.is_available && (health.error_rate || 0) < 50

  // Calculate budget usage percentage
  const dailyBudgetPercent = budget.daily
    ? (budget.daily.spent_usd / budget.daily.budget_usd) * 100
    : 0

  const monthlyBudgetPercent = budget.monthly
    ? (budget.monthly.spent_usd / budget.monthly.budget_usd) * 100
    : 0

  // Health status colors
  const healthColor = isHealthy ? 'text-green-600' : 'text-red-600'
  const healthBg = isHealthy ? 'bg-green-50' : 'bg-red-50'
  const healthBorder = isHealthy ? 'border-green-200' : 'border-red-200'

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Provider Logo/Icon */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {provider.display_name.charAt(0)}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {provider.display_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 capitalize">
                  {provider.category}
                </span>
                {isConfigured && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className={`flex items-center gap-1 ${healthColor}`}>
                      {isHealthy ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {isHealthy ? 'Healthy' : 'Issues'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          {isConfigured && (
            <button
              onClick={() => onToggle?.(provider.id, !isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        {isConfigured && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {usage.today.requests}
              </div>
              <div className="text-xs text-gray-500 mt-1">Requests Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(usage.today.tokens / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-gray-500 mt-1">Tokens Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${usage.today.cost_usd.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Cost Today</div>
            </div>
          </div>
        )}

        {/* Budget Bar */}
        {budget.daily && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Daily Budget</span>
              <span className="text-sm font-medium text-gray-900">
                ${budget.daily.spent_usd.toFixed(2)} / $
                {budget.daily.budget_usd.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  dailyBudgetPercent > 90
                    ? 'bg-red-500'
                    : dailyBudgetPercent > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailyBudgetPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Models Count */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {available_models.length} model{available_models.length !== 1 ? 's' : ''}{' '}
            available
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {/* Health Details */}
          {health && (
            <div className={`rounded-lg border ${healthBorder} ${healthBg} p-4 mb-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className={`w-4 h-4 ${healthColor}`} />
                <span className="font-medium text-gray-900">Health Status</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {health.error_rate !== null
                      ? `${(100 - health.error_rate).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Response Time:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {health.response_time_ms ? `${health.response_time_ms}ms` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Success Count:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {health.success_count}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Error Count:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {health.error_count}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">This Month</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Requests</div>
                <div className="font-medium text-gray-900 mt-1">
                  {usage.this_month.requests}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Tokens</div>
                <div className="font-medium text-gray-900 mt-1">
                  {(usage.this_month.tokens / 1000).toFixed(1)}K
                </div>
              </div>
              <div>
                <div className="text-gray-600">Cost</div>
                <div className="font-medium text-gray-900 mt-1">
                  ${usage.this_month.cost_usd.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Available Models */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Available Models</span>
            </div>
            <div className="space-y-2">
              {available_models.slice(0, 5).map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-gray-900 font-medium">
                      {model.display_name}
                    </span>
                    {model.performance_tier && (
                      <span className="ml-2 text-xs text-gray-500 capitalize">
                        ({model.performance_tier})
                      </span>
                    )}
                  </div>
                  {model.pricing && (
                    <span className="text-gray-600">
                      ${((model.pricing.input_tokens || 0) / 1000).toFixed(3)}/
                      {model.pricing.per_tokens === 1000000 ? '1M' : '1K'} tokens
                    </span>
                  )}
                </div>
              ))}
              {available_models.length > 5 && (
                <div className="text-sm text-gray-500">
                  +{available_models.length - 5} more models
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
        <button
          onClick={() => onConfigure?.(provider.id)}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {isConfigured ? 'Configure' : 'Setup'}
        </button>
        {provider.documentation_url && (
          <a
            href={provider.documentation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Docs
          </a>
        )}
      </div>
    </div>
  )
}
