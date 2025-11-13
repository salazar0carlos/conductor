// Workflow Builder Type Definitions

export type NodeCategory = 'trigger' | 'action' | 'logic' | 'data' | 'integration';

export type NodeType =
  // Triggers
  | 'trigger-manual'
  | 'trigger-schedule'
  | 'trigger-webhook'
  | 'trigger-file-upload'
  | 'trigger-email-received'
  // Actions
  | 'action-http-request'
  | 'action-database-query'
  | 'action-ai-generation'
  | 'action-send-email'
  | 'action-file-operation'
  // Logic
  | 'logic-condition'
  | 'logic-loop'
  | 'logic-switch'
  | 'logic-delay'
  | 'logic-stop'
  // Data
  | 'data-transform'
  | 'data-filter'
  | 'data-merge'
  | 'data-split'
  | 'data-aggregate'
  // Integrations
  | 'integration-github'
  | 'integration-slack'
  | 'integration-discord'
  | 'integration-stripe'
  | 'integration-sendgrid';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  category: NodeCategory;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
    outputs?: Record<string, any>;
    error?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  label?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'paused';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs: ExecutionLog[];
  nodeExecutions: NodeExecution[];
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  nodeId?: string;
  message: string;
  data?: any;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublished: boolean;
  tags?: string[];
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  createdBy: string;
  message?: string;
}

export interface NodeTypeDefinition {
  type: NodeType;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs: number;
  outputs: number;
  defaultConfig: Record<string, any>;
  configSchema: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'json' | 'cron' | 'code' | 'variables';
  required?: boolean;
  default?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags: string[];
  usageCount: number;
}

export interface WorkflowAnalytics {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageDuration: number;
  lastExecutedAt?: string;
  executionsByDay: { date: string; count: number }[];
}

export interface Variable {
  key: string;
  label: string;
  value: any;
  nodeId?: string;
  path?: string;
}
