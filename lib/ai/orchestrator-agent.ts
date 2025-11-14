/**
 * Orchestrator Agent (with Layer 7 Deployment Safeguards)
 *
 * The "Project Manager" of the system - decomposes high-level tasks into
 * detailed workflows, assigns tasks to specialist agents, monitors progress,
 * and ensures quality gates are met.
 *
 * DEPLOYMENT SAFEGUARDS (Layer 7):
 * - Validates all code changes before task completion
 * - Blocks deployment if validation fails
 * - Ensures AI-generated code meets quality standards
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { NEXTJS_FULLSTACK_TEMPLATE } from '../workflows/templates/nextjs-fullstack';
import { execSync } from 'child_process';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface TaskDecompositionRequest {
  task_id: string;
  project_id: string;
  task_description: string;
  app_type: 'nextjs' | 'react' | 'node' | 'python' | 'fullstack' | 'api' | 'mobile';
  user_requirements?: string;
}

interface DecompositionResult {
  workflow_instance_id: string;
  subtasks: Array<{
    id: string;
    title: string;
    description: string;
    phase: string;
    assigned_agent_type?: string;
  }>;
  quality_gates: Array<{
    gate_id: string;
    phase: string;
    status: string;
  }>;
}

interface AgentAssignmentRequest {
  task_id: string;
  task_type: string;
  required_capabilities: string[];
  preferred_agent_types?: string[];
  requires_redundancy: boolean;
}

interface AgentAssignmentResult {
  selected_agent_id: string;
  confidence_score: number;
  reasoning: string;
  estimated_duration_hours: number;
  backup_agent_ids?: string[]; // For redundancy
}

/**
 * DEPLOYMENT SAFEGUARDS (Layer 7)
 * ================================
 */

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

/**
 * Runs comprehensive build validation before allowing task completion
 * This prevents AI agents from completing tasks with broken code
 */
export async function validateCodeChanges(): Promise<ValidationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Running deployment safeguard validation...');

  try {
    // Step 1: Validate Supabase patterns
    try {
      execSync('npm run validate', { stdio: 'pipe', encoding: 'utf-8' });
    } catch (error: any) {
      errors.push('Supabase pattern validation failed');
    }

    // Step 2: TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf-8' });
    } catch (error: any) {
      errors.push('TypeScript compilation failed');
    }

    // Step 3: ESLint validation
    try {
      execSync('npm run lint', { stdio: 'pipe', encoding: 'utf-8' });
    } catch (error: any) {
      errors.push('ESLint validation failed');
    }

    // Step 4: Run comprehensive build verification
    try {
      execSync('tsx scripts/verify-build.ts', { stdio: 'pipe', encoding: 'utf-8' });
    } catch (error: any) {
      errors.push('Build verification failed');
    }

    const duration = Date.now() - startTime;

    if (errors.length > 0) {
      console.log('❌ Validation failed:', errors.join(', '));
      return {
        passed: false,
        errors,
        warnings,
        duration,
      };
    }

    console.log('✅ Validation passed');
    return {
      passed: true,
      errors: [],
      warnings,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      passed: false,
      errors: ['Validation process crashed: ' + String(error)],
      warnings,
      duration,
    };
  }
}

/**
 * Validates that a task can be completed safely
 * Blocks completion if code quality standards are not met
 */
export async function validateTaskCompletion(taskId: string): Promise<{
  canComplete: boolean;
  reason?: string;
  validationResults?: ValidationResult;
}> {
  const supabase = await createClient();

  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) {
    return {
      canComplete: false,
      reason: 'Task not found',
    };
  }

  // For code generation tasks, run validation
  if (
    task.type === 'code_generation' ||
    task.type === 'implementation' ||
    task.type === 'refactoring' ||
    task.type === 'api_implementation'
  ) {
    console.log(`🔍 Validating code changes for task: ${task.title}`);

    const validationResults = await validateCodeChanges();

    if (!validationResults.passed) {
      // Record validation failure
      await supabase.from('task_validations').insert({
        task_id: taskId,
        validation_type: 'deployment_safeguard',
        passed: false,
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        duration_ms: validationResults.duration,
      });

      return {
        canComplete: false,
        reason: `Code validation failed: ${validationResults.errors.join(', ')}`,
        validationResults,
      };
    }

    // Record validation success
    await supabase.from('task_validations').insert({
      task_id: taskId,
      validation_type: 'deployment_safeguard',
      passed: true,
      errors: [],
      warnings: validationResults.warnings,
      duration_ms: validationResults.duration,
    });
  }

  return {
    canComplete: true,
    validationResults: undefined,
  };
}

/**
 * Enforces quality gates with automated code validation
 */
export async function enforceQualityGate(
  workflowInstanceId: string,
  gateName: string
): Promise<{ passed: boolean; errors: string[] }> {
  const errors: string[] = [];

  // For deployment gates, run full validation
  if (
    gateName.includes('deploy') ||
    gateName.includes('production') ||
    gateName.includes('release')
  ) {
    console.log(`🔍 Enforcing deployment quality gate: ${gateName}`);

    const validationResults = await validateCodeChanges();

    if (!validationResults.passed) {
      errors.push(...validationResults.errors);
      return { passed: false, errors };
    }

    // Additional check: Ensure full build succeeds
    try {
      execSync('npm run build', { stdio: 'pipe', encoding: 'utf-8' });
    } catch (error) {
      errors.push('Full build failed');
      return { passed: false, errors };
    }
  }

  return { passed: true, errors: [] };
}

/**
 * Decomposes a high-level task into a complete workflow with subtasks
 */
export async function decomposeTaskIntoWorkflow(
  request: TaskDecompositionRequest
): Promise<DecompositionResult> {
  const supabase = await createClient();

  // Get the appropriate workflow template
  const template = NEXTJS_FULLSTACK_TEMPLATE;
  // TODO: Add more templates for other app types

  // Create workflow instance
  const { data: workflowInstance, error: workflowError } = await supabase
    .from('workflow_instances')
    .insert({
      workflow_template_id: template.id,
      project_id: request.project_id,
      parent_task_id: request.task_id,
      status: 'not_started',
      current_phase: template.phases[0].phase,
      phases_completed: [],
      metadata: {
        app_name: request.task_description,
        app_type: request.app_type,
        user_requirements: request.user_requirements,
      },
    })
    .select()
    .single();

  if (workflowError || !workflowInstance) {
    throw new Error(`Failed to create workflow instance: ${workflowError?.message}`);
  }

  // Use Claude to refine the workflow based on user requirements
  const refinedWorkflow = await refineWorkflowWithAI(
    template,
    request.task_description,
    request.user_requirements
  );

  // Create subtasks from template
  const subtasks: any[] = [];

  for (const phase of refinedWorkflow.phases) {
    for (const taskTemplate of phase.task_templates) {
      const { data: subtask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: request.project_id,
          parent_task_id: request.task_id,
          workflow_instance_id: workflowInstance.id,
          task_depth: 1,
          title: taskTemplate.title,
          description: taskTemplate.description,
          type: taskTemplate.type,
          status: 'pending',
          priority: 5,
          required_capabilities: taskTemplate.required_capabilities,
          metadata: {
            phase: phase.phase,
            preferred_agent_types: taskTemplate.preferred_agent_types,
            requires_redundancy: taskTemplate.requires_redundancy,
            redundancy_agent_types: taskTemplate.redundancy_agent_types,
            estimated_hours: taskTemplate.estimated_hours,
            acceptance_criteria: taskTemplate.acceptance_criteria,
            quality_checks: taskTemplate.quality_checks,
          },
        })
        .select()
        .single();

      if (!taskError && subtask) {
        subtasks.push({
          id: subtask.id,
          title: subtask.title,
          description: subtask.description,
          phase: phase.phase,
          assigned_agent_type: taskTemplate.preferred_agent_types[0],
        });
      }
    }
  }

  // Create quality gates
  const qualityGates: any[] = [];

  for (const gate of template.quality_gates) {
    const { data: qualityGate, error: gateError } = await supabase
      .from('quality_gates')
      .insert({
        workflow_instance_id: workflowInstance.id,
        gate_id: gate.id,
        gate_name: gate.name,
        phase: gate.phase,
        status: 'pending',
        required: gate.required,
        criteria: gate.criteria,
      })
      .select()
      .single();

    if (!gateError && qualityGate) {
      qualityGates.push({
        gate_id: qualityGate.gate_id,
        phase: qualityGate.phase,
        status: qualityGate.status,
      });
    }
  }

  // Update parent task to mark as workflow root
  await supabase
    .from('tasks')
    .update({
      is_workflow_root: true,
      workflow_instance_id: workflowInstance.id,
      status: 'in_progress',
    })
    .eq('id', request.task_id);

  return {
    workflow_instance_id: workflowInstance.id,
    subtasks,
    quality_gates: qualityGates,
  };
}

/**
 * Uses Claude AI to refine the workflow based on user requirements
 */
async function refineWorkflowWithAI(
  template: any,
  taskDescription: string,
  userRequirements?: string
): Promise<any> {
  const systemPrompt = `You are an expert Engineering Project Manager responsible for planning software development workflows.

Given a standard workflow template and user requirements, you should:
1. Adjust task descriptions to be specific to the user's needs
2. Identify any missing tasks that should be added
3. Adjust estimated durations based on complexity
4. Maintain all quality gates and redundancy requirements

Return a refined workflow that maintains the structure but is tailored to the specific project.`;

  const userPrompt = `Task: ${taskDescription}
${userRequirements ? `\nUser Requirements:\n${userRequirements}` : ''}

Standard Template: ${template.name}
Phases: ${template.phases.map((p: any) => p.name).join(', ')}

Please review this workflow and suggest any refinements needed for this specific project. Focus on:
1. Task titles and descriptions that are specific to this project
2. Any additional tasks that might be needed
3. Adjusted time estimates based on project complexity

Return your response as JSON with the same structure as the template.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      // Try to extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const refinedWorkflow = JSON.parse(jsonMatch[0]);
        return refinedWorkflow;
      }
    }
  } catch (error) {
    console.error('AI refinement failed, using template as-is:', error);
  }

  // If AI refinement fails, return template as-is
  return template;
}

/**
 * Intelligently assigns a task to the best available agent
 */
export async function assignTaskToAgent(
  request: AgentAssignmentRequest
): Promise<AgentAssignmentResult> {
  const supabase = await createClient();

  // Get all agents with required capabilities and available capacity
  const { data: agents } = await supabase
    .from('agents')
    .select('*, agent_capacity(*), agent_performance_metrics(*)')
    .overlaps('capabilities', request.required_capabilities)
    .eq('status', 'active');

  if (!agents || agents.length === 0) {
    throw new Error('No available agents with required capabilities');
  }

  // Filter by capacity
  const availableAgents = agents.filter(
    (agent: any) =>
      agent.agent_capacity?.[0]?.is_available &&
      agent.agent_capacity[0].current_task_count < agent.agent_capacity[0].max_concurrent_tasks
  );

  if (availableAgents.length === 0) {
    throw new Error('All capable agents are at capacity');
  }

  // Use Claude AI to make intelligent assignment decision
  const assignment = await makeAssignmentDecisionWithAI(
    request,
    availableAgents
  );

  // Record the assignment
  await supabase.from('supervisor_assignments').insert({
    task_id: request.task_id,
    supervisor_agent_id: null, // System supervisor
    assigned_agent_id: assignment.selected_agent_id,
    confidence_score: assignment.confidence_score,
    reasoning: assignment.reasoning,
    estimated_duration_hours: assignment.estimated_duration_hours,
  });

  return assignment;
}

/**
 * Uses Claude AI to make intelligent agent assignment decisions
 */
async function makeAssignmentDecisionWithAI(
  request: AgentAssignmentRequest,
  availableAgents: any[]
): Promise<AgentAssignmentResult> {
  const systemPrompt = `You are a Task Assignment Supervisor responsible for optimally assigning tasks to specialist agents.

Consider:
1. Agent type and specialization
2. Current workload (prefer less busy agents)
3. Historical performance on similar tasks
4. Task complexity and agent experience

Make data-driven decisions to optimize for quality and efficiency.`;

  const agentSummaries = availableAgents.map((agent: any) => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    capabilities: agent.capabilities,
    current_tasks: agent.agent_capacity?.[0]?.current_task_count || 0,
    max_tasks: agent.agent_capacity?.[0]?.max_concurrent_tasks || 3,
    avg_quality_score: agent.agent_performance_metrics?.[0]?.avg_quality_score || 5,
    success_rate: agent.agent_performance_metrics?.[0]?.success_rate || 0.8,
    specialties: agent.agent_performance_metrics?.[0]?.specialties || [],
  }));

  const userPrompt = `Task Assignment Request:
- Task Type: ${request.task_type}
- Required Capabilities: ${request.required_capabilities.join(', ')}
${request.preferred_agent_types ? `- Preferred Agent Types: ${request.preferred_agent_types.join(', ')}` : ''}
- Requires Redundancy: ${request.requires_redundancy ? 'Yes' : 'No'}

Available Agents:
${JSON.stringify(agentSummaries, null, 2)}

Please select the best agent for this task and provide:
1. selected_agent_id: The agent ID
2. confidence_score: 0-1 confidence in this assignment
3. reasoning: Brief explanation of your choice
4. estimated_duration_hours: Estimated time to complete${request.requires_redundancy ? '\n5. backup_agent_ids: Array of 1-2 backup agent IDs for redundancy reviews' : ''}

Respond with only JSON in this exact format:
{
  "selected_agent_id": "uuid",
  "confidence_score": 0.95,
  "reasoning": "...",
  "estimated_duration_hours": 8${request.requires_redundancy ? ',\n  "backup_agent_ids": ["uuid1", "uuid2"]' : ''}
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return decision;
      }
    }
  } catch (error) {
    console.error('AI assignment failed, using fallback:', error);
  }

  // Fallback: Simple assignment logic
  const sortedAgents = availableAgents.sort((a: any, b: any) => {
    const aScore =
      (a.agent_performance_metrics?.[0]?.avg_quality_score || 5) -
      (a.agent_capacity?.[0]?.current_task_count || 0) * 0.5;
    const bScore =
      (b.agent_performance_metrics?.[0]?.avg_quality_score || 5) -
      (b.agent_capacity?.[0]?.current_task_count || 0) * 0.5;
    return bScore - aScore;
  });

  const selectedAgent = sortedAgents[0];
  const backupAgents = request.requires_redundancy ? sortedAgents.slice(1, 3) : [];

  return {
    selected_agent_id: selectedAgent.id,
    confidence_score: 0.7,
    reasoning: 'Fallback assignment based on quality score and current workload',
    estimated_duration_hours: 8,
    backup_agent_ids: backupAgents.map((a: any) => a.id),
  };
}

/**
 * Checks if a phase's quality gates have passed
 */
export async function checkPhaseQualityGates(
  workflowInstanceId: string,
  phase: string
): Promise<{ passed: boolean; failedGates: string[] }> {
  const supabase = await createClient();

  const { data: gates } = await supabase
    .from('quality_gates')
    .select('*')
    .eq('workflow_instance_id', workflowInstanceId)
    .eq('phase', phase)
    .eq('required', true);

  if (!gates) {
    return { passed: true, failedGates: [] };
  }

  const failedGates = gates.filter((gate) => gate.status !== 'passed').map((gate) => gate.gate_name);

  return {
    passed: failedGates.length === 0,
    failedGates,
  };
}

/**
 * Checks if redundancy requirements are satisfied for a task
 */
export async function checkRedundancyRequirements(taskId: string): Promise<{
  satisfied: boolean;
  requiredApprovals: number;
  currentApprovals: number;
}> {
  const supabase = await createClient();

  const { data: task } = await supabase
    .from('tasks')
    .select('metadata')
    .eq('id', taskId)
    .single();

  if (!task) {
    throw new Error('Task not found');
  }

  const requiresRedundancy = task.metadata?.requires_redundancy || false;

  if (!requiresRedundancy) {
    return { satisfied: true, requiredApprovals: 0, currentApprovals: 0 };
  }

  const redundancyAgentTypes = task.metadata?.redundancy_agent_types || [];
  const requiredApprovals = redundancyAgentTypes.length;

  const { data: approvals } = await supabase
    .from('agent_approvals')
    .select('*')
    .eq('task_id', taskId)
    .eq('approval_type', 'approve');

  const currentApprovals = approvals?.length || 0;

  return {
    satisfied: currentApprovals >= requiredApprovals,
    requiredApprovals,
    currentApprovals,
  };
}

/**
 * Generates a deployment readiness checklist
 */
export async function generateDeploymentChecklist(
  workflowInstanceId: string
): Promise<any> {
  const supabase = await createClient();

  // Get workflow instance
  const { data: workflow } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('id', workflowInstanceId)
    .single();

  if (!workflow) {
    throw new Error('Workflow instance not found');
  }

  // Check if all phases completed
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('workflow_instance_id', workflowInstanceId);

  const allPhasesCompleted = tasks?.every((task: any) => task.status === 'completed') || false;

  // Check if all quality gates passed
  const { data: gates } = await supabase
    .from('quality_gates')
    .select('*')
    .eq('workflow_instance_id', workflowInstanceId)
    .eq('required', true);

  const allQualityGatesPassed =
    gates?.every((gate) => gate.status === 'passed') || false;

  // Check redundancy requirements for all tasks
  const redundancyChecks = await Promise.all(
    (tasks || [])
      .filter((task: any) => task.metadata?.requires_redundancy)
      .map((task: any) => checkRedundancyRequirements(task.id))
  );

  const allRedundanciesSatisfied = redundancyChecks.every((check) => check.satisfied);

  // Identify blockers
  const blockers: any[] = [];

  if (!allPhasesCompleted) {
    const incompleteTasks = tasks?.filter((task: any) => task.status !== 'completed') || [];
    blockers.push({
      severity: 'critical',
      description: `${incompleteTasks.length} tasks not completed`,
    });
  }

  if (!allQualityGatesPassed) {
    const failedGates = gates?.filter((gate) => gate.status === 'failed') || [];
    blockers.push({
      severity: 'critical',
      description: `${failedGates.length} quality gates failed`,
    });
  }

  if (!allRedundanciesSatisfied) {
    blockers.push({
      severity: 'high',
      description: 'Some tasks missing required redundancy approvals',
    });
  }

  const deploymentReady =
    allPhasesCompleted && allQualityGatesPassed && allRedundanciesSatisfied;

  // Create or update checklist
  const { data: checklist } = await supabase
    .from('deployment_checklists')
    .upsert({
      workflow_instance_id: workflowInstanceId,
      all_phases_completed: allPhasesCompleted,
      all_quality_gates_passed: allQualityGatesPassed,
      all_redundancies_satisfied: allRedundanciesSatisfied,
      deployment_ready: deploymentReady,
      blockers,
    })
    .select()
    .single();

  return checklist;
}
