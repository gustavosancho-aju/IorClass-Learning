'use client'

import { useTransition } from 'react'
import toast from 'react-hot-toast'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteCourseModule } from '@/app/actions/modules'

interface DeleteModuleButtonProps {
  moduleId: string
}

export function DeleteModuleButton({ moduleId }: DeleteModuleButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCourseModule(moduleId)

      if (result.error) {
        toast.error(`Erro ao excluir: ${result.error}`)
        return
      }

      toast('Módulo excluído', {
        icon: '🗑️',
        style: { background: '#fef3c7', color: '#92400e' },
      })
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                 font-bold text-red-500 border border-red-200
                 hover:bg-red-50 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Excluir módulo (aulas ficam sem módulo)"
    >
      {isPending ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Trash2 size={13} />
      )}
      Excluir
    </button>
  )
}
