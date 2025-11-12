# Conductor Pricing Model

## Philosophy

Users already expect to pay for Claude API usage since they're using Claude Code. We simply charge based on what they need: **number of projects and token usage**.

## Pricing Tiers

### 🆓 Free Tier
**Perfect for trying out Conductor**

- **1 active project** with full agent team
- **50k tokens/month** (~$0.15 worth of Claude API)
- All features included
- Community support

**Use case:** Test the platform, build a personal project

---

### 🚀 Pro Tier - $49/month
**For serious builders**

- **5 active projects** with full agent teams
- **5M tokens/month** (~$15 worth of Claude API)
- All features included
- Priority support
- Advanced analytics

**Use case:** Freelancers, small studios building multiple client apps

---

### 🏢 Business Tier - $199/month
**For agencies and teams**

- **20 active projects** with full agent teams
- **30M tokens/month** (~$90 worth of Claude API)
- All features included
- Dedicated support
- Custom integrations
- Team management

**Use case:** Agencies managing multiple client projects

---

### 🚀 Enterprise Tier - Custom Pricing
**For organizations**

- **Unlimited projects**
- **Unlimited tokens** (usage-based pricing)
- All features included
- 24/7 support
- SLA guarantee
- Custom deployment options
- White-label available

**Use case:** Large companies, platforms, agencies with many projects

---

## Token Usage Pricing

**After tier limits:**
- $3 per 1M tokens (same as Claude Sonnet 4 API pricing)
- Billed monthly
- Auto top-up available

---

## What Happens When You Hit Limits?

### Project Limit Reached:
```
You: Create new project
Conductor: "You've reached your plan limit (5/5 projects).
            Upgrade to Business tier or pause an existing project."
```

### Token Limit Reached:
```
Option 1: Auto top-up
  - Automatically buy more tokens at $3/1M
  - Set spending limit to prevent surprises

Option 2: Auto-pause
  - Agent teams pause automatically
  - Resume next month or upgrade plan
  - No work lost, just paused
```

---

## Database Schema for Pricing

```sql
-- User subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan TEXT CHECK (plan IN ('free', 'pro', 'business', 'enterprise')),
  max_projects INTEGER,
  monthly_token_limit BIGINT,
  tokens_used_this_month BIGINT DEFAULT 0,
  billing_cycle_start DATE,
  auto_topup_enabled BOOLEAN DEFAULT FALSE,
  spending_limit_usd DECIMAL(10, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Token usage tracking
CREATE TABLE token_usage_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  project_id UUID,
  agent_id UUID,
  task_id UUID,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Billing events
CREATE TABLE billing_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  event_type TEXT, -- 'subscription_created', 'tokens_purchased', 'limit_reached', 'auto_pause'
  amount_usd DECIMAL(10, 2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Enforcement Logic

### Before Creating Project:
```javascript
async function canCreateProject(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId);
  const currentProjects = await getActiveProjectCount(userId);

  if (currentProjects >= subscription.max_projects) {
    throw new Error(`Project limit reached (${subscription.max_projects}). Upgrade plan or pause a project.`);
  }

  return true;
}
```

### Before Agent Executes Task:
```javascript
async function canExecuteTask(userId: string, estimatedTokens: number): Promise<boolean> {
  const subscription = await getSubscription(userId);

  // Check if they have tokens available
  if (subscription.tokens_used_this_month + estimatedTokens > subscription.monthly_token_limit) {

    // Check auto-topup
    if (subscription.auto_topup_enabled) {
      const cost = (estimatedTokens / 1000000) * 3; // $3 per 1M tokens

      if (subscription.spending_limit_usd && cost > subscription.spending_limit_usd) {
        throw new Error('Spending limit reached. Increase limit or upgrade plan.');
      }

      // Charge and proceed
      await chargeCreditCard(userId, cost);
      return true;
    }

    // Auto-pause
    await pauseAllProjects(userId);
    throw new Error('Monthly token limit reached. Upgrade plan or enable auto top-up.');
  }

  return true;
}
```

---

## Upgrade Paths

### Free → Pro
- Instant upgrade
- Additional 4 projects unlocked
- 5M tokens/month

### Pro → Business
- Instant upgrade
- Additional 15 projects unlocked
- 30M tokens/month

### Business → Enterprise
- Contact sales
- Custom pricing based on needs
- Volume discounts available

---

## Competitive Advantage

**vs. Hiring Developers:**
- Junior dev: $50k-80k/year ($4k-7k/month)
- Conductor Pro: $49/month + token usage
- **50-100x cheaper**

**vs. Freelancers:**
- Per project: $5k-50k
- Conductor: $49/month for 5 projects
- **Work 24/7, never gets tired**

**vs. Other AI Coding Tools:**
- Cursor: $20/month (single developer tool)
- GitHub Copilot: $10/month (autocomplete only)
- Conductor: $49/month (full autonomous teams)
- **Complete agency, not just an assistant**

---

## Revenue Projections

### Scenario: 1,000 Users

**Mix:**
- 700 Free (leads, trying it out)
- 200 Pro @ $49/mo
- 80 Business @ $199/mo
- 20 Enterprise @ $500/mo avg

**Monthly Revenue:**
- Pro: 200 × $49 = $9,800
- Business: 80 × $199 = $15,920
- Enterprise: 20 × $500 = $10,000
- **Total: $35,720/month**

**Annual Revenue: $428,640**

### Scenario: 10,000 Users

**Mix:**
- 7,000 Free
- 2,000 Pro @ $49/mo
- 800 Business @ $199/mo
- 200 Enterprise @ $500/mo avg

**Monthly Revenue:**
- Pro: 2,000 × $49 = $98,000
- Business: 800 × $199 = $159,200
- Enterprise: 200 × $500 = $100,000
- **Total: $357,200/month**

**Annual Revenue: $4.3M**

---

## Implementation Priority

### Phase 1: Basic Limits (Week 1)
- [x] Track token usage per user
- [x] Track active projects per user
- [ ] Enforce project limits
- [ ] Show usage in dashboard

### Phase 2: Billing Integration (Week 2-3)
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Auto-pause on limit
- [ ] Upgrade/downgrade flows

### Phase 3: Auto Top-up (Week 4)
- [ ] Auto-purchase tokens
- [ ] Spending limits
- [ ] Usage alerts

### Phase 4: Enterprise Features (Week 5+)
- [ ] Team management
- [ ] Custom billing
- [ ] Volume discounts
- [ ] White-label options

---

## Pricing Page Copy

```markdown
# Simple, Transparent Pricing

Pay for what you need. No hidden fees.

[Free] [Pro] [Business] [Enterprise]

## FAQ

**Do I pay for Claude API separately?**
No, token usage is included in your plan limits.

**What happens if I exceed my token limit?**
You can enable auto top-up, or your agents pause until next month.

**Can I pause projects?**
Yes! Pause anytime and only active projects count toward your limit.

**Is there a free trial?**
The free tier is yours forever. No credit card required.

**Can I upgrade anytime?**
Yes! Upgrade or downgrade anytime. Pay only for what you use.
```

---

## Summary

- **Simple pricing**: Projects + tokens
- **Expected costs**: Users already budget for Claude
- **Clear limits**: No surprises
- **Auto-pause**: Fail gracefully when limits hit
- **Easy upgrades**: Grow with your needs

This model is simple, transparent, and aligns with how users already think about AI costs.
