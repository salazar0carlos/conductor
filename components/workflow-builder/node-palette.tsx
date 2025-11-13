'use client';

import React, { useState, DragEvent } from 'react';
import { NODE_DEFINITIONS, NODE_CATEGORIES } from '@/lib/workflow/node-definitions';
import { Search, ChevronDown, ChevronRight, Package } from 'lucide-react';

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['trigger', 'action', 'logic', 'data', 'integration'])
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = Object.values(NODE_DEFINITIONS).filter(
    (node) =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nodesByCategory = NODE_CATEGORIES.map((category) => ({
    ...category,
    nodes: filteredNodes.filter((node) => node.category === category.id),
  }));

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Node Library</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {nodesByCategory.map((category) => {
          if (category.nodes.length === 0) return null;

          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-semibold text-sm text-gray-900 capitalize">{category.label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.nodes.length}
                  </span>
                </div>
              </button>

              {/* Category Nodes */}
              {isExpanded && (
                <div className="space-y-2 ml-2">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className="group cursor-move p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${node.color}20` }}
                        >
                          {node.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 mb-0.5">{node.label}</h3>
                          <p className="text-xs text-gray-600 line-clamp-2">{node.description}</p>

                          {/* Node Info */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {node.inputs > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                {node.inputs} in
                              </span>
                            )}
                            {node.outputs > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                {node.outputs} out
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Drag Indicator */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Drag</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* No Results */}
        {filteredNodes.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No nodes found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">How to use:</p>
          <ul className="space-y-1 text-gray-500">
            <li>• Drag nodes to the canvas</li>
            <li>• Connect nodes by dragging handles</li>
            <li>• Click nodes to configure them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
