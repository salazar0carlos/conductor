'use client'

import { useState, useEffect } from 'react'
import { MarketplaceTemplate, TemplateCategory, MarketplaceFilters, SortOption, ViewMode } from '@/lib/marketplace/types'
import { TemplateCard } from './template-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Grid3x3,
  List,
  Filter,
  X,
  Star,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Loader2
} from 'lucide-react'

interface TemplateBrowserProps {
  initialTemplates?: MarketplaceTemplate[]
  categories?: TemplateCategory[]
  onFavorite?: (templateId: string) => void
  onInstall?: (templateId: string) => void
}

export function TemplateBrowser({
  initialTemplates = [],
  categories = [],
  onFavorite,
  onInstall
}: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>(initialTemplates)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null)
  const [minRating, setMinRating] = useState<number>(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('popular')

  // Quick filters
  const [showFeatured, setShowFeatured] = useState(false)
  const [showTrending, setShowTrending] = useState(false)

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'trending', label: 'Trending' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ]

  const typeOptions = [
    { value: 'workflow', label: 'Workflows' },
    { value: 'task', label: 'Tasks' },
    { value: 'agent', label: 'Agents' },
    { value: 'project', label: 'Projects' },
    { value: 'design', label: 'Designs' },
    { value: 'integration', label: 'Integrations' }
  ]

  const pricingOptions = [
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
    { value: 'freemium', label: 'Freemium' }
  ]

  // Fetch templates with current filters
  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const filters: MarketplaceFilters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        type: selectedType as any,
        pricing: selectedPricing as any,
        minRating: minRating || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        featured: showFeatured || undefined,
        trending: showTrending || undefined,
        sort: sortBy,
        limit: 50
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/marketplace/templates?${params}`)
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [searchQuery, selectedCategory, selectedType, selectedPricing, minRating, selectedTags, sortBy, showFeatured, showTrending])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedType(null)
    setSelectedPricing(null)
    setMinRating(0)
    setSelectedTags([])
    setShowFeatured(false)
    setShowTrending(false)
    setSortBy('popular')
  }

  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    selectedType ||
    selectedPricing ||
    minRating > 0 ||
    selectedTags.length > 0 ||
    showFeatured ||
    showTrending

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 pr-10 text-white hover:border-neutral-700 transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* View Mode */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters Toggle */}
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white text-black text-xs font-medium">
              {Object.values({ searchQuery, selectedCategory, selectedType, selectedPricing, showFeatured, showTrending }).filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowFeatured(!showFeatured)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            showFeatured
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          Featured
        </button>
        <button
          onClick={() => setShowTrending(!showTrending)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            showTrending
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1.5" />
          Trending
        </button>
        <button
          onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            minRating === 4
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4 inline mr-1.5" />
          4+ Stars
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 text-sm font-medium text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 inline mr-1.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Type</label>
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <option value="">All Types</option>
                {typeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Pricing</label>
              <select
                value={selectedPricing || ''}
                onChange={(e) => setSelectedPricing(e.target.value || null)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <option value="">All Pricing</option>
                {pricingOptions.map((pricing) => (
                  <option key={pricing.value} value={pricing.value}>
                    {pricing.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Min Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading templates...
            </div>
          ) : (
            <>
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
              {hasActiveFilters && ' matching your criteria'}
            </>
          )}
        </span>
      </div>

      {/* Templates Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-400 mb-4">No templates found</p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="secondary">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode={viewMode}
              onFavorite={onFavorite}
              onInstall={onInstall}
            />
          ))}
        </div>
      )}
    </div>
  )
}
