'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { cn }      from '@/lib/utils'
import type { TarefaQuestion } from '@/lib/content-generator'
import type { Database }       from '@/lib/supabase/types'
import type { LessonModule }   from '../types'

type Score = Database['public']['Tables']['scores']['Row']

interface TarefasTabProps {
  module:        LessonModule
  lessonId:      string
  studentId:     string
  existingScore: Score | undefined
}

/* ── Component ─────────────────────────────────────────────────── */
export function TarefasTab({ module, lessonId, studentId, existingScore }: TarefasTabProps) {
  const questions: TarefaQuestion[] =
    module.content_json?.tarefas?.questions ?? []

  const [currentQ,   setCurrentQ]   = useState(0)
  const [selected,   setSelected]   = useState<number | null>(null)
  const [answered,   setAnswered]   = useState<boolean[]>(new Array(questions.length).fill(false))
  const [correct,    setCorrect]    = useState<boolean[]>(new Array(questions.length).fill(false))
  const [done,       setDone]       = useState(!!existingScore)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <span className="text-4xl mb-2 block">📭</span>
        <p className="text-slate-500 text-sm">Nenhuma tarefa disponível para este slide.</p>
      </div>
    )
  }

  const q           = questions[currentQ]
  const isAnswered  = answered[currentQ]
  const isCorrect   = isAnswered ? correct[currentQ] : false
  const totalRight  = correct.filter(Boolean).length
  const allAnswered = answered.every(Boolean)

  async function handleSelect(optionIdx: number) {
    if (isAnswered) return

    const isRight    = optionIdx === q.correct
    const newAnswered = [...answered]
    const newCorrect  = [...correct]
    newAnswered[currentQ] = true
    newCorrect[currentQ]  = isRight
    setSelected(optionIdx)
    setAnswered(newAnswered)
    setCorrect(newCorrect)

    // If all answered → upsert score
    if (newAnswered.every(Boolean)) {
      const score = (newCorrect.filter(Boolean).length / questions.length) * 100
      await supabase.from('scores').upsert(
        {
          student_id:  studentId,
          lesson_id:   lessonId,
          module_id:   module.id,
          module_type: 'tasks',
          score,
        },
        { onConflict: 'student_id,lesson_id,module_id,module_type' }
      )
      setDone(true)
    }
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setSelected(null)
    }
  }

  /* ── Completed state ─────────────────────────────────────────── */
  if (done && allAnswered) {
    const pct = Math.round((totalRight / questions.length) * 100)
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
        <span className="text-5xl">{pct >= 70 ? '🎉' : '💪'}</span>
        <h3 className="text-xl font-black text-ms-dark">
          {totalRight} / {questions.length} corretas
        </h3>
        <p className={cn('text-lg font-bold', pct >= 70 ? 'text-green-600' : 'text-amber-600')}>
          {pct}%
        </p>
        <p className="text-slate-400 text-sm">
          {pct >= 70 ? 'Ótimo trabalho! Continue para o próximo slide.' : 'Não desista! Revise o Resumo e tente de novo.'}
        </p>
      </div>
    )
  }

  /* ── Active question ─────────────────────────────────────────── */
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Questão {currentQ + 1} de {questions.length}</span>
        {allAnswered && (
          <span className="text-green-600 font-bold">
            {totalRight}/{questions.length} corretas
          </span>
        )}
      </div>

      {/* Question */}
      <p className="font-bold text-ms-dark text-base">{q.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((option, idx) => {
          const isSelected  = selected === idx
          const showCorrect = isAnswered && idx === q.correct
          const showWrong   = isAnswered && isSelected && !isCorrect

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                'font-medium flex items-center justify-between gap-3',
                !isAnswered && 'hover:border-ms-medium hover:bg-ms-light/50 cursor-pointer',
                showCorrect && 'bg-green-50 border-green-400 text-green-700',
                showWrong && 'bg-red-50 border-red-400 text-red-700',
                !showCorrect && !showWrong && 'border-slate-200 text-ms-dark',
                isAnswered && 'cursor-default'
              )}
            >
              <span>{option}</span>
              {showCorrect && <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
              {showWrong   && <XCircle size={18} className="text-red-400 shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Feedback + next */}
      {isAnswered && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className={cn('text-sm font-bold', isCorrect ? 'text-green-600' : 'text-red-500')}>
            {isCorrect ? '✅ Correto!' : `❌ A resposta certa era: "${q.options[q.correct]}"`}
          </p>
          {currentQ < questions.length - 1 && (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold
                         bg-ms-medium text-white hover:opacity-90 transition-all"
            >
              Próxima <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
