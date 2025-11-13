-- Create a function to execute arbitrary SQL queries
-- This should be used with caution and proper authentication

-- First, create a table to store query history
CREATE TABLE IF NOT EXISTS query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  execution_time INTEGER, -- in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  row_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_executed_at ON query_history(executed_at DESC);

-- Enable RLS
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own history
CREATE POLICY "Users can view their own query history"
  ON query_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query history"
  ON query_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own query history"
  ON query_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for saved queries
CREATE TABLE IF NOT EXISTS saved_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_queries_user_id ON saved_queries(user_id);

-- Enable RLS
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for saved queries
CREATE POLICY "Users can view their own saved queries"
  ON saved_queries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved queries"
  ON saved_queries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved queries"
  ON saved_queries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved queries"
  ON saved_queries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to execute SQL queries
-- WARNING: This is a powerful function and should be protected with proper authentication
CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  row_record RECORD;
  results JSON[] := '{}';
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Execute the query and collect results
  FOR row_record IN EXECUTE query_text
  LOOP
    results := array_append(results, row_to_json(row_record));
  END LOOP;

  -- Convert array to JSON
  result := array_to_json(results);

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;

-- Create a function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT json_build_object(
    'total_tables', (
      SELECT COUNT(*)
      FROM information_schema.tables
      WHERE table_schema = 'public'
    ),
    'total_columns', (
      SELECT COUNT(*)
      FROM information_schema.columns
      WHERE table_schema = 'public'
    ),
    'database_size', (
      SELECT pg_size_pretty(pg_database_size(current_database()))
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_database_stats() TO authenticated;
