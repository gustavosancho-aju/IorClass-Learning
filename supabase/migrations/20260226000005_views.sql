-- ============================================================
-- Migration: 005 — Views
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   002_tables.sql
-- Idempotent: YES (CREATE OR REPLACE)
-- ============================================================

-- ── student_performance ──────────────────────────────────────
-- Aggregated view used by:
--   - app/student/lessons/page.tsx  (badge de média por aula)
--   - Wave 3 teacher analytics dashboard
--
-- Columns match types.ts Views.student_performance.Row exactly.

CREATE OR REPLACE VIEW public.student_performance AS
SELECT
  s.student_id,
  p.full_name                            AS student_name,
  s.lesson_id,
  l.title                                AS lesson_title,
  ROUND(AVG(s.score))::integer           AS avg_score,
  COUNT(s.id)::integer                   AS modules_completed,
  MAX(s.created_at)                      AS last_activity
FROM   public.scores   s
JOIN   public.profiles p ON p.id = s.student_id
JOIN   public.lessons  l ON l.id = s.lesson_id
GROUP BY
  s.student_id,
  p.full_name,
  s.lesson_id,
  l.title;

COMMENT ON VIEW public.student_performance IS
  'Aggregated student performance per lesson. '
  'Used in student lesson listing (avg_score badge) and teacher analytics (Wave 3).';

COMMENT ON COLUMN public.student_performance.avg_score IS
  'ROUND(AVG(score)) — 0-100 integer percentage';

COMMENT ON COLUMN public.student_performance.modules_completed IS
  'Count of distinct score rows (one per completed module activity)';

COMMENT ON COLUMN public.student_performance.last_activity IS
  'Timestamp of most recent score insert for this student+lesson';
