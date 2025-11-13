'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Code,
  Table as TableIcon,
  Link as LinkIcon,
  Filter,
  ArrowUpDown,
  List
} from 'lucide-react';

interface QueryBuilderProps {
  tables: TableInfo[];
  onBuildQuery: (sql: string) => void;
}

interface TableInfo {
  table_name: string;
  columns?: ColumnInfo[];
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface SelectedTable {
  name: string;
  alias: string;
  columns: string[];
}

interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  alias: string;
  condition: string;
}

interface WhereCondition {
  column: string;
  operator: string;
  value: string;
  logicalOp: 'AND' | 'OR';
}

interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export function QueryBuilder({ tables, onBuildQuery }: QueryBuilderProps) {
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [joins, setJoins] = useState<JoinClause[]>([]);
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([]);
  const [orderBy, setOrderBy] = useState<OrderByClause[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [limit, setLimit] = useState<string>('');
  const [distinct, setDistinct] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState('');

  useEffect(() => {
    buildSQL();
  }, [selectedTable, selectedColumns, joins, whereConditions, orderBy, groupBy, limit, distinct]);

  const buildSQL = () => {
    if (!selectedTable) {
      setGeneratedSQL('-- Select a table to start building your query');
      return;
    }

    let sql = 'SELECT ';

    // DISTINCT
    if (distinct) {
      sql += 'DISTINCT ';
    }

    // Columns
    if (selectedColumns.length === 0) {
      sql += '*';
    } else {
      sql += selectedColumns.join(', ');
    }

    // FROM
    sql += `\nFROM ${selectedTable.name}`;
    if (selectedTable.alias) {
      sql += ` AS ${selectedTable.alias}`;
    }

    // JOINs
    joins.forEach(join => {
      sql += `\n${join.type} JOIN ${join.table}`;
      if (join.alias) {
        sql += ` AS ${join.alias}`;
      }
      sql += ` ON ${join.condition}`;
    });

    // WHERE
    if (whereConditions.length > 0) {
      sql += '\nWHERE ';
      sql += whereConditions.map((condition, index) => {
        let clause = '';
        if (index > 0) {
          clause += ` ${condition.logicalOp} `;
        }
        clause += `${condition.column} ${condition.operator} `;

        // Add quotes for string values
        if (condition.operator === 'LIKE' || condition.operator === 'ILIKE') {
          clause += `'%${condition.value}%'`;
        } else if (condition.operator === 'IN') {
          clause += `(${condition.value})`;
        } else if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
          // No value needed
        } else if (isNaN(Number(condition.value))) {
          clause += `'${condition.value}'`;
        } else {
          clause += condition.value;
        }

        return clause;
      }).join('');
    }

    // GROUP BY
    if (groupBy.length > 0) {
      sql += `\nGROUP BY ${groupBy.join(', ')}`;
    }

    // ORDER BY
    if (orderBy.length > 0) {
      sql += '\nORDER BY ' + orderBy.map(o => `${o.column} ${o.direction}`).join(', ');
    }

    // LIMIT
    if (limit) {
      sql += `\nLIMIT ${limit}`;
    }

    sql += ';';
    setGeneratedSQL(sql);
  };

  const handleTableSelect = (tableName: string) => {
    const table = tables.find(t => t.table_name === tableName);
    if (!table) return;

    setSelectedTable({
      name: tableName,
      alias: '',
      columns: []
    });
    setSelectedColumns([]);
    setJoins([]);
    setWhereConditions([]);
    setOrderBy([]);
    setGroupBy([]);
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const addJoin = () => {
    setJoins([
      ...joins,
      {
        type: 'INNER',
        table: '',
        alias: '',
        condition: ''
      }
    ]);
  };

  const updateJoin = (index: number, field: keyof JoinClause, value: string) => {
    const newJoins = [...joins];
    newJoins[index] = { ...newJoins[index], [field]: value };
    setJoins(newJoins);
  };

  const removeJoin = (index: number) => {
    setJoins(joins.filter((_, i) => i !== index));
  };

  const addWhereCondition = () => {
    setWhereConditions([
      ...whereConditions,
      {
        column: '',
        operator: '=',
        value: '',
        logicalOp: 'AND'
      }
    ]);
  };

  const updateWhereCondition = (index: number, field: keyof WhereCondition, value: string) => {
    const newConditions = [...whereConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setWhereConditions(newConditions);
  };

  const removeWhereCondition = (index: number) => {
    setWhereConditions(whereConditions.filter((_, i) => i !== index));
  };

  const addOrderBy = () => {
    setOrderBy([
      ...orderBy,
      {
        column: '',
        direction: 'ASC'
      }
    ]);
  };

  const updateOrderBy = (index: number, field: keyof OrderByClause, value: string) => {
    const newOrderBy = [...orderBy];
    newOrderBy[index] = { ...newOrderBy[index], [field]: value };
    setOrderBy(newOrderBy);
  };

  const removeOrderBy = (index: number) => {
    setOrderBy(orderBy.filter((_, i) => i !== index));
  };

  const handleExportSQL = () => {
    onBuildQuery(generatedSQL);
  };

  const currentTable = tables.find(t => t.table_name === selectedTable?.name);
  const availableColumns = currentTable?.columns || [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Visual Query Builder</h3>
        <button
          onClick={handleExportSQL}
          disabled={!selectedTable}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
        >
          <Code className="w-4 h-4" />
          Export to SQL
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Select Table */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <TableIcon className="w-4 h-4" />
            Select Table
          </label>
          <select
            value={selectedTable?.name || ''}
            onChange={(e) => handleTableSelect(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a table...</option>
            {tables.map(table => (
              <option key={table.table_name} value={table.table_name}>
                {table.table_name}
              </option>
            ))}
          </select>
        </div>

        {selectedTable && (
          <>
            {/* Select Columns */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <List className="w-4 h-4" />
                Select Columns
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.length === 0}
                    onChange={() => setSelectedColumns([])}
                    className="rounded"
                  />
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    * (All columns)
                  </span>
                </label>
                {availableColumns.map(column => (
                  <label
                    key={column.column_name}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.column_name)}
                      onChange={() => handleColumnToggle(column.column_name)}
                      className="rounded"
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {column.column_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {column.data_type}
                    </span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={distinct}
                  onChange={(e) => setDistinct(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">DISTINCT</span>
              </label>
            </div>

            {/* JOINs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <LinkIcon className="w-4 h-4" />
                  JOINs
                </label>
                <button
                  onClick={addJoin}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add JOIN
                </button>
              </div>
              <div className="space-y-2">
                {joins.map((join, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                  >
                    <div className="flex gap-2">
                      <select
                        value={join.type}
                        onChange={(e) => updateJoin(index, 'type', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      >
                        <option value="INNER">INNER JOIN</option>
                        <option value="LEFT">LEFT JOIN</option>
                        <option value="RIGHT">RIGHT JOIN</option>
                        <option value="FULL">FULL JOIN</option>
                      </select>
                      <button
                        onClick={() => removeJoin(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={join.table}
                      onChange={(e) => updateJoin(index, 'table', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    >
                      <option value="">Select table...</option>
                      {tables.map(table => (
                        <option key={table.table_name} value={table.table_name}>
                          {table.table_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={join.condition}
                      onChange={(e) => updateJoin(index, 'condition', e.target.value)}
                      placeholder="ON condition (e.g., table1.id = table2.user_id)"
                      className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* WHERE Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Filter className="w-4 h-4" />
                  WHERE Conditions
                </label>
                <button
                  onClick={addWhereCondition}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Condition
                </button>
              </div>
              <div className="space-y-2">
                {whereConditions.map((condition, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                  >
                    {index > 0 && (
                      <select
                        value={condition.logicalOp}
                        onChange={(e) => updateWhereCondition(index, 'logicalOp', e.target.value)}
                        className="w-24 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <div className="flex gap-2">
                      <select
                        value={condition.column}
                        onChange={(e) => updateWhereCondition(index, 'column', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono"
                      >
                        <option value="">Select column...</option>
                        {availableColumns.map(col => (
                          <option key={col.column_name} value={col.column_name}>
                            {col.column_name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateWhereCondition(index, 'operator', e.target.value)}
                        className="w-32 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                        <option value=">=">{'>='}</option>
                        <option value="<=">{'<='}</option>
                        <option value="LIKE">LIKE</option>
                        <option value="ILIKE">ILIKE</option>
                        <option value="IN">IN</option>
                        <option value="IS NULL">IS NULL</option>
                        <option value="IS NOT NULL">IS NOT NULL</option>
                      </select>
                      <button
                        onClick={() => removeWhereCondition(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {condition.operator !== 'IS NULL' && condition.operator !== 'IS NOT NULL' && (
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateWhereCondition(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GROUP BY */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <List className="w-4 h-4" />
                GROUP BY
              </label>
              <div className="space-y-1">
                {availableColumns.map(column => (
                  <label
                    key={column.column_name}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={groupBy.includes(column.column_name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGroupBy([...groupBy, column.column_name]);
                        } else {
                          setGroupBy(groupBy.filter(c => c !== column.column_name));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {column.column_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ORDER BY */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <ArrowUpDown className="w-4 h-4" />
                  ORDER BY
                </label>
                <button
                  onClick={addOrderBy}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Sort
                </button>
              </div>
              <div className="space-y-2">
                {orderBy.map((order, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={order.column}
                      onChange={(e) => updateOrderBy(index, 'column', e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono"
                    >
                      <option value="">Select column...</option>
                      {availableColumns.map(col => (
                        <option key={col.column_name} value={col.column_name}>
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={order.direction}
                      onChange={(e) => updateOrderBy(index, 'direction', e.target.value)}
                      className="w-24 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    >
                      <option value="ASC">ASC</option>
                      <option value="DESC">DESC</option>
                    </select>
                    <button
                      onClick={() => removeOrderBy(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* LIMIT */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LIMIT
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Number of rows"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
          </>
        )}
      </div>

      {/* Generated SQL Preview */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated SQL
          </span>
        </div>
        <pre className="p-3 bg-gray-900 text-green-400 rounded-lg text-sm font-mono overflow-x-auto">
          {generatedSQL}
        </pre>
      </div>
    </div>
  );
}
