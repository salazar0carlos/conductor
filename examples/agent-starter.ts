/**
 * Conductor Agent - TypeScript Starter
 *
 * This is a sample agent that polls the Conductor API for tasks and executes them.
 * Customize this script based on your agent's capabilities.
 *
 * Usage:
 *     ts-node agent-starter.ts --agent-id YOUR_AGENT_ID --api-key YOUR_API_KEY
 *
 * Requirements:
 *     npm install typescript ts-node @types/node
 *     npm install @anthropic-ai/sdk openai
 */

import { Task, TaskLog, CompleteTaskRequest, FailTaskRequest, PollTaskRequest, AgentHeartbeatRequest } from '../types'

interface AgentConfig {
  agentId: string
  apiKey: string
  capabilities: string[]
  baseUrl?: string
  pollInterval?: number
}

interface TaskOutput {
  [key: string]: any
}

class ConductorAgent {
  private agentId: string
  private apiKey: string
  private capabilities: string[]
  private baseUrl: string
  private pollInterval: number
  private running: boolean = true

  constructor(config: AgentConfig) {
    this.agentId = config.agentId
    this.apiKey = config.apiKey
    this.capabilities = config.capabilities
    this.baseUrl = config.baseUrl || 'http://localhost:3000'
    this.pollInterval = config.pollInterval || 5000 // 5 seconds
  }

  /**
   * Poll the API for an available task
   */
  async pollForTask(): Promise<Task | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tasks/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          capabilities: this.capabilities,
        } as PollTaskRequest),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          return data.data as Task
        }
      }
      return null
    } catch (error) {
      console.error('Error polling for task:', error)
      return null
    }
  }

  /**
   * Send heartbeat to indicate agent is alive
   */
  async sendHeartbeat(status: 'idle' | 'active' | 'busy' | 'offline' | 'error' = 'active'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          status,
        } as AgentHeartbeatRequest),
      })
      return response.ok
    } catch (error) {
      console.error('Error sending heartbeat:', error)
      return false
    }
  }

  /**
   * Log a message for a task
   */
  async logTaskMessage(
    taskId: string,
    message: string,
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/tasks/${taskId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          level,
          message,
          data,
        }),
      })
    } catch (error) {
      console.error('Error logging task message:', error)
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string, outputData: TaskOutput): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          output_data: outputData,
        } as CompleteTaskRequest),
      })
      return response.ok
    } catch (error) {
      console.error('Error completing task:', error)
      return false
    }
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId: string, errorMessage: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tasks/${taskId}/fail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          error_message: errorMessage,
        } as FailTaskRequest),
      })
      return response.ok
    } catch (error) {
      console.error('Error failing task:', error)
      return false
    }
  }

  /**
   * Execute a task. Override this method in your implementation.
   */
  async executeTask(task: Task): Promise<TaskOutput> {
    throw new Error('executeTask() must be implemented by subclass')
  }

  /**
   * Main agent loop
   */
  async run(): Promise<void> {
    console.log(`Agent ${this.agentId} starting...`)
    console.log(`Capabilities: ${this.capabilities.join(', ')}`)

    let heartbeatCounter = 0

    while (this.running) {
      try {
        // Send heartbeat every 6 polls (30 seconds if poll interval is 5s)
        if (heartbeatCounter % 6 === 0) {
          await this.sendHeartbeat('active')
          console.debug('Sent heartbeat')
        }
        heartbeatCounter++

        // Poll for task
        const task = await this.pollForTask()

        if (task) {
          console.log(`Received task: ${task.title}`)

          await this.logTaskMessage(task.id, `Task assigned to agent ${this.agentId}`)

          try {
            // Update heartbeat to busy
            await this.sendHeartbeat('busy')

            // Execute the task
            await this.logTaskMessage(task.id, 'Starting task execution')
            const outputData = await this.executeTask(task)

            // Complete the task
            await this.logTaskMessage(task.id, 'Task completed successfully')
            await this.completeTask(task.id, outputData)
            console.log(`Task ${task.id} completed successfully`)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.error(`Task execution failed: ${errorMessage}`)
            await this.logTaskMessage(task.id, `Task execution failed: ${errorMessage}`, 'error')
            await this.failTask(task.id, errorMessage)
          } finally {
            // Reset to active
            await this.sendHeartbeat('active')
          }
        } else {
          console.debug('No tasks available')
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, this.pollInterval))
      } catch (error) {
        console.error('Error in agent loop:', error)
        await new Promise((resolve) => setTimeout(resolve, this.pollInterval))
      }
    }
  }

  /**
   * Gracefully shutdown the agent
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down agent...')
    this.running = false
    await this.sendHeartbeat('offline')
  }
}

/**
 * Example agent implementation
 */
class ExampleAgent extends ConductorAgent {
  constructor(agentId: string, apiKey: string, baseUrl?: string) {
    super({
      agentId,
      apiKey,
      capabilities: ['coding', 'analysis', 'documentation'],
      baseUrl,
    })

    // Initialize your AI client here (Anthropic, OpenAI, etc.)
    // this.aiClient = new Anthropic({ apiKey })
  }

  async executeTask(task: Task): Promise<TaskOutput> {
    const { id: taskId, title, description, input_data, type } = task

    console.log(`Executing ${type} task: ${title}`)

    // Log progress
    await this.logTaskMessage(taskId, 'Analyzing task requirements')

    // Here you would call your AI model
    // For example with Anthropic:
    // const response = await this.aiClient.messages.create({
    //   model: 'claude-sonnet-4',
    //   messages: [{
    //     role: 'user',
    //     content: `Task: ${title}\nDescription: ${description}\nInput: ${JSON.stringify(input_data)}`
    //   }]
    // })

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await this.logTaskMessage(taskId, 'Processing task with AI model')

    await new Promise((resolve) => setTimeout(resolve, 2000))
    await this.logTaskMessage(taskId, 'Generating output')

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return output data
    return {
      result: `Completed ${type} task: ${title}`,
      task_type: type,
      execution_time: '5 seconds',
      model: 'example-model',
      success: true,
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)
  const agentId = args.find((arg) => arg.startsWith('--agent-id='))?.split('=')[1]
  const apiKey = args.find((arg) => arg.startsWith('--api-key='))?.split('=')[1]
  const baseUrl = args.find((arg) => arg.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:3000'

  if (!agentId || !apiKey) {
    console.error('Usage: ts-node agent-starter.ts --agent-id=AGENT_ID --api-key=API_KEY [--base-url=BASE_URL]')
    process.exit(1)
  }

  // Create agent
  const agent = new ExampleAgent(agentId, apiKey, baseUrl)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await agent.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await agent.shutdown()
    process.exit(0)
  })

  // Run agent
  await agent.run()
}

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { ConductorAgent, ExampleAgent }
