# Deployment Workflow

## The Problem We Solved

Previously, every Claude Code session created a new branch with a unique session ID (e.g., `claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`). This meant:
- ❌ Deployments broke every session
- ❌ Had to manually update GitHub/Vercel settings every time
- ❌ Old session branches accumulated
- ❌ No stable deployment target

## The Solution: Stable Production Branch

We now use a **stable `production` branch** that never changes. Here's how it works:

```
┌─────────────────┐
│ Claude Session  │
│ Branch          │  ← Work here (claude/*)
└────────┬────────┘
         │
         │ npm run deploy
         ↓
┌─────────────────┐
│   production    │  ← Always deploy from here
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     Vercel      │  ← Auto-deploys production
└─────────────────┘
```

---

## One-Time Setup (Already Done)

✅ Created `production` branch
✅ Created deployment scripts
✅ Added npm commands

### What You Still Need To Do Once:

**Update Vercel Production Branch:**
1. Go to: https://vercel.com → Your Project
2. Go to: **Settings** → **Git**
3. Set **Production Branch** to: **`production`**
4. Save

**That's it!** You'll never touch this setting again.

---

## Daily Workflow

### 1. Work on Your Claude Session Branch

Claude Code automatically creates branches like:
- `claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`
- `claude/add-new-feature-02ABC123...`

Work normally on these branches. Commit, push, test locally.

### 2. When Ready to Deploy

**Option A: Interactive Deploy (with confirmation)**
```bash
npm run deploy
```

This will:
- Show you what will be deployed
- Ask for confirmation
- Merge session branch → production
- Push to GitHub
- Trigger Vercel deployment

**Option B: Auto Deploy (no prompts)**
```bash
npm run deploy:auto
```

Use this for automation or CI/CD.

### 3. Monitor Deployment

After running deploy:
1. Check Vercel dashboard for deployment progress
2. Deployment happens automatically when `production` is updated
3. Your session branch stays intact - keep working on it

---

## Benefits

✅ **No More Manual Config** - Set Vercel once, forget it
✅ **Clean History** - Production branch has only deployed code
✅ **Session Isolation** - Work on session branches without affecting deploys
✅ **Easy Rollback** - Revert production branch if needed
✅ **Works Forever** - No matter how many Claude sessions you start

---

## Branch Strategy

### Session Branches (`claude/*`)
- Created automatically by Claude Code
- Work in progress
- Can be deleted after merging to production
- Many of these can exist

### Production Branch (`production`)
- Single stable branch
- Always deployable
- Only updated via `npm run deploy`
- Vercel deploys this exclusively

---

## Common Tasks

### Deploy Current Work
```bash
# Make sure changes are committed first
git add .
git commit -m "Your changes"

# Deploy to production
npm run deploy
```

### Check What Will Be Deployed
```bash
# See difference between production and current branch
git log production..HEAD --oneline
```

### Rollback a Deployment
```bash
# Switch to production
git checkout production

# Reset to previous commit
git reset --hard HEAD~1

# Force push
git push -f origin production

# Switch back
git checkout claude/your-session-branch
```

### Clean Up Old Session Branches

After deploying, old session branches can be deleted:

**On GitHub:**
1. Go to: https://github.com/your-org/conductor/branches
2. Delete old `claude/*` branches (keep current one)

**Locally:**
```bash
# Delete local session branches except current
git branch | grep claude/ | grep -v $(git branch --show-current) | xargs git branch -D
```

---

## Troubleshooting

### "Permission denied" when deploying

Check your git credentials:
```bash
git config user.name
git config user.email
```

### Deploy succeeds but Vercel doesn't deploy

Check Vercel settings:
1. Ensure Production Branch = `production`
2. Check deployment logs for errors
3. Verify GitHub integration is active

### Production branch doesn't exist

Create it:
```bash
git checkout -b production
git push -u origin production
```

---

## File Reference

- **`scripts/deploy-to-production.sh`** - Interactive deploy script
- **`scripts/auto-deploy.sh`** - Automated deploy (no prompts)
- **`package.json`** - Contains `deploy` and `deploy:auto` commands
- **`vercel.json`** - Minimal config (branch set in dashboard)

---

## Summary

**Old Way:**
1. Work on claude/session-xyz
2. Manually update Vercel to deploy claude/session-xyz
3. Deploy breaks next session
4. Repeat forever 😭

**New Way:**
1. Work on any claude/* branch
2. Run `npm run deploy` when ready
3. Vercel auto-deploys from production
4. Never touch settings again 🎉
