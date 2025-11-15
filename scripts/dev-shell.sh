#!/bin/bash
# Access shell inside Docker development container

echo "🐚 Entering development container shell..."
echo ""
docker-compose -f docker-compose.dev.yml exec app sh
