-- ============================================================
-- ROLLBACK SCRIPT — Full teardown (reverse order)
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- ============================================================
-- ⚠️  WARNING: This script PERMANENTLY DELETES all data.
-- ⚠️  Only run in development / when you need a full reset.
-- ⚠️  In production, prefer targeted rollback migrations.
-- ============================================================
-- Usage:
--   1. Run in Supabase SQL Editor OR via psql
--   2. Check database state after each section
--   3. Verify application is offline before running in production
-- ============================================================


-- ── 007 — Storage ────────────────────────────────────────────
-- Drop storage POLICIES (permitido via SQL Editor)
DROP POLICY IF EXISTS "ppt-uploads: teacher upload"     ON storage.objects;
DROP POLICY IF EXISTS "ppt-uploads: teacher read own"   ON storage.objects;
DROP POLICY IF EXISTS "ppt-uploads: teacher delete own" ON storage.objects;

-- ⚠️  BUCKET DELETION: NÃO pode ser feita via SQL direto.
--     Supabase bloqueia DELETE em storage.objects e storage.buckets por segurança.
--     Para deletar o bucket, acesse:
--       Dashboard → Storage → ppt-uploads → Delete bucket
--     (Esvazie o bucket primeiro se houver arquivos)


-- ── 006 — RLS Policies ───────────────────────────────────────
-- profiles
DROP POLICY IF EXISTS "profiles: select own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles: teachers read all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"          ON public.profiles;
-- lessons
DROP POLICY IF EXISTS "lessons: students see published"  ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers see own"        ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers insert"         ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers update own"     ON public.lessons;
DROP POLICY IF EXISTS "lessons: teachers delete own"     ON public.lessons;
-- modules
DROP POLICY IF EXISTS "modules: authenticated read"      ON public.modules;
-- scores
DROP POLICY IF EXISTS "scores: students read own"                   ON public.scores;
DROP POLICY IF EXISTS "scores: teachers read their lesson scores"   ON public.scores;
DROP POLICY IF EXISTS "scores: students insert own"                 ON public.scores;
DROP POLICY IF EXISTS "scores: students update own"                 ON public.scores;
-- ppt_uploads
DROP POLICY IF EXISTS "ppt_uploads: teachers read own"  ON public.ppt_uploads;
DROP POLICY IF EXISTS "ppt_uploads: teachers insert"    ON public.ppt_uploads;

-- Disable RLS
ALTER TABLE public.profiles    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppt_uploads DISABLE ROW LEVEL SECURITY;


-- ── 005 — Views ──────────────────────────────────────────────
DROP VIEW IF EXISTS public.student_performance;


-- ── 004 — Triggers & Functions ───────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at  ON public.profiles;
DROP TRIGGER IF EXISTS lessons_updated_at   ON public.lessons;
DROP TRIGGER IF EXISTS modules_updated_at   ON public.modules;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();


-- ── 003 — Indexes ────────────────────────────────────────────
DROP INDEX IF EXISTS public.profiles_role_idx;
DROP INDEX IF EXISTS public.lessons_is_published_idx;
DROP INDEX IF EXISTS public.lessons_created_by_idx;
DROP INDEX IF EXISTS public.lessons_order_index_idx;
DROP INDEX IF EXISTS public.modules_lesson_id_idx;
DROP INDEX IF EXISTS public.modules_lesson_order_idx;
DROP INDEX IF EXISTS public.scores_student_lesson_idx;
DROP INDEX IF EXISTS public.scores_lesson_id_idx;
DROP INDEX IF EXISTS public.scores_module_id_idx;
DROP INDEX IF EXISTS public.ppt_uploads_lesson_id_idx;
DROP INDEX IF EXISTS public.ppt_uploads_uploaded_by_idx;
DROP INDEX IF EXISTS public.ppt_uploads_status_idx;


-- ── 002 — Tables ─────────────────────────────────────────────
-- Order matters: drop dependents first, then parents
DROP TABLE IF EXISTS public.ppt_uploads  CASCADE;
DROP TABLE IF EXISTS public.scores       CASCADE;
DROP TABLE IF EXISTS public.modules      CASCADE;
DROP TABLE IF EXISTS public.lessons      CASCADE;
DROP TABLE IF EXISTS public.profiles     CASCADE;


-- ── 001 — Enums ──────────────────────────────────────────────
DROP TYPE IF EXISTS public.upload_status CASCADE;
DROP TYPE IF EXISTS public.module_type   CASCADE;
DROP TYPE IF EXISTS public.user_role     CASCADE;
