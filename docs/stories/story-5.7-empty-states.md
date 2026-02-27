# Story 5.7 — Empty States Premium (UX-07)

## Status
Done

## Story
**As a** student or teacher seeing an empty section for the first time,
**I want** to see a meaningful, branded empty state with clear guidance,
**So that** the moment of "no data" feels welcoming and helps me understand what to do next, instead of seeing a lone emoji floating in white space.

## Acceptance Criteria
- [x]`components/ui/EmptyState.tsx` created: reusable component with SVG illustration, title, description, and optional CTA button
- [x]Component accepts props: `illustration: 'lessons' | 'progress' | 'students' | 'activity'`, `title: string`, `description: string`, `ctaLabel?: string`, `ctaHref?: string`
- [x]Each illustration is an inline SVG using design system colors: `ms-dark` (#023d52), `ms-medium` (#267189), `ms-gold` (#cea66f), `ms-beige` (#f3eee7)
- [x]Student dashboard — empty lessons: replaced with `<EmptyState illustration="lessons" title="Nenhuma aula disponível" description="Aguarde o professor publicar o conteúdo" />`
- [x]Student progress — no activity: replaced with `<EmptyState illustration="progress" title="Nenhuma atividade ainda" description="Complete módulos nas aulas para ver seu progresso aqui." ctaLabel="Começar agora" ctaHref="/student/lessons" />`
- [x]Teacher dashboard — empty lessons: replaced with `<EmptyState illustration="lessons" title="Nenhuma aula criada ainda" description="Importe um PPT para gerar sua primeira aula" ctaLabel="Enviar apresentação" ctaHref="/teacher/upload" />`
- [x]Teacher dashboard — empty recent activity: replaced with `<EmptyState illustration="activity" title="Nenhuma atividade ainda" description="Aparecerá aqui quando alunos completarem módulos" />`
- [x]Teacher students — empty drawer (no lessons for student): uses EmptyState inline within drawer
- [x]All replaced emoji-only empty states removed
- [x]`npm run build` passes with no TypeScript errors
- [x]`npm run lint` passes with no errors

## Dev Notes

### Context (from Uma @ux-design-expert — UX-07)
Empty states are high-value emotional moments. When a user sees a section with no data, a lone emoji on a white background communicates nothing about what the product does or what the user should do next. Premium apps (Linear, Notion, Duolingo) use contextual illustrations with their brand colors and clear directional copy.

This story creates 4 distinct inline SVG illustrations — kept intentionally simple/geometric so a developer can implement them cleanly without a dedicated design tool. Each SVG uses only basic shapes (circles, rectangles, paths) in the brand color palette.

### Chosen Approach: Inline SVG Illustrations in a Reusable Component

Inline SVGs (not `<img>` tags) allow the colors to be controlled via props or CSS variables, and render consistently across all platforms with no HTTP request. Keep each illustration under 20 lines of SVG.

### Component Design: `components/ui/EmptyState.tsx`

```tsx
// components/ui/EmptyState.tsx
'use client'

import Link from 'next/link'

type IllustrationType = 'lessons' | 'progress' | 'students' | 'activity'

interface EmptyStateProps {
  illustration: IllustrationType
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

export function EmptyState({
  illustration,
  title,
  description,
  ctaLabel,
  ctaHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="flex justify-center mb-4">
        <IllustrationComponent type={illustration} />
      </div>
      <h3 className="text-ms-dark font-black text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm font-semibold max-w-xs mx-auto mb-5">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     ms-gradient-bg text-white font-black text-sm
                     hover:opacity-90 transition-opacity"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  )
}

function IllustrationComponent({ type }: { type: IllustrationType }) {
  const illustrations: Record<IllustrationType, React.ReactNode> = {
    lessons:  <LessonsIllustration />,
    progress: <ProgressIllustration />,
    students: <StudentsIllustration />,
    activity: <ActivityIllustration />,
  }
  return <>{illustrations[type]}</>
}
```

### SVG Illustrations (brand colors, geometric, simple)

```tsx
// Lessons — open book with bookmark
function LessonsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Book body */}
      <rect x="12" y="20" width="26" height="40" rx="3" fill="#5e96a7" opacity="0.3" />
      <rect x="42" y="20" width="26" height="40" rx="3" fill="#267189" opacity="0.4" />
      {/* Spine */}
      <rect x="38" y="18" width="4" height="44" rx="2" fill="#023d52" />
      {/* Gold bookmark */}
      <polygon points="55,20 62,20 62,35 58.5,32 55,35" fill="#cea66f" />
      {/* Lines */}
      <rect x="16" y="30" width="16" height="2" rx="1" fill="#023d52" opacity="0.25" />
      <rect x="16" y="36" width="12" height="2" rx="1" fill="#023d52" opacity="0.20" />
      <rect x="16" y="42" width="16" height="2" rx="1" fill="#023d52" opacity="0.25" />
    </svg>
  )
}

// Progress — bar chart going up
function ProgressIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Bars */}
      <rect x="12" y="52" width="14" height="18" rx="3" fill="#5e96a7" opacity="0.5" />
      <rect x="33" y="38" width="14" height="32" rx="3" fill="#267189" opacity="0.6" />
      <rect x="54" y="22" width="14" height="48" rx="3" fill="#023d52" opacity="0.7" />
      {/* Gold star on top bar */}
      <circle cx="61" cy="18" r="6" fill="#cea66f" />
      <text x="61" y="22" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">★</text>
    </svg>
  )
}

// Students — two person silhouettes
function StudentsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Person 1 */}
      <circle cx="30" cy="28" r="10" fill="#5e96a7" opacity="0.5" />
      <path d="M12 62 C12 50 48 50 48 62" fill="#5e96a7" opacity="0.4" />
      {/* Person 2 */}
      <circle cx="52" cy="24" r="10" fill="#023d52" opacity="0.6" />
      <path d="M34 62 C34 48 70 48 70 62" fill="#267189" opacity="0.5" />
      {/* Gold dot (active indicator) */}
      <circle cx="58" cy="16" r="5" fill="#cea66f" />
    </svg>
  )
}

// Activity — lightning bolt / pulse
function ActivityIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Pulse wave */}
      <path
        d="M8 40 L20 40 L26 25 L32 55 L38 30 L44 50 L50 40 L72 40"
        stroke="#267189" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        fill="none" opacity="0.7"
      />
      {/* Gold highlight dot on peak */}
      <circle cx="38" cy="30" r="5" fill="#cea66f" />
      {/* Background circle */}
      <circle cx="40" cy="40" r="34" stroke="#5e96a7" strokeWidth="1.5" opacity="0.2" />
    </svg>
  )
}
```

### Usage Examples

```tsx
// Student dashboard — empty lessons
<EmptyState
  illustration="lessons"
  title="Nenhuma aula disponível ainda"
  description="Aguarde o professor publicar o conteúdo"
/>

// Student progress — no data
<EmptyState
  illustration="progress"
  title="Nenhuma atividade ainda"
  description="Complete módulos nas aulas para ver seu progresso aqui."
  ctaLabel="Começar agora"
  ctaHref="/student/lessons"
/>

// Teacher dashboard — empty lessons
<EmptyState
  illustration="lessons"
  title="Nenhuma aula criada ainda"
  description="Importe um PPT para gerar sua primeira aula"
  ctaLabel="Enviar apresentação"
  ctaHref="/teacher/upload"
/>

// Teacher dashboard — empty activity
<EmptyState
  illustration="activity"
  title="Nenhuma atividade ainda"
  description="Aparecerá aqui quando alunos completarem módulos"
/>
```

### Key Files
- `components/ui/EmptyState.tsx` — create: reusable empty state component with 4 SVG illustrations
- `app/student/dashboard/page.tsx` — modify: replace empty lessons block with `<EmptyState>`
- `app/student/progress/page.tsx` — modify: replace empty state block with `<EmptyState>`
- `app/teacher/dashboard/page.tsx` — modify: replace `EmptyLessons` component and empty activity with `<EmptyState>`
- `app/teacher/students/StudentTable.tsx` — modify: replace empty drawer state with `<EmptyState>`

## Tasks

- [x]**Task 1**: Create `components/ui/EmptyState.tsx`
  - [x]Define `IllustrationType` and `EmptyStateProps` interfaces
  - [x]Implement main `EmptyState` component with SVG area + title + description + optional CTA
  - [x]Implement `LessonsIllustration` SVG (book with bookmark)
  - [x]Implement `ProgressIllustration` SVG (bar chart + star)
  - [x]Implement `StudentsIllustration` SVG (two person silhouettes)
  - [x]Implement `ActivityIllustration` SVG (pulse wave)
  - [x]CTA uses `ms-gradient-bg text-white` button (matching existing style)
- [x]**Task 2**: Update `app/student/dashboard/page.tsx`
  - [x]Import `EmptyState` from `@/components/ui/EmptyState`
  - [x]Replace empty lessons section (`text-5xl + p tags`) with `<EmptyState illustration="lessons" ... />`
- [x]**Task 3**: Update `app/student/progress/page.tsx`
  - [x]Import `EmptyState`
  - [x]Replace empty state section with `<EmptyState illustration="progress" ... ctaLabel="Começar agora" ctaHref="/student/lessons" />`
- [x]**Task 4**: Update `app/teacher/dashboard/page.tsx`
  - [x]Import `EmptyState`
  - [x]Remove existing `EmptyLessons` sub-component function
  - [x]Replace `<EmptyLessons />` usage with `<EmptyState illustration="lessons" ... ctaLabel="Enviar apresentação" ctaHref="/teacher/upload" />`
  - [x]Replace empty activity section with `<EmptyState illustration="activity" ... />`
- [x]**Task 5**: Update `app/teacher/students/StudentTable.tsx`
  - [x]Import `EmptyState`
  - [x]Replace empty drawer lessons paragraph with `<EmptyState illustration="activity" title="Nenhuma aula" description="Este aluno ainda não completou nenhuma atividade" className="py-6" />`
- [x]**Task 6**: Build and verify
  - [x]Run `npm run build` — zero TypeScript errors
  - [x]Run `npm run lint` — zero errors
  - [x]Visual check: empty state renders with illustration, title, and description
  - [x]Visual check: CTA button works and navigates correctly

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5

### Debug Log
Teacher dashboard required removing the existing EmptyLessons sub-component function (lines ~258-277) after adding EmptyState. Also removed Upload from lucide imports since it was only used by the removed function. The replace_all on teacher dashboard was done in two separate edits (lessons empty state + activity empty state) with a re-read in between.

### Completion Notes
EmptyState.tsx created with 4 SVG inline illustrations (lessons: open book + bookmark, progress: bar chart + star, students: two silhouettes, activity: pulse wave) using brand colors (ms-dark #023d52, ms-medium #267189, ms-gold #cea66f, ms-beige #f3eee7). Integrated into: student dashboard (empty lessons), student progress (empty activity + CTA), teacher dashboard (empty lessons + empty activity, removed old EmptyLessons function), teacher StudentTable drawer (empty lesson breakdown). Build passes with zero TypeScript errors.

### File List
- `components/ui/EmptyState.tsx` — create
- `app/student/dashboard/page.tsx` — modify
- `app/student/progress/page.tsx` — modify
- `app/teacher/dashboard/page.tsx` — modify
- `app/teacher/students/StudentTable.tsx` — modify

### Change Log
- feat: Story 5.7 — Empty States Premium (UX-07)
