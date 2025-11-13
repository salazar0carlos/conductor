# SQL Editor - Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Environment variables configured

## Installation Steps

### 1. Install Dependencies (Already Done)

The following packages have been installed:
- `@monaco-editor/react` - Monaco Editor for SQL editing
- `sql-formatter` - SQL query formatting
- `node-sql-parser` - SQL parsing and validation
- `chart.js` + `react-chartjs-2` - Data visualization
- `papaparse` - CSV export functionality
- `@types/papaparse` - TypeScript types

### 2. Database Migration

Run the migration to create required database functions and tables:

#### Option A: Using Supabase CLI (Recommended)

```bash
# If you haven't installed Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

#### Option B: Manual Setup via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250113_create_execute_sql_function.sql`
4. Paste and run the SQL

### 3. Verify Installation

Check that the following files exist:

**API Routes:**
- `/app/api/database/query/route.ts` ✓
- `/app/api/database/schema/route.ts` ✓

**Components:**
- `/components/database/sql-editor.tsx` ✓
- `/components/database/schema-explorer.tsx` ✓
- `/components/database/results-table.tsx` ✓
- `/components/database/query-builder.tsx` ✓
- `/components/database/query-history.tsx` ✓

**Pages:**
- `/app/database/page.tsx` ✓

**Migrations:**
- `/supabase/migrations/20250113_create_execute_sql_function.sql` ✓

### 4. Environment Setup

Ensure `.env.local` has these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Access the SQL Editor

Open your browser and navigate to:

```
http://localhost:3000/database
```

## Testing the Setup

### Test 1: Schema Explorer
1. Open the SQL Editor
2. Check if the left panel shows your database tables
3. Click on a table to expand and see columns

### Test 2: Run a Simple Query
1. Type in the editor: `SELECT * FROM your_table LIMIT 10;`
2. Press `Cmd+Enter` or click "Run"
3. Verify results appear in the bottom panel

### Test 3: Visual Query Builder
1. Click "Query Builder" tab at the top
2. Select a table from the dropdown
3. Choose some columns
4. Click "Export to SQL"
5. Verify the generated SQL appears in the editor

### Test 4: Query History
1. Run a few queries
2. Check the right panel for query history
3. Click on a past query to load it

### Test 5: Export Data
1. Run a query that returns data
2. Click "Export" in the results panel
3. Try exporting as CSV, JSON, and SQL

## Security Setup (Important!)

### Restrict Access to Admins Only

Add role-based access control to protect the SQL Editor:

1. Create an admin check function:

```typescript
// lib/auth/admin-check.ts
import { createClient } from '@/lib/supabase/server';

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  // Check user role (adjust based on your schema)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}
```

2. Add to database page:

```typescript
// app/database/page.tsx
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin-check';

export default async function DatabasePage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  // ... rest of component
}
```

3. Add to API routes:

```typescript
// app/api/database/query/route.ts
import { isAdmin } from '@/lib/auth/admin-check';

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  // ... rest of handler
}
```

## Troubleshooting

### Issue: "execute_sql function does not exist"

**Solution:**
```bash
# Re-run the migration
supabase db push

# Or manually create the function in Supabase Dashboard
```

### Issue: "Authentication required"

**Solution:**
1. Ensure user is logged in
2. Check authentication tokens in browser DevTools
3. Verify Supabase credentials in `.env.local`

### Issue: Schema not loading

**Solution:**
1. Check browser console for errors
2. Verify API route `/api/database/schema` is working
3. Test the route directly: `http://localhost:3000/api/database/schema`
4. Check Supabase RLS policies

### Issue: Monaco Editor not loading

**Solution:**
1. Clear browser cache
2. Check for JavaScript errors in console
3. Verify `@monaco-editor/react` is installed:
   ```bash
   npm list @monaco-editor/react
   ```
4. Restart dev server

### Issue: Charts not displaying

**Solution:**
1. Verify query returns numeric data
2. Check browser console for Chart.js errors
3. Ensure `chart.js` and `react-chartjs-2` are installed
4. Try a simple query with numbers: `SELECT 1 as value, 2 as value2;`

## Performance Optimization

### For Large Databases

1. **Add Indexes**: Ensure frequently queried columns have indexes
2. **Use LIMIT**: Always use LIMIT for exploratory queries
3. **Pagination**: Use OFFSET and LIMIT for large result sets
4. **Materialized Views**: Create materialized views for complex queries

### Example:

```sql
-- Add index
CREATE INDEX idx_users_email ON users(email);

-- Use LIMIT
SELECT * FROM large_table LIMIT 100;

-- Pagination
SELECT * FROM large_table
ORDER BY id
LIMIT 50 OFFSET 100;
```

## Next Steps

1. ✅ Set up authentication restrictions
2. ✅ Test all features thoroughly
3. ✅ Configure RLS policies
4. ✅ Add monitoring/logging
5. ✅ Create user documentation
6. ✅ Set up backups

## Features Checklist

After setup, verify these features work:

- [ ] SQL syntax highlighting
- [ ] Auto-complete for tables and columns
- [ ] Query execution
- [ ] Multi-tab editor
- [ ] Query formatting (Cmd+Shift+F)
- [ ] Read-only mode
- [ ] Dangerous operation warnings
- [ ] Schema explorer with all tables
- [ ] Table structure view
- [ ] Quick actions (SELECT *, DESCRIBE)
- [ ] Results in table view
- [ ] Results in JSON view
- [ ] Results in chart view
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Export to SQL
- [ ] Query history
- [ ] Saved queries
- [ ] Query templates
- [ ] Visual query builder
- [ ] JOIN builder
- [ ] WHERE conditions builder
- [ ] Search in results
- [ ] Pagination
- [ ] Sorting

## Support Resources

- **Documentation**: `/docs/SQL_EDITOR.md`
- **Supabase Docs**: https://supabase.com/docs
- **Monaco Editor Docs**: https://microsoft.github.io/monaco-editor/
- **Chart.js Docs**: https://www.chartjs.org/docs/

## Success!

If you can see your database schema, run queries, and see results, you're all set! 🎉

The SQL Editor is now ready for use. Remember to:
- Restrict access to authorized users only
- Monitor query performance
- Keep backups of your database
- Review query history regularly

Happy querying! 🚀
