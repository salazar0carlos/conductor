import { createClient } from '@/lib/supabase/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = await createClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // Clean up old entries
  await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString())

  // Get current count for this key
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .gte('window_start', windowStart.toISOString())
    .single()

  if (!existing) {
    // First request in this window
    await supabase
      .from('rate_limits')
      .insert({
        key,
        count: 1,
        window_start: now.toISOString()
      })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs)
    }
  }

  if (existing.count >= config.maxRequests) {
    // Rate limit exceeded
    const resetAt = new Date(new Date(existing.window_start).getTime() + config.windowMs)
    return {
      allowed: false,
      remaining: 0,
      resetAt
    }
  }

  // Increment count
  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('key', key)
    .eq('window_start', existing.window_start)

  const resetAt = new Date(new Date(existing.window_start).getTime() + config.windowMs)

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count - 1,
    resetAt
  }
}

export async function rateLimitByIp(ip: string, config?: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  return checkRateLimit(`ip:${ip}`, config)
}

export async function rateLimitByAgent(agentId: string, config?: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  return checkRateLimit(`agent:${agentId}`, config || {
    windowMs: 60 * 1000,
    maxRequests: 100 // Agents get higher limits
  })
}
