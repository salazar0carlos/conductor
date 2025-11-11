# Conductor Agent Examples

This directory contains starter code for building agents that integrate with Conductor.

## Agent Starter Scripts

We provide starter templates in both Python and TypeScript to help you quickly build agents that can poll for tasks, execute them, and report results back to Conductor.

### Python Agent (`agent-starter.py`)

#### Prerequisites
```bash
pip install requests anthropic openai
```

#### Usage
```bash
python agent-starter.py \
  --agent-id YOUR_AGENT_ID \
  --api-key YOUR_AI_API_KEY \
  --base-url https://your-conductor-instance.vercel.app \
  --poll-interval 5
```

#### Customization
1. Extend the `ConductorAgent` class
2. Override the `execute_task()` method
3. Add your AI model integration (Anthropic, OpenAI, etc.)

Example:
```python
from agent_starter import ConductorAgent
import anthropic

class MyCustomAgent(ConductorAgent):
    def __init__(self, agent_id: str, api_key: str, **kwargs):
        super().__init__(
            agent_id=agent_id,
            api_key=api_key,
            capabilities=["coding", "debugging", "testing"],
            **kwargs
        )
        self.ai_client = anthropic.Anthropic(api_key=api_key)

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        # Your custom task execution logic
        response = self.ai_client.messages.create(
            model="claude-sonnet-4",
            messages=[{
                "role": "user",
                "content": f"Task: {task['title']}\n{task['description']}"
            }]
        )

        return {
            "result": response.content[0].text,
            "model": "claude-sonnet-4"
        }
```

### TypeScript Agent (`agent-starter.ts`)

#### Prerequisites
```bash
npm install typescript ts-node @types/node
npm install @anthropic-ai/sdk openai
```

#### Usage
```bash
ts-node agent-starter.ts \
  --agent-id=YOUR_AGENT_ID \
  --api-key=YOUR_AI_API_KEY \
  --base-url=https://your-conductor-instance.vercel.app
```

#### Customization
1. Extend the `ConductorAgent` class
2. Override the `executeTask()` method
3. Add your AI model integration

Example:
```typescript
import { ConductorAgent } from './agent-starter'
import Anthropic from '@anthropic-ai/sdk'

class MyCustomAgent extends ConductorAgent {
  private aiClient: Anthropic

  constructor(agentId: string, apiKey: string, baseUrl?: string) {
    super({
      agentId,
      apiKey,
      capabilities: ['coding', 'debugging', 'testing'],
      baseUrl,
    })
    this.aiClient = new Anthropic({ apiKey })
  }

  async executeTask(task: Task): Promise<TaskOutput> {
    // Your custom task execution logic
    const response = await this.aiClient.messages.create({
      model: 'claude-sonnet-4',
      messages: [{
        role: 'user',
        content: `Task: ${task.title}\n${task.description}`
      }]
    })

    return {
      result: response.content[0].text,
      model: 'claude-sonnet-4'
    }
  }
}
```

## How It Works

### 1. Agent Registration
First, register your agent in Conductor's UI or via API:
```bash
curl -X POST https://your-conductor-instance.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Agent",
    "type": "llm",
    "capabilities": ["coding", "debugging"],
    "config": {
      "model": "claude-sonnet-4",
      "temperature": 0.3
    }
  }'
```

Save the returned `agent_id` - you'll need it to run your agent.

### 2. Start Your Agent
Run your agent with the agent ID:
```bash
# Python
python agent-starter.py --agent-id abc-123 --api-key sk-ant-...

# TypeScript
ts-node agent-starter.ts --agent-id=abc-123 --api-key=sk-ant-...
```

### 3. Agent Workflow
Once started, your agent will:

1. **Poll for Tasks** - Checks the API every 5 seconds for tasks matching its capabilities
2. **Execute Tasks** - Processes assigned tasks using your AI model
3. **Report Progress** - Logs execution steps to the task logs
4. **Complete/Fail** - Marks tasks as completed with output data or failed with error message
5. **Send Heartbeats** - Sends status updates every 30 seconds

### 4. Task Execution Flow
```
┌─────────────────────┐
│  Poll for Task      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Task Available?    │───No──▶ Wait & Poll Again
└──────────┬──────────┘
           │ Yes
           ▼
┌─────────────────────┐
│  Update Status:     │
│  BUSY               │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Execute Task       │
│  (Your Logic)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Success/Failure?   │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
   Success    Failure
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│Complete │ │  Fail   │
│  Task   │ │  Task   │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           │
           ▼
┌─────────────────────┐
│  Update Status:     │
│  ACTIVE             │
└─────────────────────┘
```

## Configuration Options

### Environment Variables
```bash
# Conductor API
CONDUCTOR_BASE_URL=https://your-conductor-instance.vercel.app

# AI Provider Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Agent Configuration
AGENT_ID=your-agent-id
POLL_INTERVAL=5  # seconds
```

### Deployment Options

#### 1. Local Development
Run the agent on your local machine for testing:
```bash
python agent-starter.py --agent-id abc-123 --api-key sk-...
```

#### 2. Cloud Deployment (Railway, Render, etc.)
Deploy as a long-running service:
- Set environment variables
- Use a process manager (PM2, systemd)
- Configure restart policies

#### 3. Serverless (Not Recommended)
Agents need to poll continuously, so serverless isn't ideal. However, you could:
- Use scheduled functions to check for tasks
- Implement a queue-based system
- Use Step Functions for complex workflows

## Best Practices

### 1. Error Handling
Always wrap task execution in try-catch blocks:
```python
try:
    output = self.execute_task(task)
    self.complete_task(task_id, output)
except Exception as e:
    logger.error(f"Task failed: {e}")
    self.fail_task(task_id, str(e))
```

### 2. Logging
Log progress at key steps:
```python
self.log_task_message(task_id, "Starting analysis")
self.log_task_message(task_id, "Calling AI model")
self.log_task_message(task_id, "Processing response")
self.log_task_message(task_id, "Task completed")
```

### 3. Heartbeats
Send regular heartbeats to indicate the agent is alive:
```python
# Every 30 seconds
self.send_heartbeat("active")
```

### 4. Graceful Shutdown
Handle shutdown signals properly:
```python
try:
    agent.run()
except KeyboardInterrupt:
    logger.info("Shutting down...")
    agent.send_heartbeat("offline")
```

### 5. Resource Management
- Limit concurrent task execution
- Implement timeouts for long-running tasks
- Monitor memory usage
- Clean up resources after task completion

## Troubleshooting

### Agent Not Receiving Tasks
1. Check agent capabilities match task requirements
2. Verify agent status is "active"
3. Check heartbeat is being sent
4. Review API endpoint URL

### Tasks Failing
1. Check task logs in Conductor UI
2. Verify AI API key is valid
3. Review error messages
4. Test AI model integration separately

### Connection Issues
1. Verify Conductor API is accessible
2. Check firewall/network settings
3. Confirm API endpoints are correct
4. Review authentication/authorization

## Advanced Topics

### Multi-Agent Systems
Run multiple agents with different capabilities:
```bash
# Agent 1: Backend specialist
python agent-starter.py --agent-id agent-1 --api-key sk-... \
  # capabilities: ["api-design", "database-architecture"]

# Agent 2: Frontend specialist
python agent-starter.py --agent-id agent-2 --api-key sk-... \
  # capabilities: ["ui-design", "accessibility"]
```

### Task Dependencies
Handle tasks with dependencies by checking the `dependencies` field:
```python
def execute_task(self, task):
    if task.get('dependencies'):
        # Wait for dependencies to complete
        self.wait_for_dependencies(task['dependencies'])

    # Execute task
    return output
```

### Custom Capabilities
Define custom capabilities for specialized tasks:
```python
capabilities = [
    "python-coding",
    "react-development",
    "aws-deployment",
    "database-optimization"
]
```

## Support

For issues or questions:
- GitHub Issues: [conductor/issues](https://github.com/yourusername/conductor/issues)
- Documentation: [Conductor Docs](https://conductor-docs.vercel.app)
