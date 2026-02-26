import { redirect, notFound } from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { LessonPlayer }       from './LessonPlayer'
import type { LessonModule }  from './types'
import type { ModuleContent } from '@/lib/content-generator'

interface Props {
  params: { lessonId: string }
}

export default async function StudentLessonPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── Fetch lesson, modules, and existing scores in parallel ─── */
  const [lessonRes, modulesRes, scoresRes] = await Promise.all([
    supabase
      .from('lessons')
      .select('*')
      .eq('id', params.lessonId)
      .single(),

    supabase
      .from('modules')
      .select('*')
      .eq('lesson_id', params.lessonId)
      .order('order_index'),

    supabase
      .from('scores')
      .select('*')
      .eq('student_id', user.id)
      .eq('lesson_id', params.lessonId),
  ])

  if (lessonRes.error || !lessonRes.data) return notFound()

  const lesson  = lessonRes.data
  const modules: LessonModule[] = (modulesRes.data ?? []).map(mod => ({
    id:           mod.id,
    lesson_id:    mod.lesson_id,
    type:         mod.type,
    title:        mod.title,
    content_json: mod.content_json as unknown as ModuleContent,
    order_index:  mod.order_index,
    created_at:   mod.created_at,
    updated_at:   mod.updated_at,
  }))
  const scores  = scoresRes.data ?? []

  if (modules.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <span className="text-5xl mb-4 block">📭</span>
        <h1 className="text-xl font-black text-ms-dark mb-2">Aula sem conteúdo ainda</h1>
        <p className="text-slate-500 text-sm">
          O professor ainda não processou os slides desta aula.
        </p>
      </div>
    )
  }

  return (
    <LessonPlayer
      lesson={lesson}
      modules={modules}
      scores={scores}
      studentId={user.id}
    />
  )
}
