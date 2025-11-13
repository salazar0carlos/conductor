# SQL Editor Documentation

## Overview

A production-ready, in-app SQL editor for Supabase that provides a powerful interface for querying and managing your database. This tool offers features comparable to TablePlus or DataGrip, but runs directly in your browser.

## Features

### 1. SQL Query Editor
- **Syntax Highlighting**: Full PostgreSQL syntax highlighting powered by Monaco Editor (VS Code's editor)
- **Auto-complete**: Intelligent suggestions for table names, columns, and SQL keywords
- **Multi-tab Support**: Work on multiple queries simultaneously
- **Query Formatting**: Beautify SQL with keyboard shortcut (⌘⇧F)
- **Keyboard Shortcuts**:
  - `⌘↵` (Cmd+Enter): Execute query
  - `⌘⇧F` (Cmd+Shift+F): Format SQL
- **Theme Toggle**: Switch between light and dark themes

### 2. Visual Query Builder
- **Drag-and-drop Interface**: Build queries visually without writing SQL
- **Table Selection**: Choose tables from dropdown
- **Column Selection**: Pick specific columns or use SELECT *
- **JOIN Builder**: Add INNER, LEFT, RIGHT, or FULL joins with visual interface
- **WHERE Clause Builder**: Create complex conditions with multiple operators
- **ORDER BY Controls**: Sort results by any column (ASC/DESC)
- **GROUP BY Support**: Group results by one or more columns
- **LIMIT Control**: Set result limits
- **DISTINCT Option**: Toggle DISTINCT for unique results
- **Export to SQL**: Generate SQL from visual builder and send to editor

### 3. Results View
Multiple view modes for query results:

#### Table View
- Sortable columns
- Search/filter across all data
- Pagination with adjustable page size (25, 50, 100, 500)
- NULL value highlighting
- Boolean value color coding

#### JSON View
- Pretty-printed JSON output
- Copy to clipboard
- Syntax highlighting

#### Chart View (Auto-detected)
- Automatically detects numeric columns
- Bar chart and line chart options
- Visualizes first 20 rows
- Ideal for aggregate queries

#### Export Options
- **CSV**: Standard comma-separated format
- **JSON**: Structured data export
- **SQL INSERT**: Generate INSERT statements for data migration

### 4. Database Schema Explorer
- **Tree View**: Hierarchical view of all tables
- **Table Information**:
  - Column names and data types
  - Primary keys (highlighted with key icon)
  - Foreign keys (with relationship information)
  - Indexes
  - Constraints
  - Row counts
- **Quick Actions**:
  - SELECT *: Instantly view table data
  - DESCRIBE: View table structure
- **Expandable Details**: Click to expand table and view all columns
- **Refresh**: Update schema information

### 5. Safety Features

#### Read-only Mode
- Toggle to prevent data modifications
- Only allows SELECT, EXPLAIN, SHOW, DESCRIBE queries
- Visual indicator when active

#### Dangerous Operation Confirmation
- Automatically detects: DELETE, DROP, TRUNCATE, ALTER, UPDATE
- Requires explicit confirmation before execution
- Shows operation type and full query in modal

#### Dry Run Mode (EXPLAIN)
- Preview query execution plan
- See query performance without running
- Uses PostgreSQL's EXPLAIN ANALYZE

#### Query Validation
- Syntax validation before execution
- Error messages with line numbers
- PostgreSQL-specific error handling

### 6. Query Management

#### Query History
- Automatically saves last 100 executed queries
- Shows execution status (success/failure)
- Displays execution time
- Relative timestamps ("2m ago", "1h ago")
- Search through history
- Quick actions:
  - Run again
  - Copy to clipboard
  - Delete from history
- Stored in browser localStorage

#### Saved Queries
- Save frequently used queries with names
- Add descriptions
- Organize your query library
- Quick access from sidebar
- Persistent storage

#### Query Templates
8 built-in templates for common operations:
1. **Select All**: Basic SELECT with limit
2. **Count Records**: Count table rows
3. **Find Duplicates**: Identify duplicate values
4. **Recent Records**: Get newest records
5. **Search Pattern**: Pattern matching with ILIKE
6. **Join Tables**: Basic INNER JOIN template
7. **Group & Aggregate**: Grouping with aggregations
8. **Table Info**: View table structure

### 7. Advanced Features

#### Performance Analysis
- Execution time tracking (milliseconds)
- Row count display
- EXPLAIN ANALYZE support

#### Multi-tab Interface
- Create unlimited query tabs
- Name your tabs
- Switch between queries
- Close individual tabs (minimum 1 tab)

#### Responsive Design
- Collapsible panels
- Three-panel layout:
  - Left: Schema Explorer (collapsible)
  - Center: Editor/Results
  - Right: Query History (collapsible)
- Adaptive to screen size

## Setup Instructions

### 1. Database Setup

Run the migration file to create necessary database functions and tables:

```bash
# If using Supabase CLI
supabase db push

# Or execute the SQL migration manually in Supabase dashboard
```

The migration creates:
- `execute_sql()` function for running queries
- `query_history` table for storing query history
- `saved_queries` table for saved queries
- Proper RLS policies for security

### 2. Environment Variables

Ensure your `.env.local` has Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Access the Editor

Navigate to `/database` in your application:

```
http://localhost:3000/database
```

## Security Considerations

### Important Security Notes

1. **Authentication Required**: All queries require user authentication
2. **RLS Enabled**: Row-level security protects query history and saved queries
3. **SECURITY DEFINER**: The `execute_sql` function runs with elevated privileges
4. **Use with Caution**: This tool allows arbitrary SQL execution

### Recommended Security Measures

1. **Restrict Access**: Only give access to trusted users/admins
2. **Audit Trail**: Query history tracks all executed queries
3. **Confirmation Prompts**: Dangerous operations require confirmation
4. **Read-only Mode**: Encourage use of read-only mode for data exploration
5. **Role-Based Access**: Consider adding role checks to API routes

### Example: Adding Role Check

```typescript
// In /app/api/database/query/route.ts
const { data: { user } } = await supabase.auth.getUser();

// Check if user has admin role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

## Usage Examples

### Basic Queries

```sql
-- Select all from a table
SELECT * FROM users LIMIT 100;

-- Filter with WHERE clause
SELECT * FROM orders
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days';

-- Join tables
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2024-01-01';
```

### Aggregations

```sql
-- Count by category
SELECT category, COUNT(*) as count
FROM products
GROUP BY category
ORDER BY count DESC;

-- Calculate statistics
SELECT
  AVG(amount) as avg_amount,
  MAX(amount) as max_amount,
  MIN(amount) as min_amount
FROM transactions
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Schema Exploration

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- View table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;

-- Find foreign keys
SELECT
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'your_table';
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘↵` (Cmd+Enter) | Execute current query |
| `⌘⇧F` (Cmd+Shift+F) | Format SQL |
| `⌘C` (Cmd+C) | Copy selected text |
| `⌘V` (Cmd+V) | Paste |
| `⌘Z` (Cmd+Z) | Undo |
| `⌘⇧Z` (Cmd+Shift+Z) | Redo |
| `⌘F` (Cmd+F) | Find in editor |
| `⌘/` (Cmd+/) | Toggle comment |

## Troubleshooting

### "Authentication required" error
- Ensure user is logged in
- Check Supabase credentials in `.env.local`
- Verify auth tokens are valid

### "execute_sql function does not exist"
- Run the migration file
- Check Supabase dashboard for function
- Verify function has correct permissions

### Auto-complete not working
- Wait for schema to load (check left panel)
- Try refreshing the page
- Verify tables are visible in Schema Explorer

### Query timing out
- Check query complexity
- Add LIMIT clause to large result sets
- Use indexes on filtered columns
- Consider using EXPLAIN to analyze query plan

### Cannot modify data (Read-only mode)
- Check if "Read-only mode" toggle is enabled
- Disable it to allow UPDATE/DELETE/INSERT queries

## API Endpoints

### Execute Query
```typescript
POST /api/database/query
Body: {
  query: string;
  readOnly?: boolean;
  dryRun?: boolean;
  confirmed?: boolean;
}
```

### Get Schema
```typescript
GET /api/database/schema
Query params:
  - table?: string (optional, get specific table details)
```

### Get Query History
```typescript
GET /api/database/query
Query params:
  - limit?: number (default: 50)
  - search?: string
```

## Technology Stack

- **Monaco Editor**: VS Code's editor for SQL editing
- **React**: Component framework
- **Next.js**: Full-stack framework
- **Supabase**: PostgreSQL database and authentication
- **SQL Formatter**: Query beautification
- **Chart.js**: Data visualization
- **PapaParse**: CSV export
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## Future Enhancements

Potential features for future development:

1. **Collaborative Editing**: Share queries with team members
2. **Query Scheduling**: Schedule queries to run automatically
3. **Result Caching**: Cache frequent query results
4. **Table Editor**: Edit data directly in results table
5. **Database Migrations**: Create and manage migrations
6. **Backup/Restore**: Database backup functionality
7. **Import Data**: Import CSV/JSON into tables
8. **AI Assistant**: Natural language to SQL conversion
9. **Performance Monitoring**: Track slow queries
10. **Query Versioning**: Version control for saved queries

## Support

For issues or feature requests, please check:
1. This documentation
2. Project repository issues
3. Supabase documentation: https://supabase.com/docs

## License

This SQL Editor is part of the Conductor project. See main project LICENSE for details.
