import { createAdminClient } from '@/lib/supabase/admin'

export interface RateLimitConfig {
  endpoint:      string  // e.g. 'tts' | 'process-ppt'
  maxRequests:   number  // max requests per window
  windowMinutes: number  // window duration in minutes
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
}

/**
 * Atomic rate limiter backed by a PostgreSQL RPC function.
 * A single `INSERT ON CONFLICT DO UPDATE WHERE` statement handles all cases:
 *   · New user        → insert count=1, allowed=true
 *   · Window expired  → reset count to 1, allowed=true
 *   · Within limit    → increment count, allowed=true
 *   · Limit exceeded  → no-op (WHERE blocks update), allowed=false
 *
 * Replaces the previous SELECT → UPDATE pattern that had a race-condition
 * where two concurrent requests could both read count < max before either
 * incremented, effectively doubling the allowed request count.
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
    p_user_id:        userId,
    p_endpoint:       config.endpoint,
    p_max_requests:   config.maxRequests,
    p_window_minutes: config.windowMinutes,
  })

  if (error) {
    console.error('[rate-limit] RPC error:', error)
    // Fail open: avoid blocking users when the DB has transient issues
    return { allowed: true, remaining: config.maxRequests }
  }

  // Supabase returns RPC table results as an array; take the first row
  const row = Array.isArray(data) ? data[0] : data

  return {
    allowed:   row?.allowed   ?? true,
    remaining: row?.remaining ?? 0,
  }
}
