import { createClient }    from '@/lib/supabase/server'
import { revalidatePath }  from 'next/cache'
import { Eye, Plus, ToggleLeft, ToggleRight, Upload } from 'lucide-react'
import Link from 'next/link'

/* ── Server Action: toggle published status ─────────────────────── */
async function togglePublish(lessonId: string, current: boolean) {
  'use server'
  const supabase = createClient()

  // Explicit auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  // Ownership check — only the lesson creator can toggle
  const { data: lesson } = await supabase
    .from('lessons')
    .select('created_by')
    .eq('id', lessonId)
    .single()

  if (lesson?.created_by !== user.id) throw new Error('Forbidden')

  await supabase
    .from('lessons')
    .update({ is_published: !current })
    .eq('id', lessonId)

  revalidatePath('/teacher/lessons')
}

/* ── Page ───────────────────────────────────────────────────────── */
export default async function TeacherLessonsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, cover_emoji, is_published, order_index, created_by, modules(count)')
    .eq('created_by', user!.id)
    .order('order_index')

  const total     = lessons?.length     ?? 0
  const published = lessons?.filter(l => l.is_published).length ?? 0

  return (
    <div className="px-4 py-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-in-up">
        <div>
          <p className="text-ms-medium font-semibold text-sm uppercase tracking-widest mb-1">
            Gerenciar
          </p>
          <h1 className="text-ms-dark font-black text-3xl">Minhas Aulas</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            {published} de {total} publicadas
          </p>
        </div>
        <Link
          href="/teacher/upload"
          className="flex items-center gap-2 bg-ms-gradient text-white
                     text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90
                     transition-opacity shadow"
        >
          <Plus size={16} />
          Nova Aula
        </Link>
      </div>

      {/* List */}
      {!lessons || lessons.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {lessons.map(lesson => {
            type ModuleCountRow = { count: number }
            const moduleCount =
              (lesson.modules as unknown as ModuleCountRow[])?.[0]?.count ?? 0
            const actionFn = togglePublish.bind(null, lesson.id, lesson.is_published)

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-slate-200 p-4
                           flex items-center gap-4 hover:border-slate-300
                           transition-colors animate-fade-in-up"
              >
                {/* Emoji icon */}
                <div className="w-12 h-12 rounded-xl ms-gradient-bg flex-shrink-0
                                flex items-center justify-center text-2xl">
                  {lesson.cover_emoji || '📖'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-ms-dark font-bold truncate">{lesson.title}</p>
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">
                    {moduleCount} {moduleCount === 1 ? 'slide' : 'slides'}
                  </p>
                </div>

                {/* Status chip */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  lesson.is_published
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {lesson.is_published ? 'Publicada' : 'Rascunho'}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/teacher/lessons/${lesson.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                               font-bold text-ms-medium border border-ms-medium/30
                               hover:bg-ms-light transition-colors"
                  >
                    <Eye size={13} />
                    Ver
                  </Link>

                  <form action={actionFn}>
                    <button
                      type="submit"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 text-xs font-bold border transition-colors ${
                        lesson.is_published
                          ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                          : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {lesson.is_published
                        ? <><ToggleRight size={13} /> Despublicar</>
                        : <><ToggleLeft  size={13} /> Publicar</>
                      }
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Empty state ────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="text-center py-20">
      <span className="text-6xl mb-4 block">📚</span>
      <p className="text-ms-dark font-bold text-lg mb-2">Nenhuma aula criada ainda</p>
      <p className="text-slate-400 text-sm font-semibold mb-6">
        Importe uma apresentação PPT para gerar sua primeira aula
      </p>
      <Link
        href="/teacher/upload"
        className="inline-flex items-center gap-2 bg-ms-gradient text-white
                   text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90
                   transition-opacity shadow"
      >
        <Upload size={15} />
        Enviar apresentação
      </Link>
    </div>
  )
}
