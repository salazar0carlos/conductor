'use client'

import { createClient } from '@/lib/supabase/client'
import { subscribeToTableChanges, unsubscribe } from './realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================
// WATCH/FOLLOW SYSTEM
// ============================================

export interface EntityWatcher {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  watch_type: 'all' | 'mentions' | 'comments' | 'changes'
  created_at: string
}

export class WatchManager {
  private supabase = createClient()
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Watch an entity
  async watch(
    entityType: string,
    entityId: string,
    watchType: 'all' | 'mentions' | 'comments' | 'changes' = 'all'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('entity_watchers')
        .insert({
          user_id: this.userId,
          entity_type: entityType,
          entity_id: entityId,
          watch_type: watchType
        })

      if (error) {
        // If already watching, update watch type
        if (error.code === '23505') {
          const { error: updateError } = await this.supabase
            .from('entity_watchers')
            .update({ watch_type: watchType })
            .eq('user_id', this.userId)
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)

          if (updateError) throw updateError
        } else {
          throw error
        }
      }

      // Create activity
      await this.createWatchActivity(entityType, entityId, 'watched')

      return { success: true }
    } catch (error) {
      console.error('Failed to watch entity:', error)
      return {
        success: false,
        error: 'Failed to watch entity'
      }
    }
  }

  // Unwatch an entity
  async unwatch(entityType: string, entityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('entity_watchers')
        .delete()
        .eq('user_id', this.userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) throw error

      // Create activity
      await this.createWatchActivity(entityType, entityId, 'unwatched')

      return { success: true }
    } catch (error) {
      console.error('Failed to unwatch entity:', error)
      return {
        success: false,
        error: 'Failed to unwatch entity'
      }
    }
  }

  // Check if watching
  async isWatching(entityType: string, entityId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('entity_watchers')
        .select('id')
        .eq('user_id', this.userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return !!data
    } catch (error) {
      console.error('Failed to check watch status:', error)
      return false
    }
  }

  // Get all watched entities
  async getWatchedEntities(entityType?: string): Promise<EntityWatcher[]> {
    try {
      let query = this.supabase
        .from('entity_watchers')
        .select('*')
        .eq('user_id', this.userId)

      if (entityType) {
        query = query.eq('entity_type', entityType)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get watched entities:', error)
      return []
    }
  }

  // Get watchers for entity
  async getWatchers(entityType: string, entityId: string): Promise<EntityWatcher[]> {
    try {
      const { data, error } = await this.supabase
        .from('entity_watchers')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get watchers:', error)
      return []
    }
  }

  // Create activity
  private async createWatchActivity(entityType: string, entityId: string, action: 'watched' | 'unwatched') {
    try {
      await this.supabase
        .from('collaboration_activities')
        .insert({
          user_id: this.userId,
          activity_type: `entity_${action}`,
          entity_type: entityType,
          entity_id: entityId,
          title: `${action} ${entityType}`
        })
    } catch (error) {
      console.error('Failed to create watch activity:', error)
    }
  }

  // Notify watchers of changes
  async notifyWatchers(
    entityType: string,
    entityId: string,
    notificationType: string,
    title: string,
    message: string,
    actionUrl?: string
  ) {
    try {
      const watchers = await this.getWatchers(entityType, entityId)

      const notifications = watchers
        .filter(w => w.user_id !== this.userId) // Don't notify self
        .map(watcher => ({
          user_id: watcher.user_id,
          type: notificationType,
          title,
          message,
          entity_type: entityType,
          entity_id: entityId,
          action_url: actionUrl,
          triggered_by_id: this.userId
        }))

      if (notifications.length > 0) {
        await this.supabase
          .from('notifications')
          .insert(notifications)
      }
    } catch (error) {
      console.error('Failed to notify watchers:', error)
    }
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export class SessionManager {
  private timeoutDuration: number = 30 * 60 * 1000 // 30 minutes
  private warningDuration: number = 5 * 60 * 1000 // 5 minutes before timeout
  private activityTimeout: NodeJS.Timeout | null = null
  private warningTimeout: NodeJS.Timeout | null = null
  private onWarning?: () => void
  private onTimeout?: () => void
  private lastActivity: number = Date.now()

  constructor(options?: {
    timeoutDuration?: number
    warningDuration?: number
    onWarning?: () => void
    onTimeout?: () => void
  }) {
    if (options?.timeoutDuration) {
      this.timeoutDuration = options.timeoutDuration
    }
    if (options?.warningDuration) {
      this.warningDuration = options.warningDuration
    }
    this.onWarning = options?.onWarning
    this.onTimeout = options?.onTimeout
  }

  // Start session monitoring
  start() {
    this.resetTimers()
    this.setupActivityListeners()
  }

  // Reset activity timers
  private resetTimers() {
    this.lastActivity = Date.now()

    // Clear existing timers
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout)
    }

    // Set warning timer
    this.warningTimeout = setTimeout(() => {
      if (this.onWarning) {
        this.onWarning()
      }
    }, this.timeoutDuration - this.warningDuration)

    // Set timeout timer
    this.activityTimeout = setTimeout(() => {
      if (this.onTimeout) {
        this.onTimeout()
      }
    }, this.timeoutDuration)
  }

  // Setup activity listeners
  private setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    const handleActivity = () => {
      const now = Date.now()
      // Only reset if more than 1 minute since last activity
      if (now - this.lastActivity > 60 * 1000) {
        this.resetTimers()
      }
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })
  }

  // Extend session manually
  extendSession() {
    this.resetTimers()
  }

  // Stop monitoring
  stop() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout)
    }
  }

  // Get time remaining
  getTimeRemaining(): number {
    return Math.max(0, this.timeoutDuration - (Date.now() - this.lastActivity))
  }
}

// ============================================
// RECONNECTION HANDLER
// ============================================

export class ReconnectionHandler {
  private isOnline: boolean = true
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private reconnectInterval: number = 1000 // Start with 1 second
  private reconnectTimeout: NodeJS.Timeout | null = null
  private onReconnect?: () => void
  private onDisconnect?: () => void
  private onReconnecting?: (attempt: number) => void

  constructor(options?: {
    maxReconnectAttempts?: number
    onReconnect?: () => void
    onDisconnect?: () => void
    onReconnecting?: (attempt: number) => void
  }) {
    if (options?.maxReconnectAttempts) {
      this.maxReconnectAttempts = options.maxReconnectAttempts
    }
    this.onReconnect = options?.onReconnect
    this.onDisconnect = options?.onDisconnect
    this.onReconnecting = options?.onReconnecting
  }

  // Start monitoring connection
  start() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Check initial connection status
    this.isOnline = navigator.onLine
    if (!this.isOnline && this.onDisconnect) {
      this.onDisconnect()
    }
  }

  // Handle online event
  private handleOnline = () => {
    this.isOnline = true
    this.reconnectAttempts = 0
    this.reconnectInterval = 1000

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.onReconnect) {
      this.onReconnect()
    }
  }

  // Handle offline event
  private handleOffline = () => {
    this.isOnline = false

    if (this.onDisconnect) {
      this.onDisconnect()
    }

    this.attemptReconnect()
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++

    if (this.onReconnecting) {
      this.onReconnecting(this.reconnectAttempts)
    }

    this.reconnectTimeout = setTimeout(() => {
      // Check if back online
      if (navigator.onLine) {
        this.handleOnline()
      } else {
        // Exponential backoff
        this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000) // Max 30 seconds
        this.attemptReconnect()
      }
    }, this.reconnectInterval)
  }

  // Manual reconnect trigger
  reconnect() {
    if (!this.isOnline) {
      this.reconnectAttempts = 0
      this.reconnectInterval = 1000
      this.attemptReconnect()
    }
  }

  // Stop monitoring
  stop() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
  }

  // Get connection status
  getStatus(): { isOnline: boolean; reconnectAttempts: number } {
    return {
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// ============================================
// NOTIFICATION PREFERENCES MANAGER
// ============================================

export class NotificationPreferencesManager {
  private supabase = createClient()
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Get preferences
  async getPreferences() {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // Return default preferences if not found
      if (!data) {
        return {
          email_enabled: true,
          email_digest_frequency: 'daily',
          push_enabled: true,
          in_app_enabled: true,
          mention_notifications: true,
          comment_notifications: true,
          task_notifications: true,
          workflow_notifications: true,
          chat_notifications: true
        }
      }

      return data
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

  // Update preferences
  async updatePreferences(preferences: Partial<any>) {
    try {
      const { error } = await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: this.userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return {
        success: false,
        error: 'Failed to update preferences'
      }
    }
  }
}
