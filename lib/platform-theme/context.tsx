'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PlatformTheme, defaultPlatformTheme } from './types'
import { applyThemeToDocument } from './apply-theme'

interface ThemeHistory {
  past: PlatformTheme[]
  present: PlatformTheme
  future: PlatformTheme[]
}

interface ThemeContextType {
  theme: PlatformTheme
  setTheme: (theme: PlatformTheme) => void
  saveTheme: () => Promise<void>
  resetTheme: () => Promise<void>
  loading: boolean
  error: string | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  previewTheme: (theme: PlatformTheme) => void
  clearPreview: () => void
  isPreview: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ThemeHistory>({
    past: [],
    present: defaultPlatformTheme,
    future: [],
  })
  const [_savedTheme, setSavedTheme] = useState<PlatformTheme>(defaultPlatformTheme)
  const [previewTheme, setPreviewTheme] = useState<PlatformTheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load theme from server on mount
  useEffect(() => {
    loadTheme()
  }, [])

  // Apply theme whenever it changes
  useEffect(() => {
    const activeTheme = previewTheme || history.present
    applyThemeToDocument(activeTheme)
  }, [history.present, previewTheme])

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/platform-theme')
      const result = await response.json()

      if (result.success) {
        const theme = result.data
        setHistory({
          past: [],
          present: theme,
          future: [],
        })
        setSavedTheme(theme)
      } else {
        setHistory({
          past: [],
          present: defaultPlatformTheme,
          future: [],
        })
        setSavedTheme(defaultPlatformTheme)
      }
    } catch (err) {
      console.error('Failed to load theme:', err)
      setError('Failed to load theme')
      setHistory({
        past: [],
        present: defaultPlatformTheme,
        future: [],
      })
      setSavedTheme(defaultPlatformTheme)
    } finally {
      setLoading(false)
    }
  }

  const setTheme = useCallback((newTheme: PlatformTheme) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: newTheme,
      future: [],
    }))
    setError(null)
  }, [])

  const saveTheme = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/platform-theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(history.present),
      })

      const result = await response.json()

      if (result.success) {
        setSavedTheme(history.present)
        // Clear preview after saving
        setPreviewTheme(null)
      } else {
        setError(result.error || 'Failed to save theme')
        throw new Error(result.error || 'Failed to save theme')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save theme'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetTheme = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/platform-theme', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setHistory({
          past: [],
          present: defaultPlatformTheme,
          future: [],
        })
        setSavedTheme(defaultPlatformTheme)
        setPreviewTheme(null)
      } else {
        setError(result.error || 'Failed to reset theme')
        throw new Error(result.error || 'Failed to reset theme')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset theme'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, prev.past.length - 1)
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const handlePreview = useCallback((theme: PlatformTheme) => {
    setPreviewTheme(theme)
  }, [])

  const clearPreview = useCallback(() => {
    setPreviewTheme(null)
  }, [])

  const value: ThemeContextType = {
    theme: history.present,
    setTheme,
    saveTheme,
    resetTheme,
    loading,
    error,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    previewTheme: handlePreview,
    clearPreview,
    isPreview: previewTheme !== null,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}
