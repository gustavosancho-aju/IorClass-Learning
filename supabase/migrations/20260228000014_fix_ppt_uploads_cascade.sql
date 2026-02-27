-- ============================================================
-- Migration: 014 — Fix ppt_uploads.lesson_id ON DELETE CASCADE
-- Project:   Master Speaking LMS (iorclass-professional)
-- Story:     7.1 — Teacher: Excluir Aula
-- Reason:    Original FK used ON DELETE SET NULL, leaving orphaned
--            upload records when a lesson is deleted. Changed to
--            CASCADE so the upload record is cleaned up together
--            with its parent lesson.
-- ============================================================

ALTER TABLE public.ppt_uploads
  DROP CONSTRAINT IF EXISTS ppt_uploads_lesson_id_fkey,
  ADD CONSTRAINT ppt_uploads_lesson_id_fkey
    FOREIGN KEY (lesson_id)
    REFERENCES public.lessons(id)
    ON DELETE CASCADE;
