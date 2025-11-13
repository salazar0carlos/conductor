#!/bin/bash
# Setup Git Hooks for Build Protection
# Run this script once after cloning the repo: ./scripts/setup-git-hooks.sh

echo "🔧 Setting up Git hooks..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook: Run build validation

echo "🔍 Running pre-commit validation..."

npm run validate

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked: Anti-patterns detected!"
  echo "Fix the issues above before committing."
  echo ""
  echo "To bypass this check (NOT RECOMMENDED):"
  echo "  git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ Pre-commit validation passed!"
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "Pre-commit hook will now run 'npm run validate' before every commit."
echo "This ensures no anti-patterns can be committed to the repository."
