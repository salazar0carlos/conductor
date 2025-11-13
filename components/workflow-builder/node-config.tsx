'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWorkflowStore } from '@/lib/workflow/store';
import { NODE_DEFINITIONS } from '@/lib/workflow/node-definitions';
import { X, Code, FileText, Play, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, panelMode, setPanelMode } = useWorkflowStore();
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingNode, setIsTestingNode] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeDefinition = selectedNode ? NODE_DEFINITIONS[(selectedNode.data as any).nodeType] : null;

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: (selectedNode?.data as any)?.config || {},
  });

  useEffect(() => {
    if (selectedNode) {
      reset((selectedNode.data as any).config);
    }
  }, [selectedNode, reset]);

  const onSubmit = (data: any) => {
    if (selectedNodeId) {
      updateNodeConfig(selectedNodeId, data);
    }
  };

  const handleJsonChange = (value: string | undefined) => {
    if (!value || !selectedNodeId) return;
    try {
      const parsed = JSON.parse(value);
      updateNodeConfig(selectedNodeId, parsed);
      setTestResult(null);
    } catch (error) {
      // Invalid JSON
    }
  };

  const handleTestNode = async () => {
    if (!selectedNode) return;

    setIsTestingNode(true);
    setTestResult(null);

    try {
      // Simulate node test execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTestResult({
        success: true,
        output: {
          message: 'Node executed successfully',
          data: (selectedNode.data as any).config,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTestingNode(false);
    }
  };

  if (!selectedNode || !nodeDefinition) {
    return (
      <div className="w-96 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select a node to configure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${nodeDefinition.color}20` }}
            >
              {nodeDefinition.icon}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{nodeDefinition.label}</h2>
              <p className="text-xs text-gray-500 capitalize">{nodeDefinition.category}</p>
            </div>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600">{nodeDefinition.description}</p>

        {/* Mode Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPanelMode('config')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              panelMode === 'config'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Form
          </button>
          <button
            onClick={() => setPanelMode('json')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              panelMode === 'json'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Code className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {panelMode === 'config' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {nodeDefinition.configSchema.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    {...register(field.key, { required: field.required })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    {...register(field.key, { required: field.required })}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    {...register(field.key, {
                      required: field.required,
                      valueAsNumber: true,
                      min: field.validation?.min,
                      max: field.validation?.max,
                    })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                )}

                {field.type === 'boolean' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(field.key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Enable</span>
                  </label>
                )}

                {field.type === 'select' && (
                  <select
                    {...register(field.key, { required: field.required })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'json' && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <MonacoEditor
                      height="120px"
                      language="json"
                      theme="vs-light"
                      value={JSON.stringify(watch(field.key) || field.default, null, 2)}
                      onChange={(value) => {
                        try {
                          if (value) {
                            setValue(field.key, JSON.parse(value));
                          }
                        } catch (e) {
                          // Invalid JSON
                        }
                      }}
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'off',
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                      }}
                    />
                  </div>
                )}

                {field.type === 'code' && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <MonacoEditor
                      height="120px"
                      language="javascript"
                      theme="vs-light"
                      value={watch(field.key) || ''}
                      onChange={(value) => setValue(field.key, value || '')}
                      options={{
                        minimap: { enabled: false },
                        lineNumbers: 'off',
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                      }}
                    />
                  </div>
                )}

                {field.type === 'cron' && (
                  <div>
                    <input
                      type="text"
                      {...register(field.key, { required: field.required })}
                      placeholder="0 9 * * *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: 0 9 * * * (Every day at 9 AM)
                    </p>
                  </div>
                )}

                {field.type === 'variables' && (
                  <div>
                    <input
                      type="text"
                      {...register(field.key, { required: field.required })}
                      placeholder={field.placeholder || '{{previousNode.output}}'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{{'} and {'}}'}  for variables
                    </p>
                  </div>
                )}

                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Configuration
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <MonacoEditor
                height="400px"
                language="json"
                theme="vs-light"
                value={JSON.stringify((selectedNode.data as any).config, null, 2)}
                onChange={handleJsonChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        )}

        {/* Test Node Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleTestNode}
            disabled={isTestingNode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {isTestingNode ? 'Testing...' : 'Test Node'}
          </button>

          {/* Test Result */}
          {testResult && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      testResult.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {testResult.success ? 'Test Successful' : 'Test Failed'}
                  </p>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(testResult.success ? testResult.output : testResult.error, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
