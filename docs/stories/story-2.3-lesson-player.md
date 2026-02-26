# Story 2.3 — Lesson Player (3-Tab Interface)

## Status
Ready for Dev

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

- [ ] **Task 1**: Create `app/student/lessons/[lessonId]/page.tsx`
  - [ ] Server Component: auth check + fetch lesson, modules, existing scores
  - [ ] Pass data to `<LessonPlayer>` client component
  - [ ] 404 redirect if lesson not found or not assigned to student
- [ ] **Task 2**: Build `LessonPlayer.tsx` (client component)
  - [ ] Tab state management (active tab: resumo | tarefas | oratorio)
  - [ ] Slide index state (currentSlide: 0..n)
  - [ ] Tab switcher UI with active indicator + framer-motion transition
- [ ] **Task 3**: Build `tabs/ResumoTab.tsx`
  - [ ] Render `module.resumo_content.text` and `bullets`
  - [ ] Slide navigation (prev/next, progress indicator)
  - [ ] "Ouvir" button: calls `window.speechSynthesis.speak()` with slide text
  - [ ] Mark slide as "read" in local state → update score when all read
- [ ] **Task 4**: Build `tabs/TarefasTab.tsx`
  - [ ] Render MCQ questions from `module.tarefas_content.questions`
  - [ ] Click answer → show feedback (green/red highlight)
  - [ ] Track score locally, upsert to DB on completion
- [ ] **Task 5**: Build `tabs/OratorioTab.tsx` (stub for Wave 2)
  - [ ] Show speaking prompt + target phrase
  - [ ] Record button visible but disabled with "Em breve" badge
- [ ] **Task 6**: Add "Minhas Aulas" page listing available lessons
  - [ ] `app/student/lessons/page.tsx` — lists all lessons with progress indicators
  - [ ] Link from student sidebar "Minhas Aulas"
- [ ] **Task 7**: Run `npm run build` — fix TypeScript errors

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
