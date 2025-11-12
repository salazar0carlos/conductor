/**
 * Design Template Application System
 *
 * Applies design templates to projects by generating necessary files
 */

import { DesignTemplate, DesignTemplateFile, ColorMode } from './types';
import { getTemplate } from './registry';

export class DesignTemplateApplicator {
  /**
   * Generate all files needed to apply a design template
   */
  static generateTemplateFiles(
    templateId: string,
    projectName: string
  ): DesignTemplateFile[] {
    const template = getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return [
      this.generateTailwindConfig(template),
      this.generateGlobalCSS(template),
      this.generateThemeProvider(template),
      this.generateComponentsJson(template),
      this.generateReadme(template, projectName),
      this.generateThemeToggle(template),
    ];
  }

  /**
   * Generate tailwind.config.ts
   */
  private static generateTailwindConfig(template: DesignTemplate): DesignTemplateFile {
    const { light, dark, typography, borderRadius, shadows, animations } = template.theme;

    const content = `import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: ${JSON.stringify(borderRadius, null, 6)},
      boxShadow: ${JSON.stringify(shadows, null, 6)},
      fontFamily: ${JSON.stringify(typography.fontFamily, null, 6)},
      fontSize: ${JSON.stringify(typography.fontSize, null, 6)},
      fontWeight: ${JSON.stringify(typography.fontWeight, null, 6)},
      lineHeight: ${JSON.stringify(typography.lineHeight, null, 6)},
      transitionDuration: ${JSON.stringify(animations.duration, null, 6)},
      transitionTimingFunction: ${JSON.stringify(animations.easing, null, 6)},
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
`;

    return {
      path: 'tailwind.config.ts',
      content,
      description: 'Tailwind CSS configuration with design system tokens',
    };
  }

  /**
   * Generate globals.css with CSS variables
   */
  private static generateGlobalCSS(template: DesignTemplate): DesignTemplateFile {
    const { light, dark } = template.theme;

    const convertHSL = (hsl: string) => {
      // Extract just the HSL values without 'hsl()' wrapper
      return hsl.replace(/hsl\((.*?)\)/, '$1');
    };

    const content = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: ${convertHSL(light.background)};
    --foreground: ${convertHSL(light.foreground)};
    --card: ${convertHSL(light.card)};
    --card-foreground: ${convertHSL(light.cardForeground)};
    --popover: ${convertHSL(light.popover)};
    --popover-foreground: ${convertHSL(light.popoverForeground)};
    --primary: ${convertHSL(light.primary)};
    --primary-foreground: ${convertHSL(light.primaryForeground)};
    --secondary: ${convertHSL(light.secondary)};
    --secondary-foreground: ${convertHSL(light.secondaryForeground)};
    --muted: ${convertHSL(light.muted)};
    --muted-foreground: ${convertHSL(light.mutedForeground)};
    --accent: ${convertHSL(light.accent)};
    --accent-foreground: ${convertHSL(light.accentForeground)};
    --destructive: ${convertHSL(light.destructive)};
    --destructive-foreground: ${convertHSL(light.destructiveForeground)};
    --border: ${convertHSL(light.border)};
    --input: ${convertHSL(light.input)};
    --ring: ${convertHSL(light.ring)};
    --radius: 0.5rem;
  }

  .dark {
    --background: ${convertHSL(dark.background)};
    --foreground: ${convertHSL(dark.foreground)};
    --card: ${convertHSL(dark.card)};
    --card-foreground: ${convertHSL(dark.cardForeground)};
    --popover: ${convertHSL(dark.popover)};
    --popover-foreground: ${convertHSL(dark.popoverForeground)};
    --primary: ${convertHSL(dark.primary)};
    --primary-foreground: ${convertHSL(dark.primaryForeground)};
    --secondary: ${convertHSL(dark.secondary)};
    --secondary-foreground: ${convertHSL(dark.secondaryForeground)};
    --muted: ${convertHSL(dark.muted)};
    --muted-foreground: ${convertHSL(dark.mutedForeground)};
    --accent: ${convertHSL(dark.accent)};
    --accent-foreground: ${convertHSL(dark.accentForeground)};
    --destructive: ${convertHSL(dark.destructive)};
    --destructive-foreground: ${convertHSL(dark.destructiveForeground)};
    --border: ${convertHSL(dark.border)};
    --input: ${convertHSL(dark.input)};
    --ring: ${convertHSL(dark.ring)};
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}
`;

    return {
      path: 'app/globals.css',
      content,
      description: 'Global styles with CSS variables for light and dark themes',
    };
  }

  /**
   * Generate theme provider component
   */
  private static generateThemeProvider(template: DesignTemplate): DesignTemplateFile {
    const content = `'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
`;

    return {
      path: 'components/theme-provider.tsx',
      content,
      description: 'Theme provider component for dark/light mode switching',
    };
  }

  /**
   * Generate components.json for shadcn/ui
   */
  private static generateComponentsJson(template: DesignTemplate): DesignTemplateFile {
    const content = {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: template.category === 'enterprise' ? 'default' : 'new-york',
      rsc: true,
      tsx: true,
      tailwind: {
        config: 'tailwind.config.ts',
        css: 'app/globals.css',
        baseColor: template.category === 'minimal' ? 'slate' : template.category === 'bold' ? 'violet' : 'blue',
        cssVariables: true,
      },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
      },
    };

    return {
      path: 'components.json',
      content: JSON.stringify(content, null, 2),
      description: 'shadcn/ui configuration for component installation',
    };
  }

  /**
   * Generate README for the design system
   */
  private static generateReadme(template: DesignTemplate, projectName: string): DesignTemplateFile {
    const content = `# ${projectName} - Design System

This project uses the **${template.name}** design template from Conductor.

## About This Template

${template.description}

**Category:** ${template.category}
**Version:** ${template.metadata.version}
**Tags:** ${template.metadata.tags.join(', ')}

## Features

- 🌓 **Dark/Light Mode** - Full support for both color modes
- 🎨 **CSS Variables** - Easy theme customization
- 📱 **Responsive** - Mobile-first design approach
- ♿ **Accessible** - ${template.category === 'enterprise' ? 'WCAG 2.1 AAA compliant' : 'WCAG 2.1 AA compliant'}
- 🎭 **Component Library** - Built with shadcn/ui

## Quick Start

### Dark/Light Mode Toggle

Use the \`ThemeToggle\` component to allow users to switch themes:

\`\`\`tsx
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
\`\`\`

### Using Design Tokens

All colors are defined as CSS variables and can be used with Tailwind classes:

\`\`\`tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click Me
</button>

<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  Card content
</div>
\`\`\`

### Typography

The design system includes predefined font families:

- **Sans:** ${template.theme.typography.fontFamily.sans.join(', ')}
- **Mono:** ${template.theme.typography.fontFamily.mono.join(', ')}
${template.theme.typography.fontFamily.heading ? `- **Heading:** ${template.theme.typography.fontFamily.heading.join(', ')}` : ''}

### Customization

To customize the design, edit the CSS variables in \`app/globals.css\`:

\`\`\`css
:root {
  --primary: YOUR_HSL_VALUE;
  --primary-foreground: YOUR_HSL_VALUE;
  /* ... */
}
\`\`\`

## Color Palette

### Light Mode
- Primary: \`${template.theme.light.primary}\`
- Secondary: \`${template.theme.light.secondary}\`
- Accent: \`${template.theme.light.accent}\`

### Dark Mode
- Primary: \`${template.theme.dark.primary}\`
- Secondary: \`${template.theme.dark.secondary}\`
- Accent: \`${template.theme.dark.accent}\`

## Adding Components

Install shadcn/ui components using the CLI:

\`\`\`bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
# ... etc
\`\`\`

Components will automatically inherit the design system tokens.

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)

---

**Powered by Conductor Design System**
`;

    return {
      path: 'DESIGN_SYSTEM.md',
      content,
      description: 'Documentation for the applied design system',
    };
  }

  /**
   * Generate theme toggle component
   */
  private static generateThemeToggle(template: DesignTemplate): DesignTemplateFile {
    const content = `'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-9 w-9"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
`;

    return {
      path: 'components/theme-toggle.tsx',
      content,
      description: 'Theme toggle button component',
    };
  }

  /**
   * Get installation instructions for a template
   */
  static getInstallationInstructions(templateId: string): string {
    const template = getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return `
# Installing ${template.name} Design Template

## 1. Dependencies

First, install the required dependencies:

\`\`\`bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install next-themes lucide-react
npm install -D tailwindcss postcss autoprefixer
\`\`\`

## 2. Apply Template Files

The following files will be created/updated in your project:
- tailwind.config.ts
- app/globals.css
- components/theme-provider.tsx
- components/theme-toggle.tsx
- components.json
- DESIGN_SYSTEM.md

## 3. Update app/layout.tsx

Wrap your app with the ThemeProvider:

\`\`\`tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
\`\`\`

## 4. Install shadcn/ui Components

Install any components you need:

\`\`\`bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
# ... etc
\`\`\`

## 5. Start Using

You're all set! Start building with your new design system.

Read DESIGN_SYSTEM.md for detailed documentation.
`;
  }
}

// Export convenience functions
export function generateTemplateFiles(templateId: string, projectName: string): DesignTemplateFile[] {
  return DesignTemplateApplicator.generateTemplateFiles(templateId, projectName);
}

export function getInstallationInstructions(templateId: string): string {
  return DesignTemplateApplicator.getInstallationInstructions(templateId);
}
