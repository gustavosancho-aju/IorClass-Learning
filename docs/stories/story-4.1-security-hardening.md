# Story 4.1 — Security Hardening (SEC-01 + SEC-04)

## Status
Ready for Review

## Story
**As a** system administrator,
**I want** all API routes and Server Actions to enforce role-based authorization explicitly,
**So that** an authenticated student cannot trigger teacher-only operations, even if they discover internal endpoint IDs.

## Acceptance Criteria
- [ ] `POST /api/process-ppt` returns HTTP 403 if the authenticated user's role is not `teacher`
- [ ] `POST /api/process-ppt` still returns HTTP 401 if the user is not authenticated at all
- [ ] Server Action `togglePublish` in `/teacher/lessons` verifies `getUser()` explicitly before updating
- [ ] Server Action `togglePublish` verifies the lesson's `created_by` matches the current user's ID before updating
- [ ] A student session calling `POST /api/process-ppt` with a valid `pptUploadId` receives `{ error: 'Forbidden' }` with status 403
- [ ] All existing teacher functionality continues to work correctly after the changes
- [ ] `npm run build` passes with no TypeScript errors

## Dev Notes

### Context (from Quinn @qa — SEC-01 and SEC-04)
Two security gaps identified in the QA audit:

**SEC-01** — `/api/process-ppt/route.ts`:
The endpoint checks `if (!user)` (authentication) but NOT role. Since the upload record fetch uses `createAdminClient()` which bypasses RLS, any authenticated user (including students) can trigger PPT processing by providing a known `pptUploadId`.

**SEC-04** — `app/teacher/lessons/page.tsx` `togglePublish` Server Action:
The Server Action relies 100% on RLS for protection with no explicit `getUser()` guard. If RLS is ever misconfigured, this becomes an open endpoint.

### Fix for SEC-01

**File:** `app/api/process-ppt/route.ts`

After the existing auth check (line ~35), add role verification:

```typescript
/* ── 2. Auth check (user client — respeita RLS) ─────────────── */
const supabase      = createClient()
const supabaseAdmin = createAdminClient()

const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ── NEW: Role check — only teachers can process PPTs ──────────
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'teacher') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
// ─────────────────────────────────────────────────────────────
```

### Fix for SEC-04

**File:** `app/teacher/lessons/page.tsx`

Replace the existing `togglePublish` Server Action:

```typescript
async function togglePublish(lessonId: string, current: boolean) {
  'use server'
  const supabase = createClient()

  // Explicit auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  // Ownership check — only the lesson creator can toggle
  const { data: lesson } = await supabase
    .from('lessons')
    .select('created_by')
    .eq('id', lessonId)
    .single()

  if (lesson?.created_by !== user.id) throw new Error('Forbidden')

  await supabase
    .from('lessons')
    .update({ is_published: !current })
    .eq('id', lessonId)

  revalidatePath('/teacher/lessons')
}
```

### Key Files to Modify
- `app/api/process-ppt/route.ts` — add role check after existing auth check (~line 35)
- `app/teacher/lessons/page.tsx` — replace `togglePublish` Server Action (~lines 7–15)

### No New Dependencies
Both fixes use existing `createClient()` and the `profiles` table already queried in middleware. No new packages needed.

### Testing Notes
- Manually test: login as student → call `POST /api/process-ppt` → expect 403
- Manually test: login as teacher → toggle lesson publish → still works
- Check browser console for no new errors

## Tasks

- [x] **Task 1**: Fix SEC-01 — add role check in `/api/process-ppt`
  - [x] After `supabase.auth.getUser()` check, query `profiles` for current user's role
  - [x] If `role !== 'teacher'`, return `{ error: 'Forbidden' }` with status 403
  - [x] Preserve existing flow for authenticated teachers
- [x] **Task 2**: Fix SEC-04 — harden `togglePublish` Server Action
  - [x] Add `supabase.auth.getUser()` call at the top of `togglePublish`
  - [x] Throw `Error('Unauthorized')` if no user
  - [x] Query lesson's `created_by` and throw `Error('Forbidden')` if mismatch
- [x] **Task 3**: Verify no regressions
  - [x] Login as teacher → navigate to `/teacher/lessons` → toggle a lesson → verify it works
  - [x] Run `npm run build` — zero TypeScript errors
  - [x] Run `npm run lint` — zero lint errors

## QA Results
*(To be filled by @qa after dev completion)*

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (via Dex @dev)

### Debug Log
- ESLint config (.eslintrc.json) did not exist in project — created with `next/core-web-vitals` + `@typescript-eslint/recommended`
- Pre-existing unused imports/vars in 6 files caused lint errors — all fixed as part of this story
- `@typescript-eslint/no-unused-vars` configured with `argsIgnorePattern/varsIgnorePattern: ^_` to allow intentional `_` prefix

### Completion Notes
- SEC-01: Added role check (profiles.role !== 'teacher' → 403 Forbidden) in `app/api/process-ppt/route.ts` after existing auth check
- SEC-04: Replaced bare `togglePublish` Server Action with hardened version that includes `getUser()` + `created_by` ownership check
- Also initialized ESLint config and fixed 6 pre-existing unused-import issues across the codebase

### File List
- `app/api/process-ppt/route.ts` — modify: added role check after auth check
- `app/teacher/lessons/page.tsx` — modify: replaced togglePublish with hardened version
- `.eslintrc.json` — create: ESLint config (next/core-web-vitals + @typescript-eslint/recommended)
- `app/student/lessons/page.tsx` — fix: removed unused BookOpen import
- `app/student/progress/page.tsx` — fix: removed unused Trophy/Target/Flame imports
- `app/teacher/analytics/page.tsx` — fix: prefixed unused `best` param with `_`
- `app/teacher/dashboard/page.tsx` — fix: removed unused `user` destructuring
- `app/teacher/lessons/[lessonId]/ProcessButton.tsx` — fix: prefixed unused `lessonId` with `_`
- `app/teacher/students/page.tsx` — fix: removed unused Clock import

### Change Log
- fix: Story 4.1 — Security Hardening (SEC-01 + SEC-04) + ESLint setup
