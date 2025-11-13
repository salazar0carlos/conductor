'use client';

import React, { useState, useEffect } from 'react';
import { SQLEditor } from '@/components/database/sql-editor';
import { SchemaExplorer } from '@/components/database/schema-explorer';
import { ResultsTable } from '@/components/database/results-table';
import { QueryBuilder } from '@/components/database/query-builder';
import { QueryHistory } from '@/components/database/query-history';
import {
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles
} from 'lucide-react';

interface TableInfo {
  table_name: string;
  table_type: string;
  row_count: number;
  columns?: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>;
}

interface QueryResult {
  data?: any[];
  error?: string;
  rowCount?: number;
  executionTime?: number;
  explain?: any;
  requiresConfirmation?: boolean;
  dangerousOperation?: string;
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeMode, setActiveMode] = useState<'editor' | 'builder'>('editor');

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('/api/database/schema');
      const data = await response.json();

      if (data.tables) {
        // Fetch columns for each table
        const tablesWithColumns = await Promise.all(
          data.tables.map(async (table: TableInfo) => {
            try {
              const detailsResponse = await fetch(`/api/database/schema?table=${table.table_name}`);
              const details = await detailsResponse.json();
              return {
                ...table,
                columns: details.columns || []
              };
            } catch (error) {
              return table;
            }
          })
        );
        setTables(tablesWithColumns);
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

  const executeQuery = async (
    query: string,
    options: { readOnly: boolean; dryRun: boolean; confirmed?: boolean }
  ) => {
    setIsExecuting(true);
    setCurrentQuery(query);

    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          readOnly: options.readOnly,
          dryRun: options.dryRun,
          confirmed: options.confirmed
        })
      });

      const result = await response.json();
      setQueryResult(result);

      // Add to history if not a dry run and not requiring confirmation
      if (!options.dryRun && !result.requiresConfirmation) {
        addToHistory({
          query,
          success: !result.error,
          error: result.error,
          execution_time: result.executionTime
        });
      }
    } catch (error: any) {
      setQueryResult({
        error: error.message || 'Failed to execute query'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const addToHistory = (item: {
    query: string;
    success: boolean;
    error?: string;
    execution_time?: number;
  }) => {
    try {
      const history = JSON.parse(localStorage.getItem('sql_query_history') || '[]');
      const newItem = {
        ...item,
        id: Date.now().toString(),
        executed_at: new Date().toISOString()
      };
      const updated = [newItem, ...history].slice(0, 100);
      localStorage.setItem('sql_query_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const handleQuickAction = (action: string, tableName: string) => {
    let query = '';

    switch (action) {
      case 'SELECT':
        query = `SELECT * FROM ${tableName} LIMIT 100;`;
        break;
      case 'DESCRIBE':
        query = `SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = '${tableName}'
ORDER BY ordinal_position;`;
        break;
      default:
        return;
    }

    setCurrentQuery(query);
    executeQuery(query, { readOnly: true, dryRun: false });
  };

  const handleSelectQuery = (query: string) => {
    setCurrentQuery(query);
  };

  const handleBuildQuery = (sql: string) => {
    setCurrentQuery(sql);
    setActiveMode('editor');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              SQL Editor
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Query and manage your Supabase database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveMode('editor')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                activeMode === 'editor'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              SQL Editor
            </button>
            <button
              onClick={() => setActiveMode('builder')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                activeMode === 'builder'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Query Builder
              </span>
            </button>
          </div>

          {/* Panel Toggles */}
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={showLeftPanel ? 'Hide schema' : 'Show schema'}
          >
            {showLeftPanel ? (
              <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={showRightPanel ? 'Hide history' : 'Show history'}
          >
            {showRightPanel ? (
              <PanelRightClose className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <PanelRightOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Panel - Schema Explorer */}
        {showLeftPanel && (
          <div className="w-80 flex-shrink-0">
            <SchemaExplorer
              onSelectTable={(tableName) => {
                setCurrentQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
              }}
              onQuickAction={handleQuickAction}
            />
          </div>
        )}

        {/* Center Panel - Editor/Builder and Results */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Editor or Query Builder */}
          <div className="h-1/2">
            {activeMode === 'editor' ? (
              <SQLEditor
                onExecute={executeQuery}
                schema={tables}
                isExecuting={isExecuting}
                lastResult={queryResult || undefined}
              />
            ) : (
              <QueryBuilder
                tables={tables}
                onBuildQuery={handleBuildQuery}
              />
            )}
          </div>

          {/* Results */}
          <div className="flex-1">
            <ResultsTable
              data={queryResult?.data || []}
              error={queryResult?.error}
              executionTime={queryResult?.executionTime}
              isLoading={isExecuting}
            />
          </div>
        </div>

        {/* Right Panel - Query History */}
        {showRightPanel && (
          <div className="w-80 flex-shrink-0">
            <QueryHistory onSelectQuery={handleSelectQuery} />
          </div>
        )}
      </div>
    </div>
  );
}
