# Audit Log & Compliance System

A comprehensive enterprise-grade audit logging system for security, compliance, and operational monitoring.

## Features

### 1. Activity Tracking
- **All User Actions**: CRUD operations on any entity
- **Admin Actions**: Separate tracking for administrative operations
- **System Events**: Logins, logouts, API calls
- **Security Events**: Failed logins, permission changes, suspicious activity
- **Data Changes**: Before/after snapshots with automatic diff calculation
- **API Monitoring**: Request/response logs with performance metrics

### 2. Audit Log Viewer
- **Advanced Filters**: Filter by user, action type, entity, date range, IP address
- **Searchable Table**: Full-text search across event names, users, and resources
- **Timeline View**: Chronological view of all events
- **Detailed Viewer**: JSON diff viewer for data changes
- **Real-time Updates**: Live log streaming
- **Export**: CSV, JSON export capabilities

### 3. Event Types
- **User Actions**: Create, Read, Update, Delete
- **Auth Events**: Login, Logout, Password Change, 2FA
- **Permission Changes**: Role updates, access grants/revokes
- **Data Access**: View sensitive data, export data, downloads, sharing
- **System Events**: Backups, migrations, deployments, configuration changes
- **Security Events**: Suspicious activity, rate limit violations, brute force attempts
- **Integration Events**: API calls, webhook triggers, external sync

### 4. Compliance Features
- **GDPR Compliance**: Data access requests, right to erasure (anonymization)
- **SOC 2 Audit Trail**: Complete access control and security monitoring
- **HIPAA Logging**: PHI access tracking and reporting
- **Tamper-Proof Logs**: Cryptographic hashing (SHA-256) with checksum chaining
- **Data Retention**: Configurable policies (30/90/180/365/730 days, forever)
- **Automatic Archival**: Policy-based log archival
- **Compliance Reports**: Automated report generation

### 5. Security Monitoring
- **Failed Login Dashboard**: Track authentication failures
- **Anomaly Detection**: Unusual patterns and impossible travel detection
- **Geographic Tracking**: Country/city-level location tracking
- **Device Fingerprinting**: Track access by device
- **Session Management**: Monitor active sessions
- **Brute Force Detection**: Automatic detection and alerting
- **Alert Rules**: Configurable security alert rules

### 6. Analytics Dashboard
- **User Activity**: Most active users and behavior patterns
- **Entity Access**: Most accessed resources
- **Peak Usage**: Hourly and daily usage patterns
- **Event Distribution**: Category breakdown with pie charts
- **Trends**: Time-series analysis with line charts
- **Performance Metrics**: Response time tracking

## Architecture

### Database Schema

The system uses 5 main tables:

1. **audit_logs**: Main log storage with tamper-proof checksums
2. **audit_log_aggregations**: Pre-computed analytics for performance
3. **audit_security_alerts**: Security incidents and alerts
4. **audit_compliance_reports**: Generated compliance reports
5. **audit_retention_policies**: Retention policy configuration

### Key Components

- **Logger** (`lib/audit/logger.ts`): Core logging utilities
- **Middleware** (`lib/audit/middleware.ts`): Auto-logging for API routes
- **Compliance** (`lib/audit/compliance.ts`): GDPR/SOC2/HIPAA helpers
- **UI Components** (`components/audit-logs/`): React components for viewing logs
- **API Routes** (`app/api/audit/`): REST endpoints for log queries

## Installation & Setup

### 1. Run Database Migration

```bash
# The migration creates all necessary tables, indexes, and triggers
psql -f supabase/migrations/20250116_audit_log_system.sql
```

### 2. Configure Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Access the Admin Panel

Navigate to `/admin/audit-logs` to view the audit log dashboard.

## Usage

### Basic Logging

```typescript
import { auditLog } from '@/lib/audit/logger'

// Log a user action
await auditLog.userAction(
  'create',
  'project',
  projectId,
  userId,
  {
    resource_name: projectName,
    new_values: projectData,
  }
)

// Log authentication event
await auditLog.auth(
  'login',
  userId,
  {
    ip_address: '192.168.1.1',
    country_code: 'US',
  }
)

// Log security event
await auditLog.security(
  'suspicious_activity',
  'warning',
  'Multiple failed login attempts detected',
  {
    ip_address: '192.168.1.1',
    metadata: { attempt_count: 5 },
  }
)

// Log data access (for compliance)
await auditLog.dataAccess(
  'export_data',
  'user_data',
  userId,
  requesterId,
  {
    is_compliance_relevant: true,
    compliance_tags: ['GDPR'],
  }
)

// Log admin action
await auditLog.admin(
  'Updated system settings',
  'settings',
  settingId,
  adminUserId,
  {
    old_values: { max_users: 100 },
    new_values: { max_users: 200 },
  }
)
```

### Automatic API Logging with Middleware

```typescript
import { withAuditLogging } from '@/lib/audit/middleware'
import { NextRequest, NextResponse } from 'next/server'

// Wrap your API handler with audit logging
export const GET = withAuditLogging(async (request: NextRequest) => {
  // Your API logic here
  const data = await fetchData()

  return NextResponse.json({ success: true, data })
})

// The middleware automatically logs:
// - Request method, path, headers
// - User information (from session)
// - IP address, user agent, device fingerprint
// - Request/response bodies (sanitized)
// - Response status, time
// - Risk scores and security metrics
```

### Query Logs Programmatically

```typescript
import { getAuditLogger } from '@/lib/audit/logger'

const logger = getAuditLogger()

// Query with filters
const { logs, total } = await logger.query({
  user_id: 'user-123',
  event_category: 'user_action',
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  limit: 50,
})

// Get analytics
const analytics = await logger.getAnalytics(30) // Last 30 days

// Get security alerts
const alerts = await logger.getSecurityAlerts('open')
```

### Compliance Reports

```typescript
import { getComplianceManager } from '@/lib/audit/compliance'

const compliance = getComplianceManager()

// GDPR: Right to Access
const userReport = await compliance.generateUserDataReport(userId)

// GDPR: Right to Erasure
const result = await compliance.anonymizeUserLogs(userId, adminId)

// SOC 2 Report
const soc2Report = await compliance.generateSOC2Report(
  '2025-01-01',
  '2025-12-31'
)

// HIPAA Report
const hipaaReport = await compliance.generateHIPAAReport(
  '2025-01-01',
  '2025-12-31'
)

// Verify log integrity
const integrity = await compliance.verifyLogIntegrity(1000)
if (!integrity.valid) {
  console.error('Tampered logs detected:', integrity.tampered_logs)
}

// Apply retention policies
const retention = await compliance.applyRetentionPolicies()
console.log(`Archived ${retention.archived} logs`)
```

### Security Monitoring

```typescript
import { detectBruteForce, detectAnomalies } from '@/lib/audit/middleware'

// Detect brute force attacks
const isBruteForce = await detectBruteForce(
  ipAddress,
  userId,
  10, // time window in minutes
  5   // max failed attempts
)

if (isBruteForce) {
  // Block IP, require CAPTCHA, etc.
}

// Detect anomalous user behavior
await detectAnomalies(userId)
// Creates security alerts for:
// - Impossible travel (multiple countries)
// - Unusual activity spikes
```

## API Endpoints

### GET /api/audit/logs
Query audit logs with filters.

**Query Parameters:**
- `user_id`: Filter by user
- `event_category`: Filter by category
- `event_type`: Filter by type
- `severity`: Filter by severity
- `resource_type`: Filter by resource
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `search`: Full-text search
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 1234
}
```

### GET /api/audit/analytics
Get analytics data.

**Query Parameters:**
- `days`: Number of days (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeSeries": [...],
    "topUsers": [...],
    "eventDistribution": [...],
    "hourlyDistribution": [...]
  }
}
```

### GET /api/audit/alerts
Get security alerts.

**Query Parameters:**
- `status`: Filter by status (open, investigating, resolved, false_positive)

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### PATCH /api/audit/alerts
Update alert status.

**Request Body:**
```json
{
  "alert_id": "uuid",
  "status": "resolved",
  "resolution_notes": "False positive - legitimate admin access"
}
```

### POST /api/audit/export
Export logs.

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "fields": [
    "created_at",
    "event_name",
    "user_email",
    "resource_type"
  ]
}
```

## Security Features

### Tamper-Proof Logging

Every log entry includes:
- **Checksum**: SHA-256 hash of critical fields
- **Previous Checksum**: Links to previous log (blockchain-style)
- **Automatic Verification**: Detect tampering with integrity checks

### Sensitive Data Protection

- Automatic redaction of passwords, tokens, API keys
- Configurable sensitive field detection
- Separate storage for sensitive data access logs

### Risk Scoring

Each event receives a risk score (0-100) based on:
- HTTP method (DELETE, PATCH = higher risk)
- Admin routes (+30)
- Failed authentication (+40)
- Server errors (+30)
- Missing user context (+20)

High-risk events (>70) trigger automatic security alerts.

## Retention Policies

Default policies:
- **Critical Security Events**: 2 years
- **Compliance Events**: 1 year
- **Authentication Events**: 90 days
- **User Actions**: 30 days
- **System Events**: 180 days

Custom policies can be configured via `audit_retention_policies` table.

## Performance Considerations

### Aggregations Table

Pre-computed aggregations for fast analytics:
- Updated automatically via database triggers
- Grouped by date, hour, category, user
- Reduces query time for dashboards

### Indexes

Comprehensive indexing for:
- Time-based queries (created_at)
- User lookups (user_id)
- Category/type filtering
- Full-text search (event_name)
- IP address tracking
- Compliance queries

### Archival

Old logs can be:
- Archived to cold storage
- Compressed for long-term retention
- Deleted after retention period (configurable)

## Compliance Checklists

### GDPR ✅
- [x] Right to access (data export)
- [x] Right to erasure (anonymization)
- [x] Data breach notification logging
- [x] Consent tracking
- [x] Data processing activity records

### SOC 2 ✅
- [x] Access control monitoring
- [x] Authentication tracking
- [x] Permission change logging
- [x] Security incident detection
- [x] Audit trail integrity

### HIPAA ✅
- [x] PHI access logging
- [x] User activity monitoring
- [x] Encryption (at rest & in transit)
- [x] Audit controls
- [x] Breach detection

## Best Practices

1. **Log Everything**: Err on the side of logging too much
2. **Sanitize Sensitive Data**: Never log passwords or PII unnecessarily
3. **Regular Reviews**: Review security alerts weekly
4. **Retention Compliance**: Ensure policies match legal requirements
5. **Integrity Checks**: Run log integrity verification monthly
6. **Archive Strategy**: Move old logs to cold storage
7. **Access Control**: Restrict audit log access to admins only
8. **Real-time Alerts**: Set up notifications for critical events

## Troubleshooting

### High Volume Logging

If experiencing performance issues:
- Increase aggregation intervals
- Archive old logs more frequently
- Use read replicas for queries
- Implement log sampling for high-frequency events

### Storage Growth

Manage storage with:
- Aggressive retention policies for non-compliance logs
- Compression for archived logs
- Periodic cleanup of old aggregations

### False Positives

Tune security detection:
- Adjust brute force thresholds
- Whitelist trusted IPs
- Configure anomaly detection baselines

## Future Enhancements

- [ ] Real-time log streaming (WebSocket)
- [ ] Machine learning anomaly detection
- [ ] Advanced correlation analysis
- [ ] Custom alert rules engine
- [ ] Integration with SIEM systems
- [ ] Automated compliance certification
- [ ] PDF report generation
- [ ] Multi-tenant support
- [ ] Elasticsearch integration for fast search

## Support

For issues or questions:
1. Check the logs in `/admin/audit-logs`
2. Review security alerts
3. Verify database migrations ran successfully
4. Check environment variables

## License

Enterprise Edition - All Rights Reserved
