'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient }   from '@supabase/ssr'
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2 } from 'lucide-react'
import type { Database }     from '@/lib/supabase/types'
import type { LessonModule } from '../types'

type Score = Database['public']['Tables']['scores']['Row']

interface ResumoTabProps {
  module:        LessonModule
  currentSlide:  number
  totalSlides:   number
  onPrev:        () => void
  onNext:        () => void
  lessonId:      string
  studentId:     string
  modules:       LessonModule[]
  existingScores: Score[]
}

/* ── Component ─────────────────────────────────────────────────── */
export function ResumoTab({
  module,
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  lessonId,
  studentId,
  modules,
  existingScores,
}: ResumoTabProps) {
  const resumo = module.content_json?.resumo ?? { text: '', bullets: [] }

  /* ── TTS state ─────────────────────────────────────────────── */
  const [isPlaying,      setIsPlaying]      = useState(false)
  const [isFetchingAudio, setIsFetchingAudio] = useState(false)

  /** Stop any active audio (browser or Eleven Labs). */
  const [audioRef] = useState<{ current: HTMLAudioElement | null }>({ current: null })

  function stopAudio() {
    window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }

  const speak = useCallback(async () => {
    if (isPlaying) { stopAudio(); return }
    if (isFetchingAudio) return  // Prevent double-click

    const text = (resumo.text || resumo.bullets.join('. ')).slice(0, 1000)
    setIsFetchingAudio(true)  // Show loading state

    try {
      const res = await fetch('/api/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })

      setIsFetchingAudio(false)  // Loading done (success)

      const contentType = res.headers.get('Content-Type') ?? ''
      if (contentType.includes('audio/mpeg')) {
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => setIsPlaying(false)
        audio.play()
        setIsPlaying(true)
        return
      }
    } catch {
      setIsFetchingAudio(false)  // Loading done (error)
    }

    // Fallback: browser Web Speech API
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang  = 'en-US'
    utterance.rate  = 0.9
    utterance.onend = () => setIsPlaying(false)
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isFetchingAudio, resumo])

  /* ── Read tracking + score upsert ─────────────────────────── */
  const [readSlides, setReadSlides] = useState<Set<number>>(
    () => new Set(
      existingScores
        .filter(s => s.module_type === 'summary' && s.score >= 100)
        .map(s => modules.findIndex(m => m.id === s.module_id))
        .filter(idx => idx >= 0)
    )
  )

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function markAsRead() {
    if (readSlides.has(currentSlide)) return

    const newRead = new Set(readSlides)
    newRead.add(currentSlide)
    setReadSlides(newRead)

    await supabase.from('scores').upsert(
      {
        student_id:  studentId,
        lesson_id:   lessonId,
        module_id:   module.id,
        module_type: 'summary',
        score:       100,
      },
      { onConflict: 'student_id,lesson_id,module_id,module_type' }
    )
  }

  function handleNext() {
    markAsRead()
    onNext()
  }

  function handlePrev() {
    markAsRead()
    onPrev()
  }

  const isRead = readSlides.has(currentSlide)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {/* Slide title */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-black text-ms-dark leading-tight">
          {module.content_json?.title ?? `Slide ${currentSlide + 1}`}
        </h2>
        {isRead && (
          <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full shrink-0">
            ✅ lido
          </span>
        )}
      </div>

      {/* Body text */}
      {resumo.text && (
        <p className="text-ms-dark/80 text-sm leading-relaxed">{resumo.text}</p>
      )}

      {/* Bullets */}
      {resumo.bullets.length > 0 && (
        <ul className="space-y-2">
          {resumo.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2 text-sm text-ms-dark/80">
              <span className="text-ms-medium font-black mt-0.5">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {/* TTS button */}
      <button
        onClick={speak}
        disabled={isFetchingAudio}
        className={[
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
          isFetchingAudio
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : isPlaying
              ? 'bg-ms-medium text-white'
              : 'bg-ms-light text-ms-dark hover:bg-ms-medium/20',
        ].join(' ')}
      >
        {isFetchingAudio ? (
          <><Loader2 size={16} className="animate-spin" />Carregando...</>
        ) : isPlaying ? (
          <><VolumeX size={16} />Parar</>
        ) : (
          <><Volume2 size={16} />Ouvir</>
        )}
      </button>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold
                     text-slate-500 hover:text-ms-dark hover:bg-slate-100 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <span className="text-xs text-slate-400 font-bold">
          {currentSlide + 1} / {totalSlides}
        </span>

        <button
          onClick={handleNext}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold
                     bg-ms-medium text-white hover:opacity-90 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Próximo
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
