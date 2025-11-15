#!/bin/bash
# Stop Docker development environment

echo "🛑 Stopping Conductor Development Environment..."
docker-compose -f docker-compose.dev.yml down

echo ""
echo "✅ Development environment stopped!"
