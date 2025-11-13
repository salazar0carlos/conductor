## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Build Safety Checklist ✅

**CRITICAL**: The following checks MUST pass to prevent production build failures:

### Automated Checks (Must Pass)
- [ ] ✅ `npm run validate` passes locally
- [ ] ✅ `npm run build` succeeds
- [ ] ✅ `npm run lint` passes
- [ ] ✅ TypeScript compilation succeeds
- [ ] ✅ GitHub Actions validation passes

### Manual Code Review (Required)
- [ ] No module-level `createClient()` calls
- [ ] No constructor-level Supabase initialization
- [ ] No module-level `process.env` access
- [ ] All Supabase clients created in function/method scope
- [ ] Used `getSupabaseClient()` pattern in classes

### For New Features
- [ ] New API routes follow function-scoped client pattern
- [ ] New classes use `getSupabaseClient()` private method
- [ ] Environment variables added to `.env.example` if needed
- [ ] No singleton classes with module-level initialization

### Documentation
- [ ] Updated `BULLETPROOFING.md` if patterns changed
- [ ] Added JSDoc comments to new functions/classes
- [ ] Updated README.md if user-facing changes

## Testing
<!-- Describe how you tested these changes -->

- [ ] Tested locally with `npm run dev`
- [ ] Tested build with `npm run build`
- [ ] Tested in production-like environment

## Additional Context
<!-- Add any other context about the PR here -->

---

## 🚨 Before Merging

**Double-check:**
1. All automated checks above are green ✅
2. Code review completed by at least one other developer
3. No `--no-verify` commits (bypassed pre-commit hooks)

**If any check fails, DO NOT MERGE.** Fix the issues first.

See [BULLETPROOFING.md](../BULLETPROOFING.md) for detailed guidelines.
