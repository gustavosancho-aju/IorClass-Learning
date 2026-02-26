# Story 2.4 — TTS Proxy (Eleven Labs via Vercel Edge Function)

## Status
Ready for Dev

## Story
**As a** student,
**I want to** hear lesson content read aloud in a natural English voice,
**So that** I can practice listening comprehension alongside reading.

## Acceptance Criteria
- [ ] API route `POST /api/tts` accepts `{ text: string, voice?: string }` payload
- [ ] Route proxies the request to Eleven Labs API using `ELEVENLABS_API_KEY` env var
- [ ] Returns audio stream (MP3) directly to client
- [ ] Default voice: Rachel (voice_id: `21m00Tcm4TlvDq8ikWAM`) — natural, clear English
- [ ] On Eleven Labs error: falls back to returning `{ fallback: true }` — client uses `window.speechSynthesis`
- [ ] Rate limiting: max 100 chars per request enforced server-side
- [ ] Edge runtime for low latency: `export const runtime = 'edge'`
- [ ] `ResumoTab.tsx` "Ouvir" button calls this API instead of browser TTS when available

## Dev Notes

### Eleven Labs API
- Endpoint: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- Auth header: `xi-api-key: {ELEVENLABS_API_KEY}`
- Response: audio/mpeg stream
- Docs: https://elevenlabs.io/docs/api-reference/text-to-speech

### Edge Function Pattern
```ts
// app/api/tts/route.ts
export const runtime = 'edge'

export async function POST(request: Request) {
  const { text, voice = '21m00Tcm4TlvDq8ikWAM' } = await request.json()

  if (!text || text.length > 1000) {
    return new Response(JSON.stringify({ error: 'Invalid text' }), { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      }
    )

    if (!response.ok) {
      return new Response(JSON.stringify({ fallback: true }), { status: 200 })
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch {
    return new Response(JSON.stringify({ fallback: true }), { status: 200 })
  }
}
```

### Client-Side Usage (ResumoTab)
```ts
const playAudio = async (text: string) => {
  setIsPlaying(true)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    const contentType = res.headers.get('Content-Type')
    if (contentType?.includes('audio/mpeg')) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => setIsPlaying(false)
      audio.play()
    } else {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.onend = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    }
  } catch {
    setIsPlaying(false)
  }
}
```

### Environment Variable
Add to `.env.local`:
```
ELEVENLABS_API_KEY=your_key_here
```

## Tasks

- [ ] **Task 1**: Create `app/api/tts/route.ts`
  - [ ] Edge runtime declaration
  - [ ] Input validation (text required, max 1000 chars)
  - [ ] Eleven Labs API call with proper headers
  - [ ] Audio stream response
  - [ ] Graceful fallback `{ fallback: true }` on any error
- [ ] **Task 2**: Add `ELEVENLABS_API_KEY` to `.env.example` with placeholder value
- [ ] **Task 3**: Update `ResumoTab.tsx` (Story 2.3)
  - [ ] Replace `window.speechSynthesis` with `playAudio()` helper
  - [ ] Loading state on "Ouvir" button (spinner while fetching audio)
  - [ ] "Stop" button when audio is playing
- [ ] **Task 4**: Test with `curl`:
  ```bash
  curl -X POST http://localhost:3000/api/tts \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello, welcome to Master Speaking!"}' \
    --output test.mp3
  ```
- [ ] **Task 5**: Run `npm run build` — fix TypeScript errors

## Dev Agent Record

### Agent Model Used
_To be filled by @dev_

### Debug Log
_To be filled by @dev_

### Completion Notes
_To be filled by @dev_

### File List
_To be filled by @dev_

### Change Log
_To be filled by @dev_
