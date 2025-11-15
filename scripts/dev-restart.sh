#!/bin/bash
# Restart Docker development environment

echo "🔄 Restarting Conductor Development Environment..."
docker-compose -f docker-compose.dev.yml restart

echo ""
echo "✅ Development environment restarted!"
echo ""
echo "View logs: npm run dev:logs"
