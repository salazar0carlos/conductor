/**
 * Landing Page Design Template
 *
 * Optimized for marketing landing pages with strong CTAs and conversion focus
 * Perfect for product launches and marketing campaigns
 */

import { DesignTemplate } from '../types';

export const landingTemplate: DesignTemplate = {
  id: 'landing',
  name: 'Landing',
  description: 'Conversion-focused design optimized for landing pages with strong CTAs. Perfect for marketing and product launches.',
  category: 'landing',
  preview: {
    light: '/design-templates/landing-light.png',
    dark: '/design-templates/landing-dark.png',
  },
  theme: {
    light: {
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(240 5% 15%)',
      card: 'hsl(0 0% 98%)',
      cardForeground: 'hsl(240 5% 15%)',
      popover: 'hsl(0 0% 100%)',
      popoverForeground: 'hsl(240 5% 15%)',
      primary: 'hsl(260 100% 50%)', // Electric purple
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(180 100% 40%)', // Cyan
      secondaryForeground: 'hsl(0 0% 100%)',
      muted: 'hsl(240 5% 96%)',
      mutedForeground: 'hsl(240 4% 46%)',
      accent: 'hsl(340 100% 50%)', // Hot pink
      accentForeground: 'hsl(0 0% 100%)',
      destructive: 'hsl(0 84% 60%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(240 6% 90%)',
      input: 'hsl(240 6% 90%)',
      ring: 'hsl(260 100% 50%)',
      success: 'hsl(142 71% 45%)',
      warning: 'hsl(38 92% 50%)',
      info: 'hsl(199 89% 48%)',
    },
    dark: {
      background: 'hsl(240 5% 6%)',
      foreground: 'hsl(0 0% 98%)',
      card: 'hsl(240 4% 10%)',
      cardForeground: 'hsl(0 0% 98%)',
      popover: 'hsl(240 4% 10%)',
      popoverForeground: 'hsl(0 0% 98%)',
      primary: 'hsl(260 100% 60%)', // Lighter for dark mode
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(180 100% 50%)', // Brighter cyan
      secondaryForeground: 'hsl(240 5% 6%)',
      muted: 'hsl(240 4% 16%)',
      mutedForeground: 'hsl(240 5% 65%)',
      accent: 'hsl(340 100% 60%)', // Lighter pink
      accentForeground: 'hsl(240 5% 6%)',
      destructive: 'hsl(0 84% 65%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(240 4% 16%)',
      input: 'hsl(240 4% 16%)',
      ring: 'hsl(260 100% 60%)',
      success: 'hsl(142 71% 55%)',
      warning: 'hsl(38 92% 60%)',
      info: 'hsl(199 89% 58%)',
    },
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1.125rem', // Slightly larger base for readability
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        '4xl': '3.5rem',
        '5xl': '4.5rem',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: '1.1',
        normal: '1.6',
        relaxed: '1.8',
      },
    },
    spacing: {
      unit: 4,
      scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96], // Extra large for hero sections
    },
    borderRadius: {
      none: '0',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      '2xl': '2rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 8px 16px -4px rgb(0 0 0 / 0.1), 0 4px 8px -4px rgb(0 0 0 / 0.1)',
      lg: '0 20px 40px -8px rgb(0 0 0 / 0.15), 0 8px 16px -8px rgb(0 0 0 / 0.1)',
      xl: '0 32px 64px -12px rgb(0 0 0 / 0.2), 0 16px 32px -12px rgb(0 0 0 / 0.15)',
      '2xl': '0 48px 96px -24px rgb(0 0 0 / 0.3)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
      none: 'none',
    },
    animations: {
      duration: {
        fast: '200ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.45, 0, 0.55, 1)', // Smooth for CTAs
      },
    },
  },
  components: {
    button: {
      defaultVariant: 'cta', // CTA is default for landing pages
      variants: {
        cta: {
          base: 'inline-flex items-center justify-center rounded-full text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-2xl hover:shadow-3xl',
          colors: 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:scale-105 active:scale-95 animate-pulse-slow',
        },
        default: {
          base: 'inline-flex items-center justify-center rounded-full text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg hover:shadow-xl',
          colors: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105',
        },
        secondary: {
          base: 'inline-flex items-center justify-center rounded-full text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg hover:shadow-xl',
          colors: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105',
        },
        outline: {
          base: 'inline-flex items-center justify-center rounded-full text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          colors: 'border-2 border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground hover:scale-105',
        },
        ghost: {
          base: 'inline-flex items-center justify-center rounded-full text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
          colors: 'hover:bg-accent/10 hover:text-accent-foreground',
        },
      },
      sizes: {
        sm: 'h-11 px-6',
        md: 'h-14 px-8 py-4',
        lg: 'h-16 px-12 text-lg',
      },
    },
    card: {
      defaultVariant: 'elevated',
      variants: {
        default: {
          base: 'rounded-2xl border bg-card text-card-foreground shadow-xl hover:shadow-2xl transition-all',
        },
        elevated: {
          base: 'rounded-2xl border-2 bg-card text-card-foreground shadow-2xl hover:shadow-3xl transition-all hover:scale-[1.02]',
        },
      },
    },
    input: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'flex h-14 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base font-medium ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm',
        },
      },
    },
    badge: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'inline-flex items-center rounded-full border-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-transparent bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg',
        },
        secondary: {
          base: 'inline-flex items-center rounded-full border-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md',
        },
        outline: {
          base: 'inline-flex items-center rounded-full border-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          colors: 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        },
      },
    },
    dialog: {
      defaultVariant: 'default',
      variants: {
        default: {
          overlay: 'fixed inset-0 z-50 bg-background/95 backdrop-blur-xl',
          content:
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-6 border-2 bg-background p-8 shadow-3xl duration-300 sm:rounded-3xl',
        },
      },
    },
  },
  tailwindConfig: {
    content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
      extend: {
        animation: {
          'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
      },
    },
    plugins: ['@tailwindcss/forms', '@tailwindcss/typography'],
  },
  metadata: {
    version: '1.0.0',
    author: 'Conductor Design System',
    tags: ['landing', 'marketing', 'conversion', 'cta'],
    popularityScore: 92,
  },
};
