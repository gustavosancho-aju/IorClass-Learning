-- ============================================================
-- Migration: 009 — Fix RLS Infinite Recursion
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   006_rls.sql
-- Idempotent: YES
-- ============================================================
--
-- ROOT CAUSE:
--   "profiles: teachers read all" used EXISTS (SELECT FROM profiles ...)
--   inside a profiles RLS policy → infinite recursion detected by PostgreSQL.
--   All queries to profiles (including from other table policies) failed
--   silently with null, causing redirect loops in layouts.
--
-- FIX:
--   Replace all role checks that query public.profiles with JWT claims:
--     auth.jwt() -> 'user_metadata' ->> 'role'
--   This reads from the signed JWT (no DB query) → no recursion.
--
-- NOTE:
--   user_metadata.role is stored in auth.users.raw_user_meta_data
--   and included in the JWT at login time. It matches the profile.role.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PROFILES — Fix recursive policy
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles: teachers read all" ON public.profiles;

-- Teachers can read all profiles (for analytics)
-- FIX: use JWT claims instead of querying profiles (prevents recursion)
CREATE POLICY "profiles: teachers read all"
  ON public.profiles
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );


-- ════════════════════════════════════════════════════════════
-- LESSONS — Update role checks to use JWT (performance + safety)
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "lessons: students see published"  ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers see own"        ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers insert"         ON public.lessons;

CREATE POLICY "lessons: students see published"
  ON public.lessons
  FOR SELECT
  USING (
    is_published = true
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

CREATE POLICY "lessons: teachers see own"
  ON public.lessons
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );

CREATE POLICY "lessons: teachers insert"
  ON public.lessons
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );

-- UPDATE and DELETE policies only check created_by = auth.uid() — no change needed


-- ════════════════════════════════════════════════════════════
-- MODULES — Update role checks to use JWT
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "modules: authenticated read" ON public.modules;

CREATE POLICY "modules: authenticated read"
  ON public.modules
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Teachers: see all modules regardless of lesson status
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
      OR
      -- Students: only modules whose lesson is published
      EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.id = lesson_id AND l.is_published = true
      )
    )
  );


-- ════════════════════════════════════════════════════════════
-- SCORES — Update role checks to use JWT
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "scores: students insert own" ON public.scores;

CREATE POLICY "scores: students insert own"
  ON public.scores
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
  );

-- scores: teachers read their lesson scores — no profiles subquery, only checks lessons.created_by
-- scores: students read own / update own — no role check needed, skipping


-- ════════════════════════════════════════════════════════════
-- PPT_UPLOADS — Update role checks to use JWT
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ppt_uploads: teachers insert" ON public.ppt_uploads;

CREATE POLICY "ppt_uploads: teachers insert"
  ON public.ppt_uploads
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );


-- ════════════════════════════════════════════════════════════
-- STORAGE — Update role checks to use JWT
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ppt-uploads: teacher upload"     ON storage.objects;
DROP POLICY IF EXISTS "ppt-uploads: teacher read own"   ON storage.objects;
DROP POLICY IF EXISTS "ppt-uploads: teacher delete own" ON storage.objects;

CREATE POLICY "ppt-uploads: teacher upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ppt-uploads'
    AND auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );

CREATE POLICY "ppt-uploads: teacher read own"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ppt-uploads'
    AND auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );

CREATE POLICY "ppt-uploads: teacher delete own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ppt-uploads'
    AND auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );
