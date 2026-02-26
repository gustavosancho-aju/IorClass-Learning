-- ============================================================
-- Migration: 007 — Storage Policies
-- Project:   Master Speaking LMS (iorclass-professional)
-- Author:    Dara (data-engineer)
-- Created:   2026-02-26
-- Depends:   006_rls.sql (profiles table + RLS must exist)
-- Idempotent: YES (DROP POLICY IF EXISTS before CREATE)
-- ============================================================
--
-- ⚠️  BUCKET CREATION: Deve ser feito via Supabase Dashboard UI.
--     Storage > New bucket > nome: ppt-uploads, public: OFF, 50MB limit
--     O INSERT INTO storage.buckets falha no SQL Editor (permissão de owner).
--
-- Este script cria APENAS as policies de acesso ao bucket já existente.
--
-- Storage Security Model:
--   INSERT  → authenticated teachers only
--   SELECT  → authenticated teachers only (own files)
--   DELETE  → authenticated teachers (own files)
--   UPDATE  → service_role only (no policy = only service_role can update)
-- ============================================================

-- ── Storage RLS Policies ─────────────────────────────────────

-- Teachers can upload PPT files to the ppt-uploads bucket
DROP POLICY IF EXISTS "ppt-uploads: teacher upload" ON storage.objects;
CREATE POLICY "ppt-uploads: teacher upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ppt-uploads'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Teachers can read/download files in ppt-uploads bucket
DROP POLICY IF EXISTS "ppt-uploads: teacher read own" ON storage.objects;
CREATE POLICY "ppt-uploads: teacher read own"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ppt-uploads'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Teachers can delete files they uploaded
DROP POLICY IF EXISTS "ppt-uploads: teacher delete own" ON storage.objects;
CREATE POLICY "ppt-uploads: teacher delete own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ppt-uploads'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- NOTE: No UPDATE policy — only service_role (API routes) can update storage objects.
-- NOTE: process-ppt route uses SUPABASE_SERVICE_ROLE_KEY to download files,
--       which bypasses all RLS — intentional and required for server-side processing.
