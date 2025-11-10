'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Project } from '@/types'

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Loading projects...</div>
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'paused': return 'warning'
      case 'archived': return 'neutral'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      {projects.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-400 mb-4">No projects yet</p>
          <Button>Create Your First Project</Button>
        </div>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            className="border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-neutral-400">{project.description}</p>
                )}
              </div>
              <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
            </div>

            {project.github_repo && (
              <div className="flex items-center text-sm text-neutral-500 mb-3">
                <span className="mr-2">🔗</span>
                <span>{project.github_repo}</span>
                {project.github_branch && (
                  <span className="ml-2 text-neutral-600">({project.github_branch})</span>
                )}
              </div>
            )}

            <div className="flex items-center text-xs text-neutral-500">
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
