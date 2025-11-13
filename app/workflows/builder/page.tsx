'use client';

import React, { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '@/components/workflow-builder/canvas';
import { NodePalette } from '@/components/workflow-builder/node-palette';
import { NodeConfigPanel } from '@/components/workflow-builder/node-config';
import { ExecutionLog } from '@/components/workflow-builder/execution-log';
import { useWorkflowStore } from '@/lib/workflow/store';
import {
  Settings,
  History,
  Share2,
  Download,
  Upload,
  FolderOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function WorkflowBuilderPage() {
  const {
    workflowName,
    setWorkflowName,
    workflowDescription,
    setWorkflowDescription,
    exportWorkflow,
    importWorkflow,
    versions,
    loadVersion,
    isPanelOpen,
    togglePanel,
  } = useWorkflowStore();

  const [showVersions, setShowVersions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          importWorkflow(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Workflow name"
              />
              <p className="text-xs text-gray-500">Workflow Builder</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Version History"
          >
            <History className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Versions ({versions.length})</span>
          </button>

          <div className="w-px h-6 bg-gray-200" />

          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Import Workflow"
          >
            <Upload className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Import</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <NodePalette />

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <WorkflowCanvas />
          </ReactFlowProvider>

          {/* Execution Log - Overlay at bottom */}
          <ExecutionLog />
        </div>

        {/* Right Panel - Node Configuration */}
        {isPanelOpen && <NodeConfigPanel />}

        {/* Version History Panel */}
        {showVersions && (
          <div className="absolute right-4 top-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30 max-h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Version History</h3>
                <button
                  onClick={() => setShowVersions(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-xs text-gray-600">View and restore previous versions</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No versions saved yet</p>
                  <p className="text-xs text-gray-400 mt-1">Save versions from the toolbar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions
                    .slice()
                    .reverse()
                    .map((version) => (
                      <div
                        key={version.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                        onClick={() => {
                          loadVersion(version.id);
                          setShowVersions(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">Version {version.version}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(version.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {version.message && <p className="text-xs text-gray-600 mb-2">{version.message}</p>}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{version.nodes.length} nodes</span>
                          <span>{version.edges.length} connections</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute right-4 top-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-30 max-h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Workflow Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Workflow Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="Enter workflow name"
                />
              </div>

              {/* Workflow Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Describe what this workflow does..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="automation, api, integration"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
              </div>

              {/* Error Handling */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Handling
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-700">Retry failed nodes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Continue on error</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-700">Send error notifications</span>
                  </label>
                </div>
              </div>

              {/* Retry Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  defaultValue={3}
                  min={0}
                  max={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  defaultValue={300}
                  min={10}
                  max={3600}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Publish */}
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Publish Workflow
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Published workflows can be shared and executed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
