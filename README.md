# Conductor

An AI Agent Orchestration System - a meta-application where AI agents poll for tasks, execute them autonomously, and report back with results.

## Overview

Conductor is a production-ready platform for building autonomous AI agent systems. Agents register with capabilities, poll for work, execute tasks, and feed results back to an intelligence layer that suggests improvements.

## Core Features

### ✅ Implemented

- **Task Queue System**: Priority-based task assignment with dependencies and capability matching
- **Agent Registry**: Register agents with capabilities, monitor heartbeats and status
- **Project Management**: Organize work into projects with GitHub integration
- **Task Execution**: Agents poll for tasks, execute them, and report completion or failure
- **Task Logging**: Detailed execution logs for debugging and monitoring
- **Intelligence Layer**: AI agents analyze completed work and suggest improvements
- **Supervisor Review**: Review and prioritize improvement suggestions
- **Dashboard**: Real-time stats for projects, tasks, agents, and analysis
- **GitHub Webhooks**: Handle CI/CD events and create analysis records
- **REST API**: Complete API for agent integration and management
- **TypeScript**: Full type safety across the entire stack
- **Supabase**: Production database with RLS policies

### 🎨 UI Pages

- **Dashboard** (`/dashboard`): System overview with real-time stats
- **Projects** (`/projects`): Manage development projects
- **Tasks** (`/tasks`): View and monitor task execution
- **Agents** (`/agents`): Agent registry with capability and status monitoring
- **Intelligence** (`/intelligence`): AI-powered analysis and suggestions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Clean, professional design inspired by Linear/Vercel
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/conductor.git
cd conductor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Set up the database:

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

Quick setup: Copy the contents of `supabase/migrations/20250110_initial_schema.sql` and run it in your Supabase SQL Editor.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## API Documentation

### Agent Endpoints

- `GET /api/agents` - List all agents
- `POST /api/agents` - Register a new agent
- `GET /api/agents/{id}` - Get agent details
- `PATCH /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `POST /api/agents/heartbeat` - Send agent heartbeat

### Task Endpoints

- `GET /api/tasks` - List tasks (filter by project_id, status)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{id}` - Get task details
- `PATCH /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/poll` - Poll for next available task (agent polling)
- `POST /api/tasks/{id}/complete` - Mark task as completed
- `POST /api/tasks/{id}/fail` - Mark task as failed
- `GET /api/tasks/{id}/logs` - Get task logs
- `POST /api/tasks/{id}/logs` - Add task log

### Project Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/{id}` - Get project details
- `PATCH /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Intelligence Endpoints

- `GET /api/intelligence` - List analysis records
- `POST /api/intelligence` - Create analysis record
- `GET /api/intelligence/{id}` - Get analysis details
- `PATCH /api/intelligence/{id}` - Update analysis (review, approve)

### Dashboard

- `GET /api/dashboard/stats` - Get system-wide statistics

### Webhooks

- `POST /api/webhooks/github` - GitHub webhook handler

## Agent Integration

To integrate an AI agent with Conductor:

1. **Register the agent**:
```typescript
POST /api/agents
{
  "name": "My Agent",
  "type": "llm",
  "capabilities": ["coding", "analysis"],
  "config": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

2. **Send heartbeats** (every 30-60 seconds):
```typescript
POST /api/agents/heartbeat
{
  "agent_id": "agent-uuid",
  "status": "active"
}
```

3. **Poll for tasks**:
```typescript
POST /api/tasks/poll
{
  "agent_id": "agent-uuid",
  "capabilities": ["coding", "analysis"]
}
```

4. **Execute and report**:
```typescript
// On success
POST /api/tasks/{task_id}/complete
{
  "agent_id": "agent-uuid",
  "output_data": { "result": "..." }
}

// On failure
POST /api/tasks/{task_id}/fail
{
  "agent_id": "agent-uuid",
  "error_message": "Error details"
}
```

## Project Structure

```
conductor/
├── app/
│   ├── api/              # API routes
│   │   ├── agents/       # Agent management
│   │   ├── tasks/        # Task queue & execution
│   │   ├── projects/     # Project management
│   │   ├── intelligence/ # Intelligence layer
│   │   ├── dashboard/    # Dashboard stats
│   │   └── webhooks/     # GitHub webhooks
│   ├── dashboard/        # Dashboard page
│   ├── projects/         # Projects page
│   ├── tasks/            # Tasks page
│   ├── agents/           # Agents page
│   └── intelligence/     # Intelligence page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard components
│   ├── projects/         # Project components
│   ├── tasks/            # Task components
│   ├── agents/           # Agent components
│   └── intelligence/     # Intelligence components
├── lib/
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Helper functions
├── types/                # TypeScript definitions
├── supabase/
│   └── migrations/       # Database schema
└── DATABASE_SETUP.md     # Database setup guide
```

## Database Schema

- **projects**: Top-level containers with GitHub integration
- **agents**: Registered AI agents with capabilities and status
- **tasks**: Work items with priorities, dependencies, and status tracking
- **task_logs**: Execution logs for debugging
- **analysis_history**: Intelligence layer findings and suggestions

See `types/index.ts` for complete type definitions.

## Design Philosophy

- **Clean & Professional**: Linear/Vercel-inspired aesthetics
- **Functional**: No unnecessary animations or visual noise
- **Neutral Palette**: Intentional use of color for meaning
- **Production-Ready**: Type-safe, error-handled, performant
- **Mobile Responsive**: Works on all screen sizes

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
GITHUB_TOKEN=optional
GITHUB_WEBHOOK_SECRET=optional
```

## Security Considerations

- RLS policies are currently permissive - tighten for production
- Implement authentication for user-facing features
- Add signature verification for GitHub webhooks
- Rotate service role keys regularly
- Use environment-specific configurations

## Roadmap

### Phase 1: Core System ✅
- [x] Task queue with polling
- [x] Agent registry and heartbeat
- [x] Project management
- [x] Intelligence layer
- [x] Dashboard and UI

### Phase 2: Enhanced Features
- [ ] Real-time updates with Supabase subscriptions
- [ ] WebSocket support for live agent communication
- [ ] Task scheduling and cron jobs
- [ ] Agent templates library
- [ ] Bulk operations

### Phase 3: Intelligence
- [ ] Pattern detection across projects
- [ ] Automated improvement implementation
- [ ] Learning from task outcomes
- [ ] Predictive task routing

### Phase 4: Enterprise
- [ ] Multi-tenant support
- [ ] RBAC and permissions
- [ ] Audit logs
- [ ] Advanced analytics
- [ ] SLA monitoring

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Support

For questions or issues, please open an issue on GitHub.
