# Authentication Setup Guide

This guide explains how to configure GitHub OAuth authentication for Conductor.

## Overview

Conductor uses Supabase Auth with GitHub as the OAuth provider. This allows users to sign in with their GitHub accounts, similar to how Vercel handles authentication.

## Prerequisites

- Supabase project created and configured
- GitHub account (for creating OAuth app)
- Application deployed or running locally

## Step 1: Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
   - URL: https://github.com/settings/developers

2. Click **"New OAuth App"**

3. Fill in the application details:
   - **Application name**: `Conductor` (or your preferred name)
   - **Homepage URL**:
     - Local: `http://localhost:3000`
     - Production: `https://your-domain.com`
   - **Application description**: `AI Agent Orchestration System`
   - **Authorization callback URL**: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
     - Replace `<your-supabase-project-ref>` with your actual project ref
     - Example: `https://rpteapaxfjmnymibknxr.supabase.co/auth/v1/callback`

4. Click **"Register application"**

5. **Save the credentials**:
   - Copy the **Client ID**
   - Click **"Generate a new client secret"** and copy it immediately (you won't see it again)

## Step 2: Configure Supabase Auth

1. Go to your Supabase Dashboard: https://app.supabase.com

2. Navigate to **Authentication** → **Providers**

3. Find **GitHub** in the list and click to expand

4. Toggle **"Enable Sign in with GitHub"** to ON

5. Enter your GitHub OAuth credentials:
   - **Client ID**: Paste from Step 1
   - **Client Secret**: Paste from Step 1

6. (Optional) Configure additional settings:
   - **Redirect URLs**: Add your application URLs
     - `http://localhost:3000/auth/callback` (for local development)
     - `https://your-domain.com/auth/callback` (for production)

7. Click **Save**

## Step 3: Update Environment Variables

Update your `.env.local` file (the Supabase keys should already be there):

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://rpteapaxfjmnymibknxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub OAuth (optional - only needed for project repo integration)
# Note: This is DIFFERENT from the OAuth app credentials above
# These are for the GitHub integration feature (connecting repos to projects)
GITHUB_CLIENT_ID=your_repo_integration_github_client_id
GITHUB_CLIENT_SECRET=your_repo_integration_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Other configs...
ANTHROPIC_API_KEY=your_anthropic_key
INTERNAL_JOB_TOKEN=dev-token
```

**Important Note**:
- The GitHub OAuth credentials you configured in Supabase are managed by Supabase and don't need to be in your `.env` file
- The `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in your env file are for a separate feature: connecting GitHub repositories to projects

## Step 4: Test Authentication Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. You should be redirected to `/auth/sign-in`

4. Click **"Sign in with GitHub"**

5. You'll be redirected to GitHub to authorize the application

6. After authorization, you'll be redirected back to `/dashboard`

7. You should see:
   - Your GitHub avatar in the top-right nav
   - Your username/email
   - A dropdown menu with "Sign Out" option

## Step 5: Verify Everything Works

### Check User Authentication
- ✅ Redirects to sign-in when not authenticated
- ✅ GitHub OAuth flow completes successfully
- ✅ Redirects to dashboard after sign-in
- ✅ User profile appears in nav
- ✅ Sign out works and redirects back to sign-in

### Check Protected Routes
Try accessing these URLs directly (while signed out):
- `/dashboard` → Should redirect to `/auth/sign-in`
- `/projects` → Should redirect to `/auth/sign-in`
- `/tasks` → Should redirect to `/auth/sign-in`
- `/agents` → Should redirect to `/auth/sign-in`
- `/intelligence` → Should redirect to `/auth/sign-in`
- `/admin/settings` → Should redirect to `/auth/sign-in`

### Check Public Routes
These should be accessible without authentication:
- `/` → Landing page (should be accessible)
- `/auth/sign-in` → Sign in page (should be accessible)

### Check API Routes
API routes should still work with API key authentication:
- All `/api/*` routes are accessible
- Agent API endpoints use API key auth (not user auth)

## Architecture Overview

### Authentication Flow

```
User visits /dashboard
    ↓
Middleware checks auth
    ↓
[No user session]
    ↓
Redirect to /auth/sign-in
    ↓
User clicks "Sign in with GitHub"
    ↓
AuthContext.signInWithGitHub()
    ↓
Supabase redirects to GitHub OAuth
    ↓
User authorizes on GitHub
    ↓
GitHub redirects to Supabase callback
    ↓
Supabase exchanges code for session
    ↓
Redirect to /auth/callback (our app)
    ↓
Session cookie set
    ↓
Redirect to /dashboard
    ↓
User is authenticated ✅
```

### Files Created/Modified

**New Files:**
- `lib/auth/auth-context.tsx` - React context for auth state
- `app/auth/sign-in/page.tsx` - Sign in page
- `app/auth/callback/route.ts` - OAuth callback handler

**Modified Files:**
- `lib/supabase/middleware.ts` - Added route protection
- `app/layout.tsx` - Wrapped app with AuthProvider
- `components/ui/nav.tsx` - Added user menu and sign out
- `components/admin/admin-settings.tsx` - Added user account info

### Auth Context Methods

```typescript
import { useAuth } from '@/lib/auth/auth-context'

const { user, session, loading, signInWithGitHub, signOut } = useAuth()

// user: Current user object (null if not signed in)
// session: Current session object
// loading: Boolean indicating auth state is loading
// signInWithGitHub(): Function to initiate GitHub OAuth
// signOut(): Function to sign out current user
```

### Using Auth in Components

```typescript
'use client'

import { useAuth } from '@/lib/auth/auth-context'

export function MyComponent() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <img src={user.user_metadata.avatar_url} alt="Avatar" />
    </div>
  )
}
```

## Troubleshooting

### "Invalid redirect URL" error
- **Cause**: The callback URL doesn't match what's configured in GitHub OAuth app
- **Fix**: Ensure the callback URL in GitHub settings matches your Supabase callback URL exactly

### Redirect loop
- **Cause**: Middleware configuration issue
- **Fix**: Check that `/auth/sign-in` is listed as a public route in middleware

### "User not found" after GitHub authorization
- **Cause**: Supabase Auth might not be properly configured
- **Fix**: Verify GitHub provider is enabled in Supabase dashboard

### Sign-in button does nothing
- **Cause**: Check browser console for errors
- **Fix**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Can't access admin settings
- **Cause**: Need to be signed in
- **Fix**: Sign in with GitHub first, then navigate to `/admin/settings`

## Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `INTERNAL_JOB_TOKEN`

2. Update GitHub OAuth app:
   - Add production callback URL: `https://your-domain.vercel.app/auth/callback`
   - Update Supabase Redirect URLs to include production domain

3. Deploy:
   ```bash
   git push origin main
   ```

4. Vercel will automatically deploy

### Update Supabase for Production

1. In Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: Add `https://your-domain.vercel.app/auth/callback`

## Security Best Practices

1. **Never commit secrets**: All OAuth credentials stay in Supabase dashboard or env files
2. **Use environment variables**: Never hardcode API keys in code
3. **Enable RLS**: Supabase Row Level Security should be enabled for all tables
4. **HTTPS only**: Always use HTTPS in production
5. **Verify redirect URLs**: Only allow trusted redirect URLs in OAuth settings

## Next Steps

Now that authentication is set up:

1. ✅ Users can sign in with GitHub
2. ✅ All routes are protected
3. ✅ Admin settings shows user info
4. Next: Build create forms for projects, tasks, and agents
5. Then: Add role-based access control (admin vs regular users)

## Support

If you encounter issues:
- Check Supabase logs: Dashboard → Logs → Auth
- Check browser console for errors
- Verify all environment variables are set
- Ensure GitHub OAuth app credentials are correct
