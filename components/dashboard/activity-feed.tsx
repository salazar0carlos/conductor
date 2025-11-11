'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Clock, CheckCircle2, XCircle, AlertCircle, Bot, FileText, Lightbulb } from 'lucide-react'

interface Activity {
  id: string
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'agent_registered' | 'analysis_created'
  title: string
  description: string
  timestamp: string
  link?: string
  icon: React.ReactNode
  color: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()

    // Set up real-time subscription for activity updates
    const supabase = createClient()

    const tasksChannel = supabase
      .channel('activity-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        handleTaskUpdate(payload)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agents' }, (payload) => {
        handleAgentCreated(payload.new)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analysis_history' }, (payload) => {
        handleAnalysisCreated(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
    }
  }, [])

  const fetchActivities = async () => {
    try {
      const supabase = createClient()

      // Fetch recent tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .order('updated_at', { descending: true })
        .limit(10)

      // Fetch recent agents
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { descending: true })
        .limit(5)

      // Fetch recent analyses
      const { data: analyses } = await supabase
        .from('analysis_history')
        .select('*')
        .order('created_at', { descending: true })
        .limit(5)

      const activityItems: Activity[] = []

      // Process tasks
      tasks?.forEach((task: any) => {
        if (task.status === 'completed') {
          activityItems.push({
            id: `task-${task.id}`,
            type: 'task_completed',
            title: 'Task completed',
            description: task.title,
            timestamp: task.completed_at || task.updated_at,
            link: `/tasks/${task.id}`,
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: 'text-green-500'
          })
        } else if (task.status === 'failed') {
          activityItems.push({
            id: `task-${task.id}`,
            type: 'task_failed',
            title: 'Task failed',
            description: task.title,
            timestamp: task.completed_at || task.updated_at,
            link: `/tasks/${task.id}`,
            icon: <XCircle className="w-4 h-4" />,
            color: 'text-red-500'
          })
        } else if (task.status === 'in_progress' && task.started_at) {
          activityItems.push({
            id: `task-${task.id}`,
            type: 'task_started',
            title: 'Task started',
            description: task.title,
            timestamp: task.started_at,
            link: `/tasks/${task.id}`,
            icon: <Clock className="w-4 h-4" />,
            color: 'text-yellow-500'
          })
        } else if (task.status === 'pending') {
          activityItems.push({
            id: `task-${task.id}`,
            type: 'task_created',
            title: 'Task created',
            description: task.title,
            timestamp: task.created_at,
            link: `/tasks/${task.id}`,
            icon: <FileText className="w-4 h-4" />,
            color: 'text-blue-500'
          })
        }
      })

      // Process agents
      agents?.forEach((agent: any) => {
        activityItems.push({
          id: `agent-${agent.id}`,
          type: 'agent_registered',
          title: 'Agent registered',
          description: agent.name,
          timestamp: agent.created_at,
          link: `/agents`,
          icon: <Bot className="w-4 h-4" />,
          color: 'text-purple-500'
        })
      })

      // Process analyses
      analyses?.forEach((analysis: any) => {
        activityItems.push({
          id: `analysis-${analysis.id}`,
          type: 'analysis_created',
          title: 'Analysis created',
          description: analysis.analysis_type.replace(/_/g, ' '),
          timestamp: analysis.created_at,
          link: `/intelligence/${analysis.id}`,
          icon: <Lightbulb className="w-4 h-4" />,
          color: 'text-cyan-500'
        })
      })

      // Sort by timestamp and take top 20
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setActivities(activityItems.slice(0, 20))

    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      const task = payload.new
      const newActivity: Activity = {
        id: `task-${task.id}-${Date.now()}`,
        type: 'task_created',
        title: 'Task created',
        description: task.title,
        timestamp: task.created_at,
        link: `/tasks/${task.id}`,
        icon: <FileText className="w-4 h-4" />,
        color: 'text-blue-500'
      }
      setActivities(prev => [newActivity, ...prev].slice(0, 20))
    } else if (payload.eventType === 'UPDATE') {
      const task = payload.new
      let newActivity: Activity | null = null

      if (task.status === 'completed' && payload.old.status !== 'completed') {
        newActivity = {
          id: `task-${task.id}-completed-${Date.now()}`,
          type: 'task_completed',
          title: 'Task completed',
          description: task.title,
          timestamp: task.completed_at || new Date().toISOString(),
          link: `/tasks/${task.id}`,
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'text-green-500'
        }
      } else if (task.status === 'failed' && payload.old.status !== 'failed') {
        newActivity = {
          id: `task-${task.id}-failed-${Date.now()}`,
          type: 'task_failed',
          title: 'Task failed',
          description: task.title,
          timestamp: task.completed_at || new Date().toISOString(),
          link: `/tasks/${task.id}`,
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-500'
        }
      } else if (task.status === 'in_progress' && payload.old.status !== 'in_progress') {
        newActivity = {
          id: `task-${task.id}-started-${Date.now()}`,
          type: 'task_started',
          title: 'Task started',
          description: task.title,
          timestamp: task.started_at || new Date().toISOString(),
          link: `/tasks/${task.id}`,
          icon: <Clock className="w-4 h-4" />,
          color: 'text-yellow-500'
        }
      }

      if (newActivity) {
        setActivities(prev => [newActivity, ...prev].slice(0, 20))
      }
    }
  }

  const handleAgentCreated = (agent: any) => {
    const newActivity: Activity = {
      id: `agent-${agent.id}-${Date.now()}`,
      type: 'agent_registered',
      title: 'Agent registered',
      description: agent.name,
      timestamp: agent.created_at,
      link: `/agents`,
      icon: <Bot className="w-4 h-4" />,
      color: 'text-purple-500'
    }
    setActivities(prev => [newActivity, ...prev].slice(0, 20))
  }

  const handleAnalysisCreated = (analysis: any) => {
    const newActivity: Activity = {
      id: `analysis-${analysis.id}-${Date.now()}`,
      type: 'analysis_created',
      title: 'Analysis created',
      description: analysis.analysis_type.replace(/_/g, ' '),
      timestamp: analysis.created_at,
      link: `/intelligence/${analysis.id}`,
      icon: <Lightbulb className="w-4 h-4" />,
      color: 'text-cyan-500'
    }
    setActivities(prev => [newActivity, ...prev].slice(0, 20))
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime()
    const then = new Date(timestamp).getTime()
    const diff = now - then

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-neutral-800" />
              <div className="flex-1">
                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            activity.link ? (
              <Link
                key={activity.id}
                href={activity.link}
                className="flex gap-3 p-2 rounded-lg hover:bg-neutral-900/50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center ${activity.color} shrink-0 group-hover:scale-110 transition-transform`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-neutral-600 shrink-0">{getTimeAgo(activity.timestamp)}</span>
              </Link>
            ) : (
              <div key={activity.id} className="flex gap-3 p-2">
                <div className={`w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center ${activity.color} shrink-0`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-neutral-600 shrink-0">{getTimeAgo(activity.timestamp)}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
