-- ============================================================
-- Migration: 002 — Core Tables
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   001_enums.sql
-- Idempotent: YES (IF NOT EXISTS on all objects)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
-- Extended user profile, 1:1 with auth.users.
-- Created automatically via trigger on auth.users INSERT.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid                 PRIMARY KEY
                                   REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.user_role     NOT NULL,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz          NOT NULL DEFAULT now(),
  updated_at  timestamptz          NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles           IS 'Extended user profiles — 1:1 with auth.users';
COMMENT ON COLUMN public.profiles.id        IS 'FK to auth.users; same UUID';
COMMENT ON COLUMN public.profiles.role      IS 'Platform role: teacher creates content, student consumes it';
COMMENT ON COLUMN public.profiles.email     IS 'Denormalized from auth.users for convenient display';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Optional profile picture URL';


-- ── lessons ──────────────────────────────────────────────────
-- Lesson units. Teachers create them; students consume published ones.

CREATE TABLE IF NOT EXISTS public.lessons (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text         NOT NULL CHECK (char_length(trim(title)) >= 1),
  description   text,
  cover_emoji   text         NOT NULL DEFAULT '📚',
  order_index   integer      NOT NULL DEFAULT 0,
  is_published  boolean      NOT NULL DEFAULT false,
  created_by    uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.lessons               IS 'Lesson units created by teachers';
COMMENT ON COLUMN public.lessons.title         IS 'Human-readable lesson title';
COMMENT ON COLUMN public.lessons.cover_emoji   IS 'Emoji displayed as lesson cover art in listings';
COMMENT ON COLUMN public.lessons.order_index   IS 'Display sort order in curriculum';
COMMENT ON COLUMN public.lessons.is_published  IS 'When false, only teachers see this lesson';
COMMENT ON COLUMN public.lessons.created_by    IS 'FK to profiles — teacher who owns this lesson';


-- ── modules ──────────────────────────────────────────────────
-- Individual learning modules (one per slide per type).
-- content_json structure is defined by ModuleContent in lib/content-generator.ts

CREATE TABLE IF NOT EXISTS public.modules (
  id            uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     uuid               NOT NULL
                                   REFERENCES public.lessons(id) ON DELETE CASCADE,
  type          public.module_type NOT NULL,
  title         text               NOT NULL,
  content_json  jsonb,
  order_index   integer            NOT NULL DEFAULT 0,
  created_at    timestamptz        NOT NULL DEFAULT now(),
  updated_at    timestamptz        NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.modules              IS 'Slide-level learning modules within a lesson';
COMMENT ON COLUMN public.modules.lesson_id    IS 'FK to lessons — cascade delete when lesson removed';
COMMENT ON COLUMN public.modules.type         IS 'summary | tasks | speaking — determines content_json shape';
COMMENT ON COLUMN public.modules.title        IS 'Slide title extracted from PPTX';
COMMENT ON COLUMN public.modules.content_json IS 'AI/rule-generated content: {resumo,tarefas,oratorio} blocks';
COMMENT ON COLUMN public.modules.order_index  IS 'Slide order within the lesson (0-based)';


-- ── scores ───────────────────────────────────────────────────
-- Student performance scores, one record per (student, lesson, module, type).
-- UNIQUE constraint is the upsert target used in TarefasTab and ResumoTab.

CREATE TABLE IF NOT EXISTS public.scores (
  id                  uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid               NOT NULL
                                         REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id           uuid               NOT NULL
                                         REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id           uuid               REFERENCES public.modules(id) ON DELETE SET NULL,
  module_type         public.module_type NOT NULL,
  score               integer            NOT NULL
                                         CHECK (score >= 0 AND score <= 100),
  time_spent_seconds  integer            CHECK (time_spent_seconds >= 0),
  created_at          timestamptz        NOT NULL DEFAULT now(),

  -- Upsert target: supabase.from('scores').upsert({...}, {onConflict: 'student_id,lesson_id,module_id,module_type'})
  CONSTRAINT scores_student_lesson_module_type_uq
    UNIQUE (student_id, lesson_id, module_id, module_type)
);

COMMENT ON TABLE  public.scores                      IS 'Student module completion scores (0-100)';
COMMENT ON COLUMN public.scores.student_id           IS 'FK to profiles — the student';
COMMENT ON COLUMN public.scores.lesson_id            IS 'FK to lessons — denormalized for quick lesson-level aggregation';
COMMENT ON COLUMN public.scores.module_id            IS 'FK to modules — nullable (SET NULL on module delete)';
COMMENT ON COLUMN public.scores.score                IS 'Percentage score 0-100';
COMMENT ON COLUMN public.scores.time_spent_seconds   IS 'Optional time-on-task metric';
COMMENT ON CONSTRAINT scores_student_lesson_module_type_uq
  ON public.scores IS 'One score row per student per module per type — the upsert target in client code';


-- ── ppt_uploads ──────────────────────────────────────────────
-- Tracks each PowerPoint file upload and its processing lifecycle.

CREATE TABLE IF NOT EXISTS public.ppt_uploads (
  id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      text                  NOT NULL CHECK (char_length(trim(filename)) >= 1),
  storage_path  text                  NOT NULL,
  lesson_id     uuid                  REFERENCES public.lessons(id) ON DELETE SET NULL,
  status        public.upload_status  NOT NULL DEFAULT 'processing',
  uploaded_by   uuid                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz           NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.ppt_uploads               IS 'PPT upload records with processing lifecycle tracking';
COMMENT ON COLUMN public.ppt_uploads.filename      IS 'Original filename as uploaded by teacher';
COMMENT ON COLUMN public.ppt_uploads.storage_path  IS 'Supabase Storage object path: {lesson_id}/{filename}';
COMMENT ON COLUMN public.ppt_uploads.lesson_id     IS 'FK to lessons — SET NULL if lesson deleted';
COMMENT ON COLUMN public.ppt_uploads.status        IS 'processing → completed | error';
COMMENT ON COLUMN public.ppt_uploads.uploaded_by   IS 'FK to profiles — teacher who uploaded';
