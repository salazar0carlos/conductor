# Conductor

An AI Agent Orchestration System for building, managing, and orchestrating AI agents with visual workflows.

## Overview

Conductor is a modern platform for creating complex multi-agent AI systems. Design workflows visually, configure agents with custom capabilities, and monitor execution in real-time.

## Features

- **Agent Management**: Create and configure AI agents with custom capabilities and behaviors
- **Workflow Builder**: Design complex workflows with visual drag-and-drop interface
- **Real-time Execution**: Monitor and control agent execution in real-time with detailed logs
- **TypeScript**: Full type safety across the entire stack
- **Supabase Integration**: Scalable backend with authentication and real-time capabilities

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel (recommended)

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
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
conductor/
├── app/                    # Next.js App Router pages
├── components/            # React components
│   ├── ui/               # UI components
│   ├── agents/           # Agent-related components
│   └── workflow/         # Workflow builder components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   └── utils/            # Helper functions
├── services/             # Business logic and API services
│   ├── agents/           # Agent management services
│   └── workflow/         # Workflow execution services
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Setup

To set up your Supabase database, you'll need to create the following tables:

- `agents` - Store agent configurations
- `workflows` - Store workflow definitions
- `executions` - Track workflow execution history

Refer to the type definitions in `types/index.ts` for the schema structure.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Roadmap

- [ ] Visual workflow builder
- [ ] Agent templates library
- [ ] Real-time collaboration
- [ ] Workflow versioning
- [ ] Analytics and monitoring dashboard
- [ ] Integration with popular LLM providers
- [ ] API endpoints for programmatic access

## Support

For questions or issues, please open an issue on GitHub.
