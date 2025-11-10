import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/task-list'

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
            <p className="text-neutral-400">Manage and monitor task execution</p>
          </div>
          <Button>New Task</Button>
        </div>

        <TaskList />
      </main>
    </div>
  )
}
