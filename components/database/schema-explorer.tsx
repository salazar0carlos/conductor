'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  ChevronRight,
  ChevronDown,
  Key,
  Link as LinkIcon,
  Hash,
  Type,
  Calendar,
  CheckSquare,
  FileText,
  Trash2,
  Eye,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface SchemaExplorerProps {
  onSelectTable: (tableName: string) => void;
  onQuickAction: (action: string, tableName: string) => void;
}

interface TableInfo {
  table_name: string;
  table_type: string;
  row_count: number;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface TableDetails {
  table_name: string;
  columns: ColumnInfo[];
  primary_keys: Array<{ column_name: string }>;
  foreign_keys: Array<{
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>;
  indexes: Array<{
    indexname: string;
    indexdef: string;
  }>;
}

export function SchemaExplorer({ onSelectTable, onQuickAction }: SchemaExplorerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [tableDetails, setTableDetails] = useState<Map<string, TableDetails>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/schema');
      const data = await response.json();

      if (data.tables) {
        setTables(data.tables);
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableDetails = async (tableName: string) => {
    if (tableDetails.has(tableName)) return;

    try {
      setLoadingTable(tableName);
      const response = await fetch(`/api/database/schema?table=${tableName}`);
      const data = await response.json();

      if (data) {
        setTableDetails(prev => new Map(prev).set(tableName, data));
      }
    } catch (error) {
      console.error('Failed to fetch table details:', error);
    } finally {
      setLoadingTable(null);
    }
  };

  const toggleTable = async (tableName: string) => {
    const newExpanded = new Set(expandedTables);

    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
      await fetchTableDetails(tableName);
    }

    setExpandedTables(newExpanded);
  };

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    onSelectTable(tableName);
  };

  const getDataTypeIcon = (dataType: string) => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
      return <Hash className="w-4 h-4 text-blue-500" />;
    }
    if (type.includes('char') || type.includes('text')) {
      return <Type className="w-4 h-4 text-green-500" />;
    }
    if (type.includes('date') || type.includes('time')) {
      return <Calendar className="w-4 h-4 text-purple-500" />;
    }
    if (type.includes('bool')) {
      return <CheckSquare className="w-4 h-4 text-orange-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Schema</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({tables.length} tables)
          </span>
        </div>
        <button
          onClick={fetchSchema}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Refresh schema"
        >
          <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No tables found</p>
          </div>
        ) : (
          <div className="p-2">
            {tables.map((table) => {
              const isExpanded = expandedTables.has(table.table_name);
              const details = tableDetails.get(table.table_name);
              const isLoading = loadingTable === table.table_name;
              const isSelected = selectedTable === table.table_name;

              return (
                <div key={table.table_name} className="mb-1">
                  {/* Table Header */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleTable(table.table_name)}
                      className="flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    <Table className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />

                    <div
                      className="flex-1 min-w-0"
                      onClick={() => handleTableClick(table.table_name)}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {table.table_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {table.row_count.toLocaleString()} rows
                      </div>
                    </div>

                    {isLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAction('SELECT', table.table_name);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="SELECT *"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAction('DESCRIBE', table.table_name);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Describe table"
                      >
                        <Info className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Table Details */}
                  {isExpanded && details && (
                    <div className="ml-6 mt-1 space-y-1">
                      {details.columns.map((column) => {
                        const isPrimaryKey = details.primary_keys.some(
                          pk => pk.column_name === column.column_name
                        );
                        const foreignKey = details.foreign_keys.find(
                          fk => fk.column_name === column.column_name
                        );

                        return (
                          <div
                            key={column.column_name}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors"
                          >
                            {getDataTypeIcon(column.data_type)}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-gray-900 dark:text-white truncate">
                                  {column.column_name}
                                </span>
                                {isPrimaryKey && (
                                  <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" title="Primary Key" />
                                )}
                                {foreignKey && (
                                  <LinkIcon
                                    className="w-3 h-3 text-blue-500 flex-shrink-0"
                                    title={`Foreign key to ${foreignKey.foreign_table_name}.${foreignKey.foreign_column_name}`}
                                  />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {column.data_type}
                                {column.character_maximum_length && `(${column.character_maximum_length})`}
                                {column.is_nullable === 'NO' && ' • NOT NULL'}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {details.indexes.length > 0 && (
                        <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                          {details.indexes.length} index(es)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
