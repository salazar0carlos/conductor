# Build System Contracts

**Status:** IMMUTABLE - These are non-negotiable requirements for the build system

**Last Updated:** 2025-11-13

---

## 🔒 The Contract

This document defines the **MANDATORY** patterns that MUST be followed to prevent build failures. Violating these contracts will cause deployments to fail.

These are not guidelines or suggestions - they are **contractual requirements** enforced by automated tooling.

---

## Contract #1: Runtime Client Initialization

### THE RULE
**Supabase clients MUST be created at runtime, NEVER at module or constructor level.**

### WHY
Next.js build process runs module-level code when env vars aren't available, causing:
```
Error: supabaseUrl is required
Build failed
```

### ALLOWED PATTERNS ✅

#### Pattern A: Function-scoped in API routes
```typescript
// app/api/example/route.ts
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabaseClient()  // Created at request time
  // ...
}
```

#### Pattern B: Method-scoped in classes
```typescript
export class MyService {
  private getSupabaseClient() {
    return createClient(...)
  }

  async myMethod() {
    const supabase = this.getSupabaseClient()  // Created when method runs
    // ...
  }
}
```

#### Pattern C: Component-scoped (client components)
```typescript
'use client'
import { createBrowserClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createBrowserClient()  // Created when component renders
  // ...
}
```

### FORBIDDEN PATTERNS ❌

#### ❌ Module-level initialization
```typescript
const supabase = createClient(...)  // WRONG - runs at build time

export function handler() {
  return supabase.from('table').select()
}
```

#### ❌ Constructor initialization in singleton
```typescript
class Service {
  private supabase

  constructor() {
    this.supabase = createClient(...)  // WRONG if instantiated at module level
  }
}

const service = new Service()  // Constructor runs at module load!
```

### ENFORCEMENT
- ✅ Pre-commit hook (Layer 3)
- ✅ GitHub Actions (Layer 5)
- ✅ Vercel prebuild (Layer 6)
- ✅ Validation script checks for this pattern

---

## Contract #2: Dynamic API Route Export

### THE RULE
**ALL API routes MUST export `const dynamic = 'force-dynamic'`**

### WHY
Without this, Next.js attempts to statically generate API routes at build time, causing the same env var errors.

### REQUIRED PATTERN ✅

```typescript
// app/api/*/route.ts
export const dynamic = 'force-dynamic'  // THIS LINE IS MANDATORY

export async function GET() {
  // ...
}
```

### FORBIDDEN PATTERN ❌

```typescript
// app/api/*/route.ts
// Missing dynamic export!

export async function GET() {
  // ...
}
```

### ENFORCEMENT
- ✅ Validation script checks ALL API routes for this export
- ✅ Build will fail if ANY API route is missing it
- ✅ Script: `scripts/fix-api-routes.sh` can auto-fix violations

---

## Contract #3: Environment Variable Validation

### THE RULE
**Required environment variables MUST be validated before use**

### REQUIRED VARIABLES
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
At least one AI provider key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
```

### PATTERN ✅

```typescript
import { ensureSupabaseEnv } from '@/lib/env-validation'

export async function GET() {
  ensureSupabaseEnv()  // Throws if env vars missing
  // ...
}
```

### ENFORCEMENT
- ✅ `lib/env-validation.ts` provides validation utilities
- ⚠️ Optional but recommended in API routes

---

## Contract #4: No Module-Level Side Effects

### THE RULE
**No code with side effects (network calls, file I/O, env var access) at module level**

### WHY
Module-level code runs during build when the runtime environment doesn't exist.

### ALLOWED ✅

```typescript
// Constants are fine
const API_VERSION = 'v1'

// Type definitions are fine
interface User { ... }

// Functions are fine (they run later)
function fetchData() { ... }
```

### FORBIDDEN ❌

```typescript
// Network call at module level
const data = await fetch('https://api.example.com')  // WRONG

// Environment variable at module level
const API_KEY = process.env.API_KEY  // WRONG

// Database query at module level
const users = await db.query('SELECT * FROM users')  // WRONG
```

### ENFORCEMENT
- ⚠️ Warning in validation script
- ⚠️ ESLint warning

---

## Contract #5: TypeScript Strict Mode

### THE RULE
**All code must compile with TypeScript strict mode enabled**

### REQUIRED
- `tsconfig.json` has `"strict": true`
- No `// @ts-ignore` or `// @ts-nocheck` (use proper types instead)
- Explicit types for all API responses

### ENFORCEMENT
- ✅ Build fails if TypeScript errors exist
- ✅ GitHub Actions runs `npx tsc --noEmit`

---

## Contract #6: Dependency Update Protocol

### THE RULE
**Dependencies MUST be tested before updating**

### PROCEDURE
1. Run `npm run smoke-test` BEFORE updating
2. Update dependencies: `npm update` (minor/patch) OR `npx npm-check-updates -u` (major)
3. Run `npm run smoke-test` AFTER updating
4. If smoke test fails → investigate and fix OR revert update
5. Commit only if smoke test passes

### ENFORCEMENT
- ✅ Weekly CI check runs dependency update test
- ✅ Manual workflow for major updates
- ⚠️ PR template includes dependency check

---

## Contract #7: Git Hooks Always Installed

### THE RULE
**Pre-commit hooks MUST run before every commit**

### PATTERN
```bash
npm install  # Auto-runs postinstall → installs hooks
git commit   # Hook runs validation automatically
```

### BYPASS ONLY IN EMERGENCY
```bash
git commit --no-verify  # Only use in true emergency
# Must document reason in commit message
# Must be fixed in next commit
```

### ENFORCEMENT
- ✅ `postinstall` script auto-installs hooks
- ✅ Pre-commit hook runs `npm run validate`

---

## ⚠️ Breaking These Contracts

### What Happens
1. Pre-commit hook BLOCKS your commit (if hooks installed)
2. GitHub Actions BLOCKS your PR merge
3. Vercel build FAILS during deployment
4. Production deployment NEVER receives broken code

### Emergency Override
If you MUST bypass (production emergency only):

1. Get approval from 2+ senior developers
2. Document reason in commit message
3. Create ticket to fix properly within 24 hours
4. Post-mortem required

### Consequences
- Broken contract = Failed deployment
- Client never sees broken code
- You must fix before merge

---

## 📋 Validation Checklist

Before ANY infrastructure change:

- [ ] Run `npm run validate`
- [ ] Run `npm run build`
- [ ] Run `npm run smoke-test`
- [ ] Check all contracts still enforced
- [ ] Update this document if contracts change

---

## 🔄 Contract Updates

**To change a contract:**

1. Update ADR (`docs/adr/001-runtime-client-initialization.md`)
2. Get team consensus
3. Update validation scripts
4. Update this document
5. Update `BULLETPROOFING.md`
6. Announce to team

**Changing contracts requires:**
- Technical justification
- Risk assessment
- Migration plan
- Team approval

---

## 📊 Contract Monitoring

### Weekly
- Dependency update check runs (automated)
- Review failed builds
- Check for --no-verify commits

### Monthly
- Review contract effectiveness
- Check for new patterns to add
- Update documentation

### Quarterly
- Full contract audit
- Team retrospective
- Update procedures if needed

---

## ✅ Summary

**These 7 contracts are IMMUTABLE:**

1. ✅ Runtime Supabase client initialization
2. ✅ Dynamic export on ALL API routes
3. ✅ Environment variable validation
4. ✅ No module-level side effects
5. ✅ TypeScript strict mode
6. ✅ Dependency update protocol
7. ✅ Git hooks always installed

**Breaking ANY contract = Failed deployment**

**Your job as a developer:**
- Follow these contracts in ALL code
- Run validation before committing
- Fix violations immediately
- Don't bypass unless emergency

**The system's job:**
- Enforce these contracts automatically
- Block broken code from reaching production
- Provide clear error messages
- Make it easy to do the right thing

---

**This is your safety net. Don't cut the ropes.**
