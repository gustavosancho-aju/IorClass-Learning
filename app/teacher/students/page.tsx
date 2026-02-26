import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, Clock, Award } from 'lucide-react'
import { formatScore, getScoreLevel } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────────────── */
interface StudentSummary {
  student_id:        string
  student_name:      string | null
  avg_score:         number
  modules_completed: number
  last_activity:     string | null
  lesson_count:      number
}

/* ── Page ───────────────────────────────────────────────────────── */
export default async function TeacherStudentsPage() {
  const supabase = createClient()

  /* Fetch all student_performance rows, then aggregate per student */
  const { data: rows } = await supabase
    .from('student_performance')
    .select('student_id, student_name, lesson_id, avg_score, modules_completed, last_activity')
    .order('last_activity', { ascending: false })

  /* Aggregate: one entry per student */
  const studentMap = new Map<string, StudentSummary>()

  for (const row of rows ?? []) {
    const existing = studentMap.get(row.student_id)
    if (!existing) {
      studentMap.set(row.student_id, {
        student_id:        row.student_id,
        student_name:      row.student_name,
        avg_score:         row.avg_score ?? 0,
        modules_completed: row.modules_completed ?? 0,
        last_activity:     row.last_activity,
        lesson_count:      1,
      })
    } else {
      const total = existing.lesson_count + 1
      studentMap.set(row.student_id, {
        ...existing,
        avg_score:         (existing.avg_score * existing.lesson_count + (row.avg_score ?? 0)) / total,
        modules_completed: existing.modules_completed + (row.modules_completed ?? 0),
        lesson_count:      total,
        last_activity:     row.last_activity ?? existing.last_activity,
      })
    }
  }

  const students = Array.from(studentMap.values()).sort((a, b) =>
    (b.last_activity ?? '').localeCompare(a.last_activity ?? '')
  )

  const totalStudents  = students.length
  const classAvg       = totalStudents > 0
    ? students.reduce((acc, s) => acc + s.avg_score, 0) / totalStudents
    : 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <p className="text-ms-medium font-semibold text-sm uppercase tracking-widest mb-1">
          Gerenciar
        </p>
        <h1 className="text-ms-dark font-black text-3xl">Alunos</h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">
          {totalStudents} aluno{totalStudents !== 1 ? 's' : ''} com atividade registrada
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          icon={<Users size={20} className="text-ms-medium" />}
          label="Total de Alunos"
          value={String(totalStudents)}
          color="border-ms-medium/20 bg-blue-50"
        />
        <SummaryCard
          icon={<TrendingUp size={20} className="text-emerald-600" />}
          label="Média da Turma"
          value={formatScore(classAvg)}
          color="border-emerald-200 bg-emerald-50"
        />
        <SummaryCard
          icon={<Award size={20} className="text-ms-gold" />}
          label="Módulos Feitos"
          value={String(students.reduce((a, s) => a + s.modules_completed, 0))}
          color="border-ms-gold/30 bg-amber-50"
        />
      </div>

      {/* Student table */}
      {students.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3
                          bg-slate-50 border-b border-slate-200
                          text-xs font-bold text-slate-400 uppercase tracking-wide">
            <span>Aluno</span>
            <span className="text-right">Módulos</span>
            <span className="text-right">Média</span>
            <span className="text-right hidden md:block">Última atividade</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {students.map(student => {
              const level = getScoreLevel(student.avg_score)
              return (
                <div
                  key={student.student_id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4
                             items-center hover:bg-slate-50/70 transition-colors"
                >
                  {/* Name + ID */}
                  <div className="min-w-0">
                    <p className="font-bold text-ms-dark text-sm truncate">
                      {student.student_name ?? 'Aluno sem nome'}
                    </p>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">
                      {student.student_id.slice(0, 8)}…
                    </p>
                  </div>

                  {/* Modules */}
                  <span className="text-sm font-bold text-slate-500 text-right">
                    {student.modules_completed}
                  </span>

                  {/* Avg score */}
                  <span className={`text-sm font-black text-right ${level.color}`}>
                    {formatScore(student.avg_score)}
                  </span>

                  {/* Last activity */}
                  <span className="text-xs text-slate-400 text-right hidden md:block">
                    <LastActivity date={student.last_activity} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */
function SummaryCard({
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
      <p className="text-2xl font-black text-ms-dark">{value}</p>
      <p className="text-slate-500 text-xs font-semibold mt-1">{label}</p>
    </div>
  )
}

function LastActivity({ date }: { date: string | null }) {
  if (!date) return <span className="text-slate-300">—</span>

  const d    = new Date(date)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diff < 60)       return <>{diff}s atrás</>
  if (diff < 3600)     return <>{Math.floor(diff / 60)}min atrás</>
  if (diff < 86400)    return <>{Math.floor(diff / 3600)}h atrás</>
  if (diff < 604800)   return <>{Math.floor(diff / 86400)}d atrás</>
  return <>{d.toLocaleDateString('pt-BR')}</>
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <span className="text-6xl mb-4 block">👥</span>
      <p className="text-ms-dark font-bold text-lg mb-2">Nenhum aluno com atividade</p>
      <p className="text-slate-400 text-sm font-semibold">
        Os dados aparecem quando alunos completarem módulos nas aulas.
      </p>
    </div>
  )
}
