'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Mic, MicOff, RotateCcw } from 'lucide-react'
import { cn }                     from '@/lib/utils'
import { scoreSpeech, getOratoryFeedback } from '@/lib/speech-score'
import type { Database }    from '@/lib/supabase/types'
import type { LessonModule } from '../types'

type Score = Database['public']['Tables']['scores']['Row']

/* ── Minimal Web Speech API type declarations ───────────────────── */
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  readonly isFinal:    boolean
  readonly length:     number
  item(index: number): SpeechRecognitionAlternative
  [index: number]:     SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  readonly length:     number
  item(index: number): SpeechRecognitionResult
  [index: number]:     SpeechRecognitionResult
}
interface SpeechRecognitionEventData extends Event {
  readonly resultIndex: number
  readonly results:     SpeechRecognitionResultList
}
interface SpeechRecognitionErrorData extends Event {
  readonly error:   string
  readonly message: string
}
interface SpeechRecognitionInstance {
  lang:            string
  continuous:      boolean
  interimResults:  boolean
  maxAlternatives: number
  onresult: ((e: SpeechRecognitionEventData) => void) | null
  onerror:  ((e: SpeechRecognitionErrorData)  => void) | null
  onend:    (() => void)                               | null
  start():  void
  stop():   void
}
declare global {
  interface Window {
    SpeechRecognition:       new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface OratorioTabProps {
  module:        LessonModule
  lessonId:      string
  studentId:     string
  existingScore?: Score
}

type UIState = 'idle' | 'recording' | 'result' | 'unsupported'

const RECORD_SECONDS = 30

/* ── Component ─────────────────────────────────────────────────── */
export function OratorioTab({ module, lessonId, studentId, existingScore }: OratorioTabProps) {
  const oratorio = module.content_json?.oratorio ?? {
    prompt:        'Fale sobre este slide.',
    target_phrase: '',
  }

  const [uiState,         setUiState]         = useState<UIState>('idle')
  const [transcript,      setTranscript]      = useState('')
  const [interimText,     setInterimText]     = useState('')
  const [score,           setScore]           = useState<number | null>(existingScore?.score ?? null)
  const [savedTranscript, setSavedTranscript] = useState('')
  const [timeLeft,        setTimeLeft]        = useState(RECORD_SECONDS)
  const [saving,          setSaving]          = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const accumulatedRef = useRef('')   // stable ref for onend / onerror callbacks

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /* ── Browser support check (client-only) ─────────────────────── */
  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setUiState('unsupported')
    }
  }, [])

  /* ── Sync existingScore when prop changes (slide navigation) ──── */
  useEffect(() => {
    if (existingScore && uiState === 'idle') {
      setScore(existingScore.score)
    }
    // Reset when module changes
    return () => {
      accumulatedRef.current = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id])

  /* ── Cleanup on unmount ──────────────────────────────────────── */
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  /* ── Save score to Supabase ─────────────────────────────────── */
  async function persistScore(finalScore: number) {
    setSaving(true)
    await supabase.from('scores').upsert(
      {
        student_id:  studentId,
        lesson_id:   lessonId,
        module_id:   module.id,
        module_type: 'speaking',
        score:       finalScore,
      },
      { onConflict: 'student_id,lesson_id,module_id,module_type' }
    )
    setSaving(false)
  }

  /* ── Finalize recording ─────────────────────────────────────── */
  function finalize(finalTranscript: string) {
    recognitionRef.current?.stop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const finalScore = scoreSpeech(finalTranscript.trim(), oratorio.target_phrase)
    setScore(finalScore)
    setSavedTranscript(finalTranscript.trim())
    setUiState('result')
    persistScore(finalScore)
  }

  /* ── Start recording ────────────────────────────────────────── */
  const startRecording = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRec()
    rec.lang            = 'en-US'
    rec.continuous      = true
    rec.interimResults  = true
    rec.maxAlternatives = 1

    accumulatedRef.current = ''

    rec.onresult = (e: SpeechRecognitionEventData) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          accumulatedRef.current += result[0].transcript + ' '
          setTranscript(accumulatedRef.current)
          setInterimText('')
        } else {
          interim += result[0].transcript
          setInterimText(interim)
        }
      }
    }

    rec.onerror = (e: SpeechRecognitionErrorData) => {
      if (e.error === 'no-speech') return  // ignore — just silence
      finalize(accumulatedRef.current)
    }

    rec.onend = () => {
      // Only called when recognition stops and timer is still running = premature end
      if (timerRef.current !== null) {
        // restart to keep continuous recording
        try { rec.start() } catch { finalize(accumulatedRef.current) }
      }
    }

    recognitionRef.current = rec
    rec.start()

    setTranscript('')
    setInterimText('')
    setTimeLeft(RECORD_SECONDS)
    setUiState('recording')

    /* Countdown */
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          finalize(accumulatedRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [oratorio.target_phrase]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Manual stop ────────────────────────────────────────────── */
  function handleStop() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    finalize(accumulatedRef.current)
  }

  /* ── Reset ──────────────────────────────────────────────────── */
  function handleReset() {
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current     = null
    accumulatedRef.current = ''
    setTranscript('')
    setInterimText('')
    setScore(existingScore?.score ?? null)
    setTimeLeft(RECORD_SECONDS)
    setUiState('idle')
  }

  const feedback = score !== null ? getOratoryFeedback(score, oratorio.target_phrase) : null

  /* ═══════════════════════════════════════════════════════════════
   * RENDER — Unsupported
   * ══════════════════════════════════════════════════════════════ */
  if (uiState === 'unsupported') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <Header oratorio={oratorio} />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <span className="text-3xl mb-2 block">🌐</span>
          <p className="font-bold text-amber-800 text-sm">Navegador não suportado</p>
          <p className="text-amber-600 text-xs mt-1">
            Use Chrome, Edge ou Safari para usar a gravação de voz.
          </p>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════
   * RENDER — Result
   * ══════════════════════════════════════════════════════════════ */
  if (uiState === 'result' && score !== null && feedback) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <Header oratorio={oratorio} />

        {/* Score card */}
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-5xl">{feedback.emoji}</span>
          <div className={cn(
            'text-4xl font-black',
            score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
          )}>
            {score}
            <span className="text-xl font-normal text-slate-400"> pts</span>
          </div>
          <p className="font-bold text-ms-dark">{feedback.title}</p>
          <p className="text-sm text-slate-500 text-center max-w-xs">{feedback.tip}</p>
          {saving && (
            <p className="text-xs text-slate-400 animate-pulse">Salvando pontuação…</p>
          )}
        </div>

        {/* Score bar */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              score >= 80 ? 'bg-green-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
            )}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Transcript */}
        {savedTranscript && (
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">
              O que você disse
            </p>
            <p className="text-sm text-slate-600 italic">
              &ldquo;{savedTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Try again */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     border-2 border-ms-medium text-ms-medium font-bold text-sm
                     hover:bg-ms-light transition-all"
        >
          <RotateCcw size={16} />
          Tentar de novo
        </button>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════
   * RENDER — Recording
   * ══════════════════════════════════════════════════════════════ */
  if (uiState === 'recording') {
    const pct      = (timeLeft / RECORD_SECONDS) * 100
    const liveText = transcript + interimText

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <Header oratorio={oratorio} />

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative w-[88px] h-[88px]">
            <svg width="88" height="88" className="-rotate-90">
              <circle cx="44" cy="44" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle
                cx="44" cy="44" r="38" fill="none"
                stroke="#ef4444" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-ms-dark">{timeLeft}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-500">Gravando…</span>
          </div>
        </div>

        {/* Live transcript */}
        <div className="min-h-[64px] bg-slate-50 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">
            Transcrição em tempo real
          </p>
          {liveText ? (
            <p className="text-sm text-slate-700">
              {transcript}
              <span className="text-slate-400 italic">{interimText}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-300 italic">Fale agora…</p>
          )}
        </div>

        {/* Stop button */}
        <button
          onClick={handleStop}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     bg-red-500 text-white font-bold text-sm
                     hover:bg-red-600 transition-all active:scale-95"
        >
          <MicOff size={16} />
          Parar gravação
        </button>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════════
   * RENDER — Idle (default)
   * ══════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <Header oratorio={oratorio} />

      {/* Previous best score */}
      {score !== null && feedback && (
        <div className="bg-ms-light rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">Melhor pontuação</span>
          <span className={cn(
            'text-lg font-black',
            score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
          )}>
            {feedback.emoji} {score} pts
          </span>
        </div>
      )}

      {/* Record button */}
      <div className="flex flex-col items-center gap-3 py-6">
        <button
          onClick={startRecording}
          className="w-20 h-20 rounded-full bg-ms-medium text-white
                     flex items-center justify-center shadow-lg
                     hover:scale-105 hover:shadow-xl transition-all active:scale-95"
          aria-label="Iniciar gravação de voz"
        >
          <Mic size={32} />
        </button>
        <p className="text-sm text-slate-400 text-center">
          Clique para gravar • até {RECORD_SECONDS}s
        </p>
      </div>

      <p className="text-xs text-slate-300 text-center">
        Permissão de microfone necessária no navegador
      </p>
    </div>
  )
}

/* ── Shared header ──────────────────────────────────────────────── */
function Header({ oratorio }: { oratorio: { prompt: string; target_phrase: string } }) {
  return (
    <>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">
          Prompt de fala
        </p>
        <h2 className="text-xl font-black text-ms-dark">{oratorio.prompt}</h2>
      </div>

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
    </>
  )
}
