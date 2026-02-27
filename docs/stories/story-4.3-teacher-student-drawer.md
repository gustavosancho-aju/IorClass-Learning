# Story 4.3 — Teacher: Student Progress Drawer (/teacher/students)

## Status
Ready for Review

## Story
**As a** teacher,
**I want to** click on a student row in my Students page and see their per-lesson progress in a side drawer,
**So that** I can quickly understand which lessons each student has engaged with and how they scored.

## Acceptance Criteria
- [ ] Each student row in `/teacher/students` is visually clickable (cursor pointer, hover state)
- [ ] Clicking a student row opens a side drawer/panel from the right side of the screen
- [ ] The drawer shows the selected student's name at the top
- [ ] The drawer lists each lesson the student has activity on, showing: lesson title (or lesson ID abbreviated), average score for that lesson, and modules completed
- [ ] The drawer has a visible close button (✕) that dismisses it
- [ ] Clicking outside the drawer (overlay) also dismisses it
- [ ] Only one drawer can be open at a time
- [ ] The drawer works on mobile (full-width) and desktop (side panel, ~400px)
- [ ] No new npm packages required — use Tailwind CSS only
- [ ] `npm run build` passes with no TypeScript errors

## Dev Notes

### Context (from Quinn @qa — AC-01, Story 3.3 gap)
The original Story 3.3 acceptance criteria included: *"Click no aluno → drawer/modal com progresso por aula"*. This was not implemented — the student rows are non-interactive `<div>` elements.

### Current Architecture
`app/teacher/students/page.tsx` is a **Server Component** that:
1. Fetches `student_performance` rows (which include `lesson_id` and per-lesson data)
2. Aggregates rows into a `Map<student_id, StudentSummary>` (one entry per student)
3. The original per-lesson rows are discarded after aggregation

### New Architecture

The page needs to pass the **raw per-lesson rows** (before aggregation) down to a Client Component so the drawer can display them.

**Files to create/modify:**

| File | Action | Purpose |
|---|---|---|
| `app/teacher/students/page.tsx` | Modify | Pass raw rows + students to new ClientTable |
| `app/teacher/students/StudentTable.tsx` | Create | Client Component — table + drawer state |

### Data Flow

```
page.tsx (Server Component)
  ↓ fetches student_performance rows (includes lesson_id per row)
  ↓ aggregates → students[] (one per student, for table display)
  ↓ keeps raw rows as lessonRows[] (for drawer detail)
  ↓ passes both to StudentTable

StudentTable.tsx (Client Component)
  ↓ renders table rows with onClick handler
  ↓ selectedStudent state (string | null)
  ↓ when selectedStudent set → filter lessonRows by student_id
  ↓ renders drawer with per-lesson breakdown
```

### Types to pass from page.tsx to StudentTable.tsx

```typescript
// in page.tsx or a shared types file
export interface StudentSummary {
  student_id:        string
  student_name:      string | null
  avg_score:         number
  modules_completed: number
  last_activity:     string | null
  lesson_count:      number
}

export interface LessonRow {
  student_id:        string
  student_name:      string | null
  lesson_id:         string
  avg_score:         number | null
  modules_completed: number | null
  last_activity:     string | null
}
```

### page.tsx changes (minimal)

```typescript
// Import new StudentTable client component
import { StudentTable } from './StudentTable'

// Keep raw rows before aggregation
const lessonRows: LessonRow[] = rows ?? []

// Replace inline table render with:
return (
  <div className="p-8 max-w-5xl mx-auto">
    {/* Header + Summary cards stay in Server Component */}
    ...
    {students.length === 0 ? (
      <EmptyState />
    ) : (
      <StudentTable students={students} lessonRows={lessonRows} />
    )}
  </div>
)
```

### StudentTable.tsx — Drawer Pattern

```typescript
'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { formatScore, getScoreLevel } from '@/lib/utils'

export function StudentTable({ students, lessonRows }: {
  students: StudentSummary[]
  lessonRows: LessonRow[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedStudent = students.find(s => s.student_id === selectedId) ?? null
  const selectedLessons = lessonRows.filter(r => r.student_id === selectedId)

  return (
    <>
      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* header row */}
        {students.map(student => (
          <div
            key={student.student_id}
            onClick={() => setSelectedId(student.student_id)}
            className="... cursor-pointer hover:bg-slate-50 ..."
          >
            {/* existing row content */}
          </div>
        ))}
      </div>

      {/* Overlay + Drawer */}
      {selectedId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedId(null)}
          />

          {/* Drawer panel */}
          <div className="fixed right-0 top-0 h-full w-full md:w-[400px]
                          bg-white shadow-2xl z-50 overflow-y-auto
                          animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">
                  Progresso do aluno
                </p>
                <h2 className="text-lg font-black text-ms-dark">
                  {selectedStudent?.student_name ?? 'Aluno'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center
                           justify-center transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Per-lesson breakdown */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">
                Por aula ({selectedLessons.length} aulas)
              </p>
              {selectedLessons.map(lesson => {
                const level = getScoreLevel(lesson.avg_score ?? 0)
                return (
                  <div key={lesson.lesson_id}
                       className="bg-slate-50 rounded-xl px-4 py-3 flex items-center
                                  justify-between">
                    <div>
                      <p className="text-xs font-mono text-slate-400">
                        {lesson.lesson_id.slice(0, 8)}…
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lesson.modules_completed ?? 0} módulos feitos
                      </p>
                    </div>
                    <span className={`text-lg font-black ${level.color}`}>
                      {formatScore(lesson.avg_score ?? 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
```

### Animation Note
If `animate-slide-in-right` is not in `globals.css`, add it or use a Tailwind `translate-x` transition. Alternatively, use `framer-motion` (already installed: `framer-motion: ^11.15.0`) for a polished slide-in. Using Tailwind is preferred to keep it simple.

### Key Files
- `app/teacher/students/page.tsx` — modify: pass `lessonRows` to new `StudentTable`
- `app/teacher/students/StudentTable.tsx` — create: Client Component with click + drawer

## Tasks

- [x] **Task 1**: Update `page.tsx` to keep raw `lessonRows` and import `StudentTable`
  - [x] Define `LessonRow` interface (or move to a shared location)
  - [x] Keep `const lessonRows = rows ?? []` before aggregation loop
  - [x] Import `StudentTable` from `./StudentTable`
  - [x] Replace the inline table `<div>` render with `<StudentTable students={students} lessonRows={lessonRows} />`
  - [x] Keep Header + SummaryCards in Server Component (no change needed)
- [x] **Task 2**: Create `app/teacher/students/StudentTable.tsx`
  - [x] `'use client'` directive at top
  - [x] `useState<string | null>(null)` for `selectedId`
  - [x] Move table rows render here from `page.tsx`, add `onClick` + `cursor-pointer`
  - [x] Implement overlay (backdrop div) that closes drawer on click
  - [x] Implement drawer panel with student name header + close button
  - [x] Per-lesson list inside drawer using `lessonRows.filter(r => r.student_id === selectedId)`
  - [x] Close button (`<X>` icon from lucide-react) sets `selectedId` to null
- [x] **Task 3**: Style and verify
  - [x] Drawer slides in from right side (CSS transition or framer-motion)
  - [x] Mobile: drawer takes full width (`w-full`)
  - [x] Desktop: drawer is 400px wide (`md:w-[400px]`)
  - [x] Rows show score color-coded via `getScoreLevel()` (already in `lib/utils.ts`)
- [x] **Task 4**: Build check
  - [x] Run `npm run build` — zero TypeScript errors
  - [x] Run `npm run lint` — zero lint errors

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (via Dex @dev)

### Debug Log
- Exported `StudentSummary` and `LessonRow` interfaces from `page.tsx` so `StudentTable.tsx` can import them without circular dependency
- Drawer uses Tailwind `translate-x-0 transition-transform duration-300` — no framer-motion needed
- `LastActivity` helper duplicated into `StudentTable.tsx` (was previously in page.tsx as Server Component helper)

### Completion Notes
- `page.tsx`: Exported interfaces, kept `lessonRows = rows ?? []` before aggregation, replaced inline table div with `<StudentTable students={students} lessonRows={lessonRows} />`
- `StudentTable.tsx`: Full Client Component — clickable rows (cursor-pointer), overlay backdrop, 400px desktop drawer, full-width mobile, per-lesson score list with `getScoreLevel()` color coding, ✕ close button

### File List
- `app/teacher/students/page.tsx` — modify: exported interfaces, lessonRows passthrough, StudentTable import
- `app/teacher/students/StudentTable.tsx` — create: Client Component with click + drawer + overlay

### Change Log
- feat: Story 4.3 — Teacher Student Progress Drawer
