/**
 * Collaboration System
 *
 * Comprehensive real-time collaboration features including:
 * - Live presence tracking
 * - Real-time cursor tracking
 * - Comments and annotations
 * - Activity feed
 * - Notifications
 * - Team chat
 * - Collaborative editing
 * - Watch/follow system
 * - Session management
 * - Reconnection handling
 */

// Core realtime utilities
export {
  subscribeToPresence,
  subscribeToCursors,
  subscribeToComments,
  subscribeToCommentReactions,
  subscribeToNotifications,
  subscribeToChatRoom,
  subscribeToChatMessageReactions,
  subscribeToActivities,
  subscribeToEditLocks,
  subscribeToTableChanges,
  unsubscribe,
  unsubscribeAll,
  createPresenceBroadcast
} from './realtime'

// Presence management
export {
  PresenceManager,
  CursorTracker,
  generateUserColor
} from './presence'

export type {
  UserPresence,
  CursorPosition
} from './presence'

// Collaborative editing
export {
  EditLockManager,
  ConflictResolver,
  CollaborativeEditor
} from './collaborative-editing'

export type {
  EditLock,
  EntityVersion
} from './collaborative-editing'

// Advanced features
export {
  WatchManager,
  SessionManager,
  ReconnectionHandler,
  NotificationPreferencesManager
} from './advanced-features'

export type {
  EntityWatcher
} from './advanced-features'
