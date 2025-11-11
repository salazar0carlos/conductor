'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Task } from '@/types'

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Loading tasks...</div>
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress':
      case 'assigned': return 'primary'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      default: return 'neutral'
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '✨'
      case 'bugfix': return '🐛'
      case 'refactor': return '🔧'
      case 'test': return '🧪'
      case 'docs': return '📝'
      case 'analysis': return '🔍'
      case 'review': return '👁️'
      default: return '📋'
    }
  }

  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <div className="text-center py-12 border border-neutral-800 rounded-lg">
          <p className="text-neutral-400">No tasks yet</p>
        </div>
      ) : (
        tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="block border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 hover:bg-neutral-900/50 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-xl">{typeIcon(task.type)}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-neutral-400 line-clamp-2">{task.description}</p>
                  )}
                </div>
              </div>
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Priority: {task.priority}</span>
              <span>•</span>
              <span>{task.type}</span>
              {task.assigned_agent_id && (
                <>
                  <span>•</span>
                  <span>Agent assigned</span>
                </>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
