'use client'

import { useTransition, useRef } from 'react'
import toast from 'react-hot-toast'
import { Layers, Loader2 } from 'lucide-react'
import { createCourseModule } from '@/app/actions/modules'

/* ── Component ──────────────────────────────────────────────────── */
export function ModuleForm() {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    const title       = formData.get('title') as string
    const description = formData.get('description') as string | null

    startTransition(async () => {
      const result = await createCourseModule({ title, description })

      if (result.error) {
        toast.error(`Erro ao criar módulo: ${result.error}`)
        return
      }

      toast.success('Módulo criado com sucesso! 🎉')
      formRef.current?.reset()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 animate-fade-in-up">
      <h2 className="text-ms-dark font-bold text-base mb-4">Criar novo módulo</h2>
      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-bold text-ms-dark mb-1.5">
            Nome do módulo <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            disabled={isPending}
            placeholder="Ex: Módulo 1 — Cumprimentos"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-ms-dark placeholder-slate-400 text-sm
                       focus:outline-none focus:ring-2 focus:ring-ms-medium/40
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-ms-dark mb-1.5">
            Descrição <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            name="description"
            type="text"
            disabled={isPending}
            placeholder="Breve descrição do módulo"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-ms-dark placeholder-slate-400 text-sm
                       focus:outline-none focus:ring-2 focus:ring-ms-medium/40
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 ms-gradient-bg text-white
                     text-sm font-black px-5 py-2.5 rounded-xl
                     hover:opacity-90 transition-opacity
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Criando…
            </>
          ) : (
            <>
              <Layers size={15} />
              Criar Módulo
            </>
          )}
        </button>
      </form>
    </div>
  )
}
