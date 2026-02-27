# Story 5.3 — Accessibility: Touch Targets & Color Contrast (UX-03)

## Status
Done

## Story
**As a** student or teacher using the platform on a touchscreen,
**I want** all interactive elements to be large enough to tap accurately and text to have sufficient contrast,
**So that** the platform meets accessibility standards and is comfortable to use on any device.

## Acceptance Criteria
- [x]Sidebar icon containers: `w-8 h-8` (32px) → `w-10 h-10` (40px) — acceptable with surrounding nav-link padding bringing effective hit area to ≥ 44px
- [x]Eye/password toggle button in Login: wrapped in a `p-2` container so effective tap area is ≥ 40×40px
- [x]Close button (X) in `StudentTable` drawer: `w-8 h-8` (32px) → `w-10 h-10` (40px)
- [x]"Anterior" / "Próximo" navigation buttons in `ResumoTab`: `py-2` → `py-2.5` minimum (targeting ≥ 40px)
- [x]TTS "Ouvir" / "Parar" button in `ResumoTab`: `py-2` → `py-2.5` minimum
- [x]`bg-ms-light` background on "Frase-alvo" and "Melhor pontuação" cards in `OratorioTab`: replaced with `bg-ms-beige` (cream, WCAG contrast ≥ 4.5:1 with `text-ms-dark`)
- [x]`bg-ms-light` background on "Frase-alvo" card in `ResumoTab`: replaced with `bg-ms-beige`
- [x]`OratorioTab` score colors (result state): inline `text-green-500`, `text-amber-500`, `text-red-500` → unified using `getScoreLevel(score).color` from `lib/utils.ts`
- [x]`OratorioTab` score bar: `bg-green-400`, `bg-amber-400`, `bg-red-400` → `bg-emerald-500`, `bg-ms-medium`, `bg-amber-500` (consistent with design system)
- [x]No regression in visual appearance — changes are subtle, existing design maintained
- [x]`npm run build` passes with no TypeScript errors
- [x]`npm run lint` passes with no errors

## Dev Notes

### Context (from Uma @ux-design-expert — UX-03)
Three distinct accessibility issues are combined in this story:

**G-01: Touch targets below 44px (WCAG 2.5.5)**
WCAG Success Criterion 2.5.5 requires interactive elements to have a minimum 44×44px target size. Several elements currently use `w-8 h-8` (32px) containers — below the minimum. Since complete refactors of icon button sizes can have ripple effects, we use a combination of size increases and padding wrappers.

**G-03: Insufficient contrast — `bg-ms-light` (#5e96a7) as text background**
The `bg-ms-light` color (`#5e96a7`) used as a card background with `text-ms-dark` (`#023d52`) yields a contrast ratio of approximately 3.2:1, failing WCAG AA's 4.5:1 requirement for normal text. Fix: use `bg-ms-beige` (`#f3eee7`) which achieves > 7:1 contrast with `text-ms-dark`.

**M-03: Score color inconsistency in OratorioTab**
The result view uses inline Tailwind classes (`text-green-500`, `text-amber-500`, `text-red-500`) that diverge from the design system's `getScoreLevel()` utility. This causes different shades of "good" across the app. Unify by using the utility consistently.

### Chosen Approach: Targeted Surgical Fixes

Each fix is isolated to its component. No structural changes — only class name modifications.

### Fix 1: Sidebar icon containers

```tsx
// components/layout/Sidebar.tsx
// BEFORE (~line 98):
<span className={cn(
  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
  isActive ? 'bg-ms-gold/20 text-ms-gold' : 'text-white/50'
)}>

// AFTER:
<span className={cn(
  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
  isActive ? 'bg-ms-gold/20 text-ms-gold' : 'text-white/50'
)}>

// Also bottom section Settings icon (~line 124):
// BEFORE:
<span className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50">
// AFTER:
<span className="w-10 h-10 rounded-lg flex items-center justify-center text-white/50">

// And LogOut icon (~line 134):
// BEFORE:
<span className="w-8 h-8 rounded-lg flex items-center justify-center">
// AFTER:
<span className="w-10 h-10 rounded-lg flex items-center justify-center">
```

### Fix 2: Eye toggle in Login

```tsx
// app/(auth)/login/page.tsx — password eye toggle (~line 104)
// BEFORE:
<button
  type="button"
  onClick={() => setShowPwd(v => !v)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40
             hover:text-white/80 transition-colors"
>
  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
</button>

// AFTER:
<button
  type="button"
  onClick={() => setShowPwd(v => !v)}
  className="absolute right-2 top-1/2 -translate-y-1/2 p-2
             text-white/40 hover:text-white/80 transition-colors
             rounded-lg"
  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
>
  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
</button>
```

### Fix 3: Close button in StudentTable

```tsx
// app/teacher/students/StudentTable.tsx — close button (~line 117)
// BEFORE:
<button
  onClick={() => setSelectedId(null)}
  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center
             justify-center transition-colors"
  aria-label="Fechar"
>

// AFTER:
<button
  onClick={() => setSelectedId(null)}
  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center
             justify-center transition-colors"
  aria-label="Fechar"
>
```

### Fix 4: ResumoTab navigation buttons + bg-ms-light

```tsx
// app/student/lessons/[lessonId]/tabs/ResumoTab.tsx

// Navigation buttons — Anterior (~line 179) and Próximo (~line 194):
// BEFORE: className="... px-4 py-2 ..."
// AFTER:  className="... px-4 py-2.5 ..."

// TTS button (~line 164):
// BEFORE: className="... px-4 py-2 ..."
// AFTER:  className="... px-4 py-2.5 ..."

// Frase-alvo background (in Header sub-component):
// BEFORE: className="bg-ms-light rounded-xl px-4 py-3"
// AFTER:  className="bg-ms-beige rounded-xl px-4 py-3"
```

### Fix 5: OratorioTab score colors unification

```tsx
// app/student/lessons/[lessonId]/tabs/OratorioTab.tsx

// Score display in result view (~line 285):
// BEFORE:
className={cn(
  'text-4xl font-black',
  score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
)}
// AFTER:
className={cn(
  'text-4xl font-black',
  getScoreLevel(score).color  // uses design system utility
)}

// Score bar colors (~line 303):
// BEFORE:
className={cn(
  'h-full rounded-full transition-all duration-700',
  score >= 80 ? 'bg-green-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
)}
// AFTER:
className={cn(
  'h-full rounded-full transition-all duration-700',
  score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-ms-medium' : 'bg-amber-500'
)}

// Idle view — "Melhor pontuação" background (~line 409):
// BEFORE: className="bg-ms-light rounded-xl ..."
// AFTER:  className="bg-ms-beige rounded-xl ..."

// Score color in idle view (~line 411):
// BEFORE:
className={cn(
  'text-lg font-black',
  score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
)}
// AFTER:
className={cn('text-lg font-black', getScoreLevel(score).color)}

// Frase-alvo in Header (shared sub-component, ~line 455):
// BEFORE: className="bg-ms-light rounded-xl px-4 py-3"
// AFTER:  className="bg-ms-beige rounded-xl px-4 py-3"
```

> Note: `getScoreLevel` is already imported via `import { cn } from '@/lib/utils'` — add `getScoreLevel` to the import.

### Key Files
- `components/layout/Sidebar.tsx` — modify: 3× icon container size w-8→w-10
- `app/(auth)/login/page.tsx` — modify: eye toggle wrapper + aria-label
- `app/teacher/students/StudentTable.tsx` — modify: close button size
- `app/student/lessons/[lessonId]/tabs/ResumoTab.tsx` — modify: button padding + bg-ms-light
- `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx` — modify: score colors + bg-ms-light

## Tasks

- [x]**Task 1**: Fix sidebar icon container sizes in `components/layout/Sidebar.tsx`
  - [x]Nav item icon container: `w-8 h-8` → `w-10 h-10` (in nav loop)
  - [x]Settings icon container: `w-8 h-8` → `w-10 h-10`
  - [x]LogOut icon container: `w-8 h-8` → `w-10 h-10`
- [x]**Task 2**: Fix eye toggle in `app/(auth)/login/page.tsx`
  - [x]Add `p-2 rounded-lg` to toggle button
  - [x]Adjust `right-3` → `right-2` to compensate for padding
  - [x]Add `aria-label` for screen reader support
- [x]**Task 3**: Fix close button in `app/teacher/students/StudentTable.tsx`
  - [x]Change `w-8 h-8` → `w-10 h-10` on close button
- [x]**Task 4**: Fix ResumoTab in `app/student/lessons/[lessonId]/tabs/ResumoTab.tsx`
  - [x]"Anterior" button: `py-2` → `py-2.5`
  - [x]"Próximo" button: `py-2` → `py-2.5`
  - [x]TTS "Ouvir"/"Parar" button: `py-2` → `py-2.5`
  - [x]Header's "Frase-alvo" card: `bg-ms-light` → `bg-ms-beige`
- [x]**Task 5**: Unify score colors in `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx`
  - [x]Add `getScoreLevel` to import from `@/lib/utils`
  - [x]Result view score text: replace ternary with `getScoreLevel(score).color`
  - [x]Result view score bar: replace ternary with consistent colors (emerald-500 / ms-medium / amber-500)
  - [x]Idle view "Melhor pontuação" background: `bg-ms-light` → `bg-ms-beige`
  - [x]Idle view score text: replace ternary with `getScoreLevel(score).color`
  - [x]Header "Frase-alvo" background: `bg-ms-light` → `bg-ms-beige`
- [x]**Task 6**: Build and verify
  - [x]Run `npm run build` — zero TypeScript errors
  - [x]Run `npm run lint` — zero errors
  - [x]Visual check: "Frase-alvo" and "Melhor pontuação" cards show cream/beige background

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5

### Debug Log
No issues. ResumoTab: py-2 changed to py-2.5 on 3 buttons (TTS, Anterior, Próximo). OratorioTab: confirmed getScoreLevel was exported from lib/utils, added to imports alongside cn. Note: bg-ms-light used as background in OratorioTab Header was in a separate sub-component at the bottom of the file.

### Completion Notes
All accessibility fixes applied. Sidebar: 3 icon containers w-8→w-10 (nav loop, Settings, LogOut). Login: eye toggle wrapped with p-2 rounded-lg + aria-label. StudentTable: close button w-8→w-10. ResumoTab: 3 buttons py-2→py-2.5, Frase-alvo bg-ms-light→bg-ms-beige. OratorioTab: imported getScoreLevel, unified 2 score text colors, updated score bar colors to emerald-500/ms-medium/amber-500, replaced 2 bg-ms-light with bg-ms-beige. Build passes with zero TypeScript errors.

### File List
- `components/layout/Sidebar.tsx` — modify: icon container sizes
- `app/(auth)/login/page.tsx` — modify: eye toggle
- `app/teacher/students/StudentTable.tsx` — modify: close button
- `app/student/lessons/[lessonId]/tabs/ResumoTab.tsx` — modify: buttons + bg
- `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx` — modify: score colors + bg

### Change Log
- feat: Story 5.3 — Accessibility: Touch Targets & Color Contrast (UX-03)
