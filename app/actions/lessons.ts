'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ── Types ──────────────────────────────────────────────────────── */

export interface DeleteLessonResult {
  success?: boolean
  error?:   string
}

/* ── deleteLesson ────────────────────────────────────────────────── */
/**
 * Permanently deletes a lesson owned by the authenticated teacher.
 *
 * Cascade behaviour (defined in DB migrations):
 *   - modules      → ON DELETE CASCADE  (slide content removed)
 *   - scores       → ON DELETE CASCADE  (student scores removed)
 *   - ppt_uploads  → ON DELETE CASCADE  (upload record removed)
 *
 * Note: The actual file in Supabase Storage is NOT deleted here
 *       (out of scope for this story — acceptable for MVP).
 */
export async function deleteLesson(
  lessonId: string,
): Promise<DeleteLessonResult> {
  if (!lessonId) return { error: 'ID da aula inválido.' }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  /* Auth guard */
  if (authError || !user) {
    return { error: 'Não autorizado. Faça login novamente.' }
  }

  /* Role check */
  const role = user.user_metadata?.role as string | undefined
  if (role !== 'teacher') {
    return { error: 'Forbidden.' }
  }

  /* Ownership check */
  const { data: lesson, error: fetchError } = await supabase
    .from('lessons')
    .select('id, created_by')
    .eq('id', lessonId)
    .single()

  if (fetchError || !lesson) {
    return { error: 'Aula não encontrada.' }
  }

  if (lesson.created_by !== user.id) {
    return { error: 'Você não tem permissão para excluir esta aula.' }
  }

  /* Delete — modules, scores, ppt_uploads cascade automatically */
  const { error: deleteError } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (deleteError) {
    return { error: `Falha ao excluir aula: ${deleteError.message}` }
  }

  revalidatePath('/teacher/lessons')
  revalidatePath('/teacher/dashboard')
  revalidatePath('/student/lessons')

  return { success: true }
}
