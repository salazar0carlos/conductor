/**
 * Shared types for agent integrations
 */

export interface TaskExecutionContext {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  taskType: string;
  projectId: string;
  agentId: string;
  agentType: string;
  agentName: string;
  githubRepo?: string;
  githubBranch?: string;
  requiredCapabilities: string[];
  metadata?: Record<string, any>;
}

export interface TaskExecutionResult {
  success: boolean;
  result: string;
  tokensUsed: number;
  filesModified?: string[];
  commits?: CommitInfo[];
  error?: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  filesChanged: string[];
  timestamp: string;
}

export interface IntegrationConfig {
  type: 'claude-code' | 'anthropic-api';
  apiKey: string;
  githubToken?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  workingDirectory?: string;
}

export interface IAgentIntegration {
  /**
   * Initialize the integration
   */
  initialize(): Promise<void>;

  /**
   * Execute a task
   */
  executeTask(context: TaskExecutionContext): Promise<TaskExecutionResult>;

  /**
   * Cleanup/shutdown
   */
  shutdown(): Promise<void>;

  /**
   * Get integration name
   */
  getName(): string;
}
