import { createClient } from '@/lib/supabase/server'
import { formatScore, getScoreLevel, getModuleInfo, calcAvgScore } from '@/lib/utils'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata = { title: 'Meu Progresso — Master Speaking' }

// ─── Types ───────────────────────────────────────────────────
interface ScoreRow {
  score:        number | null
  module_type:  'summary' | 'tasks' | 'speaking'
  lesson_id:    string
  created_at:   string
  modules: {
    title: string
  } | null
  lessons: {
    title: string
    order_index: number
  } | null
}

export default async function ProgressPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Fetch all scores with lesson/module info ──────────────
  const { data: scores } = await supabase
    .from('scores')
    .select(`
      score,
      module_type,
      lesson_id,
      created_at,
      modules (title),
      lessons (title, order_index)
    `)
    .eq('student_id', user!.id)
    .order('created_at', { ascending: false })

  const allScores = (scores as ScoreRow[] | null) ?? []

  // ── Aggregate stats ───────────────────────────────────────
  const allValues   = allScores.map(s => s.score ?? 0)
  const overallAvg  = calcAvgScore(allValues)
  const scoreLevel  = getScoreLevel(overallAvg)

  // Group scores by lesson
  const byLesson: Record<string, ScoreRow[]> = {}
  for (const s of allScores) {
    if (!byLesson[s.lesson_id]) byLesson[s.lesson_id] = []
    byLesson[s.lesson_id].push(s)
  }

  // Group scores by module type
  const byType: Record<string, number[]> = { summary: [], tasks: [], speaking: [] }
  for (const s of allScores) {
    if (s.module_type && byType[s.module_type]) {
      byType[s.module_type].push(s.score ?? 0)
    }
  }

  const totalLessons    = Object.keys(byLesson).length
  const totalActivities = allScores.length

  // Best score
  const bestScore = allValues.length ? Math.max(...allValues) : null

  // Most recent activity date
  const lastActivity = allScores[0]?.created_at
    ? new Date(allScores[0].created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl ms-gradient-bg flex items-center justify-center">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-ms-dark font-black text-2xl">Meu Progresso</h1>
            <p className="text-slate-400 text-sm font-semibold">
              Acompanhe sua evolução no Master Speaking
            </p>
          </div>
        </div>
      </div>

      {allScores.length === 0 ? (
        /* ── Estado vazio ── */
        <EmptyState
          illustration="progress"
          title="Nenhuma atividade ainda"
          description="Complete módulos nas aulas para ver seu progresso aqui."
          ctaLabel="Começar agora"
          ctaHref="/student/lessons"
        />
      ) : (
        <>
          {/* ── Top stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Média geral */}
            <div className={`ms-card text-center ${scoreLevel.bg} border border-current/10`}>
              <div className={`w-14 h-14 rounded-full border-4 mx-auto mb-2 flex items-center
                              justify-center font-black text-xl
                              ${overallAvg >= 80 ? 'border-emerald-500 text-emerald-700' :
                                overallAvg >= 60 ? 'border-ms-medium text-ms-medium' :
                                                  'border-amber-500 text-amber-700'}`}>
                {Math.round(overallAvg)}
              </div>
              <p className="text-ms-dark font-black text-sm">Média Geral</p>
              <p className={`text-xs font-bold mt-0.5 ${scoreLevel.color}`}>
                {scoreLevel.label}
              </p>
            </div>

            {/* Aulas praticadas */}
            <div className="ms-card text-center border border-orange-200 bg-orange-50">
              <div className="text-3xl mb-1">🔥</div>
              <p className="text-orange-700 font-black text-2xl">{totalLessons}</p>
              <p className="text-ms-dark font-black text-sm">Aulas Praticadas</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">no total</p>
            </div>

            {/* Total de atividades */}
            <div className="ms-card text-center border border-blue-200 bg-blue-50">
              <div className="text-3xl mb-1">✅</div>
              <p className="text-blue-700 font-black text-2xl">{totalActivities}</p>
              <p className="text-ms-dark font-black text-sm">Atividades Feitas</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">módulos completados</p>
            </div>

            {/* Melhor nota */}
            <div className="ms-card text-center border border-ms-gold/30 bg-amber-50">
              <div className="text-3xl mb-1">🏆</div>
              <p className="text-ms-gold font-black text-2xl">
                {bestScore !== null ? `${bestScore}%` : '—'}
              </p>
              <p className="text-ms-dark font-black text-sm">Melhor Nota</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">
                {lastActivity ?? 'nunca'}
              </p>
            </div>
          </div>

          {/* ── Desempenho por tipo de módulo ── */}
          <div className="ms-card mb-6">
            <h2 className="text-ms-dark font-black text-lg mb-5">
              Desempenho por Tipo de Módulo
            </h2>
            <div className="space-y-4">
              {(['summary', 'tasks', 'speaking'] as const).map(type => {
                const info   = getModuleInfo(type)
                const scores = byType[type]
                const avg    = calcAvgScore(scores)
                const level  = scores.length ? getScoreLevel(avg) : null

                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.emoji}</span>
                        <div>
                          <p className="text-ms-dark font-bold text-sm">{info.label}</p>
                          <p className="text-slate-400 text-xs">{info.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {scores.length > 0 ? (
                          <>
                            <p className={`text-sm font-black ${level?.color}`}>
                              {formatScore(avg)}
                            </p>
                            <p className="text-xs text-slate-400">{scores.length} tentativa{scores.length !== 1 ? 's' : ''}</p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-300 font-semibold">Não feito</p>
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700
                          ${scores.length === 0 ? 'w-0' :
                            avg >= 80 ? 'bg-emerald-500' :
                            avg >= 60 ? 'bg-ms-medium' : 'bg-amber-500'}`}
                        style={{ width: scores.length ? `${avg}%` : '0%' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Histórico por Aula ── */}
          <div className="ms-card">
            <h2 className="text-ms-dark font-black text-lg mb-5">
              Histórico por Aula
            </h2>
            <div className="space-y-4">
              {Object.entries(byLesson)
                .sort(([, a], [, b]) => {
                  const ao = a[0]?.lessons?.order_index ?? 99
                  const bo = b[0]?.lessons?.order_index ?? 99
                  return ao - bo
                })
                .map(([lessonId, lessonScores]) => {
                  const lessonTitle   = lessonScores[0]?.lessons?.title ?? 'Aula'
                  const lessonOrder   = lessonScores[0]?.lessons?.order_index ?? 0
                  const lessonValues  = lessonScores.map(s => s.score ?? 0)
                  const lessonAvg     = calcAvgScore(lessonValues)
                  const lessonLevel   = getScoreLevel(lessonAvg)

                  return (
                    <Link
                      key={lessonId}
                      href={`/student/lessons/${lessonId}`}
                      className="block p-4 rounded-xl border border-slate-100 hover:border-ms-gold/30
                                 hover:bg-ms-beige transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Número */}
                        <div className="w-9 h-9 rounded-lg ms-gradient-bg flex items-center
                                        justify-center text-white font-black text-xs flex-shrink-0">
                          {String(lessonOrder + 1).padStart(2, '0')}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-ms-dark font-bold text-sm truncate">{lessonTitle}</p>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0
                                             ${lessonLevel.color} ${lessonLevel.bg}`}>
                              {formatScore(lessonAvg)}
                            </span>
                          </div>

                          {/* Módulos completados */}
                          <div className="flex flex-wrap gap-2">
                            {lessonScores.map((s, i) => {
                              const info  = getModuleInfo(s.module_type)
                              const slvl  = getScoreLevel(s.score ?? 0)
                              return (
                                <span key={i}
                                  className={`inline-flex items-center gap-1 text-xs font-bold
                                              px-2 py-0.5 rounded-full ${slvl.bg} ${slvl.color}`}>
                                  {info.emoji} {info.label} · {s.score ?? 0}%
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* ── Motivação ── */}
          <div className={`ms-card mt-6 text-center ${scoreLevel.bg} border ${
            overallAvg >= 80 ? 'border-emerald-200' :
            overallAvg >= 60 ? 'border-blue-200' : 'border-amber-200'}`}>
            <div className="text-4xl mb-2">
              {overallAvg >= 80 ? '🥇' : overallAvg >= 60 ? '🥈' : '🎯'}
            </div>
            <p className={`font-black text-lg ${scoreLevel.color}`}>{scoreLevel.label}!</p>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              {overallAvg >= 80
                ? 'Você está arrasando! Continue assim para dominar o inglês profissional.'
                : overallAvg >= 60
                ? 'Bom progresso! Revise os módulos de Oratório para subir ainda mais.'
                : 'Cada tentativa conta! Pratique mais para melhorar sua média.'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
