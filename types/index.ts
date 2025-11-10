// Database Schema Types
export interface Project {
  id: string
  name: string
  description: string | null
  github_repo: string | null
  github_branch: string
  status: ProjectStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ProjectStatus = 'active' | 'paused' | 'archived'

export interface Agent {
  id: string
  name: string
  type: AgentType
  capabilities: string[]
  config: AgentConfig
  status: AgentStatus
  last_heartbeat: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AgentType = 'llm' | 'tool' | 'human' | 'supervisor' | 'analyzer'

export type AgentStatus = 'idle' | 'active' | 'busy' | 'offline' | 'error'

export interface AgentConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  [key: string]: unknown
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  type: TaskType
  priority: number
  status: TaskStatus
  assigned_agent_id: string | null
  dependencies: string[]
  required_capabilities: string[]
  input_data: Record<string, unknown>
  output_data: Record<string, unknown> | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type TaskType = 'feature' | 'bugfix' | 'refactor' | 'test' | 'docs' | 'analysis' | 'review'

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

export interface TaskLog {
  id: string
  task_id: string
  agent_id: string | null
  level: LogLevel
  message: string
  data: Record<string, unknown>
  created_at: string
}

export type LogLevel = 'info' | 'warning' | 'error' | 'debug'

export interface AnalysisHistory {
  id: string
  analyzer_agent_id: string | null
  task_id: string | null
  project_id: string | null
  analysis_type: AnalysisType
  findings: Record<string, unknown>
  suggestions: Array<Record<string, unknown>>
  priority_score: number | null
  status: AnalysisStatus
  reviewed_by_agent_id: string | null
  reviewed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AnalysisType = 'task_completion' | 'pattern_detection' | 'improvement_suggestion' | 'quality_review'

export type AnalysisStatus = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'implemented'

// API Request/Response Types
export interface CreateProjectRequest {
  name: string
  description?: string
  github_repo?: string
  github_branch?: string
  metadata?: Record<string, unknown>
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  github_repo?: string
  github_branch?: string
  status?: ProjectStatus
  metadata?: Record<string, unknown>
}

export interface CreateAgentRequest {
  name: string
  type: AgentType
  capabilities: string[]
  config?: AgentConfig
  metadata?: Record<string, unknown>
}

export interface UpdateAgentRequest {
  name?: string
  capabilities?: string[]
  config?: AgentConfig
  status?: AgentStatus
  metadata?: Record<string, unknown>
}

export interface AgentHeartbeatRequest {
  agent_id: string
  status: AgentStatus
}

export interface CreateTaskRequest {
  project_id: string
  title: string
  description?: string
  type: TaskType
  priority?: number
  dependencies?: string[]
  required_capabilities?: string[]
  input_data?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  type?: TaskType
  priority?: number
  status?: TaskStatus
  assigned_agent_id?: string | null
  dependencies?: string[]
  required_capabilities?: string[]
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  error_message?: string | null
  metadata?: Record<string, unknown>
}

export interface PollTaskRequest {
  agent_id: string
  capabilities: string[]
}

export interface PollTaskResponse {
  task: Task | null
}

export interface CompleteTaskRequest {
  agent_id: string
  output_data: Record<string, unknown>
}

export interface FailTaskRequest {
  agent_id: string
  error_message: string
}

export interface CreateTaskLogRequest {
  task_id: string
  agent_id?: string
  level: LogLevel
  message: string
  data?: Record<string, unknown>
}

export interface CreateAnalysisRequest {
  analyzer_agent_id?: string
  task_id?: string
  project_id?: string
  analysis_type: AnalysisType
  findings: Record<string, unknown>
  suggestions?: Array<Record<string, unknown>>
  priority_score?: number
  metadata?: Record<string, unknown>
}

export interface UpdateAnalysisRequest {
  status?: AnalysisStatus
  reviewed_by_agent_id?: string
  metadata?: Record<string, unknown>
}

// Dashboard Stats Types
export interface DashboardStats {
  projects: {
    total: number
    active: number
    paused: number
    archived: number
  }
  tasks: {
    total: number
    pending: number
    in_progress: number
    completed: number
    failed: number
  }
  agents: {
    total: number
    active: number
    idle: number
    busy: number
    offline: number
    error: number
  }
  analysis: {
    total: number
    pending: number
    reviewed: number
    approved: number
  }
}

// Database Types (Supabase)
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      agents: {
        Row: Agent
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
      }
      task_logs: {
        Row: TaskLog
        Insert: Omit<TaskLog, 'id' | 'created_at'>
        Update: never
      }
      analysis_history: {
        Row: AnalysisHistory
        Insert: Omit<AnalysisHistory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AnalysisHistory, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
