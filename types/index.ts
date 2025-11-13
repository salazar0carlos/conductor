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

// Admin & Settings Types
export interface UserProfile {
  id: string
  user_id: string | null
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'operator' | 'viewer'

export interface SystemSetting {
  id: string
  key: string
  value: unknown
  category: SettingCategory
  description: string | null
  data_type: SettingDataType
  is_public: boolean
  is_editable: boolean
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type SettingCategory = 'general' | 'agents' | 'tasks' | 'notifications' | 'integrations' | 'security'

export type SettingDataType = 'string' | 'number' | 'boolean' | 'json' | 'array'

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AdminStatistics {
  active_users: number
  admin_count: number
  active_agents: number
  active_tasks: number
  settings_count: number
}

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

// Admin Request/Response Types
export interface CreateUserProfileRequest {
  email: string
  full_name?: string
  role: UserRole
  is_active?: boolean
}

export interface UpdateUserProfileRequest {
  full_name?: string
  role?: UserRole
  is_active?: boolean
}

export interface CreateSystemSettingRequest {
  key: string
  value: unknown
  category: SettingCategory
  description?: string
  data_type: SettingDataType
  is_public?: boolean
  is_editable?: boolean
}

export interface UpdateSystemSettingRequest {
  value?: unknown
  description?: string
  is_public?: boolean
  is_editable?: boolean
}

export interface CreateAuditLogRequest {
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
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

// ============================================================================
// AI PROVIDERS & MODELS TYPES
// ============================================================================

export interface AIProvider {
  id: string
  name: string
  display_name: string
  category: AIProviderCategory
  logo_url: string | null
  website_url: string | null
  documentation_url: string | null
  status: AIProviderStatus
  requires_api_key: boolean
  supports_streaming: boolean
  rate_limits: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AIProviderCategory = 'text' | 'image' | 'audio' | 'video' | 'code' | 'embedding'
export type AIProviderStatus = 'active' | 'deprecated' | 'maintenance'

export interface AIModel {
  id: string
  provider_id: string
  name: string
  display_name: string
  model_id: string
  category: AIProviderCategory
  capabilities: string[]
  best_for: string[]
  context_window: number | null
  max_output_tokens: number | null
  supports_vision: boolean
  supports_function_calling: boolean
  supports_json_mode: boolean
  pricing: AIModelPricing
  performance_tier: AIPerformanceTier | null
  status: AIModelStatus
  release_date: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AIModelPricing {
  input_tokens?: number
  output_tokens?: number
  cost_per_image?: number
  cost_per_character?: number
  cost_per_minute?: number
  currency: string
  per_tokens: number
}

export type AIPerformanceTier = 'fast' | 'balanced' | 'quality'
export type AIModelStatus = 'active' | 'beta' | 'deprecated' | 'maintenance'

export interface AIProviderConfig {
  id: string
  user_id: string | null
  project_id: string | null
  provider_id: string
  api_key_encrypted: string | null
  is_enabled: boolean
  priority: number
  daily_budget_usd: number | null
  monthly_budget_usd: number | null
  rate_limit_override: Record<string, unknown> | null
  default_parameters: Record<string, unknown>
  allowed_models: string[] | null
  blocked_models: string[] | null
  webhook_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AIModelPreference {
  id: string
  user_id: string | null
  project_id: string | null
  task_type: string
  primary_model_id: string
  fallback_model_ids: string[] | null
  parameters: Record<string, unknown>
  quality_threshold: number | null
  max_cost_per_request: number | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AIUsageLog {
  id: string
  user_id: string | null
  project_id: string | null
  provider_id: string
  model_id: string
  task_type: string | null
  request_id: string | null
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: number
  duration_ms: number | null
  response_quality_score: number | null
  was_cached: boolean
  was_fallback: boolean
  error_message: string | null
  status: AIUsageStatus
  metadata: Record<string, unknown>
  created_at: string
}

export type AIUsageStatus = 'success' | 'error' | 'timeout' | 'rate_limited'

export interface AIProviderHealth {
  id: string
  provider_id: string
  is_available: boolean
  last_check_at: string
  response_time_ms: number | null
  error_rate: number | null
  success_count: number
  error_count: number
  last_error: string | null
  last_error_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AIUsageBudget {
  id: string
  user_id: string | null
  project_id: string | null
  provider_id: string | null
  period: AIBudgetPeriod
  period_start: string
  budget_usd: number
  spent_usd: number
  request_count: number
  alert_threshold: number
  is_alert_sent: boolean
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AIBudgetPeriod = 'daily' | 'weekly' | 'monthly'

export interface AIModelBenchmark {
  id: string
  model_id: string
  benchmark_type: string
  metric_name: string
  score: number
  sample_size: number
  tested_at: string
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================================
// AI PROVIDER API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateAIProviderConfigRequest {
  provider_id: string
  api_key: string
  is_enabled?: boolean
  priority?: number
  daily_budget_usd?: number
  monthly_budget_usd?: number
  default_parameters?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface UpdateAIProviderConfigRequest {
  api_key?: string
  is_enabled?: boolean
  priority?: number
  daily_budget_usd?: number
  monthly_budget_usd?: number
  default_parameters?: Record<string, unknown>
  allowed_models?: string[]
  blocked_models?: string[]
  webhook_url?: string
  metadata?: Record<string, unknown>
}

export interface CreateAIModelPreferenceRequest {
  task_type: string
  primary_model_id: string
  fallback_model_ids?: string[]
  parameters?: Record<string, unknown>
  quality_threshold?: number
  max_cost_per_request?: number
  metadata?: Record<string, unknown>
}

export interface UpdateAIModelPreferenceRequest {
  primary_model_id?: string
  fallback_model_ids?: string[]
  parameters?: Record<string, unknown>
  quality_threshold?: number
  max_cost_per_request?: number
  is_active?: boolean
  metadata?: Record<string, unknown>
}

export interface AIExecutionRequest {
  task_type: string
  prompt: string
  messages?: Array<{ role: string; content: string }>
  model_id?: string // Optional: override auto-selection
  parameters?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    [key: string]: unknown
  }
  user_id?: string
  project_id?: string
  metadata?: Record<string, unknown>
}

export interface AIExecutionResponse {
  request_id: string
  model_used: AIModel
  provider_used: AIProvider
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  cost_usd: number
  duration_ms: number
  was_cached: boolean
  was_fallback: boolean
  metadata?: Record<string, unknown>
}

export interface AIProviderStats {
  provider: AIProvider
  config?: AIProviderConfig
  health: AIProviderHealth
  usage: {
    today: {
      requests: number
      tokens: number
      cost_usd: number
    }
    this_month: {
      requests: number
      tokens: number
      cost_usd: number
    }
  }
  budget: {
    daily: AIUsageBudget | null
    monthly: AIUsageBudget | null
  }
  available_models: AIModel[]
}

export interface AIUsageAnalytics {
  total_requests: number
  total_tokens: number
  total_cost_usd: number
  average_cost_per_request: number
  average_response_time_ms: number
  success_rate: number
  by_provider: Array<{
    provider: AIProvider
    requests: number
    cost_usd: number
    tokens: number
  }>
  by_model: Array<{
    model: AIModel
    requests: number
    cost_usd: number
    tokens: number
  }>
  by_task_type: Array<{
    task_type: string
    requests: number
    cost_usd: number
    average_quality_score: number
  }>
  timeline: Array<{
    date: string
    requests: number
    cost_usd: number
    tokens: number
  }>
}

export interface AIModelComparison {
  models: AIModel[]
  test_prompt: string
  results: Array<{
    model: AIModel
    response: string
    duration_ms: number
    tokens_used: number
    cost_usd: number
    quality_score?: number
  }>
  winner?: {
    by_speed: string
    by_cost: string
    by_quality: string
  }
}

// ============================================================================
// SCHEDULER TYPES
// ============================================================================

export interface ScheduledJob {
  id: string
  name: string
  description: string | null
  schedule_type: ScheduleType
  schedule_config: ScheduleConfig
  job_type: JobType
  job_config: JobConfig
  status: JobStatus
  timezone: string
  priority: number
  retry_config: RetryConfig
  timeout_seconds: number | null
  max_concurrent: number | null
  conditions: JobCondition[] | null
  dependencies: string[] | null
  last_run_at: string | null
  next_run_at: string | null
  run_count: number
  success_count: number
  failure_count: number
  created_by: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ScheduleType = 'cron' | 'interval' | 'one-time' | 'recurring' | 'advanced'
export type JobStatus = 'active' | 'paused' | 'disabled' | 'expired'
export type JobType = 'http_request' | 'database_query' | 'script' | 'ai_task' | 'workflow' | 'data_sync' | 'backup' | 'report'

export interface ScheduleConfig {
  // Cron
  cron_expression?: string

  // Interval
  interval_value?: number
  interval_unit?: 'minutes' | 'hours' | 'days'

  // One-time
  run_at?: string

  // Recurring
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time?: string // HH:mm format
    days_of_week?: number[] // 0-6, 0 = Sunday
    day_of_month?: number // 1-31
    months?: number[] // 1-12
  }

  // Advanced (multiple schedules)
  schedules?: Array<{
    type: 'cron' | 'interval' | 'recurring'
    config: Record<string, unknown>
  }>
}

export interface JobConfig {
  // HTTP Request
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: Record<string, unknown> | string
  auth?: {
    type: 'bearer' | 'basic' | 'api-key'
    credentials: Record<string, string>
  }

  // Database Query
  connection_id?: string
  query?: string
  parameters?: Record<string, unknown>

  // Script Execution
  script?: string
  language?: 'javascript' | 'python' | 'shell'
  environment?: Record<string, string>

  // AI Task
  ai_provider?: string
  ai_model?: string
  prompt?: string
  ai_parameters?: Record<string, unknown>

  // Workflow
  workflow_id?: string
  workflow_inputs?: Record<string, unknown>

  // Data Sync
  source?: string
  destination?: string
  sync_config?: Record<string, unknown>

  // Common
  variables?: Record<string, unknown>
  notifications?: {
    on_success?: string[]
    on_failure?: string[]
    channels?: Array<'email' | 'slack' | 'webhook'>
  }
}

export interface RetryConfig {
  max_attempts: number
  initial_delay_seconds: number
  max_delay_seconds: number
  backoff_multiplier: number
  retry_on?: string[] // Error codes/types to retry
}

export interface JobCondition {
  type: 'job_status' | 'time_window' | 'custom'
  job_id?: string
  required_status?: 'completed' | 'failed'
  start_time?: string
  end_time?: string
  expression?: string
}

export interface JobExecution {
  id: string
  job_id: string
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  status: ExecutionStatus
  trigger_type: TriggerType
  triggered_by: string | null
  attempt_number: number
  duration_ms: number | null
  output: Record<string, unknown> | null
  error_message: string | null
  error_stack: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout'
export type TriggerType = 'scheduled' | 'manual' | 'dependency' | 'webhook'

export interface JobAlert {
  id: string
  job_id: string
  alert_type: AlertType
  severity: AlertSeverity
  message: string
  details: Record<string, unknown>
  is_acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  created_at: string
}

export type AlertType = 'execution_failure' | 'consecutive_failures' | 'timeout' | 'missing_schedule' | 'budget_exceeded'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// ============================================================================
// SCHEDULER API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateScheduledJobRequest {
  name: string
  description?: string
  schedule_type: ScheduleType
  schedule_config: ScheduleConfig
  job_type: JobType
  job_config: JobConfig
  timezone?: string
  priority?: number
  retry_config?: RetryConfig
  timeout_seconds?: number
  max_concurrent?: number
  conditions?: JobCondition[]
  dependencies?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateScheduledJobRequest {
  name?: string
  description?: string
  schedule_config?: ScheduleConfig
  job_config?: JobConfig
  status?: JobStatus
  timezone?: string
  priority?: number
  retry_config?: RetryConfig
  timeout_seconds?: number
  max_concurrent?: number
  conditions?: JobCondition[]
  dependencies?: string[]
  metadata?: Record<string, unknown>
}

export interface ExecuteJobRequest {
  job_id: string
  trigger_type?: TriggerType
  variables?: Record<string, unknown>
}

export interface JobExecutionStats {
  job: ScheduledJob
  executions_today: number
  executions_this_week: number
  executions_this_month: number
  success_rate: number
  average_duration_ms: number
  last_execution: JobExecution | null
  next_execution: {
    scheduled_at: string
    time_until: string
  } | null
  upcoming_executions: Array<{
    scheduled_at: string
    time_until: string
  }>
}

export interface SchedulerDashboardStats {
  total_jobs: number
  active_jobs: number
  paused_jobs: number
  disabled_jobs: number
  executions_today: number
  executions_this_week: number
  executions_this_month: number
  success_rate_today: number
  success_rate_this_week: number
  success_rate_this_month: number
  avg_execution_time_ms: number
  jobs_by_type: Record<JobType, number>
  jobs_by_schedule_type: Record<ScheduleType, number>
  recent_failures: JobExecution[]
  upcoming_jobs: Array<{
    job: ScheduledJob
    next_run: string
    time_until: string
  }>
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
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
      ai_providers: {
        Row: AIProvider
        Insert: Omit<AIProvider, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIProvider, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_models: {
        Row: AIModel
        Insert: Omit<AIModel, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIModel, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_provider_configs: {
        Row: AIProviderConfig
        Insert: Omit<AIProviderConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIProviderConfig, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_model_preferences: {
        Row: AIModelPreference
        Insert: Omit<AIModelPreference, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIModelPreference, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_usage_logs: {
        Row: AIUsageLog
        Insert: Omit<AIUsageLog, 'id' | 'created_at'>
        Update: never
      }
      ai_provider_health: {
        Row: AIProviderHealth
        Insert: Omit<AIProviderHealth, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIProviderHealth, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_usage_budgets: {
        Row: AIUsageBudget
        Insert: Omit<AIUsageBudget, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIUsageBudget, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_model_benchmarks: {
        Row: AIModelBenchmark
        Insert: Omit<AIModelBenchmark, 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
