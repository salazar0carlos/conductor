# ADR 001: Runtime Supabase Client Initialization

**Status:** Accepted

**Date:** 2025-11-13

**Deciders:** Engineering Team

**Context:** Build failures caused by module-level Supabase client initialization

---

## Decision

**All Supabase clients MUST be created at runtime, never at module or constructor level.**

This is a **non-negotiable architectural requirement** enforced by automated tooling.

## Rationale

### Problem

Next.js build process runs all module-level code during build time. Environment variables are not available during build, only at runtime. Creating Supabase clients at module level causes:

```
Error: supabaseUrl is required
Build failed with exit code 1
```

This breaks:
- Production deployments
- Vercel builds
- CI/CD pipelines
- Client deliverables

**Impact:** Production outages, failed deployments, client support burden

### Solution

**REQUIRED PATTERN:**

```typescript
// ✅ CORRECT: Function-scoped creation
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const supabase = getSupabaseClient()  // Created at runtime
  // Use supabase...
}
```

**PROHIBITED PATTERNS:**

```typescript
// ❌ WRONG: Module-level
const supabase = createClient(...)  // Runs at build time = CRASH

// ❌ WRONG: Constructor
class Service {
  private supabase
  constructor() {
    this.supabase = createClient(...)  // Runs when class instantiated
  }
}
```

## Consequences

### Positive
- ✅ Zero build failures from env var access
- ✅ Guaranteed production deployments
- ✅ No client-facing build issues
- ✅ Automated enforcement prevents regressions

### Negative
- ⚠️ Slight overhead creating clients per-request (negligible)
- ⚠️ Developers must learn and follow pattern
- ⚠️ Cannot use certain singleton patterns

### Neutral
- All existing code patterns must be updated
- Documentation overhead for new team members
- Additional CI/CD checks required

## Enforcement

This decision is enforced by **multiple automated layers** (defense-in-depth):

### Layer 1: Pre-Commit Hook
```bash
# Runs before ANY commit
npm run validate
# Blocks commit if anti-patterns found
```

### Layer 2: GitHub Actions
```yaml
# Runs on every PR and push
- Run build validation
- Run TypeScript check
- Run ESLint
# Blocks merge if checks fail
```

### Layer 3: Vercel Build
```json
{
  "scripts": {
    "prebuild": "tsx scripts/validate-build.ts"
  }
}
# Fails deployment if anti-patterns detected
```

### Layer 4: ESLint Rule
```json
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "...",
      "message": "Module-level Supabase client initialization is not allowed."
    }
  ]
}
```

### Layer 5: Code Review
- PR template checklist
- Required approvals
- Documented patterns

## Implementation

**Completed:**
- ✅ All existing anti-patterns fixed
- ✅ Validation script created (`scripts/validate-build.ts`)
- ✅ ESLint rule added
- ✅ Pre-commit hook setup script
- ✅ GitHub Actions workflow
- ✅ Comprehensive documentation (`BULLETPROOFING.md`)
- ✅ PR template with checklist

**Required for all new code:**
- Must pass `npm run validate`
- Must follow documented patterns
- Must pass all CI/CD checks
- Must be reviewed by another developer

## Alternatives Considered

### Alternative 1: Environment Variables at Build Time
**Rejected:** Requires exposing secrets in build environment, security risk

### Alternative 2: Singleton with Lazy Initialization
**Rejected:** Still requires careful pattern, easier to make mistakes

### Alternative 3: Dependency Injection
**Rejected:** Over-engineered for this use case, adds complexity

### Alternative 4: Global Supabase Instance
**Rejected:** Same build-time issues, not a solution

## References

- [Next.js Build Process Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase Client Initialization](https://supabase.com/docs/reference/javascript/initializing)
- [Environment Variables in Next.js](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- Internal: `BULLETPROOFING.md`
- Internal: `scripts/validate-build.ts`

## Revision History

- **2025-11-13:** Initial decision - Runtime client initialization required
- **Future:** Any changes to this decision require team consensus and updated ADR

---

## For Future Developers

**This is not optional.** This pattern is enforced by automated tooling and will block your commits, PRs, and deployments if violated.

**Why so strict?**
Because build failures in production cost:
- Client trust
- Revenue (downtime)
- Engineering time (firefighting)
- Support burden

The automation exists to protect everyone.

**Questions?** See `BULLETPROOFING.md` or ask a senior developer.
