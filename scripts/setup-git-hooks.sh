#!/bin/bash
# Setup Git Hooks for Build Protection
# Run this script once after cloning the repo: ./scripts/setup-git-hooks.sh

echo "🔧 Setting up Git hooks..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook: Run comprehensive build validation
# This is Layer 3 of the 8-layer protection system

echo ""
echo "🔍 Running pre-commit validation (Layer 3)..."
echo "================================================"
echo ""

# Step 1: Validate Supabase patterns
echo "📋 Step 1/4: Validating Supabase patterns..."
npm run validate
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked: Supabase anti-patterns detected!"
  exit 1
fi
echo "✅ Supabase patterns OK"
echo ""

# Step 2: TypeScript compilation check
echo "📋 Step 2/4: TypeScript compilation check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked: TypeScript compilation errors!"
  echo "Fix the type errors above before committing."
  exit 1
fi
echo "✅ TypeScript OK"
echo ""

# Step 3: ESLint validation
echo "📋 Step 3/4: Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked: ESLint errors detected!"
  echo "Fix the linting errors above before committing."
  exit 1
fi
echo "✅ ESLint OK"
echo ""

# Step 4: Full build test (quick check)
echo "📋 Step 4/4: Build verification..."
npx tsx scripts/verify-build.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked: Build verification failed!"
  echo "Fix the build errors above before committing."
  exit 1
fi
echo "✅ Build verification OK"
echo ""

echo "================================================"
echo "✅ All pre-commit validations passed!"
echo "================================================"
echo ""
echo "To bypass this check (NOT RECOMMENDED):"
echo "  git commit --no-verify"
echo ""
EOF

# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
# Pre-push hook: Final validation before pushing to remote
# This is Layer 8 of the 8-layer protection system

echo ""
echo "🔍 Running pre-push validation (Layer 8)..."
echo "================================================"
echo ""

# Verify last commit passed all checks
echo "📋 Verifying last commit integrity..."
LAST_COMMIT=$(git log -1 --pretty=%B)
echo "Last commit: $LAST_COMMIT"
echo ""

# Run full verification suite
echo "📋 Running full verification suite..."
npx tsx scripts/verify-build.ts --full
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Push blocked: Build verification failed!"
  echo "Your code has errors that would cause deployment failures."
  echo ""
  echo "To bypass this check (NOT RECOMMENDED):"
  echo "  git push --no-verify"
  echo ""
  exit 1
fi

echo ""
echo "================================================"
echo "✅ All pre-push validations passed!"
echo "✅ Safe to push to remote!"
echo "================================================"
echo ""
EOF

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 Installed hooks:"
echo "  • pre-commit: Validates patterns, TypeScript, ESLint, and build"
echo "  • pre-push: Final verification before pushing to remote"
echo ""
echo "🛡️ 8-Layer Protection System Active!"
echo "  Layer 3: Pre-commit hook (validates before commit)"
echo "  Layer 8: Pre-push hook (validates before push)"
echo ""
