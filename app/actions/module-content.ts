'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ModuleContent } from '@/lib/content-generator'
import { sanitizeModuleContent } from '@/lib/module-content-validation'

export interface UpdateModuleContentInput {
  moduleId: string
  content:  ModuleContent
}

export interface UpdateModuleContentResult {
  content?: ModuleContent
  error?:   string
}

export async function updateModuleContent(
  input: UpdateModuleContentInput
): Promise<UpdateModuleContentResult> {
  if (!input.moduleId) {
    return { error: 'ID do slide inválido.' }
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Não autorizado. Faça login novamente.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'teacher') {
    return { error: 'Apenas professores podem revisar aulas.' }
  }

  const supabaseAdmin = createAdminClient()
  const { data: moduleRow, error: moduleError } = await supabaseAdmin
    .from('modules')
    .select('id, lesson_id, title, order_index')
    .eq('id', input.moduleId)
    .single()

  if (moduleError || !moduleRow) {
    return { error: 'Slide não encontrado.' }
  }

  const { data: lesson, error: lessonError } = await supabaseAdmin
    .from('lessons')
    .select('id, created_by')
    .eq('id', moduleRow.lesson_id)
    .single()

  if (lessonError || !lesson) {
    return { error: 'Aula não encontrada.' }
  }

  if (lesson.created_by !== user.id) {
    return { error: 'Você não tem permissão para revisar esta aula.' }
  }

  const sanitized = sanitizeModuleContent(input.content, {
    title: moduleRow.title,
    slideNumber: moduleRow.order_index + 1,
  })

  const { error: updateError } = await supabaseAdmin
    .from('modules')
    .update({
      title: sanitized.title,
      content_json: sanitized as unknown as Record<string, unknown>,
    })
    .eq('id', moduleRow.id)

  if (updateError) {
    return { error: `Falha ao salvar revisão: ${updateError.message}` }
  }

  revalidatePath(`/teacher/lessons/${lesson.id}`)
  revalidatePath(`/student/lessons/${lesson.id}`)

  return { content: sanitized }
}
