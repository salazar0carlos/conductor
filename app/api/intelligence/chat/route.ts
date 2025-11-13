import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return apiError('Message is required')
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return apiError('Anthropic API key not configured')
    }

    const supabase = await createClient()

    // Gather context from the database
    const [tasksResult, agentsResult, analysisResult] = await Promise.all([
      supabase.from('tasks').select('*').limit(100),
      supabase.from('agents').select('*'),
      supabase.from('analysis_history').select('*').limit(50)
    ])

    // Build context for the AI
    const context = {
      tasks: tasksResult.data || [],
      agents: agentsResult.data || [],
      analyses: analysisResult.data || []
    }

    // Calculate some basic stats
    const totalTasks = context.tasks.length
    const completedTasks = context.tasks.filter(t => t.status === 'completed').length
    const failedTasks = context.tasks.filter(t => t.status === 'failed').length
    const activeAgents = context.agents.filter(a => a.status === 'active' || a.status === 'busy').length

    const avgCompletionTime = context.tasks
      .filter(t => t.started_at && t.completed_at)
      .reduce((acc, t) => {
        const duration = new Date(t.completed_at!).getTime() - new Date(t.started_at!).getTime()
        return acc + duration
      }, 0) / (completedTasks || 1)

    const contextSummary = `
System Context:
- Total Tasks: ${totalTasks}
- Completed Tasks: ${completedTasks} (${totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0}%)
- Failed Tasks: ${failedTasks}
- Active Agents: ${activeAgents} / ${context.agents.length}
- Average Task Completion Time: ${(avgCompletionTime / (1000 * 60)).toFixed(1)} minutes
- Recent Analyses: ${context.analyses.length}

Task Breakdown by Type:
${Object.entries(context.tasks.reduce((acc, t) => {
  acc[t.type] = (acc[t.type] || 0) + 1
  return acc
}, {} as Record<string, number>)).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Agent Status:
${context.agents.map(a => `- ${a.name} (${a.type}): ${a.status}`).join('\n')}

Recent Analysis Types:
${Object.entries(context.analyses.reduce((acc, a) => {
  acc[a.analysis_type] = (acc[a.analysis_type] || 0) + 1
  return acc
}, {} as Record<string, number>)).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
`

    // Call Anthropic API
    const anthropicResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an AI assistant helping to analyze a task orchestration system called Conductor.

${contextSummary}

User Question: ${message}

Please provide a helpful, data-driven response based on the context above. Be specific with numbers and insights. If you don't have enough data to answer accurately, say so.`
        }
      ]
    })

    const responseText = anthropicResponse.content
      .filter(block => block.type === 'text')
      .map(block => 'text' in block ? block.text : '')
      .join('\n')

    return apiSuccess({
      response: responseText,
      context: {
        totalTasks,
        completedTasks,
        failedTasks,
        activeAgents
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return handleApiError(error)
  }
}
