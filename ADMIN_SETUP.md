# Admin Settings System

This document describes the Admin Settings system for the Conductor AI Agent Orchestration platform.

## Overview

The admin settings system provides a comprehensive backend UI for system administrators to manage application-wide configuration, user roles, and monitor system health.

## Features

- **Role-Based Access Control**: Admin, Operator, and Viewer roles
- **System Settings Management**: Configure app-wide settings by category
- **User Management**: Create and manage user profiles and permissions
- **Audit Logging**: Track all admin actions with detailed logs
- **Admin Statistics**: Real-time dashboard showing system health
- **Secure API**: Protected endpoints with role-based authorization

## Database Schema

### User Profiles (`user_profiles`)

Manages user accounts and their roles:

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- email: TEXT (unique)
- full_name: TEXT
- role: 'admin' | 'operator' | 'viewer'
- is_active: BOOLEAN
- last_login_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Roles:**
- `admin`: Full access to all settings and user management
- `operator`: Read access to settings, can execute operations
- `viewer`: Read-only access to public data

### System Settings (`system_settings`)

Stores application configuration:

```sql
- id: UUID (primary key)
- key: TEXT (unique)
- value: JSONB
- category: 'general' | 'agents' | 'tasks' | 'notifications' | 'integrations' | 'security'
- description: TEXT
- data_type: 'string' | 'number' | 'boolean' | 'json' | 'array'
- is_public: BOOLEAN (if true, visible to non-admins)
- is_editable: BOOLEAN (if false, cannot be modified)
- updated_by: UUID (references user_profiles)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Categories:**
- `general`: App name, version, maintenance mode
- `agents`: Agent limits, timeouts, auto-assignment
- `tasks`: Queue size, priorities, retry settings
- `notifications`: Email, Slack, webhook settings
- `integrations`: GitHub, OpenAI, Anthropic settings
- `security`: Auth settings, session timeouts

### Audit Logs (`audit_logs`)

Tracks all admin actions:

```sql
- id: UUID (primary key)
- user_id: UUID (references user_profiles)
- action: TEXT ('create', 'update', 'delete', 'login')
- resource_type: TEXT ('setting', 'user', 'agent', 'task')
- resource_id: UUID
- old_value: JSONB
- new_value: JSONB
- ip_address: TEXT
- user_agent: TEXT
- created_at: TIMESTAMPTZ
```

## API Endpoints

All admin endpoints require authentication and admin role.

### Settings

```
GET    /api/admin/settings          # List all settings (supports ?category=)
POST   /api/admin/settings          # Create new setting
GET    /api/admin/settings/[key]    # Get specific setting
PATCH  /api/admin/settings/[key]    # Update setting
DELETE /api/admin/settings/[key]    # Delete setting
```

### Users

```
GET    /api/admin/users             # List all users (supports ?role= and ?is_active=)
POST   /api/admin/users             # Create new user
```

### Statistics

```
GET    /api/admin/stats             # Get admin dashboard statistics
```

## Setup Instructions

### 1. Run Database Migration

Apply the admin settings migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration file directly
psql $DATABASE_URL -f supabase/migrations/20250110_add_admin_settings.sql
```

### 2. Create First Admin User

After running the migration, create your first admin user:

```sql
-- Replace with your email
INSERT INTO user_profiles (email, role, is_active)
VALUES ('your-email@example.com', 'admin', true);
```

### 3. Access Admin Panel

Navigate to `/admin/settings` in your application. You must be logged in with an admin account.

## Using the Admin Panel

### Viewing Settings

1. Navigate to `/admin/settings`
2. View statistics at the top of the page
3. Filter settings by category using the category buttons
4. All settings are displayed in a table with their values

### Editing Settings

1. Click "Edit" button next to any editable setting
2. Modify the value (must be valid JSON for complex types)
3. Click "Save" to apply changes
4. Changes are logged in the audit trail

### Managing Users

Use the API endpoints to create and manage users:

```typescript
// Create a new operator user
const response = await fetch('/api/admin/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'operator@example.com',
    full_name: 'Operator User',
    role: 'operator',
    is_active: true
  })
})
```

## Default Settings

The migration creates these default settings:

**General:**
- `app.name`: "Conductor"
- `app.description`: "AI Agent Orchestration System"
- `app.version`: "1.0.0"
- `app.maintenance_mode`: false

**Agents:**
- `agents.max_concurrent`: 10
- `agents.heartbeat_interval`: 30 seconds
- `agents.timeout`: 300 seconds
- `agents.auto_assign`: true

**Tasks:**
- `tasks.max_queue_size`: 1000
- `tasks.default_priority`: 5
- `tasks.retry_attempts`: 3
- `tasks.auto_archive_days`: 30

**Notifications:**
- `notifications.enabled`: true
- `notifications.email_enabled`: false
- `notifications.slack_enabled`: false

**Integrations:**
- `integrations.github_enabled`: false
- `integrations.openai_enabled`: false
- `integrations.anthropic_enabled`: true

**Security:**
- `security.require_api_key`: true
- `security.session_timeout`: 3600 seconds
- `security.max_login_attempts`: 5
- `security.password_min_length`: 8

## Security Features

### Row Level Security (RLS)

All admin tables have RLS policies enabled:

- **user_profiles**: Only admins can view/modify all profiles; users can view their own
- **system_settings**: Only admins can modify; public settings visible to all
- **audit_logs**: Only admins can view; all authenticated users can create

### Authorization Middleware

The `requireAdmin()` middleware:
1. Verifies user is authenticated via Supabase Auth
2. Checks user has admin role in user_profiles
3. Verifies user account is active
4. Returns 401/403 if unauthorized

### Audit Trail

All admin actions are logged with:
- User who performed the action
- What was changed (old/new values)
- When it happened
- IP address and user agent

## Best Practices

1. **Limit Admin Access**: Only grant admin role to trusted users
2. **Review Audit Logs**: Regularly check audit logs for unauthorized changes
3. **Lock Critical Settings**: Set `is_editable: false` for settings that shouldn't change
4. **Use Categories**: Organize settings logically by category
5. **Validate Values**: Ensure setting values match their data_type
6. **Backup Before Changes**: Always backup settings before major modifications

## Troubleshooting

### "Forbidden: Admin access required"

- Verify your user has admin role in user_profiles table
- Check your account is active (`is_active = true`)
- Ensure you're logged in to Supabase Auth

### Settings Not Loading

- Check browser console for errors
- Verify database migration was applied
- Check Supabase RLS policies are enabled
- Ensure API routes are accessible

### Cannot Edit Setting

- Check if setting has `is_editable: false`
- Verify you have admin role (not just operator)
- Check the value format matches the data_type

## Future Enhancements

Planned features for the admin system:

- [ ] User management UI in admin panel
- [ ] Audit log viewer
- [ ] Bulk settings import/export
- [ ] Setting validation rules
- [ ] Email notifications for critical changes
- [ ] Multi-factor authentication for admins
- [ ] API rate limiting per user
- [ ] Custom role permissions

## Support

For issues or questions about the admin system:

1. Check this documentation
2. Review the code in `/app/admin/` and `/app/api/admin/`
3. Check the database schema in `/supabase/migrations/20250110_add_admin_settings.sql`
4. Open an issue in the project repository
