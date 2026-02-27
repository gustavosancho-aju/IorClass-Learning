'use server'

import { createClient } from '@/lib/supabase/server'

/* ── Types ──────────────────────────────────────────────── */
export interface CreatePptUploadInput {
  lessonId:         string
  lessonTitle:      string
  teacherId:        string
  storagePath:      string
  originalFilename: string
  courseModuleId?:  string | null
}

export interface CreatePptUploadResult {
  lessonId?: string
  error?:    string
}

/* ── Server Action ──────────────────────────────────────── */
/**
 * Creates a lesson record + ppt_uploads record after the client has
 * uploaded the file to Supabase Storage.
 *
 * The lessonId is pre-generated client-side so it can be used in the
 * storage path BEFORE the DB record is created.
 */
export async function createPptUploadRecord(
  input: CreatePptUploadInput
): Promise<CreatePptUploadResult> {
  const { lessonId, lessonTitle, teacherId, storagePath, originalFilename, courseModuleId } = input

  const supabase = createClient()

  /* 1 ── Create lesson record with the pre-generated UUID */
  const { error: lessonError } = await supabase
    .from('lessons')
    .insert({
      id:               lessonId,
      title:            lessonTitle,
      created_by:       teacherId,
      course_module_id: courseModuleId ?? null,
    })

  if (lessonError) {
    return { error: `Falha ao criar registro da aula: ${lessonError.message}` }
  }

  /* 2 ── Create ppt_uploads record */
  const { error: uploadError } = await supabase
    .from('ppt_uploads')
    .insert({
      filename:     originalFilename,
      storage_path: storagePath,
      lesson_id:    lessonId,
      status:       'processing',
      uploaded_by:  teacherId,
    })

  if (uploadError) {
    // Best-effort rollback: remove the lesson so we don't leave orphan records
    await supabase.from('lessons').delete().eq('id', lessonId)
    return { error: `Falha ao registrar upload: ${uploadError.message}` }
  }

  return { lessonId }
}
