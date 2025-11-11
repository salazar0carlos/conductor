'use client'

import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { getAgentTemplate } from '@/lib/agents/templates'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function DeployAgentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')

  const [template, setTemplate] = useState<ReturnType<typeof getAgentTemplate>>()
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (templateId) {
      const tmpl = getAgentTemplate(templateId)
      if (tmpl) {
        setTemplate(tmpl)
        setName(tmpl.name)
        setSelectedCapabilities([...tmpl.capabilities])
      }
    }
  }, [templateId])

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeploying(true)
    setError(null)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type: template?.type,
          capabilities: selectedCapabilities,
          config: {
            ...template?.config,
            apiKey: apiKey, // Store encrypted in production
          },
          metadata: {
            templateId: template?.id,
            deployedAt: new Date().toISOString(),
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/agents`)
        }, 2000)
      } else {
        setError(data.error || 'Failed to deploy agent')
      }
    } catch (err) {
      setError('Failed to deploy agent. Please try again.')
    } finally {
      setDeploying(false)
    }
  }

  const toggleCapability = (capability: string) => {
    setSelectedCapabilities(prev =>
      prev.includes(capability)
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-neutral-400">Template not found</p>
            <Link href="/agents/templates" className="text-blue-500 hover:text-blue-400 mt-4 inline-block">
              Browse Templates
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Agent Deployed!</h2>
            <p className="text-neutral-400 mb-6">
              Your agent has been successfully deployed and is ready to accept tasks.
            </p>
            <Button onClick={() => router.push('/agents')}>
              View Agents
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/agents/templates"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                <Bot className="w-6 h-6 text-neutral-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Deploy {template.name}</h1>
                <p className="text-sm text-neutral-400">{template.description}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleDeploy} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Agent Name */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Agent Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-700"
                required
                placeholder="e.g., My Backend Architect"
              />
              <p className="text-xs text-neutral-500 mt-2">
                Give your agent a unique name to identify it
              </p>
            </div>

            {/* API Key */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <label htmlFor="apiKey" className="block text-sm font-medium text-white mb-2">
                AI API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-neutral-700"
                required
                placeholder="sk-..."
              />
              <p className="text-xs text-neutral-500 mt-2">
                {template.config.model?.includes('claude')
                  ? 'Enter your Anthropic API key'
                  : 'Enter your OpenAI API key'}
              </p>
            </div>

            {/* Capabilities */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-white mb-3">Capabilities</h3>
              <p className="text-xs text-neutral-500 mb-4">
                Select the capabilities this agent should have. You can customize these based on your needs.
              </p>
              <div className="space-y-2">
                {template.capabilities.map((capability) => (
                  <label
                    key={capability}
                    className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCapabilities.includes(capability)}
                      onChange={() => toggleCapability(capability)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-neutral-300">{capability}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-white mb-3">Configuration</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Type</dt>
                  <dd className="text-white capitalize">{template.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Model</dt>
                  <dd className="text-white">{template.config.model || 'Default'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Temperature</dt>
                  <dd className="text-white">{template.config.temperature || '0.7'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Selected Capabilities</dt>
                  <dd className="text-white">{selectedCapabilities.length}</dd>
                </div>
              </dl>
            </div>

            {/* Deploy Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={deploying}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={deploying || selectedCapabilities.length === 0}
              >
                {deploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Agent'
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
