# Dependency Update Procedure

**Purpose:** Prevent dependency updates from breaking the build system

**Last Updated:** 2025-11-13

---

## 🎯 Overview

Dependency updates are **HIGH RISK** operations that can break your bulletproof build system. Follow this procedure EXACTLY to prevent breaking production.

---

## ⚠️ Risk Levels

### 🟢 LOW RISK - Patch Updates (x.x.X)
- Security fixes
- Bug fixes
- Usually safe

### 🟡 MEDIUM RISK - Minor Updates (x.X.x)
- New features (backwards compatible)
- Deprecation warnings
- Test thoroughly

### 🔴 HIGH RISK - Major Updates (X.x.x)
- Breaking changes
- API changes
- Requires code updates
- **NEVER** auto-update

---

## 📋 Before ANY Update

### Step 1: Baseline Check
```bash
# Ensure current state is healthy
npm run smoke-test

# If this fails, FIX IT FIRST before updating anything
```

### Step 2: Check What's Outdated
```bash
# See all outdated dependencies
npm outdated

# See what would update
npm update --dry-run
```

### Step 3: Review Changes
For each package being updated:
1. Visit npm package page
2. Read CHANGELOG.md or RELEASES
3. Look for:
   - "BREAKING CHANGE"
   - "Migration Guide"
   - Changes to env vars
   - Changes to configuration

---

## 🟢 Updating Patch/Minor Versions

### Safe Updates
```bash
# 1. Update to latest compatible versions (respects semver)
npm update

# 2. Run full test suite
npm run smoke-test

# 3. If passes → commit
git add package.json package-lock.json
git commit -m "chore: Update dependencies (patch/minor)"

# 4. If fails → investigate specific package
npm ls <package-name>
```

### If Smoke Test Fails

1. **Identify culprit:**
```bash
# Revert all updates
git restore package.json package-lock.json
npm install

# Update one at a time
npm update <package-name>
npm run smoke-test

# Repeat until you find which one breaks
```

2. **Once found:**
   - Read package changelog
   - Check if it's a bug in the package (report it)
   - Check if our code needs updating
   - Fix our code OR pin the package version

3. **Pin problematic version:**
```json
{
  "dependencies": {
    "problematic-package": "1.2.3"  // Pin exact version
  }
}
```

---

## 🔴 Updating Major Versions

**NEVER** update major versions automatically. Always manual + careful.

### Procedure

#### Step 1: Research
```bash
# Check what major updates are available
npx npm-check-updates --target latest

# For each major update:
# 1. Visit package GitHub
# 2. Read migration guide
# 3. Check breaking changes
# 4. Estimate effort
```

#### Step 2: Test in Isolation
```bash
# Create a test branch
git checkout -b test/update-<package-name>

# Update ONLY that package
npm install <package-name>@latest

# Run tests
npm run smoke-test

# Check for errors
# Fix any breaking changes
```

#### Step 3: Update Code
Common breaking changes to watch for:

**Next.js major updates:**
- Config file format changes
- API route changes
- Middleware changes
- App Router changes

**Supabase major updates:**
- Client initialization changes
- Auth API changes
- Database query syntax
- SSR helper changes

**React major updates:**
- Hook behavior changes
- Component lifecycle changes
- Context API changes

#### Step 4: Thorough Testing
```bash
# Run everything
npm run validate    # Validation passes
npm run lint        # No lint errors
npx tsc --noEmit    # TypeScript compiles
npm run build       # Build succeeds
npm run smoke-test  # Smoke test passes

# Test locally
npm run dev         # Dev server starts
# Manual testing in browser
```

#### Step 5: Document Changes
In commit message, include:
- What was updated
- What changed in our code
- Why changes were necessary
- Testing performed

---

## 🤖 Automated Checks

### Weekly Dependency Scan
Every Monday at 9 AM UTC, GitHub Actions runs:
1. Check for outdated dependencies
2. Update to latest compatible versions
3. Run full build + test
4. Create issue if failure

**If you receive this issue:**
1. **URGENT** - Must fix within 48 hours
2. Follow procedure above to identify problem
3. Fix or pin dependency
4. Close issue when resolved

### Manual Major Update Test
```bash
# Trigger via GitHub Actions
# Go to Actions → Dependency Update Check → Run workflow
```

This tests updating ALL dependencies to latest (including breaking) to see what breaks.

---

## 📦 Critical Dependencies

These are HIGH IMPACT - extra caution required:

### Next.js
- **Impact:** Build system, routing, API routes
- **Update Frequency:** Only when necessary
- **Testing:** Full smoke test + manual UI testing
- **Docs:** https://nextjs.org/docs/upgrading

### Supabase
- **Impact:** Database, auth, realtime
- **Update Frequency:** Quarterly
- **Testing:** Test ALL API routes
- **Docs:** https://supabase.com/docs/guides/upgrading

### React
- **Impact:** All components
- **Update Frequency:** Only for critical fixes
- **Testing:** Full app testing

### TypeScript
- **Impact:** All code
- **Update Frequency:** Minor updates only
- **Testing:** Full type checking

---

## 🚨 Emergency Rollback

If update breaks production:

### Immediate Action
```bash
# 1. Revert the update commit
git revert HEAD
git push

# 2. Redeploy immediately
# (Vercel auto-deploys on push)

# 3. Create incident report
```

### Post-Mortem
Within 24 hours, document:
1. What dependency was updated
2. What broke
3. Why smoke test didn't catch it
4. How to prevent in future
5. Update this procedure if needed

---

## ✅ Update Checklist

Before updating ANY dependency:

- [ ] Current build is healthy (`npm run smoke-test`)
- [ ] Reviewed changelog for breaking changes
- [ ] Understood what changed
- [ ] Have rollback plan
- [ ] Know how to test
- [ ] Set aside enough time (don't rush)

After updating:

- [ ] `npm run validate` passes
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] `npm run smoke-test` passes
- [ ] Manual testing performed
- [ ] Commit message documents changes
- [ ] PR approved by another developer

---

## 🎓 Best Practices

### DO
✅ Update patch/minor versions weekly
✅ Read changelogs before updating
✅ Update one major version at a time
✅ Test thoroughly after updates
✅ Pin problematic versions
✅ Document why pins exist
✅ Review pins quarterly

### DON'T
❌ Update major versions without testing
❌ Update multiple major versions at once
❌ Skip reading changelogs
❌ Assume "compatible" means "safe"
❌ Update on Friday afternoon
❌ Update without backup plan
❌ Ignore failing smoke tests

---

## 📊 Dependency Health Monitoring

### Weekly
- Review automated dependency check results
- Update patch/minor versions
- Test and deploy

### Monthly
- Review all pinned dependencies
- Check if pins can be removed
- Plan major updates

### Quarterly
- Audit all dependencies
- Remove unused dependencies
- Update critical dependencies
- Security audit

---

## 🔗 Resources

- **npm outdated:** https://docs.npmjs.com/cli/v9/commands/npm-outdated
- **npm update:** https://docs.npmjs.com/cli/v9/commands/npm-update
- **Semver:** https://semver.org/
- **GitHub Actions workflow:** `.github/workflows/dependency-check.yml`
- **Smoke test script:** `scripts/smoke-test.sh`

---

## Summary

**Golden Rule:** Never update dependencies on a whim.

**Update Process:**
1. Check current state
2. Research changes
3. Update one at a time
4. Test thoroughly
5. Deploy carefully
6. Monitor closely

**If in doubt:** Don't update. Stable is better than latest.

**Remember:** A dependency update once broke your production build. Don't let it happen again.
