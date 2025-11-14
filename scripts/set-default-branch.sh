#!/bin/bash
# Set the default branch on GitHub to match our current working branch

BRANCH="claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq"
REPO="salazar0carlos/conductor"

echo "🔧 Setting default branch to: $BRANCH"
echo ""

# Using GitHub API to set default branch
# This requires GITHUB_TOKEN environment variable

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN not set"
  echo ""
  echo "To set the default branch, you need to either:"
  echo "1. Go to: https://github.com/$REPO/settings/branches"
  echo "2. Set default branch to: $BRANCH"
  echo ""
  echo "OR"
  echo ""
  echo "3. Set GITHUB_TOKEN environment variable and run this script again"
  exit 1
fi

# Set default branch via API
response=$(curl -s -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO" \
  -d "{\"default_branch\":\"$BRANCH\"}")

if echo "$response" | grep -q "default_branch"; then
  echo "✅ Default branch updated successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Go to Vercel dashboard: https://vercel.com"
  echo "2. Select your project"
  echo "3. Go to Settings → Git"
  echo "4. Set Production Branch to: $BRANCH"
else
  echo "❌ Failed to update default branch"
  echo "Response: $response"
  echo ""
  echo "Please manually update at: https://github.com/$REPO/settings/branches"
fi
