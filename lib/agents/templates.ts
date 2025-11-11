/**
 * Agent Templates - Pre-configured specialist agents
 * These agents map to specific skills and capabilities
 */

import { AgentType, AgentConfig } from '@/types'

export interface AgentTemplate {
  id: string
  name: string
  type: AgentType
  description: string
  category: 'engineering' | 'quality' | 'analysis' | 'communication'
  capabilities: string[]
  config: AgentConfig
  focusAreas: string[]
  useCases: string[]
  recommendedFor: string[]
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'backend-architect',
    name: 'Backend Architect',
    type: 'llm',
    description: 'Design reliable backend systems with focus on data integrity, security, and fault tolerance',
    category: 'engineering',
    capabilities: [
      'api-design',
      'database-architecture',
      'security',
      'reliability',
      'performance-optimization',
      'system-architecture'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.3,
      systemPrompt: 'You are a backend architect specializing in reliable, secure, and scalable backend systems. Prioritize data integrity, security, and fault tolerance in all designs.'
    },
    focusAreas: [
      'API Design (RESTful, GraphQL)',
      'Database Architecture & Optimization',
      'Security Implementation',
      'System Reliability & Fault Tolerance',
      'Performance Optimization'
    ],
    useCases: [
      'Design and implement RESTful APIs',
      'Optimize database schemas and queries',
      'Implement authentication and authorization',
      'Build fault-tolerant systems',
      'Add monitoring and observability'
    ],
    recommendedFor: [
      'Building new backend services',
      'API endpoint design',
      'Database schema design',
      'Security implementation',
      'Performance optimization'
    ]
  },
  {
    id: 'frontend-architect',
    name: 'Frontend Architect',
    type: 'llm',
    description: 'Create accessible, performant user interfaces with focus on user experience and modern frameworks',
    category: 'engineering',
    capabilities: [
      'accessibility',
      'ui-design',
      'performance-optimization',
      'responsive-design',
      'component-architecture',
      'frontend-development'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.3,
      systemPrompt: 'You are a frontend architect specializing in accessible, performant user interfaces. Prioritize accessibility, Core Web Vitals, and modern best practices.'
    },
    focusAreas: [
      'Accessibility (WCAG 2.1 AA)',
      'Core Web Vitals & Performance',
      'Responsive Design (Mobile-First)',
      'Component Architecture',
      'Modern Frameworks (React, Vue, Angular)'
    ],
    useCases: [
      'Build accessible UI components',
      'Optimize frontend performance',
      'Create responsive layouts',
      'Design component systems',
      'Implement modern framework patterns'
    ],
    recommendedFor: [
      'UI component development',
      'Accessibility compliance',
      'Performance optimization',
      'Design system creation',
      'Responsive implementation'
    ]
  },
  {
    id: 'security-engineer',
    name: 'Security Engineer',
    type: 'analyzer',
    description: 'Identify security vulnerabilities and ensure compliance with security standards and best practices',
    category: 'quality',
    capabilities: [
      'vulnerability-assessment',
      'threat-modeling',
      'compliance-verification',
      'authentication',
      'data-protection',
      'security-audit'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.2,
      systemPrompt: 'You are a security engineer with zero-trust principles. Think like an attacker to identify vulnerabilities while implementing defense-in-depth strategies.'
    },
    focusAreas: [
      'Vulnerability Assessment (OWASP Top 10)',
      'Threat Modeling & Risk Assessment',
      'Compliance Verification',
      'Authentication & Authorization',
      'Data Protection & Encryption'
    ],
    useCases: [
      'Audit code for security vulnerabilities',
      'Perform threat modeling',
      'Verify compliance with security standards',
      'Review authentication flows',
      'Assess data protection mechanisms'
    ],
    recommendedFor: [
      'Security audits',
      'Vulnerability scanning',
      'Compliance verification',
      'Authentication review',
      'Data protection assessment'
    ]
  },
  {
    id: 'tech-stack-researcher',
    name: 'Tech Stack Researcher',
    type: 'llm',
    description: 'Research and recommend technology choices for feature development and architecture decisions',
    category: 'engineering',
    capabilities: [
      'research',
      'technology-evaluation',
      'architecture-planning',
      'best-practices',
      'recommendation'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.4,
      systemPrompt: 'You are a technology research specialist. Provide thoroughly researched, practical recommendations for technology choices with clear pros and cons.'
    },
    focusAreas: [
      'Technology Research & Evaluation',
      'Architecture Decision Planning',
      'Best Practices Research',
      'Tool & Library Comparison',
      'Integration Strategy'
    ],
    useCases: [
      'Research technology options for new features',
      'Compare frameworks and libraries',
      'Evaluate architecture patterns',
      'Recommend tech stack choices',
      'Plan feature implementation approaches'
    ],
    recommendedFor: [
      'Feature planning',
      'Technology selection',
      'Architecture decisions',
      'Library evaluation',
      'Implementation strategy'
    ]
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    type: 'analyzer',
    description: 'Optimize system performance through measurement-driven analysis and bottleneck elimination',
    category: 'quality',
    capabilities: [
      'performance-optimization',
      'profiling',
      'benchmarking',
      'critical-path-analysis',
      'resource-optimization'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.2,
      systemPrompt: 'You are a performance engineer. Measure first, optimize second. Focus on data-driven optimizations that impact user experience.'
    },
    focusAreas: [
      'Frontend Performance (Core Web Vitals)',
      'Backend Performance (API Optimization)',
      'Resource Optimization',
      'Critical Path Analysis',
      'Benchmarking & Profiling'
    ],
    useCases: [
      'Profile application performance',
      'Identify performance bottlenecks',
      'Optimize API response times',
      'Improve Core Web Vitals',
      'Reduce resource usage'
    ],
    recommendedFor: [
      'Performance audits',
      'Bottleneck identification',
      'Speed optimization',
      'Resource efficiency',
      'Load time reduction'
    ]
  },
  {
    id: 'refactoring-expert',
    name: 'Refactoring Expert',
    type: 'llm',
    description: 'Improve code quality and reduce technical debt through systematic refactoring and clean code principles',
    category: 'quality',
    capabilities: [
      'code-quality',
      'refactoring',
      'technical-debt-reduction',
      'pattern-application',
      'complexity-reduction'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.3,
      systemPrompt: 'You are a refactoring expert. Simplify relentlessly while preserving functionality. Focus on readability and maintainability.'
    },
    focusAreas: [
      'Code Simplification',
      'Technical Debt Reduction',
      'SOLID Principles Application',
      'Design Pattern Implementation',
      'Quality Metrics Improvement'
    ],
    useCases: [
      'Refactor complex code',
      'Eliminate code duplication',
      'Apply SOLID principles',
      'Reduce cyclomatic complexity',
      'Improve code maintainability'
    ],
    recommendedFor: [
      'Code refactoring',
      'Technical debt reduction',
      'Code quality improvement',
      'Pattern application',
      'Complexity reduction'
    ]
  },
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    type: 'llm',
    description: 'Create clear, comprehensive technical documentation tailored to specific audiences',
    category: 'communication',
    capabilities: [
      'documentation',
      'technical-writing',
      'api-documentation',
      'user-guides',
      'accessibility'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.4,
      systemPrompt: 'You are a technical writer. Write for your audience, prioritize clarity, and always include working examples.'
    },
    focusAreas: [
      'API Documentation',
      'User Guides & Tutorials',
      'Technical Specifications',
      'Troubleshooting Guides',
      'Installation Documentation'
    ],
    useCases: [
      'Write API documentation',
      'Create user guides',
      'Document technical specifications',
      'Write troubleshooting guides',
      'Create installation instructions'
    ],
    recommendedFor: [
      'API documentation',
      'User guide creation',
      'Technical specs',
      'Tutorial writing',
      'Documentation updates'
    ]
  },
  {
    id: 'system-architect',
    name: 'System Architect',
    type: 'llm',
    description: 'Design scalable system architecture with focus on maintainability and long-term technical decisions',
    category: 'engineering',
    capabilities: [
      'system-design',
      'scalability',
      'architecture-patterns',
      'technology-strategy',
      'dependency-management'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.3,
      systemPrompt: 'You are a system architect. Think holistically with 10x growth in mind. Prioritize loose coupling and clear boundaries.'
    },
    focusAreas: [
      'System Design & Component Boundaries',
      'Scalability Architecture',
      'Architectural Patterns',
      'Technology Strategy',
      'Dependency Management'
    ],
    useCases: [
      'Design system architecture',
      'Plan for scalability',
      'Define component boundaries',
      'Evaluate architectural patterns',
      'Guide technology selection'
    ],
    recommendedFor: [
      'System architecture design',
      'Scalability planning',
      'Component design',
      'Technology strategy',
      'Architecture evaluation'
    ]
  },
  {
    id: 'requirements-analyst',
    name: 'Requirements Analyst',
    type: 'llm',
    description: 'Transform ambiguous project ideas into concrete specifications through systematic requirements discovery',
    category: 'analysis',
    capabilities: [
      'requirements-discovery',
      'specification-development',
      'stakeholder-analysis',
      'scope-definition',
      'success-metrics'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.4,
      systemPrompt: 'You are a requirements analyst. Ask "why" before "how". Use systematic questioning to uncover true user needs.'
    },
    focusAreas: [
      'Requirements Discovery',
      'PRD Creation',
      'Stakeholder Analysis',
      'Scope Definition',
      'Success Metrics Definition'
    ],
    useCases: [
      'Analyze project requirements',
      'Create PRDs',
      'Conduct stakeholder analysis',
      'Define project scope',
      'Establish success criteria'
    ],
    recommendedFor: [
      'Project planning',
      'Requirements gathering',
      'PRD creation',
      'Scope definition',
      'Success metrics'
    ]
  },
  {
    id: 'deep-research-agent',
    name: 'Deep Research Agent',
    type: 'analyzer',
    description: 'Specialist for comprehensive research with adaptive strategies and intelligent exploration',
    category: 'analysis',
    capabilities: [
      'research',
      'information-synthesis',
      'multi-hop-reasoning',
      'evidence-management',
      'pattern-recognition'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.3,
      systemPrompt: 'You are a deep research specialist. Think like a research scientist. Apply systematic methodology and follow evidence chains.'
    },
    focusAreas: [
      'Comprehensive Research',
      'Information Synthesis',
      'Multi-Hop Reasoning',
      'Evidence Management',
      'Pattern Recognition'
    ],
    useCases: [
      'Conduct deep research',
      'Synthesize information from multiple sources',
      'Analyze complex topics',
      'Verify information chains',
      'Identify patterns and trends'
    ],
    recommendedFor: [
      'Complex research tasks',
      'Information synthesis',
      'Technical investigation',
      'Pattern analysis',
      'Evidence-based analysis'
    ]
  },
  {
    id: 'learning-guide',
    name: 'Learning Guide',
    type: 'llm',
    description: 'Teach programming concepts and explain code with focus on understanding through progressive learning',
    category: 'communication',
    capabilities: [
      'education',
      'concept-explanation',
      'tutorial-creation',
      'learning-path-design',
      'skill-assessment'
    ],
    config: {
      model: 'claude-sonnet-4',
      temperature: 0.4,
      systemPrompt: 'You are a learning guide. Teach understanding, not memorization. Break complex concepts into digestible steps.'
    },
    focusAreas: [
      'Concept Explanation',
      'Progressive Learning',
      'Tutorial Creation',
      'Learning Path Design',
      'Understanding Verification'
    ],
    useCases: [
      'Explain programming concepts',
      'Create tutorials',
      'Design learning paths',
      'Assess understanding',
      'Provide educational examples'
    ],
    recommendedFor: [
      'Code explanation',
      'Tutorial creation',
      'Educational content',
      'Learning path design',
      'Concept teaching'
    ]
  }
]

/**
 * Get agent template by ID
 */
export function getAgentTemplate(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find(template => template.id === id)
}

/**
 * Get agent templates by category
 */
export function getAgentTemplatesByCategory(category: AgentTemplate['category']): AgentTemplate[] {
  return AGENT_TEMPLATES.filter(template => template.category === category)
}

/**
 * Get agent templates by capability
 */
export function getAgentTemplatesByCapability(capability: string): AgentTemplate[] {
  return AGENT_TEMPLATES.filter(template =>
    template.capabilities.includes(capability)
  )
}

/**
 * Search agent templates by query
 */
export function searchAgentTemplates(query: string): AgentTemplate[] {
  const lowerQuery = query.toLowerCase()
  return AGENT_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery)) ||
    template.focusAreas.some(area => area.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get all unique capabilities across all templates
 */
export function getAllCapabilities(): string[] {
  const capabilities = new Set<string>()
  AGENT_TEMPLATES.forEach(template => {
    template.capabilities.forEach(cap => capabilities.add(cap))
  })
  return Array.from(capabilities).sort()
}

/**
 * Get all categories
 */
export function getAllCategories(): AgentTemplate['category'][] {
  return ['engineering', 'quality', 'analysis', 'communication']
}
