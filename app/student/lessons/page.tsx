import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { ChevronRight, BookOpen, Lock } from 'lucide-react'

export const metadata = { title: 'Módulos — Master Speaking' }

export default async function StudentLessonsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── Fetch published lessons + student scores ───────────────── */
  const [lessonsRes, scoresRes] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, cover_emoji, description, course_module_id, course_modules(title, order_index, description)')
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
  type CourseModuleInfo = { title: string; order_index: number; description: string | null }

  interface LessonGroup {
    moduleId:    string | null
    moduleTitle: string | null
    moduleDesc:  string | null
    moduleOrder: number
    lessons:     LessonRow[]
  }

  const groupMap = new Map<string | null, LessonGroup>()

  for (const lesson of lessons) {
    const cm  = lesson.course_modules as unknown as CourseModuleInfo | null
    const key = lesson.course_module_id ?? null

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        moduleId:    key,
        moduleTitle: cm?.title ?? null,
        moduleDesc:  cm?.description ?? null,
        moduleOrder: cm?.order_index ?? Infinity,
        lessons:     [],
      })
    }
    groupMap.get(key)!.lessons.push(lesson)
  }

  // Sort groups: modules by order_index first, unassigned lessons last
  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.moduleId === null) return 1
    if (b.moduleId === null) return -1
    return a.moduleOrder - b.moduleOrder
  })

  const hasModules = groups.length > 1 || (groups.length === 1 && groups[0].moduleId !== null)

  /* ── Module progress badge ──────────────────────────────────── */
  function moduleBestScore(group: LessonGroup): number | null {
    const avgs = group.lessons.map(l => avgScore(l.id)).filter((s): s is number => s !== null)
    if (avgs.length === 0) return null
    return Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
  }

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
          {avg !== null ? (
            <span className={[
              'text-xs font-black px-2 py-1 rounded-full',
              avg >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
            ].join(' ')}>
              {avg}%
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400 px-2 py-1 rounded-full bg-slate-50">
              Novo
            </span>
          )}
          <ChevronRight size={18} className="text-slate-300 group-hover:text-ms-medium transition-colors" />
        </div>
      </Link>
    )
  }

  /* ── Module card (visual header card per group) ─────────────── */
  function ModuleCard({ group, index }: { group: LessonGroup; index: number }) {
    const avg     = moduleBestScore(group)
    const count   = group.lessons.length
    const isDone  = avg !== null && avg >= 70
    const colors  = [
      'from-violet-600 to-indigo-600',
      'from-ms-medium to-ms-dark',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-500',
    ]
    const gradient = colors[index % colors.length]

    return (
      <section className="animate-fade-in-up">
        {/* Module card header */}
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 mb-4 text-white shadow-md`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Módulo {index + 1}
                </span>
                {isDone && (
                  <span className="text-xs font-black bg-white/20 text-white px-2 py-0.5 rounded-full">
                    ✓ Concluído
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black leading-tight">{group.moduleTitle}</h2>
              {group.moduleDesc && (
                <p className="text-white/70 text-xs mt-1 line-clamp-2">{group.moduleDesc}</p>
              )}
            </div>

            {/* Score / lesson count badge */}
            <div className="flex-shrink-0 text-right">
              {avg !== null ? (
                <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-2xl font-black leading-none">{avg}%</p>
                  <p className="text-white/70 text-xs mt-0.5">média</p>
                </div>
              ) : (
                <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-2xl font-black leading-none">{count}</p>
                  <p className="text-white/70 text-xs mt-0.5">{count === 1 ? 'aula' : 'aulas'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {avg !== null && (
            <div className="mt-4">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all"
                  style={{ width: `${Math.min(avg, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lesson list */}
        {count > 0 ? (
          <div className="space-y-3 pl-0.5">
            {group.lessons.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-5 text-center">
            <Lock size={20} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">Nenhuma aula neste módulo ainda</p>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="px-4 py-6 md:p-8 max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black text-ms-dark flex items-center gap-2 mb-1">
          <BookOpen size={28} className="text-ms-medium" />
          Módulos
        </h1>
        <p className="text-slate-500 text-sm">
          {hasModules
            ? `${groups.filter(g => g.moduleId !== null).length} módulo${groups.filter(g => g.moduleId !== null).length !== 1 ? 's' : ''} disponíveis`
            : 'Conteúdo disponível para você'}
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <span className="text-5xl mb-3 block">📭</span>
          <p className="font-bold text-ms-dark mb-1">Nenhuma aula disponível</p>
          <p className="text-slate-400 text-sm">Aguarde seu professor publicar as aulas.</p>
        </div>
      ) : hasModules ? (
        /* ── Module cards view ── */
        <div className="space-y-10">
          {groups.map((group, idx) =>
            group.moduleId !== null ? (
              <ModuleCard key={group.moduleId} group={group} index={idx} />
            ) : (
              /* Unassigned lessons section */
              <section key="__no_module" className="animate-fade-in-up">
                <h2 className="text-ms-dark font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-slate-400">
                  <span>📄</span> Outras aulas
                </h2>
                <div className="space-y-3">
                  {group.lessons.map(lesson => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      ) : (
        /* ── Flat view (legacy — no modules) ── */
        <div className="space-y-3">
          {lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  )
}
