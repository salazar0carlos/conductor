/**
 * Agent Worker - Autonomous agent that executes tasks using Claude API
 *
 * Each worker represents one specialist agent (Backend Architect, etc.)
 * working on a specific project.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';

interface AgentWorkerConfig {
  projectId: string;
  agentId: string;
  agentType: string;
  agentName: string;
  capabilities: string[];
  githubRepo?: string;
  githubToken?: string;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  required_capabilities: string[];
  metadata?: any;
  project_id: string;
}

export class AgentWorker {
  private config: AgentWorkerConfig;
  private anthropic: Anthropic;
  private supabase: any;
  private github?: Octokit;
  private isRunning: boolean = false;
  private currentTask?: Task;
  private workSessionId?: string;

  constructor(config: AgentWorkerConfig) {
    this.config = config;

    // Initialize Claude API
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    // Initialize Supabase
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    // Initialize GitHub if credentials provided
    if (config.githubToken) {
      this.github = new Octokit({ auth: config.githubToken });
    }
  }

  /**
   * Start the worker - begins polling for tasks
   */
  async start(): Promise<void> {
    console.log(`🤖 [${this.config.agentName}] Starting worker for project ${this.config.projectId}`);

    this.isRunning = true;

    // Update worker status to active
    await this.updateWorkerStatus('active');

    // Start polling loop
    await this.pollLoop();
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    console.log(`🛑 [${this.config.agentName}] Stopping worker`);

    this.isRunning = false;

    // Update worker status
    await this.updateWorkerStatus('stopped');

    // End current work session if any
    if (this.workSessionId) {
      await this.endWorkSession('interrupted');
    }
  }

  /**
   * Main polling loop - continuously checks for tasks
   */
  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Poll for a task
        const task = await this.pollForTask();

        if (task) {
          console.log(`📋 [${this.config.agentName}] Got task: ${task.title}`);

          // Start work session
          await this.startWorkSession(task.id);

          // Execute the task
          await this.executeTask(task);

          // End work session
          await this.endWorkSession('completed');
        } else {
          // No task available, wait before polling again
          await this.sleep(5000); // 5 seconds
        }
      } catch (error: any) {
        console.error(`❌ [${this.config.agentName}] Error in poll loop:`, error.message);

        // Mark work session as failed
        if (this.workSessionId) {
          await this.endWorkSession('failed', error.message);
        }

        // Wait before retrying
        await this.sleep(10000); // 10 seconds
      }
    }
  }

  /**
   * Poll for an available task
   */
  private async pollForTask(): Promise<Task | null> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tasks/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.config.agentId,
          project_id: this.config.projectId,
          capabilities: this.config.capabilities,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.task || null;
      }

      return null;
    } catch (error) {
      console.error(`Error polling for task:`, error);
      return null;
    }
  }

  /**
   * Execute a task using Claude API
   */
  private async executeTask(task: Task): Promise<void> {
    this.currentTask = task;

    try {
      // Update task status to in_progress
      await this.updateTaskStatus(task.id, 'in_progress');

      // Get context from GitHub (existing code)
      const codeContext = await this.getCodeContext();

      // Generate system prompt based on agent type
      const systemPrompt = this.getSystemPrompt();

      // Build user prompt with task context
      const userPrompt = this.buildUserPrompt(task, codeContext);

      console.log(`🧠 [${this.config.agentName}] Calling Claude API...`);

      // Call Claude API
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract response
      const response = message.content[0];
      let result = '';

      if (response.type === 'text') {
        result = response.text;
      }

      console.log(`✅ [${this.config.agentName}] Task completed`);

      // Commit code to GitHub if applicable
      if (this.github && this.config.githubRepo) {
        await this.commitToGitHub(task, result);
      }

      // Mark task as completed
      await this.completeTask(task.id, result);

      // Track token usage
      await this.trackApiUsage(message.usage.input_tokens + message.usage.output_tokens);
    } catch (error: any) {
      console.error(`❌ [${this.config.agentName}] Task failed:`, error.message);

      // Mark task as failed
      await this.failTask(task.id, error.message);

      throw error;
    } finally {
      this.currentTask = undefined;
    }
  }

  /**
   * Get system prompt based on agent type
   */
  private getSystemPrompt(): string {
    const prompts: Record<string, string> = {
      backend_architect: `You are a Backend Architect specialist. You design reliable backend systems with focus on data integrity, security, and fault tolerance. You write clean, maintainable server-side code and create robust APIs.`,

      frontend_architect: `You are a Frontend Architect specialist. You create accessible, performant user interfaces with focus on user experience and modern frameworks. You write clean React/Next.js code with TypeScript.`,

      system_architect: `You are a System Architect specialist. You design scalable system architecture with focus on maintainability and long-term technical decisions. You think holistically about the entire application stack.`,

      security_engineer: `You are a Security Engineer specialist. You identify security vulnerabilities and ensure compliance with security standards and best practices. You protect against OWASP Top 10 vulnerabilities.`,

      performance_engineer: `You are a Performance Engineer specialist. You optimize system performance through measurement-driven analysis and bottleneck elimination. You ensure fast load times and efficient resource usage.`,

      refactoring_expert: `You are a Refactoring Expert. You improve code quality and reduce technical debt through systematic refactoring and clean code principles. You make code more maintainable.`,

      requirements_analyst: `You are a Requirements Analyst. You transform ambiguous project ideas into concrete specifications through systematic requirements discovery. You write clear user stories and acceptance criteria.`,

      technical_writer: `You are a Technical Writer. You create clear, comprehensive technical documentation tailored to specific audiences with focus on usability. You write excellent READMEs and API docs.`,

      deep_research_agent: `You are a Deep Research Agent. You perform comprehensive research with adaptive strategies and intelligent exploration. You find the best solutions to technical problems.`,

      learning_guide: `You are a Learning Guide. You teach programming concepts and explain code with focus on understanding through progressive learning. You make complex topics simple.`,

      tech_stack_researcher: `You are a Tech Stack Researcher. You research and recommend technology choices for feature development. You stay current with best practices and evaluate tradeoffs.`,
    };

    return prompts[this.config.agentType] || prompts.backend_architect;
  }

  /**
   * Build user prompt with task and context
   */
  private buildUserPrompt(task: Task, codeContext: string): string {
    return `Project: ${this.config.projectId}
Task Type: ${task.type}
Task: ${task.title}

Description:
${task.description}

${codeContext ? `\nExisting Code Context:\n${codeContext}\n` : ''}

Please complete this task following best practices for ${this.config.agentType}.

${task.type === 'feature' ? 'Provide complete, working code that can be committed to the repository.' : ''}
${task.type === 'review' ? 'Provide a detailed code review with specific suggestions for improvement.' : ''}
${task.type === 'docs' ? 'Write clear, comprehensive documentation.' : ''}

Format your response as:
1. Summary of changes
2. Code/implementation (if applicable)
3. Files to create/modify
4. Next steps or recommendations`;
  }

  /**
   * Get code context from GitHub
   */
  private async getCodeContext(): Promise<string> {
    // TODO: Implement fetching relevant files from GitHub
    // For now, return empty context
    return '';
  }

  /**
   * Commit changes to GitHub
   */
  private async commitToGitHub(task: Task, result: string): Promise<void> {
    // TODO: Implement GitHub commit logic
    // Parse result to extract files to create/modify
    // Create commits with appropriate messages
    console.log(`📝 [${this.config.agentName}] Committing to GitHub...`);
  }

  /**
   * Update worker status in database
   */
  private async updateWorkerStatus(status: string): Promise<void> {
    await this.supabase
      .from('agents')
      .update({
        worker_status: status,
        worker_process_id: process.pid?.toString(),
        last_heartbeat_at: new Date().toISOString(),
      })
      .eq('id', this.config.agentId);
  }

  /**
   * Start a work session
   */
  private async startWorkSession(taskId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('agent_work_sessions')
      .insert({
        agent_id: this.config.agentId,
        project_id: this.config.projectId,
        task_id: taskId,
        status: 'active',
      })
      .select()
      .single();

    if (!error && data) {
      this.workSessionId = data.id;
    }
  }

  /**
   * End a work session
   */
  private async endWorkSession(status: string, errorMessage?: string): Promise<void> {
    if (!this.workSessionId) return;

    const now = new Date();
    const { data: session } = await this.supabase
      .from('agent_work_sessions')
      .select('started_at')
      .eq('id', this.workSessionId)
      .single();

    let durationSeconds = 0;
    if (session) {
      const startTime = new Date(session.started_at);
      durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    }

    await this.supabase
      .from('agent_work_sessions')
      .update({
        status,
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
        error_message: errorMessage,
      })
      .eq('id', this.workSessionId);

    this.workSessionId = undefined;
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await this.supabase
      .from('tasks')
      .update({ status, started_at: new Date().toISOString() })
      .eq('id', taskId);
  }

  /**
   * Complete a task
   */
  private async completeTask(taskId: string, result: string): Promise<void> {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_data: { result, agent_id: this.config.agentId },
      }),
    });
  }

  /**
   * Fail a task
   */
  private async failTask(taskId: string, errorMessage: string): Promise<void> {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tasks/${taskId}/fail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error_message: errorMessage }),
    });
  }

  /**
   * Track API usage for billing
   */
  private async trackApiUsage(tokens: number): Promise<void> {
    // Rough cost estimate: $3 per 1M tokens for Claude Sonnet
    const costPerToken = 3 / 1000000;
    const cost = tokens * costPerToken;

    const today = new Date().toISOString().split('T')[0];

    // Upsert today's usage
    await this.supabase.rpc('increment_project_resources', {
      p_project_id: this.config.projectId,
      p_date: today,
      p_tokens: tokens,
      p_cost: cost,
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export for CLI usage
export default AgentWorker;
