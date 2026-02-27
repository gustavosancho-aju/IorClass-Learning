-- ============================================================
-- Migration: 006 — Row Level Security (RLS)
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   002_tables.sql
-- Idempotent: YES (DROP POLICY IF EXISTS before CREATE)
-- ============================================================
--
-- Security Model Summary:
-- ┌─────────────────┬────────────┬─────────────────────────────────────────┐
-- │ Table           │ Role       │ Access                                  │
-- ├─────────────────┼────────────┼─────────────────────────────────────────┤
-- │ profiles        │ any user   │ SELECT own row                          │
-- │                 │ teacher    │ SELECT all rows (for analytics)         │
-- │                 │ own user   │ UPDATE own row                          │
-- │                 │ system     │ INSERT (via trigger only)               │
-- ├─────────────────┼────────────┼─────────────────────────────────────────┤
-- │ lessons         │ student    │ SELECT published only                   │
-- │                 │ teacher    │ SELECT/INSERT/UPDATE/DELETE all own      │
-- ├─────────────────┼────────────┼─────────────────────────────────────────┤
-- │ modules         │ any auth   │ SELECT (published lesson modules)        │
-- │                 │ teacher    │ SELECT all                               │
-- │                 │ service    │ INSERT/UPDATE/DELETE (API routes only)  │
-- ├─────────────────┼────────────┼─────────────────────────────────────────┤
-- │ scores          │ student    │ SELECT/INSERT/UPDATE own scores         │
-- │                 │ teacher    │ SELECT scores for their lessons         │
-- ├─────────────────┼────────────┼─────────────────────────────────────────┤
-- │ ppt_uploads     │ teacher    │ SELECT/INSERT own uploads               │
-- │                 │ service    │ UPDATE status (API routes only)         │
-- └─────────────────┴────────────┴─────────────────────────────────────────┘
--
-- NOTE: Service Role key bypasses ALL RLS — used only in API routes
--       (app/api/process-ppt/route.ts, app/api/tts/route.ts)
-- NOTE: Modules INSERT/UPDATE/DELETE have no RLS policy on purpose —
--       they must only be written via service_role (API routes).
-- ============================================================


-- ── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppt_uploads ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles: select own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles: teachers read all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"         ON public.profiles;

-- Every authenticated user can read their own profile
CREATE POLICY "profiles: select own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Teachers can read all profiles (needed for student analytics in Wave 3)
CREATE POLICY "profiles: teachers read all"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Users can update only their own profile (name, avatar)
CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: handled exclusively by the handle_new_user() trigger (SECURITY DEFINER)
-- No INSERT policy needed — anon and authenticated roles cannot INSERT directly.


-- ════════════════════════════════════════════════════════════
-- LESSONS
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "lessons: students see published"  ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers see own"        ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers insert"         ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers update own"     ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers delete own"     ON public.lessons;

-- Students can only see published lessons
CREATE POLICY "lessons: students see published"
  ON public.lessons
  FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'student'
    )
  );

-- Teachers can see ALL lessons (including unpublished) — their own dashboard
CREATE POLICY "lessons: teachers see own"
  ON public.lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Teachers can create lessons (created_by must match their uid)
CREATE POLICY "lessons: teachers insert"
  ON public.lessons
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Teachers can update only lessons they own
CREATE POLICY "lessons: teachers update own"
  ON public.lessons
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Teachers can delete only lessons they own (CASCADE deletes modules + scores)
CREATE POLICY "lessons: teachers delete own"
  ON public.lessons
  FOR DELETE
  USING (created_by = auth.uid());


-- ════════════════════════════════════════════════════════════
-- MODULES
-- ════════════════════════════════════════════════════════════
-- WRITE operations (INSERT/UPDATE/DELETE) intentionally have NO policies.
-- They must only be executed via service_role (API routes use SUPABASE_SERVICE_ROLE_KEY).
-- This enforces that modules are only created/updated by the processing pipeline.

DROP POLICY IF EXISTS "modules: authenticated read"  ON public.modules;

-- Authenticated users can read modules from:
--   • published lessons  (students)
--   • any lesson         (teachers)
CREATE POLICY "modules: authenticated read"
  ON public.modules
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Teachers: see all modules regardless of lesson status
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'teacher'
      )
      OR
      -- Students: only modules whose lesson is published
      EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.id = lesson_id AND l.is_published = true
      )
    )
  );


-- ════════════════════════════════════════════════════════════
-- SCORES
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "scores: students read own"                   ON public.scores;
DROP POLICY IF EXISTS "scores: teachers read their lesson scores"   ON public.scores;
DROP POLICY IF EXISTS "scores: students insert own"                 ON public.scores;
DROP POLICY IF EXISTS "scores: students update own"                 ON public.scores;

-- Students can only see their own scores
CREATE POLICY "scores: students read own"
  ON public.scores
  FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can see scores for any lesson they own
CREATE POLICY "scores: teachers read their lesson scores"
  ON public.scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.lessons  l
      JOIN   public.profiles p ON p.id = auth.uid()
      WHERE  l.id = lesson_id
        AND  l.created_by = auth.uid()
        AND  p.role = 'teacher'
    )
  );

-- Students can insert scores for themselves only
CREATE POLICY "scores: students insert own"
  ON public.scores
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'student'
    )
  );

-- Students can update (upsert) their own scores (re-attempt a module)
CREATE POLICY "scores: students update own"
  ON public.scores
  FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- PPT_UPLOADS
-- ════════════════════════════════════════════════════════════
-- UPDATE (status changes) intentionally has NO policy.
-- Status transitions (processing → completed | error) happen only
-- via service_role in app/api/process-ppt/route.ts.

DROP POLICY IF EXISTS "ppt_uploads: teachers read own"   ON public.ppt_uploads;
DROP POLICY IF EXISTS "ppt_uploads: teachers insert"     ON public.ppt_uploads;

-- Teachers can see their own uploads
CREATE POLICY "ppt_uploads: teachers read own"
  ON public.ppt_uploads
  FOR SELECT
  USING (uploaded_by = auth.uid());

-- Teachers can register new uploads (uploaded_by must match their uid)
CREATE POLICY "ppt_uploads: teachers insert"
  ON public.ppt_uploads
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );
