/**
 * Enterprise Design Template
 *
 * Professional, accessible design for enterprise applications
 * WCAG 2.1 AAA compliant, conservative styling
 */

import { DesignTemplate } from '../types';

export const enterpriseTemplate: DesignTemplate = {
  id: 'enterprise',
  name: 'Enterprise',
  description: 'Professional and accessible design for enterprise applications. WCAG 2.1 AAA compliant.',
  category: 'enterprise',
  preview: {
    light: '/design-templates/enterprise-light.png',
    dark: '/design-templates/enterprise-dark.png',
  },
  theme: {
    light: {
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(0 0% 10%)',
      card: 'hsl(0 0% 99%)',
      cardForeground: 'hsl(0 0% 10%)',
      popover: 'hsl(0 0% 100%)',
      popoverForeground: 'hsl(0 0% 10%)',
      primary: 'hsl(216 98% 52%)', // Professional blue
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(210 17% 98%)',
      secondaryForeground: 'hsl(0 0% 10%)',
      muted: 'hsl(210 17% 98%)',
      mutedForeground: 'hsl(215 13% 35%)',
      accent: 'hsl(210 17% 95%)',
      accentForeground: 'hsl(0 0% 10%)',
      destructive: 'hsl(0 72% 51%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(214 16% 88%)',
      input: 'hsl(214 16% 88%)',
      ring: 'hsl(216 98% 52%)',
      success: 'hsl(142 69% 38%)',
      warning: 'hsl(38 86% 46%)',
      info: 'hsl(199 84% 44%)',
    },
    dark: {
      background: 'hsl(216 14% 14%)',
      foreground: 'hsl(0 0% 98%)',
      card: 'hsl(216 14% 16%)',
      cardForeground: 'hsl(0 0% 98%)',
      popover: 'hsl(216 14% 16%)',
      popoverForeground: 'hsl(0 0% 98%)',
      primary: 'hsl(216 98% 62%)', // Lighter for dark mode
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(216 12% 24%)',
      secondaryForeground: 'hsl(0 0% 98%)',
      muted: 'hsl(216 12% 24%)',
      mutedForeground: 'hsl(215 15% 70%)',
      accent: 'hsl(216 12% 28%)',
      accentForeground: 'hsl(0 0% 98%)',
      destructive: 'hsl(0 72% 61%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(216 12% 24%)',
      input: 'hsl(216 12% 24%)',
      ring: 'hsl(216 98% 62%)',
      success: 'hsl(142 69% 48%)',
      warning: 'hsl(38 86% 56%)',
      info: 'hsl(199 84% 54%)',
    },
    typography: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        heading: ['IBM Plex Sans', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    },
    spacing: {
      unit: 4,
      scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64],
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      xl: '0.5rem',
      '2xl': '0.75rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 2px 4px -1px rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      lg: '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      xl: '0 8px 16px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
      '2xl': '0 16px 32px -8px rgb(0 0 0 / 0.16)',
      inner: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.04)',
      none: 'none',
    },
    animations: {
      duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  components: {
    button: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'bg-primary text-primary-foreground hover:bg-primary/90',
        },
        secondary: {
          base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        },
        outline: {
          base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
        },
        ghost: {
          base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'hover:bg-accent hover:text-accent-foreground',
        },
        destructive: {
          base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        },
      },
      sizes: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
      },
    },
    card: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
        },
        elevated: {
          base: 'rounded-lg border bg-card text-card-foreground shadow-md',
        },
      },
    },
    input: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        },
      },
    },
    badge: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-transparent bg-primary text-primary-foreground',
        },
        secondary: {
          base: 'inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-transparent bg-secondary text-secondary-foreground',
        },
        outline: {
          base: 'inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-border text-foreground',
        },
        success: {
          base: 'inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-transparent bg-success text-white',
        },
        warning: {
          base: 'inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-transparent bg-warning text-white',
        },
      },
    },
    dialog: {
      defaultVariant: 'default',
      variants: {
        default: {
          overlay: 'fixed inset-0 z-50 bg-background/80',
          content:
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-2 bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        },
      },
    },
  },
  tailwindConfig: {
    content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
      extend: {},
    },
    plugins: ['@tailwindcss/forms', '@tailwindcss/typography'],
  },
  metadata: {
    version: '1.0.0',
    author: 'Conductor Design System',
    tags: ['enterprise', 'professional', 'accessible', 'wcag', 'corporate'],
    popularityScore: 88,
  },
};
