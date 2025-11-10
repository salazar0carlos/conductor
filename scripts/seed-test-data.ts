import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestData() {
  console.log('🌱 Seeding test data...\n')

  try {
    // 1. Create test projects
    console.log('Creating test projects...')
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          name: 'E-commerce Platform',
          description: 'Building a modern e-commerce platform with Next.js and Stripe',
          github_repo: 'example/ecommerce-platform',
          github_branch: 'main',
          status: 'active',
          metadata: { tech_stack: ['nextjs', 'typescript', 'stripe', 'tailwind'] }
        },
        {
          name: 'Mobile App Backend',
          description: 'RESTful API for mobile application',
          github_repo: 'example/mobile-backend',
          github_branch: 'develop',
          status: 'active',
          metadata: { tech_stack: ['nodejs', 'express', 'postgresql'] }
        },
        {
          name: 'Analytics Dashboard',
          description: 'Real-time analytics dashboard for business metrics',
          status: 'paused',
          metadata: { tech_stack: ['react', 'recharts', 'websockets'] }
        }
      ])
      .select()

    if (projectError) throw projectError
    console.log(`✅ Created ${projects.length} projects\n`)

    // 2. Create test agents
    console.log('Creating test agents...')
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .insert([
        {
          name: 'Senior Developer Bot',
          type: 'llm',
          capabilities: ['coding', 'architecture', 'code-review', 'debugging'],
          config: { model: 'claude-sonnet-4', temperature: 0.3 },
          status: 'active',
          last_heartbeat: new Date().toISOString(),
          metadata: { expertise: 'full-stack' }
        },
        {
          name: 'QA Automation Agent',
          type: 'tool',
          capabilities: ['testing', 'automation', 'quality-assurance'],
          config: { framework: 'playwright' },
          status: 'idle',
          last_heartbeat: new Date().toISOString(),
          metadata: { expertise: 'testing' }
        },
        {
          name: 'Code Analyzer',
          type: 'analyzer',
          capabilities: ['analysis', 'pattern-detection', 'code-quality'],
          config: { model: 'claude-sonnet-4', temperature: 0.2 },
          status: 'busy',
          last_heartbeat: new Date().toISOString(),
          metadata: { expertise: 'static-analysis' }
        },
        {
          name: 'Project Supervisor',
          type: 'supervisor',
          capabilities: ['review', 'prioritization', 'planning'],
          config: { model: 'claude-sonnet-4', temperature: 0.2 },
          status: 'active',
          last_heartbeat: new Date().toISOString(),
          metadata: { role: 'supervisor' }
        },
        {
          name: 'DevOps Agent',
          type: 'tool',
          capabilities: ['deployment', 'ci-cd', 'infrastructure'],
          config: { tools: ['docker', 'kubernetes', 'terraform'] },
          status: 'offline',
          last_heartbeat: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          metadata: { expertise: 'devops' }
        }
      ])
      .select()

    if (agentError) throw agentError
    console.log(`✅ Created ${agents.length} agents\n`)

    // 3. Create test tasks
    console.log('Creating test tasks...')
    const ecommerceProject = projects.find(p => p.name === 'E-commerce Platform')!
    const mobileProject = projects.find(p => p.name === 'Mobile App Backend')!
    const seniorDev = agents.find(a => a.name === 'Senior Developer Bot')!
    const qaAgent = agents.find(a => a.name === 'QA Automation Agent')!

    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .insert([
        // E-commerce tasks
        {
          project_id: ecommerceProject.id,
          title: 'Implement shopping cart functionality',
          description: 'Add shopping cart with persistent storage, quantity updates, and checkout flow',
          type: 'feature',
          priority: 9,
          status: 'completed',
          assigned_agent_id: seniorDev.id,
          required_capabilities: ['coding', 'architecture'],
          input_data: {
            requirements: ['persistent cart', 'quantity management', 'price calculation'],
            tech_stack: ['nextjs', 'zustand', 'local-storage']
          },
          output_data: {
            files_created: ['components/Cart.tsx', 'stores/cart-store.ts', 'hooks/useCart.ts'],
            lines_of_code: 450,
            tests_added: 25,
            completion_notes: 'Implemented full cart functionality with persistence and real-time updates'
          },
          started_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          completed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          metadata: { complexity: 'medium' }
        },
        {
          project_id: ecommerceProject.id,
          title: 'Add Stripe payment integration',
          description: 'Integrate Stripe for payment processing with webhooks',
          type: 'feature',
          priority: 10,
          status: 'in_progress',
          assigned_agent_id: seniorDev.id,
          required_capabilities: ['coding'],
          input_data: {
            requirements: ['stripe checkout', 'webhook handling', 'payment confirmation'],
            api_version: 'latest'
          },
          started_at: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
          metadata: { complexity: 'high' }
        },
        {
          project_id: ecommerceProject.id,
          title: 'Write e2e tests for checkout flow',
          description: 'Comprehensive end-to-end tests for the entire checkout process',
          type: 'test',
          priority: 8,
          status: 'pending',
          required_capabilities: ['testing', 'automation'],
          input_data: {
            test_cases: ['add to cart', 'update quantity', 'apply coupon', 'checkout', 'payment'],
            tool: 'playwright'
          },
          metadata: { complexity: 'medium' }
        },
        {
          project_id: ecommerceProject.id,
          title: 'Fix product image loading performance',
          description: 'Optimize image loading with lazy loading and proper caching',
          type: 'bugfix',
          priority: 7,
          status: 'pending',
          required_capabilities: ['coding', 'debugging'],
          input_data: {
            issue: 'slow page load times due to large images',
            target_lcp: '<2.5s'
          },
          metadata: { complexity: 'low' }
        },
        // Mobile backend tasks
        {
          project_id: mobileProject.id,
          title: 'Implement user authentication API',
          description: 'JWT-based authentication with refresh tokens',
          type: 'feature',
          priority: 10,
          status: 'completed',
          assigned_agent_id: seniorDev.id,
          required_capabilities: ['coding'],
          input_data: {
            requirements: ['jwt tokens', 'refresh tokens', 'password hashing'],
            endpoints: ['/auth/register', '/auth/login', '/auth/refresh']
          },
          output_data: {
            endpoints_created: 3,
            tests_added: 15,
            security_measures: ['bcrypt', 'rate-limiting', 'token-rotation']
          },
          started_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          completed_at: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
          metadata: { complexity: 'high' }
        },
        {
          project_id: mobileProject.id,
          title: 'Add rate limiting middleware',
          description: 'Implement rate limiting to prevent API abuse',
          type: 'feature',
          priority: 8,
          status: 'completed',
          assigned_agent_id: seniorDev.id,
          required_capabilities: ['coding'],
          input_data: {
            limits: { anonymous: '100/hour', authenticated: '1000/hour' }
          },
          output_data: {
            middleware_added: 'rate-limiter.ts',
            storage: 'redis',
            algorithm: 'sliding-window'
          },
          started_at: new Date(Date.now() - 82800000).toISOString(),
          completed_at: new Date(Date.now() - 79200000).toISOString(),
          metadata: { complexity: 'medium' }
        },
        {
          project_id: mobileProject.id,
          title: 'Database query optimization',
          description: 'Optimize slow queries and add proper indexes',
          type: 'refactor',
          priority: 6,
          status: 'pending',
          required_capabilities: ['coding', 'debugging'],
          input_data: {
            slow_queries: ['user_activity', 'notifications', 'feed_generation'],
            target_improvement: '50% faster'
          },
          metadata: { complexity: 'medium' }
        },
        {
          project_id: mobileProject.id,
          title: 'API documentation with OpenAPI',
          description: 'Generate comprehensive API documentation',
          type: 'docs',
          priority: 5,
          status: 'pending',
          required_capabilities: ['coding'],
          input_data: {
            tool: 'swagger',
            endpoints_count: 25
          },
          metadata: { complexity: 'low' }
        },
        {
          project_id: mobileProject.id,
          title: 'Fix memory leak in WebSocket handler',
          description: 'Memory usage grows over time with active WebSocket connections',
          type: 'bugfix',
          priority: 9,
          status: 'failed',
          assigned_agent_id: seniorDev.id,
          required_capabilities: ['coding', 'debugging'],
          input_data: {
            issue: 'memory leak in ws connection pooling',
            profiler_data: 'heap-snapshot.heapsnapshot'
          },
          error_message: 'Unable to reproduce the memory leak in isolated environment. Need production debugging access.',
          started_at: new Date(Date.now() - 7200000).toISOString(),
          completed_at: new Date(Date.now() - 5400000).toISOString(),
          metadata: { complexity: 'high' }
        }
      ])
      .select()

    if (taskError) throw taskError
    console.log(`✅ Created ${tasks.length} tasks\n`)

    // 4. Create some task logs
    console.log('Creating task logs...')
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const taskLogs = []

    for (const task of completedTasks.slice(0, 2)) { // Just first 2 for demo
      taskLogs.push(
        {
          task_id: task.id,
          agent_id: task.assigned_agent_id,
          level: 'info',
          message: 'Task started',
          data: { timestamp: task.started_at }
        },
        {
          task_id: task.id,
          agent_id: task.assigned_agent_id,
          level: 'info',
          message: 'Analyzing requirements',
          data: { duration: '5s' }
        },
        {
          task_id: task.id,
          agent_id: task.assigned_agent_id,
          level: 'info',
          message: 'Generating code',
          data: { files: 3 }
        },
        {
          task_id: task.id,
          agent_id: task.assigned_agent_id,
          level: 'info',
          message: 'Running tests',
          data: { passed: true }
        },
        {
          task_id: task.id,
          agent_id: task.assigned_agent_id,
          level: 'info',
          message: 'Task completed successfully',
          data: { timestamp: task.completed_at }
        }
      )
    }

    const { error: logError } = await supabase
      .from('task_logs')
      .insert(taskLogs)

    if (logError) throw logError
    console.log(`✅ Created ${taskLogs.length} task logs\n`)

    // 5. Create sample analysis
    console.log('Creating sample analysis...')
    const analyzer = agents.find(a => a.type === 'analyzer')!
    const supervisor = agents.find(a => a.type === 'supervisor')!
    const completedTask = completedTasks[0]

    const { data: analyses, error: analysisError } = await supabase
      .from('analysis_history')
      .insert([
        {
          analyzer_agent_id: analyzer.id,
          task_id: completedTask.id,
          project_id: completedTask.project_id,
          analysis_type: 'task_completion',
          findings: {
            summary: 'Shopping cart implementation completed successfully with good code quality',
            strengths: [
              'Clean component architecture',
              'Comprehensive test coverage (25 tests)',
              'Proper state management with Zustand',
              'Good error handling'
            ],
            concerns: [
              'Local storage might not scale for large carts',
              'No server-side cart backup',
              'Missing cart abandonment tracking'
            ],
            patterns: ['Uses modern React patterns', 'Follows Next.js best practices']
          },
          suggestions: [
            {
              title: 'Add server-side cart synchronization',
              description: 'Store cart data on the backend to enable cross-device sync and recovery',
              category: 'architecture',
              impact: 'high',
              effort: 'medium',
              priority_score: 8
            },
            {
              title: 'Implement cart abandonment tracking',
              description: 'Track when users abandon carts to send reminder emails',
              category: 'product',
              impact: 'medium',
              effort: 'low',
              priority_score: 6
            }
          ],
          priority_score: 7,
          status: 'approved',
          reviewed_by_agent_id: supervisor.id,
          reviewed_at: new Date().toISOString(),
          metadata: {
            model: 'claude-sonnet-4',
            review_duration: '15s'
          }
        },
        {
          analyzer_agent_id: analyzer.id,
          project_id: ecommerceProject.id,
          analysis_type: 'pattern_detection',
          findings: {
            patterns_detected: [
              'High focus on payment and checkout features',
              'Testing coverage varies significantly between features',
              'Performance optimizations often come late in development'
            ],
            trends: [
              'Increased priority on payment-related features',
              'Growing backlog of testing tasks'
            ],
            root_causes: [
              'Testing not integrated into feature development workflow',
              'Performance not considered during initial development'
            ],
            insights: [
              'Team should adopt TDD to increase test coverage',
              'Performance budgets should be set early'
            ]
          },
          suggestions: [
            {
              title: 'Adopt Test-Driven Development',
              description: 'Write tests before implementing features to ensure comprehensive coverage',
              category: 'process',
              impact: 'high',
              effort: 'high',
              priority_score: 9
            },
            {
              title: 'Set performance budgets early',
              description: 'Define performance metrics at the start of each feature',
              category: 'process',
              impact: 'medium',
              effort: 'low',
              priority_score: 7
            }
          ],
          priority_score: 8,
          status: 'pending',
          metadata: {
            model: 'claude-sonnet-4',
            tasks_analyzed: 5
          }
        }
      ])
      .select()

    if (analysisError) throw analysisError
    console.log(`✅ Created ${analyses.length} analyses\n`)

    // Summary
    console.log('\n📊 Test Data Summary:')
    console.log(`   Projects: ${projects.length}`)
    console.log(`   Agents: ${agents.length}`)
    console.log(`   Tasks: ${tasks.length}`)
    console.log(`   Task Logs: ${taskLogs.length}`)
    console.log(`   Analyses: ${analyses.length}`)
    console.log('\n✨ Test data created successfully!')
    console.log('\n🚀 You can now test the application at http://localhost:3000/dashboard')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedTestData()
