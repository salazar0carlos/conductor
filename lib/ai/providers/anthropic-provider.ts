/**
 * Anthropic AI Provider Implementation
 * Supports Claude models (Sonnet, Opus, Haiku)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AIModel, AIProvider } from '@/types'
import {
  BaseAIProvider,
  AIProviderError,
  AIRateLimitError,
  AIAuthenticationError,
  type AIProviderMessage,
  type AIProviderParameters,
  type AIProviderResponse,
} from './base-provider'

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic

  constructor(provider: AIProvider, apiKey: string) {
    super(provider, apiKey)
    this.client = new Anthropic({ apiKey })
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      })
      return response.content.length > 0
    } catch (error) {
      return false
    }
  }

  async generateText(
    messages: AIProviderMessage[],
    model: AIModel,
    parameters?: AIProviderParameters
  ): Promise<AIProviderResponse> {
    try {
      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system')
      const conversationMessages = messages.filter((m) => m.role !== 'system')

      // Convert messages to Anthropic format
      const anthropicMessages = conversationMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      const response = await this.client.messages.create({
        model: model.model_id,
        max_tokens: parameters?.max_tokens || model.max_output_tokens || 4096,
        temperature: parameters?.temperature ?? 0.7,
        top_p: parameters?.top_p,
        system: systemMessage?.content,
        messages: anthropicMessages,
        stream: false,
      })

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new AIProviderError(
          'No text content in response',
          this.provider.name
        )
      }

      return {
        content: textContent.text,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finish_reason: response.stop_reason || undefined,
        metadata: {
          id: response.id,
          role: response.role,
        },
      }
    } catch (error: any) {
      // Handle specific Anthropic errors
      if (error?.status === 429) {
        const retryAfter = error?.headers?.['retry-after']
        throw new AIRateLimitError(
          this.provider.name,
          retryAfter ? parseInt(retryAfter) : undefined
        )
      }

      if (error?.status === 401 || error?.status === 403) {
        throw new AIAuthenticationError(this.provider.name)
      }

      throw new AIProviderError(
        error.message || 'Failed to generate text',
        this.provider.name,
        error?.status,
        error
      )
    }
  }

  supportsCapability(capability: string): boolean {
    const capabilities = [
      'text_generation',
      'chat',
      'analysis',
      'code_generation',
      'vision',
      'function_calling',
      'json_mode',
      'streaming',
    ]
    return capabilities.includes(capability)
  }
}
