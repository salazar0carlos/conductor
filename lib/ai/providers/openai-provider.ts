/**
 * OpenAI Provider Implementation
 * Supports GPT models, DALL-E, Whisper, TTS
 */

import type { AIModel, AIProvider } from '@/types'
import {
  BaseAIProvider,
  AIProviderError,
  AIRateLimitError,
  AIAuthenticationError,
  type AIProviderMessage,
  type AIProviderParameters,
  type AIProviderResponse,
  type AIImageGenerationRequest,
  type AIImageGenerationResponse,
  type AIAudioRequest,
  type AIAudioResponse,
  type AITranscriptionRequest,
  type AITranscriptionResponse,
} from './base-provider'

// OpenAI types (will be properly typed when SDK is installed)
interface OpenAIClient {
  chat: {
    completions: {
      create: (params: any) => Promise<any>
    }
  }
  images: {
    generate: (params: any) => Promise<any>
  }
  audio: {
    speech: {
      create: (params: any) => Promise<any>
    }
    transcriptions: {
      create: (params: any) => Promise<any>
    }
  }
}

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAIClient | null = null

  constructor(provider: AIProvider, apiKey: string) {
    super(provider, apiKey, 'https://api.openai.com/v1')
  }

  private async getClient(): Promise<OpenAIClient> {
    if (this.client) {
      return this.client
    }

    try {
      // Dynamic import to avoid bundling if not used
      const { default: OpenAI } = await import('openai')
      this.client = new OpenAI({ apiKey: this.apiKey }) as unknown as OpenAIClient
      return this.client
    } catch (error) {
      throw new AIProviderError(
        'OpenAI SDK not installed. Run: npm install openai',
        this.provider.name
      )
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient()
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      })
      return response.choices.length > 0
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
      const client = await this.getClient()

      const response = await client.chat.completions.create({
        model: model.model_id,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: parameters?.max_tokens || model.max_output_tokens || 4096,
        temperature: parameters?.temperature ?? 0.7,
        top_p: parameters?.top_p,
        frequency_penalty: parameters?.frequency_penalty,
        presence_penalty: parameters?.presence_penalty,
        stop: parameters?.stop,
        stream: false,
        ...(model.supports_json_mode && parameters?.response_format === 'json' && {
          response_format: { type: 'json_object' },
        }),
      })

      const choice = response.choices[0]
      if (!choice || !choice.message) {
        throw new AIProviderError(
          'No message in response',
          this.provider.name
        )
      }

      return {
        content: choice.message.content || '',
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finish_reason: choice.finish_reason,
        metadata: {
          id: response.id,
          created: response.created,
        },
      }
    } catch (error: any) {
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

  async generateImage(
    request: AIImageGenerationRequest
  ): Promise<AIImageGenerationResponse> {
    try {
      const client = await this.getClient()

      const response = await client.images.generate({
        model: request.model,
        prompt: request.prompt,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style,
        n: request.n || 1,
      })

      return {
        images: response.data.map((img: any) => ({
          url: img.url,
          b64_json: img.b64_json,
          revised_prompt: img.revised_prompt,
        })),
        metadata: {
          created: response.created,
        },
      }
    } catch (error: any) {
      throw new AIProviderError(
        error.message || 'Failed to generate image',
        this.provider.name,
        error?.status,
        error
      )
    }
  }

  async generateAudio(request: AIAudioRequest): Promise<AIAudioResponse> {
    try {
      const client = await this.getClient()

      const response = await client.audio.speech.create({
        model: request.model,
        input: request.input,
        voice: request.voice || 'alloy',
        response_format: request.response_format || 'mp3',
        speed: request.speed || 1.0,
      })

      const buffer = Buffer.from(await response.arrayBuffer())

      return {
        audio: buffer,
        metadata: {},
      }
    } catch (error: any) {
      throw new AIProviderError(
        error.message || 'Failed to generate audio',
        this.provider.name,
        error?.status,
        error
      )
    }
  }

  async transcribeAudio(
    request: AITranscriptionRequest
  ): Promise<AITranscriptionResponse> {
    try {
      const client = await this.getClient()

      // Create a File object from buffer if needed
      const file = typeof request.file === 'string'
        ? request.file
        : new File([request.file as any], 'audio.mp3', { type: 'audio/mpeg' })

      const response = await client.audio.transcriptions.create({
        model: request.model,
        file: file,
        language: request.language,
        prompt: request.prompt,
        response_format: request.response_format || 'json',
        temperature: request.temperature,
      })

      return {
        text: typeof response === 'string' ? response : response.text,
        language: typeof response === 'object' ? response.language : undefined,
        duration: typeof response === 'object' ? response.duration : undefined,
        segments: typeof response === 'object' ? response.segments : undefined,
        metadata: {},
      }
    } catch (error: any) {
      throw new AIProviderError(
        error.message || 'Failed to transcribe audio',
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
      'image_generation',
      'text_to_speech',
      'speech_to_text',
    ]
    return capabilities.includes(capability)
  }
}
