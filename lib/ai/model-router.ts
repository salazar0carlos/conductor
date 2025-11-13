/**
 * Smart AI Model Router
 * Handles automatic model selection, load balancing, fallbacks, and budget control
 */

import { createClient } from '@supabase/supabase-js'
import type {
  AIModel,
  AIProvider,
  AIProviderConfig,
  AIModelPreference,
  AIExecutionRequest,
  AIExecutionResponse,
  Database,
} from '@/types'
import {
  createProvider,
  type BaseAIProvider,
} from './providers/provider-factory'
import {
  AIProviderError,
  AIRateLimitError,
  AIBudgetExceededError,
  type AIProviderMessage,
} from './providers/base-provider'

// Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Router configuration
 */
interface RouterConfig {
  enableFallback: boolean
  maxRetries: number
  retryDelay: number
  enableBudgetCheck: boolean
  enableHealthCheck: boolean
  cacheTTL: number
}

const DEFAULT_CONFIG: RouterConfig = {
  enableFallback: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableBudgetCheck: true,
  enableHealthCheck: true,
  cacheTTL: 300000, // 5 minutes
}

/**
 * Smart Model Router Class
 */
export class AIModelRouter {
  private config: RouterConfig
  private responseCache: Map<string, { response: any; timestamp: number }>

  constructor(config?: Partial<RouterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.responseCache = new Map()
  }

  /**
   * Execute an AI request with smart routing
   */
  async execute(request: AIExecutionRequest): Promise<AIExecutionResponse> {
    const startTime = Date.now()

    try {
      // 1. Select model based on task type or explicit model_id
      const { model, provider, config } = await this.selectModel(request)

      // 2. Check budget if enabled
      if (this.config.enableBudgetCheck) {
        await this.checkBudget(request, model, provider, config)
      }

      // 3. Execute with fallback logic
      const result = await this.executeWithFallback(
        request,
        model,
        provider,
        config
      )

      const duration = Date.now() - startTime

      // 4. Log usage
      await this.logUsage(
        request,
        model,
        provider,
        result,
        duration,
        'success',
        false
      )

      // 5. Update budget
      await this.updateBudget(request, result.cost_usd, provider.id)

      return {
        ...result,
        request_id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        duration_ms: duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof AIProviderError) {
        // Log failed attempt
        await this.logUsage(
          request,
          null,
          null,
          null,
          duration,
          'error',
          false,
          error.message
        )
      }

      throw error
    }
  }

  /**
   * Select the best model for the task
   */
  private async selectModel(
    request: AIExecutionRequest
  ): Promise<{
    model: AIModel
    provider: AIProvider
    config: AIProviderConfig
  }> {
    // If model explicitly specified, use it
    if (request.model_id) {
      const model = await this.getModel(request.model_id)
      const provider = await this.getProvider(model.provider_id)
      const config = await this.getProviderConfig(
        provider.id,
        request.user_id,
        request.project_id
      )
      return { model, provider, config }
    }

    // Otherwise, use preferences for task type
    const preference = await this.getModelPreference(
      request.task_type,
      request.user_id,
      request.project_id
    )

    if (preference) {
      const model = await this.getModel(preference.primary_model_id)
      const provider = await this.getProvider(model.provider_id)
      const config = await this.getProviderConfig(
        provider.id,
        request.user_id,
        request.project_id
      )
      return { model, provider, config }
    }

    // Fallback to default model selection
    return this.selectDefaultModel(request)
  }

  /**
   * Execute with fallback logic
   */
  private async executeWithFallback(
    request: AIExecutionRequest,
    primaryModel: AIModel,
    primaryProvider: AIProvider,
    primaryConfig: AIProviderConfig
  ): Promise<Omit<AIExecutionResponse, 'request_id' | 'duration_ms'>> {
    const models = await this.getFallbackChain(
      request.task_type,
      primaryModel,
      request.user_id,
      request.project_id
    )

    let lastError: Error | null = null
    let retryCount = 0

    for (const { model, provider, config } of models) {
      try {
        // Check provider health
        if (this.config.enableHealthCheck) {
          const isHealthy = await this.checkProviderHealth(provider.id)
          if (!isHealthy) {
            console.log(`Provider ${provider.name} is unhealthy, skipping`)
            continue
          }
        }

        // Execute request
        const result = await this.executeRequest(
          request,
          model,
          provider,
          config,
          model.id !== primaryModel.id
        )

        return result
      } catch (error) {
        lastError = error as Error

        // Handle rate limits with retry
        if (error instanceof AIRateLimitError) {
          if (retryCount < this.config.maxRetries) {
            const delay = this.config.retryDelay * Math.pow(2, retryCount)
            await this.sleep(delay)
            retryCount++
            continue
          }
        }

        // Update provider health
        await this.updateProviderHealth(provider.id, false, error as Error)

        // Try next model if fallback enabled
        if (this.config.enableFallback) {
          console.log(
            `Failed with ${provider.name}/${model.name}, trying fallback`
          )
          continue
        }

        throw error
      }
    }

    throw lastError || new Error('All providers failed')
  }

  /**
   * Execute a single request
   */
  private async executeRequest(
    request: AIExecutionRequest,
    model: AIModel,
    provider: AIProvider,
    config: AIProviderConfig,
    isFallback: boolean
  ): Promise<Omit<AIExecutionResponse, 'request_id' | 'duration_ms'>> {
    // Create provider instance
    const providerInstance = createProvider(provider, config)

    // Prepare messages
    const messages: AIProviderMessage[] = request.messages || [
      { role: 'user', content: request.prompt },
    ]

    // Merge parameters
    const parameters = {
      ...config.default_parameters,
      ...request.parameters,
    }

    // Execute
    const response = await providerInstance.generateText(
      messages,
      model,
      parameters
    )

    // Calculate cost
    const cost = providerInstance.calculateCost(
      model,
      response.usage.prompt_tokens,
      response.usage.completion_tokens
    )

    // Update provider health
    await this.updateProviderHealth(provider.id, true)

    return {
      model_used: model,
      provider_used: provider,
      content: response.content,
      usage: response.usage,
      cost_usd: cost,
      was_cached: false,
      was_fallback: isFallback,
      metadata: response.metadata,
    }
  }

  /**
   * Get fallback chain for a task
   */
  private async getFallbackChain(
    taskType: string,
    primaryModel: AIModel,
    userId?: string,
    projectId?: string
  ): Promise<
    Array<{
      model: AIModel
      provider: AIProvider
      config: AIProviderConfig
    }>
  > {
    const chain = []

    // Add primary model
    const primaryProvider = await this.getProvider(primaryModel.provider_id)
    const primaryConfig = await this.getProviderConfig(
      primaryProvider.id,
      userId,
      projectId
    )
    chain.push({
      model: primaryModel,
      provider: primaryProvider,
      config: primaryConfig,
    })

    // Get fallback models from preferences
    const preference = await this.getModelPreference(
      taskType,
      userId,
      projectId
    )

    if (preference?.fallback_model_ids) {
      for (const modelId of preference.fallback_model_ids) {
        try {
          const model = await this.getModel(modelId)
          const provider = await this.getProvider(model.provider_id)
          const config = await this.getProviderConfig(
            provider.id,
            userId,
            projectId
          )
          chain.push({ model, provider, config })
        } catch (error) {
          console.error(`Failed to load fallback model ${modelId}:`, error)
        }
      }
    }

    return chain
  }

  /**
   * Check budget before execution
   */
  private async checkBudget(
    request: AIExecutionRequest,
    model: AIModel,
    provider: AIProvider,
    config: AIProviderConfig
  ): Promise<void> {
    // Estimate token usage (rough estimate)
    const estimatedInputTokens = this.estimateTokens(
      request.prompt || request.messages?.map((m) => m.content).join(' ') || ''
    )
    const estimatedOutputTokens = request.parameters?.max_tokens || 1000

    // Calculate estimated cost
    const estimatedCost =
      (estimatedInputTokens / (model.pricing.per_tokens || 1000000)) *
        (model.pricing.input_tokens || 0) +
      (estimatedOutputTokens / (model.pricing.per_tokens || 1000000)) *
        (model.pricing.output_tokens || 0)

    // Check daily budget
    const { data: dailyBudget } = await supabase
      .from('ai_usage_budgets')
      .select('*')
      .eq('user_id', request.user_id || null)
      .eq('project_id', request.project_id || null)
      .eq('provider_id', provider.id)
      .eq('period', 'daily')
      .eq('period_start', new Date().toISOString().split('T')[0])
      .eq('is_active', true)
      .single()

    if (dailyBudget) {
      const remaining = dailyBudget.budget_usd - dailyBudget.spent_usd
      if (remaining < estimatedCost) {
        throw new AIBudgetExceededError(
          provider.name,
          dailyBudget.spent_usd,
          dailyBudget.budget_usd
        )
      }
    }
  }

  /**
   * Update budget after execution
   */
  private async updateBudget(
    request: AIExecutionRequest,
    cost: number,
    providerId: string
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date()
    monthStart.setDate(1)

    // Update daily budget
    await supabase.rpc('update_ai_usage_budget', {
      p_user_id: request.user_id || null,
      p_project_id: request.project_id || null,
      p_provider_id: providerId,
      p_cost: cost,
    })
  }

  /**
   * Log usage
   */
  private async logUsage(
    request: AIExecutionRequest,
    model: AIModel | null,
    provider: AIProvider | null,
    result: any,
    duration: number,
    status: 'success' | 'error',
    wasFallback: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: request.user_id || null,
        project_id: request.project_id || null,
        provider_id: provider?.id || '',
        model_id: model?.id || '',
        task_type: request.task_type,
        prompt_tokens: result?.usage?.prompt_tokens || 0,
        completion_tokens: result?.usage?.completion_tokens || 0,
        total_tokens: result?.usage?.total_tokens || 0,
        cost_usd: result?.cost_usd || 0,
        duration_ms: duration,
        was_cached: false,
        was_fallback: wasFallback,
        status,
        error_message: errorMessage || null,
        metadata: request.metadata || {},
      })
    } catch (error) {
      console.error('Failed to log usage:', error)
    }
  }

  /**
   * Check provider health
   */
  private async checkProviderHealth(providerId: string): Promise<boolean> {
    const { data } = await supabase
      .from('ai_provider_health')
      .select('*')
      .eq('provider_id', providerId)
      .single()

    if (!data) return true

    // Consider unhealthy if error rate > 50% or not available
    return data.is_available && (data.error_rate || 0) < 50
  }

  /**
   * Update provider health
   */
  private async updateProviderHealth(
    providerId: string,
    success: boolean,
    error?: Error
  ): Promise<void> {
    const { data: health } = await supabase
      .from('ai_provider_health')
      .select('*')
      .eq('provider_id', providerId)
      .single()

    if (health) {
      const successCount = health.success_count + (success ? 1 : 0)
      const errorCount = health.error_count + (success ? 0 : 1)
      const totalCount = successCount + errorCount
      const errorRate = (errorCount / totalCount) * 100

      await supabase
        .from('ai_provider_health')
        .update({
          is_available: success || errorRate < 75,
          success_count: successCount,
          error_count: errorCount,
          error_rate: errorRate,
          last_check_at: new Date().toISOString(),
          last_error: error?.message || null,
          last_error_at: error ? new Date().toISOString() : health.last_error_at,
        })
        .eq('provider_id', providerId)
    } else {
      await supabase.from('ai_provider_health').insert({
        provider_id: providerId,
        is_available: success,
        success_count: success ? 1 : 0,
        error_count: success ? 0 : 1,
        error_rate: success ? 0 : 100,
        last_check_at: new Date().toISOString(),
        last_error: error?.message || null,
        last_error_at: error ? new Date().toISOString() : null,
      })
    }
  }

  /**
   * Helper: Get model by ID
   */
  private async getModel(modelId: string): Promise<AIModel> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (error || !data) {
      throw new Error(`Model not found: ${modelId}`)
    }

    return data
  }

  /**
   * Helper: Get provider by ID
   */
  private async getProvider(providerId: string): Promise<AIProvider> {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('id', providerId)
      .single()

    if (error || !data) {
      throw new Error(`Provider not found: ${providerId}`)
    }

    return data
  }

  /**
   * Helper: Get provider config
   */
  private async getProviderConfig(
    providerId: string,
    userId?: string,
    projectId?: string
  ): Promise<AIProviderConfig> {
    const { data, error } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('provider_id', providerId)
      .eq('user_id', userId || null)
      .eq('project_id', projectId || null)
      .eq('is_enabled', true)
      .single()

    if (error || !data) {
      throw new Error(`Provider config not found for provider: ${providerId}`)
    }

    return data
  }

  /**
   * Helper: Get model preference
   */
  private async getModelPreference(
    taskType: string,
    userId?: string,
    projectId?: string
  ): Promise<AIModelPreference | null> {
    const { data } = await supabase
      .from('ai_model_preferences')
      .select('*')
      .eq('task_type', taskType)
      .eq('user_id', userId || null)
      .eq('project_id', projectId || null)
      .eq('is_active', true)
      .single()

    return data || null
  }

  /**
   * Helper: Select default model
   */
  private async selectDefaultModel(
    request: AIExecutionRequest
  ): Promise<{
    model: AIModel
    provider: AIProvider
    config: AIProviderConfig
  }> {
    // Get all active text models
    const { data: models } = await supabase
      .from('ai_models')
      .select('*, ai_providers(*)')
      .eq('category', 'text')
      .eq('status', 'active')
      .order('performance_tier', { ascending: false })
      .limit(1)

    if (!models || models.length === 0) {
      throw new Error('No active models available')
    }

    const model = models[0] as any
    const provider = model.ai_providers as AIProvider
    const config = await this.getProviderConfig(
      provider.id,
      request.user_id,
      request.project_id
    )

    return { model, provider, config }
  }

  /**
   * Helper: Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Helper: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const modelRouter = new AIModelRouter()
