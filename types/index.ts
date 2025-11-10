// Core Agent Types
export interface Agent {
  id: string
  name: string
  description: string
  type: AgentType
  config: AgentConfig
  status: AgentStatus
  createdAt: string
  updatedAt: string
}

export type AgentType = 'llm' | 'tool' | 'human' | 'custom'

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed'

export interface AgentConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  tools?: string[]
  systemPrompt?: string
  [key: string]: unknown
}

// Workflow Types
export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'error'

export interface WorkflowNode {
  id: string
  type: 'agent' | 'condition' | 'input' | 'output'
  agentId?: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

// Execution Types
export interface Execution {
  id: string
  workflowId: string
  status: ExecutionStatus
  startedAt: string
  completedAt?: string
  steps: ExecutionStep[]
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface ExecutionStep {
  id: string
  nodeId: string
  status: AgentStatus
  input: unknown
  output?: unknown
  error?: string
  startedAt: string
  completedAt?: string
}

// Database Types (Supabase)
export interface Database {
  public: {
    Tables: {
      agents: {
        Row: Agent
        Insert: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>
      }
      workflows: {
        Row: Workflow
        Insert: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>>
      }
      executions: {
        Row: Execution
        Insert: Omit<Execution, 'id'>
        Update: Partial<Omit<Execution, 'id'>>
      }
    }
  }
}
