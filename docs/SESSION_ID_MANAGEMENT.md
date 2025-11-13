# Session ID Management

## 🚨 Critical Importance

**The session ID is THE MOST CRITICAL configuration for this application.**

Without proper session ID management:
- ❌ Vercel deployments will fail
- ❌ Claude Code becomes completely unusable
- ❌ Hours of troubleshooting and manual fixes required

This document explains how to manage session IDs to prevent these issues.

---

## 📋 What is the Session ID?

The session ID is a unique identifier used by Claude Code for:
- Git branch naming (`claude/incomplete-description-{SESSION_ID}`)
- Vercel deployment configuration
- Session state management
- Integration tracking

**Example Session ID:** `011CV5EqLsNpgqQ42rfXspUV`

---

## 🏗️ Architecture

### Centralized Configuration

All session ID configuration is centralized in:

```
config/session.json
```

This file contains:
```json
{
  "sessionId": "011CV5EqLsNpgqQ42rfXspUV",
  "branchName": "claude/incomplete-description-011CV5EqLsNpgqQ42rfXspUV",
  "description": "Central session ID configuration for Claude Code integration",
  "lastUpdated": "2025-11-13T00:00:00Z",
  "updatedBy": "system"
}
```

### Configuration Files

The session ID must be consistent across:

1. **config/session.json** - Source of truth
2. **vercel.json** - Deployment configuration
3. **Git branch** - Current branch must match expected branch name

---

## 🛠️ Available Commands

### 1. Validate Session ID

**Command:**
```bash
npm run session:validate
```

**What it does:**
- ✅ Checks session ID consistency across all configurations
- ✅ Validates git branch matches expected branch
- ✅ Verifies Vercel deployment configuration
- ✅ Reports any mismatches with clear error messages

**When to run:**
- Before committing changes
- After switching branches
- When troubleshooting deployment issues
- Daily as a sanity check

**Example output:**
```
🔍 Validating Session ID Consistency...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Configuration Summary:
  Session ID: 011CV5EqLsNpgqQ42rfXspUV
  Expected Branch: claude/incomplete-description-011CV5EqLsNpgqQ42rfXspUV
  Current Branch: claude/incomplete-description-011CV5EqLsNpgqQ42rfXspUV

✓ Session config loaded from config/session.json
✓ Branch name format is correct
✓ Current branch matches session config
✓ Vercel deployment configured for correct branch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ VALIDATION PASSED: Session ID is consistent across all configurations

Session ID: 011CV5EqLsNpgqQ42rfXspUV
Branch: claude/incomplete-description-011CV5EqLsNpgqQ42rfXspUV
```

---

### 2. Update Session ID

**Command:**
```bash
npm run session:update <NEW_SESSION_ID>
```

**What it does:**
- 🔄 Updates `config/session.json` with new session ID
- 🔄 Updates `vercel.json` deployment configuration
- 🔄 Creates or switches to the correct git branch
- 📋 Provides step-by-step instructions for completing the update

**When to run:**
- **IMMEDIATELY** when Claude Code session ID changes
- When setting up a new deployment environment
- When migrating to a new session

**Example:**
```bash
npm run session:update 022DW6FrMtOphrR53sgYtuWX
```

**Important:** After running this command, you MUST:
1. Review and commit the changes
2. Push to the remote repository
3. Update Vercel production branch settings
4. Verify deployment

---

### 3. Setup Git Hooks

**Command:**
```bash
npm run setup:hooks
```

**What it does:**
- 📌 Installs pre-commit hook for session ID validation
- 🛡️ Prevents commits with session ID mismatches
- ⚡ Runs automatically before every commit

**When to run:**
- Once during initial setup
- After cloning the repository
- If hooks stop working

---

## 🔄 Workflow: Updating Session ID

When the session ID changes (e.g., Claude Code creates a new session), follow this workflow:

### Step 1: Update Configuration
```bash
npm run session:update <NEW_SESSION_ID>
```

### Step 2: Review Changes
```bash
git status
git diff config/session.json vercel.json
```

### Step 3: Commit Changes
```bash
git add config/session.json vercel.json
git commit -m "chore: Update session ID to <NEW_SESSION_ID>"
```

### Step 4: Push to Remote
```bash
git push -u origin claude/incomplete-description-<NEW_SESSION_ID>
```

⚠️ **CRITICAL:** This push is what enables Vercel deployment!

### Step 5: Update Vercel Settings
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Navigate to **Settings** → **Git**
4. Under **Production Branch**, set to: `claude/incomplete-description-<NEW_SESSION_ID>`
5. Save changes

### Step 6: Verify Deployment
1. Check Vercel dashboard for deployment status
2. Visit your deployed application
3. Test Claude Code functionality
4. Run validation:
   ```bash
   npm run session:validate
   ```

---

## 🛡️ Automated Protection

### Pre-commit Hook

The pre-commit hook automatically validates session ID consistency before every commit.

**Installation:**
```bash
npm run setup:hooks
```

**What it prevents:**
- ❌ Committing changes with mismatched session IDs
- ❌ Accidentally breaking deployments
- ❌ Creating inconsistent configurations

**How it works:**
1. You attempt to commit
2. Hook runs `npm run session:validate`
3. If validation fails, commit is blocked
4. You see clear error messages
5. You fix the issues
6. Commit succeeds

---

## 🚨 Troubleshooting

### Deployment Failed

**Symptoms:**
- Vercel deployment fails
- Build errors related to branch configuration
- Claude Code reports session errors

**Solution:**
```bash
# 1. Validate current configuration
npm run session:validate

# 2. If validation fails, check error messages
# 3. Fix any mismatches manually or run:
npm run session:update <CURRENT_SESSION_ID>

# 4. Commit and push
git add .
git commit -m "fix: Restore session ID consistency"
git push

# 5. Verify Vercel settings match the branch
```

---

### Wrong Branch

**Symptoms:**
- Validation reports branch mismatch
- You're on `main` or wrong `claude/*` branch

**Solution:**
```bash
# Check what branch you should be on
cat config/session.json | grep branchName

# Switch to the correct branch
git checkout <BRANCH_NAME_FROM_CONFIG>

# Or update to current session ID
npm run session:update <CURRENT_SESSION_ID>
```

---

### Session ID Changed Unexpectedly

**What happened:**
Claude Code created a new session with a different ID.

**Solution:**
```bash
# 1. Get the new session ID from Claude Code
# 2. Update configuration immediately
npm run session:update <NEW_SESSION_ID>

# 3. Follow the complete workflow (commit, push, update Vercel)
```

---

## 📊 Best Practices

### Daily Checks
```bash
# Run validation at the start of each day
npm run session:validate
```

### Before Commits
The pre-commit hook handles this automatically, but you can manually check:
```bash
npm run session:validate
git commit -m "your message"
```

### After Branch Changes
```bash
git checkout <branch>
npm run session:validate
```

### After Pulling Changes
```bash
git pull
npm run session:validate
```

---

## 🔒 File Structure

```
conductor/
├── config/
│   └── session.json              # ⭐ Source of truth
├── scripts/
│   ├── validate-session-id.ts    # Validation script
│   ├── update-session-id.ts      # Update script
│   ├── setup-hooks.ts            # Hook installation
│   └── pre-commit-hook.sh        # Pre-commit validation
├── vercel.json                   # Deployment config
└── docs/
    └── SESSION_ID_MANAGEMENT.md  # This file
```

---

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| Check if session ID is consistent | `npm run session:validate` |
| Update to new session ID | `npm run session:update <ID>` |
| Install validation hooks | `npm run setup:hooks` |
| View current session ID | `cat config/session.json` |
| View current branch | `git branch` |

---

## 💡 Key Takeaways

1. **Session ID consistency is critical** - Without it, everything breaks
2. **Always use the provided tools** - Don't manually edit configurations
3. **Validate frequently** - Run `npm run session:validate` often
4. **Act immediately on changes** - When session ID changes, update everything right away
5. **Follow the complete workflow** - Update → Commit → Push → Configure Vercel

---

## 📞 Support

If you encounter issues:

1. Run validation: `npm run session:validate`
2. Check error messages carefully
3. Follow troubleshooting steps above
4. Review recent git changes: `git log --oneline -5`
5. Check Vercel deployment logs

---

**Remember: The session ID is the backbone of Claude Code integration. Treat it with care!**
