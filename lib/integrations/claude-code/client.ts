/**
 * Claude Code Client - Wrapper for Claude Code CLI
 *
 * Manages Claude Code sessions and executes tasks using the CLI
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ClaudeCodeSessionConfig,
  ClaudeCodeMessage,
  ClaudeCodeResponse,
  SessionState,
} from './types';

export class ClaudeCodeClient {
  private config: ClaudeCodeSessionConfig;
  private process?: ChildProcess;
  private sessionState: SessionState;
  private outputBuffer: string = '';
  private isInitialized: boolean = false;

  constructor(config: ClaudeCodeSessionConfig) {
    this.config = {
      maxTokens: 8192,
      model: 'claude-sonnet-4-20250514',
      ...config,
    };

    this.sessionState = {
      sessionId: config.sessionId || this.generateSessionId(),
      workingDirectory: config.workingDirectory,
      conversationHistory: [],
      filesModified: new Set(),
      totalTokensUsed: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
  }

  /**
   * Initialize Claude Code session
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Verify working directory exists
    try {
      await fs.access(this.config.workingDirectory);
    } catch {
      await fs.mkdir(this.config.workingDirectory, { recursive: true });
    }

    // Set environment variables for Claude Code
    process.env.ANTHROPIC_API_KEY = this.config.apiKey;
    if (this.config.githubToken) {
      process.env.GITHUB_TOKEN = this.config.githubToken;
    }

    this.isInitialized = true;
    console.log(`✅ Claude Code session initialized: ${this.sessionState.sessionId}`);
  }

  /**
   * Execute a prompt with Claude Code
   */
  async execute(prompt: string): Promise<ClaudeCodeResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.sessionState.lastActivity = new Date();

    // Add user message to history
    this.sessionState.conversationHistory.push({
      role: 'user',
      content: prompt,
    });

    try {
      // For now, we'll use the Anthropic SDK directly
      // In production, you'd spawn the actual Claude Code CLI process
      // and parse its output

      const response = await this.executeWithCLI(prompt);

      // Add assistant response to history
      this.sessionState.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      this.sessionState.totalTokensUsed += response.tokensUsed;

      return response;
    } catch (error: any) {
      console.error('Claude Code execution error:', error);
      throw error;
    }
  }

  /**
   * Execute with Claude Code CLI (placeholder for actual CLI integration)
   */
  private async executeWithCLI(prompt: string): Promise<ClaudeCodeResponse> {
    // TODO: This is where we'd spawn the actual Claude Code CLI
    // For now, return a mock response structure

    // In production, this would be:
    // 1. Spawn claude-code CLI process
    // 2. Send prompt via stdin
    // 3. Parse stdout for response
    // 4. Extract tool calls, files modified, etc.

    return {
      content: 'Claude Code CLI integration pending',
      tokensUsed: 0,
      toolCalls: [],
      filesModified: [],
    };
  }

  /**
   * Execute a task with specific instructions
   */
  async executeTask(
    taskTitle: string,
    taskDescription: string,
    taskType: string,
    context?: string
  ): Promise<ClaudeCodeResponse> {
    const prompt = this.buildTaskPrompt(taskTitle, taskDescription, taskType, context);
    return this.execute(prompt);
  }

  /**
   * Build a task prompt for Claude Code
   */
  private buildTaskPrompt(
    title: string,
    description: string,
    type: string,
    context?: string
  ): string {
    let prompt = `Task: ${title}\n\n`;
    prompt += `Description:\n${description}\n\n`;

    if (context) {
      prompt += `Context:\n${context}\n\n`;
    }

    switch (type) {
      case 'feature':
        prompt += `Please implement this feature with:\n`;
        prompt += `1. Complete, working code\n`;
        prompt += `2. Proper error handling\n`;
        prompt += `3. TypeScript types\n`;
        prompt += `4. Tests if applicable\n`;
        prompt += `5. Documentation\n\n`;
        prompt += `Use the Write and Edit tools to create/modify files.\n`;
        prompt += `Commit your changes using git when done.\n`;
        break;

      case 'bug':
        prompt += `Please fix this bug by:\n`;
        prompt += `1. Identifying the root cause\n`;
        prompt += `2. Implementing the fix\n`;
        prompt += `3. Adding tests to prevent regression\n`;
        prompt += `4. Documenting what was fixed\n\n`;
        prompt += `Use the Read tool to examine code, Edit to fix, and git to commit.\n`;
        break;

      case 'review':
        prompt += `Please review this code for:\n`;
        prompt += `1. Security vulnerabilities\n`;
        prompt += `2. Performance issues\n`;
        prompt += `3. Code quality and maintainability\n`;
        prompt += `4. Best practices compliance\n\n`;
        prompt += `Use the Read and Grep tools to analyze the codebase.\n`;
        break;

      case 'docs':
        prompt += `Please create documentation that:\n`;
        prompt += `1. Is clear and comprehensive\n`;
        prompt += `2. Includes examples\n`;
        prompt += `3. Covers edge cases\n`;
        prompt += `4. Is well-formatted in Markdown\n\n`;
        prompt += `Use the Write tool to create documentation files.\n`;
        break;

      case 'refactor':
        prompt += `Please refactor this code to:\n`;
        prompt += `1. Improve readability\n`;
        prompt += `2. Reduce technical debt\n`;
        prompt += `3. Follow clean code principles\n`;
        prompt += `4. Maintain existing functionality\n\n`;
        prompt += `Use the Edit tool to refactor and git to commit.\n`;
        break;

      default:
        prompt += `Please complete this task following best practices.\n`;
    }

    return prompt;
  }

  /**
   * Get session state
   */
  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ClaudeCodeMessage[] {
    return [...this.sessionState.conversationHistory];
  }

  /**
   * Get files modified in this session
   */
  getFilesModified(): string[] {
    return Array.from(this.sessionState.filesModified);
  }

  /**
   * Get total tokens used
   */
  getTotalTokensUsed(): number {
    return this.sessionState.totalTokensUsed;
  }

  /**
   * Cleanup session
   */
  async shutdown(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }

    this.isInitialized = false;
    console.log(`🛑 Claude Code session shutdown: ${this.sessionState.sessionId}`);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
