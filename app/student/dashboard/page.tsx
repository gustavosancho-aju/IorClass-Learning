import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Trophy } from 'lucide-react'
import { formatScore, getScoreLevel, calcAvgScore } from '@/lib/utils'

export default async function StudentDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // ── Dados do aluno ───────────────────────────────────────
  const [
    { data: profile },
    { data: lessons },
    { data: myScores },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .single(),

    supabase
      .from('lessons')
      .select('id, title, order_index, description')
      .eq('is_published', true)
      .order('order_index'),

    supabase
      .from('scores')
      .select('score, module_type, lesson_id, created_at')
      .eq('student_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  // ── Cálculos ─────────────────────────────────────────────
  const allScoreValues = (myScores ?? []).map(s => s.score ?? 0)
  const avgScore       = calcAvgScore(allScoreValues)
  const scoreLevel     = getScoreLevel(avgScore)

  // Aulas com ao menos 1 score
  const completedLessonIds = new Set((myScores ?? []).map(s => s.lesson_id))
  const streakCount        = completedLessonIds.size

  // Scores por módulo
  const scoresByModule: Record<string, number[]> = {}
  for (const s of myScores ?? []) {
    if (!scoresByModule[s.module_type]) scoresByModule[s.module_type] = []
    scoresByModule[s.module_type].push(s.score ?? 0)
  }

  // Hora do dia
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8 animate-fade-in-up">
        <p className="text-ms-light font-semibold text-sm uppercase tracking-widest mb-1">
          {greeting} 👋
        </p>
        <h1 className="text-ms-dark font-black text-3xl">
          {profile?.full_name
            ? `Olá, ${profile.full_name.split(' ')[0]}!`
            : 'Bem-vindo ao Master Speaking!'}
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">
          Continue de onde parou e evolua seu inglês profissional
        </p>
      </div>

      {/* ── Stats pessoais ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Média geral */}
        <div className={`ms-card border ${scoreLevel.bg} border-current/10 text-center animate-fade-in-up`}>
          <div className={`w-14 h-14 rounded-full border-4 mx-auto mb-3 flex items-center
                          justify-center font-black text-lg
                          ${avgScore >= 80 ? 'border-emerald-500 text-emerald-700' :
                            avgScore >= 60 ? 'border-ms-medium text-ms-medium' :
                                            'border-amber-500 text-amber-700'}`}>
            {allScoreValues.length ? Math.round(avgScore) : '—'}
          </div>
          <p className="text-ms-dark font-black text-sm">Média Geral</p>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">
            {allScoreValues.length} respostas
          </p>
        </div>

        {/* Streak */}
        <div className="ms-card border border-orange-200 bg-orange-50 text-center animate-fade-in-up">
          <div className="text-3xl mb-2">🔥</div>
          <p className="text-orange-700 font-black text-2xl">{streakCount}</p>
          <p className="text-ms-dark font-black text-sm">Aulas Praticadas</p>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">continue assim!</p>
        </div>

        {/* Medalha */}
        <div className="ms-card border border-ms-gold/30 bg-amber-50 text-center animate-fade-in-up">
          <div className="text-3xl mb-2">
            {avgScore >= 80 ? '🥇' : avgScore >= 60 ? '🥈' : '🎯'}
          </div>
          <p className="text-ms-gold font-black text-sm">{scoreLevel.label}</p>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">
            nível atual
          </p>
        </div>
      </div>

      {/* ── Por módulo ── */}
      {allScoreValues.length > 0 && (
        <div className="ms-card mb-6">
          <h2 className="text-ms-dark font-black text-lg mb-4">Desempenho por Módulo</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: 'summary',  emoji: '📚', label: 'Resumo' },
              { type: 'tasks',    emoji: '✏️', label: 'Tarefas' },
              { type: 'speaking', emoji: '🎤', label: 'Oratório' },
            ].map(({ type, emoji, label }) => {
              const scores = scoresByModule[type] ?? []
              const avg    = calcAvgScore(scores)
              const pct    = scores.length ? avg : null
              const level  = pct !== null ? getScoreLevel(pct) : null

              return (
                <div key={type} className="text-center">
                  <span className="text-2xl">{emoji}</span>
                  <p className="text-ms-dark font-bold text-sm mt-1">{label}</p>
                  {pct !== null ? (
                    <>
                      <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-ms-gradient"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={`text-xs font-black mt-1 ${level?.color}`}>
                        {formatScore(pct)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-300 font-semibold mt-2">—</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Aulas disponíveis ── */}
      <div className="ms-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-ms-dark font-black text-lg">Aulas Disponíveis</h2>
          <Link
            href="/student/lessons"
            className="text-ms-medium text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        {lessons && lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((lesson, i) => {
              const isStarted    = completedLessonIds.has(lesson.id)
              const lessonScores = (myScores ?? [])
                .filter(s => s.lesson_id === lesson.id)
                .map(s => s.score ?? 0)
              const lessonAvg = calcAvgScore(lessonScores)

              return (
                <Link
                  key={lesson.id}
                  href={`/student/lessons/${lesson.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-ms-beige
                             transition-colors group"
                >
                  {/* Número */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                   text-white font-black text-sm flex-shrink-0
                                   ${isStarted ? 'ms-gradient-bg' : 'bg-slate-200'}`}>
                    {isStarted
                      ? <Trophy size={16} />
                      : String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-ms-dark font-bold text-sm truncate">{lesson.title}</p>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5 truncate">
                      {lesson.description ?? 'Resumo · Tarefas · Oratório'}
                    </p>
                  </div>

                  {/* Status / Score */}
                  {isStarted && lessonScores.length > 0 ? (
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0
                                      ${getScoreLevel(lessonAvg).color}
                                      ${getScoreLevel(lessonAvg).bg}`}>
                      {formatScore(lessonAvg)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0
                                     bg-ms-dark text-white">
                      Iniciar →
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">📚</span>
            <p className="text-ms-dark font-bold text-sm mb-1">
              Nenhuma aula disponível ainda
            </p>
            <p className="text-slate-400 text-xs font-semibold">
              Aguarde o professor publicar o conteúdo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
