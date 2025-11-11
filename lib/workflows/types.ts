/**
 * Workflow Templates & Quality Gates System
 *
 * Defines standard processes that every app must go through
 * to ensure production-ready, marketplace-compliant deployments.
 */

export type WorkflowPhase =
  | 'requirements'
  | 'architecture'
  | 'development'
  | 'security'
  | 'performance'
  | 'testing'
  | 'documentation'
  | 'deployment_prep'
  | 'final_review';

export type QualityGateStatus = 'pending' | 'passed' | 'failed' | 'skipped';

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  phase: WorkflowPhase;
  required: boolean;
  criteria: QualityGateCriteria[];
  status: QualityGateStatus;
  checked_by_agent_ids: string[];
  checked_at?: Date;
  failure_reason?: string;
}

export interface QualityGateCriteria {
  id: string;
  name: string;
  description: string;
  check_type: 'automated' | 'manual' | 'agent_review';
  threshold?: number; // For automated checks (e.g., test coverage > 80)
  status: QualityGateStatus;
}

export interface RedundancyRequirement {
  phase: WorkflowPhase;
  required_agent_types: string[]; // e.g., ['security_engineer', 'system_architect']
  min_approvals: number;
  approval_rule: 'all' | 'majority' | 'any';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  app_type: 'nextjs' | 'react' | 'node' | 'python' | 'fullstack' | 'api' | 'mobile';
  phases: WorkflowPhaseDefinition[];
  quality_gates: QualityGate[];
  redundancy_requirements: RedundancyRequirement[];
  estimated_duration_hours: number;
}

export interface WorkflowPhaseDefinition {
  phase: WorkflowPhase;
  name: string;
  description: string;
  order: number;
  task_templates: TaskTemplate[];
  dependencies: WorkflowPhase[]; // Which phases must complete first
  quality_gates: string[]; // Quality gate IDs that must pass
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'test' | 'docs' | 'analysis' | 'review';
  required_capabilities: string[];
  preferred_agent_types: string[]; // e.g., ['backend_architect']
  requires_redundancy: boolean;
  redundancy_agent_types?: string[]; // If redundancy required, which types
  estimated_hours: number;
  acceptance_criteria: string[];
  quality_checks: string[];
}

export interface WorkflowInstance {
  id: string;
  workflow_template_id: string;
  project_id: string;
  parent_task_id: string; // The root task that spawned this workflow
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'failed';
  current_phase: WorkflowPhase;
  phases_completed: WorkflowPhase[];
  quality_gates_status: Record<string, QualityGateStatus>;
  started_at?: Date;
  completed_at?: Date;
  metadata: {
    app_name: string;
    app_type: string;
    target_deployment?: string; // e.g., 'vercel', 'netlify', 'aws'
    marketplace_target?: string; // e.g., 'npm', 'vercel_marketplace'
  };
}

export interface DeploymentReadinessChecklist {
  workflow_instance_id: string;
  all_phases_completed: boolean;
  all_quality_gates_passed: boolean;
  all_redundancies_satisfied: boolean;
  deployment_ready: boolean;
  blockers: DeploymentBlocker[];
  checklist_items: ChecklistItem[];
}

export interface DeploymentBlocker {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  phase: WorkflowPhase;
  description: string;
  blocking_task_id?: string;
  resolution_required: string;
}

export interface ChecklistItem {
  id: string;
  category: 'security' | 'performance' | 'testing' | 'documentation' | 'deployment' | 'compliance';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'not_applicable';
  verified_by_agent_id?: string;
  verified_at?: Date;
  notes?: string;
}

// Standard workflow templates
export const WORKFLOW_TEMPLATES = {
  NEXTJS_FULLSTACK: 'nextjs_fullstack_app',
  REACT_SPA: 'react_spa',
  NODE_API: 'node_api',
  PYTHON_API: 'python_api',
  MOBILE_APP: 'mobile_app',
} as const;

// Quality gate definitions
export const STANDARD_QUALITY_GATES = {
  // Security gates
  SECURITY_AUDIT: 'security_audit',
  VULNERABILITY_SCAN: 'vulnerability_scan',
  AUTH_REVIEW: 'authentication_review',
  DATA_PRIVACY: 'data_privacy_review',

  // Performance gates
  PERFORMANCE_BENCHMARK: 'performance_benchmark',
  LOAD_TEST: 'load_test',
  BUNDLE_SIZE: 'bundle_size_check',

  // Testing gates
  UNIT_TEST_COVERAGE: 'unit_test_coverage',
  INTEGRATION_TESTS: 'integration_tests',
  E2E_TESTS: 'e2e_tests',

  // Code quality gates
  LINTING: 'linting_check',
  TYPE_CHECKING: 'type_checking',
  CODE_REVIEW: 'code_review',

  // Documentation gates
  API_DOCS: 'api_documentation',
  USER_DOCS: 'user_documentation',
  DEPLOYMENT_GUIDE: 'deployment_guide',

  // Deployment gates
  BUILD_SUCCESS: 'build_success',
  DEPLOYMENT_CONFIG: 'deployment_config',
  ENV_VARS_CHECK: 'environment_variables',

  // Compliance gates
  LICENSE_CHECK: 'license_compliance',
  ACCESSIBILITY: 'accessibility_audit',
  GDPR_COMPLIANCE: 'gdpr_compliance',
} as const;

// Redundancy requirements by phase
export const PHASE_REDUNDANCY_REQUIREMENTS: Record<WorkflowPhase, RedundancyRequirement | null> = {
  requirements: {
    phase: 'requirements',
    required_agent_types: ['requirements_analyst', 'system_architect'],
    min_approvals: 2,
    approval_rule: 'all',
  },
  architecture: {
    phase: 'architecture',
    required_agent_types: ['system_architect', 'backend_architect', 'frontend_architect'],
    min_approvals: 2,
    approval_rule: 'all',
  },
  development: null, // No redundancy required for development
  security: {
    phase: 'security',
    required_agent_types: ['security_engineer', 'system_architect'],
    min_approvals: 2,
    approval_rule: 'all',
  },
  performance: {
    phase: 'performance',
    required_agent_types: ['performance_engineer', 'system_architect'],
    min_approvals: 2,
    approval_rule: 'all',
  },
  testing: null, // No redundancy required for testing
  documentation: null, // No redundancy required for docs
  deployment_prep: {
    phase: 'deployment_prep',
    required_agent_types: ['system_architect', 'backend_architect'],
    min_approvals: 2,
    approval_rule: 'all',
  },
  final_review: {
    phase: 'final_review',
    required_agent_types: ['system_architect', 'security_engineer', 'performance_engineer'],
    min_approvals: 3,
    approval_rule: 'all',
  },
};
