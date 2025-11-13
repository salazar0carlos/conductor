/**
 * AI Provider Factory
 * Creates and manages provider instances
 */

import type { AIProvider, AIProviderConfig } from '@/types'
import { BaseAIProvider } from './base-provider'
import { AnthropicProvider } from './anthropic-provider'
import { OpenAIProvider } from './openai-provider'

/**
 * Provider registry maps provider names to their implementation classes
 */
const PROVIDER_REGISTRY: Record<
  string,
  new (provider: AIProvider, apiKey: string) => BaseAIProvider
> = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  'openai-dalle': OpenAIProvider,
  'openai-tts': OpenAIProvider,
  'openai-whisper': OpenAIProvider,
  // Add more providers as they are implemented
}

/**
 * Provider cache to reuse instances
 */
const providerCache = new Map<string, BaseAIProvider>()

/**
 * Create a provider instance
 */
export function createProvider(
  provider: AIProvider,
  config: AIProviderConfig
): BaseAIProvider {
  // Check cache first
  const cacheKey = `${provider.name}-${config.id}`
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey)!
  }

  // Get provider class
  const ProviderClass = PROVIDER_REGISTRY[provider.name]
  if (!ProviderClass) {
    throw new Error(`Provider ${provider.name} not implemented`)
  }

  // Decrypt API key (in production, implement proper decryption)
  const apiKey = config.api_key_encrypted || ''
  if (!apiKey) {
    throw new Error(`No API key configured for provider ${provider.name}`)
  }

  // Create instance
  const instance = new ProviderClass(provider, apiKey)

  // Cache instance
  providerCache.set(cacheKey, instance)

  return instance
}

/**
 * Clear provider cache (useful for testing or config updates)
 */
export function clearProviderCache(): void {
  providerCache.clear()
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(providerName: string): boolean {
  return providerName in PROVIDER_REGISTRY
}

/**
 * Get list of supported provider names
 */
export function getSupportedProviders(): string[] {
  return Object.keys(PROVIDER_REGISTRY)
}

/**
 * Register a new provider implementation
 * Useful for adding custom or self-hosted providers
 */
export function registerProvider(
  name: string,
  providerClass: new (provider: AIProvider, apiKey: string) => BaseAIProvider
): void {
  PROVIDER_REGISTRY[name] = providerClass
}
