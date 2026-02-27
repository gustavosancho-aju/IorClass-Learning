'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Wand2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProcessButtonProps {
  pptUploadId: string
  lessonId:    string
}

export function ProcessButton({ pptUploadId, lessonId: _lessonId }: ProcessButtonProps) {
  const [loading, setLoading]   = useState(false)
  const [done,    setDone]      = useState(false)
  const router                  = useRouter()

  async function handleProcess() {
    setLoading(true)
    try {
      const res = await fetch('/api/process-ppt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pptUploadId }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao processar slides')
      }

      setDone(true)
      toast.success(`✅ ${json.modules?.length ?? 0} slides processados!`)

      // Refresh server component data
      setTimeout(() => router.refresh(), 800)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(`Erro: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
        <CheckCircle2 size={18} />
        Slides processados! Recarregando…
      </div>
    )
  }

  return (
    <button
      onClick={handleProcess}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                 bg-ms-medium text-white font-black text-sm
                 hover:opacity-90 transition-opacity
                 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <><Loader2 size={16} className="animate-spin" />Processando slides…</>
      ) : (
        <><Wand2 size={16} />Gerar Conteúdo dos Slides</>
      )}
    </button>
  )
}
