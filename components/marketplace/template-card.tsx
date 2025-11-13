'use client'

import { MarketplaceTemplate } from '@/lib/marketplace/types'
import { Star, Download, Heart, Eye, ExternalLink, Sparkles, Crown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface TemplateCardProps {
  template: MarketplaceTemplate
  viewMode?: 'grid' | 'list'
  onFavorite?: (templateId: string) => void
  onInstall?: (templateId: string) => void
}

export function TemplateCard({ template, viewMode = 'grid', onFavorite, onInstall }: TemplateCardProps) {
  const [isFavorited, setIsFavorited] = useState(template.is_favorited || false)
  const [isHovered, setIsHovered] = useState(false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    onFavorite?.(template.id)
  }

  const handleInstall = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onInstall?.(template.id)
  }

  const getTypeColor = (type: string) => {
    const colors = {
      workflow: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      task: 'bg-green-500/10 text-green-400 border-green-500/30',
      agent: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      project: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      design: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      integration: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    }
    return colors[type as keyof typeof colors] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
  }

  const getPriceDisplay = () => {
    if (template.pricing_type === 'free') return 'Free'
    if (template.pricing_type === 'freemium') return 'Freemium'
    return `$${template.price}`
  }

  if (viewMode === 'list') {
    return (
      <Link href={`/marketplace/${template.slug}`}>
        <div
          className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 hover:bg-neutral-900/30 transition-all group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-neutral-900">
              {template.thumbnail_url ? (
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  <Sparkles className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white truncate">{template.name}</h3>
                    {template.is_featured && (
                      <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                    )}
                    {template.is_staff_pick && (
                      <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 line-clamp-2">{template.description}</p>
                </div>

                <button
                  onClick={handleFavorite}
                  className="shrink-0 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isFavorited ? 'fill-red-500 text-red-500' : 'text-neutral-400'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-block text-xs px-2 py-1 rounded border capitalize ${getTypeColor(template.type)}`}>
                  {template.type}
                </span>
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded text-xs bg-neutral-900 text-neutral-400"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-neutral-500">+{template.tags.length - 3} more</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-white font-medium">{template.average_rating.toFixed(1)}</span>
                    <span>({template.review_count})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{template.install_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{template.view_count.toLocaleString()}</span>
                  </div>
                  <span className="font-medium text-white">{getPriceDisplay()}</span>
                </div>

                <Button onClick={handleInstall} size="sm">
                  Install
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid view
  return (
    <Link href={`/marketplace/${template.slug}`}>
      <div
        className="border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 hover:bg-neutral-900/30 transition-all group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-neutral-900 overflow-hidden">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">
              <Sparkles className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {template.is_featured && (
              <div className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-sm">
                <Crown className="w-3 h-3 text-yellow-500" />
              </div>
            )}
            {template.is_staff_pick && (
              <div className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-blue-400" />
              </div>
            )}
            {template.is_trending && (
              <div className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 border border-red-500/30 backdrop-blur-sm text-red-400">
                Trending
              </div>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-2 rounded-lg bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-neutral-400'
              }`}
            />
          </button>

          {/* Price tag */}
          <div className="absolute bottom-2 right-2">
            <div className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${
              template.pricing_type === 'free'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-neutral-900/80 border border-neutral-800 text-white'
            }`}>
              {getPriceDisplay()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate flex-1 mr-2">{template.name}</h3>
            <span className={`inline-block text-xs px-2 py-1 rounded border capitalize shrink-0 ${getTypeColor(template.type)}`}>
              {template.type}
            </span>
          </div>

          <p className="text-sm text-neutral-400 line-clamp-2 mb-3 min-h-[2.5rem]">
            {template.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-neutral-800">
            {template.author_avatar ? (
              <img
                src={template.author_avatar}
                alt={template.author_name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                {template.author_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-neutral-400">{template.author_name}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-white font-medium">{template.average_rating.toFixed(1)}</span>
              <span className="text-xs">({template.review_count})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span className="text-xs">{template.install_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="text-xs">{template.favorite_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-xs bg-neutral-900 text-neutral-400"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="px-2 py-1 rounded text-xs text-neutral-500">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1"
              size="sm"
            >
              Install
            </Button>
            {template.demo_url && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.open(template.demo_url, '_blank')
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
