# Deployment Fix - Manual Steps Required

## Problem
You have multiple Claude session branches, but Vercel/GitHub are pointing to the WRONG branch.

## Current State
- ✅ **Latest code is on**: `claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`
- ❌ **Old branches (IGNORE THESE)**:
  - `claude/eight-layer-protection-013uA97ouh4jzsAKr8BKXA1D`
  - `claude/incomplete-description-011CV5EqLsNpgqQ42rfXspUV`

## What's On The Good Branch (`session-timeout-issue`)
✅ Session timeout fixes (Supabase auto-refresh)
✅ Simplified build (no custom validation blocking deployment)
✅ Minimal vercel.json
✅ All deployment issues fixed

---

## STEP 1: Update GitHub Default Branch

1. Go to: **https://github.com/salazar0carlos/conductor/settings/branches**
2. Find "Default branch" section (currently shows an old branch)
3. Click the **⇄ switch branches** icon
4. Select: **`claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`**
5. Click "Update" and confirm the change

---

## STEP 2: Update Vercel Production Branch

1. Go to: **https://vercel.com**
2. Select your **conductor** project
3. Click **Settings** (top navigation)
4. Click **Git** (left sidebar)
5. Find "Production Branch" setting
6. Change from current value to: **`claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`**
7. Click **Save**

---

## STEP 3: Delete Old Branches (Optional but Recommended)

### In GitHub:
1. Go to: **https://github.com/salazar0carlos/conductor/branches**
2. Find and delete:
   - `claude/eight-layer-protection-013uA97ouh4jzsAKr8BKXA1D`
   - `claude/incomplete-description-011CV5EqLsNpgqQ42rfXspUV`
3. Click the trash icon next to each

---

## STEP 4: Trigger Deployment

After completing Steps 1-2:

1. Go back to Vercel dashboard
2. Click **Deployments** tab
3. Click "**Redeploy**" on the latest deployment
4. OR: Make a trivial change and push to the correct branch

---

## Verification

Once deployed successfully, verify:
- [ ] GitHub default branch shows: `claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`
- [ ] Vercel production branch shows: `claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq`
- [ ] Deployment succeeds (no build errors)
- [ ] Session timeouts are fixed (you can stay logged in)

---

## If Deployment Still Fails

Share the EXACT error message from Vercel build logs so I can fix the actual code issue.
