#!/bin/bash
# Auto-deploy script (no prompts) - for automation
set -e

PRODUCTION_BRANCH="production"
CURRENT_BRANCH=$(git branch --show-current)

echo "🚀 Auto-deploying $CURRENT_BRANCH to production..."

# Ensure working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "❌ Working directory not clean - aborting"
  exit 1
fi

# Fetch latest
git fetch origin -q

# Create or update production branch locally
git branch -f production HEAD

# Switch to production
git checkout production -q

# Force push to remote
if git push -f origin production 2>&1; then
  echo "✅ Deployed to production successfully"
  git checkout "$CURRENT_BRANCH" -q
  echo "✅ Returned to $CURRENT_BRANCH"
  exit 0
else
  echo "❌ Deploy failed"
  git checkout "$CURRENT_BRANCH" -q
  exit 1
fi
