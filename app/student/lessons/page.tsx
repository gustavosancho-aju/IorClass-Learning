import { redirect }   from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = { title: 'Minhas Aulas — Master Speaking' }

export default async function StudentLessonsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── Fetch published lessons + student scores ───────────────── */
  const [lessonsRes, scoresRes] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, cover_emoji, description, course_module_id, course_modules(title, order_index)')
      .eq('is_published', true)
      .order('order_index'),

    supabase
      .from('scores')
      .select('lesson_id, score, module_type')
      .eq('student_id', user.id),
  ])

  const lessons = lessonsRes.data ?? []
  const scores  = scoresRes.data  ?? []

  // Compute avg score per lesson
  function avgScore(lessonId: string): number | null {
    const ls = scores.filter(s => s.lesson_id === lessonId)
    if (ls.length === 0) return null
    return Math.round(ls.reduce((sum, s) => sum + (s.score ?? 0), 0) / ls.length)
  }

  /* ── Group lessons by module ────────────────────────────────── */
  type LessonRow = typeof lessons[number]
  type CourseModuleInfo = { title: string; order_index: number }

  interface LessonGroup {
    moduleId:    string | null
    moduleTitle: string | null
    moduleOrder: number
    lessons:     LessonRow[]
  }

  const groupMap = new Map<string | null, LessonGroup>()

  for (const lesson of lessons) {
    const cm = lesson.course_modules as unknown as CourseModuleInfo | null
    const key = lesson.course_module_id ?? null

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        moduleId:    key,
        moduleTitle: cm?.title ?? null,
        moduleOrder: cm?.order_index ?? Infinity,
        lessons:     [],
      })
    }
    groupMap.get(key)!.lessons.push(lesson)
  }

  // Sort groups: modules by order_index first, "Outras aulas" (null) last
  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.moduleId === null) return 1
    if (b.moduleId === null) return -1
    return a.moduleOrder - b.moduleOrder
  })

  const hasMultipleGroups = groups.length > 1 || (groups.length === 1 && groups[0].moduleId !== null)

  /* ── Lesson card ────────────────────────────────────────────── */
  function LessonCard({ lesson }: { lesson: LessonRow }) {
    const avg = avgScore(lesson.id)
    return (
      <Link
        href={`/student/lessons/${lesson.id}`}
        className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200
                   px-5 py-4 hover:border-ms-medium hover:shadow-sm transition-all group"
      >
        <span className="text-3xl">{lesson.cover_emoji ?? '📎'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-ms-dark group-hover:text-ms-medium transition-colors">
            {lesson.title}
          </p>
          {lesson.description && (
            <p className="text-slate-400 text-xs truncate mt-0.5">{lesson.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {avg !== null && (
            <span className={[
              'text-xs font-black px-2 py-1 rounded-full',
              avg >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
            ].join(' ')}>
              {avg}%
            </span>
          )}
          <ChevronRight size={18} className="text-slate-300 group-hover:text-ms-medium transition-colors" />
        </div>
      </Link>
    )
  }

  return (
    <div className="px-4 py-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ms-dark mb-1">📚 Minhas Aulas</h1>
        <p className="text-slate-500 text-sm">Aulas disponíveis para você</p>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <span className="text-5xl mb-3 block">📭</span>
          <p className="font-bold text-ms-dark mb-1">Nenhuma aula disponível</p>
          <p className="text-slate-400 text-sm">Aguarde seu professor publicar as aulas.</p>
        </div>
      ) : hasMultipleGroups ? (
        /* Grouped view — at least one lesson has a module */
        <div className="space-y-8">
          {groups.map(group => (
            <section key={group.moduleId ?? '__no_module'}>
              {/* Section header */}
              <h2 className="text-ms-dark font-bold text-base mb-3 flex items-center gap-2">
                {group.moduleId ? (
                  <>
                    <span className="text-lg">📚</span>
                    {group.moduleTitle}
                  </>
                ) : (
                  <>
                    <span className="text-lg">📄</span>
                    Outras aulas
                  </>
                )}
              </h2>
              <div className="space-y-3">
                {group.lessons.map(lesson => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Flat view — no lessons have modules (legacy behavior) */
        <div className="space-y-3">
          {lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  )
}
