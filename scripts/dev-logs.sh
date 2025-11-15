#!/bin/bash
# View Docker development logs

echo "📜 Viewing development logs (Ctrl+C to exit)..."
echo ""
docker-compose -f docker-compose.dev.yml logs -f --tail=100
