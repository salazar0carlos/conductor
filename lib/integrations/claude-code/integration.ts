/**
 * Claude Code Integration - Implements IAgentIntegration
 */

import {
  IAgentIntegration,
  TaskExecutionContext,
  TaskExecutionResult,
  IntegrationConfig,
} from '../types';
import { ClaudeCodeClient } from './client';

export class ClaudeCodeIntegration implements IAgentIntegration {
  private client: ClaudeCodeClient;
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;

    this.client = new ClaudeCodeClient({
      apiKey: config.apiKey,
      workingDirectory: config.workingDirectory || '/tmp/conductor-workspace',
      githubToken: config.githubToken,
    });
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
    console.log('✅ Claude Code integration initialized');
  }

  async executeTask(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    try {
      console.log(`🤖 [${context.agentName}] Executing with Claude Code...`);

      const response = await this.client.executeTask(
        context.taskTitle,
        context.taskDescription,
        context.taskType,
        context.metadata?.codeContext
      );

      return {
        success: true,
        result: response.content,
        tokensUsed: response.tokensUsed,
        filesModified: response.filesModified || [],
        commits: [],
      };
    } catch (error: any) {
      console.error(`❌ [${context.agentName}] Claude Code execution failed:`, error.message);

      return {
        success: false,
        result: '',
        tokensUsed: 0,
        error: error.message,
      };
    }
  }

  async shutdown(): Promise<void> {
    await this.client.shutdown();
    console.log('🛑 Claude Code integration shutdown');
  }

  getName(): string {
    return 'Claude Code';
  }

  /**
   * Get the underlying Claude Code client
   */
  getClient(): ClaudeCodeClient {
    return this.client;
  }
}
