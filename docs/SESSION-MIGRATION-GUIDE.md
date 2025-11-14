# Session Migration Guide

## The Problem

Claude Code sessions have unique IDs embedded in branch names (e.g., `claude/eight-layer-protection-013uA97ouh4jzsAKr8BKXA1D`). Each time you start a new session:

1. **New branch created** with new session ID
2. **Vercel doesn't know** about the new branch
3. **Deployments fail** because Vercel is still pointing to the old branch

This guide provides a **bulletproof 3-minute process** for migrating to a new session without breaking deployments.

## Quick Start (3 Minutes)

### Step 1: Run Migration Script (30 seconds)

```bash
npm run migrate-session
```

This automatically:
- ✅ Updates `vercel.json` to enable the current branch
- ✅ Installs git hooks for the new session
- ✅ Shows you exactly what to do next

### Step 2: Update Vercel Production Branch (1 minute)

**CRITICAL - CANNOT BE AUTOMATED**

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Navigate to: **Settings → Git**
4. Under **Production Branch**, change to your current branch:
   ```
   claude/your-session-id-here
   ```
5. Click **Save**

**Why this matters**: Vercel won't deploy your branch unless it's set as the production branch!

### Step 3: Commit and Push (1 minute)

```bash
# Commit the updated vercel.json
git add vercel.json package.json
git commit -m "chore: Migrate to new Claude Code session"

# Push to GitHub
git push -u origin $(git branch --show-current)
```

### Step 4: Verify Deployment (30 seconds)

1. Check your Vercel dashboard
2. Ensure a new deployment is triggered
3. Verify it's deploying from the correct branch

**Done!** ✅

---

## Manual Process (If Automated Script Fails)

### 1. Update vercel.json

Add your current branch to `git.deploymentEnabled`:

```json
{
  "git": {
    "deploymentEnabled": {
      "claude/your-new-session-id": true
    }
  }
}
```

**Keep old branches** if you want them to still deploy:

```json
{
  "git": {
    "deploymentEnabled": {
      "claude/old-session-1": true,
      "claude/old-session-2": true,
      "claude/new-session": true
    }
  }
}
```

### 2. Install Git Hooks

```bash
bash scripts/setup-git-hooks.sh
```

This installs the 8-layer protection system hooks for the new session.

### 3. Update Vercel Settings

**Go to Vercel Dashboard:**

1. Open your project
2. Go to **Settings → Git**
3. Change **Production Branch** to: `claude/your-new-session-id`
4. Save

### 4. (Optional) Update GitHub Default Branch

If you want PRs to target this branch:

1. Go to GitHub repository
2. Navigate to **Settings → Branches**
3. Change default branch to: `claude/your-new-session-id`

---

## Common Issues

### Issue 1: "Branch not found in vercel.json"

**Symptom**: Vercel says branch is not enabled for deployment

**Solution**:
```bash
npm run migrate-session
```

Or manually add to `vercel.json`:
```json
"claude/your-branch-name": true
```

### Issue 2: "Build command failed: tsx: command not found"

**Symptom**: Vercel build fails with `tsx: command not found`

**Solution**: Ensure `vercel.json` uses `npx tsx`:
```json
"buildCommand": "npx tsx scripts/verify-build.ts && npm run build"
```

**NOT**:
```json
"buildCommand": "tsx scripts/verify-build.ts && npm run build"  ❌
```

### Issue 3: "Deployment succeeded but showing old code"

**Symptom**: Deployment completes but shows code from old branch

**Solution**: Check Vercel production branch settings
1. Go to **Settings → Git**
2. Verify **Production Branch** matches your current branch
3. Trigger a new deployment manually if needed

### Issue 4: "Pre-commit hook taking too long"

**Symptom**: `git commit` takes 60+ seconds

**Solution**: This is normal! The 8-layer protection system validates:
- TypeScript compilation (~30s)
- ESLint (~10s)
- Build verification (~20s)

To bypass (NOT RECOMMENDED):
```bash
git commit --no-verify
```

---

## Understanding Session Migration

### Why Does This Happen?

Claude Code uses unique session IDs to:
- Track conversations across sessions
- Manage git branches independently
- Enable concurrent sessions (future feature)

The session ID is embedded in the branch name:
```
claude/eight-layer-protection-013uA97ouh4jzsAKr8BKXA1D
        └──────────────┘ └──────────────────────────┘
        Feature name         Session ID (unique)
```

### What Needs to Update

| Component | What Changes | How to Update |
|-----------|--------------|---------------|
| **vercel.json** | `deploymentEnabled` | Run `npm run migrate-session` |
| **Vercel Production Branch** | Branch name | Manually update in Vercel UI |
| **Git Hooks** | `.git/hooks/*` | Run `bash scripts/setup-git-hooks.sh` |
| **GitHub Default Branch** | Branch name | (Optional) Update in GitHub settings |

### Automation Limitations

**What CAN be automated:**
- ✅ Updating `vercel.json`
- ✅ Installing git hooks
- ✅ Validating configuration

**What CANNOT be automated:**
- ❌ Updating Vercel production branch (requires Vercel UI or API token)
- ❌ Updating GitHub default branch (requires GitHub API)

This is why **Step 2** (Update Vercel Production Branch) must be done manually.

---

## Advanced: Vercel CLI Method

If you have Vercel CLI installed and configured:

```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Login to Vercel
vercel login

# Set production branch
vercel git connect
vercel git config production-branch $(git branch --show-current)
```

**Note**: This requires Vercel CLI v28+ and proper authentication.

---

## Session Migration Checklist

Use this checklist at the start of EVERY new Claude Code session:

- [ ] **Run migration script**: `npm run migrate-session`
- [ ] **Update Vercel production branch** in Vercel UI
- [ ] **Commit changes**: `git add vercel.json && git commit -m "chore: Migrate session"`
- [ ] **Push to GitHub**: `git push -u origin $(git branch --show-current)`
- [ ] **Verify deployment** in Vercel dashboard
- [ ] **Test 8-layer protection**: `npx tsx scripts/verify-build.ts`

**Time estimate**: 3-5 minutes

---

## Preventing Future Issues

### Option 1: Use Main Branch (Simplest)

Instead of using `claude/*` branches, work directly on `main`:

**Pros:**
- No session migration needed
- Vercel always deploys `main`
- Simpler workflow

**Cons:**
- No session isolation
- Can't track multiple Claude sessions
- Harder to experiment

**To switch to this approach:**

1. Merge your `claude/*` branch to `main`
2. Set Vercel production branch to `main`
3. Update `vercel.json`:
   ```json
   {
     "git": {
       "deploymentEnabled": {
         "main": true
       }
     }
   }
   ```

### Option 2: Single Long-Lived Branch

Use one `claude/conductor` branch for all sessions:

**Pros:**
- No session migration
- Consistent branch name
- Works across sessions

**Cons:**
- No session tracking
- All sessions use same branch

**To switch to this approach:**

1. Create branch: `git checkout -b claude/conductor`
2. Set Vercel production branch to `claude/conductor`
3. Update `vercel.json`:
   ```json
   {
     "git": {
       "deploymentEnabled": {
         "claude/conductor": true
       }
     }
   }
   ```
4. Use this branch for all Claude Code sessions

### Option 3: Automated Vercel API Integration (Complex)

Create a script that automatically updates Vercel production branch via API:

**Requires:**
- Vercel API token
- Vercel project ID
- Custom script to call Vercel API

**Benefit**: Fully automated session migration

**See**: [Vercel API Documentation](https://vercel.com/docs/rest-api)

---

## FAQ

### Q: Do I need to migrate EVERY session?

**A:** Yes, if each session uses a different branch name with a unique session ID.

### Q: Can I use the same branch across sessions?

**A:** Yes! Create a single branch like `claude/conductor` and reuse it. Update `.claude/config.json` to use a fixed branch name.

### Q: What happens if I forget to migrate?

**A:** Vercel will continue deploying the OLD branch. Your new code won't go live until you:
1. Update `vercel.json`
2. Update Vercel production branch

### Q: Can I automate the Vercel production branch update?

**A:** Yes, but requires:
- Vercel API token
- Additional scripting
- More complexity

For most users, manual update is simpler and faster (1 minute).

### Q: Why does the build take so long?

**A:** The 8-layer protection system runs comprehensive validation:
- TypeScript compilation
- ESLint
- Supabase pattern validation
- Build verification

This ensures code quality but adds ~60-90s to builds.

---

## Related Documentation

- [8-Layer Protection System](./8-LAYER-PROTECTION-SYSTEM.md) - Understanding the protection layers
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [Vercel Deployment Guide](./VERCEL-DEPLOYMENT.md) - Vercel-specific configuration

---

## Support

If session migration fails:

1. Check this guide for common issues
2. Verify `vercel.json` syntax (must be valid JSON)
3. Ensure Vercel production branch matches your current branch
4. Check Vercel deployment logs for specific errors
5. Run `npx tsx scripts/verify-build.ts` to test locally

**Still stuck?** Paste the Vercel deployment log for specific debugging.
