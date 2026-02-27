# Story 5.6 — SVG Logomark (UX-06)

## Status
Blocked

## Story
**As a** student or teacher visiting the platform,
**I want** to see a professional vector logomark that represents the Master Speaking brand,
**So that** the platform conveys the premium professional identity it promises, instead of using system emojis.

## Acceptance Criteria
- [ ] `public/logo.svg` exists: white/light variant for use on dark/teal backgrounds
- [ ] `public/logo-dark.svg` exists: dark variant (`ms-dark` #023d52) for use on light backgrounds
- [ ] `components/layout/Logo.tsx` created: accepts `variant: 'white' | 'dark'` and `size: number` props
- [ ] `Sidebar.tsx`: replaces `<span className="text-2xl">💬</span><span className="text-2xl">🪽</span>` with `<Logo variant="white" size={36} />`
- [ ] `app/(auth)/login/page.tsx`: replaces emoji logo block with `<Logo variant="white" size={56} />`
- [ ] Wordmark text "MASTER SPEAKING" remains in Big Shoulders Display (unchanged)
- [ ] Logo renders consistently across iOS/Android/Windows/macOS (no emoji rendering differences)
- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run lint` passes with no errors

## Dev Notes

### ⚠️ BLOCKED — Design Asset Required

This story requires professionally designed SVG assets as a prerequisite. A programmatically generated SVG logo would not meet the visual quality bar expected for a "Professional English Platform."

**To unblock this story:**
1. Create `public/logo.svg` (white variant, for dark/teal backgrounds)
2. Create `public/logo-dark.svg` (dark variant, for light backgrounds)

**Design brief for the logomark:**
- Must combine the "speech/communication" concept and "excellence/wings" concept (currently represented by 💬 and 🪽 emojis)
- Brand colors: `ms-dark` (#023d52), `ms-gold` (#cea66f)
- White variant: logo in white (#FFFFFF) for use over teal gradient backgrounds
- Should work at 36px (sidebar) and 56px (login) sizes — keep it simple/geometric
- Suggested tools: Figma, Illustrator, or generate with v0/Midjourney + manual cleanup

### Implementation Plan (post-unblock)

Once SVG assets are available, implementation is straightforward:

**1. `components/layout/Logo.tsx` (new component)**
```tsx
// components/layout/Logo.tsx
interface LogoProps {
  variant?: 'white' | 'dark'
  size?: number
  className?: string
}

export function Logo({ variant = 'white', size = 36, className }: LogoProps) {
  const src = variant === 'white' ? '/logo.svg' : '/logo-dark.svg'
  return (
    <img
      src={src}
      alt="Master Speaking"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
```

> Alternative: inline SVG via `next/image` for better performance, or inline the SVG paths directly in the component for zero-flash rendering.

**2. Sidebar.tsx update**
```tsx
// REMOVE:
<div className="flex items-center gap-2 mb-1">
  <span className="text-2xl">💬</span>
  <span className="text-2xl">🪽</span>
</div>

// ADD:
import { Logo } from '@/components/layout/Logo'
<Logo variant="white" size={36} className="mb-1" />
```

**3. Login page update**
```tsx
// REMOVE:
<div className="inline-flex items-center gap-2 mb-4">
  <span className="text-5xl">💬</span>
  <span className="text-5xl">🪽</span>
</div>

// ADD:
import { Logo } from '@/components/layout/Logo'
<Logo variant="white" size={56} className="mb-4" />
```

### Key Files
- `public/logo.svg` — **REQUIRED ASSET** (blocked on design)
- `public/logo-dark.svg` — **REQUIRED ASSET** (blocked on design)
- `components/layout/Logo.tsx` — create: Logo component
- `components/layout/Sidebar.tsx` — modify: replace emoji logo
- `app/(auth)/login/page.tsx` — modify: replace emoji logo

## Tasks

> **All tasks blocked until `public/logo.svg` and `public/logo-dark.svg` are provided**

- [ ] **PREREQUISITE**: Obtain `public/logo.svg` (white, for teal backgrounds) from design
- [ ] **PREREQUISITE**: Obtain `public/logo-dark.svg` (dark, for light backgrounds) from design
- [ ] **Task 1**: Create `components/layout/Logo.tsx` component
- [ ] **Task 2**: Update `components/layout/Sidebar.tsx` — replace emoji block with `<Logo>`
- [ ] **Task 3**: Update `app/(auth)/login/page.tsx` — replace emoji block with `<Logo>`
- [ ] **Task 4**: Build and verify
  - [ ] Run `npm run build` — zero TypeScript errors
  - [ ] Run `npm run lint` — zero errors
  - [ ] Visual check: logo renders correctly in sidebar and login page

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record
*(To be filled after unblocking)*

### Change Log
- feat: Story 5.6 — SVG Logomark (UX-06)
