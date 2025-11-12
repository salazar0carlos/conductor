-- Platform Theme System
-- Allows users to customize Conductor's appearance

-- Platform theme settings table
CREATE TABLE IF NOT EXISTS public.platform_theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.platform_theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own platform theme"
  ON public.platform_theme_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform theme"
  ON public.platform_theme_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform theme"
  ON public.platform_theme_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platform theme"
  ON public.platform_theme_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_platform_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_platform_theme_settings_updated_at
  BEFORE UPDATE ON public.platform_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_theme_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS platform_theme_settings_user_id_idx
  ON public.platform_theme_settings(user_id);
