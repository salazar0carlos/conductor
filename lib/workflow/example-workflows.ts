import { WorkflowTemplate } from './types';

export const EXAMPLE_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: 'example-1',
    name: 'Simple HTTP Request',
    description: 'Manual trigger that makes an HTTP request and logs the response',
    category: 'Getting Started',
    tags: ['http', 'api', 'beginner'],
    usageCount: 0,
    nodes: [
      {
        id: 'trigger-manual-1',
        type: 'trigger-manual',
        category: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: 'Manual Trigger',
          description: 'Start workflow manually',
          config: {
            buttonLabel: 'Start Request',
            requireConfirmation: false,
          },
        },
      },
      {
        id: 'action-http-request-1',
        type: 'action-http-request',
        category: 'action',
        position: { x: 400, y: 200 },
        data: {
          label: 'HTTP Request',
          description: 'Make HTTP API request',
          config: {
            method: 'GET',
            url: 'https://api.github.com/repos/facebook/react',
            headers: {
              'Accept': 'application/json',
            },
            body: {},
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'trigger-manual-1',
        target: 'action-http-request-1',
        animated: true,
      },
    ],
  },
  {
    id: 'example-2',
    name: 'Conditional Email Notification',
    description: 'Check a condition and send email if true',
    category: 'Communication',
    tags: ['email', 'condition', 'logic'],
    usageCount: 0,
    nodes: [
      {
        id: 'trigger-manual-1',
        type: 'trigger-manual',
        category: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: 'Manual Trigger',
          description: 'Start workflow',
          config: {
            buttonLabel: 'Check & Notify',
            requireConfirmation: false,
          },
        },
      },
      {
        id: 'logic-condition-1',
        type: 'logic-condition',
        category: 'logic',
        position: { x: 400, y: 200 },
        data: {
          label: 'Condition',
          description: 'Check if value is greater than 100',
          config: {
            operator: 'greaterThan',
            value1: '150',
            value2: '100',
          },
        },
      },
      {
        id: 'action-send-email-1',
        type: 'action-send-email',
        category: 'action',
        position: { x: 700, y: 150 },
        data: {
          label: 'Send Email',
          description: 'Send success notification',
          config: {
            to: 'user@example.com',
            subject: 'Condition Met',
            body: 'The value exceeded 100!',
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'trigger-manual-1',
        target: 'logic-condition-1',
        animated: true,
      },
      {
        id: 'edge-2',
        source: 'logic-condition-1',
        target: 'action-send-email-1',
        sourceHandle: 'out-0',
        animated: true,
        label: 'true',
      },
    ],
  },
  {
    id: 'example-3',
    name: 'Data Transformation Pipeline',
    description: 'Fetch data, transform it, and filter results',
    category: 'Data Processing',
    tags: ['data', 'transform', 'filter'],
    usageCount: 0,
    nodes: [
      {
        id: 'trigger-manual-1',
        type: 'trigger-manual',
        category: 'trigger',
        position: { x: 100, y: 250 },
        data: {
          label: 'Manual Trigger',
          description: 'Start pipeline',
          config: {
            buttonLabel: 'Process Data',
            requireConfirmation: false,
          },
        },
      },
      {
        id: 'action-http-request-1',
        type: 'action-http-request',
        category: 'action',
        position: { x: 400, y: 250 },
        data: {
          label: 'Fetch Data',
          description: 'Get data from API',
          config: {
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/users',
            headers: {},
            body: {},
          },
        },
      },
      {
        id: 'data-transform-1',
        type: 'data-transform',
        category: 'data',
        position: { x: 700, y: 250 },
        data: {
          label: 'Transform',
          description: 'Transform data structure',
          config: {
            transformations: {
              users: '{{response.data}}',
              count: '{{response.data.length}}',
            },
          },
        },
      },
      {
        id: 'data-filter-1',
        type: 'data-filter',
        category: 'data',
        position: { x: 1000, y: 250 },
        data: {
          label: 'Filter',
          description: 'Filter active users',
          config: {
            array: '{{users}}',
            condition: 'user.active === true',
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'trigger-manual-1',
        target: 'action-http-request-1',
        animated: true,
      },
      {
        id: 'edge-2',
        source: 'action-http-request-1',
        target: 'data-transform-1',
        animated: true,
      },
      {
        id: 'edge-3',
        source: 'data-transform-1',
        target: 'data-filter-1',
        animated: true,
      },
    ],
  },
  {
    id: 'example-4',
    name: 'Scheduled Report Generator',
    description: 'Daily scheduled workflow that generates and emails reports',
    category: 'Automation',
    tags: ['schedule', 'report', 'email'],
    usageCount: 0,
    nodes: [
      {
        id: 'trigger-schedule-1',
        type: 'trigger-schedule',
        category: 'trigger',
        position: { x: 100, y: 250 },
        data: {
          label: 'Schedule',
          description: 'Daily at 9 AM',
          config: {
            cron: '0 9 * * *',
            timezone: 'UTC',
            enabled: true,
          },
        },
      },
      {
        id: 'action-database-query-1',
        type: 'action-database-query',
        category: 'action',
        position: { x: 400, y: 250 },
        data: {
          label: 'Query Database',
          description: 'Fetch daily statistics',
          config: {
            operation: 'select',
            query: 'SELECT * FROM daily_stats WHERE date = CURRENT_DATE',
            parameters: [],
          },
        },
      },
      {
        id: 'data-aggregate-1',
        type: 'data-aggregate',
        category: 'data',
        position: { x: 700, y: 250 },
        data: {
          label: 'Aggregate',
          description: 'Calculate totals',
          config: {
            operation: 'sum',
            field: 'revenue',
          },
        },
      },
      {
        id: 'action-send-email-1',
        type: 'action-send-email',
        category: 'action',
        position: { x: 1000, y: 250 },
        data: {
          label: 'Send Report',
          description: 'Email daily report',
          config: {
            to: 'management@example.com',
            subject: 'Daily Report - {{date}}',
            body: 'Total Revenue: ${{aggregate.result}}',
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'trigger-schedule-1',
        target: 'action-database-query-1',
        animated: true,
      },
      {
        id: 'edge-2',
        source: 'action-database-query-1',
        target: 'data-aggregate-1',
        animated: true,
      },
      {
        id: 'edge-3',
        source: 'data-aggregate-1',
        target: 'action-send-email-1',
        animated: true,
      },
    ],
  },
  {
    id: 'example-5',
    name: 'Multi-Integration Notification',
    description: 'Send notifications to multiple platforms (Slack, Discord, Email)',
    category: 'Integration',
    tags: ['slack', 'discord', 'email', 'notifications'],
    usageCount: 0,
    nodes: [
      {
        id: 'trigger-webhook-1',
        type: 'trigger-webhook',
        category: 'trigger',
        position: { x: 100, y: 300 },
        data: {
          label: 'Webhook',
          description: 'Receive webhook event',
          config: {
            method: 'POST',
            authType: 'apiKey',
            responseType: 'json',
          },
        },
      },
      {
        id: 'integration-slack-1',
        type: 'integration-slack',
        category: 'integration',
        position: { x: 450, y: 150 },
        data: {
          label: 'Slack',
          description: 'Post to Slack',
          config: {
            action: 'sendMessage',
            channel: '#notifications',
            message: 'New event: {{webhook.payload.title}}',
          },
        },
      },
      {
        id: 'integration-discord-1',
        type: 'integration-discord',
        category: 'integration',
        position: { x: 450, y: 300 },
        data: {
          label: 'Discord',
          description: 'Post to Discord',
          config: {
            webhookUrl: 'https://discord.com/api/webhooks/...',
            content: 'New event: {{webhook.payload.title}}',
            username: 'Workflow Bot',
          },
        },
      },
      {
        id: 'action-send-email-1',
        type: 'action-send-email',
        category: 'action',
        position: { x: 450, y: 450 },
        data: {
          label: 'Email',
          description: 'Send email notification',
          config: {
            to: 'team@example.com',
            subject: 'New Event: {{webhook.payload.title}}',
            body: '{{webhook.payload.description}}',
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'trigger-webhook-1',
        target: 'integration-slack-1',
        animated: true,
      },
      {
        id: 'edge-2',
        source: 'trigger-webhook-1',
        target: 'integration-discord-1',
        animated: true,
      },
      {
        id: 'edge-3',
        source: 'trigger-webhook-1',
        target: 'action-send-email-1',
        animated: true,
      },
    ],
  },
];
