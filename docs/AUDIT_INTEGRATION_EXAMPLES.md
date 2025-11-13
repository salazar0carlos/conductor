# Audit Log Integration Examples

This document shows how to integrate audit logging into your existing application.

## Example 1: Adding Audit Logging to an API Route

### Before: Simple API Route

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = createClient(...)
  const body = await request.json()

  const { data, error } = await supabase
    .from('projects')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
```

### After: With Audit Logging

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auditLog } from '@/lib/audit/logger'

export async function POST(request: NextRequest) {
  const supabase = createClient(...)
  const body = await request.json()

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser()

  // Create project
  const { data, error } = await supabase
    .from('projects')
    .insert(body)
    .select()
    .single()

  if (error) {
    // Log the error
    await auditLog.userAction(
      'create',
      'project',
      'unknown',
      user?.id,
      {
        resource_name: body.name,
        error_message: error.message,
        http_status: 500,
        ip_address: request.headers.get('x-forwarded-for') || undefined,
      }
    )

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the successful creation
  await auditLog.userAction(
    'create',
    'project',
    data.id,
    user?.id,
    {
      resource_name: data.name,
      new_values: data,
      http_status: 200,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    }
  )

  return NextResponse.json({ success: true, data })
}
```

## Example 2: Using Middleware for Automatic Logging

### Wrap Your Handler

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuditLogging } from '@/lib/audit/middleware'

// Wrap the handler with automatic audit logging
export const POST = withAuditLogging(async (request: NextRequest) => {
  // Your existing logic - middleware handles all the logging!
  const supabase = createClient(...)
  const body = await request.json()

  const { data, error } = await supabase
    .from('projects')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
})

// The middleware automatically logs:
// - Request method, path, IP, user agent
// - User information from session
// - Request/response bodies (sanitized)
// - Response status and timing
// - Risk scores and security metrics
```

## Example 3: Authentication Events

### Login Handler

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit/logger'
import { detectBruteForce } from '@/lib/audit/middleware'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check for brute force
  const isBruteForce = await detectBruteForce(ip, email, 10, 5)
  if (isBruteForce) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // Attempt login
  const supabase = createClient(...)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Log failed login
    await auditLog.auth('login_failed', undefined, {
      user_email: email,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || undefined,
      error_message: error.message,
    })

    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Log successful login
  await auditLog.auth('login', data.user.id, {
    user_email: email,
    ip_address: ip,
    user_agent: request.headers.get('user-agent') || undefined,
    session_id: data.session?.access_token,
  })

  return NextResponse.json({ success: true, data })
}
```

## Example 4: Data Access Logging (GDPR/HIPAA)

### Sensitive Data Export

```typescript
// app/api/users/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  // Check permissions
  if (!user || (user.id !== params.id && !user.app_metadata?.is_admin)) {
    await auditLog.security(
      'unauthorized_access',
      'warning',
      `Unauthorized data export attempt for user ${params.id}`,
      {
        user_id: user?.id,
        resource_type: 'user_data',
        resource_id: params.id,
        ip_address: request.headers.get('x-forwarded-for') || undefined,
      }
    )

    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  // Log the data access (compliance requirement)
  await auditLog.dataAccess(
    'export_data',
    'user_data',
    params.id,
    user.id,
    {
      is_sensitive: true,
      is_compliance_relevant: true,
      compliance_tags: ['GDPR', 'RIGHT_TO_ACCESS'],
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        export_format: 'json',
        data_types: Object.keys(userData),
      },
    }
  )

  return NextResponse.json({ success: true, data: userData })
}
```

## Example 5: Admin Actions with Change Tracking

### Update Settings

```typescript
// app/api/admin/settings/[key]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const supabase = createClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  const { value } = await request.json()

  // Get current value
  const { data: currentSetting } = await supabase
    .from('settings')
    .select('*')
    .eq('key', params.key)
    .single()

  // Update setting
  const { data, error } = await supabase
    .from('settings')
    .update({ value })
    .eq('key', params.key)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the admin action with before/after values
  await auditLog.admin(
    `Updated setting: ${params.key}`,
    'setting',
    params.key,
    user!.id,
    {
      old_values: { value: currentSetting?.value },
      new_values: { value: data.value },
      resource_name: params.key,
      is_compliance_relevant: true,
      compliance_tags: ['SOC2'],
    }
  )

  return NextResponse.json({ success: true, data })
}
```

## Example 6: Security Event Detection

### Detect Suspicious Activity

```typescript
// app/api/projects/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit/logger'
import { detectAnomalies } from '@/lib/audit/middleware'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for anomalous behavior
  await detectAnomalies(user.id)

  // Get project data before deletion
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  // Delete project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the deletion with high risk score
  await auditLog.userAction(
    'delete',
    'project',
    params.id,
    user.id,
    {
      resource_name: project?.name,
      old_values: project,
      severity: 'warning',
      risk_score: 70, // Deletions are high risk
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    }
  )

  return NextResponse.json({ success: true })
}
```

## Example 7: Integration/Webhook Events

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit/logger'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  try {
    // Verify webhook
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Log webhook received
    await auditLog.log({
      event_category: 'integration_event',
      event_type: 'webhook_triggered',
      event_name: `Stripe Webhook: ${event.type}`,
      actor_type: 'integration',
      api_endpoint: '/api/webhooks/stripe',
      http_method: 'POST',
      request_body: { event_type: event.type },
      metadata: {
        stripe_event_id: event.id,
        webhook_type: event.type,
      },
    })

    // Process webhook
    // ...

    return NextResponse.json({ received: true })
  } catch (error) {
    // Log failed webhook
    await auditLog.log({
      event_category: 'integration_event',
      event_type: 'webhook_failed',
      event_name: 'Stripe Webhook Failed',
      severity: 'error',
      actor_type: 'integration',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    )
  }
}
```

## Example 8: System Events

### Backup Job

```typescript
// scripts/backup.ts
import { getAuditLogger } from '@/lib/audit/logger'

async function performBackup() {
  const logger = getAuditLogger()
  const backupId = crypto.randomUUID()

  try {
    // Log backup start
    await logger.log({
      event_category: 'system_event',
      event_type: 'backup_created',
      event_name: 'Database Backup Started',
      actor_type: 'system',
      resource_type: 'database',
      resource_id: backupId,
      is_compliance_relevant: true,
      compliance_tags: ['SOC2', 'BACKUP_POLICY'],
    })

    // Perform backup
    const result = await createBackup()

    // Log backup success
    await logger.log({
      event_category: 'system_event',
      event_type: 'backup_created',
      event_name: 'Database Backup Completed',
      actor_type: 'system',
      resource_type: 'database',
      resource_id: backupId,
      metadata: {
        file_size_bytes: result.size,
        duration_ms: result.duration,
      },
    })
  } catch (error) {
    // Log backup failure
    await logger.log({
      event_category: 'system_event',
      event_type: 'backup_created',
      event_name: 'Database Backup Failed',
      severity: 'critical',
      actor_type: 'system',
      resource_type: 'database',
      resource_id: backupId,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}
```

## Example 9: Compliance Report Generation

### Generate Monthly SOC2 Report

```typescript
// scripts/generate-monthly-report.ts
import { getComplianceManager } from '@/lib/audit/compliance'

async function generateMonthlyReport() {
  const compliance = getComplianceManager()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const report = await compliance.generateSOC2Report(
    startOfMonth.toISOString(),
    endOfMonth.toISOString()
  )

  console.log('SOC2 Report Generated:')
  console.log(`- Period: ${report.period.start} to ${report.period.end}`)
  console.log(`- Permission Changes: ${report.controls.access_control.total_permission_changes}`)
  console.log(`- Failed Logins: ${report.controls.authentication.failed_login_attempts}`)
  console.log(`- Security Alerts: ${report.controls.security_monitoring.security_alerts}`)
  console.log(`- Compliant: ${report.summary.compliant ? 'Yes' : 'No'}`)

  if (report.summary.recommendations.length > 0) {
    console.log('Recommendations:')
    report.summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`)
    })
  }

  // Save report to file or send via email
  // ...
}
```

## Best Practices

1. **Always log sensitive data access** for GDPR/HIPAA compliance
2. **Use middleware** for automatic logging of all API routes
3. **Include before/after values** for update operations
4. **Set appropriate risk scores** for security-critical operations
5. **Tag compliance-relevant events** with proper compliance standards
6. **Log both successes and failures** for complete audit trail
7. **Include contextual information** (IP, user agent, session ID)
8. **Never log actual sensitive data** (passwords, tokens, SSNs)
9. **Review security alerts regularly** to catch anomalies
10. **Generate compliance reports monthly** for audit purposes

## Performance Tips

- Use middleware for automatic logging to avoid code duplication
- Log asynchronously (don't wait for log writes)
- Use aggregations table for dashboard queries
- Archive old logs regularly to manage database size
- Use read replicas for audit log queries in production
