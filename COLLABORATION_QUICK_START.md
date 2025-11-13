# Collaboration System - Quick Start Guide

Get up and running with real-time collaboration in 5 minutes!

## Step 1: Run Database Migration

First, apply the collaboration schema to your Supabase database:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL file directly in Supabase Studio
# File: supabase/migrations/20250113_collaboration_system.sql
```

This creates all necessary tables:
- `team_members` - User profiles
- `user_presence` - Live presence
- `user_cursors` - Cursor tracking
- `comments` - Comments system
- `notifications` - Notifications
- `chat_rooms` & `chat_messages` - Chat
- `collaboration_activities` - Activity feed
- And more...

## Step 2: Add Collaboration to Your App

### Basic Setup - Add Presence & Notifications

```tsx
// app/layout.tsx or your main layout
import { NotificationCenter } from '@/components/collaboration/notifications'
import { PresenceIndicator } from '@/components/collaboration/presence-avatars'

export default function Layout({ children }) {
  const currentUserId = 'your-user-id' // Get from auth

  return (
    <div>
      <header>
        <nav>
          {/* Your nav items */}
          <PresenceIndicator currentUserId={currentUserId} page="/dashboard" />
          <NotificationCenter currentUserId={currentUserId} />
        </nav>
      </header>
      {children}
    </div>
  )
}
```

### Add Live Cursors to Any Page

```tsx
// app/workflow/builder/page.tsx
import { LiveCursors } from '@/components/collaboration/live-cursors'

export default function WorkflowBuilder() {
  const currentUserId = 'your-user-id'

  return (
    <>
      <LiveCursors userId={currentUserId} page="/workflow/builder" />
      {/* Your page content */}
    </>
  )
}
```

### Add Comments to Any Entity

```tsx
// app/tasks/[id]/page.tsx
import { Comments } from '@/components/collaboration/comments'

export default function TaskPage({ params }) {
  const currentUserId = 'your-user-id'

  return (
    <div>
      {/* Task details */}

      <Comments
        entityType="task"
        entityId={params.id}
        currentUserId={currentUserId}
        currentUserName="John Doe"
      />
    </div>
  )
}
```

### Add Activity Feed

```tsx
// app/dashboard/page.tsx
import { CollaborationActivityFeed } from '@/components/collaboration/activity-feed'

export default function Dashboard() {
  return (
    <div>
      <CollaborationActivityFeed
        limit={20}
        showFilters
        realtime
      />
    </div>
  )
}
```

### Add Team Chat

```tsx
// app/chat/page.tsx
import { Chat } from '@/components/collaboration/chat'

export default function ChatPage() {
  const currentUserId = 'your-user-id'

  return (
    <div className="h-screen">
      <Chat
        currentUserId={currentUserId}
        currentUserName="John Doe"
      />
    </div>
  )
}
```

## Step 3: Add Collaborative Editing (Optional)

For entities that need conflict resolution:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { CollaborativeEditor } from '@/lib/collaboration/collaborative-editing'

export default function TaskEditor({ taskId }) {
  const [editor, setEditor] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const currentUserId = 'your-user-id'

  useEffect(() => {
    const ed = new CollaborativeEditor(
      'tasks',
      taskId,
      currentUserId,
      {
        onRemoteChange: (data) => {
          // Update UI with remote changes
          console.log('Remote change:', data)
        }
      }
    )

    // Initialize with locking
    ed.initialize(true).then(result => {
      if (!result.success) {
        setIsLocked(true)
        alert(result.error)
      } else {
        setEditor(ed)
      }
    })

    return () => {
      ed?.cleanup()
    }
  }, [taskId])

  const handleSave = async (updatedData) => {
    if (!editor) return

    const result = await editor.save(updatedData, 'merge')

    if (!result.success) {
      alert(result.error)
    }
  }

  return (
    <div>
      {isLocked && (
        <div className="alert">
          This task is being edited by another user
        </div>
      )}
      {/* Your editor UI */}
    </div>
  )
}
```

## Step 4: Add Watch/Follow System

Allow users to follow entities:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { WatchManager } from '@/lib/collaboration/advanced-features'
import { Eye, EyeOff } from 'lucide-react'

export function WatchButton({ entityType, entityId, currentUserId }) {
  const [isWatching, setIsWatching] = useState(false)
  const [watchManager] = useState(() => new WatchManager(currentUserId))

  useEffect(() => {
    watchManager.isWatching(entityType, entityId).then(setIsWatching)
  }, [entityType, entityId])

  const toggleWatch = async () => {
    if (isWatching) {
      await watchManager.unwatch(entityType, entityId)
    } else {
      await watchManager.watch(entityType, entityId, 'all')
    }
    setIsWatching(!isWatching)
  }

  return (
    <button onClick={toggleWatch}>
      {isWatching ? <Eye /> : <EyeOff />}
      {isWatching ? 'Watching' : 'Watch'}
    </button>
  )
}
```

## Step 5: Add Session & Connection Management

Monitor session timeout and connection status:

```tsx
// app/providers.tsx
'use client'

import { useEffect, useState } from 'react'
import { SessionManager, ReconnectionHandler } from '@/lib/collaboration/advanced-features'

export function CollaborationProviders({ children }) {
  const [sessionWarning, setSessionWarning] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Session management
    const sessionManager = new SessionManager({
      timeoutDuration: 30 * 60 * 1000, // 30 min
      warningDuration: 5 * 60 * 1000, // 5 min
      onWarning: () => setSessionWarning(true),
      onTimeout: () => {
        alert('Session expired')
        // Redirect to login
      }
    })

    sessionManager.start()

    // Connection management
    const reconnectionHandler = new ReconnectionHandler({
      onReconnect: () => setIsOnline(true),
      onDisconnect: () => setIsOnline(false),
      onReconnecting: (attempt) => {
        console.log(`Reconnecting... Attempt ${attempt}`)
      }
    })

    reconnectionHandler.start()

    return () => {
      sessionManager.stop()
      reconnectionHandler.stop()
    }
  }, [])

  return (
    <>
      {/* Connection status banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 bg-red-500 text-white text-center py-2 z-50">
          You are offline. Trying to reconnect...
        </div>
      )}

      {/* Session warning */}
      {sessionWarning && (
        <div className="fixed top-0 inset-x-0 bg-yellow-500 text-black text-center py-2 z-50">
          Your session will expire in 5 minutes. Click here to stay active.
        </div>
      )}

      {children}
    </>
  )
}
```

## Common Patterns

### Pattern 1: Show Who's Viewing a Task

```tsx
<PresenceAvatars
  currentUserId={userId}
  entityType="task"
  entityId={taskId}
  maxDisplay={3}
  showNames
/>
```

### Pattern 2: Enable Cursors on Canvas/Editor

```tsx
<div className="relative">
  <LiveCursors userId={userId} page="/canvas" />
  <Canvas />
</div>
```

### Pattern 3: Activity Log for a Project

```tsx
<CollaborationActivityFeed
  projectId={projectId}
  limit={50}
  showFilters={true}
/>
```

### Pattern 4: Notify Watchers When Entity Changes

```tsx
// After updating a task
await watchManager.notifyWatchers(
  'task',
  taskId,
  'task_updated',
  'Task Updated',
  `${userName} updated the task`,
  `/tasks/${taskId}`
)
```

## Demo

Visit `/collaboration-demo` to see all features in action!

## Next Steps

- Read the full documentation: `COLLABORATION_README.md`
- Customize UI components to match your design system
- Add role-based permissions to chat rooms
- Implement email notifications for mentions
- Add file attachments to chat and comments

## Troubleshooting

**Issue**: Realtime not working
- Solution: Check Supabase Realtime is enabled in dashboard

**Issue**: Presence not showing
- Solution: Verify heartbeat is running and `last_heartbeat` is recent

**Issue**: Cursors not visible
- Solution: Ensure page name matches between users

**Issue**: Notifications not appearing
- Solution: Check notification preferences are enabled

## Support

Need help? Check the main README or open an issue!
