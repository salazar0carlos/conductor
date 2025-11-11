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

  // Fetch Supabase organizations when modal opens and Supabase integration is enabled
  const fetchSupabaseOrgs = async () => {
    if (supabaseOrgs.length > 0) return // Already fetched

    setLoadingOrgs(true)
    setOrgsError(null)

    try {
      const response = await fetch('/api/supabase/organizations')
      const data = await response.json()

      if (data.success) {
        setSupabaseOrgs(data.data.organizations)
        // Auto-select first org if available
        if (data.data.organizations.length > 0) {
          setSupabaseSettings({ ...supabaseSettings, organizationId: data.data.organizations[0].id })
        }
      } else {
        setOrgsError(data.error || 'Failed to fetch organizations')
      }
    } catch (err) {
      setOrgsError('Failed to fetch Supabase organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

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

  const [createSupabaseProject, setCreateSupabaseProject] = useState(false)
  const [supabaseSettings, setSupabaseSettings] = useState({
    organizationId: '',
    region: 'us-east-1',
    applyMigrations: true,
  })

  const [supabaseOrgs, setSupabaseOrgs] = useState<Array<{ id: string; name: string }>>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [orgsError, setOrgsError] = useState<string | null>(null)

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

      // Step 2: Create Supabase project if requested
      let supabaseProjectData: any = null
      if (createSupabaseProject) {
        if (!supabaseSettings.organizationId) {
          setError('Supabase Organization ID is required. Find it in your Supabase dashboard.')
          setLoading(false)
          return
        }

        // Use the same name as GitHub repo if one was created, otherwise use project name
        let supabaseProjectName = formData.name.toLowerCase().replace(/\s+/g, '-')
        if (createNewRepo && projectData.github_repo) {
          // Extract repo name from full_name (e.g., "username/repo-name" -> "repo-name")
          const repoName = projectData.github_repo.split('/')[1]
          supabaseProjectName = repoName
        } else if (createNewRepo) {
          // Use the custom repo name if provided
          supabaseProjectName = repoSettings.repoName || supabaseProjectName
        }

        const supabaseResponse = await fetch('/api/supabase/projects/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: supabaseProjectName,
            organization_id: supabaseSettings.organizationId,
            region: supabaseSettings.region,
          }),
        })

        const supabaseData = await supabaseResponse.json()

        if (!supabaseData.success) {
          setError(supabaseData.error || 'Failed to create Supabase project')
          setLoading(false)
          return
        }

        supabaseProjectData = supabaseData.data.project

        // Step 2b: Apply migrations if requested
        if (supabaseSettings.applyMigrations && projectData.github_repo) {
          const migrationsResponse = await fetch('/api/supabase/migrations/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_ref: supabaseProjectData.id,
              db_password: supabaseProjectData.db_password,
              github_repo: projectData.github_repo,
              github_branch: projectData.github_branch,
            }),
          })

          const migrationsData = await migrationsResponse.json()
          // Continue even if migrations partially fail
          if (migrationsData.success) {
            console.log('Migrations applied:', migrationsData.data)
          }
        }
      }

      // Step 3: Create project in Conductor with all integration data
      const finalProjectData = {
        ...projectData,
        ...(supabaseProjectData && {
          supabase_project_id: supabaseProjectData.id,
          supabase_project_ref: supabaseProjectData.id,
          supabase_region: supabaseProjectData.region,
          supabase_endpoint: supabaseProjectData.endpoint,
          supabase_anon_key: supabaseProjectData.anon_key,
          supabase_db_password: supabaseProjectData.db_password,
          supabase_migrations_applied: supabaseSettings.applyMigrations,
        })
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProjectData),
      })

      const data = await response.json()

      if (data.success) {
        onClose()
        router.refresh()
        setFormData({ name: '', description: '', github_repo: '', github_branch: 'main' })
        setCreateNewRepo(false)
        setRepoSettings({ repoName: '', isPrivate: true })
        setCreateSupabaseProject(false)
        setSupabaseSettings({ organizationId: '', region: 'us-east-1', applyMigrations: true })
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

          {/* Supabase Integration */}
          <div className="border border-neutral-700 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Supabase Integration
                </label>
                <p className="text-xs text-neutral-500">
                  Create a new Supabase project and apply migrations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSupabaseProject}
                  onChange={(e) => {
                    setCreateSupabaseProject(e.target.checked)
                    if (e.target.checked) {
                      fetchSupabaseOrgs()
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {createSupabaseProject && (
              <>
                {orgsError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    {orgsError}
                  </div>
                )}

                <div>
                  <label htmlFor="supabase_org_id" className="block text-sm font-medium text-white mb-2">
                    Supabase Organization *
                  </label>
                  {loadingOrgs ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading organizations...</span>
                    </div>
                  ) : supabaseOrgs.length > 0 ? (
                    <select
                      id="supabase_org_id"
                      value={supabaseSettings.organizationId}
                      onChange={(e) => setSupabaseSettings({ ...supabaseSettings, organizationId: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                      required={createSupabaseProject}
                    >
                      {supabaseOrgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400">
                      No organizations found. Make sure SUPABASE_MANAGEMENT_TOKEN is set correctly.
                    </div>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    Your Supabase organization will be auto-selected
                  </p>
                </div>

                <div>
                  <label htmlFor="supabase_region" className="block text-sm font-medium text-white mb-2">
                    Region
                  </label>
                  <select
                    id="supabase_region"
                    value={supabaseSettings.region}
                    onChange={(e) => setSupabaseSettings({ ...supabaseSettings, region: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-1">US West (N. California)</option>
                    <option value="eu-west-1">EU West (Ireland)</option>
                    <option value="eu-central-1">EU Central (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                    <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                  </select>
                </div>

                {(createNewRepo || formData.github_repo) && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apply_migrations"
                      checked={supabaseSettings.applyMigrations}
                      onChange={(e) => setSupabaseSettings({ ...supabaseSettings, applyMigrations: e.target.checked })}
                      className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-green-600 focus:ring-green-600 focus:ring-offset-neutral-900"
                    />
                    <label htmlFor="apply_migrations" className="text-sm text-neutral-300">
                      Apply migrations from GitHub repo (supabase/migrations folder)
                    </label>
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    💡 <strong>Note:</strong> You need a Supabase Management API token. Set SUPABASE_MANAGEMENT_TOKEN in your environment variables.
                  </p>
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
