# Local Development with Docker

## Why Docker for Development?

**Problem:** Claude Code session branches break Vercel deployments every time
**Solution:** Develop locally in Docker, only deploy to production when ready

## Port Configuration

**Docker development:** `http://localhost:3001` (this setup)
**VS Code development:** `http://localhost:3000` (if running separately)

This separation lets you run both Claude Code Web (Docker) and Claude Code in VS Code simultaneously without conflicts.

---

## Quick Start (5 Minutes)

### 1. Set Up Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your credentials
nano .env.local  # or use your preferred editor
```

**Required variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 2. Start Development Environment

```bash
npm run dev:docker
```

That's it! The app will be available at **http://localhost:3001**

---

## Daily Workflow

### Start Development Server
```bash
npm run dev:docker
```
- Builds Docker image (first time only)
- Starts development server
- Enables hot reload
- Opens port 3001

### View Logs
```bash
npm run dev:logs
```
- See real-time output
- Press Ctrl+C to exit (server keeps running)

### Stop Server
```bash
npm run dev:stop
```
- Stops the container
- Frees up port 3000

### Restart Server
```bash
npm run dev:restart
```
- Quick restart without rebuilding
- Useful after installing new packages

### Access Container Shell
```bash
npm run dev:shell
```
- Enter the container for debugging
- Run commands inside the container
- Type `exit` to leave

---

## How It Works

### File Structure
```
conductor/
├── Dockerfile.dev              # Development Docker image
├── docker-compose.dev.yml      # Container orchestration
├── .env.local                  # Your local credentials
├── .env.local.example          # Template for credentials
└── scripts/
    ├── dev-start.sh           # Start development
    ├── dev-stop.sh            # Stop development
    ├── dev-logs.sh            # View logs
    ├── dev-restart.sh         # Restart server
    └── dev-shell.sh           # Access container shell
```

### What Gets Mounted
- **Your code** → Container's /app directory
- **Changes auto-reload** → No need to restart
- **node_modules** → Stays in container (faster)
- **.next** → Stays in container (build artifacts)

### Port Mapping
- **Host:3001** → **Container:3000**
- Access at: http://localhost:3001
- Note: Container runs on 3000 internally, exposed as 3001 on your machine

---

## Working with Claude Code Web

### The New Workflow

**❌ OLD (Broken):**
1. Work on claude/session-xyz
2. Push to GitHub
3. Vercel deploys (fails 90% of the time)
4. Repeat endlessly 😭

**✅ NEW (Works):**
1. Start Docker dev: `npm run dev:docker`
2. Work with Claude Code Web on any branch
3. Preview instantly at localhost:3001
4. When ready: `npm run deploy` (to production branch)
5. Vercel deploys from stable production branch 🎉

### Claude Code Web + Docker

When working with Claude Code Web:

1. **Start Docker first:**
   ```bash
   npm run dev:docker
   ```

2. **Ask Claude to make changes**
   - Claude edits files in your repo
   - Docker auto-reloads the changes
   - Preview at localhost:3001

3. **View changes in browser**
   - http://localhost:3001
   - Changes appear automatically
   - No deployment needed

4. **Iterate quickly**
   - Ask for more changes
   - See results instantly
   - No waiting for Vercel

### When to Deploy

Only deploy when you're ready for production:
```bash
npm run deploy
```

This merges to the stable `production` branch and triggers Vercel.

---

## Common Tasks

### Install New Package
```bash
# Method 1: From your machine
docker-compose -f docker-compose.dev.yml exec app npm install package-name

# Method 2: Add to package.json, then restart
npm run dev:restart
```

### Run Database Migrations
```bash
# Access shell
npm run dev:shell

# Inside container
npm run migrate
# or
npx tsx scripts/your-migration.ts
```

### Clear Build Cache
```bash
# Stop container
npm run dev:stop

# Remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Restart
npm run dev:docker
```

### Check Container Status
```bash
docker ps | grep conductor-dev
```

### View Resource Usage
```bash
docker stats conductor-dev
```

---

## Troubleshooting

### Port 3000 Already In Use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port in docker-compose.dev.yml
ports:
  - "3001:3000"  # Access at localhost:3001
```

### Container Won't Start
```bash
# Check Docker is running
docker info

# View detailed logs
docker-compose -f docker-compose.dev.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Changes Not Showing
```bash
# Restart the container
npm run dev:restart

# If still not working, check logs
npm run dev:logs
```

### "Module not found" Errors
```bash
# Reinstall dependencies
npm run dev:shell
npm ci --legacy-peer-deps
exit

# Restart
npm run dev:restart
```

### Slow Performance
```bash
# Check resource usage
docker stats conductor-dev

# Increase Docker Desktop resources:
# Docker Desktop → Settings → Resources
# - CPUs: 4+
# - Memory: 4GB+
```

---

## Environment Variables

### Required for Development
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Optional (Enable Features)
```env
# AI Features
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# GitHub Integration
GITHUB_TOKEN=ghp_...

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Error Tracking
SENTRY_DSN=https://...
```

### Where to Find Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Production Deployment

### When You're Ready
```bash
# Deploy to production
npm run deploy
```

This:
1. Asks for confirmation
2. Merges your branch → production
3. Pushes to GitHub
4. Triggers Vercel deployment

### One-Time Setup
See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for Vercel configuration.

---

## Comparison

### Docker Development vs Direct Development

| Feature | Docker | Direct (npm run dev) |
|---------|--------|---------------------|
| Setup | One-time | Every session |
| Isolation | ✅ Fully isolated | ❌ Shares system |
| Consistency | ✅ Same everywhere | ❌ Varies by OS |
| Port conflicts | ✅ Easily avoided | ❌ Common issue |
| Hot reload | ✅ Works | ✅ Works |
| Resource usage | Higher | Lower |
| Best for | Team/Claude Code | Solo development |

### Docker Development vs Vercel Preview

| Feature | Docker Dev | Vercel Preview |
|---------|-----------|----------------|
| Speed | ⚡ Instant | 🐌 2-5 min builds |
| Cost | 💰 Free | 💰 Free (limited) |
| Reliability | ✅ Always works | ❌ Breaks on session branches |
| Use case | Development | Production preview |

---

## Tips & Best Practices

### 1. Keep Docker Running
Leave the development server running while you work:
```bash
npm run dev:docker
# Keep this terminal open or run in background
```

### 2. Use Logs for Debugging
```bash
# In a separate terminal
npm run dev:logs
```

### 3. Commit Often
Even though you're developing locally, commit your work:
```bash
git add .
git commit -m "Your changes"
git push
```

### 4. Only Deploy When Ready
Don't deploy every change:
- ✅ Develop and test locally
- ✅ Deploy when feature is done
- ❌ Don't deploy every commit

### 5. Update Dependencies Safely
```bash
# Install new package
docker-compose -f docker-compose.dev.yml exec app npm install package-name

# Restart to ensure it's loaded
npm run dev:restart
```

---

## Summary

**Start developing:**
```bash
npm run dev:docker
```

**Preview your work:**
```
http://localhost:3001
```

**Deploy to production:**
```bash
npm run deploy
```

**Stop working:**
```bash
npm run dev:stop
```

That's it! No more Vercel deployment headaches during development. 🎉
