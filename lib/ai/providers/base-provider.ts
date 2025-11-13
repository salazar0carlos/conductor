/**
 * Base AI Provider Interface
 * All provider implementations must extend this interface
 */

import type { AIModel, AIProvider } from '@/types'

export interface AIProviderMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIProviderParameters {
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
  stream?: boolean
  [key: string]: unknown
}

export interface AIProviderResponse {
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  finish_reason?: string
  metadata?: Record<string, unknown>
}

export interface AIImageGenerationRequest {
  prompt: string
  model: string
  size?: string
  quality?: string
  style?: string
  n?: number
}

export interface AIImageGenerationResponse {
  images: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
  metadata?: Record<string, unknown>
}

export interface AIAudioRequest {
  input: string
  model: string
  voice?: string
  response_format?: string
  speed?: number
}

export interface AIAudioResponse {
  audio: Buffer | string
  metadata?: Record<string, unknown>
}

export interface AITranscriptionRequest {
  file: Buffer | string
  model: string
  language?: string
  prompt?: string
  response_format?: string
  temperature?: number
}

export interface AITranscriptionResponse {
  text: string
  language?: string
  duration?: number
  segments?: Array<{
    id: number
    start: number
    end: number
    text: string
  }>
  metadata?: Record<string, unknown>
}

/**
 * Base abstract class for AI providers
 */
export abstract class BaseAIProvider {
  protected provider: AIProvider
  protected apiKey: string
  protected baseURL?: string

  constructor(provider: AIProvider, apiKey: string, baseURL?: string) {
    this.provider = provider
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  /**
   * Get provider information
   */
  getProvider(): AIProvider {
    return this.provider
  }

  /**
   * Test connection to the provider
   */
  abstract testConnection(): Promise<boolean>

  /**
   * Generate text completion
   */
  abstract generateText(
    messages: AIProviderMessage[],
    model: AIModel,
    parameters?: AIProviderParameters
  ): Promise<AIProviderResponse>

  /**
   * Generate image (if supported)
   */
  async generateImage?(
    request: AIImageGenerationRequest
  ): Promise<AIImageGenerationResponse>

  /**
   * Generate audio (if supported)
   */
  async generateAudio?(
    request: AIAudioRequest
  ): Promise<AIAudioResponse>

  /**
   * Transcribe audio (if supported)
   */
  async transcribeAudio?(
    request: AITranscriptionRequest
  ): Promise<AITranscriptionResponse>

  /**
   * Check if the provider supports a specific capability
   */
  supportsCapability(capability: string): boolean {
    return false
  }

  /**
   * Calculate estimated cost for a request
   */
  calculateCost(
    model: AIModel,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = model.pricing
    const perTokens = pricing.per_tokens || 1000000

    const inputCost = (inputTokens / perTokens) * (pricing.input_tokens || 0)
    const outputCost = (outputTokens / perTokens) * (pricing.output_tokens || 0)

    return inputCost + outputCost
  }
}

/**
 * Provider error class
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

/**
 * Rate limit error
 */
export class AIRateLimitError extends AIProviderError {
  constructor(
    provider: string,
    public retryAfter?: number
  ) {
    super('Rate limit exceeded', provider, 429)
    this.name = 'AIRateLimitError'
  }
}

/**
 * Authentication error
 */
export class AIAuthenticationError extends AIProviderError {
  constructor(provider: string) {
    super('Authentication failed', provider, 401)
    this.name = 'AIAuthenticationError'
  }
}

/**
 * Budget exceeded error
 */
export class AIBudgetExceededError extends AIProviderError {
  constructor(
    provider: string,
    public currentSpend: number,
    public budget: number
  ) {
    super('Budget exceeded', provider, 402)
    this.name = 'AIBudgetExceededError'
  }
}
