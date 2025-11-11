'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import type { Project } from '@/types'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    type: 'feature' as const,
    priority: 5,
    required_capabilities: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.data)
        if (data.data.length > 0) {
          setFormData(prev => ({ ...prev, project_id: data.data[0].id }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const capabilities = formData.required_capabilities
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          required_capabilities: capabilities,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onClose()
        router.refresh()
        setFormData({
          project_id: projects[0]?.id || '',
          title: '',
          description: '',
          type: 'feature',
          priority: 5,
          required_capabilities: '',
        })
      } else {
        setError(data.error || 'Failed to create task')
      }
    } catch (err) {
      setError('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900">
          <h2 className="text-xl font-semibold text-white">Create Task</h2>
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
            <label htmlFor="project_id" className="block text-sm font-medium text-white mb-2">
              Project *
            </label>
            <select
              id="project_id"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              required
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              placeholder="Implement user authentication"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600 resize-none"
              placeholder="Add JWT-based authentication with refresh tokens"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-white mb-2">
              Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              required
            >
              <option value="feature">Feature</option>
              <option value="bugfix">Bug Fix</option>
              <option value="refactor">Refactor</option>
              <option value="test">Test</option>
              <option value="docs">Documentation</option>
              <option value="analysis">Analysis</option>
              <option value="review">Review</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-white mb-2">
              Priority: {formData.priority}/10
            </label>
            <input
              type="range"
              id="priority"
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Low (0)</span>
              <span>High (10)</span>
            </div>
          </div>

          <div>
            <label htmlFor="required_capabilities" className="block text-sm font-medium text-white mb-2">
              Required Capabilities
            </label>
            <input
              type="text"
              id="required_capabilities"
              value={formData.required_capabilities}
              onChange={(e) => setFormData({ ...formData, required_capabilities: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              placeholder="coding, authentication, security"
            />
            <p className="text-xs text-neutral-500 mt-1">Comma-separated list</p>
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
            <Button type="submit" className="flex-1" disabled={loading || projects.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
