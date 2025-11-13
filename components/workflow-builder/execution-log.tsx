'use client';

import React, { useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow/store';
import { format } from 'date-fns';
import {
  ScrollText,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Trash2,
  Filter,
} from 'lucide-react';

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'all';

export function ExecutionLog() {
  const { executionLogs, currentExecution, clearExecution } = useWorkflowStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogLevel>('all');

  const filteredLogs =
    filterLevel === 'all' ? executionLogs : executionLogs.filter((log) => log.level === filterLevel);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLogBg = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getStatusColor = () => {
    if (!currentExecution) return 'bg-gray-500';

    switch (currentExecution.status) {
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDuration = () => {
    if (!currentExecution) return null;

    if (currentExecution.duration) {
      return `${currentExecution.duration}ms`;
    }

    if (currentExecution.startedAt) {
      const duration = Date.now() - new Date(currentExecution.startedAt).getTime();
      return `${duration}ms`;
    }

    return null;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <ScrollText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Execution Logs</h3>

          {currentExecution && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-sm text-gray-600 capitalize">{currentExecution.status}</span>
              {getDuration() && <span className="text-sm text-gray-500">({getDuration()})</span>}
            </div>
          )}

          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
            {filteredLogs.length} logs
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            {['all', 'info', 'success', 'warning', 'error'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level as LogLevel)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors capitalize ${
                  filterLevel === level
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            onClick={clearExecution}
            className="p-1.5 hover:bg-white rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Logs */}
      {isExpanded && (
        <div className="h-64 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ScrollText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No execution logs yet</p>
                <p className="text-xs text-gray-400 mt-1">Run the workflow to see logs</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${getLogBg(log.level)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.level)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{log.message}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                      </span>
                    </div>

                    {log.nodeId && (
                      <p className="text-xs text-gray-600 mt-1 font-mono">Node: {log.nodeId}</p>
                    )}

                    {log.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                          View details
                        </summary>
                        <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded border overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
