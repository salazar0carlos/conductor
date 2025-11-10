'use client'

import { useEffect, useRef } from 'react'
import { subscribeToTable, type SubscriptionCallback } from '@/lib/realtime/subscriptions'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeSubscription<T extends Record<string, any> = Record<string, any>>(
  table: string,
  callback: SubscriptionCallback<T>,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    channelRef.current = subscribeToTable(table, callback)

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [table, callback, enabled])
}

export function useTasksSubscription(callback: SubscriptionCallback, enabled: boolean = true) {
  useRealtimeSubscription('tasks', callback, enabled)
}

export function useAgentsSubscription(callback: SubscriptionCallback, enabled: boolean = true) {
  useRealtimeSubscription('agents', callback, enabled)
}

export function useProjectsSubscription(callback: SubscriptionCallback, enabled: boolean = true) {
  useRealtimeSubscription('projects', callback, enabled)
}

export function useAnalysisSubscription(callback: SubscriptionCallback, enabled: boolean = true) {
  useRealtimeSubscription('analysis_history', callback, enabled)
}
