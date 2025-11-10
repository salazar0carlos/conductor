# Deployment Guide

## Prerequisites

- Vercel account
- Supabase project configured
- Anthropic API key
- (Optional) GitHub OAuth app configured
- (Optional) Sentry account for error tracking

## Database Setup

1. **Run migrations in Supabase SQL Editor**:

```sql
-- First run the initial schema
-- Copy contents from: supabase/migrations/20250110_initial_schema.sql

-- Then run the production features migration
-- Copy contents from: supabase/migrations/20250110_add_production_features.sql
```

2. **Enable Realtime** for all tables in Supabase Dashboard:
   - Go to Database → Replication
   - Enable replication for: projects, agents, tasks, task_logs, analysis_history

## Environment Variables

### Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Internal (generate a secure random string)
INTERNAL_JOB_TOKEN=your-secure-random-token
```

### Optional

```env
# GitHub OAuth (for repo integration)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Sentry (error tracking)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## Vercel Deployment

### Initial Deploy

1. **Push to GitHub**:
```bash
git push origin main
```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure environment variables (copy from .env.local)
   - Deploy

3. **Configure Cron Jobs** (for background job processing):
   - Go to your project → Settings → Cron Jobs
   - Add a new cron job:
     - Path: `/api/jobs/process`
     - Schedule: `*/5 * * * *` (every 5 minutes)
     - Secret: Add header `Authorization: Bearer YOUR_INTERNAL_JOB_TOKEN`

### Post-Deployment

1. **Test Health Endpoint**:
```bash
curl https://your-domain.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

2. **Register First Agent**:
```bash
curl -X POST https://your-domain.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "type": "llm",
    "capabilities": ["coding", "analysis"],
    "config": {"model": "claude-sonnet-4"}
  }'
```

3. **Generate API Key**:
```bash
curl -X POST https://your-domain.vercel.app/api/agents/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "name": "Production Key"
  }'
```

Save the returned API key securely!

## GitHub Integration Setup

### OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create a new OAuth app:
   - Application name: `Conductor`
   - Homepage URL: `https://your-domain.vercel.app`
   - Authorization callback URL: `https://your-domain.vercel.app/api/github/oauth/callback`
3. Copy Client ID and Client Secret to environment variables

### Webhooks

1. Go to your GitHub repository → Settings → Webhooks
2. Add webhook:
   - Payload URL: `https://your-domain.vercel.app/api/webhooks/github`
   - Content type: `application/json`
   - Secret: Your webhook secret
   - Events: Select individual events:
     - Push
     - Pull requests
     - Workflow runs
     - Deployments

## Intelligence Layer Setup

The Intelligence Layer runs automatically when:
- A task is completed → triggers analysis job
- Every 5 completed tasks → triggers pattern detection
- Every 10 pending analyses → triggers supervisor review

To manually trigger:
```bash
curl -X POST https://your-domain.vercel.app/api/jobs/process \
  -H "Authorization: Bearer YOUR_INTERNAL_JOB_TOKEN"
```

## Monitoring

### Health Checks

Set up external monitoring (e.g., UptimeRobot) to ping:
- `https://your-domain.vercel.app/api/health` every 5 minutes

### Sentry Integration

1. Create a Sentry project
2. Add Sentry environment variables
3. Sentry will automatically track:
   - API errors
   - Background job failures
   - Intelligence layer errors

### Vercel Analytics

Enable Vercel Analytics in your project dashboard for:
- Response times
- Error rates
- Endpoint usage

## Performance Optimization

### Database Indexes

All critical indexes are created by the migration. Monitor slow queries in Supabase → Database → Query Performance.

### Edge Functions

Some endpoints are configured with `export const runtime = 'edge'` for better performance. These run on Vercel Edge Network.

### Caching

Consider adding caching for:
- Dashboard stats (short TTL)
- Project lists (invalidate on changes)

Example with Next.js:
```typescript
export const revalidate = 60 // revalidate every 60 seconds
```

## Security Checklist

- [ ] Environment variables are set in Vercel (not in code)
- [ ] Service role key is kept secret (never exposed to client)
- [ ] API keys are hashed in database
- [ ] Rate limiting is enabled on all public endpoints
- [ ] RLS policies are configured in Supabase
- [ ] GitHub webhook signature verification is enabled
- [ ] CORS is properly configured
- [ ] Sentry error tracking is enabled

## Scaling Considerations

### Current Limits

- Rate limit: 60 requests/minute (IP-based)
- Agent rate limit: 100 requests/minute
- Background jobs: Process 10 jobs every 5 minutes
- Max concurrent realtime connections: Depends on Supabase plan

### Scaling Up

1. **Increase job processing frequency**: Adjust cron schedule
2. **Add job workers**: Deploy separate worker instances
3. **Upgrade Supabase plan**: For more connections and storage
4. **Add Redis**: Replace Supabase rate limiting with Redis for better performance
5. **Implement queue system**: Use Bull or BullMQ for advanced job processing

## Troubleshooting

### Intelligence Layer Not Running

1. Check Anthropic API key is valid
2. Check background jobs are being processed
3. View job errors in Supabase → Table Editor → background_jobs
4. Check logs in Vercel → Functions → Logs

### GitHub Integration Not Working

1. Verify webhook secret matches
2. Check GitHub webhook delivery logs
3. Verify OAuth credentials
4. Check network logs in Vercel

### Database Connection Issues

1. Check Supabase service status
2. Verify connection string
3. Check RLS policies aren't blocking requests
4. Monitor connection pool usage

## Rollback Procedure

If deployment fails:

1. **Revert via Vercel**:
   - Go to Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **Database rollback** (if needed):
   - Restore from Supabase automatic backups
   - Or manually revert migrations

## Support

- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com
- Anthropic Status: https://status.anthropic.com

## Next Steps

After deployment:
1. Set up monitoring alerts
2. Configure backup schedule in Supabase
3. Test end-to-end agent workflow
4. Document any custom integrations
5. Set up staging environment
