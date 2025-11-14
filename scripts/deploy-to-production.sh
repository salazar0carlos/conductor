#!/bin/bash
set -e

# Deploy to Production Script
# This script merges the current session branch into the stable "production" branch
# Run this when you're ready to deploy your changes

PRODUCTION_BRANCH="production"
CURRENT_BRANCH=$(git branch --show-current)

echo "🚀 Deploy to Production"
echo "======================="
echo ""
echo "Current branch: $CURRENT_BRANCH"
echo "Target branch: $PRODUCTION_BRANCH"
echo ""

# Verify we're on a claude/ branch
if [[ ! $CURRENT_BRANCH == claude/* ]]; then
  echo "⚠️  Warning: You're not on a claude/ session branch"
  echo "   Current: $CURRENT_BRANCH"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Ensure working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "❌ Error: Working directory is not clean"
  echo "   Please commit or stash your changes first"
  git status -s
  exit 1
fi

echo "📥 Fetching latest changes..."
git fetch origin

# Check if production branch exists
if git rev-parse --verify production >/dev/null 2>&1; then
  echo "✅ Production branch exists locally"
else
  echo "📝 Creating production branch from current branch..."
  git branch production
fi

# Check if production exists on remote
if git ls-remote --exit-code --heads origin production >/dev/null 2>&1; then
  echo "✅ Production branch exists on remote"

  # Check if we're ahead
  LOCAL=$(git rev-parse @)
  REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "📊 Analyzing changes..."
    git log --oneline origin/production..HEAD | head -10
    echo ""
  fi
else
  echo "📝 Production branch will be created on remote"
fi

echo ""
read -p "Deploy current branch to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

echo ""
echo "🔄 Merging to production..."

# Switch to production branch
git checkout production

# Force update production to match current session branch
git reset --hard "$CURRENT_BRANCH"

# Push to remote (this will trigger Vercel deployment)
echo "📤 Pushing to remote..."
if git push -f origin production 2>&1; then
  echo ""
  echo "✅ Successfully deployed to production!"
  echo ""
  echo "📊 Deployment Status:"
  echo "   • Branch: production"
  echo "   • Latest commit: $(git rev-parse --short HEAD)"
  echo "   • Vercel will auto-deploy from this branch"
  echo ""
  echo "🔗 Check deployment at:"
  echo "   https://vercel.com (your project dashboard)"
  echo ""
else
  echo ""
  echo "❌ Failed to push to production"
  echo ""
  echo "This might be due to:"
  echo "1. Permission issues - check your git credentials"
  echo "2. Branch protection - check GitHub branch settings"
  echo "3. Network issues - try again"
  echo ""

  # Switch back to session branch
  git checkout "$CURRENT_BRANCH"
  exit 1
fi

# Switch back to session branch
git checkout "$CURRENT_BRANCH"

echo "🎉 Done! You're back on: $CURRENT_BRANCH"
echo ""
echo "Next steps:"
echo "1. Monitor deployment in Vercel dashboard"
echo "2. Continue working on this branch"
echo "3. Run this script again when ready to deploy more changes"
