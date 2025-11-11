-- Add Supabase integration columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_project_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_project_ref TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_region TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_endpoint TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_db_password TEXT; -- Encrypted storage recommended
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_migrations_applied BOOLEAN DEFAULT FALSE;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_projects_supabase_project_ref ON projects(supabase_project_ref);
