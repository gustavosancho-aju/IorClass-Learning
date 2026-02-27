/**
 * POST /api/tts
 *
 * Proxies text-to-speech requests to Eleven Labs API.
 * Returns audio/mpeg stream on success, { fallback: true } on any error.
 *
 * Request body: { text: string, voice?: string }
 * Response:     audio/mpeg stream | { fallback: true }
 */

import { createClient }   from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Node.js runtime required for createClient + checkRateLimit (Supabase admin client)
export const runtime = 'nodejs'

const FALLBACK_VOICE  = '21m00Tcm4TlvDq8ikWAM' // Rachel — fallback se ELEVENLABS_VOICE_ID não definido
const MAX_TEXT_LENGTH = 1000

export async function POST(request: Request) {
  /* ── 1. Parse + validate ─────────────────────────────────────── */
  let body: { text?: unknown; voice?: unknown }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  /* ── 2. Auth check — get user for rate limiting ──────────────── */
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  /* ── 3. Rate limit — 20 TTS calls per minute per user ───────── */
  const rl = await checkRateLimit(user.id, {
    endpoint:      'tts',
    maxRequests:   20,
    windowMinutes: 1,
  })
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
      { status: 429 }
    )
  }

  /* ── 4. Validate body ────────────────────────────────────────── */
  // Voice priority: request body → env var → hardcoded fallback
  const envVoice = process.env.ELEVENLABS_VOICE_ID
  const { text, voice = envVoice ?? FALLBACK_VOICE } = body

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'text is required' }), { status: 400 })
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(
      JSON.stringify({ error: `text exceeds maximum of ${MAX_TEXT_LENGTH} characters` }),
      { status: 400 }
    )
  }

  const voiceId = typeof voice === 'string' ? voice : (envVoice ?? FALLBACK_VOICE)

  /* ── 5. Proxy to Eleven Labs ─────────────────────────────────── */
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    // No API key configured — tell client to use browser TTS
    return new Response(JSON.stringify({ fallback: true }), { status: 200 })
  }

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept':       'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key':   apiKey,
        },
        body: JSON.stringify({
          text:           text.trim(),
          model_id:       'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      }
    )

    if (!elevenRes.ok) {
      // Graceful fallback — don't expose Eleven Labs errors to client
      return new Response(JSON.stringify({ fallback: true }), { status: 200 })
    }

    return new Response(elevenRes.body, {
      headers: {
        'Content-Type':  'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })

  } catch {
    // Network error or timeout — fall back to browser TTS
    return new Response(JSON.stringify({ fallback: true }), { status: 200 })
  }
}
