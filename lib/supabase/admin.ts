import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Supabase Admin Client — usa SERVICE_ROLE_KEY.
 * ⚠️  Bypassa todo RLS — usar SOMENTE em API routes server-side.
 * ⚠️  NUNCA importe este arquivo em componentes client-side.
 */
export function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}
