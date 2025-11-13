'use client';

import React, { useCallback, useMemo, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './custom-node';
import { useWorkflowStore } from '@/lib/workflow/store';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Play,
  Square,
  Download,
  Upload,
  Save,
  Eye,
} from 'lucide-react';

const nodeTypes = {
  custom: CustomNode as any,
};

const edgeOptions = {
  animated: true,
  type: 'smoothstep',
  style: { stroke: '#64748b', strokeWidth: 2 },
};

export function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    isExecuting,
    startExecution,
    stopExecution,
    exportWorkflow,
    saveVersion,
    setZoom,
  } = useWorkflowStore();

  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode]
  );

  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };

  const handleExport = () => {
    const data = exportWorkflow();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveVersion = () => {
    const message = prompt('Enter version message (optional):');
    saveVersion(message || undefined);
  };

  return (
    <div className="relative w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} color="#cbd5e1" />

        <Controls
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="!bg-white !shadow-lg !border !border-gray-200 !rounded-lg"
        />

        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            return data.color || '#64748b';
          }}
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Custom Toolbar */}
        <Panel position="top-left" className="flex items-center gap-2">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleFitView}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Fit View"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* Execution Controls */}
            {!isExecuting ? (
              <button
                onClick={startExecution}
                disabled={nodes.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded transition-colors font-medium"
                title="Start Execution"
              >
                <Play className="w-4 h-4" />
                Execute
              </button>
            ) : (
              <button
                onClick={stopExecution}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors font-medium"
                title="Stop Execution"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}

            <div className="w-px h-6 bg-gray-200" />

            {/* File Operations */}
            <button
              onClick={handleSaveVersion}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Save Version"
            >
              <Save className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Export Workflow"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </Panel>

        {/* Node Count Badge */}
        <Panel position="top-center" className="text-sm bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Grid3x3 className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">{nodes.length}</span>
              <span className="text-gray-500">nodes</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-700">{edges.length}</span>
              <span className="text-gray-500">connections</span>
            </div>
          </div>
        </Panel>

        {/* Empty State */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="mt-20">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Grid3x3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Building Your Workflow</h3>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop nodes from the left sidebar to create your workflow automation
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Space</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Drag</kbd>
                <span>to pan</span>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
