'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WorkflowTemplates } from '@/components/workflow-builder/templates';
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
              <p className="text-gray-600 mt-1">Create and manage your automation workflows</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
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
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Workflows</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.active}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Executions</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.totalExecutions.toLocaleString()}
                  </p>
                </div>
                <Play className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Avg Success Rate</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {stats.avgSuccessRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-600 mb-6">
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
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium ${getStatusBadge(
                          workflow.status
                        )}`}
                      >
                        {getStatusIcon(workflow.status)}
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{workflow.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {workflow.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
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
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Pause">
                        <Pause className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    {workflow.status === 'paused' && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Resume">
                        <Play className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <Link
                      href={`/workflows/builder?id=${workflow.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </Link>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Duplicate">
                      <Copy className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
