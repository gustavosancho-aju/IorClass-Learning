-- ============================================================
-- Migration: 011 — Course Modules
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dex (dev)
-- Created:   2026-02-27
-- Depends:   002_tables.sql (lessons table must exist)
-- Idempotent: YES (IF NOT EXISTS / IF NOT EXISTS on all objects)
-- ============================================================
--
-- PURPOSE:
--   Adds a `course_modules` table so teachers can group lessons into
--   named units (e.g., "Módulo 1: Cumprimentos").
--
-- NAMING CLARIFICATION:
--   - `modules`        (existing) = slide-level content units per lesson (Resumo/Tarefas/Oratório)
--   - `course_modules` (new)      = teacher-created groupings of lessons
--
-- HIERARCHY: course_modules → lessons → modules (slides)
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. COURSE MODULES TABLE
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.course_modules (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL CHECK (char_length(trim(title)) >= 1),
  description text,
  order_index integer     NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.course_modules             IS 'Teacher-created groupings of lessons (e.g., Módulo 1, Módulo 2)';
COMMENT ON COLUMN public.course_modules.title       IS 'Human-readable module name shown to students';
COMMENT ON COLUMN public.course_modules.description IS 'Optional description shown in course overview';
COMMENT ON COLUMN public.course_modules.order_index IS 'Display order among modules (0-based)';
COMMENT ON COLUMN public.course_modules.created_by  IS 'FK to profiles — teacher who owns this module';


-- ════════════════════════════════════════════════════════════
-- 2. ADD course_module_id TO lessons
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS course_module_id uuid
    REFERENCES public.course_modules(id)
    ON DELETE SET NULL;

COMMENT ON COLUMN public.lessons.course_module_id IS 'Optional FK to course_modules — null means "no module assigned"';


-- ════════════════════════════════════════════════════════════
-- 3. INDEXES
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS course_modules_created_by_idx
  ON public.course_modules (created_by);

CREATE INDEX IF NOT EXISTS lessons_course_module_id_idx
  ON public.lessons (course_module_id);


-- ════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- Teachers can read all modules (to display student-facing course structure)
DROP POLICY IF EXISTS "course_modules: authenticated read all" ON public.course_modules;
CREATE POLICY "course_modules: authenticated read all"
  ON public.course_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Teachers can insert their own modules
DROP POLICY IF EXISTS "course_modules: teacher insert own" ON public.course_modules;
CREATE POLICY "course_modules: teacher insert own"
  ON public.course_modules
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );

-- Teachers can update their own modules
DROP POLICY IF EXISTS "course_modules: teacher update own" ON public.course_modules;
CREATE POLICY "course_modules: teacher update own"
  ON public.course_modules
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Teachers can delete their own modules
DROP POLICY IF EXISTS "course_modules: teacher delete own" ON public.course_modules;
CREATE POLICY "course_modules: teacher delete own"
  ON public.course_modules
  FOR DELETE
  USING (
    auth.uid() = created_by
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  );


-- ════════════════════════════════════════════════════════════
-- 5. UPDATED_AT TRIGGER (reuse existing function)
-- ════════════════════════════════════════════════════════════

-- Assumes handle_updated_at() function exists from migration 004_triggers.sql
DROP TRIGGER IF EXISTS set_updated_at ON public.course_modules;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
