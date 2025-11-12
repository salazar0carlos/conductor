/**
 * Bold Design Template
 *
 * Strong, vibrant design with bold colors and pronounced effects
 * Perfect for marketing sites and consumer apps
 */

import { DesignTemplate } from '../types';

export const boldTemplate: DesignTemplate = {
  id: 'bold',
  name: 'Bold',
  description: 'Vibrant and energetic design with strong colors and bold typography. Perfect for marketing and consumer apps.',
  category: 'bold',
  preview: {
    light: '/design-templates/bold-light.png',
    dark: '/design-templates/bold-dark.png',
  },
  theme: {
    light: {
      background: 'hsl(0 0% 98%)',
      foreground: 'hsl(240 10% 3.9%)',
      card: 'hsl(0 0% 100%)',
      cardForeground: 'hsl(240 10% 3.9%)',
      popover: 'hsl(0 0% 100%)',
      popoverForeground: 'hsl(240 10% 3.9%)',
      primary: 'hsl(262 83% 58%)', // Purple
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(199 89% 48%)', // Blue
      secondaryForeground: 'hsl(0 0% 100%)',
      muted: 'hsl(240 4.8% 95.9%)',
      mutedForeground: 'hsl(240 3.8% 46.1%)',
      accent: 'hsl(38 92% 50%)', // Orange
      accentForeground: 'hsl(0 0% 100%)',
      destructive: 'hsl(0 84% 60%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(240 5.9% 90%)',
      input: 'hsl(240 5.9% 90%)',
      ring: 'hsl(262 83% 58%)',
      success: 'hsl(142 76% 36%)',
      warning: 'hsl(38 92% 50%)',
      info: 'hsl(199 89% 48%)',
    },
    dark: {
      background: 'hsl(240 10% 3.9%)',
      foreground: 'hsl(0 0% 98%)',
      card: 'hsl(240 10% 7%)',
      cardForeground: 'hsl(0 0% 98%)',
      popover: 'hsl(240 10% 7%)',
      popoverForeground: 'hsl(0 0% 98%)',
      primary: 'hsl(263 70% 60%)', // Lighter purple for dark mode
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(199 89% 58%)', // Lighter blue for dark mode
      secondaryForeground: 'hsl(0 0% 100%)',
      muted: 'hsl(240 3.7% 15.9%)',
      mutedForeground: 'hsl(240 5% 64.9%)',
      accent: 'hsl(38 92% 60%)', // Lighter orange for dark mode
      accentForeground: 'hsl(240 10% 3.9%)',
      destructive: 'hsl(0 84% 65%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(240 3.7% 15.9%)',
      input: 'hsl(240 3.7% 15.9%)',
      ring: 'hsl(263 70% 60%)',
      success: 'hsl(142 76% 46%)',
      warning: 'hsl(38 92% 60%)',
      info: 'hsl(199 89% 58%)',
    },
    typography: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Outfit', 'Poppins', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.375rem',
        '2xl': '1.625rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3.25rem',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: '1.2',
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
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
      md: '0 6px 12px -2px rgb(0 0 0 / 0.15), 0 3px 6px -3px rgb(0 0 0 / 0.1)',
      lg: '0 16px 24px -4px rgb(0 0 0 / 0.2), 0 8px 12px -6px rgb(0 0 0 / 0.15)',
      xl: '0 24px 32px -6px rgb(0 0 0 / 0.25), 0 12px 16px -8px rgb(0 0 0 / 0.2)',
      '2xl': '0 32px 64px -16px rgb(0 0 0 / 0.3)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
      none: 'none',
    },
    animations: {
      duration: {
        fast: '100ms',
        normal: '150ms',
        slow: '250ms',
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)', // More pronounced
      },
    },
  },
  components: {
    button: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md hover:shadow-lg active:shadow-sm',
          colors: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
        },
        secondary: {
          base: 'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md hover:shadow-lg active:shadow-sm',
          colors: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105 active:scale-95',
        },
        outline: {
          base: 'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'border-2 border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95',
        },
        ghost: {
          base: 'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'hover:bg-accent/20 hover:text-accent-foreground hover:scale-105 active:scale-95',
        },
      },
      sizes: {
        sm: 'h-10 px-4',
        md: 'h-12 px-6 py-3',
        lg: 'h-14 px-8',
      },
    },
    card: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'rounded-xl border-2 bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow',
        },
        elevated: {
          base: 'rounded-xl border-2 bg-card text-card-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]',
        },
      },
    },
    input: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'flex h-12 w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all',
        },
      },
    },
    badge: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
        },
        secondary: {
          base: 'inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md',
        },
        outline: {
          base: 'inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        },
      },
    },
    dialog: {
      defaultVariant: 'default',
      variants: {
        default: {
          overlay: 'fixed inset-0 z-50 bg-background/90 backdrop-blur-md',
          content:
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border-2 bg-background p-8 shadow-2xl duration-200 sm:rounded-2xl',
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
    tags: ['bold', 'vibrant', 'energetic', 'marketing'],
    popularityScore: 85,
  },
};
