'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { Palette, Plus, Search, Sparkles, Eye } from 'lucide-react'
import { getAllTemplates, type DesignTemplate } from '@/lib/design-system'

export default function DesignTemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null)

  const templates = getAllTemplates()
  const categories = ['all', 'minimal', 'bold', 'glassmorphic', 'landing', 'enterprise']

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metadata.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Design Templates</h1>
            <p className="text-neutral-400">
              Browse and customize design systems for your projects
            </p>
          </div>
          <Button onClick={() => router.push('/design-templates/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name, description, or tags..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none transition-colors"
              style={{ outlineColor: 'var(--conductor-primary)' }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--conductor-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                style={selectedCategory === category ? {
                  backgroundColor: 'var(--conductor-primary)',
                } : {}}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-neutral-400">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden transition-all"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--conductor-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
            >
              {/* Preview Area - Mini Dashboard Mockup */}
              <div className="relative h-48 overflow-hidden">
                <div
                  className="absolute inset-0 p-2"
                  style={{ background: `${template.theme.light.background}` }}
                >
                  {/* Mini Dashboard Layout */}
                  <div className="flex gap-2 h-full">
                    {/* Sidebar */}
                    <div
                      className="w-12 rounded flex flex-col gap-1 p-1"
                      style={{
                        background: `${template.theme.light.card}`,
                        borderColor: `${template.theme.light.border}`,
                      }}
                    >
                      <div
                        className="h-6 rounded"
                        style={{ background: `${template.theme.light.primary}` }}
                      />
                      <div
                        className="h-6 rounded"
                        style={{ background: `${template.theme.light.muted}` }}
                      />
                      <div
                        className="h-6 rounded"
                        style={{ background: `${template.theme.light.muted}` }}
                      />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col gap-2">
                      {/* Header with button */}
                      <div className="flex gap-2">
                        <div
                          className="flex-1 h-6 rounded"
                          style={{ background: `${template.theme.light.card}` }}
                        />
                        <div
                          className="w-16 h-6 rounded"
                          style={{ background: `${template.theme.light.primary}` }}
                        />
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 rounded border p-1"
                            style={{
                              background: `${template.theme.light.card}`,
                              borderColor: `${template.theme.light.border}`,
                            }}
                          >
                            <div
                              className="h-2 w-8 rounded mb-1"
                              style={{ background: `${template.theme.light.muted}` }}
                            />
                            <div
                              className="h-3 w-12 rounded"
                              style={{ background: `${template.theme.light.foreground}`, opacity: 0.8 }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Table/List */}
                      <div
                        className="flex-1 rounded border"
                        style={{
                          background: `${template.theme.light.card}`,
                          borderColor: `${template.theme.light.border}`,
                        }}
                      >
                        <div className="p-1 space-y-1">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-4 rounded"
                              style={{
                                background: `${template.theme.light.muted}`,
                                opacity: 0.6,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewTemplate(template)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Full Preview
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    {template.metadata.popularityScore && template.metadata.popularityScore > 80 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 line-clamp-2">{template.description}</p>
                </div>

                {/* Color Swatches */}
                <div className="flex gap-1.5">
                  {['primary', 'secondary', 'accent', 'muted'].map((color) => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded border border-neutral-700"
                      style={{
                        background: `${
                          template.theme.light[color as keyof typeof template.theme.light]
                        }`,
                      }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {template.metadata.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-500">
                  <span>{template.category}</span>
                  <span>v{template.metadata.version}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <Palette className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
            <p className="text-neutral-400 mb-6">
              Try adjusting your search or create a new template
            </p>
            <Button onClick={() => router.push('/design-templates/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{previewTemplate.name}</h2>
                <p className="text-sm text-neutral-400">{previewTemplate.description}</p>
              </div>
              <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Light Mode - Full UI Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    Light Mode - Full UI
                  </div>
                  <div
                    className="p-4 rounded-lg border space-y-4"
                    style={{ background: `${previewTemplate.theme.light.background}` }}
                  >
                    {/* Buttons */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.light.foreground}` }}>Buttons</div>
                      <div className="flex gap-2">
                        <div
                          className="px-3 py-1.5 rounded text-xs font-medium"
                          style={{
                            background: `${previewTemplate.theme.light.primary}`,
                            color: `${previewTemplate.theme.light.primaryForeground}`,
                          }}
                        >
                          Primary
                        </div>
                        <div
                          className="px-3 py-1.5 rounded text-xs border"
                          style={{
                            background: `${previewTemplate.theme.light.secondary}`,
                            color: `${previewTemplate.theme.light.secondaryForeground}`,
                            borderColor: `${previewTemplate.theme.light.border}`,
                          }}
                        >
                          Secondary
                        </div>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.light.foreground}` }}>Form Elements</div>
                      <div
                        className="px-3 py-1.5 rounded text-xs border"
                        style={{
                          background: `${previewTemplate.theme.light.card}`,
                          color: `${previewTemplate.theme.light.mutedForeground}`,
                          borderColor: `${previewTemplate.theme.light.input}`,
                        }}
                      >
                        Enter text...
                      </div>
                      <div
                        className="px-3 py-2 rounded text-xs border"
                        style={{
                          background: `${previewTemplate.theme.light.card}`,
                          borderColor: `${previewTemplate.theme.light.input}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: `${previewTemplate.theme.light.mutedForeground}` }}>Select option</span>
                          <div style={{ color: `${previewTemplate.theme.light.mutedForeground}` }}>▼</div>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.light.foreground}` }}>Badges</div>
                      <div className="flex gap-2">
                        <div
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${previewTemplate.theme.light.primary}`,
                            color: `${previewTemplate.theme.light.primaryForeground}`,
                          }}
                        >
                          Active
                        </div>
                        <div
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${previewTemplate.theme.light.muted}`,
                            color: `${previewTemplate.theme.light.mutedForeground}`,
                          }}
                        >
                          Inactive
                        </div>
                      </div>
                    </div>

                    {/* Mini Calendar */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.light.foreground}` }}>Calendar</div>
                      <div
                        className="rounded border p-2"
                        style={{
                          background: `${previewTemplate.theme.light.card}`,
                          borderColor: `${previewTemplate.theme.light.border}`,
                        }}
                      >
                        <div className="grid grid-cols-7 gap-1">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div
                              key={i}
                              className="text-center text-xs"
                              style={{ color: `${previewTemplate.theme.light.mutedForeground}` }}
                            >
                              {day}
                            </div>
                          ))}
                          {[...Array(7)].map((_, i) => (
                            <div
                              key={i}
                              className="aspect-square rounded flex items-center justify-center text-xs"
                              style={{
                                background: i === 3 ? `${previewTemplate.theme.light.primary}` : 'transparent',
                                color: i === 3 ? `${previewTemplate.theme.light.primaryForeground}` : `${previewTemplate.theme.light.foreground}`,
                              }}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.light.foreground}` }}>Data Table</div>
                      <div
                        className="rounded border overflow-hidden"
                        style={{
                          background: `${previewTemplate.theme.light.card}`,
                          borderColor: `${previewTemplate.theme.light.border}`,
                        }}
                      >
                        <div
                          className="px-2 py-1 text-xs font-medium border-b"
                          style={{
                            background: `${previewTemplate.theme.light.muted}`,
                            borderColor: `${previewTemplate.theme.light.border}`,
                            color: `${previewTemplate.theme.light.mutedForeground}`,
                          }}
                        >
                          <div className="flex gap-4">
                            <span className="flex-1">Name</span>
                            <span className="w-16">Status</span>
                          </div>
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="px-2 py-1 text-xs border-b last:border-b-0"
                            style={{
                              borderColor: `${previewTemplate.theme.light.border}`,
                              color: `${previewTemplate.theme.light.foreground}`,
                            }}
                          >
                            <div className="flex gap-4">
                              <span className="flex-1">Item {i}</span>
                              <span
                                className="w-16 px-1 rounded text-center"
                                style={{
                                  background: `${previewTemplate.theme.light.primary}`,
                                  color: `${previewTemplate.theme.light.primaryForeground}`,
                                }}
                              >
                                Live
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dark Mode - Full UI Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                    Dark Mode - Full UI
                  </div>
                  <div
                    className="p-4 rounded-lg border space-y-4"
                    style={{ background: `${previewTemplate.theme.dark.background}` }}
                  >
                    {/* Buttons */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.dark.foreground}` }}>Buttons</div>
                      <div className="flex gap-2">
                        <div
                          className="px-3 py-1.5 rounded text-xs font-medium"
                          style={{
                            background: `${previewTemplate.theme.dark.primary}`,
                            color: `${previewTemplate.theme.dark.primaryForeground}`,
                          }}
                        >
                          Primary
                        </div>
                        <div
                          className="px-3 py-1.5 rounded text-xs border"
                          style={{
                            background: `${previewTemplate.theme.dark.secondary}`,
                            color: `${previewTemplate.theme.dark.secondaryForeground}`,
                            borderColor: `${previewTemplate.theme.dark.border}`,
                          }}
                        >
                          Secondary
                        </div>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.dark.foreground}` }}>Form Elements</div>
                      <div
                        className="px-3 py-1.5 rounded text-xs border"
                        style={{
                          background: `${previewTemplate.theme.dark.card}`,
                          color: `${previewTemplate.theme.dark.mutedForeground}`,
                          borderColor: `${previewTemplate.theme.dark.input}`,
                        }}
                      >
                        Enter text...
                      </div>
                      <div
                        className="px-3 py-2 rounded text-xs border"
                        style={{
                          background: `${previewTemplate.theme.dark.card}`,
                          borderColor: `${previewTemplate.theme.dark.input}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: `${previewTemplate.theme.dark.mutedForeground}` }}>Select option</span>
                          <div style={{ color: `${previewTemplate.theme.dark.mutedForeground}` }}>▼</div>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.dark.foreground}` }}>Badges</div>
                      <div className="flex gap-2">
                        <div
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${previewTemplate.theme.dark.primary}`,
                            color: `${previewTemplate.theme.dark.primaryForeground}`,
                          }}
                        >
                          Active
                        </div>
                        <div
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${previewTemplate.theme.dark.muted}`,
                            color: `${previewTemplate.theme.dark.mutedForeground}`,
                          }}
                        >
                          Inactive
                        </div>
                      </div>
                    </div>

                    {/* Mini Calendar */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.dark.foreground}` }}>Calendar</div>
                      <div
                        className="rounded border p-2"
                        style={{
                          background: `${previewTemplate.theme.dark.card}`,
                          borderColor: `${previewTemplate.theme.dark.border}`,
                        }}
                      >
                        <div className="grid grid-cols-7 gap-1">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div
                              key={i}
                              className="text-center text-xs"
                              style={{ color: `${previewTemplate.theme.dark.mutedForeground}` }}
                            >
                              {day}
                            </div>
                          ))}
                          {[...Array(7)].map((_, i) => (
                            <div
                              key={i}
                              className="aspect-square rounded flex items-center justify-center text-xs"
                              style={{
                                background: i === 3 ? `${previewTemplate.theme.dark.primary}` : 'transparent',
                                color: i === 3 ? `${previewTemplate.theme.dark.primaryForeground}` : `${previewTemplate.theme.dark.foreground}`,
                              }}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium" style={{ color: `${previewTemplate.theme.dark.foreground}` }}>Data Table</div>
                      <div
                        className="rounded border overflow-hidden"
                        style={{
                          background: `${previewTemplate.theme.dark.card}`,
                          borderColor: `${previewTemplate.theme.dark.border}`,
                        }}
                      >
                        <div
                          className="px-2 py-1 text-xs font-medium border-b"
                          style={{
                            background: `${previewTemplate.theme.dark.muted}`,
                            borderColor: `${previewTemplate.theme.dark.border}`,
                            color: `${previewTemplate.theme.dark.mutedForeground}`,
                          }}
                        >
                          <div className="flex gap-4">
                            <span className="flex-1">Name</span>
                            <span className="w-16">Status</span>
                          </div>
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="px-2 py-1 text-xs border-b last:border-b-0"
                            style={{
                              borderColor: `${previewTemplate.theme.dark.border}`,
                              color: `${previewTemplate.theme.dark.foreground}`,
                            }}
                          >
                            <div className="flex gap-4">
                              <span className="flex-1">Item {i}</span>
                              <span
                                className="w-16 px-1 rounded text-center"
                                style={{
                                  background: `${previewTemplate.theme.dark.primary}`,
                                  color: `${previewTemplate.theme.dark.primaryForeground}`,
                                }}
                              >
                                Live
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-neutral-800">
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Typography</h4>
                  <div className="space-y-2 text-sm text-neutral-400">
                    <div className="flex justify-between">
                      <span>Font Family:</span>
                      <span className="text-neutral-300">
                        {previewTemplate.theme.typography.fontFamily.sans[0]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Size:</span>
                      <span className="text-neutral-300">
                        {previewTemplate.theme.typography.fontSize.base}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Accessibility</h4>
                  <div className="space-y-2 text-sm text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>
                        {previewTemplate.category === 'enterprise' ? 'WCAG 2.1 AAA' : 'WCAG 2.1 AA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Light & Dark Mode Support</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="pt-6 border-t border-neutral-800">
                <h4 className="text-sm font-medium text-white mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded bg-neutral-800 text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
