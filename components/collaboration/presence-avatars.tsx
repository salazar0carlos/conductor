'use client'

import { useEffect, useState } from 'react'
import { PresenceManager, UserPresence, generateUserColor } from '@/lib/collaboration/presence'
import { Users, Circle } from 'lucide-react'

interface PresenceAvatarsProps {
  currentUserId: string
  page?: string
  entityType?: string
  entityId?: string
  maxDisplay?: number
  showNames?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PresenceAvatars({
  currentUserId,
  page,
  entityType,
  entityId,
  maxDisplay = 5,
  showNames = false,
  size = 'md'
}: PresenceAvatarsProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [presenceManager] = useState(() => new PresenceManager())

  useEffect(() => {
    presenceManager.initialize(currentUserId)

    if (page) {
      presenceManager.updateLocation(page, entityType, entityId)
    }

    // Fetch initial online users
    const fetchPresence = async () => {
      if (entityType && entityId) {
        const users = await presenceManager.getUsersOnEntity(entityType, entityId)
        setOnlineUsers(users.filter(u => u.user_id !== currentUserId))
      } else if (page) {
        const users = await presenceManager.getUsersOnPage(page)
        setOnlineUsers(users.filter(u => u.user_id !== currentUserId))
      } else {
        const users = await presenceManager.getOnlineUsers()
        setOnlineUsers(users.filter(u => u.user_id !== currentUserId))
      }
    }

    fetchPresence()

    // Subscribe to presence changes
    const channel = presenceManager.subscribeToPresenceChanges((users) => {
      setOnlineUsers(users.filter(u => u.user_id !== currentUserId))
    })

    // Cleanup
    return () => {
      presenceManager.disconnect()
    }
  }, [currentUserId, page, entityType, entityId])

  const displayedUsers = onlineUsers.slice(0, maxDisplay)
  const extraCount = Math.max(0, onlineUsers.length - maxDisplay)

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500'
  }

  if (onlineUsers.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2">
        {displayedUsers.map((presence) => (
          <div
            key={presence.id}
            className="relative group"
            title={presence.user?.name || presence.user?.email || 'Unknown User'}
          >
            <div
              className={`${sizeClasses[size]} rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center font-semibold text-white overflow-hidden transition-transform hover:scale-110 hover:z-10`}
              style={{
                backgroundColor: presence.user?.avatar_url ? undefined : generateUserColor(presence.user_id)
              }}
            >
              {presence.user?.avatar_url ? (
                <img
                  src={presence.user.avatar_url}
                  alt={presence.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {(presence.user?.name || presence.user?.email || '?')[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Status indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900 ${
                statusColors[presence.status]
              }`}
            />

            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-lg">
              <div className="text-sm font-medium text-white">
                {presence.user?.name || presence.user?.email}
              </div>
              <div className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                <Circle className={`w-2 h-2 fill-current ${statusColors[presence.status].replace('bg-', 'text-')}`} />
                {presence.status}
                {presence.activity_type && ` • ${presence.activity_type}`}
              </div>
              {presence.status_message && (
                <div className="text-xs text-neutral-500 mt-1">
                  {presence.status_message}
                </div>
              )}
            </div>
          </div>
        ))}

        {extraCount > 0 && (
          <div
            className={`${sizeClasses[size]} rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center font-semibold text-neutral-400`}
            title={`${extraCount} more user${extraCount > 1 ? 's' : ''}`}
          >
            +{extraCount}
          </div>
        )}
      </div>

      {showNames && onlineUsers.length > 0 && (
        <div className="text-sm text-neutral-400 flex items-center gap-1">
          <Users className="w-4 h-4" />
          {onlineUsers.length} online
        </div>
      )}
    </div>
  )
}

// Compact version for toolbar/header
export function PresenceIndicator({
  currentUserId,
  page,
  entityType,
  entityId
}: Omit<PresenceAvatarsProps, 'maxDisplay' | 'showNames' | 'size'>) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg">
      <PresenceAvatars
        currentUserId={currentUserId}
        page={page}
        entityType={entityType}
        entityId={entityId}
        maxDisplay={3}
        showNames
        size="sm"
      />
    </div>
  )
}

// Full presence panel
export function PresencePanel({
  currentUserId,
  page,
  entityType,
  entityId
}: Omit<PresenceAvatarsProps, 'maxDisplay' | 'showNames' | 'size'>) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [presenceManager] = useState(() => new PresenceManager())

  useEffect(() => {
    presenceManager.initialize(currentUserId)

    if (page) {
      presenceManager.updateLocation(page, entityType, entityId)
    }

    const fetchPresence = async () => {
      const users = await presenceManager.getOnlineUsers()
      setOnlineUsers(users.filter(u => u.user_id !== currentUserId))
    }

    fetchPresence()

    const channel = presenceManager.subscribeToPresenceChanges((users) => {
      setOnlineUsers(users.filter(u => u.user_id !== currentUserId))
    })

    return () => {
      presenceManager.disconnect()
    }
  }, [currentUserId, page, entityType, entityId])

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500'
  }

  return (
    <div className="border border-neutral-800 rounded-lg bg-neutral-950">
      <div className="p-4 border-b border-neutral-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Online ({onlineUsers.length})
        </h3>
      </div>

      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm">No one else is online</p>
          </div>
        ) : (
          onlineUsers.map((presence) => (
            <div
              key={presence.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900/50 transition-colors"
            >
              <div
                className="relative w-10 h-10 rounded-full border-2 border-neutral-800 bg-neutral-800 flex items-center justify-center font-semibold text-white overflow-hidden"
                style={{
                  backgroundColor: presence.user?.avatar_url ? undefined : generateUserColor(presence.user_id)
                }}
              >
                {presence.user?.avatar_url ? (
                  <img
                    src={presence.user.avatar_url}
                    alt={presence.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(presence.user?.name || presence.user?.email || '?')[0].toUpperCase()}
                  </span>
                )}

                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900 ${
                    statusColors[presence.status]
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {presence.user?.name || presence.user?.email}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {presence.activity_type ? (
                    `${presence.activity_type}${presence.current_page ? ` in ${presence.current_page}` : ''}`
                  ) : (
                    presence.status_message || presence.status
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
