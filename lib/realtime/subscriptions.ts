'use client'

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type SubscriptionCallback<T extends Record<string, any> = Record<string, any>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void

export function subscribeToTable<T extends Record<string, any> = Record<string, any>>(
  table: string,
  callback: SubscriptionCallback<T>
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table
      },
      callback
    )
    .subscribe()

  return channel
}

export function unsubscribe(channel: RealtimeChannel): void {
  channel.unsubscribe()
}

// Specific subscription helpers
export function subscribeToTasks(callback: SubscriptionCallback) {
  return subscribeToTable('tasks', callback)
}

export function subscribeToAgents(callback: SubscriptionCallback) {
  return subscribeToTable('agents', callback)
}

export function subscribeToProjects(callback: SubscriptionCallback) {
  return subscribeToTable('projects', callback)
}

export function subscribeToAnalysis(callback: SubscriptionCallback) {
  return subscribeToTable('analysis_history', callback)
}
