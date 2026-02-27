# Story 2.3 — Lesson Player (3-Tab Interface)

## Status
Ready for Review

## Story
**As a** student,
**I want to** view a lesson with 3 interactive tabs — Resumo, Tarefas, and Oratório,
**So that** I can learn content, practice comprehension, and practice speaking.

## Acceptance Criteria
- [ ] Student can access `/student/lessons/[lessonId]` — protected route
- [ ] Page shows lesson title + 3 tabs: **Resumo** | **Tarefas** | **Oratório**
- [ ] **Tab 1 — Resumo (Summary)**:
  - [ ] Displays slide content: title, text body, bullet points
  - [ ] "Ouvir" (Listen) button triggers TTS audio playback
  - [ ] Slide navigation: Previous / Next buttons to move between modules
  - [ ] Progress indicator (e.g., "Slide 2 of 8")
- [ ] **Tab 2 — Tarefas (Tasks)**:
  - [ ] Shows multiple-choice questions for current slide
  - [ ] Student selects answer, immediate feedback (correct ✅ / wrong ❌)
  - [ ] Score tracked locally (correct answers / total)
  - [ ] "Próxima Tarefa" button advances to next question
- [ ] **Tab 3 — Oratório (Speaking)**:
  - [ ] Shows speaking prompt + target phrase to practice
  - [ ] Record button (uses `MediaRecorder` API) — placeholder for Wave 3 scoring
  - [ ] For Wave 2: record button is visible but shows "Em breve" or stub state
- [ ] Module completion: when all Resumo slides read + all Tarefas answered → `scores` record upserted
- [ ] Scores stored: `{ student_id, lesson_id, module_id, module_type, score }` for each completed module

## Dev Notes

### Tech Stack
- Next.js App Router page (Server Component for data fetching, Client Components for interactivity)
- Supabase client for fetching modules + upserting scores
- `framer-motion` for tab transitions
- TTS: call `/api/tts` proxy (Story 2.4) — for Wave 2, use browser's `window.speechSynthesis` as fallback

### Component Structure
```
app/student/lessons/[lessonId]/
  page.tsx                    ← Server Component, fetches lesson + modules
  LessonPlayer.tsx            ← 'use client', manages tab state + slide navigation
  tabs/
    ResumoTab.tsx             ← Slide content + TTS button
    TarefasTab.tsx            ← MCQ questions + scoring
    OratorioTab.tsx           ← Speaking prompt + record button (stub Wave 2)
```

### Data Fetching (page.tsx)
```ts
const lesson = await supabase.from('lessons').select('*').eq('id', lessonId).single()
const modules = await supabase.from('modules').select('*').eq('lesson_id', lessonId).order('slide_number')
const scores = await supabase.from('scores').select('*').eq('student_id', userId).eq('lesson_id', lessonId)
```

### TTS Fallback (Wave 2)
```ts
// Use browser SpeechSynthesis as fallback if /api/tts not ready
const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  window.speechSynthesis.speak(utterance)
}
```

### Score Upsert Pattern
```ts
await supabase.from('scores').upsert({
  student_id: userId,
  lesson_id: lessonId,
  module_id: moduleId,
  module_type: 'tarefas', // 'resumo' | 'tarefas' | 'oratorio'
  score: (correctAnswers / totalQuestions) * 100,
}, { onConflict: 'student_id,lesson_id,module_id,module_type' })
```

## Tasks

- [x] **Task 1**: Create `app/student/lessons/[lessonId]/page.tsx`
  - [x] Server Component: auth check + fetch lesson, modules, existing scores
  - [x] Pass data to `<LessonPlayer>` client component
  - [x] notFound() if lesson not found
- [x] **Task 2**: Build `LessonPlayer.tsx` (client component)
  - [x] Tab state management (active tab: resumo | tarefas | oratorio)
  - [x] Slide index state (currentSlide: 0..n)
  - [x] Tab switcher UI with active indicator + framer-motion transition
- [x] **Task 3**: Build `tabs/ResumoTab.tsx`
  - [x] Render `module.content_json.resumo.text` and `bullets`
  - [x] Slide navigation (prev/next, progress indicator "X / N")
  - [x] "Ouvir" button: calls `window.speechSynthesis.speak()` with slide text
  - [x] Mark slide as "read" + upsert score per-slide
- [x] **Task 4**: Build `tabs/TarefasTab.tsx`
  - [x] Render MCQ questions from `module.content_json.tarefas.questions`
  - [x] Click answer → show feedback (green/red highlight)
  - [x] Track score locally, upsert to DB on all questions answered
- [x] **Task 5**: Build `tabs/OratorioTab.tsx` (stub for Wave 2)
  - [x] Show speaking prompt + target phrase
  - [x] Record button visible but disabled with "Em breve" badge
- [x] **Task 6**: Add "Minhas Aulas" page listing available lessons
  - [x] `app/student/lessons/page.tsx` — lists all published lessons with avg score
  - [x] Link from student sidebar "Minhas Aulas" (already existed in Sidebar.tsx)
- [x] **Task 7**: Run `npm run build` — fix TypeScript errors

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (via Dex @dev)

### Debug Log
- TypeScript: duplicate `ModuleRow` interface across files caused type mismatch — fixed by extracting shared `LessonModule` type into `types.ts`
- `modules` from Supabase has `content_json: Record<string, unknown>` — explicitly mapped to `LessonModule[]` in page.tsx to preserve type safety

### Completion Notes
- Shared `LessonModule` type in `app/student/lessons/[lessonId]/types.ts` used by all 3 tabs
- TTS uses `window.speechSynthesis` (Wave 2 fallback) — Story 2.4 will replace with Eleven Labs
- Score upserted per-slide (Resumo) and per-module-completion (Tarefas)
- Oratório recording is a stub — disabled mic button with "Em breve" badge
- Score conflict handled via `onConflict: 'student_id,lesson_id,module_id,module_type'`

### File List
- `app/student/lessons/[lessonId]/types.ts` — created: shared LessonModule type
- `app/student/lessons/[lessonId]/page.tsx` — created: Server Component
- `app/student/lessons/[lessonId]/LessonPlayer.tsx` — created: 3-tab client component
- `app/student/lessons/[lessonId]/tabs/ResumoTab.tsx` — created: slide content + TTS + nav
- `app/student/lessons/[lessonId]/tabs/TarefasTab.tsx` — created: MCQ + scoring
- `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx` — created: speaking prompt stub
- `app/student/lessons/page.tsx` — created: Minhas Aulas listing page

### Change Log
- feat: Story 2.3 — Lesson Player 3-tab interface complete
