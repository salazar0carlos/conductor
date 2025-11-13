import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

type IntegrationType = 'vercel' | 'supabase' | 'anthropic' | 'openai' | 'github' | 'slack' | 'discord' | 'linear' | 'notion' | 'stripe'

interface TestConnectionRequest {
  type: IntegrationType
  credentials: {
    api_key?: string
    project_url?: string
    webhook_url?: string
    team_id?: string
    webhook_secret?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TestConnectionRequest = await request.json()
    const { type, credentials } = body

    if (!type || !credentials) {
      return apiError('Missing type or credentials', 400)
    }

    let isValid = false
    let errorMessage = ''
    let userInfo: any = null

    switch (type) {
      case 'vercel':
        try {
          const response = await fetch('https://api.vercel.com/v2/user', {
            headers: {
              Authorization: `Bearer ${credentials.api_key}`
            }
          })

          if (response.ok) {
            userInfo = await response.json()
            isValid = true
          } else {
            errorMessage = 'Invalid Vercel token'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Vercel'
        }
        break

      case 'supabase':
        try {
          if (!credentials.project_url || !credentials.api_key) {
            return apiError('Missing project_url or api_key', 400)
          }

          // Test connection by fetching service metadata
          const response = await fetch(`${credentials.project_url}/rest/v1/`, {
            headers: {
              apikey: credentials.api_key,
              Authorization: `Bearer ${credentials.api_key}`
            }
          })

          if (response.ok || response.status === 404) { // 404 is ok, means auth worked
            isValid = true
            userInfo = { project_url: credentials.project_url }
          } else {
            errorMessage = 'Invalid Supabase credentials'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Supabase'
        }
        break

      case 'anthropic':
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': credentials.api_key || '',
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }]
            })
          })

          if (response.ok || response.status === 400) { // 400 is ok for this test
            isValid = true
          } else if (response.status === 401) {
            errorMessage = 'Invalid Anthropic API key'
          } else {
            errorMessage = 'Failed to verify Anthropic API key'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Anthropic'
        }
        break

      case 'openai':
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              Authorization: `Bearer ${credentials.api_key}`
            }
          })

          if (response.ok) {
            isValid = true
          } else if (response.status === 401) {
            errorMessage = 'Invalid OpenAI API key'
          } else {
            errorMessage = 'Failed to verify OpenAI API key'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to OpenAI'
        }
        break

      case 'github':
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${credentials.api_key}`,
              Accept: 'application/vnd.github.v3+json'
            }
          })

          if (response.ok) {
            userInfo = await response.json()
            isValid = true
          } else if (response.status === 401) {
            errorMessage = 'Invalid GitHub token'
          } else {
            errorMessage = 'Failed to verify GitHub token'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to GitHub'
        }
        break

      case 'slack':
        try {
          if (!credentials.webhook_url) {
            return apiError('Missing webhook_url', 400)
          }

          const response = await fetch(credentials.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: 'Conductor integration test - please ignore'
            })
          })

          if (response.ok) {
            isValid = true
          } else {
            errorMessage = 'Invalid Slack webhook URL'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Slack'
        }
        break

      case 'discord':
        try {
          if (!credentials.webhook_url) {
            return apiError('Missing webhook_url', 400)
          }

          const response = await fetch(credentials.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: 'Conductor integration test - please ignore'
            })
          })

          if (response.ok || response.status === 204) {
            isValid = true
          } else {
            errorMessage = 'Invalid Discord webhook URL'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Discord'
        }
        break

      case 'linear':
        try {
          const response = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: {
              Authorization: credentials.api_key || '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: '{ viewer { id name email } }'
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.data?.viewer) {
              userInfo = data.data.viewer
              isValid = true
            } else {
              errorMessage = 'Invalid Linear API key'
            }
          } else {
            errorMessage = 'Failed to verify Linear API key'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Linear'
        }
        break

      case 'notion':
        try {
          const response = await fetch('https://api.notion.com/v1/users/me', {
            headers: {
              Authorization: `Bearer ${credentials.api_key}`,
              'Notion-Version': '2022-06-28'
            }
          })

          if (response.ok) {
            userInfo = await response.json()
            isValid = true
          } else if (response.status === 401) {
            errorMessage = 'Invalid Notion integration token'
          } else {
            errorMessage = 'Failed to verify Notion integration'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Notion'
        }
        break

      case 'stripe':
        try {
          const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
            headers: {
              Authorization: `Bearer ${credentials.api_key}`
            }
          })

          if (response.ok) {
            isValid = true
          } else if (response.status === 401) {
            errorMessage = 'Invalid Stripe API key'
          } else {
            errorMessage = 'Failed to verify Stripe API key'
          }
        } catch (error) {
          errorMessage = 'Failed to connect to Stripe'
        }
        break

      default:
        return apiError('Unsupported integration type', 400)
    }

    if (isValid) {
      return apiSuccess({
        valid: true,
        message: 'Connection successful',
        userInfo
      })
    } else {
      return apiError(errorMessage || 'Connection test failed', 400)
    }
  } catch (error) {
    return handleApiError(error)
  }
}
