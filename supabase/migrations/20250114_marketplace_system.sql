-- Template Marketplace System
-- Comprehensive marketplace for templates, reviews, and community features

-- Template Categories table
CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates table
CREATE TABLE marketplace_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  long_description TEXT,
  category_id UUID NOT NULL REFERENCES template_categories(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('workflow', 'task', 'agent', 'project', 'design', 'integration')),

  -- Author information
  author_id TEXT NOT NULL, -- User ID from auth
  author_name TEXT NOT NULL,
  author_avatar TEXT,

  -- Pricing
  pricing_type TEXT NOT NULL DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid', 'freemium')),
  price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Visibility
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'team', 'unlisted')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'rejected')),

  -- Media
  thumbnail_url TEXT,
  screenshots JSONB DEFAULT '[]', -- Array of image URLs
  video_url TEXT, -- YouTube/Vimeo embed
  demo_url TEXT, -- Live demo URL

  -- Metadata
  template_data JSONB NOT NULL, -- The actual template configuration
  version TEXT NOT NULL DEFAULT '1.0.0',
  version_history JSONB DEFAULT '[]',

  -- Features and requirements
  features JSONB DEFAULT '[]', -- Array of feature strings
  requirements JSONB DEFAULT '{}', -- Dependencies, versions, etc.
  tags TEXT[] DEFAULT '{}',

  -- Installation
  installation_instructions TEXT,
  config_schema JSONB, -- JSON Schema for configuration wizard

  -- License
  license TEXT DEFAULT 'MIT',
  license_url TEXT,

  -- Stats
  install_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],

  -- Flags
  is_featured BOOLEAN DEFAULT FALSE,
  is_staff_pick BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Template Reviews table
CREATE TABLE template_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- User ID from auth
  user_name TEXT NOT NULL,
  user_avatar TEXT,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,

  -- Helpfulness voting
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'flagged', 'removed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template Installations table
CREATE TABLE template_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- User ID from auth

  -- Installation details
  installed_version TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),

  -- Entity references (what was created from this template)
  entity_type TEXT, -- workflow, task, agent, etc.
  entity_id UUID,

  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  uninstalled_at TIMESTAMPTZ
);

-- Template Collections (curated groups)
CREATE TABLE template_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,

  -- Curation
  curator_id TEXT NOT NULL,
  curator_name TEXT NOT NULL,
  is_official BOOLEAN DEFAULT FALSE,

  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collection Items (templates in collections)
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES template_collections(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, template_id)
);

-- Template Favorites
CREATE TABLE template_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Review Votes (helpful/not helpful)
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES template_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Template Reports (for flagging inappropriate content)
CREATE TABLE template_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  review_id UUID REFERENCES template_reviews(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'copyright', 'broken', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CHECK (template_id IS NOT NULL OR review_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_marketplace_templates_category ON marketplace_templates(category_id);
CREATE INDEX idx_marketplace_templates_author ON marketplace_templates(author_id);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status);
CREATE INDEX idx_marketplace_templates_visibility ON marketplace_templates(visibility);
CREATE INDEX idx_marketplace_templates_type ON marketplace_templates(type);
CREATE INDEX idx_marketplace_templates_pricing ON marketplace_templates(pricing_type);
CREATE INDEX idx_marketplace_templates_featured ON marketplace_templates(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_marketplace_templates_trending ON marketplace_templates(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_marketplace_templates_rating ON marketplace_templates(average_rating DESC);
CREATE INDEX idx_marketplace_templates_installs ON marketplace_templates(install_count DESC);
CREATE INDEX idx_marketplace_templates_created ON marketplace_templates(created_at DESC);
CREATE INDEX idx_marketplace_templates_published ON marketplace_templates(published_at DESC) WHERE published_at IS NOT NULL;

CREATE INDEX idx_template_reviews_template ON template_reviews(template_id);
CREATE INDEX idx_template_reviews_user ON template_reviews(user_id);
CREATE INDEX idx_template_reviews_rating ON template_reviews(rating);
CREATE INDEX idx_template_reviews_status ON template_reviews(status);
CREATE INDEX idx_template_reviews_created ON template_reviews(created_at DESC);

CREATE INDEX idx_template_installations_template ON template_installations(template_id);
CREATE INDEX idx_template_installations_user ON template_installations(user_id);
CREATE INDEX idx_template_installations_status ON template_installations(status);
CREATE INDEX idx_template_installations_installed ON template_installations(installed_at DESC);

CREATE INDEX idx_template_favorites_template ON template_favorites(template_id);
CREATE INDEX idx_template_favorites_user ON template_favorites(user_id);

CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_template ON collection_items(template_id);

-- Full text search
CREATE INDEX idx_marketplace_templates_search ON marketplace_templates
  USING gin(to_tsvector('english', name || ' ' || description || ' ' || COALESCE(long_description, '')));

-- Triggers for updated_at
CREATE TRIGGER update_marketplace_templates_updated_at
  BEFORE UPDATE ON marketplace_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_reviews_updated_at
  BEFORE UPDATE ON template_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_collections_updated_at
  BEFORE UPDATE ON template_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update template stats after review
CREATE OR REPLACE FUNCTION update_template_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_templates
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
      FROM template_reviews
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        AND status = 'published'
    ),
    review_count = (
      SELECT COUNT(*)
      FROM template_reviews
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        AND status = 'published'
    )
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review_insert
  AFTER INSERT ON template_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_template_rating_stats();

CREATE TRIGGER update_rating_after_review_update
  AFTER UPDATE ON template_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_template_rating_stats();

CREATE TRIGGER update_rating_after_review_delete
  AFTER DELETE ON template_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_template_rating_stats();

-- Function to update favorite count
CREATE OR REPLACE FUNCTION update_template_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_templates
  SET favorite_count = (
    SELECT COUNT(*)
    FROM template_favorites
    WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
  )
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorite_count_insert
  AFTER INSERT ON template_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_template_favorite_count();

CREATE TRIGGER update_favorite_count_delete
  AFTER DELETE ON template_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_template_favorite_count();

-- Function to update review vote counts
CREATE OR REPLACE FUNCTION update_review_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE template_reviews
  SET
    helpful_count = (
      SELECT COUNT(*)
      FROM review_votes
      WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
        AND vote_type = 'helpful'
    ),
    not_helpful_count = (
      SELECT COUNT(*)
      FROM review_votes
      WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
        AND vote_type = 'not_helpful'
    )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_counts_insert
  AFTER INSERT ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_vote_counts();

CREATE TRIGGER update_vote_counts_update
  AFTER UPDATE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_vote_counts();

CREATE TRIGGER update_vote_counts_delete
  AFTER DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_vote_counts();

-- Seed default categories
INSERT INTO template_categories (name, slug, description, icon, display_order) VALUES
  ('Workflows', 'workflows', 'Pre-built automation workflows', 'Workflow', 1),
  ('Tasks', 'tasks', 'Common task configurations', 'CheckSquare', 2),
  ('Agents', 'agents', 'Agent role definitions', 'Bot', 3),
  ('Projects', 'projects', 'Complete project setups', 'FolderKanban', 4),
  ('Designs', 'designs', 'UI themes and styles', 'Palette', 5),
  ('Integrations', 'integrations', 'Common integration patterns', 'Plug', 6);
