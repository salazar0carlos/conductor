'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/ui/nav'
import { TemplateBrowser } from '@/components/marketplace/template-browser'
import { TemplateInstaller } from '@/components/marketplace/template-installer'
import { MarketplaceTemplate, TemplateCategory } from '@/lib/marketplace/types'
import { Button } from '@/components/ui/button'
import { Store, Sparkles, TrendingUp, Crown, Plus } from 'lucide-react'
import Link from 'next/link'

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [installingTemplate, setInstallingTemplate] = useState<MarketplaceTemplate | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        fetch('/api/marketplace/templates?limit=50'),
        fetch('/api/marketplace/categories')
      ])

      const templatesData = await templatesRes.json()
      const categoriesData = await categoriesRes.json()

      setTemplates(templatesData.templates || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavorite = async (templateId: string) => {
    try {
      await fetch('/api/marketplace/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId })
      })
      // Refresh template to update favorite status
      fetchInitialData()
    } catch (error) {
      console.error('Failed to favorite template:', error)
    }
  }

  const handleInstall = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setInstallingTemplate(template)
    }
  }

  const handleInstallSuccess = () => {
    setInstallingTemplate(null)
    fetchInitialData() // Refresh to update install counts
  }

  // Get featured templates
  const featuredTemplates = templates.filter(t => t.is_featured).slice(0, 3)

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-8 h-8 text-blue-500" />
                <h1 className="text-3xl font-bold text-white">Template Marketplace</h1>
              </div>
              <p className="text-neutral-400 max-w-2xl">
                Discover pre-built templates for workflows, tasks, agents, and more. Install with one click
                and customize to fit your needs.
              </p>
            </div>

            <Link href="/marketplace/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Share Template
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-neutral-400">Total Templates</span>
              </div>
              <div className="text-2xl font-bold text-white">{templates.length}</div>
            </div>
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-neutral-400">Total Installs</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {templates.reduce((sum, t) => sum + t.install_count, 0).toLocaleString()}
              </div>
            </div>
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-neutral-400">Categories</span>
              </div>
              <div className="text-2xl font-bold text-white">{categories.length}</div>
            </div>
          </div>

          {/* Featured Templates */}
          {featuredTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Featured Templates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/marketplace/${template.slug}`}
                    className="border border-yellow-500/30 rounded-lg p-6 bg-gradient-to-br from-yellow-500/10 to-transparent hover:border-yellow-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                        Featured
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      <span>{template.install_count.toLocaleString()} installs</span>
                      <span>{template.average_rating.toFixed(1)} ⭐</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Template Browser */}
        <TemplateBrowser
          initialTemplates={templates}
          categories={categories}
          onFavorite={handleFavorite}
          onInstall={handleInstall}
        />
      </main>

      {/* Installer Modal */}
      {installingTemplate && (
        <TemplateInstaller
          template={installingTemplate}
          isOpen={!!installingTemplate}
          onClose={() => setInstallingTemplate(null)}
          onSuccess={handleInstallSuccess}
        />
      )}
    </div>
  )
}
