'use client'

import { useState, useEffect } from 'react'
import { PresenceAvatars, PresenceIndicator, PresencePanel } from '@/components/collaboration/presence-avatars'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { Comments } from '@/components/collaboration/comments'
import { CollaborationActivityFeed } from '@/components/collaboration/activity-feed'
import { NotificationCenter } from '@/components/collaboration/notifications'
import { Chat } from '@/components/collaboration/chat'
import {
  Users,
  MessageSquare,
  Bell,
  Activity,
  Eye,
  Zap,
  MousePointer2,
  MessageCircle,
  GitBranch,
  Lock,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react'
import { SessionManager, ReconnectionHandler, WatchManager } from '@/lib/collaboration/advanced-features'
import { CollaborativeEditor } from '@/lib/collaboration/collaborative-editing'

export default function CollaborationDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'presence' | 'cursors' | 'comments' | 'activity' | 'chat' | 'editing'>('overview')
  const [currentUserId] = useState(() => 'demo-user-' + Math.random().toString(36).substr(2, 9))
  const [sessionWarning, setSessionWarning] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isWatching, setIsWatching] = useState(false)

  useEffect(() => {
    // Initialize session manager
    const sessionManager = new SessionManager({
      timeoutDuration: 30 * 60 * 1000, // 30 minutes
      warningDuration: 5 * 60 * 1000, // 5 minutes
      onWarning: () => {
        setSessionWarning(true)
      },
      onTimeout: () => {
        alert('Your session has expired. Please refresh the page.')
      }
    })

    sessionManager.start()

    // Initialize reconnection handler
    const reconnectionHandler = new ReconnectionHandler({
      onReconnect: () => {
        setIsOnline(true)
        setReconnectAttempts(0)
      },
      onDisconnect: () => {
        setIsOnline(false)
      },
      onReconnecting: (attempt) => {
        setReconnectAttempts(attempt)
      }
    })

    reconnectionHandler.start()

    return () => {
      sessionManager.stop()
      reconnectionHandler.stop()
    }
  }, [])

  const handleExtendSession = () => {
    setSessionWarning(false)
    // Session manager will auto-extend on user activity
  }

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Live Presence',
      description: 'See who\'s online with avatar badges, status indicators, and real-time activity',
      color: 'bg-blue-500'
    },
    {
      icon: <MousePointer2 className="w-6 h-6" />,
      title: 'Live Cursors',
      description: 'Track user cursors in real-time with names and colors',
      color: 'bg-purple-500'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Comments & Annotations',
      description: 'Comment on any entity with threading, @mentions, and emoji reactions',
      color: 'bg-cyan-500'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Activity Feed',
      description: 'Real-time activity stream with filtering and grouping',
      color: 'bg-green-500'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Notifications',
      description: 'In-app notification center with badge count and preferences',
      color: 'bg-red-500'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Team Chat',
      description: 'Project rooms and direct messages with file sharing',
      color: 'bg-pink-500'
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: 'Collaborative Editing',
      description: 'Real-time co-editing with conflict resolution',
      color: 'bg-orange-500'
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Watch System',
      description: 'Follow entities and get notified of changes',
      color: 'bg-yellow-500'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Edit Locks',
      description: 'Optional locking mechanism for exclusive editing',
      color: 'bg-indigo-500'
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: 'Reconnection Handling',
      description: 'Automatic reconnection with exponential backoff',
      color: 'bg-teal-500'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Session Management',
      description: 'Timeout warnings and session extension',
      color: 'bg-gray-500'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Optimistic Updates',
      description: 'Instant UI updates with automatic sync',
      color: 'bg-violet-500'
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Collaboration Demo</h1>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-500">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-500">
                      Offline {reconnectAttempts > 0 && `(Retry ${reconnectAttempts})`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <PresenceIndicator
                currentUserId={currentUserId}
                page="/collaboration-demo"
              />
              <NotificationCenter currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      </header>

      {/* Session warning */}
      {sessionWarning && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Session Expiring Soon</h4>
              <p className="text-sm text-neutral-400 mb-3">
                Your session will expire in 5 minutes due to inactivity.
              </p>
              <button
                onClick={handleExtendSession}
                className="px-3 py-1.5 bg-yellow-500 text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Stay Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Cursors Overlay */}
      <LiveCursors
        userId={currentUserId}
        page="/collaboration-demo"
        enabled={activeTab === 'cursors' || activeTab === 'overview'}
      />

      {/* Navigation */}
      <div className="border-b border-neutral-800 bg-neutral-950">
        <div className="container mx-auto px-6">
          <nav className="flex gap-2 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Overview', icon: <Zap className="w-4 h-4" /> },
              { id: 'presence', label: 'Presence', icon: <Users className="w-4 h-4" /> },
              { id: 'cursors', label: 'Cursors', icon: <MousePointer2 className="w-4 h-4" /> },
              { id: 'comments', label: 'Comments', icon: <MessageCircle className="w-4 h-4" /> },
              { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
              { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'editing', label: 'Editing', icon: <GitBranch className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center py-12">
              <h2 className="text-4xl font-bold mb-4">
                Real-Time Collaboration Like Figma & Notion
              </h2>
              <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                Built with Supabase Realtime, featuring live presence, cursors, comments, chat, and more.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50 hover:border-neutral-700 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-400">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Quick Demo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <PresencePanel
                currentUserId={currentUserId}
                page="/collaboration-demo"
              />
              <CollaborationActivityFeed
                limit={10}
                showFilters={false}
                realtime
              />
            </div>
          </div>
        )}

        {activeTab === 'presence' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Live Presence</h2>
              <p className="text-neutral-400">
                See who's online, their status, and what they're working on in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50">
                  <h3 className="text-lg font-semibold mb-4">Avatar Badges</h3>
                  <PresenceAvatars
                    currentUserId={currentUserId}
                    page="/collaboration-demo"
                    maxDisplay={5}
                    showNames
                    size="lg"
                  />
                </div>

                <div className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50">
                  <h3 className="text-lg font-semibold mb-4">Features</h3>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Real-time online status
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Current page indicators
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      Activity type tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      Status messages
                    </li>
                  </ul>
                </div>
              </div>

              <PresencePanel
                currentUserId={currentUserId}
                page="/collaboration-demo"
              />
            </div>
          </div>
        )}

        {activeTab === 'cursors' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Live Cursors</h2>
              <p className="text-neutral-400">
                See real-time cursor positions of other users with their names and colors.
              </p>
            </div>

            <div className="p-8 border-2 border-dashed border-neutral-800 rounded-lg bg-neutral-900/30 min-h-[500px]">
              <p className="text-center text-neutral-500 mb-6">
                Move your mouse around to broadcast your cursor position.
                Open this page in multiple tabs to see multiple cursors!
              </p>
              <div className="text-center text-sm text-neutral-600">
                Your cursor ID: <code className="px-2 py-1 bg-neutral-900 rounded">{currentUserId}</code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Comments & Annotations</h2>
              <p className="text-neutral-400">
                Add comments with threading, @mentions, emoji reactions, and more.
              </p>
            </div>

            <Comments
              entityType="demo"
              entityId="collaboration-demo"
              currentUserId={currentUserId}
              currentUserName="Demo User"
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Activity Feed</h2>
              <p className="text-neutral-400">
                Real-time activity stream with filtering, grouping, and detailed change tracking.
              </p>
            </div>

            <CollaborationActivityFeed
              limit={50}
              showFilters
              realtime
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Chat</h2>
              <p className="text-neutral-400">
                Project rooms and direct messages with real-time updates.
              </p>
            </div>

            <div className="h-[700px]">
              <Chat
                currentUserId={currentUserId}
                currentUserName="Demo User"
              />
            </div>
          </div>
        )}

        {activeTab === 'editing' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Collaborative Editing</h2>
              <p className="text-neutral-400">
                Real-time co-editing with conflict resolution strategies.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50">
                <h3 className="text-lg font-semibold mb-4">Conflict Resolution Strategies</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Last Write Wins</h4>
                    <p className="text-sm text-neutral-400">
                      The most recent update always takes precedence. Simple and predictable.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Optimistic Updates</h4>
                    <p className="text-sm text-neutral-400">
                      Version-based conflict detection. Shows warning if version mismatch.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Merge Strategy</h4>
                    <p className="text-sm text-neutral-400">
                      Deep merge of non-conflicting changes. Best for collaborative editing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50">
                <h3 className="text-lg font-semibold mb-4">Edit Locks (Optional)</h3>
                <p className="text-sm text-neutral-400 mb-4">
                  Acquire exclusive edit locks to prevent conflicts entirely.
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Entity Lock Status</span>
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded">
                        Available
                      </span>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Acquire Lock
                  </button>
                  <p className="text-xs text-neutral-500">
                    Locks auto-expire after 5 minutes and are auto-refreshed while active.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-16 py-8 bg-neutral-900/50">
        <div className="container mx-auto px-6 text-center text-sm text-neutral-500">
          <p>Built with Next.js, Supabase Realtime, and TypeScript</p>
        </div>
      </footer>
    </div>
  )
}
