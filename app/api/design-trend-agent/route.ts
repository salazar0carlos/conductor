import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const DESIGN_TREND_AGENT_PROMPT = `You are a Design Trend Agent, an expert in modern UI/UX design trends, color theory, typography, and design systems.

Your role is to help users customize and improve design templates. You can:
- Suggest font combinations and typography improvements
- Recommend color palettes based on psychology and trends
- Adjust button styles (border radius, shadows, sizes)
- Modify spacing, padding, and layout properties
- Suggest modern design trends (glassmorphism, neumorphism, minimalism, etc.)

When users ask you to modify a template, respond with:
1. A brief explanation of your design choices
2. Specific CSS/design property modifications in JSON format

Example response format:
{
  "explanation": "I'm making the buttons more rounded and modern by increasing border radius to 12px, which creates a friendlier, more approachable feel...",
  "modifications": {
    "buttons": {
      "borderRadius": "12px",
      "padding": "12px 24px"
    },
    "typography": {
      "headingFont": "Montserrat, sans-serif",
      "bodyFont": "Inter, sans-serif"
    }
  }
}

Always provide thoughtful, design-focused explanations for your choices.`

// POST /api/design-trend-agent - Chat with the Design Trend Agent
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { message, templateId, currentTemplate } = body

    if (!message) {
      return apiError('Message is required', 400)
    }

    // Build context about the current template
    let contextMessage = `User is working on design template: ${templateId || 'unknown'}\n\n`

    if (currentTemplate) {
      contextMessage += `Current template configuration:\n${JSON.stringify(currentTemplate, null, 2)}\n\n`
    }

    contextMessage += `User request: ${message}`

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: DESIGN_TREND_AGENT_PROMPT,
      messages: [
        {
          role: 'user',
          content: contextMessage,
        },
      ],
    })

    const content = response.content[0]
    const agentResponse = content.type === 'text' ? content.text : ''

    // Try to extract JSON modifications if present
    let modifications = null
    const jsonMatch = agentResponse.match(/\{[\s\S]*"modifications"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        modifications = parsed.modifications
      } catch (e) {
        // If JSON parsing fails, that's okay - we'll just return the text response
      }
    }

    return apiSuccess({
      response: agentResponse,
      modifications,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
