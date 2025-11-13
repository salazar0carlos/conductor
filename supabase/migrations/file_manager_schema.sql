-- File Manager Database Schema

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'video', 'audio', 'pdf', 'document', 'code', 'archive', 'other'
  size BIGINT NOT NULL,
  path TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  user_id UUID NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  share_url TEXT,
  share_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_count INTEGER DEFAULT 0,
  folder_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_versions table
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  notes TEXT
);

-- Create file_comments table
CREATE TABLE IF NOT EXISTS file_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_activities table
CREATE TABLE IF NOT EXISTS file_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL, -- 'created', 'updated', 'moved', 'renamed', 'shared', 'downloaded', 'deleted', 'restored'
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_collections table
CREATE TABLE IF NOT EXISTS asset_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'colors', 'icons', 'images', 'fonts', 'logos', 'brand'
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_items table
CREATE TABLE IF NOT EXISTS asset_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES asset_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  preview_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_is_favorite ON files(is_favorite);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_file_activities_file_id ON file_activities(file_id);
CREATE INDEX IF NOT EXISTS idx_file_activities_user_id ON file_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_file_comments_file_id ON file_comments(file_id);

CREATE INDEX IF NOT EXISTS idx_asset_collections_user_id ON asset_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_items_collection_id ON asset_items(collection_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_comments_updated_at
  BEFORE UPDATE ON file_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_collections_updated_at
  BEFORE UPDATE ON asset_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update folder stats
CREATE OR REPLACE FUNCTION update_folder_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE folders
    SET
      file_count = (SELECT COUNT(*) FROM files WHERE folder_id = NEW.folder_id),
      total_size = (SELECT COALESCE(SUM(size), 0) FROM files WHERE folder_id = NEW.folder_id)
    WHERE id = NEW.folder_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE folders
    SET
      file_count = (SELECT COUNT(*) FROM files WHERE folder_id = OLD.folder_id),
      total_size = (SELECT COALESCE(SUM(size), 0) FROM files WHERE folder_id = OLD.folder_id)
    WHERE id = OLD.folder_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update old folder
    UPDATE folders
    SET
      file_count = (SELECT COUNT(*) FROM files WHERE folder_id = OLD.folder_id),
      total_size = (SELECT COALESCE(SUM(size), 0) FROM files WHERE folder_id = OLD.folder_id)
    WHERE id = OLD.folder_id;

    -- Update new folder
    UPDATE folders
    SET
      file_count = (SELECT COUNT(*) FROM files WHERE folder_id = NEW.folder_id),
      total_size = (SELECT COALESCE(SUM(size), 0) FROM files WHERE folder_id = NEW.folder_id)
    WHERE id = NEW.folder_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for folder stats
CREATE TRIGGER update_folder_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_stats();

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for files
CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create RLS policies for folders
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create RLS policies for file_activities
CREATE POLICY "Users can view activities for their files"
  ON file_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_activities.file_id
      AND files.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert activities for their files"
  ON file_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_activities.file_id
      AND files.user_id::text = auth.uid()::text
    )
  );

-- Create RLS policies for asset_collections
CREATE POLICY "Users can manage their own asset collections"
  ON asset_collections FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Create RLS policies for asset_items
CREATE POLICY "Users can manage items in their collections"
  ON asset_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM asset_collections
      WHERE asset_collections.id = asset_items.collection_id
      AND asset_collections.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM asset_collections
      WHERE asset_collections.id = asset_items.collection_id
      AND asset_collections.user_id::text = auth.uid()::text
    )
  );

-- Grant permissions
GRANT ALL ON files TO authenticated;
GRANT ALL ON folders TO authenticated;
GRANT ALL ON file_versions TO authenticated;
GRANT ALL ON file_comments TO authenticated;
GRANT ALL ON file_activities TO authenticated;
GRANT ALL ON asset_collections TO authenticated;
GRANT ALL ON asset_items TO authenticated;
