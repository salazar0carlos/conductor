'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToNotifications, unsubscribe } from '@/lib/collaboration/realtime'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  MessageSquare,
  FileText,
  GitBranch,
  UserPlus,
  AtSign,
  AlertCircle,
  Filter
} from 'lucide-react'
import { generateUserColor } from '@/lib/collaboration/presence'
import type { RealtimeChannel } from '@supabase/supabase-js'
import Link from 'next/link'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  entity_type: string | null
  entity_id: string | null
  action_url: string | null
  triggered_by_id: string | null
  is_read: boolean
  is_archived: boolean
  read_at: string | null
  created_at: string
  triggered_by?: {
    name: string
    email: string
    avatar_url?: string
  }
}

interface NotificationsProps {
  currentUserId: string
}

export function NotificationCenter({ currentUserId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    channelRef.current = subscribeToNotifications(currentUserId, () => {
      fetchNotifications()
    })

    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }
    }
  }, [currentUserId, filter, selectedType])

  const fetchNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          triggered_by:team_members!notifications_triggered_by_id_fkey(name, email, avatar_url)
        `)
        .eq('user_id', currentUserId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'unread') {
        query = query.eq('is_read', false)
      } else if (filter === 'read') {
        query = query.eq('is_read', true)
      }

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType)
      }

      const { data, error } = await query

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId)
        .eq('is_read', false)

      if (error) throw error

      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Failed to archive notification:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-neutral-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-neutral-500 hover:text-white rounded"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'read'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Read
              </button>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2 py-1 text-xs bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-full focus:outline-none focus:border-neutral-700"
              >
                <option value="all">All types</option>
                <option value="mention">Mentions</option>
                <option value="comment">Comments</option>
                <option value="task_assigned">Tasks</option>
                <option value="chat_message">Chat</option>
              </select>
            </div>
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-neutral-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-neutral-800 rounded w-3/4" />
                      <div className="h-3 bg-neutral-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onArchive={() => archiveNotification(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-neutral-800">
            <Link
              href="/settings/notifications"
              className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: () => void
  onArchive: () => void
}

function NotificationItem({ notification, onMarkAsRead, onArchive }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-500" />
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-cyan-500" />
      case 'task_assigned':
      case 'task_updated':
      case 'task_completed':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'workflow_updated':
        return <GitBranch className="w-4 h-4 text-purple-500" />
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-pink-500" />
      case 'watching_update':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'system':
        return <Bell className="w-4 h-4 text-neutral-500" />
      default:
        return <Bell className="w-4 h-4 text-neutral-500" />
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
    return `${days}d ago`
  }

  const content = (
    <div
      className={`flex gap-3 p-3 hover:bg-neutral-900/30 transition-colors cursor-pointer group ${
        !notification.is_read ? 'bg-blue-950/10' : ''
      }`}
      onClick={() => {
        if (!notification.is_read) {
          onMarkAsRead()
        }
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center font-semibold text-white text-xs overflow-hidden flex-shrink-0"
        style={{
          backgroundColor: notification.triggered_by?.avatar_url
            ? undefined
            : generateUserColor(notification.triggered_by_id || '')
        }}
      >
        {notification.triggered_by?.avatar_url ? (
          <img
            src={notification.triggered_by.avatar_url}
            alt={notification.triggered_by.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>
            {(notification.triggered_by?.name || notification.triggered_by?.email || '?')[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-sm font-medium text-white line-clamp-1">
              {notification.title}
            </span>
          </div>

          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
          )}
        </div>

        <p className="text-xs text-neutral-400 line-clamp-2 mb-2">
          {notification.message}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-600">
            {formatTime(notification.created_at)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead()
                }}
                className="p-1 text-neutral-500 hover:text-white rounded"
                title="Mark as read"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
              className="p-1 text-neutral-500 hover:text-red-500 rounded"
              title="Archive"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} onClick={onMarkAsRead}>
        {content}
      </Link>
    )
  }

  return content
}

// Compact notification badge for navigation
export function NotificationBadge({ currentUserId }: NotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    fetchUnreadCount()

    channelRef.current = subscribeToNotifications(currentUserId, () => {
      fetchUnreadCount()
    })

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }
    }
  }, [currentUserId])

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false)
        .eq('is_archived', false)

      if (error) throw error

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  if (unreadCount === 0) return null

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
