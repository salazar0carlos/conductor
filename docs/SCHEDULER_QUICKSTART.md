# Scheduler Quick Start Guide

Get up and running with the advanced scheduling system in minutes.

## Prerequisites

All dependencies are already installed:
- ✅ cronstrue
- ✅ cron-parser
- ✅ date-fns
- ✅ react-hook-form
- ✅ @fullcalendar/react

## Access the Scheduler

Navigate to: **http://localhost:3000/scheduler**

## Quick Examples

### Example 1: Daily Database Backup

1. Click "Create Job"
2. Fill in the form:
   ```
   Name: Daily Database Backup
   Description: Backup production database every night
   Job Type: Backup
   Schedule Type: Cron
   ```
3. Use the Visual Cron Builder:
   - Select "Every day at midnight" preset
   - Or manually set: Hour = 02 (2 AM)
4. Configure backup settings in Job Configuration
5. Click "Create Job"

### Example 2: Hourly API Health Check

1. Click "Create Job"
2. Fill in:
   ```
   Name: API Health Check
   Job Type: HTTP Request
   Schedule Type: Interval
   ```
3. Set interval:
   - Every: 1
   - Unit: Hours
4. Configure HTTP settings:
   ```
   URL: https://api.example.com/health
   Method: GET
   ```
5. Click "Create Job"

### Example 3: Weekly Report on Monday Morning

1. Click "Create Job"
2. Fill in:
   ```
   Name: Weekly Sales Report
   Job Type: Report Generation
   Schedule Type: Recurring
   ```
3. Set recurring pattern:
   - Frequency: Weekly
   - Days: Monday
   - Time: 09:00
4. Click "Create Job"

## Features Overview

### Dashboard
- See total jobs, active jobs, and execution statistics at a glance
- Monitor success rates and recent activity

### Job List View
- View all scheduled jobs in a table
- Filter by status (active, paused, disabled)
- Filter by job type
- Search by name or description
- Quick actions: Run, Pause/Resume, Edit, Delete

### Calendar View
- Visualize all scheduled jobs and executions
- Switch between month, week, and day views
- Color-coded events:
  - 🔵 Blue = Scheduled jobs
  - 🟢 Green = Completed executions
  - 🔴 Red = Failed executions
  - 🟡 Yellow = Paused jobs

### Execution Logs
- View detailed execution history
- Filter by status
- Expand entries to see:
  - Timing details
  - Output data
  - Error messages and stack traces
  - Metadata

## Visual Cron Builder Tips

### Presets
Quick select common patterns:
- Every minute: `* * * * *`
- Every hour: `0 * * * *`
- Every day at midnight: `0 0 * * *`
- Every weekday at 9am: `0 9 * * 1-5`

### Visual Builder
Use dropdowns to build complex schedules:
- **Every 5 minutes**: Minute = */5
- **Every 2 hours**: Hour = */2
- **First day of month**: Day of Month = 1
- **Weekdays only**: Day of Week = 1-5

### Advanced Mode
Direct cron expression input:
```
Format: minute hour day-of-month month day-of-week

Examples:
0 9 * * 1-5       # Weekdays at 9am
*/15 * * * *      # Every 15 minutes
0 0 1 * *         # First of every month
0 */6 * * *       # Every 6 hours
0 9 * * 1         # Every Monday at 9am
```

## Common Use Cases

### 1. API Monitoring
```javascript
Job Type: HTTP Request
Schedule: Every 5 minutes
Configuration:
  - URL: Your API endpoint
  - Method: GET
  - Expected status: 200
  - Timeout: 30 seconds
  - Retry: 2 attempts
```

### 2. Data Synchronization
```javascript
Job Type: Data Sync
Schedule: Every hour
Configuration:
  - Source: Your source system
  - Destination: Your destination
  - Incremental: true
```

### 3. Report Generation
```javascript
Job Type: Report
Schedule: Daily at 6am
Configuration:
  - Report type: daily_analytics
  - Format: PDF
  - Recipients: team@example.com
```

### 4. Database Cleanup
```javascript
Job Type: Database Query
Schedule: Every Sunday at 3am
Configuration:
  - Query: DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days'
  - Connection: production_db
```

### 5. AI-Powered Tasks
```javascript
Job Type: AI Task
Schedule: Daily at 9am
Configuration:
  - Provider: openai
  - Model: gpt-4
  - Prompt: "Analyze yesterday's metrics and provide insights"
```

## Best Practices

### 1. Naming Convention
Use descriptive names that explain what and when:
- ✅ "Daily DB Backup at 2am"
- ✅ "Hourly API Health Check"
- ❌ "Job 1"
- ❌ "Backup"

### 2. Set Appropriate Timeouts
- Quick API calls: 30 seconds
- Database queries: 5 minutes
- Report generation: 10 minutes
- Large backups: 1 hour

### 3. Configure Retries
For critical jobs:
```javascript
Retry Config:
  - Max attempts: 3
  - Initial delay: 60 seconds
  - Max delay: 1800 seconds (30 min)
  - Backoff multiplier: 2
```

For quick checks:
```javascript
Retry Config:
  - Max attempts: 2
  - Initial delay: 30 seconds
  - Max delay: 300 seconds (5 min)
  - Backoff multiplier: 2
```

### 4. Use Priority Levels
- 10 = Critical (must run first)
- 7-9 = High priority
- 4-6 = Medium priority
- 1-3 = Low priority

### 5. Monitor Execution Logs
- Check logs regularly for failures
- Investigate jobs with <95% success rate
- Set up notifications for critical job failures

## Troubleshooting

### Job Not Running?

**Check Status**: Ensure job is "active" (not paused)

**Check Next Run Time**: Should be in the future

**Check Execution Logs**: Look for error messages

**Verify Cron Expression**: Use the preview to see next 10 executions

### Execution Failing?

**Check Timeout**: May need to increase timeout_seconds

**Review Error Logs**: Expand execution in logs view to see details

**Test Configuration**: Use "Run Now" button to test immediately

**Check Retry Settings**: Ensure retry config is appropriate

### Calendar Not Showing Events?

**Check View Mode**: Switch between "All Events", "Scheduled", "Executions"

**Check Date Range**: Navigate to the correct date

**Verify Job Status**: Only active jobs appear in calendar

## Next Steps

1. **Create Your First Job**: Start with a simple HTTP health check
2. **Explore Calendar View**: Visualize your schedule
3. **Monitor Executions**: Check logs after jobs run
4. **Set Up Notifications**: Configure alerts for failures
5. **Optimize Schedules**: Adjust based on execution patterns

## Need Help?

- 📖 **Full Documentation**: See `/docs/SCHEDULER.md`
- 🎯 **Examples**: Check the pre-configured sample jobs
- 🔧 **API Reference**: Review API route documentation
- 💬 **Support**: Contact the development team

## Advanced Features (Coming Soon)

- Job dependencies (run after another job completes)
- Conditional execution (only if certain conditions are met)
- Job chaining and workflows
- Email/Slack notifications
- Webhook triggers
- Job templates
- Bulk operations
- Advanced analytics

---

**Happy Scheduling! 🚀**
