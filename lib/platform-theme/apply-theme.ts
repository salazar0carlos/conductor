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
    --conductor-body-weight: ${theme.typography.bodyWeight};
    --conductor-body-color: ${theme.typography.bodyColor};
    --conductor-muted-color: ${theme.typography.mutedColor};
    --conductor-line-height: ${theme.typography.lineHeight};

    /* Colors */
    --conductor-primary: ${theme.colors.primary};
    --conductor-primary-hover: ${theme.colors.primaryHover};
    --conductor-secondary: ${theme.colors.secondary};
    --conductor-secondary-hover: ${theme.colors.secondaryHover};
    --conductor-accent: ${theme.colors.accent};
    --conductor-accent-hover: ${theme.colors.accentHover};
    --conductor-danger: ${theme.colors.danger};
    --conductor-danger-hover: ${theme.colors.dangerHover};
    --conductor-success: ${theme.colors.success};
    --conductor-success-hover: ${theme.colors.successHover};
    --conductor-warning: ${theme.colors.warning};
    --conductor-warning-hover: ${theme.colors.warningHover};
    --conductor-info: ${theme.colors.info};
    --conductor-info-hover: ${theme.colors.infoHover};

    /* Buttons */
    --conductor-button-radius: ${theme.buttons.borderRadius};
    --conductor-button-border-width: ${theme.buttons.borderWidth};
    --conductor-button-primary-bg: ${theme.buttons.primaryBg};
    --conductor-button-primary-text: ${theme.buttons.primaryText};
    --conductor-button-primary-border: ${theme.buttons.primaryBorder};
    --conductor-button-primary-hover-bg: ${theme.buttons.primaryHoverBg};
    --conductor-button-secondary-bg: ${theme.buttons.secondaryBg};
    --conductor-button-secondary-text: ${theme.buttons.secondaryText};
    --conductor-button-secondary-border: ${theme.buttons.secondaryBorder};
    --conductor-button-secondary-hover-bg: ${theme.buttons.secondaryHoverBg};
    --conductor-button-font-size: ${theme.buttons.fontSize};
    --conductor-button-font-weight: ${theme.buttons.fontWeight};

    /* Cards */
    --conductor-card-background: ${theme.cards.background};
    --conductor-card-border: ${theme.cards.border};
    --conductor-card-radius: ${theme.cards.borderRadius};
    --conductor-card-border-width: ${theme.cards.borderWidth};
    --conductor-card-shadow: ${theme.cards.shadow};
    --conductor-card-hover-shadow: ${theme.cards.hoverShadow};
    --conductor-card-padding: ${theme.cards.padding};

    /* Inputs */
    --conductor-input-background: ${theme.inputs.background};
    --conductor-input-border: ${theme.inputs.border};
    --conductor-input-radius: ${theme.inputs.borderRadius};
    --conductor-input-border-width: ${theme.inputs.borderWidth};
    --conductor-input-text: ${theme.inputs.text};
    --conductor-input-placeholder: ${theme.inputs.placeholder};
    --conductor-input-focus-border: ${theme.inputs.focusBorder};
    --conductor-input-focus-shadow: ${theme.inputs.focusShadow};

    /* Badges */
    --conductor-badge-radius: ${theme.badges.borderRadius};
    --conductor-badge-font-size: ${theme.badges.fontSize};
    --conductor-badge-font-weight: ${theme.badges.fontWeight};
    --conductor-badge-padding: ${theme.badges.padding};

    /* Navigation */
    --conductor-nav-background: ${theme.navigation.background};
    --conductor-nav-border: ${theme.navigation.border};
    --conductor-nav-item-color: ${theme.navigation.itemColor};
    --conductor-nav-item-hover-bg: ${theme.navigation.itemHoverBg};
    --conductor-nav-item-active-bg: ${theme.navigation.itemActiveBg};
    --conductor-nav-item-active-color: ${theme.navigation.itemActiveColor};

    /* Layout */
    --conductor-page-background: ${theme.layout.pageBackground};
    --conductor-container-max-width: ${theme.layout.containerMaxWidth};
    --conductor-border-radius: ${theme.layout.borderRadius};
    --conductor-spacing: ${theme.layout.spacing};
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
