/**
 * Integration Factory - Creates the appropriate agent integration
 */

import { IAgentIntegration, IntegrationConfig } from './types';
import { AnthropicAPIClient } from './anthropic-api/client';
import { ClaudeCodeIntegration } from './claude-code/integration';

export class IntegrationFactory {
  /**
   * Create an agent integration based on configuration
   */
  static create(config: IntegrationConfig): IAgentIntegration {
    switch (config.type) {
      case 'claude-code':
        return new ClaudeCodeIntegration(config);

      case 'anthropic-api':
        return new AnthropicAPIClient(config);

      default:
        throw new Error(`Unknown integration type: ${config.type}`);
    }
  }

  /**
   * Create integration from environment variables
   */
  static createFromEnv(type: 'claude-code' | 'anthropic-api' = 'anthropic-api'): IAgentIntegration {
    const config: IntegrationConfig = {
      type,
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      githubToken: process.env.GITHUB_TOKEN,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      workingDirectory: process.env.WORKSPACE_DIR || '/tmp/conductor-workspace',
    };

    if (!config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    return this.create(config);
  }

  /**
   * Get recommended integration type based on task
   */
  static getRecommendedType(taskType: string): 'claude-code' | 'anthropic-api' {
    // Tasks that benefit from Claude Code's tools
    const claudeCodeTasks = ['feature', 'bug', 'refactor', 'setup'];

    if (claudeCodeTasks.includes(taskType)) {
      return 'claude-code';
    }

    // Tasks that work fine with direct API
    return 'anthropic-api';
  }
}

// Export convenience function
export function createIntegration(config: IntegrationConfig): IAgentIntegration {
  return IntegrationFactory.create(config);
}

export function createIntegrationFromEnv(
  type: 'claude-code' | 'anthropic-api' = 'anthropic-api'
): IAgentIntegration {
  return IntegrationFactory.createFromEnv(type);
}
