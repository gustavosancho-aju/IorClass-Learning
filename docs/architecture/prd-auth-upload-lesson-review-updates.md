# PRD: Auth, Upload Security, Publishing Guards, and Lesson Review

## Status

Implemented and deployed to production.

Relevant production commits:

- `a3ea6f4` - Fix auth redirect/email flows, secure upload ownership, and middleware role fallback
- `fe67c32` - Fix production magic link redirect base
- `8fd9119` - Normalize auth redirect base before localhost guard
- `e4c8289` - Harden lesson publishing and PPT processing flows
- `3ea9846` - Add teacher review editor for generated lesson content

Production URL:

- `https://master-speaking-lms.vercel.app`

## Background

The Master Speaking LMS needed hardening across authentication redirects, lesson upload ownership, PPT processing safety, lesson publishing, and teacher review of AI-generated content.

Before these updates, the system could generate auth links pointing to `localhost`, trusted some client-provided upload ownership fields, allowed repeated PPT processing, allowed publishing lessons without generated slide content, and did not provide a teacher-facing editor for generated questions.

The product currently assumes a single teacher/admin operating the platform.

## Goals

- Ensure all Supabase auth email flows redirect to the production app instead of `localhost`.
- Make PPT upload ownership server-authoritative.
- Prevent unauthorized or duplicate PPT processing.
- Prevent students from seeing published lessons with no slide content.
- Allow the teacher to review and edit AI-generated lesson content before publishing.
- Validate/sanitize generated lesson content before it is persisted.
- Keep changes compatible with the existing Supabase schema.

## Non-Goals

- Multi-teacher classroom isolation.
- Full assessment authoring product with version history.
- New database schema for separate question entities.
- Full password reset UX.
- Automated test suite implementation.
- Cleanup of old orphaned `ppt_uploads` rows.

## Users

### Teacher

The teacher uploads PowerPoint lessons, processes generated content, reviews and edits slides/questions, and publishes lessons for students.

### Student

The student sees only published lessons, completes summary/tasks/speaking activities, and accumulates scores.

## Functional Requirements

### FR1: Auth Redirect URL Handling

The login and signup flows must use a callback URL that resolves correctly in production.

Requirements:

- Prefer `NEXT_PUBLIC_APP_URL` only when it is a valid `http(s)` URL.
- Ignore `localhost` or `127.0.0.1` configured base URLs when the current browser origin is production.
- Redirect to `/auth/callback`.
- Magic Link must pass both `emailRedirectTo` and `redirectTo` options.
- Signup must pass both `emailRedirectTo` and `redirectTo` options.
- Rate-limit errors must show friendly messages.

### FR2: Supabase Auth Dashboard Configuration

Supabase Auth must be configured manually as:

```text
Site URL:
https://master-speaking-lms.vercel.app

Redirect URLs:
https://master-speaking-lms.vercel.app/auth/callback
https://master-speaking-lms.vercel.app/**
http://localhost:3000/**
```

### FR3: Upload Ownership Security

The browser must not define final ownership for uploaded lessons.

Requirements:

- `CreatePptUploadInput` must not accept `teacherId`.
- Server action must call `supabase.auth.getUser()`.
- Server action must read `profiles.role`.
- Only users with `role = teacher` may create upload records.
- `storagePath` must start with `${user.id}/`.
- `lessons.created_by` must be set to `user.id`.
- `ppt_uploads.uploaded_by` must be set to `user.id`.
- If DB record creation fails after storage upload, the newly uploaded file should be removed from Storage.

### FR4: PPT Processing Security

The PPT processing API must process only uploads owned by the authenticated teacher.

Requirements:

- `POST /api/process-ppt` requires an authenticated user.
- The user must have `profiles.role = teacher`.
- The target `ppt_uploads` row must exist.
- `ppt_uploads.lesson_id` must be present.
- `ppt_uploads.uploaded_by` must equal `user.id`.
- The associated lesson must exist.
- `lessons.created_by` must equal `user.id`.
- Processing must return `403` if ownership checks fail.

### FR5: PPT Processing Idempotency

Processing the same upload twice must not duplicate slide rows.

Requirements:

- Before parsing or generating content, check whether `modules` already exist for `lesson_id`.
- If modules exist, return the existing rows and `alreadyProcessed: true`.
- Do not call the AI generator or insert duplicate modules in that case.

### FR6: PPT Processing Failure States

Processing failures must be visible through upload status.

Requirements:

- Parse failure sets `ppt_uploads.status = error`.
- Empty PPT/slides failure sets `ppt_uploads.status = error`.
- AI content generation failure sets `ppt_uploads.status = error`.
- Module insert failure sets `ppt_uploads.status = error`.
- Successful module insertion sets `ppt_uploads.status = completed`.

### FR7: Publishing Guard

The teacher must not publish a lesson with no generated slide content.

Requirements:

- Publishing action checks `modules(count)`.
- Draft lessons with zero modules cannot be published.
- Publish button is disabled in the teacher lesson list when a draft has zero modules.
- UI tooltip explains that slides must be processed before publishing.

### FR8: Role Fallback

Backend teacher checks should not depend only on `user_metadata.role`.

Requirements:

- Middleware uses `user.user_metadata.role` first.
- Middleware falls back to `profiles.role`.
- Lesson deletion falls back to `profiles.role`.
- Course module creation/deletion validates `profiles.role`.

### FR9: Course Module Writes

Course module creation/deletion should work even when Supabase JWT metadata is missing role.

Requirements:

- Server action validates authenticated teacher via `profiles.role`.
- Writes use admin client after server-side authorization.
- Ownership checks remain enforced before delete.

### FR10: Generated Content Validation

AI-generated content must be sanitized before persistence.

Requirements:

- Ensure `title`, `resumo`, `tarefas`, and `oratorio` exist.
- Ensure questions have exactly 4 options.
- Ensure `correct` index is valid.
- Trim text fields.
- Bound text length.
- Provide fallback question when no valid questions exist.
- Store sanitized content in `modules.content_json`.

### FR11: Teacher Review Editor

The teacher must be able to review and edit generated lesson content.

Location:

- `/teacher/lessons/[lessonId]`

Editable fields per slide:

- Slide title
- Summary text
- Summary bullets
- Questions
- Question alternatives
- Correct answer
- Oratory prompt
- Target phrase

Requirements:

- Editor appears after modules have been generated.
- Each slide is editable independently.
- Save action validates authentication.
- Save action validates `profiles.role = teacher`.
- Save action validates lesson ownership.
- Save action sanitizes content before update.
- Save action updates `modules.title` and `modules.content_json`.
- Saved changes revalidate teacher and student lesson pages.

## Data Model

No schema migration was introduced.

Existing tables used:

```text
profiles
lessons
modules
ppt_uploads
scores
course_modules
```

Generated/reviewed content remains in:

```text
modules.content_json
```

Expected content shape:

```ts
{
  slide_number: number
  title: string
  resumo: {
    text: string
    bullets: string[]
  }
  tarefas: {
    questions: Array<{
      question: string
      type: 'multiple_choice'
      options: string[]
      correct: number
    }>
  }
  oratorio: {
    prompt: string
    target_phrase: string
  }
}
```

## Current Production Data Snapshot

At the time of audit:

```text
Lessons total: 12
Published lessons: 9
Draft lessons: 3
Generated slide rows: 127
Course modules: 3
PPT uploads: 16
Completed uploads: 11
Processing uploads: 5
Errored uploads: 0
```

Known data cleanup item:

- 5 old `ppt_uploads` rows are stuck as `processing` with `lesson_id = null`.

These should be cleaned only after explicit approval because it is deletion of production data.

## Acceptance Criteria

- Magic Link generated from production no longer redirects to `localhost`.
- Signup confirmation uses production callback.
- Teacher can upload a PPT and create a lesson without sending `teacherId` to the server action.
- Non-teacher users cannot create upload records.
- A teacher cannot process another teacher's `pptUploadId`.
- Reprocessing the same upload does not create duplicate modules.
- Failed processing updates upload status to `error`.
- Draft lessons with zero generated slides cannot be published.
- Teacher can open `/teacher/lessons/[lessonId]` and edit generated content per slide.
- Saved edits appear in the student lesson player.
- `npm run lint` passes with only known legacy warnings.
- `npm run build` passes.
- Vercel production deployment reaches `READY`.

## Verification Completed

Commands run after implementation:

```text
npm run lint
npm run build
```

Both passed. Remaining warnings were pre-existing:

- Missing `alt` in student settings image.
- Missing `alt` in teacher settings image.
- `no-explicit-any` in `lib/supabase/server.ts`.

## Follow-Up Recommendations

1. Rotate the Supabase `service_role` key because it was shared during support.
2. Implement full password reset flow in the app.
3. Update `course_modules` RLS to rely on `profiles.role` rather than JWT metadata.
4. Tighten Storage policies to enforce path prefix ownership.
5. Clean old orphaned `ppt_uploads` rows after explicit confirmation.
6. Add automated backend tests for:
   - `process-ppt` ownership
   - process idempotency
   - publish guard
   - module review action
   - auth redirect helper behavior
