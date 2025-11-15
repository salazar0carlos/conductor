# Docker Development Template

This template sets up Docker-based development for apps created in Conductor.

## Why Use This?

**Problem:** Every Claude Code session creates a new branch, breaking Vercel deployments
**Solution:** Develop all apps locally in Docker, only deploy stable versions to production

## Quick Setup

### For a New App

1. **Create your app in Conductor** (using the platform)

2. **Navigate to the app directory:**
   ```bash
   cd /path/to/your-app
   ```

3. **Run the setup script:**
   ```bash
   bash /path/to/conductor/templates/docker-dev/setup-docker-dev.sh
   ```

4. **Configure environment variables:**
   ```bash
   # Edit .env.local with your app's configuration
   nano .env.local
   ```

5. **Start development:**
   ```bash
   npm run dev:docker
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

## What Gets Created

The setup script creates:

```
your-app/
├── Dockerfile.dev              # Development Docker image
├── docker-compose.dev.yml      # Container orchestration
├── .env.local.example          # Environment template
└── scripts/
    ├── dev-start.sh           # Start Docker dev
    ├── dev-stop.sh            # Stop Docker dev
    ├── dev-logs.sh            # View logs
    ├── dev-restart.sh         # Restart server
    └── dev-shell.sh           # Access container
```

And adds these to `package.json`:
```json
{
  "scripts": {
    "dev:docker": "bash scripts/dev-start.sh",
    "dev:stop": "bash scripts/dev-stop.sh",
    "dev:logs": "bash scripts/dev-logs.sh",
    "dev:restart": "bash scripts/dev-restart.sh",
    "dev:shell": "bash scripts/dev-shell.sh"
  }
}
```

## Standard Commands

All apps get the same development commands:

```bash
# Start development server
npm run dev:docker

# View logs
npm run dev:logs

# Stop server
npm run dev:stop

# Restart server
npm run dev:restart

# Access container shell
npm run dev:shell
```

## Workflow with Conductor

### Creating a New App

1. **Use Conductor to generate app:**
   - Use the platform's app generator
   - Select framework (Next.js, etc.)
   - Configure features

2. **Set up Docker development:**
   ```bash
   cd your-new-app
   bash ../conductor/templates/docker-dev/setup-docker-dev.sh
   ```

3. **Configure and start:**
   ```bash
   # Edit environment
   nano .env.local

   # Start Docker
   npm run dev:docker
   ```

4. **Develop with Claude Code Web:**
   - Claude makes changes to your app
   - Changes auto-reload in Docker
   - Preview at localhost:3000

5. **Deploy when ready:**
   - Set up production branch (one time)
   - Deploy: `npm run deploy`

### Working on Existing Apps

1. **Pull latest code:**
   ```bash
   git pull
   ```

2. **Start Docker:**
   ```bash
   npm run dev:docker
   ```

3. **Develop:**
   - Make changes (or have Claude make changes)
   - Preview instantly at localhost:3000

4. **Stop when done:**
   ```bash
   npm run dev:stop
   ```

## Integration with Conductor Platform

### Apps Created via Conductor UI

When Conductor creates an app through the UI, it can automatically:

1. Generate the app code
2. Run this setup script
3. Create `.env.local` from template
4. Initialize git repository
5. Set up production deployment

This gives every app a consistent development experience.

### Adding to App Generator

To integrate with Conductor's app generator, add this to the app creation flow:

```typescript
// After generating app files
async function setupDockerDevelopment(appPath: string) {
  const templatePath = path.join(__dirname, '../templates/docker-dev')
  const setupScript = path.join(templatePath, 'setup-docker-dev.sh')

  // Run setup script
  execSync(`bash ${setupScript}`, {
    cwd: appPath,
    stdio: 'inherit'
  })

  // Create .env.local with app-specific variables
  const envVars = generateEnvVarsForApp(appConfig)
  fs.writeFileSync(
    path.join(appPath, '.env.local'),
    envVars
  )
}
```

## Benefits

### For All Apps

- ✅ **Consistent experience** - Same commands for every app
- ✅ **No deployment issues** - Develop locally, deploy when ready
- ✅ **Isolated environments** - Each app in its own container
- ✅ **Hot reload** - Changes appear instantly
- ✅ **Works with Claude Code** - Compatible with session branches

### For Conductor Platform

- ✅ **Standardized development** - All apps use same workflow
- ✅ **Easy onboarding** - Developers know what to expect
- ✅ **Reduced support** - Fewer deployment-related issues
- ✅ **Better DX** - Fast feedback loop

## Customization

### Custom Port

Edit `docker-compose.dev.yml`:
```yaml
ports:
  - "3001:3000"  # App runs on localhost:3001
```

### Additional Services

Add services to `docker-compose.dev.yml`:
```yaml
services:
  app:
    # ... existing config

  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Framework-Specific Setup

The template works with:
- Next.js (default)
- React
- Vue
- Node.js Express
- Any Node-based framework

Just ensure the app has:
- `package.json` with a `dev` script
- Dev server runs on port 3000 (or update docker-compose)

## Troubleshooting

### "Docker not running"
```bash
# Start Docker Desktop
open -a Docker  # macOS
# or start Docker Desktop on Windows/Linux
```

### "Port already in use"
```bash
# Change port in docker-compose.dev.yml
ports:
  - "3001:3000"
```

### "Module not found"
```bash
# Reinstall dependencies
npm run dev:shell
npm ci
exit
npm run dev:restart
```

## Examples

### Next.js App with Supabase
```bash
# Setup
bash templates/docker-dev/setup-docker-dev.sh

# Configure .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Start
npm run dev:docker
```

### Express API
```bash
# Setup
bash templates/docker-dev/setup-docker-dev.sh

# Modify Dockerfile.dev to use different port
EXPOSE 8080

# Update docker-compose.dev.yml
ports:
  - "8080:8080"

# Start
npm run dev:docker
```

### React App (Vite)
```bash
# Setup
bash templates/docker-dev/setup-docker-dev.sh

# Modify docker-compose.dev.yml
environment:
  - VITE_API_URL=http://localhost:8080

# Start
npm run dev:docker
```

## Support

For issues or questions:
1. Check Docker Desktop is running
2. Verify `.env.local` is configured
3. Check logs: `npm run dev:logs`
4. Restart: `npm run dev:restart`

## License

Part of Conductor platform - use freely for all apps created with Conductor.
