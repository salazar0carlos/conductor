'use client'

import { createClient } from '@/lib/supabase/client'
import { subscribeToPresence, unsubscribe } from './realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface UserPresence {
  id: string
  user_id: string
  is_online: boolean
  status: 'online' | 'away' | 'busy' | 'offline'
  status_message?: string
  current_page?: string
  current_entity_type?: string
  current_entity_id?: string
  activity_type?: string
  last_heartbeat: string
  session_id: string
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

export interface CursorPosition {
  id: string
  user_id: string
  session_id: string
  page: string
  x: number
  y: number
  element_id?: string
  color: string
  last_moved_at: string
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

// ============================================
// PRESENCE MANAGEMENT
// ============================================

export class PresenceManager {
  private supabase = createClient()
  private sessionId: string
  private userId: string | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private channel: RealtimeChannel | null = null

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize presence for a user
  async initialize(userId: string) {
    this.userId = userId
    await this.updatePresence({
      is_online: true,
      status: 'online'
    })
    this.startHeartbeat()
    return this.sessionId
  }

  // Update presence information
  async updatePresence(data: Partial<Omit<UserPresence, 'id' | 'user_id' | 'session_id'>>) {
    if (!this.userId) {
      throw new Error('PresenceManager not initialized')
    }

    const { error } = await this.supabase
      .from('user_presence')
      .upsert({
        user_id: this.userId,
        session_id: this.sessionId,
        last_heartbeat: new Date().toISOString(),
        ...data
      }, {
        onConflict: 'user_id,session_id'
      })

    if (error) {
      console.error('Failed to update presence:', error)
    }
  }

  // Update current page/location
  async updateLocation(
    page: string,
    entityType?: string,
    entityId?: string,
    activityType: 'viewing' | 'editing' | 'typing' | 'commenting' = 'viewing'
  ) {
    await this.updatePresence({
      current_page: page,
      current_entity_type: entityType,
      current_entity_id: entityId,
      activity_type: activityType
    })
  }

  // Update status
  async updateStatus(status: UserPresence['status'], message?: string) {
    await this.updatePresence({
      status,
      status_message: message
    })
  }

  // Set as away
  async setAway() {
    await this.updateStatus('away')
  }

  // Set as busy
  async setBusy(message?: string) {
    await this.updateStatus('busy', message)
  }

  // Set as online
  async setOnline() {
    await this.updateStatus('online')
  }

  // Start heartbeat to keep presence alive
  private startHeartbeat() {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence({
        last_heartbeat: new Date().toISOString()
      })
    }, 30000)
  }

  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Subscribe to presence changes
  subscribeToPresenceChanges(callback: (presence: UserPresence[]) => void) {
    this.channel = subscribeToPresence((payload) => {
      // Fetch all current presence data
      this.getOnlineUsers().then(callback)
    })

    return this.channel
  }

  // Get all online users
  async getOnlineUsers(): Promise<UserPresence[]> {
    const { data, error } = await this.supabase
      .from('user_presence')
      .select(`
        *,
        user:team_members(name, email, avatar_url)
      `)
      .eq('is_online', true)
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

    if (error) {
      console.error('Failed to fetch online users:', error)
      return []
    }

    return data || []
  }

  // Get users on specific page/entity
  async getUsersOnPage(page: string): Promise<UserPresence[]> {
    const { data, error } = await this.supabase
      .from('user_presence')
      .select(`
        *,
        user:team_members(name, email, avatar_url)
      `)
      .eq('is_online', true)
      .eq('current_page', page)
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    if (error) {
      console.error('Failed to fetch users on page:', error)
      return []
    }

    return data || []
  }

  // Get users viewing specific entity
  async getUsersOnEntity(entityType: string, entityId: string): Promise<UserPresence[]> {
    const { data, error } = await this.supabase
      .from('user_presence')
      .select(`
        *,
        user:team_members(name, email, avatar_url)
      `)
      .eq('is_online', true)
      .eq('current_entity_type', entityType)
      .eq('current_entity_id', entityId)
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString())

    if (error) {
      console.error('Failed to fetch users on entity:', error)
      return []
    }

    return data || []
  }

  // Cleanup on disconnect
  async disconnect() {
    this.stopHeartbeat()

    if (this.channel) {
      unsubscribe(this.channel)
    }

    if (this.userId) {
      await this.updatePresence({
        is_online: false,
        status: 'offline'
      })
    }
  }
}

// ============================================
// CURSOR TRACKING
// ============================================

export class CursorTracker {
  private supabase = createClient()
  private sessionId: string
  private userId: string
  private page: string
  private updateThrottle: number = 50 // ms
  private lastUpdate: number = 0
  private pendingUpdate: NodeJS.Timeout | null = null

  constructor(userId: string, page: string, sessionId?: string) {
    this.userId = userId
    this.page = page
    this.sessionId = sessionId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Update cursor position (throttled)
  updatePosition(x: number, y: number, elementId?: string, color: string = '#3b82f6') {
    const now = Date.now()

    // Throttle updates
    if (now - this.lastUpdate < this.updateThrottle) {
      // Schedule update for later
      if (this.pendingUpdate) {
        clearTimeout(this.pendingUpdate)
      }

      this.pendingUpdate = setTimeout(() => {
        this.sendUpdate(x, y, elementId, color)
      }, this.updateThrottle)

      return
    }

    this.sendUpdate(x, y, elementId, color)
  }

  private async sendUpdate(x: number, y: number, elementId: string | undefined, color: string) {
    this.lastUpdate = Date.now()

    const { error } = await this.supabase
      .from('user_cursors')
      .upsert({
        user_id: this.userId,
        session_id: this.sessionId,
        page: this.page,
        x,
        y,
        element_id: elementId,
        color,
        last_moved_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,session_id,page'
      })

    if (error) {
      console.error('Failed to update cursor:', error)
    }
  }

  // Get all cursors on current page
  async getCursors(): Promise<CursorPosition[]> {
    const { data, error } = await this.supabase
      .from('user_cursors')
      .select(`
        *,
        user:team_members(name, email, avatar_url)
      `)
      .eq('page', this.page)
      .neq('user_id', this.userId) // Exclude own cursor
      .gte('last_moved_at', new Date(Date.now() - 10 * 1000).toISOString()) // Last 10 seconds

    if (error) {
      console.error('Failed to fetch cursors:', error)
      return []
    }

    return data || []
  }

  // Remove cursor when leaving
  async removeCursor() {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate)
    }

    await this.supabase
      .from('user_cursors')
      .delete()
      .eq('user_id', this.userId)
      .eq('session_id', this.sessionId)
      .eq('page', this.page)
  }
}

// ============================================
// HOOKS FOR REACT
// ============================================

export function generateUserColor(userId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]

  // Generate consistent color based on userId
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  return colors[Math.abs(hash) % colors.length]
}
