import { createChatCompletion } from './anthropic-client'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisHistory } from '@/types'

export async function reviewAndPrioritizeSuggestions(projectId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get pending analyses for this project
    const { data: analyses } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!analyses || analyses.length === 0) {
      return
    }

    // Get project context
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    const systemPrompt = `You are a Supervisor Agent responsible for reviewing and prioritizing improvement suggestions.
Your role is to:
1. Review suggestions from various analysis agents
2. Filter out duplicates and low-value suggestions
3. Identify the most impactful improvements
4. Assign final priorities based on business value, technical impact, and effort
5. Approve high-priority suggestions for implementation

Criteria for approval:
- High impact on product quality, performance, or user experience
- Reasonable implementation effort
- Aligns with project goals
- Not a duplicate of existing suggestions
- Clear, actionable, and specific

Consider:
- ROI (return on investment)
- Risk mitigation
- Strategic alignment
- Resource availability`

    const userPrompt = `Review these improvement suggestions and provide prioritization:

Project: ${project?.name || 'Unknown'}
Project Description: ${project?.description || 'N/A'}

Suggestions to Review:
${analyses.map((a, i) => `
Analysis ${i + 1} (${a.analysis_type}):
Priority Score: ${a.priority_score}
Findings: ${JSON.stringify(a.findings, null, 2)}
Suggestions: ${JSON.stringify(a.suggestions, null, 2)}
`).join('\n\n')}

For each analysis, decide:
1. Should it be approved, rejected, or require more review?
2. Are there duplicate suggestions across analyses?
3. What's the final priority score (0-10)?
4. Any additional insights?

Respond in this JSON format:
{
  "reviews": [
    {
      "analysis_id": "uuid",
      "decision": "approved|rejected|needs_review",
      "final_priority_score": 8,
      "reasoning": "Why this decision was made",
      "duplicate_of": "analysis_id if duplicate, else null",
      "recommendations": "Any additional recommendations"
    }
  ],
  "summary": {
    "approved_count": 5,
    "rejected_count": 2,
    "top_priorities": ["List of top 3 improvements to focus on"]
  }
}

Only respond with valid JSON, no additional text.`

    const response = await createChatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      maxTokens: 4096,
      temperature: 0.2
    })

    const review = JSON.parse(response)

    // Update analyses based on supervisor decisions
    for (const analysisReview of review.reviews) {
      const analysis = analyses.find(a => a.id === analysisReview.analysis_id)
      if (!analysis) continue

      let newStatus: 'reviewed' | 'approved' | 'rejected' = 'reviewed'
      if (analysisReview.decision === 'approved') newStatus = 'approved'
      else if (analysisReview.decision === 'rejected') newStatus = 'rejected'

      await supabase
        .from('analysis_history')
        .update({
          status: newStatus,
          priority_score: analysisReview.final_priority_score,
          metadata: {
            ...analysis.metadata,
            supervisor_review: {
              reviewed_at: new Date().toISOString(),
              reasoning: analysisReview.reasoning,
              duplicate_of: analysisReview.duplicate_of,
              recommendations: analysisReview.recommendations
            }
          }
        })
        .eq('id', analysis.id)
    }

    console.log('Supervisor review completed:', review.summary)
  } catch (error) {
    console.error('Error in Supervisor Agent:', error)
  }
}
