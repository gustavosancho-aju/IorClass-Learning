import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, BookOpen } from 'lucide-react'
import { ProcessButton } from './ProcessButton'

interface Props {
  params: { lessonId: string }
}

export default async function LessonDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── Fetch lesson + upload + modules in parallel ────────────── */
  const [lessonRes, uploadRes, modulesRes] = await Promise.all([
    supabase.from('lessons').select('*').eq('id', params.lessonId).single(),
    supabase.from('ppt_uploads').select('*').eq('lesson_id', params.lessonId).maybeSingle(),
    supabase.from('modules').select('*').eq('lesson_id', params.lessonId).order('order_index'),
  ])

  if (lessonRes.error || !lessonRes.data) redirect('/teacher/upload')

  const lesson  = lessonRes.data
  const upload  = uploadRes.data
  const modules = modulesRes.data ?? []

  /* ── Upload status display helpers ─────────────────────────── */
  const statusConfig = {
    processing: {
      icon:  <Loader2 size={18} className="text-ms-medium animate-spin" />,
      label: 'Aguardando processamento',
      color: 'text-ms-medium',
    },
    completed: {
      icon:  <CheckCircle2 size={18} className="text-green-500" />,
      label: 'Processado com sucesso',
      color: 'text-green-600',
    },
    error: {
      icon:  <AlertCircle size={18} className="text-red-400" />,
      label: 'Erro no processamento',
      color: 'text-red-500',
    },
  } as const

  const statusKey = (upload?.status ?? 'processing') as keyof typeof statusConfig
  const status    = statusConfig[statusKey]

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/teacher/upload"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ms-dark transition-colors"
      >
        <ArrowLeft size={16} /> Novo Upload
      </Link>

      {/* Lesson header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">Aula</p>
            <h1 className="text-2xl font-black text-ms-dark">{lesson.title}</h1>
          </div>
          <span className="text-4xl">{lesson.cover_emoji ?? '📎'}</span>
        </div>

        {/* Upload status row */}
        {upload && (
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {status.icon}
              <div>
                <p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
                <p className="text-xs text-slate-400 truncate max-w-xs">{upload.filename}</p>
              </div>
            </div>

            {/* Show process button if upload exists but slides not yet generated */}
            {upload.status !== 'error' && modules.length === 0 && (
              <ProcessButton pptUploadId={upload.id} lessonId={lesson.id} />
            )}
          </div>
        )}

        {/* Error hint */}
        {upload?.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ❌ Houve um erro ao processar o arquivo. Tente fazer o upload novamente.
          </div>
        )}
      </div>

      {/* Modules list */}
      {modules.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-black text-ms-dark flex items-center gap-2">
            <BookOpen size={18} className="text-ms-medium" />
            Slides Gerados ({modules.length})
          </h2>
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4"
            >
              <span className="text-lg font-black text-ms-medium w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ms-dark text-sm truncate">{mod.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">Resumo · Tarefas · Oratório</p>
              </div>
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                ✅ pronto
              </span>
            </div>
          ))}

          {/* Coming soon — full lesson player in Story 2.3 */}
          <div className="bg-ms-light border border-ms-medium/30 rounded-xl p-4 flex gap-3 mt-4">
            <span className="text-2xl">🚧</span>
            <div className="text-sm text-ms-dark/80">
              <p className="font-bold mb-0.5">Player de Aula em Breve</p>
              <p className="text-ms-dark/60">
                O módulo completo com Resumo, Tarefas e Oratório será disponibilizado
                na próxima sprint (Story 2.3).
              </p>
            </div>
          </div>
        </div>
      ) : (
        !upload?.status && (
          <div className="bg-ms-light border border-ms-medium/30 rounded-xl p-6 text-center">
            <p className="text-ms-dark font-bold mb-1">Pronto para processar!</p>
            <p className="text-ms-dark/60 text-sm">
              Clique em &ldquo;Gerar Conteúdo dos Slides&rdquo; acima para iniciar.
            </p>
          </div>
        )
      )}
    </div>
  )
}
