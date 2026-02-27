'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ── Types ──────────────────────────────────────────────────────── */
export interface CreateCourseModuleInput {
  title:        string
  description?: string | null
}

export interface CreateCourseModuleResult {
  moduleId?: string
  error?:    string
}

export interface DeleteCourseModuleResult {
  success?: boolean
  error?:   string
}

/* ── createCourseModule ─────────────────────────────────────────── */
/**
 * Creates a new course_module owned by the authenticated teacher.
 * Validates title, inserts record, revalidates /teacher/modules.
 */
export async function createCourseModule(
  input: CreateCourseModuleInput
): Promise<CreateCourseModuleResult> {
  const { title, description } = input

  /* Auth guard */
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Não autorizado. Faça login novamente.' }
  }

  /* Validate title */
  const trimmedTitle = title?.trim() ?? ''
  if (trimmedTitle.length === 0) {
    return { error: 'O título do módulo é obrigatório.' }
  }
  if (trimmedTitle.length > 200) {
    return { error: 'Título muito longo. Máximo: 200 caracteres.' }
  }

  /* Compute next order_index */
  const { data: existing } = await supabase
    .from('course_modules')
    .select('order_index')
    .eq('created_by', user.id)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1

  /* Insert */
  const { data, error: insertError } = await supabase
    .from('course_modules')
    .insert({
      title:       trimmedTitle,
      description: description?.trim() || null,
      order_index: nextIndex,
      created_by:  user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return { error: `Falha ao criar módulo: ${insertError.message}` }
  }

  revalidatePath('/teacher/modules')
  revalidatePath('/teacher/lessons')
  revalidatePath('/teacher/upload')

  return { moduleId: data.id }
}

/* ── deleteCourseModule ─────────────────────────────────────────── */
/**
 * Deletes a course_module owned by the authenticated teacher.
 * Associated lessons have course_module_id set to NULL (ON DELETE SET NULL).
 */
export async function deleteCourseModule(
  moduleId: string
): Promise<DeleteCourseModuleResult> {
  if (!moduleId) return { error: 'ID do módulo inválido.' }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Não autorizado. Faça login novamente.' }
  }

  /* Ownership check */
  const { data: module, error: fetchError } = await supabase
    .from('course_modules')
    .select('id, created_by')
    .eq('id', moduleId)
    .single()

  if (fetchError || !module) {
    return { error: 'Módulo não encontrado.' }
  }

  if (module.created_by !== user.id) {
    return { error: 'Você não tem permissão para excluir este módulo.' }
  }

  /* Delete — lessons.course_module_id becomes NULL via ON DELETE SET NULL */
  const { error: deleteError } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', moduleId)

  if (deleteError) {
    return { error: `Falha ao excluir módulo: ${deleteError.message}` }
  }

  revalidatePath('/teacher/modules')
  revalidatePath('/teacher/lessons')
  revalidatePath('/teacher/upload')
  revalidatePath('/student/lessons')

  return { success: true }
}
