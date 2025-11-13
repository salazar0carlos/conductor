# Real-Time Collaboration Features

Comprehensive real-time collaboration system built with Supabase Realtime, featuring live presence, cursors, comments, chat, and more - inspired by Figma and Notion.

## Features

### 1. Live Presence
- **Online User Indicators**: See who's online with avatar badges
- **Status Messages**: Away, busy, or custom status
- **Activity Tracking**: Know what users are viewing/editing
- **Real-time Updates**: Instant presence synchronization

### 2. Live Cursors
- **Real-time Cursor Tracking**: See other users' cursors with names
- **Color Coding**: Each user gets a unique color
- **Position Tracking**: Track cursor position and element interactions
- **Throttled Updates**: Optimized for performance

### 3. Comments & Annotations
- **Entity Comments**: Comment on tasks, workflows, files, etc.
- **Threading**: Reply to comments for discussions
- **@Mentions**: Mention users with notifications
- **Emoji Reactions**: React to comments with emojis
- **Pin/Resolve**: Pin important comments or mark as resolved

### 4. Activity Feed
- **Real-time Stream**: Live updates of all activities
- **Filtering**: Filter by type, user, or time
- **Grouping**: Group activities by time or user
- **Detailed Changes**: View change history

### 5. Notifications Center
- **In-app Notifications**: Bell icon with badge count
- **Notification Types**: Mentions, comments, tasks, chat
- **Mark as Read**: Individual or bulk actions
- **Preferences**: Customize notification settings

### 6. Team Chat
- **Project Rooms**: Dedicated chat rooms per project
- **Direct Messages**: One-on-one conversations
- **Message Types**: Text, code snippets, files
- **Reactions**: React to messages with emojis
- **Threading**: Reply to specific messages

### 7. Collaborative Editing
- **Real-time Co-editing**: Multiple users edit simultaneously
- **Conflict Resolution**: Three strategies (last-write-wins, optimistic, merge)
- **Edit Locks**: Optional exclusive editing locks
- **Version Tracking**: Automatic versioning

### 8. Advanced Features
- **Watch/Follow System**: Follow entities for notifications
- **Session Management**: Timeout warnings and auto-extension
- **Reconnection Handling**: Automatic reconnection with exponential backoff
- **Notification Preferences**: Granular control over notifications

## Installation

### 1. Run Database Migration

```bash
# Apply the collaboration system migration
supabase db push supabase/migrations/20250113_collaboration_system.sql
```

### 2. Enable Realtime

Make sure Supabase Realtime is enabled for your tables in the Supabase dashboard or via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE user_cursors;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- etc.
```

### 3. Environment Variables

Ensure your `.env.local` has Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Usage

### Live Presence

```tsx
import { PresenceAvatars, PresenceIndicator, PresencePanel } from '@/components/collaboration/presence-avatars'
import { PresenceManager } from '@/lib/collaboration/presence'

// Show online users
<PresenceAvatars
  currentUserId={userId}
  page="/tasks/123"
  entityType="task"
  entityId="task-123"
  maxDisplay={5}
  showNames
  size="md"
/>

// Compact indicator for toolbar
<PresenceIndicator
  currentUserId={userId}
  page="/tasks/123"
/>

// Full presence panel
<PresencePanel
  currentUserId={userId}
  page="/tasks/123"
/>

// Manual presence management
const presenceManager = new PresenceManager()
await presenceManager.initialize(userId)
await presenceManager.updateLocation('/tasks/123', 'task', 'task-123', 'editing')
await presenceManager.setAway()
```

### Live Cursors

```tsx
import { LiveCursors, useCursorTracking } from '@/components/collaboration/live-cursors'

// Automatic cursor tracking with rendering
<LiveCursors
  userId={userId}
  page="/workflow/builder"
  enabled={true}
/>

// Or use the hook without rendering
const cursorTracker = useCursorTracking(userId, '/workflow/builder', true)
```

### Comments

```tsx
import { Comments } from '@/components/collaboration/comments'

<Comments
  entityType="task"
  entityId="task-123"
  currentUserId={userId}
  currentUserName="John Doe"
  onMentionClick={(userId) => console.log('Mentioned:', userId)}
/>
```

### Activity Feed

```tsx
import { CollaborationActivityFeed } from '@/components/collaboration/activity-feed'

<CollaborationActivityFeed
  projectId="project-123" // Optional
  limit={50}
  showFilters={true}
  realtime={true}
/>
```

### Notifications

```tsx
import { NotificationCenter, NotificationBadge } from '@/components/collaboration/notifications'

// Full notification center
<NotificationCenter currentUserId={userId} />

// Just the badge
<NotificationBadge currentUserId={userId} />
```

### Team Chat

```tsx
import { Chat } from '@/components/collaboration/chat'

<Chat
  currentUserId={userId}
  currentUserName="John Doe"
  projectId="project-123" // Optional
/>
```

### Collaborative Editing

```tsx
import { CollaborativeEditor, EditLockManager } from '@/lib/collaboration/collaborative-editing'

// With edit locks
const editor = new CollaborativeEditor(
  'tasks',
  'task-123',
  userId,
  {
    lockDuration: 5 * 60 * 1000, // 5 minutes
    onRemoteChange: (data) => {
      console.log('Remote change:', data)
    }
  }
)

// Initialize (with optional locking)
const result = await editor.initialize(true)

if (!result.success) {
  alert(result.error) // Entity is locked by another user
}

// Save with conflict resolution
await editor.save(updatedData, 'merge') // 'last-write-wins' | 'optimistic' | 'merge'

// Cleanup
await editor.cleanup()
```

### Watch/Follow System

```tsx
import { WatchManager } from '@/lib/collaboration/advanced-features'

const watchManager = new WatchManager(userId)

// Watch an entity
await watchManager.watch('task', 'task-123', 'all')

// Check if watching
const isWatching = await watchManager.isWatching('task', 'task-123')

// Unwatch
await watchManager.unwatch('task', 'task-123')

// Notify watchers of changes
await watchManager.notifyWatchers(
  'task',
  'task-123',
  'task_updated',
  'Task updated',
  'John updated the task',
  '/tasks/123'
)
```

### Session Management

```tsx
import { SessionManager } from '@/lib/collaboration/advanced-features'

const sessionManager = new SessionManager({
  timeoutDuration: 30 * 60 * 1000, // 30 minutes
  warningDuration: 5 * 60 * 1000, // 5 minutes
  onWarning: () => {
    // Show warning UI
    setSessionWarning(true)
  },
  onTimeout: () => {
    // Handle timeout
    alert('Session expired')
  }
})

sessionManager.start()

// Extend session manually
sessionManager.extendSession()

// Get time remaining
const timeLeft = sessionManager.getTimeRemaining()
```

### Reconnection Handling

```tsx
import { ReconnectionHandler } from '@/lib/collaboration/advanced-features'

const reconnectionHandler = new ReconnectionHandler({
  maxReconnectAttempts: 10,
  onReconnect: () => {
    console.log('Reconnected!')
    // Refresh data
  },
  onDisconnect: () => {
    console.log('Disconnected')
    // Show offline UI
  },
  onReconnecting: (attempt) => {
    console.log(`Reconnecting... Attempt ${attempt}`)
  }
})

reconnectionHandler.start()

// Manual reconnect
reconnectionHandler.reconnect()

// Check status
const { isOnline, reconnectAttempts } = reconnectionHandler.getStatus()
```

## API Reference

### Database Tables

- `team_members` - User profiles
- `user_presence` - Real-time presence data
- `user_cursors` - Cursor positions
- `comments` - Entity comments
- `comment_reactions` - Emoji reactions
- `notifications` - User notifications
- `notification_preferences` - Notification settings
- `chat_rooms` - Chat rooms
- `chat_room_members` - Room membership
- `chat_messages` - Chat messages
- `chat_message_reactions` - Message reactions
- `collaboration_activities` - Activity feed
- `entity_watchers` - Watch/follow data
- `edit_locks` - Edit locking

### Realtime Subscriptions

All tables have realtime enabled. Use the subscription helpers in `/lib/collaboration/realtime.ts`:

```tsx
import {
  subscribeToPresence,
  subscribeToCursors,
  subscribeToComments,
  subscribeToNotifications,
  subscribeToChatRoom,
  subscribeToActivities,
  subscribeToEditLocks
} from '@/lib/collaboration/realtime'

// Example: Subscribe to comments
const channel = subscribeToComments('task', 'task-123', (payload) => {
  console.log('Comment event:', payload)
  // Handle INSERT, UPDATE, DELETE
})

// Cleanup
unsubscribe(channel)
```

## Performance Considerations

### Cursor Throttling
- Cursor updates are throttled to 50ms by default
- Adjust `updateThrottle` in `CursorTracker` constructor

### Presence Heartbeat
- Heartbeat sent every 30 seconds
- Stale presence cleaned up after 5 minutes

### Activity Feed Limits
- Default limit of 50 activities
- Use pagination for larger feeds

### Chat Message Limits
- Fetches last 100 messages by default
- Implement pagination for older messages

## Best Practices

### 1. Cleanup Subscriptions
Always unsubscribe from realtime channels when component unmounts:

```tsx
useEffect(() => {
  const channel = subscribeToComments('task', taskId, handleUpdate)

  return () => {
    unsubscribe(channel)
  }
}, [taskId])
```

### 2. Use Edit Locks for Critical Data
For sensitive data that shouldn't have conflicts, use edit locks:

```tsx
const lockManager = new EditLockManager()
const result = await lockManager.acquireLock('workflow', workflowId, userId)

if (!result.success) {
  alert('Workflow is being edited by another user')
  return
}

// Edit workflow...

await lockManager.releaseLock('workflow', workflowId)
```

### 3. Batch Notifications
When making multiple changes, batch notifications to avoid spam:

```tsx
// Make all changes first
await updateTask1()
await updateTask2()
await updateTask3()

// Then notify once
await watchManager.notifyWatchers(
  'project',
  projectId,
  'project_updated',
  'Project updated',
  'Multiple tasks were updated'
)
```

### 4. Optimize Presence Updates
Only update presence when meaningful changes occur:

```tsx
// Don't update on every mouse move
// Update when navigating to different entity
await presenceManager.updateLocation(newPage, newEntityType, newEntityId)
```

## Demo

Visit `/collaboration-demo` to see all features in action. The demo page includes:

- Live presence indicators
- Real-time cursor tracking
- Comments with threading and reactions
- Activity feed with filtering
- Chat with multiple rooms
- Collaborative editing examples
- Session and connection status

## Troubleshooting

### Realtime not working
1. Check Supabase realtime is enabled in dashboard
2. Verify tables are added to `supabase_realtime` publication
3. Check browser console for connection errors

### Presence not updating
1. Verify heartbeat interval is running
2. Check `last_heartbeat` timestamp in database
3. Run cleanup function to remove stale presence

### Cursors not showing
1. Verify page name matches between users
2. Check cursor updates aren't blocked by throttling
3. Ensure `user_cursors` table has correct indexes

### Chat messages not appearing
1. Check user is member of chat room
2. Verify `chat_room_members` table has correct entries
3. Check realtime subscription is active

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
