# Conductor Application - Architecture Improvements

**Generated:** November 13, 2025
**Focus:** Structural recommendations for scalability and maintainability

---

## Executive Summary

This document provides architectural recommendations to scale the Conductor application from its current solid foundation to an enterprise-grade platform capable of handling 10x growth while maintaining developer velocity and system reliability.

**Current State:**
- ✅ Well-organized Next.js App Router structure
- ✅ Feature-based code organization
- ✅ Modern TypeScript and React patterns
- ⚠️ Monolithic API structure
- ⚠️ Limited separation of concerns in business logic
- ⚠️ No defined data access layer

**Target State:**
- 🎯 Layered architecture with clear boundaries
- 🎯 Scalable microservices-ready structure
- 🎯 Comprehensive error handling and resilience
- 🎯 Performance-optimized data layer
- 🎯 Production-ready monitoring and observability

---

## Table of Contents

1. [Layered Architecture](#1-layered-architecture)
2. [Data Access Layer](#2-data-access-layer)
3. [Service Layer](#3-service-layer)
4. [API Layer Improvements](#4-api-layer-improvements)
5. [Domain-Driven Design](#5-domain-driven-design)
6. [Event-Driven Architecture](#6-event-driven-architecture)
7. [Caching Strategy](#7-caching-strategy)
8. [Scalability Patterns](#8-scalability-patterns)
9. [Observability & Monitoring](#9-observability--monitoring)
10. [Migration Strategy](#10-migration-strategy)

---

## 1. Layered Architecture

### 1.1 Current Architecture Issues

**Problem:** Business logic mixed with API handlers
```typescript
// CURRENT: Business logic in API route
// /app/api/tasks/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body: CreateTaskRequest = await request.json()

  // Validation mixed with data access
  if (!body.title || body.title.trim() === '') {
    return apiError('Task title is required')
  }

  // Direct database access
  const { data, error } = await supabase.from('tasks').insert([{...}])

  if (error) throw error
  return apiSuccess(data, 201)
}
```

**Issues:**
- Impossible to reuse logic outside API context
- Hard to test business logic
- No separation between validation, business rules, and data access
- Difficult to change database implementation

### 1.2 Proposed Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Presentation Layer                   │
│  - API Routes (app/api/)                            │
│  - Server Components (app/)                          │
│  - Client Components (components/)                   │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  Service Layer                       │
│  - Business Logic (lib/services/)                   │
│  - Orchestration (lib/orchestrators/)               │
│  - Validation (lib/validators/)                     │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                 Data Access Layer                    │
│  - Repositories (lib/repositories/)                 │
│  - Query Builders (lib/queries/)                    │
│  - Type-safe DB access                              │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                Infrastructure Layer                  │
│  - Supabase Client                                  │
│  - External APIs (Anthropic, GitHub, etc.)          │
│  - Cache (Redis/Upstash)                            │
│  - Queue System                                      │
└─────────────────────────────────────────────────────┘
```

### 1.3 Implementation Plan

#### Phase 1: Create Repository Layer

**File Structure:**
```
lib/
├── repositories/
│   ├── base-repository.ts          # Abstract base class
│   ├── task-repository.ts          # Task data access
│   ├── agent-repository.ts         # Agent data access
│   ├── project-repository.ts       # Project data access
│   ├── intelligence-repository.ts  # AI intelligence data access
│   └── index.ts                    # Export all repositories
```

**Base Repository Pattern:**
```typescript
// lib/repositories/base-repository.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types'

export abstract class BaseRepository<T> {
  constructor(
    protected supabase: SupabaseClient<Database>,
    protected tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw this.handleError(error)
    return data as T
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    let query = this.supabase.from(this.tableName).select('*')

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query
    if (error) throw this.handleError(error)
    return data as T[]
  }

  async create(input: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert([input])
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data as T
  }

  async update(id: string, input: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data as T
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) throw this.handleError(error)
  }

  protected handleError(error: any): Error {
    // Convert Supabase errors to domain errors
    if (error.code === 'PGRST116') {
      return new NotFoundError(this.tableName)
    }
    if (error.code === '23505') {
      return new DuplicateError(this.tableName)
    }
    return new Error(error.message)
  }
}
```

**Task Repository Example:**
```typescript
// lib/repositories/task-repository.ts
import { BaseRepository } from './base-repository'
import { Task } from '@/types'
import { SupabaseClient } from '@supabase/supabase-js'

export class TaskRepository extends BaseRepository<Task> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'tasks')
  }

  // Domain-specific queries
  async findByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*, projects(*), agents(*)')
      .eq('project_id', projectId)
      .order('priority', { ascending: false })

    if (error) throw this.handleError(error)
    return data as Task[]
  }

  async findByStatus(status: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw this.handleError(error)
    return data as Task[]
  }

  async findAssignableTask(
    agentCapabilities: string[]
  ): Promise<Task | null> {
    // Use database function for complex logic
    const { data, error } = await this.supabase.rpc(
      'get_assignable_task',
      { capabilities: agentCapabilities }
    )

    if (error) throw this.handleError(error)
    return data as Task | null
  }

  async markCompleted(
    id: string,
    outputData: Record<string, unknown>
  ): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_data: outputData
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data as Task
  }

  async markFailed(id: string, errorMessage: string): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data as Task
  }
}
```

#### Phase 2: Create Service Layer

**File Structure:**
```
lib/
├── services/
│   ├── task-service.ts          # Task business logic
│   ├── agent-service.ts         # Agent business logic
│   ├── project-service.ts       # Project business logic
│   ├── orchestration-service.ts # Orchestration logic
│   └── index.ts                 # Export all services
```

**Service Pattern:**
```typescript
// lib/services/task-service.ts
import { TaskRepository } from '@/lib/repositories/task-repository'
import { AgentRepository } from '@/lib/repositories/agent-repository'
import { CreateTaskRequest, Task } from '@/types'
import { ValidationError } from '@/lib/errors/types'

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private agentRepo: AgentRepository
  ) {}

  async createTask(input: CreateTaskRequest): Promise<Task> {
    // Validation
    this.validateTaskInput(input)

    // Business logic
    const priority = input.priority ?? this.calculatePriority(input)

    // Data access
    const task = await this.taskRepo.create({
      ...input,
      priority,
      status: 'pending',
      dependencies: input.dependencies || [],
      required_capabilities: input.required_capabilities || [],
      input_data: input.input_data || {},
      metadata: input.metadata || {}
    })

    // Post-creation logic (events, notifications, etc.)
    await this.notifyTaskCreated(task)

    return task
  }

  async assignTask(taskId: string, agentId: string): Promise<Task> {
    // Verify agent exists and is available
    const agent = await this.agentRepo.findById(agentId)
    if (!agent) {
      throw new NotFoundError('Agent')
    }

    if (agent.status !== 'idle') {
      throw new ValidationError('Agent is not available')
    }

    // Check if task dependencies are met
    const task = await this.taskRepo.findById(taskId)
    if (!task) {
      throw new NotFoundError('Task')
    }

    const dependenciesMet = await this.checkDependencies(task)
    if (!dependenciesMet) {
      throw new ValidationError('Task dependencies not met')
    }

    // Update task and agent
    const updatedTask = await this.taskRepo.update(taskId, {
      status: 'assigned',
      assigned_agent_id: agentId,
      started_at: new Date().toISOString()
    })

    await this.agentRepo.update(agentId, {
      status: 'busy'
    })

    return updatedTask
  }

  async pollTask(
    agentId: string,
    capabilities: string[]
  ): Promise<Task | null> {
    // Verify agent
    const agent = await this.agentRepo.findById(agentId)
    if (!agent) {
      throw new NotFoundError('Agent')
    }

    // Find assignable task
    const task = await this.taskRepo.findAssignableTask(capabilities)

    if (task) {
      // Assign task atomically
      return await this.assignTask(task.id, agentId)
    }

    return null
  }

  async completeTask(
    taskId: string,
    agentId: string,
    outputData: Record<string, unknown>
  ): Promise<Task> {
    // Verify task is assigned to this agent
    const task = await this.taskRepo.findById(taskId)
    if (!task) {
      throw new NotFoundError('Task')
    }

    if (task.assigned_agent_id !== agentId) {
      throw new ValidationError('Task not assigned to this agent')
    }

    // Mark task complete
    const completedTask = await this.taskRepo.markCompleted(taskId, outputData)

    // Free up agent
    await this.agentRepo.update(agentId, { status: 'idle' })

    // Trigger dependent tasks
    await this.triggerDependentTasks(taskId)

    return completedTask
  }

  // Private helper methods
  private validateTaskInput(input: CreateTaskRequest): void {
    if (!input.title || input.title.trim() === '') {
      throw new ValidationError('Task title is required', 'title')
    }

    if (!input.project_id) {
      throw new ValidationError('Project ID is required', 'project_id')
    }

    if (!input.type) {
      throw new ValidationError('Task type is required', 'type')
    }
  }

  private calculatePriority(input: CreateTaskRequest): number {
    // Business logic for priority calculation
    let priority = 5 // default

    if (input.type === 'bugfix') priority += 2
    if (input.dependencies && input.dependencies.length > 0) priority -= 1

    return Math.max(1, Math.min(10, priority))
  }

  private async checkDependencies(task: Task): Promise<boolean> {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true
    }

    const dependencies = await Promise.all(
      task.dependencies.map(depId => this.taskRepo.findById(depId))
    )

    return dependencies.every(dep => dep?.status === 'completed')
  }

  private async notifyTaskCreated(task: Task): Promise<void> {
    // Emit event, send notification, etc.
    // This would integrate with your event system
  }

  private async triggerDependentTasks(completedTaskId: string): Promise<void> {
    // Find tasks that depend on this one
    // Check if all their dependencies are now met
    // If so, mark them as ready for assignment
  }
}
```

#### Phase 3: Update API Routes

**Refactored API Route:**
```typescript
// app/api/tasks/route.ts
import { createClient } from '@/lib/supabase/server'
import { TaskService } from '@/lib/services/task-service'
import { TaskRepository } from '@/lib/repositories/task-repository'
import { AgentRepository } from '@/lib/repositories/agent-repository'
import { apiSuccess, handleApiError } from '@/lib/utils/api-helpers'
import { withAuth } from '@/lib/auth/route-middleware'
import type { CreateTaskRequest } from '@/types'

export const POST = withAuth(async (request, { user }) => {
  try {
    const supabase = await createClient()
    const body: CreateTaskRequest = await request.json()

    // Initialize dependencies
    const taskRepo = new TaskRepository(supabase)
    const agentRepo = new AgentRepository(supabase)
    const taskService = new TaskService(taskRepo, agentRepo)

    // Business logic handled by service
    const task = await taskService.createTask(body)

    return apiSuccess(task, 201)
  } catch (error) {
    return handleApiError(error)
  }
})

export const GET = withAuth(async (request, { user }) => {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const taskRepo = new TaskRepository(supabase)

    // Use repository methods
    const projectId = searchParams.get('project_id')
    const status = searchParams.get('status')

    let tasks
    if (projectId) {
      tasks = await taskRepo.findByProject(projectId)
    } else if (status) {
      tasks = await taskRepo.findByStatus(status)
    } else {
      tasks = await taskRepo.findAll()
    }

    return apiSuccess(tasks)
  } catch (error) {
    return handleApiError(error)
  }
})
```

**Benefits:**
- ✅ Business logic testable in isolation
- ✅ Reusable across API routes and Server Actions
- ✅ Clear separation of concerns
- ✅ Easy to mock for testing
- ✅ Database implementation can change without affecting business logic

---

## 2. Data Access Layer

### 2.1 Advanced Repository Patterns

#### Query Builder Pattern

```typescript
// lib/repositories/query-builder.ts
import { SupabaseClient } from '@supabase/supabase-js'

export class QueryBuilder<T> {
  private query: any
  private supabase: SupabaseClient
  private table: string

  constructor(supabase: SupabaseClient, table: string) {
    this.supabase = supabase
    this.table = table
    this.query = supabase.from(table).select('*')
  }

  where(field: string, value: any): this {
    this.query = this.query.eq(field, value)
    return this
  }

  whereIn(field: string, values: any[]): this {
    this.query = this.query.in(field, values)
    return this
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query = this.query.order(field, { ascending: direction === 'asc' })
    return this
  }

  limit(count: number): this {
    this.query = this.query.limit(count)
    return this
  }

  withRelations(relations: string[]): this {
    const select = ['*', ...relations.map(r => `${r}(*)`)].join(', ')
    this.query = this.supabase.from(this.table).select(select)
    return this
  }

  async execute(): Promise<T[]> {
    const { data, error } = await this.query
    if (error) throw error
    return data as T[]
  }

  async first(): Promise<T | null> {
    const { data, error } = await this.query.limit(1).single()
    if (error && error.code !== 'PGRST116') throw error
    return data as T | null
  }
}

// Usage
const tasks = await new QueryBuilder<Task>(supabase, 'tasks')
  .where('status', 'pending')
  .whereIn('priority', [8, 9, 10])
  .withRelations(['projects', 'agents'])
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute()
```

#### Unit of Work Pattern

```typescript
// lib/repositories/unit-of-work.ts
import { SupabaseClient } from '@supabase/supabase-js'

export class UnitOfWork {
  private repositories = new Map<string, any>()

  constructor(private supabase: SupabaseClient) {}

  getRepository<T>(
    RepoClass: new (supabase: SupabaseClient) => T
  ): T {
    const key = RepoClass.name

    if (!this.repositories.has(key)) {
      this.repositories.set(key, new RepoClass(this.supabase))
    }

    return this.repositories.get(key) as T
  }

  async transaction<T>(
    callback: (uow: UnitOfWork) => Promise<T>
  ): Promise<T> {
    // Supabase doesn't support transactions directly in client
    // But we can use RPC for complex transactions
    try {
      return await callback(this)
    } catch (error) {
      // Handle rollback if needed
      throw error
    }
  }
}

// Usage
const uow = new UnitOfWork(supabase)

await uow.transaction(async (uow) => {
  const taskRepo = uow.getRepository(TaskRepository)
  const agentRepo = uow.getRepository(AgentRepository)

  const task = await taskRepo.create({...})
  await agentRepo.update(agentId, { status: 'busy' })

  return task
})
```

### 2.2 Database Function Integration

Create complex queries as PostgreSQL functions for better performance:

```sql
-- supabase/migrations/20250113_assignable_tasks.sql
CREATE OR REPLACE FUNCTION get_assignable_task(
  capabilities TEXT[]
)
RETURNS tasks
LANGUAGE plpgsql
AS $$
DECLARE
  task_record tasks;
BEGIN
  SELECT t.* INTO task_record
  FROM tasks t
  WHERE t.status = 'pending'
    AND (
      cardinality(t.required_capabilities) = 0
      OR t.required_capabilities <@ capabilities
    )
    AND NOT EXISTS (
      SELECT 1
      FROM tasks dep
      WHERE dep.id = ANY(t.dependencies)
        AND dep.status != 'completed'
    )
  ORDER BY t.priority DESC, t.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    UPDATE tasks
    SET status = 'assigned'
    WHERE id = task_record.id;
  END IF;

  RETURN task_record;
END;
$$;
```

```typescript
// lib/repositories/task-repository.ts
async findAssignableTask(capabilities: string[]): Promise<Task | null> {
  const { data, error } = await this.supabase
    .rpc('get_assignable_task', { capabilities })

  if (error) throw this.handleError(error)
  return data as Task | null
}
```

**Benefits:**
- Atomic operations
- No N+1 queries
- Better performance
- Prevents race conditions with `FOR UPDATE SKIP LOCKED`

---

## 3. Service Layer

### 3.1 Service Composition

```typescript
// lib/services/orchestration-service.ts
import { TaskService } from './task-service'
import { AgentService } from './agent-service'
import { ProjectService } from './project-service'
import { IntelligenceService } from './intelligence-service'

export class OrchestrationService {
  constructor(
    private taskService: TaskService,
    private agentService: AgentService,
    private projectService: ProjectService,
    private intelligenceService: IntelligenceService
  ) {}

  async createProjectWithInitialTasks(
    projectData: CreateProjectRequest,
    initialTasks: CreateTaskRequest[]
  ): Promise<{ project: Project; tasks: Task[] }> {
    // Create project
    const project = await this.projectService.createProject(projectData)

    // Create tasks for project
    const tasks = await Promise.all(
      initialTasks.map(taskData =>
        this.taskService.createTask({
          ...taskData,
          project_id: project.id
        })
      )
    )

    // Analyze initial setup
    await this.intelligenceService.analyzeProjectSetup(project, tasks)

    return { project, tasks }
  }

  async decomposeTask(taskId: string): Promise<Task[]> {
    const task = await this.taskService.getTask(taskId)

    // Use AI to decompose
    const subtaskDescriptions = await this.intelligenceService.decomposeTask(task)

    // Create subtasks
    const subtasks = await Promise.all(
      subtaskDescriptions.map(desc =>
        this.taskService.createTask({
          project_id: task.project_id,
          title: desc.title,
          description: desc.description,
          type: desc.type,
          dependencies: [taskId],
          required_capabilities: desc.capabilities
        })
      )
    )

    return subtasks
  }
}
```

### 3.2 Dependency Injection

```typescript
// lib/services/service-factory.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { UnitOfWork } from '@/lib/repositories/unit-of-work'
import { TaskService } from './task-service'
import { AgentService } from './agent-service'
import { ProjectService } from './project-service'
import { IntelligenceService } from './intelligence-service'
import { OrchestrationService } from './orchestration-service'

export class ServiceFactory {
  private uow: UnitOfWork

  constructor(supabase: SupabaseClient) {
    this.uow = new UnitOfWork(supabase)
  }

  createTaskService(): TaskService {
    const taskRepo = this.uow.getRepository(TaskRepository)
    const agentRepo = this.uow.getRepository(AgentRepository)
    return new TaskService(taskRepo, agentRepo)
  }

  createAgentService(): AgentService {
    const agentRepo = this.uow.getRepository(AgentRepository)
    return new AgentService(agentRepo)
  }

  createProjectService(): ProjectService {
    const projectRepo = this.uow.getRepository(ProjectRepository)
    return new ProjectService(projectRepo)
  }

  createIntelligenceService(): IntelligenceService {
    const analysisRepo = this.uow.getRepository(AnalysisRepository)
    const aiProvider = // ... initialize AI provider
    return new IntelligenceService(analysisRepo, aiProvider)
  }

  createOrchestrationService(): OrchestrationService {
    return new OrchestrationService(
      this.createTaskService(),
      this.createAgentService(),
      this.createProjectService(),
      this.createIntelligenceService()
    )
  }
}

// Usage in API route
export const POST = withAuth(async (request, { user }) => {
  const supabase = await createClient()
  const factory = new ServiceFactory(supabase)

  const orchestrationService = factory.createOrchestrationService()
  const result = await orchestrationService.createProjectWithInitialTasks(...)

  return apiSuccess(result)
})
```

---

## 4. API Layer Improvements

### 4.1 API Versioning

```
app/
├── api/
│   ├── v1/
│   │   ├── tasks/
│   │   ├── agents/
│   │   └── projects/
│   └── v2/  # Future version
│       └── tasks/  # Breaking changes
```

**Implementation:**
```typescript
// app/api/v1/tasks/route.ts
export const POST = withAuth(async (request, { user }) => {
  // v1 implementation
})

// app/api/v2/tasks/route.ts
export const POST = withAuth(async (request, { user }) => {
  // v2 with breaking changes
})
```

### 4.2 Request/Response DTOs

```typescript
// lib/dto/task.dto.ts
export class CreateTaskDTO {
  title: string
  description?: string
  type: TaskType
  project_id: string
  priority?: number
  dependencies?: string[]
  required_capabilities?: string[]
  input_data?: Record<string, unknown>
  metadata?: Record<string, unknown>

  static fromRequest(body: any): CreateTaskDTO {
    // Transform and validate
    return {
      title: body.title?.trim(),
      description: body.description?.trim(),
      type: body.type,
      project_id: body.projectId, // camelCase to snake_case
      priority: body.priority,
      dependencies: body.dependencies || [],
      required_capabilities: body.requiredCapabilities || [],
      input_data: body.inputData || {},
      metadata: body.metadata || {}
    }
  }
}

export class TaskResponseDTO {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: number
  createdAt: string
  updatedAt: string
  project?: ProjectResponseDTO
  assignedAgent?: AgentResponseDTO

  static fromEntity(task: Task): TaskResponseDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      // Transform relations
      project: task.projects ? ProjectResponseDTO.fromEntity(task.projects) : undefined,
      assignedAgent: task.agents ? AgentResponseDTO.fromEntity(task.agents) : undefined
    }
  }
}
```

### 4.3 API Documentation with OpenAPI

```typescript
// lib/api/openapi.ts
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Conductor API',
    version: '1.0.0',
    description: 'AI Agent Orchestration API'
  },
  servers: [
    { url: 'https://conductor.example.com/api/v1' }
  ],
  paths: {
    '/tasks': {
      post: {
        summary: 'Create a new task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      CreateTaskRequest: {
        type: 'object',
        required: ['title', 'type', 'projectId'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['feature', 'bugfix', 'refactor'] },
          projectId: { type: 'string', format: 'uuid' },
          priority: { type: 'integer', minimum: 1, maximum: 10 }
        }
      },
      TaskResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}

// app/api/docs/route.ts
import { openApiSpec } from '@/lib/api/openapi'

export async function GET() {
  return Response.json(openApiSpec)
}
```

---

## 5. Domain-Driven Design

### 5.1 Domain Model

Organize code by business domain instead of technical layer:

```
lib/
├── domains/
│   ├── task-management/
│   │   ├── entities/
│   │   │   ├── task.entity.ts
│   │   │   └── task-log.entity.ts
│   │   ├── repositories/
│   │   │   ├── task.repository.ts
│   │   │   └── task-log.repository.ts
│   │   ├── services/
│   │   │   ├── task.service.ts
│   │   │   └── task-assignment.service.ts
│   │   ├── value-objects/
│   │   │   ├── task-priority.vo.ts
│   │   │   └── task-status.vo.ts
│   │   └── index.ts
│   ├── agent-management/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── index.ts
│   ├── intelligence/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── index.ts
│   └── workflow/
│       ├── entities/
│       ├── repositories/
│       ├── services/
│       └── index.ts
```

### 5.2 Value Objects

```typescript
// lib/domains/task-management/value-objects/task-priority.vo.ts
export class TaskPriority {
  private constructor(private readonly value: number) {
    if (value < 1 || value > 10) {
      throw new Error('Priority must be between 1 and 10')
    }
  }

  static create(value: number): TaskPriority {
    return new TaskPriority(value)
  }

  static LOW = new TaskPriority(3)
  static MEDIUM = new TaskPriority(5)
  static HIGH = new TaskPriority(8)
  static CRITICAL = new TaskPriority(10)

  getValue(): number {
    return this.value
  }

  isHigherThan(other: TaskPriority): boolean {
    return this.value > other.value
  }

  equals(other: TaskPriority): boolean {
    return this.value === other.value
  }
}

// Usage
const priority = TaskPriority.create(8)
if (priority.isHigherThan(TaskPriority.MEDIUM)) {
  // Escalate task
}
```

### 5.3 Domain Events

```typescript
// lib/domains/task-management/events/task-created.event.ts
export class TaskCreatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly createdAt: Date
  ) {}
}

// lib/domains/task-management/events/task-completed.event.ts
export class TaskCompletedEvent {
  constructor(
    public readonly taskId: string,
    public readonly agentId: string,
    public readonly outputData: Record<string, unknown>,
    public readonly completedAt: Date
  ) {}
}

// lib/infrastructure/events/event-bus.ts
type EventHandler = (event: any) => Promise<void>

export class EventBus {
  private handlers = new Map<string, EventHandler[]>()

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  async publish(eventType: string, event: any): Promise<void> {
    const handlers = this.handlers.get(eventType) || []
    await Promise.all(handlers.map(handler => handler(event)))
  }
}

// Usage in service
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus
  ) {}

  async createTask(input: CreateTaskRequest): Promise<Task> {
    const task = await this.taskRepo.create(input)

    // Publish event
    await this.eventBus.publish(
      'TaskCreated',
      new TaskCreatedEvent(task.id, task.project_id, new Date())
    )

    return task
  }
}

// Subscribe to events
eventBus.subscribe('TaskCreated', async (event: TaskCreatedEvent) => {
  // Trigger analysis
  await intelligenceService.analyzeNewTask(event.taskId)
})

eventBus.subscribe('TaskCompleted', async (event: TaskCompletedEvent) => {
  // Check dependent tasks
  await taskService.checkDependentTasks(event.taskId)
})
```

---

## 6. Event-Driven Architecture

### 6.1 Async Event Processing

```typescript
// lib/infrastructure/queue/queue-service.ts
import { Redis } from '@upstash/redis'

export class QueueService {
  private redis: Redis

  constructor() {
    this.redis = Redis.fromEnv()
  }

  async enqueue(queueName: string, data: any): Promise<void> {
    await this.redis.lpush(queueName, JSON.stringify({
      data,
      enqueuedAt: new Date().toISOString()
    }))
  }

  async dequeue(queueName: string): Promise<any | null> {
    const item = await this.redis.rpop(queueName)
    if (!item) return null
    return JSON.parse(item as string).data
  }

  async peek(queueName: string, count = 10): Promise<any[]> {
    const items = await this.redis.lrange(queueName, 0, count - 1)
    return items.map(item => JSON.parse(item as string).data)
  }
}

// Publish to queue instead of immediate processing
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private queue: QueueService
  ) {}

  async createTask(input: CreateTaskRequest): Promise<Task> {
    const task = await this.taskRepo.create(input)

    // Enqueue for async processing
    await this.queue.enqueue('task:analysis', {
      type: 'ANALYZE_TASK',
      taskId: task.id
    })

    return task
  }
}

// Worker to process queue
// workers/queue-worker.ts
const queue = new QueueService()

async function processQueue() {
  while (true) {
    const job = await queue.dequeue('task:analysis')

    if (job) {
      try {
        await handleJob(job)
      } catch (error) {
        // Handle error, maybe re-queue
        console.error('Job failed:', error)
      }
    } else {
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

async function handleJob(job: any) {
  switch (job.type) {
    case 'ANALYZE_TASK':
      await analyzeTask(job.taskId)
      break
    // Other job types
  }
}
```

### 6.2 Webhook Integration

```typescript
// lib/infrastructure/webhooks/webhook-service.ts
export class WebhookService {
  async sendWebhook(url: string, event: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Conductor-Signature': this.generateSignature(event)
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`)
      }
    } catch (error) {
      // Log error, maybe retry
      console.error('Webhook delivery failed:', error)
    }
  }

  private generateSignature(payload: any): string {
    const secret = process.env.WEBHOOK_SECRET!
    const hmac = crypto.createHmac('sha256', secret)
    return hmac.update(JSON.stringify(payload)).digest('hex')
  }
}

// Subscribe webhooks to events
eventBus.subscribe('TaskCompleted', async (event: TaskCompletedEvent) => {
  const webhooks = await getProjectWebhooks(event.projectId)

  for (const webhook of webhooks) {
    await webhookService.sendWebhook(webhook.url, {
      type: 'task.completed',
      data: event
    })
  }
})
```

---

## 7. Caching Strategy

### 7.1 Multi-Layer Caching

```typescript
// lib/infrastructure/cache/cache-service.ts
import { Redis } from '@upstash/redis'

export class CacheService {
  private redis: Redis
  private memory = new Map<string, { value: any; expiresAt: number }>()

  constructor() {
    this.redis = Redis.fromEnv()
  }

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fast)
    const memoryEntry = this.memory.get(key)
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      return memoryEntry.value as T
    }

    // L2: Redis cache (distributed)
    const redisValue = await this.redis.get(key)
    if (redisValue) {
      // Promote to memory cache
      this.memory.set(key, {
        value: redisValue,
        expiresAt: Date.now() + 60000 // 1 minute
      })
      return redisValue as T
    }

    return null
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    // Set in Redis
    await this.redis.set(key, value, { ex: ttlSeconds })

    // Set in memory
    this.memory.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate memory cache
    for (const key of this.memory.keys()) {
      if (key.match(pattern)) {
        this.memory.delete(key)
      }
    }

    // Invalidate Redis cache
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

// lib/repositories/cached-repository.ts
export class CachedRepository<T> extends BaseRepository<T> {
  constructor(
    supabase: SupabaseClient,
    tableName: string,
    private cache: CacheService
  ) {
    super(supabase, tableName)
  }

  async findById(id: string): Promise<T | null> {
    const cacheKey = `${this.tableName}:${id}`

    // Try cache first
    const cached = await this.cache.get<T>(cacheKey)
    if (cached) return cached

    // Fetch from database
    const entity = await super.findById(id)

    // Cache result
    if (entity) {
      await this.cache.set(cacheKey, entity, 300) // 5 minutes
    }

    return entity
  }

  async update(id: string, input: Partial<T>): Promise<T> {
    const entity = await super.update(id, input)

    // Invalidate cache
    await this.cache.invalidate(`${this.tableName}:${id}`)
    await this.cache.invalidate(`${this.tableName}:list:*`)

    return entity
  }
}
```

### 7.2 Cache-Aside Pattern

```typescript
// lib/services/task-service.ts (with caching)
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private cache: CacheService
  ) {}

  async getTask(id: string): Promise<Task> {
    const cacheKey = `task:${id}`

    // Try cache
    let task = await this.cache.get<Task>(cacheKey)

    if (!task) {
      // Cache miss - fetch from database
      task = await this.taskRepo.findById(id)

      if (!task) {
        throw new NotFoundError('Task')
      }

      // Store in cache
      await this.cache.set(cacheKey, task, 300)
    }

    return task
  }

  async updateTask(id: string, input: Partial<Task>): Promise<Task> {
    const task = await this.taskRepo.update(id, input)

    // Invalidate cache
    await this.cache.invalidate(`task:${id}`)
    await this.cache.invalidate(`tasks:*`)

    return task
  }
}
```

---

## 8. Scalability Patterns

### 8.1 Read/Write Separation

```typescript
// lib/infrastructure/database/database-router.ts
export class DatabaseRouter {
  private readReplicas: SupabaseClient[]
  private writeClient: SupabaseClient
  private currentReplicaIndex = 0

  constructor(
    writeClient: SupabaseClient,
    readReplicas: SupabaseClient[]
  ) {
    this.writeClient = writeClient
    this.readReplicas = readReplicas
  }

  getReadClient(): SupabaseClient {
    // Round-robin load balancing
    const client = this.readReplicas[this.currentReplicaIndex]
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.readReplicas.length
    return client
  }

  getWriteClient(): SupabaseClient {
    return this.writeClient
  }
}

// lib/repositories/base-repository.ts (updated)
export abstract class BaseRepository<T> {
  constructor(
    protected dbRouter: DatabaseRouter,
    protected tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    // Use read replica
    const db = this.dbRouter.getReadClient()
    const { data, error } = await db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw this.handleError(error)
    return data as T
  }

  async create(input: Partial<T>): Promise<T> {
    // Use write client
    const db = this.dbRouter.getWriteClient()
    const { data, error } = await db
      .from(this.tableName)
      .insert([input])
      .select()
      .single()

    if (error) throw this.handleError(error)
    return data as T
  }
}
```

### 8.2 Connection Pooling

```typescript
// lib/infrastructure/database/connection-pool.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types'

export class ConnectionPool {
  private pool: SupabaseClient<Database>[] = []
  private available: SupabaseClient<Database>[] = []
  private inUse = new Set<SupabaseClient<Database>>()

  constructor(
    private url: string,
    private key: string,
    private poolSize = 10
  ) {
    this.initialize()
  }

  private initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      const client = createClient<Database>(this.url, this.key)
      this.pool.push(client)
      this.available.push(client)
    }
  }

  async acquire(): Promise<SupabaseClient<Database>> {
    if (this.available.length === 0) {
      // Wait for connection to become available
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.acquire()
    }

    const client = this.available.pop()!
    this.inUse.add(client)
    return client
  }

  release(client: SupabaseClient<Database>): void {
    this.inUse.delete(client)
    this.available.push(client)
  }

  async withConnection<T>(
    callback: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = await this.acquire()
    try {
      return await callback(client)
    } finally {
      this.release(client)
    }
  }
}
```

### 8.3 Background Job Processing

```typescript
// workers/background-processor.ts
import { QueueService } from '@/lib/infrastructure/queue/queue-service'
import { ServiceFactory } from '@/lib/services/service-factory'

export class BackgroundProcessor {
  private running = false

  constructor(
    private queue: QueueService,
    private factory: ServiceFactory
  ) {}

  start() {
    this.running = true
    this.processJobs()
  }

  stop() {
    this.running = false
  }

  private async processJobs() {
    while (this.running) {
      try {
        const job = await this.queue.dequeue('background-jobs')

        if (job) {
          await this.handleJob(job)
        } else {
          // No jobs, wait before checking again
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('Job processing error:', error)
      }
    }
  }

  private async handleJob(job: any) {
    switch (job.type) {
      case 'ANALYZE_TASK':
        const intelligenceService = this.factory.createIntelligenceService()
        await intelligenceService.analyzeTask(job.taskId)
        break

      case 'GENERATE_REPORT':
        // Generate report logic
        break

      case 'CLEANUP_OLD_DATA':
        // Cleanup logic
        break

      default:
        console.warn('Unknown job type:', job.type)
    }
  }
}

// Deploy as separate worker
const queue = new QueueService()
const factory = new ServiceFactory(supabase)
const processor = new BackgroundProcessor(queue, factory)

processor.start()

process.on('SIGTERM', () => {
  processor.stop()
  process.exit(0)
})
```

---

## 9. Observability & Monitoring

### 9.1 Structured Logging

```typescript
// lib/infrastructure/logging/logger.ts
import * as Sentry from '@sentry/nextjs'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export class Logger {
  constructor(private context: string) {}

  debug(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, meta)
  }

  info(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.WARN, message, meta)
  }

  error(message: string, error?: Error, meta?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, { ...meta, error: error?.stack })

    if (error) {
      Sentry.captureException(error, {
        tags: { context: this.context },
        extra: meta
      })
    }
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logEntry, null, 2))
    } else {
      // Send to logging service (Datadog, LogDNA, etc.)
      console.log(JSON.stringify(logEntry))
    }
  }
}

// Usage
const logger = new Logger('TaskService')

logger.info('Creating new task', {
  projectId: 'abc-123',
  taskType: 'feature'
})

logger.error('Failed to create task', error, {
  projectId: 'abc-123',
  input: taskData
})
```

### 9.2 Performance Monitoring

```typescript
// lib/infrastructure/monitoring/performance.ts
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  startTimer(label: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)
  }

  getMetrics(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null

    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99)
    }
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.slice().sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index]
  }
}

// Usage in service
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private perf: PerformanceMonitor
  ) {}

  async createTask(input: CreateTaskRequest): Promise<Task> {
    const endTimer = this.perf.startTimer('task.create')

    try {
      const task = await this.taskRepo.create(input)
      return task
    } finally {
      endTimer()
    }
  }
}

// Report metrics endpoint
export async function GET() {
  const metrics = {
    'task.create': perf.getMetrics('task.create'),
    'task.assign': perf.getMetrics('task.assign'),
    'agent.poll': perf.getMetrics('agent.poll')
  }

  return Response.json(metrics)
}
```

### 9.3 Health Checks

```typescript
// app/api/health/route.ts
import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      queue: await checkQueue()
    }
  }

  const isHealthy = Object.values(health.checks).every(c => c.status === 'ok')

  return Response.json(health, {
    status: isHealthy ? 200 : 503
  })
}

async function checkDatabase() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('projects').select('count').limit(1)

    return {
      status: error ? 'error' : 'ok',
      message: error?.message
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkCache() {
  try {
    const redis = Redis.fromEnv()
    await redis.ping()

    return { status: 'ok' }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkQueue() {
  // Check queue health
  return { status: 'ok' }
}
```

---

## 10. Migration Strategy

### 10.1 Phased Migration Plan

#### Phase 1: Foundation (Weeks 1-2)
1. Create repository base classes
2. Implement 2-3 repositories (Task, Agent, Project)
3. Add error handling infrastructure
4. Set up logging and monitoring

#### Phase 2: Service Layer (Weeks 3-4)
1. Create service base patterns
2. Implement core services (Task, Agent)
3. Add dependency injection
4. Update 5-10 API routes to use new pattern

#### Phase 3: Expand (Weeks 5-6)
1. Complete all repositories
2. Complete all services
3. Update remaining API routes
4. Add caching layer

#### Phase 4: Advanced Features (Weeks 7-8)
1. Implement event bus
2. Add queue processing
3. Set up background workers
4. Implement advanced caching

#### Phase 5: Testing & Optimization (Weeks 9-10)
1. Add comprehensive tests
2. Performance optimization
3. Database query optimization
4. Load testing

### 10.2 Backward Compatibility

```typescript
// Keep old API routes working during migration
// app/api/tasks/route.ts

import { isFeatureFlagEnabled } from '@/lib/feature-flags'

export async function POST(request: NextRequest) {
  if (isFeatureFlagEnabled('new-architecture')) {
    // New implementation with services
    return newImplementation(request)
  } else {
    // Old implementation
    return oldImplementation(request)
  }
}

async function newImplementation(request: NextRequest) {
  const supabase = await createClient()
  const factory = new ServiceFactory(supabase)
  const taskService = factory.createTaskService()

  const body = await request.json()
  const task = await taskService.createTask(body)

  return apiSuccess(task, 201)
}

async function oldImplementation(request: NextRequest) {
  // Existing implementation
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase.from('tasks').insert([body])
  if (error) throw error

  return apiSuccess(data, 201)
}
```

### 10.3 Feature Flags

```typescript
// lib/infrastructure/feature-flags.ts
const featureFlags = {
  'new-architecture': process.env.FEATURE_NEW_ARCHITECTURE === 'true',
  'caching-enabled': process.env.FEATURE_CACHING === 'true',
  'event-bus-enabled': process.env.FEATURE_EVENT_BUS === 'true'
}

export function isFeatureFlagEnabled(flag: string): boolean {
  return featureFlags[flag] ?? false
}

// Gradually enable features
// .env.production
FEATURE_NEW_ARCHITECTURE=true  # Enable for all
FEATURE_CACHING=false          # Not yet
```

---

## Summary

### Key Architectural Improvements

1. **Layered Architecture** - Clear separation between presentation, business logic, data access, and infrastructure
2. **Repository Pattern** - Centralized data access with type safety
3. **Service Layer** - Reusable business logic independent of API layer
4. **Domain-Driven Design** - Organize by business domain, not technical layer
5. **Event-Driven Architecture** - Loosely coupled components with async processing
6. **Caching Strategy** - Multi-layer caching for performance
7. **Scalability Patterns** - Read/write separation, connection pooling, background processing
8. **Observability** - Comprehensive logging, monitoring, and health checks

### Expected Benefits

- **Testability:** Business logic easily testable in isolation
- **Maintainability:** Clear boundaries and single responsibility
- **Scalability:** Ready for 10x growth with caching and optimization
- **Flexibility:** Easy to swap implementations (different databases, caches, etc.)
- **Developer Velocity:** Reusable patterns speed up development
- **Reliability:** Better error handling and monitoring

### Migration Timeline

- **Phase 1-2 (4 weeks):** Foundation and core services
- **Phase 3 (2 weeks):** Complete migration
- **Phase 4 (2 weeks):** Advanced features
- **Phase 5 (2 weeks):** Testing and optimization
- **Total: 10 weeks** for complete architectural transformation

---

**Next Steps:**
1. Review with engineering team
2. Prioritize phases based on business needs
3. Start with Phase 1 (foundation)
4. Migrate incrementally with feature flags
5. Monitor performance and adjust

**Questions?** This architecture supports the current application and scales to enterprise needs while maintaining code quality and developer productivity.
