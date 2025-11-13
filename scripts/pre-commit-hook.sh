#!/bin/bash
# Pre-commit hook for validating session ID consistency
#
# This hook runs before every commit to ensure the session ID is consistent
# across all configuration files. This prevents deployment failures.
#
# To install this hook, run:
#   npm run setup:hooks

set -e

echo "🔍 Validating Session ID consistency..."

# Run the validation script using npm to ensure proper environment
npm run session:validate --silent

# If validation failed, the script will exit with non-zero code
# and the commit will be aborted

echo "✅ Session ID validation passed"
exit 0
