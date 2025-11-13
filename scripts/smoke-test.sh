#!/bin/bash
# Build Smoke Test
# Quick test to verify the build system works correctly
# Run this after ANY infrastructure change (dependency updates, config changes, etc.)

set -e  # Exit on any error

echo "🧪 Running Build Smoke Test..."
echo ""

# Track timing
start_time=$(date +%s)

# Step 1: Validation
echo "1️⃣  Running build validation..."
npm run validate
echo "✅ Validation passed"
echo ""

# Step 2: TypeScript check
echo "2️⃣  Checking TypeScript..."
npx tsc --noEmit
echo "✅ TypeScript check passed"
echo ""

# Step 3: ESLint
echo "3️⃣  Running ESLint..."
npm run lint
echo "✅ ESLint passed"
echo ""

# Step 4: Full build
echo "4️⃣  Running full build..."
npm run build
echo "✅ Build succeeded"
echo ""

# Step 5: Check for common errors in build output
echo "5️⃣  Checking build output..."

if [ -d ".next" ]; then
  echo "   ✅ .next directory created"
else
  echo "   ❌ .next directory missing!"
  exit 1
fi

if [ -f ".next/BUILD_ID" ]; then
  echo "   ✅ BUILD_ID file exists"
else
  echo "   ❌ BUILD_ID file missing!"
  exit 1
fi

# Step 6: Check for specific anti-patterns in build
echo "6️⃣  Checking for runtime errors in build..."

# Check if any "supabaseUrl is required" errors occurred
if grep -r "supabaseUrl is required" .next/ 2>/dev/null; then
  echo "   ❌ Found supabaseUrl errors in build output!"
  exit 1
fi

echo "   ✅ No supabaseUrl errors found"
echo ""

# Calculate duration
end_time=$(date +%s)
duration=$((end_time - start_time))

echo "✅ All smoke tests passed! ($duration seconds)"
echo ""
echo "Build system is healthy and ready for deployment."
