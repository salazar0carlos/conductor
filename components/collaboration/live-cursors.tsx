'use client'

import { useEffect, useState, useRef } from 'react'
import { CursorTracker, CursorPosition, generateUserColor } from '@/lib/collaboration/presence'
import { subscribeToCursors, unsubscribe } from '@/lib/collaboration/realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface LiveCursorsProps {
  userId: string
  page: string
  enabled?: boolean
}

export function LiveCursors({ userId, page, enabled = true }: LiveCursorsProps) {
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const [cursorTracker] = useState(() => new CursorTracker(userId, page))
  const containerRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Fetch initial cursors
    cursorTracker.getCursors().then(setCursors)

    // Subscribe to cursor updates
    channelRef.current = subscribeToCursors(page, async () => {
      const updated = await cursorTracker.getCursors()
      setCursors(updated)
    })

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      const element = document.elementFromPoint(e.clientX, e.clientY)
      const elementId = element?.id || undefined

      cursorTracker.updatePosition(x, y, elementId, generateUserColor(userId))
    }

    // Track touch movement for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return

      const touch = e.touches[0]
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((touch.clientX - rect.left) / rect.width) * 100
      const y = ((touch.clientY - rect.top) / rect.height) * 100

      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const elementId = element?.id || undefined

      cursorTracker.updatePosition(x, y, elementId, generateUserColor(userId))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)

      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }

      cursorTracker.removeCursor()
    }
  }, [userId, page, enabled, cursorTracker])

  if (!enabled) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    >
      {cursors.map((cursor) => (
        <Cursor key={cursor.id} cursor={cursor} />
      ))}
    </div>
  )
}

interface CursorProps {
  cursor: CursorPosition
}

function Cursor({ cursor }: CursorProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Hide cursor if it hasn't moved recently
    const checkActivity = setInterval(() => {
      const lastMoved = new Date(cursor.last_moved_at).getTime()
      const now = Date.now()
      setIsVisible(now - lastMoved < 10000) // Hide after 10 seconds
    }, 1000)

    return () => clearInterval(checkActivity)
  }, [cursor.last_moved_at])

  if (!isVisible) return null

  return (
    <div
      className="absolute transition-all duration-100 ease-out pointer-events-none"
      style={{
        left: `${cursor.x}%`,
        top: `${cursor.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <path
          d="M5.65376 12.3673L8.63434 18.6873C8.92997 19.2849 9.69495 19.4764 10.2419 19.1147L12.4081 17.6619C12.7738 17.4086 13.2523 17.3716 13.6514 17.5661L18.0515 19.6316C18.6877 19.9367 19.4374 19.5787 19.5929 18.8871L22.4596 5.99701C22.6373 5.20507 21.8743 4.5379 21.1267 4.83075L3.09818 11.8383C2.29466 12.1538 2.31531 13.3042 3.13452 13.5879L5.65376 12.3673Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User label */}
      <div
        className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.user?.name || cursor.user?.email || 'Anonymous'}
      </div>
    </div>
  )
}

// Hook for cursor tracking without rendering
export function useCursorTracking(userId: string, page: string, enabled: boolean = true) {
  const [cursorTracker] = useState(() => new CursorTracker(userId, page))
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Subscribe to cursor updates
    channelRef.current = subscribeToCursors(page, () => {
      // Just trigger re-fetch if needed
    })

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      const element = document.elementFromPoint(e.clientX, e.clientY)
      const elementId = element?.id || undefined

      cursorTracker.updatePosition(x, y, elementId, generateUserColor(userId))
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)

      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }

      cursorTracker.removeCursor()
    }
  }, [userId, page, enabled, cursorTracker])

  return cursorTracker
}
