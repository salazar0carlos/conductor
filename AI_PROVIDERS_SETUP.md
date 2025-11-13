# Multi-AI Provider System - Setup Guide

A comprehensive AI orchestration platform that lets you choose different AI models for different tasks with smart routing, cost control, and usage analytics.

## Features

### AI Provider Registry
- **Text Generation**: Anthropic Claude, OpenAI GPT, Google Gemini, Mistral, Perplexity, Cohere
- **Image Generation**: DALL-E 3, Midjourney, Stable Diffusion XL, Ideogram, Leonardo.ai, Flux
- **Code Generation**: Claude 3.5 Sonnet, GPT-4o, Codestral, CodeLlama
- **Voice & Audio**: ElevenLabs, OpenAI TTS, PlayHT, Whisper

### Core Features
1. **Smart Model Router** - Automatic model selection with fallback chains
2. **Usage Analytics** - Real-time cost tracking and performance monitoring
3. **Budget Control** - Daily/monthly spending limits per provider
4. **Health Monitoring** - Automatic provider health checks
5. **AI Playground** - Test and compare models side-by-side
6. **Provider Management** - Configure API keys and settings per provider

## Installation

### 1. Database Migration

Run the AI providers migration:

```bash
# Apply the migration to your Supabase database
psql $DATABASE_URL -f supabase/migrations/20250115_ai_providers_system.sql
```

This creates:
- `ai_providers` - Provider information
- `ai_models` - Model details and pricing
- `ai_provider_configs` - API keys and settings
- `ai_model_preferences` - Task-to-model mappings
- `ai_usage_logs` - Usage tracking
- `ai_provider_health` - Health monitoring
- `ai_usage_budgets` - Budget tracking
- `ai_model_benchmarks` - Performance comparisons

### 2. Install Dependencies

```bash
# Install OpenAI SDK (optional, loaded dynamically)
npm install openai

# Anthropic SDK is already installed
```

### 3. Environment Variables

Add to your `.env.local`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Default API keys
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key
```

### 4. Seed Data

The migration automatically seeds:
- 16 AI providers (text, image, audio, code)
- 20+ pre-configured models with pricing
- Helper functions for cost calculation

## Usage

### 1. Configure Providers

Visit `/settings/ai-providers` to:
- Add API keys for each provider
- Set daily/monthly budgets
- Enable/disable providers
- View health status
- Monitor usage

### 2. Using the AI Execution API

```typescript
// Simple execution
const response = await fetch('/api/ai/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_type: 'code_generation',
    prompt: 'Write a function to calculate fibonacci numbers',
    parameters: {
      temperature: 0.7,
      max_tokens: 1000
    }
  })
})

const result = await response.json()
console.log(result.data.content) // AI response
console.log(result.data.cost_usd) // Cost
console.log(result.data.model_used) // Model used
```

### 3. Model Selection

The system automatically selects the best model based on:
- Task type preferences
- Provider health status
- Budget availability
- Fallback chains

### 4. Task-to-Model Mapping

Configure default models for different tasks:

```typescript
// Set preference via API
await fetch('/api/ai/model-preferences', {
  method: 'POST',
  body: JSON.stringify({
    task_type: 'logo_design',
    primary_model_id: 'dalle-3-model-id',
    fallback_model_ids: ['midjourney-id', 'ideogram-id'],
    max_cost_per_request: 0.50
  })
})
```

## File Structure

```
/home/user/conductor/
├── supabase/migrations/
│   └── 20250115_ai_providers_system.sql
├── types/
│   └── index.ts (AI types added)
├── lib/ai/
│   ├── model-router.ts (Smart routing)
│   └── providers/
│       ├── base-provider.ts
│       ├── anthropic-provider.ts
│       ├── openai-provider.ts
│       └── provider-factory.ts
├── app/api/ai/
│   ├── providers/route.ts
│   ├── models/route.ts
│   ├── execute/route.ts
│   └── analytics/route.ts
├── app/settings/ai-providers/
│   └── page.tsx
├── app/tools/ai-playground/
│   └── page.tsx
└── components/ai-providers/
    ├── provider-card.tsx
    ├── model-selector.tsx
    └── usage-dashboard.tsx
```

## API Endpoints

### GET /api/ai/providers
List all providers with stats, health, and usage

**Query params:**
- `category` - Filter by category (text, image, audio, code)
- `user_id` - User-specific configs
- `project_id` - Project-specific configs

**Response:**
```json
[{
  "provider": { "id": "...", "name": "anthropic", ... },
  "config": { "is_enabled": true, ... },
  "health": { "is_available": true, ... },
  "usage": {
    "today": { "requests": 10, "cost_usd": 0.05 },
    "this_month": { "requests": 150, "cost_usd": 2.50 }
  },
  "budget": {
    "daily": { "budget_usd": 10, "spent_usd": 0.05 },
    "monthly": { "budget_usd": 100, "spent_usd": 2.50 }
  },
  "available_models": [...]
}]
```

### POST /api/ai/providers
Create or update provider configuration

**Body:**
```json
{
  "provider_id": "uuid",
  "api_key": "your-key",
  "daily_budget_usd": 10.00,
  "monthly_budget_usd": 100.00,
  "is_enabled": true
}
```

### GET /api/ai/models
List all available models

**Query params:**
- `provider_id` - Filter by provider
- `category` - Filter by category
- `capability` - Filter by capability
- `status` - Filter by status (default: active)
- `group_by` - Group results (provider)

### POST /api/ai/execute
Execute an AI request with smart routing

**Body:**
```json
{
  "task_type": "code_generation",
  "prompt": "Your prompt here",
  "model_id": "optional-specific-model",
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 1000
  },
  "user_id": "optional",
  "project_id": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "req_...",
    "model_used": { "id": "...", "name": "Claude 3.5 Sonnet" },
    "provider_used": { "id": "...", "name": "Anthropic" },
    "content": "AI response here",
    "usage": {
      "prompt_tokens": 100,
      "completion_tokens": 500,
      "total_tokens": 600
    },
    "cost_usd": 0.012,
    "duration_ms": 1234,
    "was_fallback": false
  }
}
```

### GET /api/ai/analytics
Get usage analytics

**Query params:**
- `user_id` - Filter by user
- `project_id` - Filter by project
- `start_date` - Start date (ISO)
- `end_date` - End date (ISO)

**Response:**
```json
{
  "total_requests": 150,
  "total_tokens": 50000,
  "total_cost_usd": 2.50,
  "average_cost_per_request": 0.0167,
  "average_response_time_ms": 1200,
  "success_rate": 0.98,
  "by_provider": [...],
  "by_model": [...],
  "by_task_type": [...],
  "timeline": [...]
}
```

## Advanced Features

### 1. Custom Fallback Chains

```typescript
// Set up fallback chain for critical tasks
await createModelPreference({
  task_type: 'critical_analysis',
  primary_model_id: 'claude-sonnet-id',
  fallback_model_ids: [
    'gpt-4o-id',
    'gemini-pro-id'
  ],
  quality_threshold: 0.9,
  max_cost_per_request: 0.10
})
```

### 2. Budget Alerts

Configure webhooks to receive alerts when:
- Daily budget reaches 80% threshold
- Monthly budget exceeded
- Provider health degrades

### 3. A/B Testing

Route percentage of traffic to different models:

```typescript
// Route 80% to primary, 20% to new model for testing
const shouldUseBeta = Math.random() < 0.2
const modelId = shouldUseBeta ? betaModelId : primaryModelId
```

### 4. Quality Scoring

Track response quality over time:

```typescript
// After execution, score the response
await fetch('/api/ai/usage-logs', {
  method: 'PATCH',
  body: JSON.stringify({
    log_id: result.request_id,
    response_quality_score: 0.95 // 0.0-1.0
  })
})
```

## Best Practices

1. **Always set budgets** - Prevent unexpected costs
2. **Use task-specific models** - Better results, lower costs
3. **Monitor health status** - Switch providers if issues arise
4. **Test in playground** - Compare models before production
5. **Track quality scores** - Optimize model selection over time
6. **Enable fallbacks** - Ensure high availability
7. **Cache responses** - Reduce costs for repeated queries

## Security Notes

⚠️ **Important:** API keys are currently stored without encryption. In production:

1. Encrypt API keys before storing:
```typescript
import crypto from 'crypto'

function encryptApiKey(apiKey: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}
```

2. Use environment variables for default keys
3. Implement Row Level Security (RLS) policies
4. Add authentication middleware to API routes
5. Rate limit API endpoints

## Troubleshooting

### Provider Health Issues
```sql
-- Check provider health
SELECT * FROM ai_provider_health
WHERE is_available = false;

-- Reset health counters
UPDATE ai_provider_health
SET success_count = 0, error_count = 0, error_rate = 0
WHERE provider_id = 'your-provider-id';
```

### Budget Tracking
```sql
-- Check budget status
SELECT * FROM ai_usage_budgets
WHERE period = 'daily'
AND period_start = CURRENT_DATE;

-- Reset budget alert
UPDATE ai_usage_budgets
SET is_alert_sent = false
WHERE id = 'budget-id';
```

### Usage Logs
```sql
-- View recent failures
SELECT * FROM ai_usage_logs
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- Calculate costs by provider
SELECT
  p.display_name,
  COUNT(*) as requests,
  SUM(l.cost_usd) as total_cost,
  AVG(l.cost_usd) as avg_cost
FROM ai_usage_logs l
JOIN ai_providers p ON l.provider_id = p.id
WHERE l.created_at >= CURRENT_DATE
GROUP BY p.display_name
ORDER BY total_cost DESC;
```

## Next Steps

1. Add more providers (Mistral, Cohere, etc.)
2. Implement streaming responses
3. Add image generation support
4. Build custom model fine-tuning interface
5. Add collaborative playground features
6. Implement cost optimization suggestions
7. Add performance benchmarking tools

## Support

For issues or questions:
1. Check provider documentation
2. Review usage logs for errors
3. Test in playground first
4. Monitor provider health status

## License

This system is part of the Conductor platform.
