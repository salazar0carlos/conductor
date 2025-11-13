'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToActivities, unsubscribe } from '@/lib/collaboration/realtime'
import Link from 'next/link'
import {
  Activity,
  CheckCircle2,
  MessageSquare,
  FileText,
  GitBranch,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Upload,
  Edit,
  Trash2,
  Clock
} from 'lucide-react'
import { generateUserColor } from '@/lib/collaboration/presence'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface CollaborationActivity {
  id: string
  user_id: string | null
  activity_type: string
  entity_type: string
  entity_id: string
  project_id: string | null
  title: string
  description: string | null
  changes: any
  mentioned_users: string[]
  created_at: string
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

interface ActivityFeedProps {
  projectId?: string
  limit?: number
  showFilters?: boolean
  realtime?: boolean
}

export function CollaborationActivityFeed({
  projectId,
  limit = 50,
  showFilters = true,
  realtime = true
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<CollaborationActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'none' | 'time' | 'user'>('time')
  const supabase = createClient()
  const channel: RealtimeChannel | null = null

  useEffect(() => {
    fetchActivities()

    if (realtime) {
      const channel = subscribeToActivities(projectId || null, () => {
        fetchActivities()
      })

      return () => {
        unsubscribe(channel)
      }
    }
  }, [projectId, filter, limit])

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('collaboration_activities')
        .select(`
          *,
          user:team_members(name, email, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (filter !== 'all') {
        query = query.eq('activity_type', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setActivities(data || [])
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupActivities = () => {
    if (groupBy === 'none') return { ungrouped: activities }

    if (groupBy === 'time') {
      const grouped: Record<string, CollaborationActivity[]> = {}
      const now = new Date()

      activities.forEach(activity => {
        const activityDate = new Date(activity.created_at)
        const diffHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60)

        let group
        if (diffHours < 1) {
          group = 'Last hour'
        } else if (diffHours < 24) {
          group = 'Today'
        } else if (diffHours < 48) {
          group = 'Yesterday'
        } else if (diffHours < 168) {
          group = 'This week'
        } else {
          group = 'Older'
        }

        if (!grouped[group]) grouped[group] = []
        grouped[group].push(activity)
      })

      return grouped
    }

    if (groupBy === 'user') {
      const grouped: Record<string, CollaborationActivity[]> = {}

      activities.forEach(activity => {
        const userName = activity.user?.name || activity.user?.email || 'Unknown'
        if (!grouped[userName]) grouped[userName] = []
        grouped[userName].push(activity)
      })

      return grouped
    }

    return { ungrouped: activities }
  }

  const activityTypes = [
    { value: 'all', label: 'All' },
    { value: 'task_created', label: 'Tasks' },
    { value: 'comment_added', label: 'Comments' },
    { value: 'workflow_updated', label: 'Workflows' },
    { value: 'member_joined', label: 'Members' },
    { value: 'entity_watched', label: 'Watching' }
  ]

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const groupedActivities = groupActivities()

  return (
    <div className="border border-neutral-800 rounded-lg bg-neutral-950">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </h3>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              {activityTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-1 text-xs bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-full focus:outline-none focus:border-neutral-700"
            >
              <option value="none">No grouping</option>
              <option value="time">Group by time</option>
              <option value="user">Group by user</option>
            </select>
          </div>
        )}
      </div>

      {/* Activities list */}
      <div className="max-h-[600px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {Object.entries(groupedActivities).map(([group, groupActivities]) => (
              <div key={group}>
                {groupBy !== 'none' && (
                  <div className="px-4 py-2 bg-neutral-900/50 text-xs font-semibold text-neutral-500 uppercase">
                    {group}
                  </div>
                )}
                <div className="divide-y divide-neutral-800/50">
                  {groupActivities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ActivityItemProps {
  activity: CollaborationActivity
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.activity_type) {
      case 'task_created':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'task_updated':
        return <Edit className="w-4 h-4 text-yellow-500" />
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'workflow_created':
      case 'workflow_updated':
        return <GitBranch className="w-4 h-4 text-purple-500" />
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-cyan-500" />
      case 'comment_resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'file_uploaded':
        return <Upload className="w-4 h-4 text-orange-500" />
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-green-500" />
      case 'member_left':
        return <UserMinus className="w-4 h-4 text-red-500" />
      case 'entity_watched':
        return <Eye className="w-4 h-4 text-blue-500" />
      case 'entity_unwatched':
        return <EyeOff className="w-4 h-4 text-neutral-500" />
      default:
        return <Activity className="w-4 h-4 text-neutral-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  return (
    <div className="flex gap-3 p-4 hover:bg-neutral-900/30 transition-colors group">
      {/* User avatar */}
      <div
        className="w-8 h-8 rounded-full border-2 border-neutral-800 flex items-center justify-center font-semibold text-white text-xs overflow-hidden flex-shrink-0"
        style={{
          backgroundColor: activity.user?.avatar_url ? undefined : generateUserColor(activity.user_id || '')
        }}
      >
        {activity.user?.avatar_url ? (
          <img
            src={activity.user.avatar_url}
            alt={activity.user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>
            {(activity.user?.name || activity.user?.email || '?')[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Activity icon */}
      <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">
          <span className="font-medium">
            {activity.user?.name || activity.user?.email || 'Someone'}
          </span>
          {' '}
          <span className="text-neutral-400">{activity.title}</span>
        </div>

        {activity.description && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Changes summary */}
        {activity.changes && Object.keys(activity.changes).length > 0 && (
          <div className="mt-2 text-xs">
            <details className="text-neutral-500">
              <summary className="cursor-pointer hover:text-neutral-400">
                View changes
              </summary>
              <div className="mt-2 p-2 bg-neutral-900 rounded border border-neutral-800">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(activity.changes, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
          <Clock className="w-3 h-3" />
          {formatTime(activity.created_at)}
        </div>
      </div>
    </div>
  )
}
