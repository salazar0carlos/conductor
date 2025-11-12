/**
 * Glassmorphic Design Template
 *
 * Modern glassmorphism design with frosted glass effects and transparency
 * Perfect for modern web apps with rich visuals
 */

import { DesignTemplate } from '../types';

export const glassmorphicTemplate: DesignTemplate = {
  id: 'glassmorphic',
  name: 'Glassmorphic',
  description: 'Modern frosted glass aesthetic with blur effects and transparency. Perfect for visually rich applications.',
  category: 'glassmorphic',
  preview: {
    light: '/design-templates/glassmorphic-light.png',
    dark: '/design-templates/glassmorphic-dark.png',
  },
  theme: {
    light: {
      background: 'hsl(210 40% 98%)',
      foreground: 'hsl(220 15% 20%)',
      card: 'hsl(0 0% 100% / 0.7)',
      cardForeground: 'hsl(220 15% 20%)',
      popover: 'hsl(0 0% 100% / 0.9)',
      popoverForeground: 'hsl(220 15% 20%)',
      primary: 'hsl(210 100% 50%)',
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(280 60% 60%)',
      secondaryForeground: 'hsl(0 0% 100%)',
      muted: 'hsl(210 40% 96% / 0.7)',
      mutedForeground: 'hsl(215 15% 50%)',
      accent: 'hsl(340 80% 60%)',
      accentForeground: 'hsl(0 0% 100%)',
      destructive: 'hsl(0 85% 60%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(220 13% 91% / 0.5)',
      input: 'hsl(220 13% 91% / 0.5)',
      ring: 'hsl(210 100% 50% / 0.5)',
      success: 'hsl(142 71% 45%)',
      warning: 'hsl(38 92% 50%)',
      info: 'hsl(199 89% 48%)',
    },
    dark: {
      background: 'hsl(220 15% 10%)',
      foreground: 'hsl(210 40% 98%)',
      card: 'hsl(220 15% 15% / 0.7)',
      cardForeground: 'hsl(210 40% 98%)',
      popover: 'hsl(220 15% 15% / 0.9)',
      popoverForeground: 'hsl(210 40% 98%)',
      primary: 'hsl(210 100% 60%)',
      primaryForeground: 'hsl(0 0% 100%)',
      secondary: 'hsl(280 60% 70%)',
      secondaryForeground: 'hsl(220 15% 10%)',
      muted: 'hsl(220 15% 20% / 0.7)',
      mutedForeground: 'hsl(215 20% 65%)',
      accent: 'hsl(340 80% 70%)',
      accentForeground: 'hsl(220 15% 10%)',
      destructive: 'hsl(0 85% 65%)',
      destructiveForeground: 'hsl(0 0% 100%)',
      border: 'hsl(220 15% 25% / 0.5)',
      input: 'hsl(220 15% 25% / 0.5)',
      ring: 'hsl(210 100% 60% / 0.5)',
      success: 'hsl(142 71% 55%)',
      warning: 'hsl(38 92% 60%)',
      info: 'hsl(199 89% 58%)',
    },
    typography: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Clash Display', 'Sora', 'sans-serif'],
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
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 2px 8px 0 rgb(0 0 0 / 0.1)',
      md: '0 4px 16px -2px rgb(0 0 0 / 0.15), 0 2px 8px -2px rgb(0 0 0 / 0.1)',
      lg: '0 8px 24px -4px rgb(0 0 0 / 0.2), 0 4px 12px -4px rgb(0 0 0 / 0.15)',
      xl: '0 16px 32px -6px rgb(0 0 0 / 0.25), 0 8px 16px -6px rgb(0 0 0 / 0.2)',
      '2xl': '0 24px 48px -12px rgb(0 0 0 / 0.3)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
      none: 'none',
    },
    animations: {
      duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '350ms',
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
          base: 'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-md',
          colors: 'bg-primary/80 text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl border border-white/20',
        },
        secondary: {
          base: 'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-md',
          colors: 'bg-secondary/80 text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl border border-white/20',
        },
        outline: {
          base: 'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-md',
          colors: 'border-2 border-primary/50 bg-background/50 text-primary hover:bg-primary/20',
        },
        ghost: {
          base: 'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-md',
          colors: 'hover:bg-accent/20 hover:text-accent-foreground',
        },
      },
      sizes: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6',
      },
    },
    card: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'rounded-2xl border border-white/10 bg-card text-card-foreground shadow-xl backdrop-blur-xl',
        },
        elevated: {
          base: 'rounded-2xl border border-white/20 bg-card text-card-foreground shadow-2xl backdrop-blur-2xl',
        },
      },
    },
    input: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'flex h-10 w-full rounded-xl border border-input bg-background/50 backdrop-blur-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
        },
      },
    },
    badge: {
      defaultVariant: 'default',
      variants: {
        default: {
          base: 'inline-flex items-center rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md',
          colors: 'bg-primary/80 text-primary-foreground hover:bg-primary/90',
        },
        secondary: {
          base: 'inline-flex items-center rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md',
          colors: 'bg-secondary/80 text-secondary-foreground hover:bg-secondary/90',
        },
        outline: {
          base: 'inline-flex items-center rounded-full border border-primary/50 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md',
          colors: 'bg-background/50 text-primary hover:bg-primary/20',
        },
      },
    },
    dialog: {
      defaultVariant: 'default',
      variants: {
        default: {
          overlay: 'fixed inset-0 z-50 bg-background/60 backdrop-blur-lg',
          content:
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/20 bg-background/80 backdrop-blur-2xl p-6 shadow-2xl duration-200 sm:rounded-2xl',
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
    tags: ['glassmorphic', 'modern', 'frosted', 'transparent'],
    popularityScore: 90,
  },
};
