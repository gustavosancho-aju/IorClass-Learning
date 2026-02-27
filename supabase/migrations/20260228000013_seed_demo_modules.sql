-- Migration: seed demo modules for first teacher account
-- Creates "Exclusivíssimo" and "Turma 01", associates demo lesson

DO $$
DECLARE
  v_teacher_id   uuid;
  v_module1_id   uuid := gen_random_uuid();
  v_module2_id   uuid := gen_random_uuid();
BEGIN
  -- Find the first teacher user by role in user_metadata
  SELECT id INTO v_teacher_id
  FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'teacher'
  ORDER BY created_at
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE NOTICE '[seed] No teacher found — skipping module seed.';
    RETURN;
  END IF;

  RAISE NOTICE '[seed] Seeding modules for teacher: %', v_teacher_id;

  -- Insert modules (skip if a module with same title already exists for this teacher)
  INSERT INTO public.course_modules (id, title, description, order_index, created_by)
  VALUES
    (v_module1_id, 'Exclusivíssimo', 'Módulo premium com conteúdo exclusivo para alunos selecionados', 1, v_teacher_id),
    (v_module2_id, 'Turma 01',       'Primeira turma — conteúdo introdutório e fundamentos',            2, v_teacher_id)
  ON CONFLICT DO NOTHING;

  -- Associate "Introduction to Public Speaking" lesson with "Exclusivíssimo"
  UPDATE public.lessons
  SET course_module_id = v_module1_id
  WHERE title ILIKE '%Introduction to Public Speaking%'
    AND (created_by = v_teacher_id OR created_by IS NULL)
    AND course_module_id IS NULL;  -- only if not already assigned

  RAISE NOTICE '[seed] Done. Module 1: %, Module 2: %', v_module1_id, v_module2_id;
END;
$$;
