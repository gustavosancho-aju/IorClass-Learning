-- ============================================================
-- Seed Data — Development Only
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- ============================================================
-- ⚠️  This seed creates AUTH users via Supabase Auth API, not SQL.
--     The SQL below seeds only the data that does NOT depend on live auth.
--
-- To create test accounts:
--   1. Run this file in Supabase SQL Editor (after running all migrations)
--   2. Create test users via Supabase Auth dashboard OR the signup page:
--      • Teacher: teacher@iorclass.dev  / Teacher@123
--      • Student: student@iorclass.dev  / Student@123
--      (raw_user_meta_data: { "role": "teacher" | "student" })
--   3. The handle_new_user() trigger will auto-create their profiles.
-- ============================================================

-- ── Demo Lesson (for quick UI testing) ───────────────────────
-- Requires at least one teacher profile to exist.
-- Replace '00000000-0000-0000-0000-000000000001' with a real teacher UUID
-- after creating the teacher account.

DO $$
DECLARE
  v_teacher_id  uuid;
  v_lesson_id   uuid := '11111111-1111-1111-1111-111111111001';
  v_module_base uuid;
BEGIN
  -- Find the first teacher profile (if any exist)
  SELECT id INTO v_teacher_id
  FROM public.profiles
  WHERE role = 'teacher'
  ORDER BY created_at
  LIMIT 1;

  -- Only seed if a teacher exists
  IF v_teacher_id IS NOT NULL THEN

    -- Demo lesson
    INSERT INTO public.lessons (id, title, description, cover_emoji, order_index, is_published, created_by)
    VALUES (
      v_lesson_id,
      'Introduction to Public Speaking',
      'Learn the fundamentals of confident public speaking in English.',
      '🎤',
      1,
      true,  -- published so students can see it immediately
      v_teacher_id
    )
    ON CONFLICT (id) DO NOTHING;

    -- Demo slide 1 — Summary module
    INSERT INTO public.modules (lesson_id, type, title, content_json, order_index)
    VALUES (
      v_lesson_id,
      'summary',
      'What is Public Speaking?',
      jsonb_build_object(
        'slide_number', 1,
        'title',        'What is Public Speaking?',
        'resumo', jsonb_build_object(
          'text',    'Public speaking is the act of communicating information to an audience in a structured, deliberate manner.',
          'bullets', jsonb_build_array(
            'Define your purpose before you speak',
            'Know your audience',
            'Structure: opening, body, conclusion',
            'Practice makes perfect'
          )
        ),
        'tarefas', jsonb_build_object(
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id',       'q1',
              'question', 'What is the first step in preparing a speech?',
              'options',  jsonb_build_array('Choose your topic', 'Define your purpose', 'Memorize your lines', 'Buy a microphone'),
              'correct',  1
            ),
            jsonb_build_object(
              'id',       'q2',
              'question', 'A good speech structure has how many parts?',
              'options',  jsonb_build_array('Two', 'Three', 'Four', 'Five'),
              'correct',  1
            )
          )
        ),
        'oratorio', jsonb_build_object(
          'prompt',        'In 30 seconds, explain what public speaking means to you.',
          'target_phrase', 'Public speaking is an important skill for everyone.'
        )
      ),
      0
    )
    ON CONFLICT DO NOTHING;

    -- Demo slide 2 — Summary module
    INSERT INTO public.modules (lesson_id, type, title, content_json, order_index)
    VALUES (
      v_lesson_id,
      'summary',
      'Overcoming Stage Fright',
      jsonb_build_object(
        'slide_number', 2,
        'title',        'Overcoming Stage Fright',
        'resumo', jsonb_build_object(
          'text',    'Stage fright is a normal reaction. With the right techniques, anyone can manage it.',
          'bullets', jsonb_build_array(
            'Breathe deeply before you begin',
            'Prepare and rehearse thoroughly',
            'Focus on your message, not yourself',
            'Visualize success'
          )
        ),
        'tarefas', jsonb_build_object(
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id',       'q1',
              'question', 'Which technique helps calm nerves before speaking?',
              'options',  jsonb_build_array('Run around the room', 'Deep breathing', 'Check your phone', 'Skip the speech'),
              'correct',  1
            )
          )
        ),
        'oratorio', jsonb_build_object(
          'prompt',        'Tell us about a time you felt nervous speaking. What helped?',
          'target_phrase', 'I was nervous, but I took a deep breath and focused on my message.'
        )
      ),
      1
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seed complete — lesson % created for teacher %', v_lesson_id, v_teacher_id;
  ELSE
    RAISE NOTICE 'No teacher found — skipping lesson seed. Create a teacher account first.';
  END IF;
END $$;
