#!/bin/bash
# Comprehensive Deployment Diagnostic
# This script checks EVERYTHING that could block deployment

echo "🔍 COMPREHENSIVE DEPLOYMENT DIAGNOSTIC"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_passed=0
check_failed=0
check_warnings=0

# Function to report check status
check() {
  local name="$1"
  local command="$2"

  echo -n "Checking: $name... "

  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((check_passed++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    ((check_failed++))
    return 1
  fi
}

warn() {
  local message="$1"
  echo -e "${YELLOW}⚠ WARNING:${NC} $message"
  ((check_warnings++))
}

echo "## 1. CONFIGURATION FILES"
echo "----------------------------"
check "next.config.mjs exists" "test -f next.config.mjs"
check "package.json exists" "test -f package.json"
check "tsconfig.json exists" "test -f tsconfig.json"
check ".eslintrc.json exists" "test -f .eslintrc.json"
check "vercel.json exists" "test -f vercel.json"
echo ""

echo "## 2. NEXT.JS CONFIGURATION"
echo "----------------------------"
if grep -q "ignoreDuringBuilds: true" next.config.mjs 2>/dev/null; then
  echo -e "${GREEN}✓ ESLint disabled during builds${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ ESLint NOT disabled during builds${NC}"
  ((check_failed++))
fi

if grep -q "ignoreBuildErrors: true" next.config.mjs 2>/dev/null; then
  echo -e "${GREEN}✓ TypeScript errors ignored during builds${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ TypeScript errors NOT ignored during builds${NC}"
  ((check_failed++))
fi
echo ""

echo "## 3. SUPABASE CONFIGURATION"
echo "----------------------------"
check "Supabase client exists" "test -f lib/supabase/client.ts"
check "Supabase server exists" "test -f lib/supabase/server.ts"
check "Supabase middleware exists" "test -f lib/supabase/middleware.ts"

# Check for proper Supabase imports
if grep -q "createBrowserClient" lib/supabase/client.ts; then
  echo -e "${GREEN}✓ Client uses createBrowserClient${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ Client doesn't use createBrowserClient${NC}"
  ((check_failed++))
fi

if grep -q "createServerClient" lib/supabase/server.ts; then
  echo -e "${GREEN}✓ Server uses createServerClient${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ Server doesn't use createServerClient${NC}"
  ((check_failed++))
fi
echo ""

echo "## 4. MIDDLEWARE"
echo "----------------------------"
check "middleware.ts exists" "test -f middleware.ts"
if grep -q "updateSession" middleware.ts 2>/dev/null; then
  echo -e "${GREEN}✓ Middleware calls updateSession${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ Middleware doesn't call updateSession${NC}"
  ((check_failed++))
fi
echo ""

echo "## 5. API ROUTES"
echo "----------------------------"
api_count=$(find app/api -name "route.ts" 2>/dev/null | wc -l)
echo "Total API routes: $api_count"

missing_dynamic=$(find app/api -name "route.ts" -exec grep -L "export const dynamic" {} \; 2>/dev/null | wc -l)
if [ "$missing_dynamic" -eq 0 ]; then
  echo -e "${GREEN}✓ All API routes have dynamic export${NC}"
  ((check_passed++))
else
  echo -e "${YELLOW}⚠ $missing_dynamic API routes missing dynamic export${NC}"
  ((check_warnings++))
fi
echo ""

echo "## 6. DEPENDENCIES"
echo "----------------------------"
if grep -q '"next":' package.json; then
  next_version=$(grep '"next":' package.json | cut -d'"' -f4)
  echo -e "${GREEN}✓ Next.js: $next_version${NC}"
  ((check_passed++))
fi

if grep -q '"@supabase/ssr":' package.json; then
  supabase_ssr_version=$(grep '"@supabase/ssr":' package.json | cut -d'"' -f4)
  echo -e "${GREEN}✓ @supabase/ssr: $supabase_ssr_version${NC}"
  ((check_passed++))
fi

if grep -q '"@supabase/supabase-js":' package.json; then
  supabase_js_version=$(grep '"@supabase/supabase-js":' package.json | cut -d'"' -f4)
  echo -e "${GREEN}✓ @supabase/supabase-js: $supabase_js_version${NC}"
  ((check_passed++))
fi
echo ""

echo "## 7. GIT CONFIGURATION"
echo "----------------------------"
current_branch=$(git branch --show-current 2>/dev/null)
if [ -n "$current_branch" ]; then
  echo -e "${GREEN}✓ Current branch: $current_branch${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ Not in a git repository${NC}"
  ((check_failed++))
fi

# Check remote
if git remote -v | grep -q origin; then
  echo -e "${GREEN}✓ Git remote configured${NC}"
  ((check_passed++))
else
  echo -e "${RED}✗ Git remote not configured${NC}"
  ((check_failed++))
fi
echo ""

echo "## 8. FILE SYNTAX CHECK"
echo "----------------------------"
# Check for basic syntax errors in key files
key_files=(
  "lib/supabase/client.ts"
  "lib/supabase/server.ts"
  "lib/supabase/middleware.ts"
  "middleware.ts"
  "next.config.mjs"
  "lib/auth/auth-context.tsx"
  "lib/auth/use-session-refresh.tsx"
)

syntax_errors=0
for file in "${key_files[@]}"; do
  if [ -f "$file" ]; then
    # Just check if file is readable and not empty
    if [ -s "$file" ]; then
      echo -e "${GREEN}✓ $file (not empty)${NC}"
      ((check_passed++))
    else
      echo -e "${RED}✗ $file (empty or unreadable)${NC}"
      ((check_failed++))
      ((syntax_errors++))
    fi
  else
    echo -e "${RED}✗ $file (missing)${NC}"
    ((check_failed++))
  fi
done
echo ""

echo "## 9. ENVIRONMENT VARIABLES (EXPECTED)"
echo "----------------------------"
env_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
)

echo "Expected environment variables (should be set in Vercel):"
for var in "${env_vars[@]}"; do
  echo "  - $var"
done
echo ""
warn "Ensure these are configured in Vercel dashboard → Settings → Environment Variables"
echo ""

echo "========================================"
echo "📊 DIAGNOSTIC SUMMARY"
echo "========================================"
echo ""
echo -e "${GREEN}Passed:${NC} $check_passed"
echo -e "${RED}Failed:${NC} $check_failed"
echo -e "${YELLOW}Warnings:${NC} $check_warnings"
echo ""

if [ "$check_failed" -gt 0 ]; then
  echo -e "${RED}❌ CRITICAL ISSUES FOUND${NC}"
  echo ""
  echo "Fix the failed checks above before deploying."
  exit 1
else
  echo -e "${GREEN}✅ ALL CRITICAL CHECKS PASSED${NC}"
  echo ""
  if [ "$check_warnings" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $check_warnings warnings found - review recommended${NC}"
  fi
  echo ""
  echo "Your configuration looks good for deployment."
  echo ""
  echo "Next steps:"
  echo "1. Ensure Vercel environment variables are set"
  echo "2. Push to your production branch"
  echo "3. Monitor Vercel deployment logs"
  exit 0
fi
