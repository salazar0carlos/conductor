'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Github, Database, Palette, CheckCircle2 } from 'lucide-react'
import { getAllTemplates } from '@/lib/design-system'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  const templates = getAllTemplates()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    github_repo: '',
    github_branch: 'main',
    design_template: 'minimal',
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

  const fetchSupabaseOrgs = async () => {
    if (supabaseOrgs.length > 0) return

    setLoadingOrgs(true)
    setOrgsError(null)

    try {
      const response = await fetch('/api/supabase/organizations')
      const data = await response.json()

      if (data.success) {
        setSupabaseOrgs(data.data.organizations)
        if (data.data.organizations.length > 0) {
          setSupabaseSettings({ ...supabaseSettings, organizationId: data.data.organizations[0].id })
        }
      } else {
        setOrgsError(data.error || 'Failed to fetch organizations')
      }
    } catch {
      setOrgsError('Failed to fetch Supabase organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

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

        projectData.github_repo = repoData.data.repo.full_name
        projectData.github_branch = repoData.data.repo.default_branch
      }

      // Step 2: Create Supabase project if requested
      let supabaseProjectData: any = null
      if (createSupabaseProject) {
        if (!supabaseSettings.organizationId) {
          setError('Supabase Organization ID is required.')
          setLoading(false)
          return
        }

        let supabaseProjectName = formData.name.toLowerCase().replace(/\s+/g, '-')
        if (createNewRepo && projectData.github_repo) {
          const repoName = projectData.github_repo.split('/')[1]
          supabaseProjectName = repoName
        } else if (createNewRepo) {
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
          if (migrationsData.success) {
            console.log('Migrations applied:', migrationsData.data)
          }
        }
      }

      // Step 3: Create project in Conductor
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
        router.push('/projects')
      } else {
        setError(data.error || 'Failed to create project')
      }
    } catch {
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === formData.design_template) || templates[0]

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
              <h1 className="text-xl font-semibold text-white">Create New Project</h1>
              <p className="text-sm text-neutral-400">Set up your autonomous agency project</p>
            </div>
          </div>
          <Button onClick={() => router.back()} variant="secondary">
            Cancel
          </Button>
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

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'Design', icon: Palette },
              { num: 2, label: 'Basic Info', icon: CheckCircle2 },
              { num: 3, label: 'GitHub', icon: Github },
              { num: 4, label: 'Supabase', icon: Database },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    currentStep >= step.num
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {i < 3 && <div className="w-8 h-px bg-neutral-700 mx-1" />}
              </div>
            ))}
          </div>

          {/* Section 1: Design Template */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Design System</h2>
                <p className="text-sm text-neutral-400">Choose a design template for your project</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const isSelected = formData.design_template === template.id
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, design_template: template.id })
                      if (currentStep < 1) setCurrentStep(1)
                    }}
                    className={`relative group text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Color Preview Swatches */}
                    <div className="flex gap-1 mb-3">
                      <div
                        className="w-6 h-6 rounded border border-neutral-600"
                        style={{ background: `${template.theme.light.primary}` }}
                        title="Primary"
                      />
                      <div
                        className="w-6 h-6 rounded border border-neutral-600"
                        style={{ background: `${template.theme.light.secondary}` }}
                        title="Secondary"
                      />
                      <div
                        className="w-6 h-6 rounded border border-neutral-600"
                        style={{ background: `${template.theme.light.accent}` }}
                        title="Accent"
                      />
                    </div>

                    <div className="mb-3">
                      <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                      <p className="text-xs text-neutral-400 line-clamp-2">{template.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.metadata.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded bg-neutral-700 text-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedTemplate && (
              <div className="p-6 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Palette className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{selectedTemplate.name} Template</h4>
                      <p className="text-sm text-neutral-400 mb-3">{selectedTemplate.description}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                    className="text-xs"
                  >
                    {showTemplatePreview ? 'Hide' : 'Preview'}
                  </Button>
                </div>

                {showTemplatePreview && (
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-neutral-700">
                    {/* Light Mode Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-300 mb-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        Light Mode
                      </div>
                      <div className="p-4 rounded-lg border" style={{ background: `${selectedTemplate.theme.light.background}` }}>
                        <div className="space-y-2">
                          <div
                            className="px-3 py-1.5 rounded font-medium text-sm"
                            style={{
                              background: `${selectedTemplate.theme.light.primary}`,
                              color: `${selectedTemplate.theme.light.primaryForeground}`
                            }}
                          >
                            Primary Button
                          </div>
                          <div
                            className="px-3 py-1.5 rounded text-sm border"
                            style={{
                              background: `${selectedTemplate.theme.light.card}`,
                              color: `${selectedTemplate.theme.light.cardForeground}`,
                              borderColor: `${selectedTemplate.theme.light.border}`
                            }}
                          >
                            Card Component
                          </div>
                        </div>
                      </div>
                      {/* Color Swatches */}
                      <div className="flex gap-1">
                        {['primary', 'secondary', 'accent', 'muted'].map((color) => (
                          <div key={color} className="flex-1 text-center">
                            <div
                              className="w-full h-8 rounded border border-neutral-600 mb-1"
                              style={{ background: `${selectedTemplate.theme.light[color as keyof typeof selectedTemplate.theme.light]}` }}
                            />
                            <span className="text-[10px] text-neutral-500 capitalize">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dark Mode Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-300 mb-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-400" />
                        Dark Mode
                      </div>
                      <div className="p-4 rounded-lg border" style={{ background: `${selectedTemplate.theme.dark.background}` }}>
                        <div className="space-y-2">
                          <div
                            className="px-3 py-1.5 rounded font-medium text-sm"
                            style={{
                              background: `${selectedTemplate.theme.dark.primary}`,
                              color: `${selectedTemplate.theme.dark.primaryForeground}`
                            }}
                          >
                            Primary Button
                          </div>
                          <div
                            className="px-3 py-1.5 rounded text-sm border"
                            style={{
                              background: `${selectedTemplate.theme.dark.card}`,
                              color: `${selectedTemplate.theme.dark.cardForeground}`,
                              borderColor: `${selectedTemplate.theme.dark.border}`
                            }}
                          >
                            Card Component
                          </div>
                        </div>
                      </div>
                      {/* Color Swatches */}
                      <div className="flex gap-1">
                        {['primary', 'secondary', 'accent', 'muted'].map((color) => (
                          <div key={color} className="flex-1 text-center">
                            <div
                              className="w-full h-8 rounded border border-neutral-600 mb-1"
                              style={{ background: `${selectedTemplate.theme.dark[color as keyof typeof selectedTemplate.theme.dark]}` }}
                            />
                            <span className="text-[10px] text-neutral-500 capitalize">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span>✓ Light & Dark Mode</span>
                  <span>✓ {selectedTemplate.category === 'enterprise' ? 'WCAG AAA' : 'WCAG AA'}</span>
                  <span>✓ shadcn/ui Ready</span>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Basic Info */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Project Information</h2>
                <p className="text-sm text-neutral-400">Basic details about your project</p>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (currentStep < 2) setCurrentStep(2)
                }}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="A brief description of your project"
                rows={3}
              />
            </div>
          </section>

          {/* Section 3: GitHub Integration */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <Github className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>
                  <p className="text-sm text-neutral-400">Connect to a repository</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createNewRepo}
                  onChange={(e) => {
                    setCreateNewRepo(e.target.checked)
                    if (e.target.checked && currentStep < 3) setCurrentStep(3)
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm text-neutral-300">Create new repository</span>
              </label>
            </div>

            {createNewRepo ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="repo_name" className="block text-sm font-medium text-white mb-2">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    id="repo_name"
                    value={repoSettings.repoName}
                    onChange={(e) => setRepoSettings({ ...repoSettings, repoName: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    placeholder={formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : 'my-project'}
                  />
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Leave blank to use project name
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={repoSettings.isPrivate}
                    onChange={(e) => setRepoSettings({ ...repoSettings, isPrivate: e.target.checked })}
                    className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="is_private" className="text-sm text-neutral-300">
                    Make repository private
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="github_repo" className="block text-sm font-medium text-white mb-2">
                    GitHub Repository
                  </label>
                  <input
                    type="text"
                    id="github_repo"
                    value={formData.github_repo}
                    onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    placeholder="username/repository"
                  />
                  <p className="text-xs text-neutral-500 mt-1.5">Format: username/repository</p>
                </div>

                <div>
                  <label htmlFor="github_branch" className="block text-sm font-medium text-white mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    id="github_branch"
                    value={formData.github_branch}
                    onChange={(e) => setFormData({ ...formData, github_branch: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    placeholder="main"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Supabase Integration */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Supabase Integration</h2>
                  <p className="text-sm text-neutral-400">Create a new database project</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSupabaseProject}
                  onChange={(e) => {
                    setCreateSupabaseProject(e.target.checked)
                    if (e.target.checked) {
                      fetchSupabaseOrgs()
                      if (currentStep < 4) setCurrentStep(4)
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm text-neutral-300">Create Supabase project</span>
              </label>
            </div>

            {createSupabaseProject && (
              <div className="space-y-4">
                {orgsError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    {orgsError}
                  </div>
                )}

                <div>
                  <label htmlFor="supabase_org_id" className="block text-sm font-medium text-white mb-2">
                    Organization *
                  </label>
                  {loadingOrgs ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading organizations...</span>
                    </div>
                  ) : supabaseOrgs.length > 0 ? (
                    <select
                      id="supabase_org_id"
                      value={supabaseSettings.organizationId}
                      onChange={(e) => setSupabaseSettings({ ...supabaseSettings, organizationId: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-green-500"
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
                      No organizations found. Set SUPABASE_MANAGEMENT_TOKEN in your environment.
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="supabase_region" className="block text-sm font-medium text-white mb-2">
                    Region
                  </label>
                  <select
                    id="supabase_region"
                    value={supabaseSettings.region}
                    onChange={(e) => setSupabaseSettings({ ...supabaseSettings, region: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-green-500"
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
                      className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-green-600 focus:ring-green-600"
                    />
                    <label htmlFor="apply_migrations" className="text-sm text-neutral-300">
                      Apply migrations from GitHub repo
                    </label>
                  </div>
                )}
              </div>
            )}
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
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Project...
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
