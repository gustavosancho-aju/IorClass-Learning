'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { formatScore, getScoreLevel } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import type { StudentSummary, LessonRow } from './page'

/* ── LastActivity helper (client-side) ─────────────────────────── */
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

/* ── StudentTable ───────────────────────────────────────────────── */
export function StudentTable({
  students,
  lessonRows,
}: {
  students:   StudentSummary[]
  lessonRows: LessonRow[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedStudent = students.find(s => s.student_id === selectedId) ?? null
  const selectedLessons = lessonRows.filter(r => r.student_id === selectedId)

  return (
    <>
      {/* ── Table ─────────────────────────────────────────────── */}
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
                onClick={() => setSelectedId(student.student_id)}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4
                           items-center hover:bg-slate-50/70 transition-colors
                           cursor-pointer"
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

      {/* ── Overlay + Drawer ──────────────────────────────────── */}
      {selectedId && (
        <>
          {/* Backdrop — z-[55] covers BottomNav (z-50) on mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-[55]"
            onClick={() => setSelectedId(null)}
          />

          {/* Drawer panel — z-[60] above backdrop and BottomNav */}
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[400px]
                        bg-white shadow-2xl z-[60] overflow-y-auto
                        translate-x-0 transition-transform duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">
                  Progresso do aluno
                </p>
                <h2 className="text-lg font-black text-ms-dark">
                  {selectedStudent?.student_name ?? 'Aluno'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center
                           justify-center transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Per-lesson breakdown */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">
                Por aula ({selectedLessons.length} aula{selectedLessons.length !== 1 ? 's' : ''})
              </p>
              {selectedLessons.length === 0 ? (
                <EmptyState
                  illustration="activity"
                  title="Nenhuma aula"
                  description="Este aluno ainda não completou nenhuma atividade"
                  className="py-6"
                />
              ) : (
                selectedLessons.map(lesson => {
                  const level = getScoreLevel(lesson.avg_score ?? 0)
                  return (
                    <div
                      key={lesson.lesson_id}
                      className="bg-slate-50 rounded-xl px-4 py-3 flex items-center
                                 justify-between"
                    >
                      <div>
                        <p className="text-xs font-mono text-slate-400">
                          {lesson.lesson_id.slice(0, 8)}…
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lesson.modules_completed ?? 0} módulo{(lesson.modules_completed ?? 0) !== 1 ? 's' : ''} feito{(lesson.modules_completed ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className={`text-lg font-black ${level.color}`}>
                        {formatScore(lesson.avg_score ?? 0)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
