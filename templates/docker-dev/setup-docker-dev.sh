#!/bin/bash
# Setup Docker Development for a New App
# Run this script in your app directory to add Docker development support

set -e

APP_DIR=$(pwd)
APP_NAME=$(basename "$APP_DIR")

echo "🐳 Setting up Docker Development for: $APP_NAME"
echo "================================================"
echo ""

# Check if we're in a valid directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found!"
  echo "   Run this script from your app's root directory"
  exit 1
fi

echo "📁 Creating Docker configuration files..."

# Create Dockerfile.dev
cat > Dockerfile.dev <<'EOF'
# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Development command (with hot reload)
CMD ["npm", "run", "dev"]
EOF

# Create docker-compose.dev.yml
cat > docker-compose.dev.yml <<EOF
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: ${APP_NAME}-dev
    ports:
      - "3000:3000"
    volumes:
      # Mount source code for hot reload
      - .:/app
      # Prevent node_modules from being overwritten
      - /app/node_modules
      - /app/.next
    env_file:
      - .env.local
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true
    restart: unless-stopped
    stdin_open: true
    tty: true
EOF

# Create .env.local.example if it doesn't exist
if [ ! -f ".env.local.example" ]; then
  cat > .env.local.example <<'EOF'
# Local Development Environment Variables
# Copy this file to .env.local and fill in your actual values

# Add your environment variables here
# Example:
# DATABASE_URL=postgresql://localhost:5432/mydb
# API_KEY=your-api-key-here
# NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
fi

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Create dev-start.sh
cat > scripts/dev-start.sh <<'EOF'
#!/bin/bash
# Start Docker development environment

set -e

echo "🐳 Starting Development Environment"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local not found!"
  echo ""
  if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local from template"
    echo ""
    echo "⚠️  Edit .env.local and add your configuration"
    echo ""
    read -p "Press Enter when ready..."
  fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running!"
  exit 1
fi

echo "📦 Building Docker image..."
docker-compose -f docker-compose.dev.yml build

echo ""
echo "🚀 Starting development server..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Application: http://localhost:3000"
echo ""
echo "📝 Commands:"
echo "   Logs:    npm run dev:logs"
echo "   Stop:    npm run dev:stop"
echo "   Restart: npm run dev:restart"
echo "   Shell:   npm run dev:shell"
EOF

# Create dev-stop.sh
cat > scripts/dev-stop.sh <<'EOF'
#!/bin/bash
echo "🛑 Stopping development environment..."
docker-compose -f docker-compose.dev.yml down
echo "✅ Stopped!"
EOF

# Create dev-logs.sh
cat > scripts/dev-logs.sh <<'EOF'
#!/bin/bash
echo "📜 Viewing logs (Ctrl+C to exit)..."
docker-compose -f docker-compose.dev.yml logs -f --tail=100
EOF

# Create dev-restart.sh
cat > scripts/dev-restart.sh <<'EOF'
#!/bin/bash
echo "🔄 Restarting..."
docker-compose -f docker-compose.dev.yml restart
echo "✅ Restarted!"
EOF

# Create dev-shell.sh
cat > scripts/dev-shell.sh <<'EOF'
#!/bin/bash
echo "🐚 Entering container..."
docker-compose -f docker-compose.dev.yml exec app sh
EOF

# Make scripts executable
chmod +x scripts/dev-*.sh

echo "✅ Created Docker configuration files"
echo ""

# Update package.json to add dev scripts
if command -v node >/dev/null 2>&1; then
  echo "📝 Adding npm scripts to package.json..."

  # Use Node.js to add scripts
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    if (!pkg.scripts) pkg.scripts = {};

    pkg.scripts['dev:docker'] = 'bash scripts/dev-start.sh';
    pkg.scripts['dev:stop'] = 'bash scripts/dev-stop.sh';
    pkg.scripts['dev:logs'] = 'bash scripts/dev-logs.sh';
    pkg.scripts['dev:restart'] = 'bash scripts/dev-restart.sh';
    pkg.scripts['dev:shell'] = 'bash scripts/dev-shell.sh';

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "

  echo "✅ Updated package.json"
else
  echo "⚠️  Node.js not found - manually add these to package.json:"
  echo ""
  echo '  "scripts": {'
  echo '    "dev:docker": "bash scripts/dev-start.sh",'
  echo '    "dev:stop": "bash scripts/dev-stop.sh",'
  echo '    "dev:logs": "bash scripts/dev-logs.sh",'
  echo '    "dev:restart": "bash scripts/dev-restart.sh",'
  echo '    "dev:shell": "bash scripts/dev-shell.sh"'
  echo '  }'
fi

echo ""
echo "================================================"
echo "✅ Docker Development Setup Complete!"
echo "================================================"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit .env.local with your configuration"
echo "2. Run: npm run dev:docker"
echo "3. Open: http://localhost:3000"
echo ""
echo "📚 Learn more: LOCAL_DEVELOPMENT.md (if you created it)"
