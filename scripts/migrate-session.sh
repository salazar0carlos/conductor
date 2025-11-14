#!/bin/bash
# Session Migration Script
# Automates the process of switching to a new Claude Code session
# Run this at the start of every new Claude Code session

set -e

echo "🔄 Claude Code Session Migration Tool"
echo "======================================"
echo ""

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

echo "📋 Current branch: $CURRENT_BRANCH"
echo ""

# Check if this is a claude/ branch
if [[ ! "$CURRENT_BRANCH" =~ ^claude/ ]]; then
  echo "⚠️  Warning: Current branch doesn't start with 'claude/'"
  echo "   This script is designed for Claude Code session branches."
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Extract session ID from branch name
SESSION_ID="${CURRENT_BRANCH##*/}"
echo "🆔 Session ID: $SESSION_ID"
echo ""

# Step 1: Update vercel.json
echo "📝 Step 1/5: Updating vercel.json..."

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
  echo "❌ vercel.json not found!"
  exit 1
fi

# Read current vercel.json
VERCEL_JSON=$(cat vercel.json)

# Check if branch is already enabled
if echo "$VERCEL_JSON" | grep -q "\"$CURRENT_BRANCH\": true"; then
  echo "✅ Branch already enabled in vercel.json"
else
  # Add the branch to deploymentEnabled
  # This is a simple approach - manually add it to the list
  echo "⚠️  Branch not found in vercel.json deploymentEnabled"
  echo "   You need to manually add this to vercel.json:"
  echo ""
  echo "   \"git\": {"
  echo "     \"deploymentEnabled\": {"
  echo "       \"$CURRENT_BRANCH\": true"
  echo "     }"
  echo "   }"
  echo ""
  read -p "Press Enter after you've updated vercel.json..."
fi

# Step 2: Install git hooks
echo ""
echo "📝 Step 2/5: Installing git hooks..."
bash scripts/setup-git-hooks.sh

# Step 3: Run validation
echo ""
echo "📝 Step 3/5: Running validation..."
npx tsx scripts/verify-build.ts

# Step 4: Check Vercel configuration
echo ""
echo "📝 Step 4/5: Vercel Configuration Checklist"
echo "==========================================="
echo ""
echo "⚠️  CRITICAL: You must update Vercel settings manually!"
echo ""
echo "1. Go to your Vercel project: https://vercel.com"
echo "2. Navigate to: Settings > Git"
echo "3. Set Production Branch to: $CURRENT_BRANCH"
echo "4. Save changes"
echo ""
echo "Without this step, Vercel will NOT deploy this branch!"
echo ""
read -p "Press Enter after you've updated Vercel production branch..."

# Step 5: Commit vercel.json if changed
echo ""
echo "📝 Step 5/5: Checking for uncommitted changes..."
if git diff --quiet vercel.json; then
  echo "✅ No changes to vercel.json"
else
  echo "⚠️  vercel.json has uncommitted changes"
  echo ""
  git diff vercel.json
  echo ""
  read -p "Commit these changes? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add vercel.json
    git commit -m "chore: Enable deployment for session $SESSION_ID"
    echo "✅ Changes committed"
  fi
fi

# Summary
echo ""
echo "======================================"
echo "✅ Session Migration Complete!"
echo "======================================"
echo ""
echo "📋 Summary:"
echo "  • Current branch: $CURRENT_BRANCH"
echo "  • Session ID: $SESSION_ID"
echo "  • Git hooks: Installed"
echo "  • Validation: Passed"
echo ""
echo "🚨 IMPORTANT REMINDERS:"
echo "  1. Vercel production branch MUST be set to: $CURRENT_BRANCH"
echo "  2. GitHub default branch (optional): $CURRENT_BRANCH"
echo "  3. Push changes: git push -u origin $CURRENT_BRANCH"
echo ""
echo "🔍 Verify Vercel deployment:"
echo "  1. Push this branch to GitHub"
echo "  2. Check Vercel dashboard for deployment"
echo "  3. Ensure deployment uses correct branch"
echo ""
echo "📖 For more info, see: docs/8-LAYER-PROTECTION-SYSTEM.md"
echo ""
