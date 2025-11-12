/**
 * Agent Integrations - Centralized integration layer
 *
 * Provides multiple ways for agents to execute tasks:
 * - Claude Code: Full CLI capabilities (file ops, git, terminal)
 * - Anthropic API: Direct API access (faster, simpler)
 */

// Types
export * from './types';

// Clients
export { AnthropicAPIClient } from './anthropic-api/client';
export { ClaudeCodeClient } from './claude-code/client';
export { ClaudeCodeIntegration } from './claude-code/integration';

// Factory
export { IntegrationFactory, createIntegration, createIntegrationFromEnv } from './factory';

// Type guards
import { IAgentIntegration } from './types';

export function isClaudeCodeIntegration(integration: IAgentIntegration): boolean {
  return integration.getName() === 'Claude Code';
}

export function isAnthropicAPIIntegration(integration: IAgentIntegration): boolean {
  return integration.getName() === 'Anthropic API';
}
