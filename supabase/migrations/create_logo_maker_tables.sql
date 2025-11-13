-- Create table for storing generated logos
CREATE TABLE IF NOT EXISTS generated_logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_id TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  cost DECIMAL(10, 4),
  is_saved_to_brand_kit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for brand kits
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  primary_logo_id UUID REFERENCES generated_logos(id) ON DELETE SET NULL,
  color_palette JSONB DEFAULT '[]'::jsonb,
  typography_settings JSONB DEFAULT '{}'::jsonb,
  brand_guidelines TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for brand kit assets
CREATE TABLE IF NOT EXISTS brand_kit_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_kit_id UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'favicon', 'social', 'email', 'document'
  asset_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_generated_logos_user_id ON generated_logos(user_id);
CREATE INDEX idx_generated_logos_created_at ON generated_logos(created_at DESC);
CREATE INDEX idx_generated_logos_brand_kit ON generated_logos(is_saved_to_brand_kit) WHERE is_saved_to_brand_kit = true;
CREATE INDEX idx_brand_kits_user_id ON brand_kits(user_id);
CREATE INDEX idx_brand_kit_assets_brand_kit_id ON brand_kit_assets(brand_kit_id);

-- Enable Row Level Security
ALTER TABLE generated_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kit_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_logos
CREATE POLICY "Users can view their own generated logos"
  ON generated_logos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated logos"
  ON generated_logos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated logos"
  ON generated_logos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated logos"
  ON generated_logos FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for brand_kits
CREATE POLICY "Users can view their own brand kits"
  ON brand_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand kits"
  ON brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand kits"
  ON brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for brand_kit_assets
CREATE POLICY "Users can view assets from their brand kits"
  ON brand_kit_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_kits
      WHERE brand_kits.id = brand_kit_assets.brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assets to their brand kits"
  ON brand_kit_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brand_kits
      WHERE brand_kits.id = brand_kit_assets.brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assets in their brand kits"
  ON brand_kit_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brand_kits
      WHERE brand_kits.id = brand_kit_assets.brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assets from their brand kits"
  ON brand_kit_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM brand_kits
      WHERE brand_kits.id = brand_kit_assets.brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_generated_logos_updated_at
  BEFORE UPDATE ON generated_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
