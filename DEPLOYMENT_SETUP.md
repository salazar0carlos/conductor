# Deployment Setup - One-Time Configuration

## Quick Setup (5 minutes)

Follow these steps ONCE to set up the stable deployment system:

### Step 1: Create Production Branch Locally

```bash
# Make sure you're in the conductor directory
cd /path/to/conductor

# Create production branch from current state
git checkout -b production

# Push to GitHub (you'll be prompted for credentials if needed)
git push -u origin production
```

### Step 2: Update Vercel

1. Go to: **https://vercel.com**
2. Select your **conductor** project
3. Click **Settings** (top navigation)
4. Click **Git** (left sidebar)
5. Find **"Production Branch"**
6. Change from current value to: **`production`**
7. Click **Save**

### Step 3: Update GitHub Default Branch (Optional but Recommended)

1. Go to: **https://github.com/your-username/conductor/settings/branches**
2. Find **"Default branch"**
3. Click the switch icon
4. Select: **`production`**
5. Click **Update**

### Step 4: Go Back to Your Session Branch

```bash
# Return to your Claude session branch
git checkout claude/session-timeout-issue-01NUQ8Mxqf6EZ5aMSAayr9Jq
```

---

## Verification

To verify everything works:

```bash
# Deploy current work to production
npm run deploy

# You should see:
# ✅ Successfully deployed to production!
```

Then check Vercel dashboard - you should see a new deployment starting.

---

## You're Done!

From now on, just run `npm run deploy` whenever you want to deploy.

Never touch Vercel/GitHub settings again!

---

## If You Get Permission Errors

Make sure your git is configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

And that you have push access to the repository.
