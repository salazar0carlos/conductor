/**
 * Feedback Loop Closure
 *
 * Converts approved improvement suggestions from the intelligence analysis
 * into actionable tasks that agents can execute.
 */

import { createClient } from '@/lib/supabase/server';

interface SuggestionToTaskRequest {
  analysis_id: string;
  suggestion_index: number; // Index in the suggestions array
}

interface SuggestionToTaskResult {
  task_id: string;
  title: string;
  assigned: boolean;
  assigned_agent_id?: string;
}

/**
 * Converts an approved suggestion into a task
 */
export async function convertSuggestionToTask(
  request: SuggestionToTaskRequest
): Promise<SuggestionToTaskResult> {
  const supabase = await createClient();

  // Get the analysis
  const { data: analysis, error: analysisError } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', request.analysis_id)
    .single();

  if (analysisError || !analysis) {
    throw new Error(`Analysis not found: ${analysisError?.message}`);
  }

  // Check if analysis is approved
  if (analysis.status !== 'approved') {
    throw new Error('Only approved analyses can be converted to tasks');
  }

  // Get the specific suggestion
  const suggestions = analysis.suggestions as any[];
  const suggestion = suggestions[request.suggestion_index];

  if (!suggestion) {
    throw new Error(`Suggestion at index ${request.suggestion_index} not found`);
  }

  // Map suggestion category to task type
  const categoryToType: Record<string, string> = {
    code_quality: 'refactor',
    performance: 'feature',
    security: 'bugfix',
    ux: 'feature',
    process: 'docs',
  };

  const taskType = categoryToType[suggestion.category] || 'feature';

  // Map category to required capabilities
  const categoryToCapabilities: Record<string, string[]> = {
    code_quality: ['code_review', 'refactoring'],
    performance: ['performance', 'optimization'],
    security: ['security', 'code_review'],
    ux: ['frontend', 'design'],
    process: ['documentation', 'process_improvement'],
  };

  const requiredCapabilities = categoryToCapabilities[suggestion.category] || ['general'];

  // Create the task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      project_id: analysis.project_id,
      title: suggestion.title,
      description: suggestion.description,
      type: taskType,
      status: 'pending',
      priority: suggestion.priority_score || analysis.priority_score || 5,
      required_capabilities: requiredCapabilities,
      metadata: {
        source: 'intelligence_analysis',
        analysis_id: analysis.id,
        suggestion_index: request.suggestion_index,
        category: suggestion.category,
        impact: suggestion.impact,
        effort: suggestion.effort,
      },
    })
    .select()
    .single();

  if (taskError || !task) {
    throw new Error(`Failed to create task: ${taskError?.message}`);
  }

  // Try to auto-assign the task to the analyzer agent if appropriate
  let assigned = false;
  let assignedAgentId: string | undefined;

  if (analysis.analyzer_agent_id) {
    // Check if the analyzer agent has the required capabilities
    const { data: agent } = await supabase
      .from('agents')
      .select('*, agent_capacity(*)')
      .eq('id', analysis.analyzer_agent_id)
      .single();

    if (agent) {
      const hasCapabilities = requiredCapabilities.every((cap) =>
        agent.capabilities.includes(cap)
      );

      const hasCapacity =
        agent.agent_capacity?.[0]?.is_available &&
        agent.agent_capacity[0].current_task_count < agent.agent_capacity[0].max_concurrent_tasks;

      if (hasCapabilities && hasCapacity) {
        await supabase
          .from('tasks')
          .update({
            assigned_agent_id: agent.id,
            status: 'assigned',
            started_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        assigned = true;
        assignedAgentId = agent.id;
      }
    }
  }

  // Mark the suggestion as converted in the analysis metadata
  const metadata = analysis.metadata || {};
  const convertedSuggestions = metadata.converted_suggestions || [];
  convertedSuggestions.push({
    suggestion_index: request.suggestion_index,
    task_id: task.id,
    converted_at: new Date().toISOString(),
  });

  await supabase
    .from('analysis_history')
    .update({
      metadata: {
        ...metadata,
        converted_suggestions: convertedSuggestions,
      },
    })
    .eq('id', analysis.id);

  return {
    task_id: task.id,
    title: task.title,
    assigned,
    assigned_agent_id: assignedAgentId,
  };
}

/**
 * Automatically converts all approved suggestions from an analysis into tasks
 */
export async function convertAllApprovedSuggestions(
  analysisId: string
): Promise<SuggestionToTaskResult[]> {
  const supabase = await createClient();

  const { data: analysis } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (!analysis || analysis.status !== 'approved') {
    throw new Error('Analysis not found or not approved');
  }

  const suggestions = analysis.suggestions as any[];
  const convertedTasks: SuggestionToTaskResult[] = [];

  for (let i = 0; i < suggestions.length; i++) {
    try {
      const result = await convertSuggestionToTask({
        analysis_id: analysisId,
        suggestion_index: i,
      });
      convertedTasks.push(result);
    } catch (error) {
      console.error(`Failed to convert suggestion ${i}:`, error);
    }
  }

  return convertedTasks;
}

/**
 * Processes all pending approved analyses and converts their suggestions to tasks
 * This should be run periodically (e.g., via background job)
 */
export async function processPendingApprovedSuggestions(): Promise<{
  analyses_processed: number;
  tasks_created: number;
}> {
  const supabase = await createClient();

  // Get all approved analyses that haven't been fully converted
  const { data: analyses } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(10); // Process in batches

  if (!analyses || analyses.length === 0) {
    return { analyses_processed: 0, tasks_created: 0 };
  }

  let analysesProcessed = 0;
  let tasksCreated = 0;

  for (const analysis of analyses) {
    // Check if already converted
    const convertedSuggestions = analysis.metadata?.converted_suggestions || [];
    const suggestions = analysis.suggestions as any[];

    if (convertedSuggestions.length >= suggestions.length) {
      // Already fully converted, skip
      continue;
    }

    try {
      const results = await convertAllApprovedSuggestions(analysis.id);
      analysesProcessed++;
      tasksCreated += results.length;
    } catch (error) {
      console.error(`Failed to process analysis ${analysis.id}:`, error);
    }
  }

  return { analyses_processed: analysesProcessed, tasks_created: tasksCreated };
}
