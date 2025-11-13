-- AI Providers System Migration
-- Comprehensive multi-AI provider management with usage tracking and cost analytics

-- ============================================================================
-- AI PROVIDERS TABLE
-- ============================================================================
-- Stores information about available AI providers (Anthropic, OpenAI, Google, etc.)
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'anthropic', 'openai', 'google', etc.
  display_name TEXT NOT NULL, -- 'Anthropic', 'OpenAI', 'Google Gemini'
  category TEXT NOT NULL CHECK (category IN ('text', 'image', 'audio', 'video', 'code', 'embedding')),
  logo_url TEXT,
  website_url TEXT,
  documentation_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'maintenance')),
  requires_api_key BOOLEAN NOT NULL DEFAULT true,
  supports_streaming BOOLEAN NOT NULL DEFAULT false,
  rate_limits JSONB DEFAULT '{}', -- {requests_per_minute: 60, tokens_per_minute: 10000}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AI MODELS TABLE
-- ============================================================================
-- Stores individual models for each provider
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'claude-sonnet-4-20250514', 'gpt-4o'
  display_name TEXT NOT NULL, -- 'Claude 3.5 Sonnet', 'GPT-4o'
  model_id TEXT NOT NULL, -- Actual model identifier used in API calls
  category TEXT NOT NULL CHECK (category IN ('text', 'image', 'audio', 'video', 'code', 'embedding')),
  capabilities TEXT[] NOT NULL DEFAULT '{}', -- ['chat', 'analysis', 'code_generation']
  best_for TEXT[], -- ['coding', 'analysis', 'general_tasks']
  context_window INTEGER, -- Max tokens context window
  max_output_tokens INTEGER, -- Max output tokens
  supports_vision BOOLEAN DEFAULT false,
  supports_function_calling BOOLEAN DEFAULT false,
  supports_json_mode BOOLEAN DEFAULT false,
  pricing JSONB NOT NULL DEFAULT '{}', -- {input_tokens: 0.003, output_tokens: 0.015, currency: 'USD', per_tokens: 1000}
  performance_tier TEXT CHECK (performance_tier IN ('fast', 'balanced', 'quality')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'beta', 'deprecated', 'maintenance')),
  release_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, model_id)
);

-- ============================================================================
-- AI PROVIDER CONFIGURATIONS TABLE
-- ============================================================================
-- User/project-specific provider configurations and API keys
CREATE TABLE ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- NULL for global/system config
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- NULL for user-level config
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  api_key_encrypted TEXT, -- Encrypted API key
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority = preferred for fallback
  daily_budget_usd DECIMAL(10, 2), -- Daily spending limit
  monthly_budget_usd DECIMAL(10, 2), -- Monthly spending limit
  rate_limit_override JSONB, -- Custom rate limits
  default_parameters JSONB DEFAULT '{}', -- Default temperature, max_tokens, etc.
  allowed_models UUID[], -- Specific models allowed, NULL = all
  blocked_models UUID[], -- Specific models blocked
  webhook_url TEXT, -- Webhook for usage alerts
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id, provider_id)
);

-- ============================================================================
-- AI MODEL PREFERENCES TABLE
-- ============================================================================
-- Task-to-model mapping preferences
CREATE TABLE ai_model_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- NULL for global defaults
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'code_generation', 'logo_design', 'blog_writing', etc.
  primary_model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  fallback_model_ids UUID[], -- Ordered list of fallback models
  parameters JSONB DEFAULT '{}', -- Task-specific parameters
  quality_threshold DECIMAL(3, 2), -- Min quality score (0.0-1.0)
  max_cost_per_request DECIMAL(10, 4), -- Max cost in USD
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id, task_type)
);

-- ============================================================================
-- AI USAGE LOGS TABLE
-- ============================================================================
-- Comprehensive usage tracking and cost analytics
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  task_type TEXT, -- Type of task performed
  request_id TEXT, -- External request ID from provider
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  duration_ms INTEGER, -- Request duration in milliseconds
  response_quality_score DECIMAL(3, 2), -- Quality rating (0.0-1.0)
  was_cached BOOLEAN DEFAULT false,
  was_fallback BOOLEAN DEFAULT false, -- True if fallback model was used
  error_message TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  metadata JSONB DEFAULT '{}', -- Additional context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AI PROVIDER HEALTH TABLE
-- ============================================================================
-- Track provider availability and health status
CREATE TABLE ai_provider_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  last_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time_ms INTEGER,
  error_rate DECIMAL(5, 2), -- Percentage
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id)
);

-- ============================================================================
-- AI USAGE BUDGET TABLE
-- ============================================================================
-- Track current spending against budgets
CREATE TABLE ai_usage_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE, -- NULL for all providers
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  budget_usd DECIMAL(10, 2) NOT NULL,
  spent_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  alert_threshold DECIMAL(5, 2) DEFAULT 80.0, -- Alert at 80% of budget
  is_alert_sent BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id, provider_id, period, period_start)
);

-- ============================================================================
-- AI MODEL BENCHMARKS TABLE
-- ============================================================================
-- Performance benchmarks for model comparison
CREATE TABLE ai_model_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  benchmark_type TEXT NOT NULL, -- 'code_generation', 'creative_writing', 'analysis', etc.
  metric_name TEXT NOT NULL, -- 'accuracy', 'speed', 'quality', 'cost_efficiency'
  score DECIMAL(5, 2) NOT NULL, -- 0-100 scale
  sample_size INTEGER NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_ai_providers_status ON ai_providers(status);
CREATE INDEX idx_ai_providers_category ON ai_providers(category);

CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX idx_ai_models_category ON ai_models(category);
CREATE INDEX idx_ai_models_status ON ai_models(status);
CREATE INDEX idx_ai_models_capabilities ON ai_models USING GIN(capabilities);

CREATE INDEX idx_ai_provider_configs_user_id ON ai_provider_configs(user_id);
CREATE INDEX idx_ai_provider_configs_project_id ON ai_provider_configs(project_id);
CREATE INDEX idx_ai_provider_configs_provider_id ON ai_provider_configs(provider_id);

CREATE INDEX idx_ai_model_preferences_user_id ON ai_model_preferences(user_id);
CREATE INDEX idx_ai_model_preferences_project_id ON ai_model_preferences(project_id);
CREATE INDEX idx_ai_model_preferences_task_type ON ai_model_preferences(task_type);

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_project_id ON ai_usage_logs(project_id);
CREATE INDEX idx_ai_usage_logs_provider_id ON ai_usage_logs(provider_id);
CREATE INDEX idx_ai_usage_logs_model_id ON ai_usage_logs(model_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_status ON ai_usage_logs(status);
CREATE INDEX idx_ai_usage_logs_task_type ON ai_usage_logs(task_type);

CREATE INDEX idx_ai_provider_health_provider_id ON ai_provider_health(provider_id);
CREATE INDEX idx_ai_provider_health_is_available ON ai_provider_health(is_available);

CREATE INDEX idx_ai_usage_budgets_user_id ON ai_usage_budgets(user_id);
CREATE INDEX idx_ai_usage_budgets_project_id ON ai_usage_budgets(project_id);
CREATE INDEX idx_ai_usage_budgets_provider_id ON ai_usage_budgets(provider_id);
CREATE INDEX idx_ai_usage_budgets_period_start ON ai_usage_budgets(period_start);

CREATE INDEX idx_ai_model_benchmarks_model_id ON ai_model_benchmarks(model_id);
CREATE INDEX idx_ai_model_benchmarks_benchmark_type ON ai_model_benchmarks(benchmark_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_configs_updated_at BEFORE UPDATE ON ai_provider_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_preferences_updated_at BEFORE UPDATE ON ai_model_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_health_updated_at BEFORE UPDATE ON ai_provider_health
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_budgets_updated_at BEFORE UPDATE ON ai_usage_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now, can be restricted based on auth)
CREATE POLICY "Enable read access for all users" ON ai_providers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for admins" ON ai_providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for admins" ON ai_providers FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON ai_models FOR SELECT USING (true);
CREATE POLICY "Enable insert access for admins" ON ai_models FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for admins" ON ai_models FOR UPDATE USING (true);

CREATE POLICY "Enable all access" ON ai_provider_configs FOR ALL USING (true);
CREATE POLICY "Enable all access" ON ai_model_preferences FOR ALL USING (true);
CREATE POLICY "Enable all access" ON ai_usage_logs FOR ALL USING (true);
CREATE POLICY "Enable all access" ON ai_provider_health FOR ALL USING (true);
CREATE POLICY "Enable all access" ON ai_usage_budgets FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON ai_model_benchmarks FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert AI Providers
INSERT INTO ai_providers (name, display_name, category, website_url, documentation_url, supports_streaming) VALUES
  ('anthropic', 'Anthropic', 'text', 'https://anthropic.com', 'https://docs.anthropic.com', true),
  ('openai', 'OpenAI', 'text', 'https://openai.com', 'https://platform.openai.com/docs', true),
  ('google', 'Google AI', 'text', 'https://ai.google.dev', 'https://ai.google.dev/docs', true),
  ('mistral', 'Mistral AI', 'text', 'https://mistral.ai', 'https://docs.mistral.ai', true),
  ('perplexity', 'Perplexity', 'text', 'https://perplexity.ai', 'https://docs.perplexity.ai', false),
  ('cohere', 'Cohere', 'text', 'https://cohere.com', 'https://docs.cohere.com', true),
  ('openai-dalle', 'DALL-E', 'image', 'https://openai.com', 'https://platform.openai.com/docs/guides/images', false),
  ('midjourney', 'Midjourney', 'image', 'https://midjourney.com', 'https://docs.midjourney.com', false),
  ('stable-diffusion', 'Stable Diffusion', 'image', 'https://stability.ai', 'https://platform.stability.ai/docs', false),
  ('ideogram', 'Ideogram', 'image', 'https://ideogram.ai', 'https://ideogram.ai/api/docs', false),
  ('leonardo', 'Leonardo.ai', 'image', 'https://leonardo.ai', 'https://docs.leonardo.ai', false),
  ('flux', 'Flux', 'image', 'https://blackforestlabs.ai', 'https://docs.bfl.ml', false),
  ('elevenlabs', 'ElevenLabs', 'audio', 'https://elevenlabs.io', 'https://docs.elevenlabs.io', true),
  ('openai-tts', 'OpenAI TTS', 'audio', 'https://openai.com', 'https://platform.openai.com/docs/guides/text-to-speech', false),
  ('playht', 'PlayHT', 'audio', 'https://play.ht', 'https://docs.play.ht', false),
  ('openai-whisper', 'Whisper', 'audio', 'https://openai.com', 'https://platform.openai.com/docs/guides/speech-to-text', false);

-- Insert AI Models for Text Generation
INSERT INTO ai_models (provider_id, name, display_name, model_id, category, capabilities, best_for, context_window, max_output_tokens, supports_vision, supports_function_calling, supports_json_mode, pricing, performance_tier, status) VALUES
  -- Anthropic Models
  ((SELECT id FROM ai_providers WHERE name = 'anthropic'), 'claude-sonnet-4', 'Claude 3.5 Sonnet', 'claude-sonnet-4-20250514', 'text',
   ARRAY['chat', 'analysis', 'code_generation', 'vision'], ARRAY['coding', 'analysis', 'complex_reasoning'],
   200000, 8192, true, true, true,
   '{"input_tokens": 3, "output_tokens": 15, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'quality', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'anthropic'), 'claude-opus', 'Claude 3 Opus', 'claude-3-opus-20240229', 'text',
   ARRAY['chat', 'analysis', 'writing'], ARRAY['creative_writing', 'research', 'complex_tasks'],
   200000, 4096, true, true, false,
   '{"input_tokens": 15, "output_tokens": 75, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'quality', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'anthropic'), 'claude-haiku', 'Claude 3.5 Haiku', 'claude-3-5-haiku-20241022', 'text',
   ARRAY['chat', 'simple_tasks'], ARRAY['quick_responses', 'simple_queries'],
   200000, 8192, true, true, false,
   '{"input_tokens": 0.8, "output_tokens": 4, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'fast', 'active'),

  -- OpenAI Models
  ((SELECT id FROM ai_providers WHERE name = 'openai'), 'gpt-4o', 'GPT-4o', 'gpt-4o', 'text',
   ARRAY['chat', 'analysis', 'code_generation', 'vision'], ARRAY['general_tasks', 'multimodal', 'coding'],
   128000, 16384, true, true, true,
   '{"input_tokens": 2.5, "output_tokens": 10, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'balanced', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'openai'), 'gpt-4-turbo', 'GPT-4 Turbo', 'gpt-4-turbo', 'text',
   ARRAY['chat', 'analysis', 'code_generation'], ARRAY['complex_tasks', 'coding'],
   128000, 4096, false, true, true,
   '{"input_tokens": 10, "output_tokens": 30, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'quality', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'openai'), 'o1', 'GPT-o1', 'o1', 'text',
   ARRAY['reasoning', 'problem_solving'], ARRAY['complex_reasoning', 'math', 'science'],
   200000, 100000, false, false, false,
   '{"input_tokens": 15, "output_tokens": 60, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'quality', 'active'),

  -- Google Models
  ((SELECT id FROM ai_providers WHERE name = 'google'), 'gemini-pro', 'Gemini 1.5 Pro', 'gemini-1.5-pro', 'text',
   ARRAY['chat', 'analysis', 'vision'], ARRAY['multimodal', 'long_context'],
   2000000, 8192, true, true, true,
   '{"input_tokens": 1.25, "output_tokens": 5, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'balanced', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'google'), 'gemini-flash', 'Gemini 1.5 Flash', 'gemini-1.5-flash', 'text',
   ARRAY['chat', 'simple_tasks'], ARRAY['fast_responses', 'high_frequency'],
   1000000, 8192, true, true, true,
   '{"input_tokens": 0.075, "output_tokens": 0.3, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'fast', 'active'),

  -- Mistral Models
  ((SELECT id FROM ai_providers WHERE name = 'mistral'), 'mistral-large', 'Mistral Large', 'mistral-large-latest', 'text',
   ARRAY['chat', 'analysis', 'code_generation'], ARRAY['fast_responses', 'coding'],
   128000, 4096, false, true, true,
   '{"input_tokens": 2, "output_tokens": 6, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'balanced', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'mistral'), 'codestral', 'Codestral', 'codestral-latest', 'code',
   ARRAY['code_generation', 'code_completion'], ARRAY['coding', 'autocomplete'],
   32000, 4096, false, true, false,
   '{"input_tokens": 0.3, "output_tokens": 0.9, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'fast', 'active'),

  -- Perplexity Models
  ((SELECT id FROM ai_providers WHERE name = 'perplexity'), 'perplexity-sonar', 'Sonar', 'sonar', 'text',
   ARRAY['research', 'search'], ARRAY['research', 'citations', 'current_events'],
   127072, 4096, false, false, false,
   '{"input_tokens": 1, "output_tokens": 1, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'balanced', 'active'),

  -- Cohere Models
  ((SELECT id FROM ai_providers WHERE name = 'cohere'), 'command-r-plus', 'Command R+', 'command-r-plus', 'text',
   ARRAY['chat', 'classification'], ARRAY['embeddings', 'classification', 'retrieval'],
   128000, 4096, false, true, true,
   '{"input_tokens": 2.5, "output_tokens": 10, "currency": "USD", "per_tokens": 1000000}'::jsonb,
   'balanced', 'active');

-- Insert AI Models for Image Generation
INSERT INTO ai_models (provider_id, name, display_name, model_id, category, capabilities, best_for, pricing, performance_tier, status) VALUES
  ((SELECT id FROM ai_providers WHERE name = 'openai-dalle'), 'dalle-3', 'DALL-E 3', 'dall-e-3', 'image',
   ARRAY['image_generation'], ARRAY['photorealistic', 'detailed_images'],
   '{"cost_per_image": 40, "currency": "USD", "per_tokens": 1000}'::jsonb,
   'quality', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'stable-diffusion'), 'sdxl', 'Stable Diffusion XL', 'stable-diffusion-xl-1024-v1-0', 'image',
   ARRAY['image_generation', 'image_editing'], ARRAY['fine_control', 'open_source'],
   '{"cost_per_image": 10, "currency": "USD", "per_tokens": 1000}'::jsonb,
   'balanced', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'ideogram'), 'ideogram-v2', 'Ideogram V2', 'ideogram-v2', 'image',
   ARRAY['image_generation'], ARRAY['text_in_images', 'typography'],
   '{"cost_per_image": 8, "currency": "USD", "per_tokens": 1000}'::jsonb,
   'balanced', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'flux'), 'flux-pro', 'Flux Pro', 'flux-pro', 'image',
   ARRAY['image_generation'], ARRAY['highest_quality', 'latest'],
   '{"cost_per_image": 50, "currency": "USD", "per_tokens": 1000}'::jsonb,
   'quality', 'active');

-- Insert AI Models for Audio
INSERT INTO ai_models (provider_id, name, display_name, model_id, category, capabilities, best_for, pricing, performance_tier, status) VALUES
  ((SELECT id FROM ai_providers WHERE name = 'elevenlabs'), 'eleven-turbo-v2', 'Eleven Turbo V2', 'eleven_turbo_v2', 'audio',
   ARRAY['text_to_speech'], ARRAY['natural_voice', 'voice_cloning'],
   '{"cost_per_character": 0.3, "currency": "USD", "per_tokens": 1000}'::jsonb,
   'quality', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'openai-tts'), 'tts-1-hd', 'TTS-1-HD', 'tts-1-hd', 'audio',
   ARRAY['text_to_speech'], ARRAY['high_quality', 'multiple_voices'],
   '{"cost_per_character": 0.03, "currency": "USD", "per_tokens": 1000}'::jsonb,
   'balanced', 'active'),

  ((SELECT id FROM ai_providers WHERE name = 'openai-whisper'), 'whisper-1', 'Whisper', 'whisper-1', 'audio',
   ARRAY['speech_to_text'], ARRAY['transcription', 'translation'],
   '{"cost_per_minute": 0.006, "currency": "USD", "per_tokens": 1}'::jsonb,
   'balanced', 'active');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate AI usage cost
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_model_id UUID,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
) RETURNS DECIMAL(10, 6) AS $$
DECLARE
  v_pricing JSONB;
  v_input_cost DECIMAL(10, 6);
  v_output_cost DECIMAL(10, 6);
  v_per_tokens INTEGER;
BEGIN
  -- Get model pricing
  SELECT pricing INTO v_pricing
  FROM ai_models
  WHERE id = p_model_id;

  IF v_pricing IS NULL THEN
    RETURN 0;
  END IF;

  -- Extract pricing details
  v_per_tokens := COALESCE((v_pricing->>'per_tokens')::INTEGER, 1000000);

  -- Calculate costs
  v_input_cost := (p_input_tokens::DECIMAL / v_per_tokens) * (v_pricing->>'input_tokens')::DECIMAL;
  v_output_cost := (p_output_tokens::DECIMAL / v_per_tokens) * (v_pricing->>'output_tokens')::DECIMAL;

  RETURN v_input_cost + v_output_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to check budget before execution
CREATE OR REPLACE FUNCTION check_ai_budget(
  p_user_id UUID,
  p_project_id UUID,
  p_provider_id UUID,
  p_estimated_cost DECIMAL(10, 6)
) RETURNS BOOLEAN AS $$
DECLARE
  v_budget RECORD;
  v_remaining DECIMAL(10, 2);
BEGIN
  -- Check daily budget
  SELECT * INTO v_budget
  FROM ai_usage_budgets
  WHERE user_id = p_user_id
    AND (project_id = p_project_id OR project_id IS NULL)
    AND (provider_id = p_provider_id OR provider_id IS NULL)
    AND period = 'daily'
    AND period_start = CURRENT_DATE
    AND is_active = true
  ORDER BY provider_id NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    v_remaining := v_budget.budget_usd - v_budget.spent_usd;
    IF v_remaining < p_estimated_cost THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to update usage budget
CREATE OR REPLACE FUNCTION update_ai_usage_budget(
  p_user_id UUID,
  p_project_id UUID,
  p_provider_id UUID,
  p_cost DECIMAL(10, 6)
) RETURNS VOID AS $$
BEGIN
  -- Update daily budget
  INSERT INTO ai_usage_budgets (user_id, project_id, provider_id, period, period_start, budget_usd, spent_usd, request_count)
  VALUES (p_user_id, p_project_id, p_provider_id, 'daily', CURRENT_DATE, 1000.00, p_cost, 1)
  ON CONFLICT (user_id, project_id, provider_id, period, period_start)
  DO UPDATE SET
    spent_usd = ai_usage_budgets.spent_usd + p_cost,
    request_count = ai_usage_budgets.request_count + 1,
    updated_at = NOW();

  -- Update monthly budget
  INSERT INTO ai_usage_budgets (user_id, project_id, provider_id, period, period_start, budget_usd, spent_usd, request_count)
  VALUES (p_user_id, p_project_id, p_provider_id, 'monthly', DATE_TRUNC('month', CURRENT_DATE)::DATE, 10000.00, p_cost, 1)
  ON CONFLICT (user_id, project_id, provider_id, period, period_start)
  DO UPDATE SET
    spent_usd = ai_usage_budgets.spent_usd + p_cost,
    request_count = ai_usage_budgets.request_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE ai_providers IS 'Available AI service providers (Anthropic, OpenAI, Google, etc.)';
COMMENT ON TABLE ai_models IS 'Individual AI models available from each provider';
COMMENT ON TABLE ai_provider_configs IS 'User/project-specific provider configurations and API keys';
COMMENT ON TABLE ai_model_preferences IS 'Task-to-model mapping preferences for smart routing';
COMMENT ON TABLE ai_usage_logs IS 'Comprehensive usage tracking and cost analytics';
COMMENT ON TABLE ai_provider_health IS 'Provider availability and health monitoring';
COMMENT ON TABLE ai_usage_budgets IS 'Budget tracking and spending limits';
COMMENT ON TABLE ai_model_benchmarks IS 'Performance benchmarks for model comparison';
