'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout, ContentSection } from '@/components/layouts';
import { StatCard } from '@/components/ui/stat-card';
import { WorkflowTemplates } from '@/components/workflow-builder/templates';
import {
  Plus,
  Search,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Workflow as WorkflowIcon,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  lastRun?: string;
  executions: number;
  successRate: number;
  createdAt: string;
  tags: string[];
}

const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: '1',
    name: 'Customer Onboarding',
    description: 'Automated customer onboarding workflow with email notifications and Slack alerts',
    status: 'active',
    lastRun: '2 hours ago',
    executions: 1250,
    successRate: 98.5,
    createdAt: '2024-01-15',
    tags: ['onboarding', 'email', 'slack'],
  },
  {
    id: '2',
    name: 'Daily Sales Report',
    description: 'Generate and send daily sales reports to management team',
    status: 'active',
    lastRun: '8 hours ago',
    executions: 450,
    successRate: 100,
    createdAt: '2024-01-10',
    tags: ['reports', 'sales', 'scheduled'],
  },
  {
    id: '3',
    name: 'Content Moderation',
    description: 'AI-powered content moderation for user submissions',
    status: 'active',
    lastRun: '5 minutes ago',
    executions: 3420,
    successRate: 95.2,
    createdAt: '2024-01-20',
    tags: ['ai', 'moderation'],
  },
  {
    id: '4',
    name: 'Invoice Processing',
    description: 'Process invoices and update accounting system',
    status: 'paused',
    lastRun: '2 days ago',
    executions: 89,
    successRate: 92.1,
    createdAt: '2024-01-08',
    tags: ['invoices', 'accounting'],
  },
  {
    id: '5',
    name: 'Lead Scoring',
    description: 'Score and route leads based on behavior and demographics',
    status: 'draft',
    executions: 0,
    successRate: 0,
    createdAt: '2024-01-22',
    tags: ['leads', 'crm'],
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState(SAMPLE_WORKFLOWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === 'active').length,
    paused: workflows.filter((w) => w.status === 'paused').length,
    draft: workflows.filter((w) => w.status === 'draft').length,
    totalExecutions: workflows.reduce((acc, w) => acc + w.executions, 0),
    avgSuccessRate:
      workflows.reduce((acc, w) => acc + w.successRate, 0) / workflows.length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'draft':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      default:
        return <Edit className="w-3 h-3" />;
    }
  };

  return (
    <DashboardLayout
      title="Workflows"
      subtitle="Create and manage your automation workflows"
      headerActions={
        <>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 border border-neutral-700 text-neutral-300 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Browse Templates
          </button>
          <Link
            href="/workflows/builder"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Workflow
          </Link>
        </>
      }
    >
      {/* Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Workflows" value={stats.total} />
          <StatCard label="Active" value={stats.active} variant="success" />
          <StatCard
            label="Total Executions"
            value={stats.totalExecutions.toLocaleString()}
            variant="primary"
          />
          <StatCard
            label="Avg Success Rate"
            value={`${stats.avgSuccessRate.toFixed(1)}%`}
            variant="success"
          />
        </div>
      </div>

      <ContentSection>
        {/* Filters */}
        <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'active', 'paused', 'draft'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workflows List */}
        {filteredWorkflows.length === 0 ? (
          <div className="border border-neutral-800 rounded-lg p-12 bg-neutral-900/50 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No workflows found</h3>
            <p className="text-neutral-400 mb-6">
              {searchQuery ? 'Try a different search term' : 'Get started by creating your first workflow'}
            </p>
            <Link
              href="/workflows/builder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Workflow
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{workflow.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium ${getStatusBadge(
                          workflow.status
                        )}`}
                      >
                        {getStatusIcon(workflow.status)}
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm mb-3">{workflow.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {workflow.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-neutral-400">
                      {workflow.lastRun && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Last run {workflow.lastRun}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        <span>{workflow.executions.toLocaleString()} executions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{workflow.successRate}% success</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(workflow.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {workflow.status === 'active' && (
                      <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors" title="Pause">
                        <Pause className="w-5 h-5 text-neutral-400" />
                      </button>
                    )}
                    {workflow.status === 'paused' && (
                      <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors" title="Resume">
                        <Play className="w-5 h-5 text-neutral-400" />
                      </button>
                    )}
                    <Link
                      href={`/workflows/builder?id=${workflow.id}`}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5 text-neutral-400" />
                    </Link>
                    <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors" title="Duplicate">
                      <Copy className="w-5 h-5 text-neutral-400" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentSection>

      {/* Templates Modal */}
      {showTemplates && (
        <WorkflowTemplates
          onSelectTemplate={(template) => {
            // Handle template selection
            console.log('Selected template:', template);
            setShowTemplates(false);
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </DashboardLayout>
  );
}
