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
    bodyWeight: string
    bodyColor: string
    mutedColor: string
    lineHeight: string
  }

  // Colors
  colors: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    accent: string
    accentHover: string
    danger: string
    dangerHover: string
    success: string
    successHover: string
    warning: string
    warningHover: string
    info: string
    infoHover: string
  }

  // Buttons
  buttons: {
    borderRadius: string
    borderWidth: string
    primaryBg: string
    primaryText: string
    primaryBorder: string
    primaryHoverBg: string
    secondaryBg: string
    secondaryText: string
    secondaryBorder: string
    secondaryHoverBg: string
    fontSize: string
    fontWeight: string
  }

  // Cards
  cards: {
    background: string
    border: string
    borderRadius: string
    borderWidth: string
    shadow: string
    hoverShadow: string
    padding: string
  }

  // Inputs
  inputs: {
    background: string
    border: string
    borderRadius: string
    borderWidth: string
    text: string
    placeholder: string
    focusBorder: string
    focusShadow: string
  }

  // Badges
  badges: {
    borderRadius: string
    fontSize: string
    fontWeight: string
    padding: string
  }

  // Navigation
  navigation: {
    background: string
    border: string
    itemColor: string
    itemHoverBg: string
    itemActiveBg: string
    itemActiveColor: string
  }

  // Layout
  layout: {
    pageBackground: string
    containerMaxWidth: string
    borderRadius: string
    spacing: string
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
    bodySize: '0.875rem',
    bodyWeight: '400',
    bodyColor: '#e5e5e5',
    mutedColor: '#a3a3a3',
    lineHeight: '1.5',
  },

  colors: {
    primary: '#3b82f6', // blue-500
    primaryHover: '#2563eb', // blue-600
    secondary: '#6b7280', // gray-500
    secondaryHover: '#4b5563', // gray-600
    accent: '#8b5cf6', // purple-500
    accentHover: '#7c3aed', // purple-600
    danger: '#ef4444', // red-500
    dangerHover: '#dc2626', // red-600
    success: '#10b981', // green-500
    successHover: '#059669', // green-600
    warning: '#f59e0b', // amber-500
    warningHover: '#d97706', // amber-600
    info: '#06b6d4', // cyan-500
    infoHover: '#0891b2', // cyan-600
  },

  buttons: {
    borderRadius: '0.5rem',
    borderWidth: '1px',
    primaryBg: '#3b82f6',
    primaryText: '#ffffff',
    primaryBorder: 'transparent',
    primaryHoverBg: '#2563eb',
    secondaryBg: '#27272a',
    secondaryText: '#e5e5e5',
    secondaryBorder: '#3f3f46',
    secondaryHoverBg: '#3f3f46',
    fontSize: '0.875rem',
    fontWeight: '500',
  },

  cards: {
    background: '#18181b',
    border: '#27272a',
    borderRadius: '0.75rem',
    borderWidth: '1px',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    hoverShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    padding: '1.5rem',
  },

  inputs: {
    background: '#18181b',
    border: '#27272a',
    borderRadius: '0.5rem',
    borderWidth: '1px',
    text: '#e5e5e5',
    placeholder: '#71717a',
    focusBorder: '#3b82f6',
    focusShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },

  badges: {
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '0.25rem 0.5rem',
  },

  navigation: {
    background: '#18181b',
    border: '#27272a',
    itemColor: '#a1a1aa',
    itemHoverBg: '#27272a',
    itemActiveBg: '#3b82f6',
    itemActiveColor: '#ffffff',
  },

  layout: {
    pageBackground: '#0a0a0a',
    containerMaxWidth: '80rem',
    borderRadius: '0.5rem',
    spacing: '1.5rem',
  },
}
