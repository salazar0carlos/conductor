import { NextRequest, NextResponse } from 'next/server';
import { Node, Edge } from '@xyflow/react';

interface ExecutionContext {
  nodeOutputs: Map<string, any>;
  variables: Map<string, any>;
}

async function executeNode(
  node: Node,
  context: ExecutionContext,
  previousOutputs: Map<string, any>
): Promise<any> {
  const nodeType = node.data.nodeType;
  const config = node.data.config;

  // Simulate node execution based on type
  // In a real implementation, this would call actual APIs/services

  console.log(`Executing node: ${node.id} (${nodeType})`);

  // Replace variables in config with actual values
  const resolvedConfig = resolveVariables(config, context);

  switch (nodeType) {
    // TRIGGERS
    case 'trigger-manual':
      return {
        triggered: true,
        timestamp: new Date().toISOString(),
      };

    case 'trigger-schedule':
      return {
        triggered: true,
        cron: (resolvedConfig as any).cron,
        nextRun: new Date(Date.now() + 86400000).toISOString(),
      };

    case 'trigger-webhook':
      return {
        triggered: true,
        method: (resolvedConfig as any).method,
        payload: {},
      };

    case 'trigger-file-upload':
      return {
        triggered: true,
        file: {
          name: 'example.pdf',
          size: 1024000,
          type: 'application/pdf',
        },
      };

    case 'trigger-email-received':
      return {
        triggered: true,
        from: 'sender@example.com',
        subject: 'Test Email',
        body: 'Email content',
      };

    // ACTIONS
    case 'action-http-request':
      await delay(500); // Simulate API call
      return {
        status: 200,
        statusText: 'OK',
        data: {
          message: 'HTTP request successful',
          url: resolvedConfig.url,
          method: resolvedConfig.method,
        },
        headers: resolvedConfig.headers,
      };

    case 'action-database-query':
      await delay(300);
      return {
        rows: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        rowCount: 2,
      };

    case 'action-ai-generation':
      await delay(1000);
      return {
        model: (resolvedConfig as any).model,
        prompt: resolvedConfig.prompt,
        response: `AI generated response for: ${resolvedConfig.prompt?.slice(0, 50)}...`,
        usage: {
          promptTokens: 100,
          completionTokens: 150,
          totalTokens: 250,
        },
      };

    case 'action-send-email':
      await delay(400);
      return {
        sent: true,
        to: resolvedConfig.to,
        subject: resolvedConfig.subject,
        messageId: `msg-${Date.now()}`,
      };

    case 'action-file-operation':
      await delay(200);
      return {
        operation: (resolvedConfig as any).operation,
        path: resolvedConfig.path,
        success: true,
        content: (resolvedConfig as any).operation === 'read' ? 'File content here' : undefined,
      };

    // LOGIC
    case 'logic-condition':
      const { operator, value1, value2 } = resolvedConfig;
      let conditionResult = false;

      switch (operator) {
        case 'equals':
          conditionResult = value1 === value2;
          break;
        case 'notEquals':
          conditionResult = value1 !== value2;
          break;
        case 'greaterThan':
          conditionResult = Number(value1) > Number(value2);
          break;
        case 'lessThan':
          conditionResult = Number(value1) < Number(value2);
          break;
        case 'contains':
          conditionResult = String(value1).includes(String(value2));
          break;
        case 'isEmpty':
          conditionResult = !value1 || value1.length === 0;
          break;
      }

      return {
        condition: conditionResult,
        operator,
        value1,
        value2,
        branch: conditionResult ? 'true' : 'false',
      };

    case 'logic-loop':
      const items = Array.isArray(resolvedConfig.items) ? resolvedConfig.items : [];
      return {
        items,
        iterations: items.length,
        currentIndex: 0,
      };

    case 'logic-switch':
      const switchValue = resolvedConfig.value;
      const cases = resolvedConfig.cases || [];
      const matchedCase = cases.find((c: any) => c.case === switchValue);
      return {
        value: switchValue,
        matched: matchedCase || null,
        output: matchedCase?.output || 'default',
      };

    case 'logic-delay':
      const duration = (resolvedConfig as any).duration || 1000;
      const unit = (resolvedConfig as any).unit || 'milliseconds';
      let ms = duration;
      if (unit === 'seconds') ms = duration * 1000;
      if (unit === 'minutes') ms = duration * 60000;
      await delay(Math.min(ms, 5000)); // Cap at 5 seconds for testing
      return {
        delayed: true,
        duration: ms,
        unit,
      };

    case 'logic-stop':
      return {
        stopped: true,
        message: (resolvedConfig as any).message || 'Workflow stopped',
      };

    // DATA
    case 'data-transform':
      return {
        transformed: true,
        input: previousOutputs,
        output: resolvedConfig.transformations,
      };

    case 'data-filter':
      const arrayToFilter = resolvedConfig.array || [];
      return {
        input: arrayToFilter,
        output: arrayToFilter.slice(0, Math.ceil(arrayToFilter.length / 2)),
        filtered: Math.floor(arrayToFilter.length / 2),
      };

    case 'data-merge':
      return {
        merged: true,
        strategy: (resolvedConfig as any).strategy,
        result: { ...previousOutputs },
      };

    case 'data-split':
      return {
        split: true,
        splitBy: (resolvedConfig as any).splitBy,
        outputs: [{ part: 1 }, { part: 2 }],
      };

    case 'data-aggregate':
      return {
        operation: (resolvedConfig as any).operation,
        field: (resolvedConfig as any).field,
        result: 42,
      };

    // INTEGRATIONS
    case 'integration-github':
      await delay(500);
      return {
        action: (resolvedConfig as any).action,
        repository: resolvedConfig.repository,
        success: true,
        url: `https://github.com/${resolvedConfig.repository}`,
      };

    case 'integration-slack':
      await delay(400);
      return {
        sent: true,
        channel: resolvedConfig.channel,
        message: resolvedConfig.message,
        timestamp: new Date().toISOString(),
      };

    case 'integration-discord':
      await delay(400);
      return {
        sent: true,
        webhookUrl: '***',
        content: resolvedConfig.content,
      };

    case 'integration-stripe':
      await delay(600);
      return {
        action: (resolvedConfig as any).action,
        success: true,
        id: `obj_${Date.now()}`,
      };

    case 'integration-sendgrid':
      await delay(500);
      return {
        sent: true,
        to: resolvedConfig.to,
        subject: resolvedConfig.subject,
        messageId: `sg-${Date.now()}`,
      };

    default:
      return {
        message: `Executed ${nodeType}`,
        config: resolvedConfig,
      };
  }
}

function resolveVariables(config: any, context: ExecutionContext): any {
  if (typeof config === 'string') {
    // Replace {{variableName}} with actual values
    return config.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
      const value = context.variables.get(varName.trim());
      return value !== undefined ? value : `{{${varName}}}`;
    });
  }

  if (Array.isArray(config)) {
    return config.map((item) => resolveVariables(item, context));
  }

  if (typeof config === 'object' && config !== null) {
    const resolved: any = {};
    for (const [key, value] of Object.entries(config)) {
      resolved[key] = resolveVariables(value, context);
    }
    return resolved;
  }

  return config;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildExecutionOrder(nodes: Node[], edges: Edge[]): Node[] {
  // Topological sort to determine execution order
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize graph
  nodes.forEach((node) => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach((edge) => {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Find starting nodes (triggers with no incoming edges)
  const queue: Node[] = [];
  nodes.forEach((node) => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node);
    }
  });

  const executionOrder: Node[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    executionOrder.push(current);

    const neighbors = graph.get(current.id) || [];
    neighbors.forEach((neighborId) => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);

      if (newDegree === 0) {
        const neighborNode = nodeMap.get(neighborId);
        if (neighborNode) {
          queue.push(neighborNode);
        }
      }
    });
  }

  return executionOrder;
}

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json();

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: 'Invalid nodes data' }, { status: 400 });
    }

    // Build execution order
    const executionOrder = buildExecutionOrder(nodes, edges);

    if (executionOrder.length === 0) {
      return NextResponse.json({ error: 'No executable nodes found' }, { status: 400 });
    }

    // Execute workflow
    const context: ExecutionContext = {
      nodeOutputs: new Map(),
      variables: new Map(),
    };

    const results: any[] = [];

    for (const node of executionOrder) {
      try {
        const startTime = Date.now();

        // Get previous node outputs (inputs for current node)
        const inputEdges = edges.filter((e: Edge) => e.target === node.id);
        const previousOutputs = new Map();
        inputEdges.forEach((edge: Edge) => {
          const output = context.nodeOutputs.get(edge.source);
          if (output) {
            previousOutputs.set(edge.source, output);
            // Store as variables
            context.variables.set(edge.source, output);
          }
        });

        // Execute node
        const output = await executeNode(node, context, previousOutputs);
        const duration = Date.now() - startTime;

        // Store output
        context.nodeOutputs.set(node.id, output);
        context.variables.set(node.id, output);

        results.push({
          nodeId: node.id,
          nodeType: node.data.nodeType,
          status: 'success',
          duration,
          output,
        });

        // Check for stop condition
        if (node.data.nodeType === 'logic-stop') {
          break;
        }
      } catch (error) {
        results.push({
          nodeId: node.id,
          nodeType: node.data.nodeType,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      executionId: `exec-${Date.now()}`,
      nodesExecuted: results.length,
      results,
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow execution failed',
      },
      { status: 500 }
    );
  }
}
