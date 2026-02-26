-- ============================================================
-- Migration: 004 — Functions & Triggers
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   002_tables.sql
-- Idempotent: YES (CREATE OR REPLACE + DROP IF EXISTS before recreating triggers)
-- ============================================================

-- ── 1. Auto-update updated_at ────────────────────────────────
-- Generic trigger function used by profiles, lessons, and modules.
-- scores and ppt_uploads intentionally omit updated_at (append-only).

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS
  'Sets updated_at = now() before any UPDATE. Applied to profiles, lessons, modules.';

-- Apply to profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply to lessons
DROP TRIGGER IF EXISTS lessons_updated_at ON public.lessons;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply to modules
DROP TRIGGER IF EXISTS modules_updated_at ON public.modules;
CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 2. Auto-create profile on user signup ────────────────────
-- Fires AFTER INSERT on auth.users.
-- Reads role from raw_user_meta_data->>'role'; defaults to 'student'.
--
-- Client-side signup usage:
--   supabase.auth.signUp({
--     email, password,
--     options: { data: { role: 'teacher', full_name: 'Ana Lima' } }
--   })
--
-- SECURITY DEFINER: Runs as the function owner (postgres), not the calling user.
-- This is required because auth.users is not accessible to the anon/authenticated role.
-- search_path is fixed to `public` to prevent search_path injection attacks.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'student'                          -- safe default — least privilege
    ),
    NEW.raw_user_meta_data->>'full_name'  -- NULL if not provided
  )
  ON CONFLICT (id) DO NOTHING;           -- idempotent — no duplicate on retry

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profiles row for every new auth.users entry. '
  'Role from raw_user_meta_data->role (defaults to student). '
  'SECURITY DEFINER with fixed search_path to prevent injection.';

-- Attach to auth.users — fires once per signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
