# Visual Workflow Builder

A comprehensive, production-ready visual workflow builder similar to Zapier and n8n, built with React Flow, Monaco Editor, and Zustand.

## Features

### 1. Canvas-Based Visual Builder
- **Infinite Canvas**: Pan and zoom with smooth animations
- **Drag-and-Drop**: Drag nodes from the sidebar onto the canvas
- **Connection Lines**: Bezier curves connecting nodes
- **Grid Snapping**: Automatic alignment to 15x15 grid
- **Multi-Select**: Select and manipulate multiple nodes
- **Minimap**: Overview of the entire workflow

### 2. Node Types

#### Triggers (5 types)
- **Manual Trigger**: Start workflow with a button click
- **Schedule**: Cron-based scheduled execution
- **Webhook**: HTTP webhook triggers
- **File Upload**: File upload triggers
- **Email Received**: Email-based triggers

#### Actions (5 types)
- **HTTP Request**: Make API calls with full configuration
- **Database Query**: Execute SQL queries
- **AI Generation**: Generate content using AI models
- **Send Email**: Send email notifications
- **File Operation**: Read, write, delete, convert files

#### Logic (5 types)
- **Condition**: If/else branching with multiple operators
- **Loop**: Iterate over arrays or objects
- **Switch**: Multi-way branching
- **Delay**: Wait before continuing
- **Stop**: Halt workflow execution

#### Data (5 types)
- **Transform**: Map and transform data
- **Filter**: Filter arrays based on conditions
- **Merge**: Combine multiple data sources
- **Split**: Split data into multiple outputs
- **Aggregate**: Sum, average, count, min, max operations

#### Integrations (5 types)
- **GitHub**: Create issues, PRs, comments
- **Slack**: Send messages and files
- **Discord**: Send webhook messages
- **Stripe**: Payment operations
- **SendGrid**: Email sending

### 3. Node Configuration
- **Form Mode**: User-friendly form inputs with validation
- **JSON Mode**: Direct JSON editing with Monaco Editor
- **Variable Picker**: Reference outputs from previous nodes using `{{variableName}}`
- **Test Execution**: Test individual nodes before running the full workflow
- **Live Preview**: See configuration changes in real-time

### 4. Execution & Testing
- **Full Workflow Execution**: Run entire workflow from start to finish
- **Step-by-Step Debugging**: See data flow between nodes
- **Execution History**: View past executions with logs
- **Real-time Logs**: Watch execution progress with color-coded log levels
- **Error Handling**: Retry policies and error notifications
- **Duration Tracking**: Monitor execution times for performance optimization

### 5. Advanced Features
- **Version Control**: Save versions, compare changes, rollback
- **Templates**: Pre-built workflow templates for common use cases
- **Import/Export**: JSON-based workflow import/export
- **Duplicate Workflows**: Clone existing workflows
- **Analytics**: Execution count, success rate, average duration
- **Search & Filter**: Find workflows and nodes quickly

## Tech Stack

- **React Flow (@xyflow/react)**: Node-based workflow canvas
- **Monaco Editor**: Code and JSON editing
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling and validation
- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **date-fns**: Date formatting
- **cron-parser**: Cron expression validation

## Project Structure

```
/app
  /workflows
    /builder
      page.tsx          # Main workflow builder page
    page.tsx            # Workflows listing page
  /api
    /workflows
      /execute
        route.ts        # Workflow execution engine

/components
  /workflow-builder
    canvas.tsx          # React Flow canvas
    custom-node.tsx     # Custom node component
    node-palette.tsx    # Draggable node sidebar
    node-config.tsx     # Configuration panel
    execution-log.tsx   # Execution logs viewer
    templates.tsx       # Workflow templates

/lib
  /workflow
    types.ts            # TypeScript type definitions
    node-definitions.ts # Node type definitions and schemas
    store.ts            # Zustand state management
```

## Usage

### 1. Create a New Workflow

Navigate to `/workflows` and click "New Workflow" or browse templates.

### 2. Add Nodes

Drag nodes from the left sidebar onto the canvas. Available node types:
- Triggers (green): Start your workflow
- Actions (blue): Perform operations
- Logic (orange): Control flow
- Data (purple): Transform data
- Integrations (pink): Connect to external services

### 3. Connect Nodes

Click and drag from a node's output handle (right side) to another node's input handle (left side).

### 4. Configure Nodes

Click on a node to open the configuration panel on the right. Toggle between:
- **Form Mode**: User-friendly inputs
- **JSON Mode**: Direct JSON editing

### 5. Test Node

Click "Test Node" in the configuration panel to test individual nodes.

### 6. Execute Workflow

Click the "Execute" button in the toolbar to run the entire workflow. Watch real-time logs at the bottom.

### 7. Save & Version Control

- Click the "Save Version" button to create a version snapshot
- View version history from the top bar
- Export workflows as JSON for backup or sharing

## Node Configuration Examples

### HTTP Request Node
```json
{
  "method": "POST",
  "url": "https://api.example.com/data",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{token}}"
  },
  "body": {
    "data": "{{previousNode.output}}"
  }
}
```

### Condition Node
```json
{
  "operator": "greaterThan",
  "value1": "{{httpRequest.status}}",
  "value2": "200"
}
```

### Schedule Trigger
```json
{
  "cron": "0 9 * * *",
  "timezone": "America/New_York",
  "enabled": true
}
```

### AI Generation Node
```json
{
  "model": "gpt-4",
  "prompt": "Summarize this text: {{emailReceived.body}}",
  "temperature": 0.7
}
```

## Variable System

Use `{{variableName}}` syntax to reference outputs from previous nodes:

- `{{nodeId.field}}`: Access specific field from node output
- `{{nodeId}}`: Access entire node output
- Variables are resolved at execution time
- Supports nested object access: `{{nodeId.user.email}}`

## Keyboard Shortcuts

- **Space + Drag**: Pan the canvas
- **Scroll**: Zoom in/out
- **Delete**: Delete selected nodes
- **Ctrl/Cmd + D**: Duplicate selected node
- **Ctrl/Cmd + S**: Save workflow
- **Ctrl/Cmd + Z**: Undo (coming soon)

## Execution Engine

The workflow execution engine:

1. **Topological Sort**: Determines execution order based on dependencies
2. **Sequential Execution**: Executes nodes one by one
3. **Context Passing**: Passes outputs as inputs to connected nodes
4. **Variable Resolution**: Resolves `{{variable}}` references
5. **Error Handling**: Catches and logs errors with retry support

## API Routes

### POST /api/workflows/execute
Execute a workflow with nodes and edges.

**Request:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "exec-1234567890",
  "nodesExecuted": 5,
  "results": [...]
}
```

## Customization

### Add New Node Types

1. Add definition to `lib/workflow/node-definitions.ts`
2. Add execution logic to `app/api/workflows/execute/route.ts`
3. Node appears automatically in the palette

### Extend Configuration Schema

Node configuration supports these field types:
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `number`: Numeric input with validation
- `boolean`: Checkbox
- `select`: Dropdown with options
- `json`: JSON editor with Monaco
- `code`: Code editor with syntax highlighting
- `cron`: Cron expression input
- `variables`: Variable picker input

## Performance

- **Large Workflows**: Handles 100+ nodes efficiently
- **Real-time Updates**: Smooth rendering with React Flow
- **Memory Optimization**: Efficient state management with Zustand
- **Lazy Loading**: Monaco Editor loaded on demand

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Workflow scheduling UI
- [ ] Real-time collaboration
- [ ] Workflow marketplace
- [ ] Custom node SDK
- [ ] Workflow analytics dashboard
- [ ] A/B testing for workflows
- [ ] Webhook management UI
- [ ] Environment variables
- [ ] Workflow permissions

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
