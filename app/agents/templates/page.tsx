'use client'

import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { AGENT_TEMPLATES, getAllCategories } from '@/lib/agents/templates'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Bot, CheckCircle } from 'lucide-react'

export default function AgentTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const categories = getAllCategories()

  const filteredTemplates = selectedCategory
    ? AGENT_TEMPLATES.filter(template => template.category === selectedCategory)
    : AGENT_TEMPLATES

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engineering':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'quality':
        return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'analysis':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'communication':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <h1 className="text-3xl font-bold text-white">Agent Templates</h1>
              </div>
              <p className="text-neutral-400">
                Pre-configured AI agents based on Edmund&apos;s specialized agents. Deploy instantly with one click.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-white text-black border-white'
                  : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              All ({AGENT_TEMPLATES.length})
            </button>
            {categories.map((category) => {
              const count = AGENT_TEMPLATES.filter(t => t.category === category).length
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                    selectedCategory === category
                      ? 'bg-white text-black border-white'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  {category} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 hover:bg-neutral-900/30 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <span className={`inline-block text-xs px-2 py-1 rounded border capitalize ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Capabilities */}
              <div className="mb-4">
                <p className="text-xs font-medium text-neutral-500 mb-2">Key Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.capabilities.slice(0, 4).map((capability) => (
                    <span
                      key={capability}
                      className="px-2 py-1 rounded text-xs bg-neutral-900 text-neutral-400"
                    >
                      {capability}
                    </span>
                  ))}
                  {template.capabilities.length > 4 && (
                    <span className="px-2 py-1 rounded text-xs bg-neutral-900 text-neutral-400">
                      +{template.capabilities.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Use Cases */}
              <div className="mb-6">
                <p className="text-xs font-medium text-neutral-500 mb-2">Best For</p>
                <ul className="space-y-1">
                  {template.recommendedFor.slice(0, 3).map((useCase, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-400">
                      <CheckCircle className="w-3 h-3 text-neutral-600 mt-0.5 shrink-0" />
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/agents/templates/${template.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href={`/agents/deploy?template=${template.id}`} className="flex-1">
                  <Button className="w-full">
                    Deploy
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 border border-neutral-800 rounded-lg">
            <p className="text-neutral-400">No templates found in this category</p>
          </div>
        )}
      </main>
    </div>
  )
}
