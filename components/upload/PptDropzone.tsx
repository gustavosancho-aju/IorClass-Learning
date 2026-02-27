'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createPptUploadRecord } from '@/app/actions/upload'

/* ── Constants ──────────────────────────────────────────── */
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
]
const ACCEPTED_EXTS = ['.pptx', '.ppt']

/* ── Types ──────────────────────────────────────────────── */
interface PptDropzoneProps {
  teacherId: string
}

type UploadState = 'idle' | 'validating' | 'uploading' | 'saving' | 'done' | 'error'

/* ── Component ──────────────────────────────────────────── */
export function PptDropzone({ teacherId }: PptDropzoneProps) {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)

  const [dragOver,    setDragOver]    = useState(false)
  const [file,        setFile]        = useState<File | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [state,       setState]       = useState<UploadState>('idle')
  const [progress,    setProgress]    = useState(0)
  const [errorMsg,    setErrorMsg]    = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /* ── Validation ─────────────────────────────────────────── */
  function validateFile(f: File): string | null {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_EXTS.includes(ext) && !ACCEPTED_TYPES.includes(f.type)) {
      return 'Apenas arquivos .pptx ou .ppt são aceitos.'
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `Arquivo muito grande. Máximo: 50 MB (atual: ${(f.size / 1024 / 1024).toFixed(1)} MB).`
    }
    return null
  }

  function pickFile(f: File) {
    setState('validating')
    const err = validateFile(f)
    if (err) {
      setErrorMsg(err)
      setState('error')
      return
    }
    setFile(f)
    setErrorMsg('')
    setState('idle')
    // Pre-fill lesson title from filename
    if (!lessonTitle) {
      setLessonTitle(f.name.replace(/\.(pptx?)/i, '').replace(/[-_]/g, ' '))
    }
  }

  /* ── Drag handlers ──────────────────────────────────────── */
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true)  }, [])
  const onDragLeave = useCallback(() => setDragOver(false), [])
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) pickFile(dropped)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonTitle])

  /* ── Upload ─────────────────────────────────────────────── */
  async function handleUpload() {
    if (!file) return
    if (!lessonTitle.trim()) { toast.error('Informe o título da aula.'); return }

    setState('uploading')
    setProgress(0)

    try {
      // 1. Generate lesson ID upfront (use crypto.randomUUID)
      const lessonId = crypto.randomUUID()
      const storagePath = `${teacherId}/${lessonId}/${file.name}`

      // 2. Upload to Supabase Storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('ppt-uploads')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      // Simulate progress since Supabase SDK doesn't expose XHR progress natively
      // Progress jumps to 90% after upload call returns
      setProgress(90)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // 3. Save record to DB via Server Action
      setState('saving')
      setProgress(95)

      const result = await createPptUploadRecord({
        lessonId,
        lessonTitle: lessonTitle.trim(),
        teacherId,
        storagePath,
        originalFilename: file.name,
      })

      if (result.error) throw new Error(result.error)

      setProgress(100)
      setState('done')
      toast.success('Upload realizado com sucesso! 🎉')

      // 4. Redirect to lesson detail
      setTimeout(() => {
        router.push(`/teacher/lessons/${result.lessonId}`)
      }, 800)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
      setErrorMsg(msg)
      setState('error')
      toast.error(`Erro no upload: ${msg}`)
    }
  }

  const isLoading = state === 'uploading' || state === 'saving'

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Lesson title input */}
      <div>
        <label className="block text-sm font-bold text-ms-dark mb-1.5">
          Título da Aula <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={lessonTitle}
          onChange={e => setLessonTitle(e.target.value)}
          placeholder="Ex: Unit 1 — Greetings and Introductions"
          disabled={isLoading}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                     text-ms-dark placeholder-slate-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-ms-medium/40
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && !isLoading && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all',
          dragOver
            ? 'border-ms-medium bg-ms-medium/10 scale-[1.01]'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-white hover:border-ms-medium hover:bg-ms-light/40 cursor-pointer',
          isLoading && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
          disabled={isLoading}
        />

        {!file ? (
          <>
            <Upload className="mx-auto mb-4 text-ms-medium" size={40} strokeWidth={1.5} />
            <p className="font-bold text-ms-dark mb-1">
              {dragOver ? 'Solte o arquivo aqui' : 'Arraste e solte seu PowerPoint'}
            </p>
            <p className="text-slate-400 text-sm mb-4">ou clique para selecionar</p>
            <p className="text-xs text-slate-400 bg-slate-100 inline-block px-3 py-1 rounded-full">
              .pptx ou .ppt • máximo 50 MB
            </p>
          </>
        ) : (
          <div className="flex items-center gap-4 justify-center">
            <FileText className="text-ms-medium flex-shrink-0" size={36} strokeWidth={1.5} />
            <div className="text-left">
              <p className="font-bold text-ms-dark text-sm truncate max-w-xs">{file.name}</p>
              <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!isLoading && (
              <button
                onClick={e => { e.stopPropagation(); setFile(null); setProgress(0); setState('idle') }}
                className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
                aria-label="Remover arquivo"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {state === 'error' && errorMsg && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5 border border-red-200">
          ❌ {errorMsg}
        </p>
      )}

      {/* Progress bar */}
      {isLoading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{state === 'saving' ? 'Salvando registro…' : 'Enviando arquivo…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-ms-medium rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleUpload}
        disabled={!file || isLoading || state === 'done' || !lessonTitle.trim()}
        className={cn(
          'w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2',
          !file || !lessonTitle.trim()
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'ms-btn-primary hover:opacity-90'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {state === 'saving' ? 'Salvando…' : 'Enviando…'}
          </>
        ) : state === 'done' ? (
          '✅ Concluído! Redirecionando…'
        ) : (
          <>
            <Upload size={16} />
            Fazer Upload e Gerar Aula
          </>
        )}
      </button>
    </div>
  )
}
