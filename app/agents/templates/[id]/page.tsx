'use client'

import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { AGENT_TEMPLATES } from '@/lib/agents/templates'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, Sparkles, Zap, Target, Briefcase } from 'lucide-react'
import { notFound } from 'next/navigation'

export default function AgentTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const template = AGENT_TEMPLATES.find(t => t.id === id)

  if (!template) {
    notFound()
  }

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/agents/templates"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Link>

          {/* Header */}
          <div className="border border-neutral-800 rounded-lg p-8 bg-neutral-900/30 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center">
                <Bot className="w-8 h-8 text-neutral-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{template.name}</h1>
                  <span className={`inline-block text-xs px-3 py-1 rounded border capitalize ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
                <p className="text-neutral-400 text-lg">{template.description}</p>
              </div>
            </div>

            {/* Deploy Button */}
            <div className="flex gap-3 mt-6">
              <Link href={`/agents/deploy?template=${template.id}`} className="flex-1">
                <Button className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Deploy This Agent
                </Button>
              </Link>
            </div>
          </div>

          {/* Capabilities */}
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-white">Capabilities</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {template.capabilities.map((capability) => (
                <span
                  key={capability}
                  className="px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 text-sm"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-semibold text-white">Focus Areas</h2>
            </div>
            <ul className="space-y-3">
              {template.focusAreas.map((area, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-neutral-300">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Use Cases */}
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">Use Cases</h2>
            </div>
            <ul className="space-y-3">
              {template.useCases.map((useCase, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-neutral-300">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended For */}
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-white">Best Suited For</h2>
            </div>
            <ul className="space-y-3">
              {template.recommendedFor.map((recommendation, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                  <span className="text-neutral-300">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Configuration */}
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Model</p>
                <p className="text-white font-medium">{template.config.model}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Temperature</p>
                <p className="text-white font-medium">{template.config.temperature}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-neutral-500 mb-2">System Prompt</p>
                <p className="text-neutral-300 text-sm bg-neutral-900 p-3 rounded border border-neutral-800">
                  {template.config.systemPrompt}
                </p>
              </div>
            </div>
          </div>

          {/* Deploy CTA */}
          <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 text-center">
            <p className="text-neutral-400 mb-4">Ready to deploy this agent?</p>
            <Link href={`/agents/deploy?template=${template.id}`}>
              <Button size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Deploy {template.name}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
