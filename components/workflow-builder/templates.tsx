'use client';

import React, { useState } from 'react';
import { WorkflowTemplate } from '@/lib/workflow/types';
import { Search, Star, Download, Eye } from 'lucide-react';

const SAMPLE_TEMPLATES: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Email to Slack Notification',
    description: 'Automatically post email summaries to Slack when important emails arrive',
    category: 'Communication',
    tags: ['email', 'slack', 'notification'],
    usageCount: 1250,
    nodes: [],
    edges: [],
  },
  {
    id: '2',
    name: 'GitHub Issue to Discord',
    description: 'Send Discord notifications when new GitHub issues are created',
    category: 'Integration',
    tags: ['github', 'discord', 'notifications'],
    usageCount: 890,
    nodes: [],
    edges: [],
  },
  {
    id: '3',
    name: 'Daily Report Generator',
    description: 'Generate and email daily reports from database queries',
    category: 'Reports',
    tags: ['database', 'email', 'schedule'],
    usageCount: 654,
    nodes: [],
    edges: [],
  },
  {
    id: '4',
    name: 'AI Content Moderator',
    description: 'Use AI to moderate user-generated content and flag inappropriate items',
    category: 'AI',
    tags: ['ai', 'moderation', 'automation'],
    usageCount: 432,
    nodes: [],
    edges: [],
  },
  {
    id: '5',
    name: 'File Processing Pipeline',
    description: 'Process uploaded files through validation, transformation, and storage',
    category: 'Data',
    tags: ['files', 'processing', 'storage'],
    usageCount: 321,
    nodes: [],
    edges: [],
  },
  {
    id: '6',
    name: 'Payment to CRM Sync',
    description: 'Sync Stripe payments to CRM and send confirmation emails',
    category: 'E-commerce',
    tags: ['stripe', 'crm', 'payments'],
    usageCount: 567,
    nodes: [],
    edges: [],
  },
];

const CATEGORIES = ['All', 'Communication', 'Integration', 'Reports', 'AI', 'Data', 'E-commerce'];

interface TemplatesProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
  onClose: () => void;
}

export function WorkflowTemplates({ onSelectTemplate, onClose }: TemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = SAMPLE_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Workflow Templates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Start with a pre-built template and customize it to your needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No templates found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {template.category}
                      </span>
                    </div>
                    <Star className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 transition-colors" />
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Download className="w-3 h-3" />
                      <span>{template.usageCount.toLocaleString()} uses</span>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100">
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Start from Scratch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
