'use client'

/**
 * Model Selector Component
 * Universal component for selecting AI models with filtering
 */

import { useState, useEffect } from 'react'
import type { AIModel, AIProvider } from '@/types'
import { Search, Zap, DollarSign, Clock } from 'lucide-react'

interface ModelSelectorProps {
  selectedModelId?: string
  onSelect: (model: AIModel) => void
  category?: string
  capability?: string
  taskType?: string
  showPricing?: boolean
  showPerformance?: boolean
  className?: string
}

export function ModelSelector({
  selectedModelId,
  onSelect,
  category,
  capability,
  taskType,
  showPricing = true,
  showPerformance = true,
  className = '',
}: ModelSelectorProps) {
  const [models, setModels] = useState<
    Array<AIModel & { ai_providers: AIProvider }>
  >([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')

  useEffect(() => {
    fetchModels()
  }, [category, capability])

  const fetchModels = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (capability) params.append('capability', capability)

      const response = await fetch(`/api/ai/models?${params.toString()}`)
      const data = await response.json()
      setModels(data)
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter models
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.display_name.toLowerCase().includes(search.toLowerCase()) ||
      model.ai_providers.display_name
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesTier =
      selectedTier === 'all' || model.performance_tier === selectedTier

    return matchesSearch && matchesTier
  })

  // Group by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    const providerName = model.ai_providers.display_name
    if (!acc[providerName]) {
      acc[providerName] = {
        provider: model.ai_providers,
        models: [],
      }
    }
    acc[providerName].models.push(model)
    return acc
  }, {} as Record<string, { provider: AIProvider; models: AIModel[] }>)

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Tiers</option>
          <option value="fast">Fast</option>
          <option value="balanced">Balanced</option>
          <option value="quality">Quality</option>
        </select>
      </div>

      {/* Recommended Model for Task */}
      {taskType && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Recommended for {taskType.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            Based on your preferences and past performance
          </p>
        </div>
      )}

      {/* Models List */}
      <div className="space-y-6">
        {Object.entries(groupedModels).map(([providerName, { provider, models }]) => (
          <div key={providerName}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {provider.display_name.charAt(0)}
              </div>
              {provider.display_name}
            </h3>

            <div className="grid gap-3">
              {models.map((model) => {
                const isSelected = model.id === selectedModelId
                const inputCost = model.pricing.input_tokens || 0
                const outputCost = model.pricing.output_tokens || 0
                const perTokens = model.pricing.per_tokens || 1000000

                return (
                  <button
                    key={model.id}
                    onClick={() => onSelect(model)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {model.display_name}
                          </h4>
                          {model.status === 'beta' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Beta
                            </span>
                          )}
                        </div>

                        {/* Capabilities */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {model.best_for?.slice(0, 3).map((use) => (
                            <span
                              key={use}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {use.replace('_', ' ')}
                            </span>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {showPerformance && model.performance_tier && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="capitalize">
                                {model.performance_tier}
                              </span>
                            </div>
                          )}
                          {model.context_window && (
                            <div>
                              {(model.context_window / 1000).toFixed(0)}K context
                            </div>
                          )}
                          {model.supports_vision && <div>Vision</div>}
                          {model.supports_function_calling && (
                            <div>Functions</div>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      {showPricing && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              ${(inputCost / (perTokens / 1000000)).toFixed(3)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            per {perTokens === 1000000 ? '1M' : '1K'} tokens
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No models found</p>
          <button
            onClick={() => {
              setSearch('')
              setSelectedTier('all')
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
