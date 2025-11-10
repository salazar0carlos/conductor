import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { ProjectList } from '@/components/projects/project-list'

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-neutral-400">Manage your development projects</p>
          </div>
          <Button>New Project</Button>
        </div>

        <ProjectList />
      </main>
    </div>
  )
}
