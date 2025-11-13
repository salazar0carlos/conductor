# SQL Editor - Quick Reference Card

## Access
```
http://localhost:3000/database
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘↵` | Execute query |
| `⌘⇧F` | Format SQL |
| `⌘C` | Copy |
| `⌘V` | Paste |
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |
| `⌘F` | Find |
| `⌘/` | Comment/Uncomment |

## Quick Actions

### Schema Explorer (Left Panel)
- **Click table** - View columns
- **SELECT * button** - Quick select all
- **Info button** - Table structure
- **Refresh** - Reload schema

### SQL Editor (Center)
- **Run** - Execute query (⌘↵)
- **Explain** - Show execution plan
- **Format** - Beautify SQL
- **Copy** - Copy query
- **Read-only toggle** - Safe mode
- **New Tab** - Add query tab

### Results (Bottom)
- **Table** - Grid view with sort/filter
- **JSON** - Raw JSON output
- **Chart** - Data visualization
- **Export** - CSV/JSON/SQL
- **Search** - Filter results
- **Pagination** - Change page size

### Query History (Right Panel)
- **History** - Recent queries
- **Saved** - Your saved queries
- **Templates** - Built-in patterns

## Common SQL Patterns

### Basic Queries
```sql
-- Select all
SELECT * FROM table_name LIMIT 100;

-- With condition
SELECT * FROM users WHERE active = true;

-- Order results
SELECT * FROM posts ORDER BY created_at DESC;
```

### Joins
```sql
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```

### Aggregations
```sql
SELECT category, COUNT(*) as count
FROM products
GROUP BY category
ORDER BY count DESC;
```

### Search
```sql
SELECT * FROM users
WHERE email ILIKE '%@gmail.com%';
```

## Visual Query Builder

1. **Select Table** - Choose from dropdown
2. **Pick Columns** - Check columns to include
3. **Add JOINs** - Click "Add JOIN"
4. **Add Filters** - Click "Add Condition"
5. **Sort** - Click "Add Sort"
6. **Export** - Click "Export to SQL"

## Export Options

### CSV Export
- Click Export > Export as CSV
- Opens in Excel/Sheets

### JSON Export
- Click Export > Export as JSON
- For API integration

### SQL Export
- Click Export > Export as SQL
- Generates INSERT statements

## Safety Features

### Read-only Mode
- Toggle in top bar
- Only allows SELECT queries
- No data modifications

### Dangerous Operations
Requires confirmation:
- DELETE
- DROP
- TRUNCATE
- ALTER
- UPDATE

### Dry Run
- Click "Explain" button
- Shows execution plan
- Doesn't execute query

## Tips & Tricks

1. **Start with Templates**
   - Check "Templates" tab
   - 8 common patterns included

2. **Use LIMIT**
   - Always use LIMIT for large tables
   - Default: LIMIT 100

3. **Format Before Saving**
   - Press ⌘⇧F to beautify
   - Easier to read and maintain

4. **Save Frequent Queries**
   - Give them clear names
   - Add descriptions

5. **Explore Schema First**
   - Check table structure
   - See relationships
   - Understand data types

6. **Use Auto-complete**
   - Press Ctrl+Space
   - Shows tables and columns
   - SQL keywords included

7. **Check Execution Time**
   - Displayed in results
   - Optimize slow queries

8. **Multi-tab Workflow**
   - Keep multiple queries open
   - Compare results
   - Test variations

## Common Tasks

### View Table Structure
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'your_table';
```

### Count Records
```sql
SELECT COUNT(*) FROM table_name;
```

### Find Duplicates
```sql
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

### Recent Records
```sql
SELECT * FROM table_name
ORDER BY created_at DESC
LIMIT 50;
```

### Search Text
```sql
SELECT * FROM table_name
WHERE column_name ILIKE '%search%';
```

## Troubleshooting

### Query Not Running
- Check authentication
- Verify syntax
- Look for error message

### Schema Not Loading
- Click refresh button
- Check browser console
- Verify database connection

### Slow Query
- Add LIMIT clause
- Check for indexes
- Use EXPLAIN to analyze

### Auto-complete Not Working
- Wait for schema to load
- Refresh page
- Check left panel for tables

## File Locations

```
app/database/page.tsx              - Main page
components/database/sql-editor.tsx - SQL editor
components/database/schema-explorer.tsx - Schema tree
components/database/results-table.tsx - Results display
components/database/query-builder.tsx - Visual builder
components/database/query-history.tsx - History & saved
```

## API Endpoints

```
POST /api/database/query   - Execute query
GET  /api/database/query   - Get history
GET  /api/database/schema  - Get schema
```

## Built-in Templates

1. Select All - Basic query
2. Count Records - Row count
3. Find Duplicates - Duplicate detection
4. Recent Records - Latest entries
5. Search Pattern - Text search
6. Join Tables - Basic join
7. Group & Aggregate - Aggregations
8. Table Info - Schema info

## View Modes

### Table View
- Best for: Data browsing
- Features: Sort, filter, search
- Pagination: 25/50/100/500 rows

### JSON View
- Best for: API data, nested objects
- Features: Pretty-print, copy
- Raw JSON output

### Chart View
- Best for: Numeric data, trends
- Features: Bar/Line charts
- Auto-detects numeric columns

## Quick Setup

```bash
# 1. Run migration
supabase db push

# 2. Start server
npm run dev

# 3. Access editor
open http://localhost:3000/database
```

## Security Checklist

- [ ] Migration applied
- [ ] Authentication working
- [ ] RLS policies active
- [ ] Admin access only
- [ ] Read-only for explorers
- [ ] Query history tracking

## Performance Tips

1. Always use LIMIT
2. Add indexes for filters
3. Use WHERE conditions
4. Avoid SELECT *
5. Check execution time
6. Use EXPLAIN for slow queries

## Support

- Documentation: `/docs/SQL_EDITOR.md`
- Setup Guide: `/docs/SQL_EDITOR_SETUP.md`
- Supabase Docs: https://supabase.com/docs

---

**Happy Querying!** 🚀

For full documentation, see `/docs/SQL_EDITOR.md`
