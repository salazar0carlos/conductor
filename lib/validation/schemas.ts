import { z } from 'zod'

// Agent Schemas
export const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['llm', 'tool', 'human', 'supervisor', 'analyzer']),
  capabilities: z.array(z.string()).min(1),
  config: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  capabilities: z.array(z.string()).min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['idle', 'active', 'busy', 'offline', 'error']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const agentHeartbeatSchema = z.object({
  agent_id: z.string().uuid(),
  status: z.enum(['idle', 'active', 'busy', 'offline', 'error'])
})

// Project Schemas
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  github_repo: z.string().optional(),
  github_branch: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  github_repo: z.string().optional(),
  github_branch: z.string().optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

// Task Schemas
export const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(['feature', 'bugfix', 'refactor', 'test', 'docs', 'analysis', 'review']),
  priority: z.number().int().min(0).max(10).optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  required_capabilities: z.array(z.string()).optional(),
  input_data: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  type: z.enum(['feature', 'bugfix', 'refactor', 'test', 'docs', 'analysis', 'review']).optional(),
  priority: z.number().int().min(0).max(10).optional(),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
  assigned_agent_id: z.string().uuid().nullable().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  required_capabilities: z.array(z.string()).optional(),
  input_data: z.record(z.string(), z.unknown()).optional(),
  output_data: z.record(z.string(), z.unknown()).optional(),
  error_message: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const pollTaskSchema = z.object({
  agent_id: z.string().uuid(),
  capabilities: z.array(z.string()).min(1)
})

export const completeTaskSchema = z.object({
  agent_id: z.string().uuid(),
  output_data: z.record(z.string(), z.unknown())
})

export const failTaskSchema = z.object({
  agent_id: z.string().uuid(),
  error_message: z.string().min(1)
})

export const createTaskLogSchema = z.object({
  agent_id: z.string().uuid().optional(),
  level: z.enum(['info', 'warning', 'error', 'debug']),
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional()
})

// Analysis Schemas
export const createAnalysisSchema = z.object({
  analyzer_agent_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  analysis_type: z.enum(['task_completion', 'pattern_detection', 'improvement_suggestion', 'quality_review']),
  findings: z.record(z.string(), z.unknown()),
  suggestions: z.array(z.record(z.string(), z.unknown())).optional(),
  priority_score: z.number().int().min(0).max(10).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

export const updateAnalysisSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'approved', 'rejected', 'implemented']).optional(),
  reviewed_by_agent_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

// API Key Schema
export const createApiKeySchema = z.object({
  agent_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).optional(),
  expires_at: z.string().datetime().optional()
})
