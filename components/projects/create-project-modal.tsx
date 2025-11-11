'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    github_repo: '',
    github_branch: 'main',
  })

  const [createNewRepo, setCreateNewRepo] = useState(false)
  const [repoSettings, setRepoSettings] = useState({
    repoName: '',
    isPrivate: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const projectData = { ...formData }

      // Step 1: Create GitHub repo if requested
      if (createNewRepo) {
        const repoName = repoSettings.repoName || formData.name.toLowerCase().replace(/\s+/g, '-')

        const repoResponse = await fetch('/api/github/repos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: repoName,
            description: formData.description,
            private: repoSettings.isPrivate,
          }),
        })

        const repoData = await repoResponse.json()

        if (!repoData.success) {
          setError(repoData.error || 'Failed to create GitHub repository')
          setLoading(false)
          return
        }

        // Update project data with new repo info
        projectData.github_repo = repoData.data.repo.full_name
        projectData.github_branch = repoData.data.repo.default_branch
      }

      // Step 2: Create project
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })

      const data = await response.json()

      if (data.success) {
        onClose()
        router.refresh()
        setFormData({ name: '', description: '', github_repo: '', github_branch: 'main' })
        setCreateNewRepo(false)
        setRepoSettings({ repoName: '', isPrivate: true })
      } else {
        setError(data.error || 'Failed to create project')
      }
    } catch (err) {
      setError('Failed to create project. Please try again.')
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
          <h2 className="text-xl font-semibold text-white">Create Project</h2>
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
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
              placeholder="My Awesome Project"
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
              placeholder="A brief description of your project"
              rows={3}
            />
          </div>

          {/* GitHub Integration */}
          <div className="border border-neutral-700 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  GitHub Integration
                </label>
                <p className="text-xs text-neutral-500">
                  Create a new repository or connect to an existing one
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createNewRepo}
                  onChange={(e) => setCreateNewRepo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {createNewRepo ? (
              <>
                <div>
                  <label htmlFor="repo_name" className="block text-sm font-medium text-white mb-2">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    id="repo_name"
                    value={repoSettings.repoName}
                    onChange={(e) => setRepoSettings({ ...repoSettings, repoName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                    placeholder={formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : 'my-project'}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Leave blank to use project name. Letters, numbers, hyphens, and underscores only.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={repoSettings.isPrivate}
                    onChange={(e) => setRepoSettings({ ...repoSettings, isPrivate: e.target.checked })}
                    className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-neutral-900"
                  />
                  <label htmlFor="is_private" className="text-sm text-neutral-300">
                    Make repository private
                  </label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="github_repo" className="block text-sm font-medium text-white mb-2">
                    GitHub Repository
                  </label>
                  <input
                    type="text"
                    id="github_repo"
                    value={formData.github_repo}
                    onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                    placeholder="username/repository"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Format: username/repository</p>
                </div>

                <div>
                  <label htmlFor="github_branch" className="block text-sm font-medium text-white mb-2">
                    GitHub Branch
                  </label>
                  <input
                    type="text"
                    id="github_branch"
                    value={formData.github_branch}
                    onChange={(e) => setFormData({ ...formData, github_branch: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                    placeholder="main"
                  />
                </div>
              </>
            )}
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
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
