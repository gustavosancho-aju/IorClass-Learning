import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, Award } from 'lucide-react'
import { formatScore } from '@/lib/utils'
import { StudentTable } from './StudentTable'

/* ── Types ──────────────────────────────────────────────────────── */
export interface StudentSummary {
  student_id:        string
  student_name:      string | null
  avg_score:         number
  modules_completed: number
  last_activity:     string | null
  lesson_count:      number
}

export interface LessonRow {
  student_id:        string
  student_name:      string | null
  lesson_id:         string
  avg_score:         number | null
  modules_completed: number | null
  last_activity:     string | null
}

/* ── Page ───────────────────────────────────────────────────────── */
export default async function TeacherStudentsPage() {
  const supabase = createClient()

  /* Fetch all student_performance rows, then aggregate per student */
  const { data: rows } = await supabase
    .from('student_performance')
    .select('student_id, student_name, lesson_id, avg_score, modules_completed, last_activity')
    .order('last_activity', { ascending: false })

  /* Keep raw rows for drawer detail (before aggregation) */
  const lessonRows: LessonRow[] = rows ?? []

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
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">
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

      {/* Student table — passes lessonRows for drawer detail */}
      {students.length === 0 ? (
        <EmptyState />
      ) : (
        <StudentTable students={students} lessonRows={lessonRows} />
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
