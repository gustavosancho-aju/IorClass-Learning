# Story 5.5 — Loading States: Skeleton Screens + CTA Feedback (UX-05)

## Status
Done

## Story
**As a** student or teacher on a slow mobile connection,
**I want** to see meaningful loading feedback while pages and content load,
**So that** the interface feels responsive and I know something is happening instead of seeing a blank white flash.

## Acceptance Criteria
- [x]`app/student/lessons/[lessonId]/tabs/ResumoTab.tsx`: TTS "Ouvir" button shows `Loader2` spinner and `Carregando...` text while the fetch is in progress
- [x]TTS button is disabled (`disabled`) during the audio fetch to prevent double-clicks
- [x]TTS button reverts to normal state ("Ouvir" / "Parar") after audio loads or falls back
- [x]`app/student/dashboard/loading.tsx` exists and renders a skeleton of the dashboard layout
- [x]`app/student/progress/loading.tsx` exists and renders a skeleton of the progress layout
- [x]`app/teacher/dashboard/loading.tsx` exists and renders a skeleton of the dashboard layout
- [x]All skeletons use the `.skeleton` CSS class from `globals.css` (animate-pulse, rounded, bg-ms-light/20)
- [x]Skeletons approximate the real layout structure (header area, stat cards row, content cards)
- [x]Skeletons do NOT attempt to replicate exact content — just structural placeholders
- [x]`npm run build` passes with no TypeScript errors
- [x]`npm run lint` passes with no errors

## Dev Notes

### Context (from Uma @ux-design-expert — UX-05)
Two distinct loading UX problems:

**M-05: TTS button has no loading state**
The "Ouvir" button in `ResumoTab` calls `/api/tts` which can take 1-3s on first request (Eleven Labs cold start). During that time, the button is unresponsive but doesn't visually indicate loading. The `isPlaying` state is set to `true` immediately, so the button shows "Parar" (stop) even before audio starts — which is confusing.

**M-02: Skeleton screens exist in CSS but are not used**
`globals.css` has a `.skeleton` class (`animate-pulse rounded-lg bg-ms-light/20`) that is ready to use. Next.js App Router natively supports `loading.tsx` files — placing one next to a `page.tsx` activates React Suspense automatically. The server-rendered pages currently show a complete blank white screen while the server fetches data.

### Chosen Approach

**TTS Loading:** Add `isFetchingAudio` boolean state to `ResumoTab`. Set to `true` before `fetch('/api/tts')` and `false` after. Show `Loader2` spinner + "Carregando..." text during fetch. Distinguish from `isPlaying` (audio actively playing).

**Skeleton Screens:** Create `loading.tsx` files alongside each heavy SSR page. Use the `sidebar-aware` layout matching what the actual page will render. Keep skeletons simple — the goal is to prevent jarring blank screens, not pixel-perfect wireframes.

### Fix 1: TTS Loading State in ResumoTab

```typescript
// app/student/lessons/[lessonId]/tabs/ResumoTab.tsx

// Add to imports:
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2 } from 'lucide-react'

// Add new state:
const [isFetchingAudio, setIsFetchingAudio] = useState(false)

// Update speak function:
const speak = useCallback(async () => {
  if (isPlaying) { stopAudio(); return }
  if (isFetchingAudio) return   // Prevent double-click

  const text = (resumo.text || resumo.bullets.join('. ')).slice(0, 1000)
  setIsFetchingAudio(true)      // NEW: show loading state

  try {
    const res = await fetch('/api/tts', { ... })

    setIsFetchingAudio(false)   // NEW: loading done (success)

    const contentType = res.headers.get('Content-Type') ?? ''
    if (contentType.includes('audio/mpeg')) {
      // ... existing audio play logic
      setIsPlaying(true)
      return
    }
  } catch {
    setIsFetchingAudio(false)   // NEW: loading done (error)
  }

  // Fallback: browser Web Speech API
  setIsPlaying(true)
  // ...
}, [isPlaying, isFetchingAudio, resumo])

// Update TTS button:
<button
  onClick={speak}
  disabled={isFetchingAudio}   // NEW: disabled during fetch
  className={[
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
    isFetchingAudio
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'   // NEW: loading style
      : isPlaying
        ? 'bg-ms-medium text-white'
        : 'bg-ms-light text-ms-dark hover:bg-ms-medium/20',
  ].join(' ')}
>
  {isFetchingAudio ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      Carregando...
    </>
  ) : isPlaying ? (
    <><VolumeX size={16} />Parar</>
  ) : (
    <><Volume2 size={16} />Ouvir</>
  )}
</button>
```

### Fix 2: Skeleton Loading Pages

Each `loading.tsx` should be a **React Server Component** (no `'use client'` — it's static).

**Structure for Student Dashboard Skeleton:**
```tsx
// app/student/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-48" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="skeleton h-14 w-14 rounded-full mx-auto mb-3" />
            <div className="skeleton h-4 w-24 mx-auto" />
            <div className="skeleton h-3 w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Teacher Dashboard and Student Progress use similar patterns** — adapt the skeleton to match their actual layout (stat card count, grid columns, content sections).

> Note: The `loading.tsx` uses `px-4 py-6 md:p-8` to match the padding fix from Story 5.2.

### Key Files
- `app/student/lessons/[lessonId]/tabs/ResumoTab.tsx` — modify: TTS loading state
- `app/student/dashboard/loading.tsx` — create: dashboard skeleton
- `app/student/progress/loading.tsx` — create: progress skeleton
- `app/teacher/dashboard/loading.tsx` — create: teacher dashboard skeleton

## Tasks

- [x]**Task 1**: Add TTS loading state to `ResumoTab.tsx`
  - [x]Add `Loader2` to lucide-react imports
  - [x]Add `const [isFetchingAudio, setIsFetchingAudio] = useState(false)` state
  - [x]In `speak()`: set `isFetchingAudio(true)` before fetch, `false` in both try success and catch
  - [x]Add `if (isFetchingAudio) return` guard at start of `speak()`
  - [x]Update button: add `disabled={isFetchingAudio}`, add loading branch to className and content
- [x]**Task 2**: Create `app/student/dashboard/loading.tsx`
  - [x]Server Component (no `'use client'`)
  - [x]Match paddings from Story 5.2 (`px-4 py-6 md:p-8 max-w-5xl mx-auto`)
  - [x]Header area skeleton (2 lines)
  - [x]Stats grid skeleton (3 cards, using `grid grid-cols-1 sm:grid-cols-3`)
  - [x]Main lesson list card skeleton (4 rows)
- [x]**Task 3**: Create `app/student/progress/loading.tsx`
  - [x]Match paddings from Story 5.2
  - [x]Header area skeleton
  - [x]Stats grid skeleton (2×2 = 4 cards, `grid grid-cols-2`)
  - [x]Module performance bars skeleton (3 items)
  - [x]Lesson history skeleton (3 rows)
- [x]**Task 4**: Create `app/teacher/dashboard/loading.tsx`
  - [x]Match paddings from Story 5.2
  - [x]Header area skeleton
  - [x]Stats grid skeleton (4 cards, `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
  - [x]2-column main area: lesson list (2/3) + activity feed (1/3)
- [x]**Task 5**: Build and verify
  - [x]Run `npm run build` — zero TypeScript errors
  - [x]Run `npm run lint` — zero errors
  - [x]Test TTS: button shows spinner during fetch, reverts after audio loads
  - [x]Verify loading.tsx files are recognized by Next.js (no build errors)

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5

### Debug Log
ResumoTab: isFetchingAudio state added. setIsFetchingAudio(false) placed in both the success path (after successful fetch) and the catch block. The speak() function had an early guard added for isFetchingAudio before the isPlaying guard. Loader2 spinner uses animate-spin class. All 3 loading.tsx files created as Server Components with no 'use client' directive.

### Completion Notes
TTS loading state in ResumoTab: isFetchingAudio boolean state, Loader2 spinner with "Carregando..." text, disabled attribute during fetch, loading style (bg-slate-100 text-slate-400 cursor-not-allowed). Three loading.tsx skeleton files created: student/dashboard (header + 3 stat cards + lesson list), student/progress (header + 4 stats + module bars + lesson history), teacher/dashboard (header + 4 stat cards + 2-col main). All use .skeleton CSS class and match responsive paddings from Story 5.2. Build passes with zero TypeScript errors.

### File List
- `app/student/lessons/[lessonId]/tabs/ResumoTab.tsx` — modify: TTS loading state
- `app/student/dashboard/loading.tsx` — create
- `app/student/progress/loading.tsx` — create
- `app/teacher/dashboard/loading.tsx` — create

### Change Log
- feat: Story 5.5 — Loading States: Skeleton Screens + CTA Feedback (UX-05)
