/**
 * Platform Theme System for Conductor
 *
 * This allows users to customize the appearance of Conductor itself
 */

export interface PlatformTheme {
  id: string
  name: string

  // Typography
  typography: {
    titleFont: string
    titleSize: string
    titleWeight: string
    titleColor: string
    bodyFont: string
    bodySize: string
    bodyColor: string
    mutedColor: string
  }

  // Colors
  colors: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    accent: string
    danger: string
    success: string
    warning: string
  }

  // Buttons
  buttons: {
    borderRadius: string
    primaryBg: string
    primaryText: string
    primaryBorder: string
    secondaryBg: string
    secondaryText: string
    secondaryBorder: string
  }

  // Cards
  cards: {
    background: string
    border: string
    borderRadius: string
    shadow: string
  }

  // Layout
  layout: {
    navBackground: string
    navBorder: string
    pageBackground: string
    containerMaxWidth: string
  }
}

export const defaultPlatformTheme: PlatformTheme = {
  id: 'default',
  name: 'Default Dark',

  typography: {
    titleFont: 'system-ui, sans-serif',
    titleSize: '1.875rem', // 3xl
    titleWeight: '700',
    titleColor: '#ffffff',
    bodyFont: 'system-ui, sans-serif',
    bodySize: '1rem',
    bodyColor: '#e5e5e5',
    mutedColor: '#a3a3a3',
  },

  colors: {
    primary: '#3b82f6', // blue-500
    primaryHover: '#2563eb', // blue-600
    secondary: '#6b7280', // gray-500
    secondaryHover: '#4b5563', // gray-600
    accent: '#8b5cf6', // purple-500
    danger: '#ef4444', // red-500
    success: '#10b981', // green-500
    warning: '#f59e0b', // amber-500
  },

  buttons: {
    borderRadius: '0.5rem',
    primaryBg: '#3b82f6',
    primaryText: '#ffffff',
    primaryBorder: 'transparent',
    secondaryBg: '#374151',
    secondaryText: '#ffffff',
    secondaryBorder: '#4b5563',
  },

  cards: {
    background: '#171717',
    border: '#262626',
    borderRadius: '0.5rem',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },

  layout: {
    navBackground: '#0a0a0a',
    navBorder: '#262626',
    pageBackground: '#0a0a0a',
    containerMaxWidth: '80rem',
  },
}
