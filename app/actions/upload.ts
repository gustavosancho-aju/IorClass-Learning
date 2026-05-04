'use server'

import { createClient } from '@/lib/supabase/server'

/* ── Types ──────────────────────────────────────────────── */
export interface CreatePptUploadInput {
  lessonId:         string
  lessonTitle:      string
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
  const { lessonId, lessonTitle, storagePath, originalFilename, courseModuleId } = input

  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Usuário não autenticado. Faça login novamente.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { error: `Falha ao validar permissões: ${profileError.message}` }
  }

  if (profile?.role !== 'teacher') {
    return { error: 'Apenas professores podem registrar uploads de aulas.' }
  }

  if (!lessonId || !lessonTitle || !storagePath || !originalFilename) {
    return { error: 'Dados obrigatórios do upload não foram informados.' }
  }

  if (!storagePath.startsWith(`${user.id}/`)) {
    return { error: 'Caminho de armazenamento inválido para este usuário.' }
  }

  /* 1 ── Create lesson record with the pre-generated UUID */
  const { error: lessonError } = await supabase
    .from('lessons')
    .insert({
      id:               lessonId,
      title:            lessonTitle,
      created_by:       user.id,
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
      uploaded_by:  user.id,
    })

  if (uploadError) {
    // Best-effort rollback: remove the lesson so we don't leave orphan records
    await supabase.from('lessons').delete().eq('id', lessonId)
    return { error: `Falha ao registrar upload: ${uploadError.message}` }
  }

  return { lessonId }
}
