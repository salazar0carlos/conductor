'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, Trash2, Copy, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/lib/workflow/store';

interface CustomNodeData {
  nodeType: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  inputs: number;
  outputs: number;
  config: Record<string, any>;
}

export const CustomNode = memo(({ id, data, selected }: NodeProps<CustomNodeData>) => {
  const { selectNode, deleteNode, duplicateNode, nodeExecutions } = useWorkflowStore();
  const execution = nodeExecutions.get(id);

  const getStatusIcon = () => {
    if (!execution) return null;

    switch (execution.status) {
      case 'running':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBorder = () => {
    if (!execution) return 'border-gray-200';

    switch (execution.status) {
      case 'running':
        return 'border-blue-500 shadow-blue-500/50';
      case 'success':
        return 'border-green-500 shadow-green-500/50';
      case 'error':
        return 'border-red-500 shadow-red-500/50';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-lg border-2 transition-all duration-200
        ${selected ? 'shadow-lg ring-2 ring-blue-500 ring-offset-2' : 'shadow-md hover:shadow-lg'}
        ${getStatusBorder()}
      `}
      style={{ minWidth: 220, maxWidth: 280 }}
      onClick={() => selectNode(id)}
    >
      {/* Input Handles */}
      {data.inputs > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
        />
      )}

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ backgroundColor: `${data.color}10`, borderBottom: `1px solid ${data.color}30` }}
      >
        <span className="text-lg">{data.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{data.label}</h3>
            {getStatusIcon()}
          </div>
          <p className="text-xs text-gray-600 capitalize">{data.category}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-600 line-clamp-2">{data.description}</p>

        {/* Config Preview */}
        {Object.keys(data.config).length > 0 && (
          <div className="mt-2 space-y-1">
            {Object.entries(data.config)
              .slice(0, 2)
              .map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span className="text-gray-900 font-mono truncate block">
                    {typeof value === 'object' ? JSON.stringify(value).slice(0, 30) : String(value).slice(0, 30)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Execution Info */}
        {execution && execution.duration && (
          <div className="mt-2 text-xs text-gray-500">
            Duration: {execution.duration}ms
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            duplicateNode(id);
          }}
          className="p-1 hover:bg-white rounded transition-colors"
          title="Duplicate node"
        >
          <Copy className="w-3 h-3 text-gray-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="p-1 hover:bg-white rounded transition-colors"
          title="Delete node"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-mono">#{id.split('-').pop()?.slice(0, 4)}</span>
      </div>

      {/* Output Handles */}
      {data.outputs > 0 && (
        <>
          {data.outputs === 1 ? (
            <Handle
              type="source"
              position={Position.Right}
              className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
            />
          ) : (
            Array.from({ length: data.outputs }).map((_, i) => (
              <Handle
                key={i}
                type="source"
                position={Position.Right}
                id={`out-${i}`}
                style={{ top: `${((i + 1) * 100) / (data.outputs + 1)}%` }}
                className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors"
              />
            ))
          )}
        </>
      )}

      {/* Error Badge */}
      {execution?.error && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          Error
        </div>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
