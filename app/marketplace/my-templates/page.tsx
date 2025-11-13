'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { MarketplaceTemplate, TemplateInstallation } from '@/lib/marketplace/types'
import { TemplateCard } from '@/components/marketplace/template-card'
import {
  Package,
  Download,
  Star,
  DollarSign,
  Eye,
  Plus,
  Settings,
  Trash2,
  Edit
} from 'lucide-react'
import Link from 'next/link'

export default function MyTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'created' | 'installed' | 'favorites'>('created')
  const [createdTemplates, setCreatedTemplates] = useState<MarketplaceTemplate[]>([])
  const [installedTemplates, setInstalledTemplates] = useState<TemplateInstallation[]>([])
  const [favoriteTemplates, setFavoriteTemplates] = useState<MarketplaceTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    total_created: 0,
    total_installs: 0,
    total_revenue: 0,
    average_rating: 0
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'created') {
        await fetchCreatedTemplates()
      } else if (activeTab === 'installed') {
        await fetchInstalledTemplates()
      } else if (activeTab === 'favorites') {
        await fetchFavoriteTemplates()
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCreatedTemplates = async () => {
    try {
      // Fetch templates created by current user
      const response = await fetch('/api/marketplace/templates?author=me')
      const data = await response.json()
      setCreatedTemplates(data.templates || [])

      // Calculate stats
      const templates = data.templates || []
      setStats({
        total_created: templates.length,
        total_installs: templates.reduce((sum: number, t: MarketplaceTemplate) => sum + t.install_count, 0),
        total_revenue: templates.reduce((sum: number, t: MarketplaceTemplate) =>
          sum + (t.pricing_type === 'paid' ? t.price * t.install_count : 0), 0),
        average_rating: templates.length > 0
          ? templates.reduce((sum: number, t: MarketplaceTemplate) => sum + t.average_rating, 0) / templates.length
          : 0
      })
    } catch (error) {
      console.error('Failed to fetch created templates:', error)
    }
  }

  const fetchInstalledTemplates = async () => {
    try {
      const response = await fetch('/api/marketplace/installations')
      const data = await response.json()
      setInstalledTemplates(data || [])
    } catch (error) {
      console.error('Failed to fetch installed templates:', error)
    }
  }

  const fetchFavoriteTemplates = async () => {
    try {
      const response = await fetch('/api/marketplace/favorites')
      const data = await response.json()
      setFavoriteTemplates(data.map((f: any) => f.template) || [])
    } catch (error) {
      console.error('Failed to fetch favorite templates:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await fetch(`/api/marketplace/templates/${templateId}`, {
        method: 'DELETE'
      })
      fetchCreatedTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const handleUninstall = async (installationId: string) => {
    if (!confirm('Are you sure you want to uninstall this template?')) return

    try {
      await fetch(`/api/marketplace/installations/${installationId}`, {
        method: 'DELETE'
      })
      fetchInstalledTemplates()
    } catch (error) {
      console.error('Failed to uninstall template:', error)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-purple-500" />
                <h1 className="text-3xl font-bold text-white">My Templates</h1>
              </div>
              <p className="text-neutral-400">
                Manage your created templates, installations, and favorites
              </p>
            </div>

            <Link href="/marketplace/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </div>

          {/* Stats - Only show for created templates */}
          {activeTab === 'created' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-neutral-400">Created</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.total_created}</div>
              </div>
              <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-neutral-400">Total Installs</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.total_installs}</div>
              </div>
              <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-neutral-400">Avg Rating</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.average_rating.toFixed(1)}</div>
              </div>
              <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-neutral-400">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-white">${stats.total_revenue.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('created')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'created'
                  ? 'text-white border-b-2 border-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Created Templates ({createdTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('installed')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'installed'
                  ? 'text-white border-b-2 border-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Installed ({installedTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'text-white border-b-2 border-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Favorites ({favoriteTemplates.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-neutral-400">Loading...</div>
        ) : (
          <>
            {/* Created Templates */}
            {activeTab === 'created' && (
              <div>
                {createdTemplates.length === 0 ? (
                  <div className="text-center py-12 border border-neutral-800 rounded-lg">
                    <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-4">You haven&apos;t created any templates yet</p>
                    <Link href="/marketplace/create">
                      <Button>Create Your First Template</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {createdTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                              <span className={`px-2 py-1 rounded text-xs ${
                                template.status === 'published'
                                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                  : template.status === 'draft'
                                  ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                                  : 'bg-neutral-500/20 border border-neutral-500/30 text-neutral-400'
                              }`}>
                                {template.status}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-400">{template.description}</p>
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/marketplace/edit/${template.id}`}>
                              <Button variant="secondary" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            <span>{template.install_count} installs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span>{template.average_rating.toFixed(1)} ({template.review_count})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{template.view_count} views</span>
                          </div>
                          {template.pricing_type === 'paid' && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${(template.price * template.install_count).toFixed(2)} revenue</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Installed Templates */}
            {activeTab === 'installed' && (
              <div>
                {installedTemplates.length === 0 ? (
                  <div className="text-center py-12 border border-neutral-800 rounded-lg">
                    <Download className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-4">You haven&apos;t installed any templates yet</p>
                    <Link href="/marketplace">
                      <Button>Browse Templates</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {installedTemplates.map((installation) => (
                      <div key={installation.id}>
                        {installation.template && (
                          <TemplateCard
                            template={installation.template}
                            viewMode="grid"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorite Templates */}
            {activeTab === 'favorites' && (
              <div>
                {favoriteTemplates.length === 0 ? (
                  <div className="text-center py-12 border border-neutral-800 rounded-lg">
                    <Star className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-4">You haven&apos;t favorited any templates yet</p>
                    <Link href="/marketplace">
                      <Button>Browse Templates</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        viewMode="grid"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
