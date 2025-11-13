'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Star,
  Search,
  Clock,
  Play,
  Trash2,
  Copy,
  BookmarkPlus,
  Bookmark,
  Filter,
  X
} from 'lucide-react';

interface QueryHistoryProps {
  onSelectQuery: (query: string) => void;
}

interface HistoryItem {
  id: string;
  query: string;
  executed_at: string;
  execution_time?: number;
  success: boolean;
  error?: string;
  saved?: boolean;
  name?: string;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  description?: string;
  created_at: string;
}

type TabView = 'history' | 'saved' | 'templates';

export function QueryHistory({ onSelectQuery }: QueryHistoryProps) {
  const [activeTab, setActiveTab] = useState<TabView>('history');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Built-in query templates
  const templates: SavedQuery[] = [
    {
      id: 't1',
      name: 'Select All',
      query: 'SELECT * FROM table_name LIMIT 100;',
      description: 'Basic SELECT query with limit',
      created_at: new Date().toISOString()
    },
    {
      id: 't2',
      name: 'Count Records',
      query: 'SELECT COUNT(*) as total FROM table_name;',
      description: 'Count total records in a table',
      created_at: new Date().toISOString()
    },
    {
      id: 't3',
      name: 'Find Duplicates',
      query: `SELECT column_name, COUNT(*) as count
FROM table_name
GROUP BY column_name
HAVING COUNT(*) > 1
ORDER BY count DESC;`,
      description: 'Find duplicate values in a column',
      created_at: new Date().toISOString()
    },
    {
      id: 't4',
      name: 'Recent Records',
      query: `SELECT *
FROM table_name
ORDER BY created_at DESC
LIMIT 50;`,
      description: 'Get most recent records',
      created_at: new Date().toISOString()
    },
    {
      id: 't5',
      name: 'Search Pattern',
      query: `SELECT *
FROM table_name
WHERE column_name ILIKE '%search_term%'
LIMIT 100;`,
      description: 'Search for pattern in column (case-insensitive)',
      created_at: new Date().toISOString()
    },
    {
      id: 't6',
      name: 'Join Tables',
      query: `SELECT t1.*, t2.column_name
FROM table1 t1
INNER JOIN table2 t2 ON t1.id = t2.table1_id
LIMIT 100;`,
      description: 'Basic INNER JOIN between two tables',
      created_at: new Date().toISOString()
    },
    {
      id: 't7',
      name: 'Group & Aggregate',
      query: `SELECT
  category,
  COUNT(*) as count,
  AVG(value) as avg_value,
  MAX(value) as max_value
FROM table_name
GROUP BY category
ORDER BY count DESC;`,
      description: 'Group by category with aggregations',
      created_at: new Date().toISOString()
    },
    {
      id: 't8',
      name: 'Table Info',
      query: `SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;`,
      description: 'Get table structure information',
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Load history and saved queries from localStorage
    loadHistory();
    loadSavedQueries();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('sql_query_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadSavedQueries = () => {
    try {
      const stored = localStorage.getItem('sql_saved_queries');
      if (stored) {
        setSavedQueries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved queries:', error);
    }
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'executed_at'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      executed_at: new Date().toISOString()
    };

    const updated = [newItem, ...history].slice(0, 100); // Keep last 100
    setHistory(updated);
    localStorage.setItem('sql_query_history', JSON.stringify(updated));
  };

  const saveQuery = (query: string, name: string, description?: string) => {
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name,
      query,
      description,
      created_at: new Date().toISOString()
    };

    const updated = [...savedQueries, newQuery];
    setSavedQueries(updated);
    localStorage.setItem('sql_saved_queries', JSON.stringify(updated));
  };

  const deleteFromHistory = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('sql_query_history', JSON.stringify(updated));
  };

  const deleteSavedQuery = (id: string) => {
    const updated = savedQueries.filter(item => item.id !== id);
    setSavedQueries(updated);
    localStorage.setItem('sql_saved_queries', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sql_query_history');
  };

  const filteredHistory = history.filter(item =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSaved = savedQueries.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Query Library</h3>
          {activeTab === 'history' && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-3">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
              activeTab === 'history'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Star className="w-4 h-4" />
            Templates
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'history' && (
          <div className="p-2">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No matching queries found' : 'No query history yet'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {!searchTerm && 'Your executed queries will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                          item.success ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words mb-2">
                          {item.query}
                        </pre>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.executed_at)}
                          </span>
                          {item.execution_time && (
                            <span>{item.execution_time}ms</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSelectQuery(item.query)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Run query"
                        >
                          <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(item.query)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Copy query"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteFromHistory(item.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="p-2">
            {filteredSaved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No matching queries found' : 'No saved queries yet'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {!searchTerm && 'Save frequently used queries for quick access'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSaved.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Bookmark className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {item.description}
                          </p>
                        )}
                        <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-900 p-2 rounded">
                          {item.query}
                        </pre>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSelectQuery(item.query)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Run query"
                        >
                          <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(item.query)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Copy query"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteSavedQuery(item.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-2">
            <div className="space-y-1">
              {filteredTemplates.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.description}
                        </p>
                      )}
                      <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-900 p-2 rounded">
                        {item.query}
                      </pre>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelectQuery(item.query)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Use template"
                      >
                        <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.query)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy query"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
