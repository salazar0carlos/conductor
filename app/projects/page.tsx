'use client'

import { useRouter } from 'next/navigation'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/project-list'

export default function ProjectsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-neutral-400">Manage your development projects</p>
          </div>
          <Button onClick={() => router.push('/projects/new')}>New Project</Button>
        </div>

        <ProjectList onCreateClick={() => router.push('/projects/new')} />
      </main>
    </div>
  )
}
