'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Palette, Type, Sparkles, Eye, Save } from 'lucide-react'

export default function NewTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'minimal' as 'minimal' | 'bold' | 'glassmorphic' | 'landing' | 'enterprise',
    tags: [] as string[],
    // Light Mode Colors (HSL format)
    lightMode: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      primary: '222.2 47.4% 11.2%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '214.3 31.8% 91.4%',
    },
    // Dark Mode Colors (HSL format)
    darkMode: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      primary: '210 40% 98%',
      primaryForeground: '222.2 47.4% 11.2%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
    },
    // Typography
    fontFamily: 'Inter',
    baseFontSize: '16px',
    // Border Radius
    borderRadius: '0.5rem',
  })

  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    if (tagInput.trim() && !templateData.tags.includes(tagInput.trim())) {
      setTemplateData({
        ...templateData,
        tags: [...templateData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTemplateData({
      ...templateData,
      tags: templateData.tags.filter((t) => t !== tag),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // TODO: Implement API endpoint to save custom template
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push('/design-templates')
    } catch {
      setError('Failed to create template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">Create Design Template</h1>
              <p className="text-sm text-neutral-400">Build your custom design system</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Preview'}
            </Button>
            <Button onClick={() => router.back()} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Template Information</h2>
                <p className="text-sm text-neutral-400">Basic details about your template</p>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Template Name *
              </label>
              <input
                type="text"
                id="name"
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Modern SaaS"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="A modern, clean design system perfect for SaaS applications"
                rows={3}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                Category *
              </label>
              <select
                id="category"
                value={templateData.category}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    category: e.target.value as typeof templateData.category,
                  })
                }
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
                <option value="glassmorphic">Glassmorphic</option>
                <option value="landing">Landing</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-white mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Add a tag (press Enter)"
                />
                <Button type="button" onClick={handleAddTag} variant="secondary">
                  Add
                </Button>
              </div>
              {templateData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {templateData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded bg-purple-500/20 text-purple-300 flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-purple-300 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Light Mode Colors */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Light Mode Colors</h2>
                <p className="text-sm text-neutral-400">HSL color values (e.g., 222.2 47.4% 11.2%)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(templateData.lightMode).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded border border-neutral-700 flex-shrink-0"
                      style={{ background: `hsl(${value})` }}
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          lightMode: { ...templateData.lightMode, [key]: e.target.value },
                        })
                      }
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="0 0% 100%"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dark Mode Colors */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Dark Mode Colors</h2>
                <p className="text-sm text-neutral-400">HSL color values (e.g., 222.2 84% 4.9%)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(templateData.darkMode).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded border border-neutral-700 flex-shrink-0"
                      style={{ background: `hsl(${value})` }}
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setTemplateData({
                          ...templateData,
                          darkMode: { ...templateData.darkMode, [key]: e.target.value },
                        })
                      }
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="222.2 84% 4.9%"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Type className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Typography & Styling</h2>
                <p className="text-sm text-neutral-400">Font and border settings</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fontFamily" className="block text-sm font-medium text-white mb-2">
                  Font Family
                </label>
                <input
                  type="text"
                  id="fontFamily"
                  value={templateData.fontFamily}
                  onChange={(e) => setTemplateData({ ...templateData, fontFamily: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Inter"
                />
              </div>
              <div>
                <label htmlFor="baseFontSize" className="block text-sm font-medium text-white mb-2">
                  Base Font Size
                </label>
                <input
                  type="text"
                  id="baseFontSize"
                  value={templateData.baseFontSize}
                  onChange={(e) =>
                    setTemplateData({ ...templateData, baseFontSize: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="16px"
                />
              </div>
              <div>
                <label htmlFor="borderRadius" className="block text-sm font-medium text-white mb-2">
                  Border Radius
                </label>
                <input
                  type="text"
                  id="borderRadius"
                  value={templateData.borderRadius}
                  onChange={(e) =>
                    setTemplateData({ ...templateData, borderRadius: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.5rem"
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? (
                <>Creating Template...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="fixed right-0 top-0 h-full w-96 bg-neutral-900 border-l border-neutral-800 shadow-2xl overflow-y-auto z-50">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Preview</h3>
              <p className="text-sm text-neutral-400">See your template in action</p>
            </div>

            {/* Light Mode Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                Light Mode
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{ background: `hsl(${templateData.lightMode.background})` }}
              >
                <div className="space-y-2">
                  <div
                    className="px-3 py-1.5 rounded text-sm font-medium"
                    style={{
                      background: `hsl(${templateData.lightMode.primary})`,
                      color: `hsl(${templateData.lightMode.primaryForeground})`,
                    }}
                  >
                    Primary
                  </div>
                  <div
                    className="p-3 rounded border text-sm"
                    style={{
                      background: `hsl(${templateData.lightMode.card})`,
                      color: `hsl(${templateData.lightMode.cardForeground})`,
                      borderColor: `hsl(${templateData.lightMode.border})`,
                    }}
                  >
                    Card
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                <div className="w-3 h-3 rounded-full bg-indigo-400" />
                Dark Mode
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{ background: `hsl(${templateData.darkMode.background})` }}
              >
                <div className="space-y-2">
                  <div
                    className="px-3 py-1.5 rounded text-sm font-medium"
                    style={{
                      background: `hsl(${templateData.darkMode.primary})`,
                      color: `hsl(${templateData.darkMode.primaryForeground})`,
                    }}
                  >
                    Primary
                  </div>
                  <div
                    className="p-3 rounded border text-sm"
                    style={{
                      background: `hsl(${templateData.darkMode.card})`,
                      color: `hsl(${templateData.darkMode.cardForeground})`,
                      borderColor: `hsl(${templateData.darkMode.border})`,
                    }}
                  >
                    Card
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
