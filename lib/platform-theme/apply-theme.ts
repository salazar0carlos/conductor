/**
 * Apply Platform Theme
 *
 * Generates CSS variables from theme configuration
 */

import { PlatformTheme } from './types'

export function generateThemeCSS(theme: PlatformTheme): string {
  return `
    /* Typography */
    --conductor-title-font: ${theme.typography.titleFont};
    --conductor-title-size: ${theme.typography.titleSize};
    --conductor-title-weight: ${theme.typography.titleWeight};
    --conductor-title-color: ${theme.typography.titleColor};
    --conductor-body-font: ${theme.typography.bodyFont};
    --conductor-body-size: ${theme.typography.bodySize};
    --conductor-body-color: ${theme.typography.bodyColor};
    --conductor-muted-color: ${theme.typography.mutedColor};

    /* Colors */
    --conductor-primary: ${theme.colors.primary};
    --conductor-primary-hover: ${theme.colors.primaryHover};
    --conductor-secondary: ${theme.colors.secondary};
    --conductor-secondary-hover: ${theme.colors.secondaryHover};
    --conductor-accent: ${theme.colors.accent};
    --conductor-danger: ${theme.colors.danger};
    --conductor-success: ${theme.colors.success};
    --conductor-warning: ${theme.colors.warning};

    /* Buttons */
    --conductor-button-radius: ${theme.buttons.borderRadius};
    --conductor-button-primary-bg: ${theme.buttons.primaryBg};
    --conductor-button-primary-text: ${theme.buttons.primaryText};
    --conductor-button-primary-border: ${theme.buttons.primaryBorder};
    --conductor-button-secondary-bg: ${theme.buttons.secondaryBg};
    --conductor-button-secondary-text: ${theme.buttons.secondaryText};
    --conductor-button-secondary-border: ${theme.buttons.secondaryBorder};

    /* Cards */
    --conductor-card-bg: ${theme.cards.background};
    --conductor-card-border: ${theme.cards.border};
    --conductor-card-radius: ${theme.cards.borderRadius};
    --conductor-card-shadow: ${theme.cards.shadow};

    /* Layout */
    --conductor-nav-bg: ${theme.layout.navBackground};
    --conductor-nav-border: ${theme.layout.navBorder};
    --conductor-page-bg: ${theme.layout.pageBackground};
    --conductor-container-max: ${theme.layout.containerMaxWidth};
  `
}

export function applyThemeToDocument(theme: PlatformTheme) {
  const css = generateThemeCSS(theme)

  // Create or update style tag
  let styleTag = document.getElementById('conductor-platform-theme')
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = 'conductor-platform-theme'
    document.head.appendChild(styleTag)
  }

  styleTag.textContent = `:root { ${css} }`
}
