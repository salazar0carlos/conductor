import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { WorkflowNode, WorkflowExecution, ExecutionLog, NodeExecution, WorkflowVersion } from './types';
import { NODE_DEFINITIONS } from './node-definitions';

interface WorkflowStore {
  // Workflow state
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Execution state
  isExecuting: boolean;
  currentExecution: WorkflowExecution | null;
  executionLogs: ExecutionLog[];
  nodeExecutions: Map<string, NodeExecution>;

  // UI state
  isPanelOpen: boolean;
  panelMode: 'config' | 'json';
  isTestMode: boolean;
  zoom: number;

  // Version control
  versions: WorkflowVersion[];
  currentVersion: number;

  // Actions
  setWorkflowId: (id: string) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;

  // Node actions
  addNode: (type: string, position: { x: number; y: number }) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Execution actions
  startExecution: () => Promise<void>;
  stopExecution: () => void;
  addExecutionLog: (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => void;
  updateNodeExecution: (nodeId: string, execution: Partial<NodeExecution>) => void;
  clearExecution: () => void;

  // UI actions
  togglePanel: () => void;
  setPanelMode: (mode: 'config' | 'json') => void;
  setTestMode: (enabled: boolean) => void;
  setZoom: (zoom: number) => void;

  // Version control actions
  saveVersion: (message?: string) => void;
  loadVersion: (versionId: string) => void;

  // Import/Export
  exportWorkflow: () => string;
  importWorkflow: (data: string) => void;

  // Clear all
  clearWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Initial state
  workflowId: null,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  nodes: [],
  edges: [],
  selectedNodeId: null,

  isExecuting: false,
  currentExecution: null,
  executionLogs: [],
  nodeExecutions: new Map(),

  isPanelOpen: false,
  panelMode: 'config',
  isTestMode: false,
  zoom: 1,

  versions: [],
  currentVersion: 0,

  // Actions
  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  setWorkflowDescription: (description) => set({ workflowDescription: description }),

  addNode: (type, position) => {
    const definition = NODE_DEFINITIONS[type];
    if (!definition) return;

    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'custom',
      position,
      data: {
        nodeType: type,
        label: definition.label,
        description: definition.description,
        icon: definition.icon,
        color: definition.color,
        category: definition.category,
        inputs: definition.inputs,
        outputs: definition.outputs,
        config: { ...definition.defaultConfig },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isPanelOpen: true,
    }));
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, animated: true }, state.edges),
    }));
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, isPanelOpen: nodeId !== null });
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node
      ),
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const nodeToDuplicate = state.nodes.find((n) => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newId = `${nodeToDuplicate.data.nodeType}-${Date.now()}`;
    const newNode: Node = {
      ...nodeToDuplicate,
      id: newId,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newId,
    }));
  },

  startExecution: async () => {
    const state = get();

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId: state.workflowId || 'temp',
      status: 'running',
      startedAt: new Date().toISOString(),
      logs: [],
      nodeExecutions: [],
    };

    set({
      isExecuting: true,
      currentExecution: execution,
      executionLogs: [],
      nodeExecutions: new Map(),
    });

    get().addExecutionLog({
      level: 'info',
      message: 'Workflow execution started',
    });

    try {
      // Call the execution API
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: state.nodes,
          edges: state.edges,
        }),
      });

      if (!response.ok) {
        throw new Error('Execution failed');
      }

      const result = await response.json();

      get().addExecutionLog({
        level: 'success',
        message: 'Workflow execution completed successfully',
      });

      set((state) => ({
        currentExecution: state.currentExecution
          ? {
              ...state.currentExecution,
              status: 'success',
              completedAt: new Date().toISOString(),
              duration: Date.now() - new Date(state.currentExecution.startedAt).getTime(),
            }
          : null,
        isExecuting: false,
      }));
    } catch (error) {
      get().addExecutionLog({
        level: 'error',
        message: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      set((state) => ({
        currentExecution: state.currentExecution
          ? {
              ...state.currentExecution,
              status: 'error',
              completedAt: new Date().toISOString(),
            }
          : null,
        isExecuting: false,
      }));
    }
  },

  stopExecution: () => {
    set((state) => ({
      isExecuting: false,
      currentExecution: state.currentExecution
        ? { ...state.currentExecution, status: 'error' }
        : null,
    }));

    get().addExecutionLog({
      level: 'warning',
      message: 'Workflow execution stopped by user',
    });
  },

  addExecutionLog: (log) => {
    const newLog: ExecutionLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      executionLogs: [...state.executionLogs, newLog],
    }));
  },

  updateNodeExecution: (nodeId, execution) => {
    set((state) => {
      const newExecutions = new Map(state.nodeExecutions);
      const current = newExecutions.get(nodeId) || {
        nodeId,
        status: 'pending',
      };
      newExecutions.set(nodeId, { ...current, ...execution });
      return { nodeExecutions: newExecutions };
    });
  },

  clearExecution: () => {
    set({
      currentExecution: null,
      executionLogs: [],
      nodeExecutions: new Map(),
      isExecuting: false,
    });
  },

  togglePanel: () => {
    set((state) => ({ isPanelOpen: !state.isPanelOpen }));
  },

  setPanelMode: (mode) => {
    set({ panelMode: mode });
  },

  setTestMode: (enabled) => {
    set({ isTestMode: enabled });
  },

  setZoom: (zoom) => {
    set({ zoom });
  },

  saveVersion: (message) => {
    const state = get();
    const newVersion: WorkflowVersion = {
      id: `v-${Date.now()}`,
      workflowId: state.workflowId || 'temp',
      version: state.currentVersion + 1,
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
      message,
    };

    set((state) => ({
      versions: [...state.versions, newVersion],
      currentVersion: newVersion.version,
    }));
  },

  loadVersion: (versionId) => {
    const state = get();
    const version = state.versions.find((v) => v.id === versionId);
    if (!version) return;

    set({
      nodes: JSON.parse(JSON.stringify(version.nodes)),
      edges: JSON.parse(JSON.stringify(version.edges)),
      currentVersion: version.version,
    });
  },

  exportWorkflow: () => {
    const state = get();
    return JSON.stringify({
      name: state.workflowName,
      description: state.workflowDescription,
      nodes: state.nodes,
      edges: state.edges,
      version: state.currentVersion,
    }, null, 2);
  },

  importWorkflow: (data) => {
    try {
      const parsed = JSON.parse(data);
      set({
        workflowName: parsed.name || 'Imported Workflow',
        workflowDescription: parsed.description || '',
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        currentVersion: parsed.version || 1,
      });
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  },

  clearWorkflow: () => {
    set({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      nodes: [],
      edges: [],
      selectedNodeId: null,
      currentExecution: null,
      executionLogs: [],
      nodeExecutions: new Map(),
      versions: [],
      currentVersion: 0,
    });
  },
}));
