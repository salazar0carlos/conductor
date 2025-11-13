/**
 * AI Logo Generation Models Configuration
 * Supports multiple AI providers for logo generation
 */

export type AILogoModel =
  | 'dalle-3'
  | 'midjourney'
  | 'stable-diffusion-xl'
  | 'ideogram'
  | 'leonardo';

export interface ModelConfig {
  id: AILogoModel;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  pricing: {
    perImage: number;
    currency: string;
  };
  speed: 'fast' | 'medium' | 'slow';
  maxResolution: string;
  features: {
    batchGeneration: boolean;
    stylePresets: boolean;
    negativePrompts: boolean;
    aspectRatios: string[];
  };
  apiEndpoint?: string;
  requiresApiKey: boolean;
}

export const LOGO_MODELS: Record<AILogoModel, ModelConfig> = {
  'dalle-3': {
    id: 'dalle-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    description: 'Best for realistic, detailed logos with excellent prompt understanding',
    strengths: [
      'Superior prompt interpretation',
      'Consistent quality',
      'Great for detailed designs',
      'Professional results'
    ],
    pricing: {
      perImage: 0.04,
      currency: 'USD'
    },
    speed: 'medium',
    maxResolution: '1024x1024',
    features: {
      batchGeneration: false,
      stylePresets: true,
      negativePrompts: false,
      aspectRatios: ['1:1', '16:9', '9:16']
    },
    apiEndpoint: 'https://api.openai.com/v1/images/generations',
    requiresApiKey: true
  },
  'midjourney': {
    id: 'midjourney',
    name: 'Midjourney',
    provider: 'Midjourney',
    description: 'Best for artistic, creative designs with unique aesthetics',
    strengths: [
      'Highly artistic output',
      'Unique visual style',
      'Excellent composition',
      'Creative interpretations'
    ],
    pricing: {
      perImage: 0.06,
      currency: 'USD'
    },
    speed: 'slow',
    maxResolution: '1456x1456',
    features: {
      batchGeneration: true,
      stylePresets: true,
      negativePrompts: true,
      aspectRatios: ['1:1', '2:3', '3:2', '16:9', '9:16']
    },
    requiresApiKey: true
  },
  'stable-diffusion-xl': {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    description: 'Best for fine control and customization with open-source flexibility',
    strengths: [
      'Fine-grained control',
      'Cost-effective',
      'Highly customizable',
      'Fast generation'
    ],
    pricing: {
      perImage: 0.02,
      currency: 'USD'
    },
    speed: 'fast',
    maxResolution: '1024x1024',
    features: {
      batchGeneration: true,
      stylePresets: true,
      negativePrompts: true,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9']
    },
    apiEndpoint: 'https://api.replicate.com/v1/predictions',
    requiresApiKey: true
  },
  'ideogram': {
    id: 'ideogram',
    name: 'Ideogram',
    provider: 'Ideogram AI',
    description: 'Best for text in logos with superior typography handling',
    strengths: [
      'Excellent text rendering',
      'Typography mastery',
      'Clean, professional output',
      'Perfect for wordmarks'
    ],
    pricing: {
      perImage: 0.08,
      currency: 'USD'
    },
    speed: 'medium',
    maxResolution: '1024x1024',
    features: {
      batchGeneration: true,
      stylePresets: true,
      negativePrompts: false,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4']
    },
    requiresApiKey: true
  },
  'leonardo': {
    id: 'leonardo',
    name: 'Leonardo.ai',
    provider: 'Leonardo AI',
    description: 'Best for consistent brand styles with model training capabilities',
    strengths: [
      'Consistent style',
      'Brand continuity',
      'Custom model training',
      'High-quality output'
    ],
    pricing: {
      perImage: 0.05,
      currency: 'USD'
    },
    speed: 'medium',
    maxResolution: '1536x1536',
    features: {
      batchGeneration: true,
      stylePresets: true,
      negativePrompts: true,
      aspectRatios: ['1:1', '16:9', '9:16', '4:5', '5:4']
    },
    requiresApiKey: true
  }
};

export interface LogoGenerationRequest {
  model: AILogoModel;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  colorScheme?: string[];
  industry?: string;
  aspectRatio?: string;
  batchSize?: number;
  userApiKey?: string;
}

export interface LogoGenerationResponse {
  success: boolean;
  images: GeneratedLogo[];
  cost?: number;
  generationTime?: number;
  error?: string;
}

export interface GeneratedLogo {
  id: string;
  url: string;
  thumbnail?: string;
  prompt: string;
  model: AILogoModel;
  metadata: {
    resolution: string;
    aspectRatio: string;
    style?: string;
    colorPalette?: string[];
  };
  createdAt: string;
}

export const STYLE_PRESETS = [
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, simple, modern' },
  { id: 'modern', name: 'Modern', description: 'Contemporary and sleek' },
  { id: 'vintage', name: 'Vintage', description: 'Classic and timeless' },
  { id: 'tech', name: 'Tech', description: 'Futuristic and digital' },
  { id: 'organic', name: 'Organic', description: 'Natural and flowing' },
  { id: 'geometric', name: 'Geometric', description: 'Shapes and patterns' },
  { id: 'elegant', name: 'Elegant', description: 'Sophisticated and refined' },
  { id: 'playful', name: 'Playful', description: 'Fun and energetic' },
  { id: 'bold', name: 'Bold', description: 'Strong and impactful' },
  { id: 'abstract', name: 'Abstract', description: 'Artistic and conceptual' }
];

export const INDUSTRY_TEMPLATES = [
  { id: 'saas', name: 'SaaS', prompt: 'tech startup, cloud, modern, professional' },
  { id: 'retail', name: 'Retail', prompt: 'shopping, commerce, friendly, accessible' },
  { id: 'finance', name: 'Finance', prompt: 'trust, security, professional, established' },
  { id: 'creative', name: 'Creative', prompt: 'artistic, unique, innovative, expressive' },
  { id: 'healthcare', name: 'Healthcare', prompt: 'caring, medical, trustworthy, clean' },
  { id: 'food', name: 'Food & Beverage', prompt: 'appetizing, fresh, quality, delicious' },
  { id: 'education', name: 'Education', prompt: 'learning, growth, knowledge, inspiring' },
  { id: 'sports', name: 'Sports & Fitness', prompt: 'active, energetic, strong, dynamic' },
  { id: 'real-estate', name: 'Real Estate', prompt: 'home, property, trust, professional' },
  { id: 'entertainment', name: 'Entertainment', prompt: 'fun, exciting, engaging, memorable' }
];

export const COLOR_SCHEMES = [
  { id: 'monochrome', name: 'Monochrome', colors: ['#000000', '#FFFFFF'] },
  { id: 'blue-trust', name: 'Trust Blue', colors: ['#0066CC', '#00A3E0', '#FFFFFF'] },
  { id: 'tech-gradient', name: 'Tech Gradient', colors: ['#667EEA', '#764BA2', '#F093FB'] },
  { id: 'nature', name: 'Nature', colors: ['#2ECC71', '#27AE60', '#16A085'] },
  { id: 'energy', name: 'Energy', colors: ['#E74C3C', '#FF6B6B', '#FFA07A'] },
  { id: 'luxury', name: 'Luxury', colors: ['#2C3E50', '#E8BE4C', '#FFFFFF'] },
  { id: 'vibrant', name: 'Vibrant', colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'] },
  { id: 'professional', name: 'Professional', colors: ['#34495E', '#95A5A6', '#ECF0F1'] },
  { id: 'sunset', name: 'Sunset', colors: ['#FF6B35', '#F7931E', '#FDC830'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0575E6', '#00D4FF', '#FFFFFF'] }
];

export const PROMPT_SUGGESTIONS = {
  adjectives: [
    'modern', 'minimalist', 'elegant', 'bold', 'professional', 'creative',
    'abstract', 'geometric', 'organic', 'vintage', 'futuristic', 'clean',
    'sophisticated', 'playful', 'dynamic', 'sleek', 'timeless', 'innovative'
  ],
  elements: [
    'icon', 'symbol', 'wordmark', 'lettermark', 'emblem', 'badge',
    'monogram', 'mascot', 'abstract shape', 'geometric pattern'
  ],
  styles: [
    'flat design', 'gradient', 'line art', '3D', 'hand-drawn', 'illustrative',
    'typographic', 'negative space', 'mascot', 'abstract'
  ]
};
