-- ============================================================
-- Migration: 001 — Custom Enums
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Idempotent: YES (DO $$ blocks guard each enum)
-- ============================================================

-- ── user_role ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('teacher', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.user_role IS
  'Platform access role — teacher: creates/manages content; student: consumes lessons';

-- ── module_type ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.module_type AS ENUM ('summary', 'tasks', 'speaking');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.module_type IS
  'Type of learning module per slide: summary=resumo, tasks=tarefas MCQ, speaking=oratório';

-- ── upload_status ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.upload_status AS ENUM ('processing', 'completed', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.upload_status IS
  'PPT processing lifecycle: processing → completed | error';
