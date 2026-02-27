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
 * Sliding-window rate limiter backed by Supabase `rate_limits` table.
 * Uses admin client (bypasses RLS) for reliable server-side writes.
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase    = createAdminClient()
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString()
  const now         = new Date().toISOString()

  // Fetch existing record for this user + endpoint
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, window_start, request_count')
    .eq('user_id', userId)
    .eq('endpoint', config.endpoint)
    .single()

  if (!existing || existing.window_start < windowStart) {
    // No record OR window expired → start fresh
    await supabase
      .from('rate_limits')
      .upsert(
        {
          user_id:       userId,
          endpoint:      config.endpoint,
          window_start:  now,
          request_count: 1,
          updated_at:    now,
        },
        { onConflict: 'user_id,endpoint' }
      )

    return { allowed: true, remaining: config.maxRequests - 1 }
  }

  if (existing.request_count >= config.maxRequests) {
    // Limit exceeded
    return { allowed: false, remaining: 0 }
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({
      request_count: existing.request_count + 1,
      updated_at:    now,
    })
    .eq('id', existing.id)

  return {
    allowed:   true,
    remaining: config.maxRequests - existing.request_count - 1,
  }
}
