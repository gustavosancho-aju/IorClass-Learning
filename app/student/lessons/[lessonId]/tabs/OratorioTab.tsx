'use client'

import { Mic }              from 'lucide-react'
import type { LessonModule } from '../types'

interface OratorioTabProps {
  module: LessonModule
}

export function OratorioTab({ module }: OratorioTabProps) {
  const oratorio = module.content_json?.oratorio ?? {
    prompt:        'Fale sobre este slide.',
    target_phrase: '',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {/* Prompt */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">
          Prompt de fala
        </p>
        <h2 className="text-xl font-black text-ms-dark">{oratorio.prompt}</h2>
      </div>

      {/* Target phrase */}
      {oratorio.target_phrase && (
        <div className="bg-ms-light rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">
            Frase-alvo
          </p>
          <p className="text-ms-dark font-bold text-base">
            &ldquo;{oratorio.target_phrase}&rdquo;
          </p>
        </div>
      )}

      {/* Record button stub */}
      <div className="pt-2">
        <div className="relative inline-flex flex-col items-center gap-2">
          <button
            disabled
            className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center
                       cursor-not-allowed opacity-60"
            aria-label="Gravar (em breve)"
          >
            <Mic size={28} className="text-slate-500" />
          </button>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Em breve
          </span>
        </div>

        <p className="text-sm text-slate-400 mt-4">
          A funcionalidade de gravação e pontuação de oratório estará disponível na
          próxima sprint (Wave 3).
        </p>
      </div>
    </div>
  )
}
