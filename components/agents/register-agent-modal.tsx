'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'

interface RegisterAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegisterAgentModal({ isOpen, onClose }: RegisterAgentModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'llm' as const,
    capabilities: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const capabilities = formData.capabilities
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          capabilities,
          config: {},
        }),
      })

      const data = await response.json()

      if (data.success) {
        onClose()
        router.refresh()
        setFormData({ name: '', type: 'llm', capabilities: '' })
      } else {
        setError(data.error || 'Failed to register agent')
      }
    } catch (err) {
      setError('Failed to register agent. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">Register Agent</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              placeholder="My Custom Agent"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-white mb-2">
              Agent Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              required
            >
              <option value="llm">LLM (Language Model)</option>
              <option value="tool">Tool Agent</option>
              <option value="human">Human Agent</option>
              <option value="supervisor">Supervisor</option>
              <option value="analyzer">Analyzer</option>
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Choose the type that best describes your agent
            </p>
          </div>

          <div>
            <label htmlFor="capabilities" className="block text-sm font-medium text-white mb-2">
              Capabilities *
            </label>
            <input
              type="text"
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              placeholder="coding, debugging, testing"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Comma-separated list of what this agent can do
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-400 mb-2 font-medium">Next Steps</p>
            <p className="text-xs text-neutral-400">
              After registration, you&apos;ll need to run the agent code to start polling for tasks.
              Check the examples/ directory for starter code in Python or TypeScript.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Agent'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
