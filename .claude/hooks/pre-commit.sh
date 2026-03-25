#!/bin/bash
# Pre-commit hook for hitori-talk

set -e

echo "🔍 Running pre-commit checks..."

# 1. Lint check
echo "📝 Checking code style..."
pnpm lint

# 2. Type check
echo "🔎 Running TypeScript type check..."
pnpm tsc --noEmit

# 3. Run tests
echo "🧪 Running tests..."
pnpm test:quick

# 4. Check for sensitive data
echo "🔒 Checking for sensitive data..."
if git diff --cached --name-only | xargs grep -l "OPENROUTER_API_KEY\|SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null; then
  echo "❌ Error: Potential API keys found in staged files!"
  echo "Please remove sensitive data before committing."
  exit 1
fi

# 5. Check for TODO comments in new code
TODO_COUNT=$(git diff --cached | grep -c "// TODO\|// FIXME" || true)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "⚠️  Warning: Found $TODO_COUNT TODO/FIXME comments in staged changes"
  echo "Consider addressing them before committing."
fi

echo "✅ All pre-commit checks passed!"
