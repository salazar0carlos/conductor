#!/bin/bash
# Start Docker development environment

set -e

echo "🐳 Starting Conductor Development Environment"
echo "=============================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local not found!"
  echo ""
  echo "Creating .env.local from template..."
  if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials!"
    echo ""
    echo "Required variables:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    read -p "Press Enter when you've updated .env.local..."
  else
    echo "❌ .env.local.example not found!"
    exit 1
  fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running!"
  echo ""
  echo "Please start Docker Desktop and try again."
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
echo "📊 Container status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🌐 Application available at:"
echo "   http://localhost:3000"
echo ""
echo "📝 Useful commands:"
echo "   View logs:       npm run dev:logs"
echo "   Stop server:     npm run dev:stop"
echo "   Restart server:  npm run dev:restart"
echo "   Enter shell:     npm run dev:shell"
echo ""
echo "💡 Hot reload is enabled - file changes will auto-refresh!"
