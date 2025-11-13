'use client'

import { useState } from 'react'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  GitBranch,
  Plus,
  X,
  CheckCircle2,
  Shield,
  Zap,
  FileText,
  Rocket,
  Settings,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface WorkflowPhase {
  id: string
  name: string
  description: string
  icon: string
  qualityGates: string[]
  requiredAgents: string[]
}

const AVAILABLE_PHASES: WorkflowPhase[] = [
  {
    id: 'requirements',
    name: 'Requirements',
    description: 'Gather and analyze project requirements',
    icon: '📋',
    qualityGates: ['requirements_document', 'stakeholder_approval'],
    requiredAgents: ['requirements-analyst']
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'Design system architecture and technical approach',
    icon: '🏗️',
    qualityGates: ['architecture_diagram', 'tech_stack_approved'],
    requiredAgents: ['system-architect']
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Implement features and functionality',
    icon: '💻',
    qualityGates: ['code_complete', 'code_review_passed'],
    requiredAgents: ['backend-architect', 'frontend-architect']
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security audit and vulnerability assessment',
    icon: '🔒',
    qualityGates: ['security_audit', 'vulnerability_scan', 'auth_review'],
    requiredAgents: ['security-engineer']
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Performance optimization and load testing',
    icon: '⚡',
    qualityGates: ['performance_benchmarks', 'load_testing'],
    requiredAgents: ['performance-engineer']
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Comprehensive testing and quality assurance',
    icon: '🧪',
    qualityGates: ['unit_tests', 'integration_tests', 'e2e_tests'],
    requiredAgents: ['test-engineer']
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Create user and technical documentation',
    icon: '📚',
    qualityGates: ['api_docs', 'user_docs', 'deployment_guide'],
    requiredAgents: ['technical-writer']
  },
  {
    id: 'deployment_prep',
    name: 'Deployment Prep',
    description: 'Prepare for production deployment',
    icon: '🚀',
    qualityGates: ['build_success', 'env_config', 'deployment_checklist'],
    requiredAgents: ['backend-architect', 'system-architect']
  },
  {
    id: 'final_review',
    name: 'Final Review',
    description: 'Final review and sign-off',
    icon: '✅',
    qualityGates: ['all_phases_complete', 'stakeholder_signoff'],
    requiredAgents: ['system-architect']
  }
]

const QUALITY_GATES = {
  // Requirements
  requirements_document: 'Requirements Document',
  stakeholder_approval: 'Stakeholder Approval',

  // Architecture
  architecture_diagram: 'Architecture Diagram',
  tech_stack_approved: 'Tech Stack Approved',

  // Development
  code_complete: 'Code Complete',
  code_review_passed: 'Code Review Passed',
  linting_passed: 'Linting Passed',
  type_checking_passed: 'Type Checking Passed',

  // Security
  security_audit: 'Security Audit',
  vulnerability_scan: 'Vulnerability Scan',
  auth_review: 'Authentication Review',
  data_privacy: 'Data Privacy Review',

  // Performance
  performance_benchmarks: 'Performance Benchmarks',
  load_testing: 'Load Testing',
  bundle_size: 'Bundle Size Check',

  // Testing
  unit_tests: 'Unit Tests (>80% coverage)',
  integration_tests: 'Integration Tests',
  e2e_tests: 'End-to-End Tests',

  // Documentation
  api_docs: 'API Documentation',
  user_docs: 'User Documentation',
  deployment_guide: 'Deployment Guide',

  // Deployment
  build_success: 'Build Success',
  env_config: 'Environment Configuration',
  deployment_checklist: 'Deployment Checklist',

  // Final
  all_phases_complete: 'All Phases Complete',
  stakeholder_signoff: 'Stakeholder Sign-off'
}

export default function NewWorkflowPage() {
  const router = useRouter()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [selectedPhases, setSelectedPhases] = useState<string[]>([])
  const [selectedGates, setSelectedGates] = useState<Record<string, string[]>>({})
  const [creating, setCreating] = useState(false)

  const togglePhase = (phaseId: string) => {
    if (selectedPhases.includes(phaseId)) {
      // Remove phase
      setSelectedPhases(selectedPhases.filter(id => id !== phaseId))
      const newGates = { ...selectedGates }
      delete newGates[phaseId]
      setSelectedGates(newGates)
    } else {
      // Add phase with default gates
      setSelectedPhases([...selectedPhases, phaseId])
      const phase = AVAILABLE_PHASES.find(p => p.id === phaseId)
      if (phase) {
        setSelectedGates({
          ...selectedGates,
          [phaseId]: [...phase.qualityGates]
        })
      }
    }
  }

  const toggleGate = (phaseId: string, gate: string) => {
    const currentGates = selectedGates[phaseId] || []
    if (currentGates.includes(gate)) {
      setSelectedGates({
        ...selectedGates,
        [phaseId]: currentGates.filter(g => g !== gate)
      })
    } else {
      setSelectedGates({
        ...selectedGates,
        [phaseId]: [...currentGates, gate]
      })
    }
  }

  const handleCreate = async () => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title')
      return
    }

    if (selectedPhases.length === 0) {
      toast.error('Please select at least one workflow phase')
      return
    }

    setCreating(true)

    try {
      // Create the task first
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          type: 'automated_workflow'
        })
      })

      if (!taskResponse.ok) {
        throw new Error('Failed to create task')
      }

      const taskData = await taskResponse.json()
      const taskId = taskData.data.id

      // Create workflow instance
      const workflowResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          phases: selectedPhases,
          quality_gates: selectedGates
        })
      })

      if (!workflowResponse.ok) {
        throw new Error('Failed to create workflow')
      }

      toast.success('Workflow created successfully!')
      router.push(`/tasks/${taskId}`)
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create workflow')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Nav />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/automation">
                <Button variant="ghost" size="sm">← Back</Button>
              </Link>
              <h1 className="text-3xl font-bold text-white">Create Workflow</h1>
            </div>
            <p className="text-neutral-400">Design a custom automation workflow for your task</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Task Details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g., Build user authentication system"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe what this workflow should accomplish..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Phase Selection */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Workflow Phases</h2>
              <p className="text-sm text-neutral-400 mb-4">
                Select the phases that apply to your workflow. Click to expand and customize quality gates.
              </p>

              <div className="space-y-3">
                {AVAILABLE_PHASES.map((phase) => {
                  const isSelected = selectedPhases.includes(phase.id)
                  const gates = selectedGates[phase.id] || []

                  return (
                    <div
                      key={phase.id}
                      className={`border rounded-lg transition-all ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/5'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => togglePhase(phase.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{phase.icon}</span>
                            <div>
                              <h3 className="font-medium text-white">{phase.name}</h3>
                              <p className="text-sm text-neutral-400">{phase.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {phase.requiredAgents.length} agent{phase.requiredAgents.length !== 1 ? 's' : ''}
                            </Badge>
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Plus className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="border-t border-neutral-700 p-4 bg-neutral-900/50">
                          <p className="text-xs font-medium text-neutral-400 mb-2">Quality Gates</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(QUALITY_GATES)
                              .filter(([key]) => phase.qualityGates.includes(key))
                              .map(([key, label]) => (
                                <button
                                  key={key}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleGate(phase.id, key)
                                  }}
                                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                                    gates.includes(key)
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-600'
                                  }`}
                                >
                                  {gates.includes(key) && '✓ '}
                                  {label}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Workflow Summary */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-4">Workflow Summary</h2>

              <div className="space-y-4">
                {/* Phases */}
                <div>
                  <p className="text-xs font-medium text-neutral-400 mb-2">Selected Phases</p>
                  {selectedPhases.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic">No phases selected</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPhases.map((phaseId, index) => {
                        const phase = AVAILABLE_PHASES.find(p => p.id === phaseId)
                        if (!phase) return null

                        return (
                          <div key={phaseId} className="flex items-center gap-2">
                            <span className="text-neutral-500 text-xs">{index + 1}.</span>
                            <span className="text-lg">{phase.icon}</span>
                            <span className="text-sm text-white">{phase.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-700">
                  <div>
                    <p className="text-xs text-neutral-400">Phases</p>
                    <p className="text-2xl font-bold text-white">{selectedPhases.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Quality Gates</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(selectedGates).flat().length}
                    </p>
                  </div>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreate}
                  disabled={creating || !taskTitle.trim() || selectedPhases.length === 0}
                  className="w-full gap-2 mt-4"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <GitBranch className="w-4 h-4" />
                      Create Workflow
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-400 mb-2">💡 Pro Tip</h3>
              <p className="text-xs text-neutral-300">
                Select only the phases relevant to your task. Each phase will be executed sequentially
                with quality gates ensuring standards are met before proceeding.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
