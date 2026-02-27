-- ============================================================
-- Migration: 003 — Indexes
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   002_tables.sql
-- Idempotent: YES (IF NOT EXISTS)
-- Strategy:  Access-pattern driven — indexes match actual query patterns
--            found in app/ code (page.tsx Server Components + API routes)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
-- Used by: RLS policies, handle_new_user trigger, teacher analytics
CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles(role);

COMMENT ON INDEX public.profiles_role_idx IS
  'Accelerates RLS role checks (WHERE role = ''teacher'' / ''student'')';


-- ── lessons ──────────────────────────────────────────────────
-- Used by: student/lessons/page.tsx (WHERE is_published = true)
CREATE INDEX IF NOT EXISTS lessons_is_published_idx
  ON public.lessons(is_published)
  WHERE is_published = true;           -- partial index — only published rows

COMMENT ON INDEX public.lessons_is_published_idx IS
  'Partial index for student listing query (only published lessons)';

-- Used by: teacher/lessons/[lessonId]/page.tsx + RLS (WHERE created_by = auth.uid())
CREATE INDEX IF NOT EXISTS lessons_created_by_idx
  ON public.lessons(created_by);

COMMENT ON INDEX public.lessons_created_by_idx IS
  'FK index + teacher ownership RLS check';

-- Used by: lesson listings sorted by curriculum order
CREATE INDEX IF NOT EXISTS lessons_order_index_idx
  ON public.lessons(order_index ASC);

COMMENT ON INDEX public.lessons_order_index_idx IS
  'ORDER BY order_index in lesson listings';


-- ── modules ──────────────────────────────────────────────────
-- Used by: ALL module fetches (WHERE lesson_id = ?)
CREATE INDEX IF NOT EXISTS modules_lesson_id_idx
  ON public.modules(lesson_id);

COMMENT ON INDEX public.modules_lesson_id_idx IS
  'Primary FK index — every module query filters by lesson_id';

-- Used by: slide navigation (WHERE lesson_id = ? ORDER BY order_index)
CREATE INDEX IF NOT EXISTS modules_lesson_order_idx
  ON public.modules(lesson_id, order_index ASC);

COMMENT ON INDEX public.modules_lesson_order_idx IS
  'Composite index for ordered slide fetches within a lesson';


-- ── scores ───────────────────────────────────────────────────
-- Used by: student/lessons/[lessonId]/page.tsx (WHERE student_id = ? AND lesson_id = ?)
CREATE INDEX IF NOT EXISTS scores_student_lesson_idx
  ON public.scores(student_id, lesson_id);

COMMENT ON INDEX public.scores_student_lesson_idx IS
  'Primary query pattern: fetch all scores for one student in one lesson';

-- Used by: student performance view + RLS teacher policy
CREATE INDEX IF NOT EXISTS scores_lesson_id_idx
  ON public.scores(lesson_id);

COMMENT ON INDEX public.scores_lesson_id_idx IS
  'Teacher analytics: aggregate scores across all students per lesson';

-- Used by: ResumoTab and TarefasTab upsert (module_id lookup)
CREATE INDEX IF NOT EXISTS scores_module_id_idx
  ON public.scores(module_id)
  WHERE module_id IS NOT NULL;         -- partial index — excludes NULL module_ids

COMMENT ON INDEX public.scores_module_id_idx IS
  'Partial index for upsert lookups by module_id (skips NULL rows)';


-- ── ppt_uploads ──────────────────────────────────────────────
-- Used by: teacher/lessons/[lessonId]/page.tsx (WHERE lesson_id = ?)
CREATE INDEX IF NOT EXISTS ppt_uploads_lesson_id_idx
  ON public.ppt_uploads(lesson_id);

COMMENT ON INDEX public.ppt_uploads_lesson_id_idx IS
  'FK index — upload status lookup per lesson';

-- Used by: RLS policy (WHERE uploaded_by = auth.uid())
CREATE INDEX IF NOT EXISTS ppt_uploads_uploaded_by_idx
  ON public.ppt_uploads(uploaded_by);

COMMENT ON INDEX public.ppt_uploads_uploaded_by_idx IS
  'FK index + RLS uploaded_by ownership check';

-- Used by: process-ppt API (WHERE status = ''processing'')
CREATE INDEX IF NOT EXISTS ppt_uploads_status_idx
  ON public.ppt_uploads(status)
  WHERE status = 'processing';         -- partial index — only pending work

COMMENT ON INDEX public.ppt_uploads_status_idx IS
  'Partial index for processing queue lookups';
