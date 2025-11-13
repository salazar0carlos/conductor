'use client'

import { createClient } from '@/lib/supabase/client'
import { subscribeToEditLocks, subscribeToTableChanges, unsubscribe } from './realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface EditLock {
  id: string
  entity_type: string
  entity_id: string
  locked_by_id: string
  locked_at: string
  expires_at: string
  locked_by?: {
    name: string
    email: string
  }
}

export interface EntityVersion {
  version: number
  data: any
  updated_by: string
  updated_at: string
}

// ============================================
// EDIT LOCK MANAGER
// ============================================

export class EditLockManager {
  private supabase = createClient()
  private lockDuration: number = 5 * 60 * 1000 // 5 minutes
  private refreshInterval: NodeJS.Timeout | null = null
  private currentLock: EditLock | null = null

  constructor(lockDuration?: number) {
    if (lockDuration) {
      this.lockDuration = lockDuration
    }
  }

  // Acquire edit lock
  async acquireLock(
    entityType: string,
    entityId: string,
    userId: string
  ): Promise<{ success: boolean; lock?: EditLock; error?: string }> {
    try {
      // Check if lock exists
      const existingLock = await this.getLock(entityType, entityId)

      if (existingLock) {
        // Check if lock is expired
        const expiresAt = new Date(existingLock.expires_at).getTime()
        const now = Date.now()

        if (now < expiresAt && existingLock.locked_by_id !== userId) {
          return {
            success: false,
            error: `Entity is locked by ${existingLock.locked_by?.name || existingLock.locked_by?.email || 'another user'}`
          }
        }

        // If expired or own lock, delete it
        await this.releaseLock(entityType, entityId)
      }

      // Create new lock
      const expiresAt = new Date(Date.now() + this.lockDuration).toISOString()

      const { data, error } = await this.supabase
        .from('edit_locks')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          locked_by_id: userId,
          expires_at: expiresAt
        })
        .select(`
          *,
          locked_by:team_members(name, email)
        `)
        .single()

      if (error) throw error

      this.currentLock = data
      this.startRefreshInterval()

      return { success: true, lock: data }
    } catch (error) {
      console.error('Failed to acquire lock:', error)
      return {
        success: false,
        error: 'Failed to acquire lock'
      }
    }
  }

  // Release edit lock
  async releaseLock(entityType: string, entityId: string): Promise<boolean> {
    try {
      this.stopRefreshInterval()

      const { error } = await this.supabase
        .from('edit_locks')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) throw error

      this.currentLock = null
      return true
    } catch (error) {
      console.error('Failed to release lock:', error)
      return false
    }
  }

  // Get current lock
  async getLock(entityType: string, entityId: string): Promise<EditLock | null> {
    try {
      const { data, error } = await this.supabase
        .from('edit_locks')
        .select(`
          *,
          locked_by:team_members(name, email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No lock found
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get lock:', error)
      return null
    }
  }

  // Refresh lock (extend expiration)
  private async refreshLock() {
    if (!this.currentLock) return

    try {
      const expiresAt = new Date(Date.now() + this.lockDuration).toISOString()

      const { error } = await this.supabase
        .from('edit_locks')
        .update({ expires_at: expiresAt })
        .eq('id', this.currentLock.id)

      if (error) throw error
    } catch (error) {
      console.error('Failed to refresh lock:', error)
    }
  }

  // Start auto-refresh
  private startRefreshInterval() {
    // Refresh every 2 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshLock()
    }, 2 * 60 * 1000)
  }

  // Stop auto-refresh
  private stopRefreshInterval() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  // Subscribe to lock changes
  subscribeLockChanges(
    entityType: string,
    entityId: string,
    callback: (lock: EditLock | null) => void
  ): RealtimeChannel {
    return subscribeToEditLocks(entityType, entityId, async (payload) => {
      if (payload.eventType === 'DELETE') {
        callback(null)
      } else {
        const lock = await this.getLock(entityType, entityId)
        callback(lock)
      }
    })
  }

  // Cleanup
  cleanup() {
    this.stopRefreshInterval()
    if (this.currentLock) {
      this.releaseLock(this.currentLock.entity_type, this.currentLock.entity_id)
    }
  }
}

// ============================================
// CONFLICT RESOLUTION
// ============================================

export class ConflictResolver {
  private supabase = createClient()

  // Last Write Wins strategy
  async lastWriteWins(
    table: string,
    entityId: string,
    newData: any,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from(table)
        .update({
          ...newData,
          updated_at: new Date().toISOString()
        })
        .eq('id', entityId)

      if (error) throw error

      // Log activity
      await this.logActivity(table, entityId, userId, 'updated', newData)

      return { success: true }
    } catch (error) {
      console.error('Failed to update:', error)
      return {
        success: false,
        error: 'Failed to update entity'
      }
    }
  }

  // Optimistic update with version checking
  async optimisticUpdate(
    table: string,
    entityId: string,
    expectedVersion: number,
    newData: any,
    userId: string
  ): Promise<{ success: boolean; error?: string; conflict?: boolean }> {
    try {
      // Get current version
      const { data: current, error: fetchError } = await this.supabase
        .from(table)
        .select('metadata')
        .eq('id', entityId)
        .single()

      if (fetchError) throw fetchError

      const currentVersion = current?.metadata?.version || 0

      // Check for version conflict
      if (currentVersion !== expectedVersion) {
        return {
          success: false,
          conflict: true,
          error: 'Version conflict detected. Please refresh and try again.'
        }
      }

      // Update with new version
      const { error: updateError } = await this.supabase
        .from(table)
        .update({
          ...newData,
          metadata: {
            ...current?.metadata,
            version: currentVersion + 1
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', entityId)

      if (updateError) throw updateError

      // Log activity
      await this.logActivity(table, entityId, userId, 'updated', newData)

      return { success: true }
    } catch (error) {
      console.error('Failed to update:', error)
      return {
        success: false,
        error: 'Failed to update entity'
      }
    }
  }

  // Merge strategy for non-conflicting changes
  async mergeChanges(
    table: string,
    entityId: string,
    localChanges: any,
    userId: string
  ): Promise<{ success: boolean; error?: string; merged?: any }> {
    try {
      // Get current server data
      const { data: serverData, error: fetchError } = await this.supabase
        .from(table)
        .select('*')
        .eq('id', entityId)
        .single()

      if (fetchError) throw fetchError

      // Deep merge non-conflicting changes
      const merged = this.deepMerge(serverData, localChanges)

      // Update with merged data
      const { error: updateError } = await this.supabase
        .from(table)
        .update({
          ...merged,
          updated_at: new Date().toISOString()
        })
        .eq('id', entityId)

      if (updateError) throw updateError

      // Log activity
      await this.logActivity(table, entityId, userId, 'merged', localChanges)

      return { success: true, merged }
    } catch (error) {
      console.error('Failed to merge:', error)
      return {
        success: false,
        error: 'Failed to merge changes'
      }
    }
  }

  // Deep merge helper
  private deepMerge(target: any, source: any): any {
    const output = { ...target }

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        output[key] = source[key]
      }
    }

    return output
  }

  // Log activity
  private async logActivity(
    entityType: string,
    entityId: string,
    userId: string,
    action: string,
    changes: any
  ) {
    try {
      await this.supabase
        .from('collaboration_activities')
        .insert({
          user_id: userId,
          activity_type: `${entityType}_${action}`,
          entity_type: entityType,
          entity_id: entityId,
          title: `${action} ${entityType}`,
          changes
        })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }
}

// ============================================
// COLLABORATIVE EDITOR WRAPPER
// ============================================

export class CollaborativeEditor {
  private lockManager: EditLockManager
  private conflictResolver: ConflictResolver
  private entityType: string
  private entityId: string
  private userId: string
  private channel: RealtimeChannel | null = null
  private onRemoteChange?: (data: any) => void

  constructor(
    entityType: string,
    entityId: string,
    userId: string,
    options?: {
      lockDuration?: number
      onRemoteChange?: (data: any) => void
    }
  ) {
    this.entityType = entityType
    this.entityId = entityId
    this.userId = userId
    this.lockManager = new EditLockManager(options?.lockDuration)
    this.conflictResolver = new ConflictResolver()
    this.onRemoteChange = options?.onRemoteChange
  }

  // Initialize editor
  async initialize(useLocking: boolean = false) {
    if (useLocking) {
      const result = await this.lockManager.acquireLock(
        this.entityType,
        this.entityId,
        this.userId
      )

      if (!result.success) {
        return result
      }
    }

    // Subscribe to changes
    this.subscribeToChanges()

    return { success: true }
  }

  // Subscribe to remote changes
  private subscribeToChanges() {
    const supabase = createClient()

    this.channel = subscribeToTableChanges(
      this.entityType,
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.id === this.entityId) {
          // Ignore own changes
          if (payload.new.updated_by === this.userId) return

          // Notify about remote change
          if (this.onRemoteChange) {
            this.onRemoteChange(payload.new)
          }
        }
      },
      {
        filter: `id=eq.${this.entityId}`
      }
    )
  }

  // Save changes
  async save(data: any, strategy: 'last-write-wins' | 'optimistic' | 'merge' = 'last-write-wins') {
    switch (strategy) {
      case 'last-write-wins':
        return await this.conflictResolver.lastWriteWins(
          this.entityType,
          this.entityId,
          data,
          this.userId
        )

      case 'optimistic':
        // Assuming version is stored in metadata
        const version = data.metadata?.version || 0
        return await this.conflictResolver.optimisticUpdate(
          this.entityType,
          this.entityId,
          version,
          data,
          this.userId
        )

      case 'merge':
        return await this.conflictResolver.mergeChanges(
          this.entityType,
          this.entityId,
          data,
          this.userId
        )

      default:
        return { success: false, error: 'Invalid strategy' }
    }
  }

  // Cleanup
  async cleanup() {
    if (this.channel) {
      unsubscribe(this.channel)
    }

    await this.lockManager.cleanup()
  }
}
