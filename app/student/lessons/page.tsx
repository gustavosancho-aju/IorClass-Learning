import { redirect }   from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Minhas Aulas — Master Speaking' }

export default async function StudentLessonsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── Fetch published lessons + student scores ───────────────── */
  const [lessonsRes, scoresRes] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, cover_emoji, description')
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

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
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
      ) : (
        <div className="space-y-3">
          {lessons.map(lesson => {
            const avg = avgScore(lesson.id)
            return (
              <Link
                key={lesson.id}
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
          })}
        </div>
      )}
    </div>
  )
}
