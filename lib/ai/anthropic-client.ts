import Anthropic from '@anthropic-ai/sdk'

let anthropicClient: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }

    anthropicClient = new Anthropic({
      apiKey
    })
  }

  return anthropicClient
}

export async function createChatCompletion(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: params.maxTokens || 4096,
    temperature: params.temperature || 0.7,
    system: params.system,
    messages: params.messages
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text
  }

  throw new Error('Unexpected response format from Anthropic API')
}
