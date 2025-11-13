/**
 * AI Execution API
 * POST - Execute AI request with smart routing
 */

import { NextResponse } from 'next/server'
import { modelRouter } from '@/lib/ai/model-router'
import type { AIExecutionRequest } from '@/types'
import { z } from 'zod'

/**
 * Request validation schema
 */
const ExecutionRequestSchema = z.object({
  task_type: z.string().min(1),
  prompt: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
  model_id: z.string().optional(),
  parameters: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().min(1).optional(),
      top_p: z.number().min(0).max(1).optional(),
      frequency_penalty: z.number().min(-2).max(2).optional(),
      presence_penalty: z.number().min(-2).max(2).optional(),
      stop: z.array(z.string()).optional(),
    })
    .optional(),
  user_id: z.string().optional(),
  project_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/ai/execute
 * Execute an AI request with smart routing, fallback, and cost control
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // Validate request
    const validationResult = ExecutionRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const executionRequest = validationResult.data

    // Ensure either prompt or messages is provided
    if (!executionRequest.prompt && !executionRequest.messages) {
      return NextResponse.json(
        { error: 'Either prompt or messages must be provided' },
        { status: 400 }
      )
    }

    // Execute with model router
    const result = await modelRouter.execute(executionRequest)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result,
      execution_time_ms: duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('AI execution failed:', error)

    // Handle specific error types
    if (error.name === 'AIRateLimitError') {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: error.message,
          retry_after: error.retryAfter,
          provider: error.provider,
        },
        { status: 429 }
      )
    }

    if (error.name === 'AIAuthenticationError') {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid API key for provider',
          provider: error.provider,
        },
        { status: 401 }
      )
    }

    if (error.name === 'AIBudgetExceededError') {
      return NextResponse.json(
        {
          error: 'Budget exceeded',
          message: error.message,
          current_spend: error.currentSpend,
          budget: error.budget,
          provider: error.provider,
        },
        { status: 402 }
      )
    }

    if (error.name === 'AIProviderError') {
      return NextResponse.json(
        {
          error: 'Provider error',
          message: error.message,
          provider: error.provider,
          status_code: error.statusCode,
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Execution failed',
        message: error.message || 'Unknown error occurred',
        execution_time_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/execute
 * Get execution info and available task types
 */
export async function GET() {
  return NextResponse.json({
    info: 'AI Execution Endpoint',
    description: 'Execute AI requests with smart routing and cost control',
    method: 'POST',
    available_task_types: [
      'code_generation',
      'logo_design',
      'blog_writing',
      'data_analysis',
      'image_editing',
      'voice_synthesis',
      'transcription',
      'chat',
      'analysis',
      'translation',
      'summarization',
      'question_answering',
    ],
    example_request: {
      task_type: 'code_generation',
      prompt: 'Write a function to calculate fibonacci numbers',
      parameters: {
        temperature: 0.7,
        max_tokens: 1000,
      },
      user_id: 'optional-user-id',
      project_id: 'optional-project-id',
    },
  })
}
