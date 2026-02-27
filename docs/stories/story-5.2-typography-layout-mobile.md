# Story 5.2 — Typography & Layout Mobile Fix (UX-02)

## Status
Done

## Story
**As a** student or teacher using the platform on any device,
**I want** readable body text and properly padded layouts on mobile,
**So that** content is legible and doesn't overflow or feel cramped on small screens.

## Acceptance Criteria
- [x]`globals.css`: body element uses `font-family: 'Inter', system-ui, sans-serif` (Big Shoulders Display remains only for `h1–h6` headings)
- [x]`app/student/dashboard/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8`
- [x]`app/student/progress/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8`
- [x]`app/teacher/dashboard/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8`
- [x]`app/teacher/analytics/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8` (if `p-8` present)
- [x]`app/teacher/students/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8` (if `p-8` present)
- [x]`app/teacher/lessons/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8` (if `p-8` present)
- [x]`app/student/lessons/page.tsx`: outer wrapper changes from `p-8` to `px-4 py-6 md:p-8` (if `p-8` present)
- [x]Student dashboard personal stats grid: `grid grid-cols-3` → `grid grid-cols-1 sm:grid-cols-3`
- [x]Student dashboard "por módulo" grid: `grid grid-cols-3` → `grid grid-cols-1 sm:grid-cols-3`
- [x]`LessonPlayer.tsx`: `max-w-3xl mx-auto px-4 py-6` unchanged (already correct)
- [x]Login page layout unchanged (uses its own layout without sidebar)
- [x]`npm run build` passes with no TypeScript errors
- [x]`npm run lint` passes with no errors

## Dev Notes

### Context (from Uma @ux-design-expert — UX-02)
Two compounding problems destroy the mobile layout:

**C-02: Body font is a display typeface.**
`globals.css` line 25 sets `font-family: 'Big Shoulders Display'` on the `body`. This condensed display font is unsuitable for paragraph text (lesson bullets, descriptions, labels). `Inter` is already configured as `font-sans` in `tailwind.config.ts` but barely used. Fix: reserve Big Shoulders Display for headings only.

**C-03: All page wrappers use `p-8` (32px all sides).**
With the sidebar consuming 256px on mobile, `p-8` on each side further reduces usable content width. Using `px-4 py-6` on mobile (16px horizontal, 24px vertical) and `md:p-8` on desktop maintains the desktop experience while unlocking proper mobile spacing.

**G-02: `grid-cols-3` without responsive breakpoints.**
Student dashboard stats use `grid grid-cols-3` with no breakpoint — creates three ~80px columns on mobile, each trying to render a card with `p-6`.

### Chosen Approach: Targeted CSS/Class Updates (No structural changes)

All fixes are single-line or two-line changes. No component restructuring needed.

### Fix 1: `globals.css` — Body Font

```css
/* BEFORE (line 24-26): */
body {
  @apply bg-ms-beige text-ms-dark antialiased;
  font-family: 'Big Shoulders Display', sans-serif;
}

/* AFTER: */
body {
  @apply bg-ms-beige text-ms-dark antialiased;
  font-family: 'Inter', system-ui, sans-serif;
}
```

> Note: `h1–h6` already have `font-family: 'Big Shoulders Display'` explicitly in globals.css — this remains intact. The change ONLY affects body/paragraph text.

### Fix 2: Page Wrapper Padding

For each page that has `<div className="p-8 max-w-...">`, change to:
```tsx
// BEFORE:
<div className="p-8 max-w-5xl mx-auto">
// AFTER:
<div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">
```

Pages to check and fix (run a grep for `p-8` in page.tsx files):
- `app/student/dashboard/page.tsx` ✓ confirmed `p-8`
- `app/student/progress/page.tsx` ✓ confirmed `p-8`
- `app/teacher/dashboard/page.tsx` ✓ confirmed `p-8`
- `app/teacher/analytics/page.tsx` — verify
- `app/teacher/students/page.tsx` — verify
- `app/teacher/lessons/page.tsx` — verify
- `app/student/lessons/page.tsx` — verify
- `app/teacher/upload/page.tsx` — verify
- `app/teacher/settings/page.tsx` — verify
- `app/student/settings/page.tsx` — verify

### Fix 3: Student Dashboard Stats Grids

```tsx
// app/student/dashboard/page.tsx — Stats pessoais (line ~74)
// BEFORE:
<div className="grid grid-cols-3 gap-4 mb-8">
// AFTER:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

// Por módulo section (line ~114)
// BEFORE:
<div className="grid grid-cols-3 gap-4">
// AFTER:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

### Key Files
- `app/globals.css` — modify: body font-family
- `app/student/dashboard/page.tsx` — modify: padding + 2× grid responsivo
- `app/student/progress/page.tsx` — modify: padding
- `app/teacher/dashboard/page.tsx` — modify: padding
- `app/teacher/analytics/page.tsx` — modify: padding (verify if present)
- `app/teacher/students/page.tsx` — modify: padding (verify if present)
- `app/teacher/lessons/page.tsx` — modify: padding (verify if present)
- `app/student/lessons/page.tsx` — modify: padding (verify if present)
- Other `page.tsx` files — modify: padding if `p-8` found

## Tasks

- [x]**Task 1**: Fix body font in `app/globals.css`
  - [x]Change `font-family: 'Big Shoulders Display', sans-serif` in `body` rule to `font-family: 'Inter', system-ui, sans-serif`
  - [x]Verify `h1–h6` rule still has `font-family: 'Big Shoulders Display', sans-serif` (do NOT change this)
- [x]**Task 2**: Audit all `page.tsx` files for `p-8` wrapper
  - [x]Search for `p-8` in all page.tsx files under `app/` (excluding login which has its own layout)
  - [x]Change each found instance from `p-8` to `px-4 py-6 md:p-8`
  - [x]Confirmed files: `student/dashboard`, `student/progress`, `teacher/dashboard`
  - [x]Additional files to check: analytics, students, lessons (teacher+student), upload, settings
- [x]**Task 3**: Fix student dashboard stats grids
  - [x]In `app/student/dashboard/page.tsx`: change both `grid grid-cols-3` to `grid grid-cols-1 sm:grid-cols-3`
  - [x]First grid: "Stats pessoais" section (~line 74)
  - [x]Second grid: "Por módulo" section inside the ms-card (~line 114)
- [x]**Task 4**: Build and verify
  - [x]Run `npm run build` — zero TypeScript errors
  - [x]Run `npm run lint` — zero errors
  - [x]Visual check: body text on lesson content uses Inter (clean, readable)
  - [x]Visual check: stats cards stack vertically on narrow viewport, 3-col on sm+

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5

### Debug Log
No issues. Found and updated 9 page.tsx files with p-8 → px-4 py-6 md:p-8: student/dashboard, student/progress, student/lessons, student/settings, teacher/dashboard, teacher/analytics, teacher/students, teacher/lessons, teacher/upload, teacher/settings.

### Completion Notes
All tasks completed. Body font changed from Big Shoulders Display to Inter in globals.css (h1-h6 retained Big Shoulders). Responsive padding applied to 10 page wrappers. Two grid-cols-3 → grid-cols-1 sm:grid-cols-3 in student dashboard (stats pessoais + desempenho por módulo). Build passes with zero TypeScript errors.

### File List
- `app/globals.css` — modify: body font
- `app/student/dashboard/page.tsx` — modify: padding + 2 responsive grids
- `app/student/progress/page.tsx` — modify: padding
- `app/student/lessons/page.tsx` — modify: padding
- `app/student/settings/page.tsx` — modify: padding
- `app/teacher/dashboard/page.tsx` — modify: padding
- `app/teacher/analytics/page.tsx` — modify: padding
- `app/teacher/students/page.tsx` — modify: padding
- `app/teacher/lessons/page.tsx` — modify: padding
- `app/teacher/upload/page.tsx` — modify: padding
- `app/teacher/settings/page.tsx` — modify: padding

### Change Log
- feat: Story 5.2 — Typography & Layout Mobile Fix (UX-02)
