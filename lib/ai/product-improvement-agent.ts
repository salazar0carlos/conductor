import { createChatCompletion } from './anthropic-client'
import { createClient } from '@/lib/supabase/server'
import type { Task, AnalysisHistory } from '@/types'

export async function analyzeTaskCompletion(task: Task): Promise<AnalysisHistory | null> {
  try {
    const supabase = await createClient()

    // Get project context
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', task.project_id)
      .single()

    // Get task logs for context
    const { data: logs } = await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })

    const systemPrompt = `You are a Product Improvement Agent analyzing completed software development tasks.
Your role is to:
1. Analyze task outputs and execution patterns
2. Identify potential improvements in code, process, or product
3. Detect patterns across tasks
4. Generate concrete, actionable improvement suggestions
5. Assign priority scores (0-10) based on impact and effort

Focus on:
- Code quality and architecture improvements
- Process efficiency gains
- User experience enhancements
- Technical debt reduction
- Performance optimizations
- Security considerations

Provide specific, actionable recommendations with clear benefits.`

    const userPrompt = `Analyze this completed task and provide improvement suggestions:

Task Details:
- Title: ${task.title}
- Type: ${task.type}
- Description: ${task.description || 'N/A'}
- Priority: ${task.priority}

Project Context:
- Project: ${project?.name || 'Unknown'}
- Description: ${project?.description || 'N/A'}

Task Output:
${JSON.stringify(task.output_data, null, 2)}

Execution Logs:
${logs?.map(log => `[${log.level}] ${log.message}`).join('\n') || 'No logs available'}

Provide analysis in this JSON format:
{
  "findings": {
    "summary": "Brief overview of what was accomplished",
    "strengths": ["List of positive aspects"],
    "concerns": ["List of potential issues or risks"],
    "patterns": ["Any recurring patterns noticed"]
  },
  "suggestions": [
    {
      "title": "Clear, actionable suggestion title",
      "description": "Detailed explanation of the improvement",
      "category": "code_quality|performance|security|ux|process",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "priority_score": 8
    }
  ],
  "priority_score": 7
}

Only respond with valid JSON, no additional text.`

    const response = await createChatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      maxTokens: 4096,
      temperature: 0.3
    })

    // Parse the AI response
    const analysis = JSON.parse(response)

    // Create analysis record
    const { data: analysisRecord, error } = await supabase
      .from('analysis_history')
      .insert({
        analyzer_agent_id: null, // System agent
        task_id: task.id,
        project_id: task.project_id,
        analysis_type: 'task_completion',
        findings: analysis.findings,
        suggestions: analysis.suggestions || [],
        priority_score: analysis.priority_score || 5,
        status: 'pending',
        metadata: {
          model: 'claude-sonnet-4',
          analyzed_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return analysisRecord
  } catch (error) {
    console.error('Error in Product Improvement Agent:', error)
    return null
  }
}

export async function detectPatterns(projectId: string): Promise<AnalysisHistory | null> {
  try {
    const supabase = await createClient()

    // Get recent completed tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20)

    if (!tasks || tasks.length < 3) {
      return null // Need at least 3 tasks to detect patterns
    }

    const systemPrompt = `You are a Pattern Detection Agent analyzing software development tasks.
Your role is to identify recurring patterns, trends, and systemic issues across multiple tasks.

Look for:
- Recurring error types or failure modes
- Common bottlenecks or blockers
- Repeated code quality issues
- Process inefficiencies
- Resource allocation patterns
- Team dynamics insights

Provide pattern analysis with recommendations for systemic improvements.`

    const userPrompt = `Analyze these completed tasks and identify patterns:

${tasks.map((t, i) => `
Task ${i + 1}:
- Title: ${t.title}
- Type: ${t.type}
- Priority: ${t.priority}
- Duration: ${t.started_at && t.completed_at
  ? Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 1000 / 60) + ' minutes'
  : 'Unknown'}
- Status: ${t.status}
${t.error_message ? `- Error: ${t.error_message}` : ''}
`).join('\n')}

Provide analysis in this JSON format:
{
  "findings": {
    "patterns_detected": ["List of identified patterns"],
    "trends": ["Observable trends across tasks"],
    "root_causes": ["Potential root causes of recurring issues"],
    "insights": ["Key insights about the project/team"]
  },
  "suggestions": [
    {
      "title": "Systemic improvement suggestion",
      "description": "Detailed recommendation",
      "category": "process|architecture|tooling|team",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "priority_score": 8
    }
  ],
  "priority_score": 7
}

Only respond with valid JSON, no additional text.`

    const response = await createChatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      maxTokens: 4096,
      temperature: 0.4
    })

    const analysis = JSON.parse(response)

    const { data: analysisRecord, error } = await supabase
      .from('analysis_history')
      .insert({
        analyzer_agent_id: null,
        task_id: null,
        project_id: projectId,
        analysis_type: 'pattern_detection',
        findings: analysis.findings,
        suggestions: analysis.suggestions || [],
        priority_score: analysis.priority_score || 5,
        status: 'pending',
        metadata: {
          model: 'claude-sonnet-4',
          analyzed_tasks_count: tasks.length,
          analyzed_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return analysisRecord
  } catch (error) {
    console.error('Error in Pattern Detection:', error)
    return null
  }
}
