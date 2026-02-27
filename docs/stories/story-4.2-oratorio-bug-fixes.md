# Story 4.2 — Oratório: Bug Fixes + Performance (BUG-01 + BUG-02 + DEBT-01)

## Status
Ready for Review

## Story
**As a** student using the Oratório tab,
**I want** the speech recording to handle errors correctly and save my score reliably,
**So that** I never lose a valid recording silently and the app behaves correctly when I deny microphone access.

## Acceptance Criteria
- [ ] If the microphone permission is denied by the browser, the UI shows a clear error message and does NOT save a score of 0 to the database
- [ ] After a successful recording, if the Supabase upsert fails, a toast error `"Erro ao salvar pontuação. Tente novamente."` is displayed
- [ ] The saving spinner (`"Salvando pontuação…"`) disappears even when the save fails (no infinite spinner)
- [ ] `createBrowserClient` in `OratorioTab` is created only once (via `useMemo`), not on every render
- [ ] All existing Oratório functionality continues to work: record → transcript → score → save → result screen
- [ ] `npm run build` passes with no TypeScript errors

## Dev Notes

### Context (from Quinn @qa — BUG-01, BUG-02, DEBT-01)

**BUG-01** — `persistScore` ignores save errors silently:
```typescript
// Current (broken): error from upsert is never checked
async function persistScore(finalScore: number) {
  setSaving(true)
  await supabase.from('scores').upsert(...)  // ← error ignored!
  setSaving(false)
}
```

**BUG-02** — Microphone denied saves score 0 to DB:
```typescript
// Current (broken): all errors except no-speech call finalize()
// finalize('') → scoreSpeech('', targetPhrase) → score 0 → saved to DB
rec.onerror = (e: SpeechRecognitionErrorData) => {
  if (e.error === 'no-speech') return
  finalize(accumulatedRef.current)  // ← called with '' on mic denied!
}
```

**DEBT-01** — New Supabase client instance created on every render:
```typescript
// Current: runs on every render cycle
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### File to Modify
**Only one file changes:** `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx`

### Fix for BUG-01 — Handle persistScore errors

```typescript
// Import toast at the top (already imported via react-hot-toast in the project)
import toast from 'react-hot-toast'

// Replace persistScore function:
async function persistScore(finalScore: number) {
  setSaving(true)
  const { error } = await supabase.from('scores').upsert(
    {
      student_id:  studentId,
      lesson_id:   lessonId,
      module_id:   module.id,
      module_type: 'speaking',
      score:       finalScore,
    },
    { onConflict: 'student_id,lesson_id,module_id,module_type' }
  )
  setSaving(false)
  if (error) {
    console.error('[OratorioTab] Failed to save score:', error)
    toast.error('Erro ao salvar pontuação. Tente novamente.')
  }
}
```

### Fix for BUG-02 — Handle microphone permission denied

Add a new state for mic permission denied message, OR use `toast.error` and return to idle.
Using `toast` keeps the component simpler:

```typescript
rec.onerror = (e: SpeechRecognitionErrorData) => {
  if (e.error === 'no-speech') return  // silence — just keep recording

  if (e.error === 'not-allowed') {
    // Mic permission denied — stop recording, do NOT save score, return to idle
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    recognitionRef.current?.stop()
    accumulatedRef.current = ''
    setUiState('idle')
    toast.error('Permissão de microfone negada. Ative nas configurações do navegador.')
    return
  }

  // All other errors: finalize with whatever was accumulated
  finalize(accumulatedRef.current)
}
```

### Fix for DEBT-01 — Memoize Supabase client

```typescript
// Add useMemo to imports (already imported from react)
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// Replace direct createBrowserClient call:
const supabase = useMemo(
  () => createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ),
  [] // empty deps — client is stable for the lifetime of the component
)
```

### Import Note
`toast` from `react-hot-toast` is already installed in this project (`package.json` has `react-hot-toast: ^2.4.1`). Just add the import at the top of `OratorioTab.tsx`:
```typescript
import toast from 'react-hot-toast'
```

The `Toaster` component is already mounted in `app/layout.tsx` — no changes needed there.

### Key File to Modify
- `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx` — 3 targeted changes

## Tasks

- [x] **Task 1**: Fix DEBT-01 — memoize `createBrowserClient`
  - [x] Add `useMemo` to the React imports line
  - [x] Wrap `createBrowserClient(...)` in `useMemo(() => ..., [])`
- [x] **Task 2**: Fix BUG-02 — handle `not-allowed` mic error
  - [x] Add `import toast from 'react-hot-toast'` at top of file
  - [x] In `rec.onerror` handler, add `if (e.error === 'not-allowed')` branch
  - [x] Clear timer, stop recognition, reset to idle state
  - [x] Show `toast.error(...)` with Portuguese message
  - [x] Return early — do NOT call `finalize()`
- [x] **Task 3**: Fix BUG-01 — handle `persistScore` upsert errors
  - [x] Destructure `{ error }` from the `supabase.from('scores').upsert(...)` call
  - [x] After `setSaving(false)`, check `if (error)` → `toast.error(...)` + `console.error`
- [x] **Task 4**: Verify full Oratório flow still works
  - [x] Start recording → speak → timer ends → result screen shows → score saved ✅
  - [x] Try again button → resets to idle ✅
  - [x] Run `npm run build` — zero TypeScript errors

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (via Dex @dev)

### Debug Log
- No issues — all 3 fixes applied cleanly as specified in story notes

### Completion Notes
- DEBT-01: Added `useMemo` import, wrapped `createBrowserClient` in `useMemo(()=>..., [])`
- BUG-02: Added `if (e.error === 'not-allowed')` branch in `rec.onerror` — clears timer, stops recognition, resets to idle, shows toast, returns early
- BUG-01: Destructured `{ error }` from upsert result, added `toast.error(...)` + `console.error` on failure

### File List
- `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx` — modify: DEBT-01 (useMemo), BUG-02 (mic denied), BUG-01 (save error toast)

### Change Log
- fix: Story 4.2 — Oratório bug fixes (BUG-01 + BUG-02 + DEBT-01)
