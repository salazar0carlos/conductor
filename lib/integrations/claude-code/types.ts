/**
 * Claude Code integration types
 */

export interface ClaudeCodeSessionConfig {
  apiKey: string;
  workingDirectory: string;
  githubToken?: string;
  sessionId?: string;
  maxTokens?: number;
  model?: string;
}

export interface ClaudeCodeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeCodeResponse {
  content: string;
  tokensUsed: number;
  toolCalls?: ToolCall[];
  filesModified?: string[];
}

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  output?: string;
}

export interface SessionState {
  sessionId: string;
  workingDirectory: string;
  conversationHistory: ClaudeCodeMessage[];
  filesModified: Set<string>;
  totalTokensUsed: number;
  createdAt: Date;
  lastActivity: Date;
}
