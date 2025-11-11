# Autonomous Agent Guide - How It Actually Works

## The Problem I Solved

The starter code (`agent-starter.py`) was just a **template** - it didn't actually DO anything. The `execute_task()` method was empty, requiring humans to write all the logic.

**This made the system useless for autonomous work.**

## The Solution: Real Autonomous Agent

`autonomous-agent.py` is a **fully functional agent** that can:

1. ✅ Understand natural language task descriptions
2. ✅ Analyze your existing codebase
3. ✅ Generate code using Claude AI
4. ✅ Write/modify files in your project
5. ✅ Run commands (tests, linters, builds)
6. ✅ Validate changes
7. ✅ Commit to git automatically
8. ✅ Report detailed results

## Complete End-to-End Example

### Setup (One-Time)

```bash
# 1. Install dependencies
pip install requests anthropic gitpython

# 2. Register agent in Conductor UI
#    - Navigate to https://conductor-pi.vercel.app/agents
#    - Click "Register Agent"
#    - Name: "My Autonomous Agent"
#    - Type: LLM
#    - Capabilities: coding, debugging, refactoring, testing, analysis
#    - Copy the Agent ID from the response

# 3. Run the autonomous agent
python autonomous-agent.py \
  --agent-id YOUR_AGENT_ID \
  --api-key YOUR_ANTHROPIC_KEY \
  --workspace /path/to/your/project \
  --base-url https://conductor-pi.vercel.app
```

### Usage Flow

**Step 1: Create a Task in Conductor**

Go to https://conductor-pi.vercel.app/tasks and create a task:

```
Title: Add user authentication to the app
Description: Implement JWT-based authentication with:
- Login endpoint
- Register endpoint
- Protected route middleware
- Token validation

Type: Feature
Priority: 9
Required Capabilities: coding, authentication, security
```

**Step 2: Agent Automatically Executes**

The autonomous agent will:

```
1. Poll API and receive the task
2. Log: "🤖 Starting autonomous execution of feature: Add user authentication"
3. Log: "📋 Analyzing task requirements..."
4. Use Claude to create execution plan:
   {
     "overview": "Implement JWT auth with Express middleware",
     "steps": [
       {
         "action": "create_file",
         "target": "src/auth/jwt.ts",
         "description": "JWT token generation and validation"
       },
       {
         "action": "create_file",
         "target": "src/middleware/auth.ts",
         "description": "Authentication middleware"
       },
       {
         "action": "create_file",
         "target": "src/routes/auth.ts",
         "description": "Login and register endpoints"
       },
       {
         "action": "run_command",
         "target": "npm test",
         "description": "Validate implementation"
       }
     ]
   }

5. Log: "🔍 Reading existing codebase..."
6. Read package.json, related files for context

7. Log: "⚙️ Step 1/4: Create JWT token handler"
8. Use Claude to generate src/auth/jwt.ts with:
   - Token generation
   - Token validation
   - Refresh token logic
   - Proper TypeScript types

9. Log: "✍️ Created src/auth/jwt.ts (450 chars)"

10. Log: "⚙️ Step 2/4: Create auth middleware"
11. Generate src/middleware/auth.ts

12. Log: "⚙️ Step 3/4: Create auth routes"
13. Generate src/routes/auth.ts

14. Log: "⚙️ Step 4/4: Run tests"
15. Execute: npm test
16. Log: "🔧 Ran: npm test\nExit code: 0"

17. Log: "✅ Validating changes..."
18. Check git status, run type-check

19. Log: "💾 Committing changes to git..."
20. Git add + commit: "🤖 Add user authentication to the app"
21. Log: "✅ Committed: a1b2c3d4"

22. Mark task as COMPLETED with output:
    {
      "success": true,
      "files_modified": ["src/auth/jwt.ts", "src/middleware/auth.ts", "src/routes/auth.ts"],
      "commit": "a1b2c3d4",
      "execution_summary": "Created 3 files | Ran 1 command"
    }
```

**Step 3: View Results**

- Task status changes to "completed" in real-time
- View execution logs on task detail page
- See the commit in your git history
- Files are actually created and ready to use

## What Makes This Autonomous

### Traditional Agent (Starter Code)
```python
def execute_task(self, task):
    # Human writes ALL this logic:
    # 1. Parse requirements (manual)
    # 2. Write code (manual)
    # 3. Test code (manual)
    # 4. Commit (manual)
    return {"result": "done"}  # Lies - nothing happened
```

### Autonomous Agent (autonomous-agent.py)
```python
def execute_task(self, task):
    # AI does ALL of this:
    plan = self._ai_create_plan(task)           # Claude plans it
    context = self._read_codebase()             # Reads existing code
    for step in plan.steps:
        code = self._ai_generate_code(step)     # Claude writes code
        self._write_file(code)                  # Actually writes file
        self._run_tests()                       # Validates it works
    self._git_commit()                          # Commits changes
    return {"actual_files_created": [...]}      # Real output
```

## Real-World Use Cases

### Use Case 1: Build Features
```
Task: "Add dark mode toggle to settings page"

Agent will:
1. Analyze your existing UI components
2. Create theme context provider
3. Add toggle switch component
4. Update settings page
5. Add CSS variables for dark theme
6. Test the implementation
7. Commit with descriptive message
```

### Use Case 2: Fix Bugs
```
Task: "Fix memory leak in WebSocket handler"

Agent will:
1. Read the WebSocket handler code
2. Analyze for memory leaks (unclosed connections, event listeners)
3. Modify the code to properly clean up
4. Add connection pooling if needed
5. Run existing tests
6. Commit the fix
```

### Use Case 3: Refactoring
```
Task: "Refactor authentication module to use TypeScript strict mode"

Agent will:
1. Read all auth-related files
2. Add proper type annotations
3. Fix any type errors
4. Ensure all tests still pass
5. Commit the refactored code
```

### Use Case 4: Add Tests
```
Task: "Write tests for user registration endpoint"

Agent will:
1. Read the registration endpoint code
2. Generate comprehensive test cases
3. Create test file with Jest/Vitest
4. Test happy paths and edge cases
5. Run the tests to ensure they pass
6. Commit the test file
```

## Limitations & Safety

### What It CAN Do
✅ Create new files
✅ Modify existing files
✅ Run commands (tests, builds, linters)
✅ Commit changes to git
✅ Read and understand existing code
✅ Follow existing code patterns
✅ Generate well-structured code

### What It CAN'T Do (Yet)
❌ Make API calls to external services
❌ Access databases directly
❌ Deploy to production
❌ Make breaking changes to core systems
❌ Override security configurations

### Safety Features
- Only works in specified workspace directory
- Validates changes before committing
- Runs tests to ensure nothing breaks
- Detailed logging of every action
- Can be stopped at any time (Ctrl+C)

## Configuration Options

### Basic Usage
```bash
python autonomous-agent.py \
  --agent-id abc-123 \
  --api-key sk-ant-xxx \
  --workspace /path/to/project
```

### Advanced Options
```bash
python autonomous-agent.py \
  --agent-id abc-123 \
  --api-key sk-ant-xxx \
  --workspace /path/to/project \
  --base-url https://conductor-pi.vercel.app \
  --poll-interval 10  # Check for tasks every 10 seconds
```

### Environment Variables
```bash
export CONDUCTOR_AGENT_ID=abc-123
export ANTHROPIC_API_KEY=sk-ant-xxx
export CONDUCTOR_WORKSPACE=/path/to/project
export CONDUCTOR_BASE_URL=https://conductor-pi.vercel.app

python autonomous-agent.py
```

## Monitoring & Debugging

### View Logs in Real-Time
1. Navigate to task detail page in Conductor
2. See live logs as agent works:
   ```
   [12:34:56] 🤖 Starting autonomous execution
   [12:34:57] 📋 Analyzing task requirements...
   [12:34:59] Plan created: 4 steps
   [12:35:00] 🔍 Reading existing codebase...
   [12:35:02] ⚙️ Step 1/4: Create auth module
   [12:35:10] ✍️ Created src/auth.ts (850 chars)
   ...
   ```

### Check Git History
```bash
git log --oneline
# a1b2c3d 🤖 Add user authentication to the app
# Shows exactly what the agent did
```

### Review Changes
```bash
git show a1b2c3d
# See full diff of what the agent created/modified
```

## Extending the Agent

### Add Custom Capabilities

```python
class MyCustomAgent(AutonomousCodingAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add database access
        self.db = DatabaseConnection()

    def _execute_step(self, task_id, step, context):
        if step["action"] == "query_database":
            return self._query_db(step["target"])
        return super()._execute_step(task_id, step, context)

    def _query_db(self, query):
        # Custom database interaction
        results = self.db.execute(query)
        return {"action": "query_database", "results": results}
```

### Add Custom Validation

```python
def _validate_changes(self, task_id):
    issues = super()._validate_changes(task_id)

    # Add custom validation
    if not self._check_security_scan():
        issues["issues"].append("Security scan failed")

    if not self._check_performance_benchmarks():
        issues["issues"].append("Performance regression detected")

    return issues
```

## Scaling to Multiple Agents

### Run Multiple Specialized Agents

```bash
# Terminal 1: Backend specialist
python autonomous-agent.py \
  --agent-id backend-agent-1 \
  --workspace /project \
  # Only picks up tasks requiring: api-design, database, backend

# Terminal 2: Frontend specialist
python autonomous-agent.py \
  --agent-id frontend-agent-1 \
  --workspace /project \
  # Only picks up tasks requiring: ui-design, react, frontend

# Terminal 3: Testing specialist
python autonomous-agent.py \
  --agent-id test-agent-1 \
  --workspace /project \
  # Only picks up tasks requiring: testing, qa, automation
```

### Agent Coordination

Create tasks that depend on each other:

```python
# Task 1: Backend agent creates API
POST /api/tasks
{
  "title": "Create user API endpoints",
  "required_capabilities": ["backend", "api-design"],
  "dependencies": []
}

# Task 2: Frontend agent builds UI (waits for Task 1)
POST /api/tasks
{
  "title": "Create user management UI",
  "required_capabilities": ["frontend", "react"],
  "dependencies": ["task-1-id"]
}

# Task 3: Test agent writes e2e tests (waits for Task 1 & 2)
POST /api/tasks
{
  "title": "Write e2e tests for user flow",
  "required_capabilities": ["testing", "automation"],
  "dependencies": ["task-1-id", "task-2-id"]
}
```

## This Is The Missing Piece

**Before autonomous-agent.py:**
- System could track tasks ✅
- System could assign to agents ✅
- System could record results ✅
- **But agents couldn't actually DO anything** ❌

**After autonomous-agent.py:**
- Agents can understand requirements ✅
- Agents can write real code ✅
- Agents can make real changes ✅
- **System is truly autonomous** ✅

## Next Steps

1. **Try it**: Run the autonomous agent on a test project
2. **Start small**: Give it simple tasks like "add a TODO comment"
3. **Build confidence**: Gradually give it more complex tasks
4. **Customize**: Extend it with your specific needs
5. **Scale**: Run multiple specialized agents

---

**This is what makes Conductor actually useful - agents that can DO THE WORK, not just track it.**
