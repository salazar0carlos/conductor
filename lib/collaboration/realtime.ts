'use client'

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type CollaborationEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeOptions {
  event?: CollaborationEvent | '*'
  filter?: string
}

// ============================================
// PRESENCE SUBSCRIPTIONS
// ============================================

export function subscribeToPresence(
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  options: RealtimeOptions = {}
): RealtimeChannel {
  const supabase = createClient()
  const { event = '*' } = options

  const channel = supabase
    .channel('user_presence_changes')
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table: 'user_presence'
      },
      callback
    )
    .subscribe()

  return channel
}

export function subscribeToCursors(
  page: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`cursors:${page}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_cursors',
        filter: `page=eq.${page}`
      },
      callback
    )
    .subscribe()

  return channel
}

// ============================================
// COMMENTS SUBSCRIPTIONS
// ============================================

export function subscribeToComments(
  entityType: string,
  entityId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`comments:${entityType}:${entityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`
      },
      callback
    )
    .subscribe()

  return channel
}

export function subscribeToCommentReactions(
  commentId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`comment_reactions:${commentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comment_reactions',
        filter: `comment_id=eq.${commentId}`
      },
      callback
    )
    .subscribe()

  return channel
}

// ============================================
// NOTIFICATIONS SUBSCRIPTIONS
// ============================================

export function subscribeToNotifications(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()

  return channel
}

// ============================================
// CHAT SUBSCRIPTIONS
// ============================================

export function subscribeToChatRoom(
  roomId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`chat:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      callback
    )
    .subscribe()

  return channel
}

export function subscribeToChatMessageReactions(
  messageId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`chat_reactions:${messageId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_message_reactions',
        filter: `message_id=eq.${messageId}`
      },
      callback
    )
    .subscribe()

  return channel
}

// ============================================
// ACTIVITY SUBSCRIPTIONS
// ============================================

export function subscribeToActivities(
  projectId: string | null,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const filterString = projectId ? `project_id=eq.${projectId}` : undefined

  const channel = supabase
    .channel('collaboration_activities')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'collaboration_activities',
        ...(filterString && { filter: filterString })
      },
      callback
    )
    .subscribe()

  return channel
}

// ============================================
// EDIT LOCKS SUBSCRIPTIONS
// ============================================

export function subscribeToEditLocks(
  entityType: string,
  entityId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`edit_locks:${entityType}:${entityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'edit_locks',
        filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`
      },
      callback
    )
    .subscribe()

  return channel
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function unsubscribe(channel: RealtimeChannel): void {
  channel.unsubscribe()
}

export function unsubscribeAll(channels: RealtimeChannel[]): void {
  channels.forEach(channel => channel.unsubscribe())
}

// Generic subscription helper
export function subscribeToTableChanges(
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  options: RealtimeOptions = {}
): RealtimeChannel {
  const supabase = createClient()
  const { event = '*', filter } = options

  const channelConfig: any = {
    event,
    schema: 'public',
    table
  }

  if (filter) {
    channelConfig.filter = filter
  }

  const channel = supabase
    .channel(`${table}_changes_${Date.now()}`)
    .on('postgres_changes', channelConfig, callback)
    .subscribe()

  return channel
}

// Presence broadcast (for broadcasting cursor positions, etc.)
export function createPresenceBroadcast(channelName: string) {
  const supabase = createClient()

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: true },
      presence: { key: '' }
    }
  })

  return {
    channel,
    broadcast: (event: string, payload: any) => {
      channel.send({
        type: 'broadcast',
        event,
        payload
      })
    },
    subscribe: () => channel.subscribe(),
    unsubscribe: () => channel.unsubscribe()
  }
}
