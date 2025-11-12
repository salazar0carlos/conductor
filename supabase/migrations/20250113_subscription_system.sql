-- ============================================================================
-- Subscription & Billing System
-- Enforces project and token limits based on pricing tiers
-- ============================================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business', 'enterprise')),
  max_projects INTEGER NOT NULL,
  monthly_token_limit BIGINT NOT NULL,
  tokens_used_this_month BIGINT DEFAULT 0,
  billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_cycle_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  auto_topup_enabled BOOLEAN DEFAULT FALSE,
  spending_limit_usd DECIMAL(10, 2),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Token usage log
CREATE TABLE IF NOT EXISTS token_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd DECIMAL(10, 4) NOT NULL,
  model TEXT DEFAULT 'claude-sonnet-4',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_usage_log_user_id ON token_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_log_project_id ON token_usage_log(project_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_log_timestamp ON token_usage_log(timestamp);

-- Billing events
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'subscription_created',
    'subscription_upgraded',
    'subscription_downgraded',
    'subscription_cancelled',
    'tokens_purchased',
    'limit_reached',
    'auto_pause',
    'payment_succeeded',
    'payment_failed'
  )),
  amount_usd DECIMAL(10, 2),
  tokens_purchased BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

-- Plan templates (default limits)
CREATE TABLE IF NOT EXISTS plan_templates (
  plan TEXT PRIMARY KEY CHECK (plan IN ('free', 'pro', 'business', 'enterprise')),
  max_projects INTEGER NOT NULL,
  monthly_token_limit BIGINT NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default plans
INSERT INTO plan_templates (plan, max_projects, monthly_token_limit, price_usd, features) VALUES
  ('free', 1, 50000, 0, '["1 project", "50k tokens/month", "Community support"]'),
  ('pro', 5, 5000000, 49, '["5 projects", "5M tokens/month", "Priority support", "Advanced analytics"]'),
  ('business', 20, 30000000, 199, '["20 projects", "30M tokens/month", "Dedicated support", "Custom integrations", "Team management"]'),
  ('enterprise', 999, 999999999, 0, '["Unlimited projects", "Unlimited tokens", "24/7 support", "SLA guarantee", "Custom deployment", "White-label"]')
ON CONFLICT (plan) DO NOTHING;

-- Function: Create default subscription for new user
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    plan,
    max_projects,
    monthly_token_limit,
    billing_cycle_start,
    billing_cycle_end
  )
  SELECT
    NEW.id,
    'free',
    max_projects,
    monthly_token_limit,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month'
  FROM plan_templates
  WHERE plan = 'free';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create subscription on user signup
DROP TRIGGER IF EXISTS trigger_create_default_subscription ON auth.users;
CREATE TRIGGER trigger_create_default_subscription
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_subscription();

-- Function: Check if user can create project
CREATE OR REPLACE FUNCTION can_create_project(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_project_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current active project count
  SELECT COUNT(*)
  INTO current_project_count
  FROM projects
  WHERE user_id = p_user_id
    AND team_status NOT IN ('archived');

  -- Get max projects allowed
  SELECT max_projects
  INTO max_allowed
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active';

  IF max_allowed IS NULL THEN
    max_allowed := 1; -- Default to free tier
  END IF;

  RETURN current_project_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user has tokens available
CREATE OR REPLACE FUNCTION has_tokens_available(p_user_id UUID, p_tokens_needed INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  tokens_used BIGINT;
  token_limit BIGINT;
BEGIN
  SELECT
    tokens_used_this_month,
    monthly_token_limit
  INTO tokens_used, token_limit
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active';

  IF token_limit IS NULL THEN
    token_limit := 50000; -- Default to free tier
    tokens_used := 0;
  END IF;

  RETURN (tokens_used + p_tokens_needed) <= token_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Record token usage
CREATE OR REPLACE FUNCTION record_token_usage(
  p_user_id UUID,
  p_project_id UUID,
  p_agent_id UUID,
  p_task_id UUID,
  p_tokens INTEGER,
  p_model TEXT DEFAULT 'claude-sonnet-4'
)
RETURNS VOID AS $$
DECLARE
  cost DECIMAL(10, 4);
BEGIN
  -- Calculate cost ($3 per 1M tokens)
  cost := (p_tokens::DECIMAL / 1000000) * 3;

  -- Log usage
  INSERT INTO token_usage_log (
    user_id,
    project_id,
    agent_id,
    task_id,
    tokens_used,
    cost_usd,
    model
  ) VALUES (
    p_user_id,
    p_project_id,
    p_agent_id,
    p_task_id,
    p_tokens,
    cost,
    p_model
  );

  -- Update subscription
  UPDATE subscriptions
  SET tokens_used_this_month = tokens_used_this_month + p_tokens,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Reset monthly token usage (run on billing cycle)
CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
BEGIN
  UPDATE subscriptions
  SET tokens_used_this_month = 0,
      billing_cycle_start = billing_cycle_end,
      billing_cycle_end = billing_cycle_end + INTERVAL '1 month',
      updated_at = now()
  WHERE billing_cycle_end <= CURRENT_DATE
    AND status = 'active';

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Upgrade subscription
CREATE OR REPLACE FUNCTION upgrade_subscription(
  p_user_id UUID,
  p_new_plan TEXT,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_limits RECORD;
  result JSONB;
BEGIN
  -- Get new plan limits
  SELECT max_projects, monthly_token_limit
  INTO new_limits
  FROM plan_templates
  WHERE plan = p_new_plan;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid plan: %', p_new_plan;
  END IF;

  -- Update subscription
  UPDATE subscriptions
  SET plan = p_new_plan,
      max_projects = new_limits.max_projects,
      monthly_token_limit = new_limits.monthly_token_limit,
      stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING jsonb_build_object(
    'plan', plan,
    'max_projects', max_projects,
    'monthly_token_limit', monthly_token_limit,
    'tokens_used_this_month', tokens_used_this_month
  ) INTO result;

  -- Log billing event
  INSERT INTO billing_events (user_id, event_type, metadata)
  VALUES (p_user_id, 'subscription_upgraded', jsonb_build_object('new_plan', p_new_plan));

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Pause projects when limit reached
CREATE OR REPLACE FUNCTION auto_pause_on_limit(p_user_id UUID, p_reason TEXT)
RETURNS INTEGER AS $$
DECLARE
  paused_count INTEGER := 0;
BEGIN
  -- Pause all projects for user
  UPDATE projects
  SET team_status = 'paused'
  WHERE user_id = p_user_id
    AND team_status = 'active';

  GET DIAGNOSTICS paused_count = ROW_COUNT;

  -- Stop all agent workers
  UPDATE agents
  SET worker_status = 'stopped'
  WHERE project_id IN (
    SELECT id FROM projects WHERE user_id = p_user_id
  )
  AND worker_status IN ('active', 'idle');

  -- Log billing event
  INSERT INTO billing_events (user_id, event_type, metadata)
  VALUES (p_user_id, 'auto_pause', jsonb_build_object('reason', p_reason, 'projects_paused', paused_count));

  RETURN paused_count;
END;
$$ LANGUAGE plpgsql;

-- Views for analytics

-- User usage summary
CREATE OR REPLACE VIEW user_usage_summary AS
SELECT
  s.user_id,
  s.plan,
  s.max_projects,
  COUNT(DISTINCT p.id) as active_projects,
  s.monthly_token_limit,
  s.tokens_used_this_month,
  ROUND((s.tokens_used_this_month::DECIMAL / s.monthly_token_limit * 100), 2) as usage_percentage,
  s.billing_cycle_end,
  (s.billing_cycle_end - CURRENT_DATE) as days_until_reset
FROM subscriptions s
LEFT JOIN projects p ON p.user_id = s.user_id AND p.team_status NOT IN ('archived')
WHERE s.status = 'active'
GROUP BY s.user_id, s.plan, s.max_projects, s.monthly_token_limit, s.tokens_used_this_month, s.billing_cycle_end;

-- Daily token usage by user
CREATE OR REPLACE VIEW daily_token_usage AS
SELECT
  user_id,
  DATE(timestamp) as date,
  SUM(tokens_used) as tokens_used,
  SUM(cost_usd) as cost_usd,
  COUNT(*) as api_calls
FROM token_usage_log
GROUP BY user_id, DATE(timestamp)
ORDER BY date DESC;

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription plans and limits';
COMMENT ON TABLE token_usage_log IS 'Detailed token usage tracking for billing';
COMMENT ON TABLE billing_events IS 'Audit log of billing-related events';
COMMENT ON TABLE plan_templates IS 'Definition of available subscription plans';
COMMENT ON FUNCTION can_create_project IS 'Check if user has project slots available';
COMMENT ON FUNCTION has_tokens_available IS 'Check if user has tokens available for task execution';
COMMENT ON FUNCTION record_token_usage IS 'Record Claude API token usage for billing';
