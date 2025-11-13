'use client';

import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Play, Loader2, Save, Copy, FileText, Settings, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface SQLEditorProps {
  onExecute: (query: string, options: ExecuteOptions) => Promise<void>;
  schema?: SchemaTable[];
  isExecuting?: boolean;
  lastResult?: QueryResult;
}

interface ExecuteOptions {
  readOnly: boolean;
  dryRun: boolean;
  confirmed?: boolean;
}

interface SchemaTable {
  table_name: string;
  columns?: Array<{ column_name: string; data_type: string }>;
}

interface QueryResult {
  data?: any[];
  error?: string;
  executionTime?: number;
  requiresConfirmation?: boolean;
  dangerousOperation?: string;
}

interface QueryTab {
  id: string;
  name: string;
  query: string;
}

export function SQLEditor({ onExecute, schema = [], isExecuting = false, lastResult }: SQLEditorProps) {
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'Query 1', query: '-- Write your SQL query here\nSELECT * FROM your_table LIMIT 10;' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const editorRef = useRef<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>('');

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  useEffect(() => {
    if (lastResult?.requiresConfirmation) {
      setShowConfirmation(true);
      setPendingQuery(activeTab?.query || '');
    }
  }, [lastResult]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure SQL language features
    monaco.languages.setLanguageConfiguration('sql', {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['(', ')'],
        ['[', ']']
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: "'", close: "'" },
        { open: '"', close: '"' }
      ]
    });

    // Add autocomplete for table and column names
    if (schema.length > 0) {
      monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: (model: any, position: any) => {
          const suggestions: any[] = [];

          // Add table names
          schema.forEach(table => {
            suggestions.push({
              label: table.table_name,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: table.table_name,
              detail: 'Table'
            });

            // Add column names for each table
            table.columns?.forEach(column => {
              suggestions.push({
                label: `${table.table_name}.${column.column_name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column.column_name,
                detail: `${table.table_name} - ${column.data_type}`
              });
            });
          });

          // Add SQL keywords
          const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
            'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO',
            'UPDATE', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
            'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
            'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT', 'AS'
          ];

          keywords.forEach(keyword => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword
            });
          });

          return { suggestions };
        }
      });
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecute(false);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      handleFormat();
    });
  };

  const handleQueryChange = (value: string | undefined) => {
    if (!value) return;
    setTabs(prev =>
      prev.map(tab =>
        tab.id === activeTabId ? { ...tab, query: value } : tab
      )
    );
  };

  const handleExecute = async (dryRun: boolean = false) => {
    const query = activeTab?.query || '';
    if (!query.trim()) return;

    await onExecute(query, {
      readOnly: readOnlyMode,
      dryRun
    });
  };

  const handleConfirmedExecute = async () => {
    if (!pendingQuery.trim()) return;

    await onExecute(pendingQuery, {
      readOnly: false,
      dryRun: false,
      confirmed: true
    });

    setShowConfirmation(false);
    setPendingQuery('');
  };

  const handleFormat = () => {
    if (!activeTab) return;
    try {
      const formatted = format(activeTab.query, {
        language: 'postgresql'
      });
      setTabs(prev =>
        prev.map(tab =>
          tab.id === activeTabId ? { ...tab, query: formatted } : tab
        )
      );
    } catch (error) {
      console.error('Failed to format query:', error);
    }
  };

  const handleCopy = () => {
    if (activeTab) {
      navigator.clipboard.writeText(activeTab.query);
    }
  };

  const addNewTab = () => {
    const newId = String(tabs.length + 1);
    const newTab = {
      id: newId,
      name: `Query ${newId}`,
      query: '-- Write your SQL query here\n'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Confirmation Dialog */}
      {showConfirmation && lastResult?.requiresConfirmation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirm Dangerous Operation
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You are about to execute a <strong>{lastResult.dangerousOperation}</strong> operation.
                  This action may modify or delete data. Are you sure you want to continue?
                </p>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono text-gray-800 dark:text-gray-200 mb-4 max-h-32 overflow-auto">
                  {pendingQuery}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setPendingQuery('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmedExecute}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Confirm & Execute
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExecute(false)}
            disabled={isExecuting}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run (⌘↵)
              </>
            )}
          </button>

          <button
            onClick={() => handleExecute(true)}
            disabled={isExecuting}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            Explain
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

          <button
            onClick={handleFormat}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Format SQL (⌘⇧F)"
          >
            <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy query"
          >
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={readOnlyMode}
              onChange={(e) => setReadOnlyMode(e.target.checked)}
              className="rounded"
            />
            Read-only mode
          </label>

          <button
            onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Toggle theme"
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer transition-colors ${
              tab.id === activeTabId
                ? 'bg-white dark:bg-gray-900 border-t border-x border-gray-200 dark:border-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="text-sm">{tab.name}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <XCircle className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addNewTab}
          className="px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          + New Tab
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language="sql"
          theme={editorTheme}
          value={activeTab?.query || ''}
          onChange={handleQueryChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            suggest: {
              showKeywords: true,
              showSnippets: true
            }
          }}
        />
      </div>
    </div>
  );
}
