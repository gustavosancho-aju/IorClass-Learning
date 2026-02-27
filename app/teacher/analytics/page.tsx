import { createClient } from '@/lib/supabase/server'
import { formatScore, getScoreLevel } from '@/lib/utils'
import { TrendingUp, Users, BookOpen, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Period = 'week' | 'month' | 'all'

interface PageProps {
  searchParams: { period?: string }
}

/* ── Page ───────────────────────────────────────────────────────── */
export default async function TeacherAnalyticsPage({ searchParams }: PageProps) {
  const period  = (searchParams.period ?? 'all') as Period
  const supabase = createClient()

  /* ── Compute date filter ────────────────────────────────────── */
  let since: string | null = null
  if (period === 'week') {
    const d = new Date(); d.setDate(d.getDate() - 7)
    since = d.toISOString()
  } else if (period === 'month') {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    since = d.toISOString()
  }

  /* ── Queries ────────────────────────────────────────────────── */
  let scoresQuery = supabase
    .from('scores')
    .select('student_id, lesson_id, module_id, module_type, score, created_at')

  if (since) scoresQuery = scoresQuery.gte('created_at', since)
  const { data: scores } = await scoresQuery

  const { data: perfRows } = await supabase
    .from('student_performance')
    .select('student_id, student_name, lesson_id, lesson_title, avg_score, modules_completed')

  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  /* ── Aggregations ───────────────────────────────────────────── */
  const allScores = scores ?? []

  const classAvg = allScores.length > 0
    ? allScores.reduce((a, s) => a + (s.score ?? 0), 0) / allScores.length
    : 0

  // Avg per lesson (for bar chart)
  const lessonScoreMap = new Map<string, { title: string; total: number; count: number }>()
  for (const row of perfRows ?? []) {
    const existing = lessonScoreMap.get(row.lesson_id)
    if (!existing) {
      lessonScoreMap.set(row.lesson_id, { title: row.lesson_title, total: row.avg_score, count: 1 })
    } else {
      lessonScoreMap.set(row.lesson_id, {
        ...existing,
        total: existing.total + row.avg_score,
        count: existing.count + 1,
      })
    }
  }
  const lessonAvgs = Array.from(lessonScoreMap.entries()).map(([id, v]) => ({
    id,
    title: v.title,
    avg:   Math.round(v.total / v.count),
  })).sort((a, b) => a.avg - b.avg)  // sorted ascending for "hardest first"

  // Module type difficulty
  const moduleTypeTotals: Record<string, { total: number; count: number }> = {}
  for (const s of allScores) {
    const t = s.module_type ?? 'unknown'
    if (!moduleTypeTotals[t]) moduleTypeTotals[t] = { total: 0, count: 0 }
    moduleTypeTotals[t].total += s.score ?? 0
    moduleTypeTotals[t].count += 1
  }
  const hardestType = Object.entries(moduleTypeTotals)
    .map(([type, v]) => ({ type, avg: v.total / v.count }))
    .sort((a, b) => a.avg - b.avg)[0]

  // Per-student aggregation for top/bottom
  const studentMap = new Map<string, { name: string | null; total: number; count: number }>()
  for (const row of perfRows ?? []) {
    const ex = studentMap.get(row.student_id)
    if (!ex) {
      studentMap.set(row.student_id, { name: row.student_name, total: row.avg_score, count: 1 })
    } else {
      studentMap.set(row.student_id, { ...ex, total: ex.total + row.avg_score, count: ex.count + 1 })
    }
  }
  const studentRanking = Array.from(studentMap.entries())
    .map(([id, v]) => ({ id, name: v.name ?? 'Sem nome', avg: Math.round(v.total / v.count) }))
    .sort((a, b) => b.avg - a.avg)

  const top5    = studentRanking.slice(0, 5)
  const bottom5 = studentRanking.slice(-5).reverse()

  const maxLessonAvg = Math.max(...lessonAvgs.map(l => l.avg), 1)

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">
      {/* Header + Period filter */}
      <div className="flex items-start justify-between mb-8 animate-fade-in-up">
        <div>
          <p className="text-ms-medium font-semibold text-sm uppercase tracking-widest mb-1">
            Relatórios
          </p>
          <h1 className="text-ms-dark font-black text-3xl">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Desempenho geral da turma
          </p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([
            { id: 'week',  label: 'Semana' },
            { id: 'month', label: 'Mês'    },
            { id: 'all',   label: 'Tudo'   },
          ] as { id: Period; label: string }[]).map(p => (
            <Link
              key={p.id}
              href={`/teacher/analytics?period=${p.id}`}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-bold transition-all',
                period === p.id
                  ? 'bg-white text-ms-dark shadow-sm'
                  : 'text-slate-400 hover:text-ms-dark',
              ].join(' ')}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <KPICard
          icon={<Users size={20} className="text-ms-medium" />}
          label="Total de Alunos"
          value={String(totalStudents ?? 0)}
          color="border-ms-medium/20 bg-blue-50"
        />
        <KPICard
          icon={<TrendingUp size={20} className="text-emerald-600" />}
          label="Média da Turma"
          value={formatScore(classAvg)}
          color="border-emerald-200 bg-emerald-50"
        />
        <KPICard
          icon={<AlertCircle size={20} className="text-red-500" />}
          label="Módulo + Difícil"
          value={hardestType
            ? `${moduleTypeLabel(hardestType.type)} (${formatScore(hardestType.avg)})`
            : '—'}
          color="border-red-200 bg-red-50"
        />
      </div>

      {/* Bar chart: avg per lesson */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen size={18} className="text-ms-medium" />
          <h2 className="text-ms-dark font-black text-base">Média por Aula</h2>
        </div>

        {lessonAvgs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Sem dados para o período</p>
        ) : (
          <div className="space-y-3">
            {lessonAvgs.map(lesson => {
              const pct   = Math.max(4, (lesson.avg / maxLessonAvg) * 100)
              const level = getScoreLevel(lesson.avg)
              return (
                <div key={lesson.id} className="flex items-center gap-3">
                  <p className="w-36 text-xs font-semibold text-slate-500 truncate flex-shrink-0">
                    {lesson.title}
                  </p>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: lesson.avg >= 80
                          ? '#22c55e'
                          : lesson.avg >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className={`w-10 text-right text-xs font-black flex-shrink-0 ${level.color}`}>
                    {lesson.avg}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top / Bottom students */}
      <div className="grid md:grid-cols-2 gap-6">
        <RankingTable title="🏆 Top 5 Alunos" students={top5}    best />
        <RankingTable title="💪 Precisam de Apoio" students={bottom5} best={false} />
      </div>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */
function moduleTypeLabel(type: string) {
  if (type === 'summary') return 'Resumo'
  if (type === 'tasks')   return 'Tarefas'
  if (type === 'speaking') return 'Oratório'
  return type
}

/* ── Sub-components ─────────────────────────────────────────────── */
function KPICard({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className={`ms-card border ${color} animate-fade-in-up`}>
      <div className="w-9 h-9 rounded-xl bg-white/80 shadow-sm flex items-center
                      justify-center mb-3">
        {icon}
      </div>
      <p className="text-xl font-black text-ms-dark leading-tight">{value}</p>
      <p className="text-slate-500 text-xs font-semibold mt-1">{label}</p>
    </div>
  )
}

function RankingTable({
  title, students, best: _best,
}: {
  title: string
  students: Array<{ id: string; name: string; avg: number }>
  best: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-ms-dark font-black text-sm mb-4">{title}</h3>
      {students.length === 0 ? (
        <p className="text-slate-400 text-xs text-center py-4">Sem dados</p>
      ) : (
        <ol className="space-y-2">
          {students.map((s, idx) => {
            const level = getScoreLevel(s.avg)
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-black text-slate-300">{idx + 1}</span>
                <span className="flex-1 text-sm font-semibold text-ms-dark truncate">
                  {s.name}
                </span>
                <span className={`text-sm font-black ${level.color}`}>
                  {s.avg}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
