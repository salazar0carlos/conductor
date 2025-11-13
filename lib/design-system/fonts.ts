/**
 * Font Library for Design System
 * Curated collection of Google Fonts and system fonts
 */

export interface FontOption {
  name: string
  value: string
  category: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting'
  weights: number[]
  googleFont?: boolean
}

export const FONT_LIBRARY: FontOption[] = [
  // System Fonts
  {
    name: 'System UI',
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    googleFont: false,
  },
  {
    name: 'Arial',
    value: 'Arial, sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    googleFont: false,
  },
  {
    name: 'Georgia',
    value: 'Georgia, serif',
    category: 'serif',
    weights: [400, 700],
    googleFont: false,
  },
  {
    name: 'Courier New',
    value: '"Courier New", monospace',
    category: 'monospace',
    weights: [400, 700],
    googleFont: false,
  },

  // Popular Google Fonts - Sans Serif
  {
    name: 'Inter',
    value: 'Inter, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Roboto',
    value: 'Roboto, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 700, 900],
    googleFont: true,
  },
  {
    name: 'Open Sans',
    value: '"Open Sans", sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 600, 700, 800],
    googleFont: true,
  },
  {
    name: 'Montserrat',
    value: 'Montserrat, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Poppins',
    value: 'Poppins, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Lato',
    value: 'Lato, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 700, 900],
    googleFont: true,
  },
  {
    name: 'Nunito',
    value: 'Nunito, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Work Sans',
    value: '"Work Sans", sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },

  // Popular Google Fonts - Serif
  {
    name: 'Playfair Display',
    value: '"Playfair Display", serif',
    category: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Merriweather',
    value: 'Merriweather, serif',
    category: 'serif',
    weights: [300, 400, 700, 900],
    googleFont: true,
  },
  {
    name: 'Lora',
    value: 'Lora, serif',
    category: 'serif',
    weights: [400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'PT Serif',
    value: '"PT Serif", serif',
    category: 'serif',
    weights: [400, 700],
    googleFont: true,
  },

  // Popular Google Fonts - Display
  {
    name: 'Bebas Neue',
    value: '"Bebas Neue", display',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Oswald',
    value: 'Oswald, display',
    category: 'display',
    weights: [300, 400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Raleway',
    value: 'Raleway, sans-serif',
    category: 'display',
    weights: [300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },

  // Popular Google Fonts - Monospace
  {
    name: 'Fira Code',
    value: '"Fira Code", monospace',
    category: 'monospace',
    weights: [400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'JetBrains Mono',
    value: '"JetBrains Mono", monospace',
    category: 'monospace',
    weights: [400, 500, 600, 700, 800],
    googleFont: true,
  },
  {
    name: 'Source Code Pro',
    value: '"Source Code Pro", monospace',
    category: 'monospace',
    weights: [400, 600, 700, 900],
    googleFont: true,
  },
]

export function getFontsByCategory(category: FontOption['category']) {
  return FONT_LIBRARY.filter(font => font.category === category)
}

export function getFontByValue(value: string) {
  return FONT_LIBRARY.find(font => font.value === value)
}

export function generateGoogleFontsUrl(fonts: string[]): string {
  const googleFonts = fonts
    .map(value => getFontByValue(value))
    .filter(font => font?.googleFont)
    .map(font => {
      const name = font!.name.replace(/\s+/g, '+')
      const weights = font!.weights.join(';')
      return `${name}:wght@${weights}`
    })

  if (googleFonts.length === 0) return ''

  return `https://fonts.googleapis.com/css2?${googleFonts.join('&')}&display=swap`
}
