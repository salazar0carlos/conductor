'use client'

import { useState } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/project-list'
import { CreateProjectModal } from '@/components/projects/create-project-modal'

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-neutral-400">Manage your development projects</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>New Project</Button>
        </div>

        <ProjectList onCreateClick={() => setIsModalOpen(true)} />
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
