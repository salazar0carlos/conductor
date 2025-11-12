/**
 * Anthropic API Client - Direct API integration
 *
 * Uses Anthropic's SDK directly (without Claude Code tools)
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  IAgentIntegration,
  TaskExecutionContext,
  TaskExecutionResult,
  IntegrationConfig,
} from '../types';

export class AnthropicAPIClient implements IAgentIntegration {
  private anthropic: Anthropic;
  private config: IntegrationConfig;
  private isInitialized: boolean = false;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Verify API key works
    try {
      // Make a minimal test call
      await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });

      this.isInitialized = true;
      console.log('✅ Anthropic API client initialized');
    } catch (error: any) {
      console.error('Failed to initialize Anthropic API client:', error.message);
      throw new Error(`Anthropic API initialization failed: ${error.message}`);
    }
  }

  async executeTask(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const systemPrompt = this.getSystemPrompt(context.agentType);
      const userPrompt = this.buildUserPrompt(context);

      console.log(`🧠 [${context.agentName}] Calling Anthropic API...`);

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const response = message.content[0];
      let result = '';

      if (response.type === 'text') {
        result = response.text;
      }

      const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

      console.log(`✅ [${context.agentName}] Task completed (${tokensUsed} tokens)`);

      return {
        success: true,
        result,
        tokensUsed,
        filesModified: [],
        commits: [],
      };
    } catch (error: any) {
      console.error(`❌ [${context.agentName}] Task failed:`, error.message);

      return {
        success: false,
        result: '',
        tokensUsed: 0,
        error: error.message,
      };
    }
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
    console.log('🛑 Anthropic API client shutdown');
  }

  getName(): string {
    return 'Anthropic API';
  }

  /**
   * Get system prompt based on agent type
   */
  private getSystemPrompt(agentType: string): string {
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

      design_trend_agent: `You are a Design Trend Agent. You research current design trends, analyze popular UI patterns, and recommend modern design approaches. You stay current with design systems and component libraries.`,
    };

    return prompts[agentType] || prompts.backend_architect;
  }

  /**
   * Build user prompt with task and context
   */
  private buildUserPrompt(context: TaskExecutionContext): string {
    let prompt = `Project: ${context.projectId}\n`;
    prompt += `Task Type: ${context.taskType}\n`;
    prompt += `Task: ${context.taskTitle}\n\n`;
    prompt += `Description:\n${context.taskDescription}\n\n`;

    if (context.metadata?.codeContext) {
      prompt += `Existing Code Context:\n${context.metadata.codeContext}\n\n`;
    }

    prompt += `Please complete this task following best practices for ${context.agentType}.\n\n`;

    switch (context.taskType) {
      case 'feature':
        prompt += `Provide complete, working code that can be committed to the repository.\n`;
        prompt += `Include:\n`;
        prompt += `- Implementation details\n`;
        prompt += `- File paths and code\n`;
        prompt += `- Any dependencies needed\n`;
        prompt += `- Testing recommendations\n`;
        break;

      case 'review':
        prompt += `Provide a detailed code review with specific suggestions for improvement.\n`;
        prompt += `Focus on:\n`;
        prompt += `- Security issues\n`;
        prompt += `- Performance concerns\n`;
        prompt += `- Code quality\n`;
        prompt += `- Best practices\n`;
        break;

      case 'docs':
        prompt += `Write clear, comprehensive documentation.\n`;
        prompt += `Include:\n`;
        prompt += `- Overview and purpose\n`;
        prompt += `- Usage examples\n`;
        prompt += `- API reference\n`;
        prompt += `- Common gotchas\n`;
        break;

      default:
        prompt += `Provide detailed guidance and recommendations.\n`;
    }

    prompt += `\nFormat your response clearly with sections and code blocks.`;

    return prompt;
  }
}
