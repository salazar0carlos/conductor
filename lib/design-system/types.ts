/**
 * Design System Types
 */

export type ColorMode = 'light' | 'dark';

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'bold' | 'glassmorphic' | 'landing' | 'enterprise';
  preview: {
    light: string; // Preview image URL
    dark: string;
  };
  theme: DesignTheme;
  components: ComponentConfig;
  tailwindConfig: TailwindConfig;
  metadata: {
    version: string;
    author: string;
    tags: string[];
    popularityScore?: number;
  };
}

export interface DesignTheme {
  light: ColorPalette;
  dark: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: Animations;
}

export interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Additional semantic colors
  success?: string;
  warning?: string;
  info?: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
    heading?: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface Spacing {
  unit: number; // Base spacing unit (usually 4px)
  scale: number[]; // Spacing scale multipliers
}

export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface Animations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface ComponentConfig {
  button: ComponentVariants;
  card: ComponentVariants;
  input: ComponentVariants;
  badge: ComponentVariants;
  dialog: ComponentVariants;
  // Add more components as needed
}

export interface ComponentVariants {
  defaultVariant: string;
  variants: Record<string, any>;
  sizes?: Record<string, any>;
}

export interface TailwindConfig {
  content: string[];
  theme: {
    extend: Record<string, any>;
  };
  plugins: string[];
}

export interface DesignTemplateFile {
  path: string;
  content: string;
  description: string;
}

export interface TemplateApplication {
  templateId: string;
  projectId: string;
  files: DesignTemplateFile[];
  appliedAt: Date;
}
