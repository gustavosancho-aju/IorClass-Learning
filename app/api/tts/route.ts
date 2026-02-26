/**
 * POST /api/tts
 *
 * Proxies text-to-speech requests to Eleven Labs API.
 * Returns audio/mpeg stream on success, { fallback: true } on any error.
 *
 * Request body: { text: string, voice?: string }
 * Response:     audio/mpeg stream | { fallback: true }
 */

export const runtime = 'edge'

const DEFAULT_VOICE    = '21m00Tcm4TlvDq8ikWAM' // Rachel — natural, clear English
const MAX_TEXT_LENGTH  = 1000

export async function POST(request: Request) {
  /* ── 1. Parse + validate ─────────────────────────────────────── */
  let body: { text?: unknown; voice?: unknown }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { text, voice = DEFAULT_VOICE } = body

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'text is required' }), { status: 400 })
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(
      JSON.stringify({ error: `text exceeds maximum of ${MAX_TEXT_LENGTH} characters` }),
      { status: 400 }
    )
  }

  const voiceId = typeof voice === 'string' ? voice : DEFAULT_VOICE

  /* ── 2. Proxy to Eleven Labs ─────────────────────────────────── */
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
