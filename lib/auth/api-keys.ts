import { createHash, randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function generateApiKey(agentId: string, name: string): Promise<{ key: string; keyPrefix: string }> {
  // Generate a secure random key
  const key = `cond_${randomBytes(32).toString('hex')}`
  const keyPrefix = key.substring(0, 12)

  // Hash the key for storage
  const keyHash = createHash('sha256').update(key).digest('hex')

  const supabase = await createClient()

  // Store the hashed key
  const { error } = await supabase
    .from('agent_api_keys')
    .insert({
      agent_id: agentId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
      scopes: ['tasks:read', 'tasks:write', 'tasks:poll'],
      last_used_at: null,
      expires_at: null
    })

  if (error) throw error

  return { key, keyPrefix }
}

export async function verifyApiKey(key: string): Promise<{ valid: boolean; agentId?: string }> {
  const keyHash = createHash('sha256').update(key).digest('hex')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_api_keys')
    .select('agent_id, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }

  // Update last used timestamp
  await supabase
    .from('agent_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return { valid: true, agentId: data.agent_id }
}

export function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}
