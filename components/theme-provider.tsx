'use client'

import { useEffect, useState } from 'react'
import { applyThemeToDocument, PlatformTheme, defaultPlatformTheme } from '@/lib/platform-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeLoaded, setThemeLoaded] = useState(false)

  useEffect(() => {
    // Load and apply theme on mount
    async function loadTheme() {
      try {
        const response = await fetch('/api/platform-theme')
        const result = await response.json()

        if (result.success) {
          applyThemeToDocument(result.data)
        } else {
          // Fallback to default theme
          applyThemeToDocument(defaultPlatformTheme)
        }
      } catch (error) {
        console.error('Failed to load platform theme:', error)
        // Apply default theme on error
        applyThemeToDocument(defaultPlatformTheme)
      } finally {
        setThemeLoaded(true)
      }
    }

    loadTheme()
  }, [])

  // Render children immediately - theme will apply asynchronously
  // This prevents blocking page render
  return <>{children}</>
}
