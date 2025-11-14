'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to manage session refresh based on user activity
 * Prevents session timeouts by refreshing tokens when user is active
 */
export function useSessionRefresh() {
  const supabase = createClient()
  const lastActivityRef = useRef<number>(Date.now())
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Periodic session refresh based on activity
    refreshIntervalRef.current = setInterval(async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current

      // Only refresh if user has been active in the last 10 minutes
      if (timeSinceActivity < 10 * 60 * 1000) {
        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (session) {
            // Check if session is approaching expiration (within 15 minutes)
            const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
            const timeUntilExpiry = expiresAt - Date.now()

            // Refresh if expiring within 15 minutes
            if (timeUntilExpiry < 15 * 60 * 1000) {
              await supabase.auth.refreshSession()
              console.log('[Session] Refreshed session proactively')
            }
          }
        } catch (error) {
          console.error('[Session] Error refreshing session:', error)
        }
      }
    }, 2 * 60 * 1000) // Check every 2 minutes

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [supabase.auth])
}
