'use client'

import { useTransition } from 'react'
import { useRouter }     from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import toast                from 'react-hot-toast'
import { deleteLesson }  from '@/app/actions/lessons'

interface Props {
  lessonId:      string
  lessonTitle:   string
  /** When true, redirects to /teacher/lessons after successful deletion */
  redirectAfter?: boolean
}

/**
 * Destructive button that permanently deletes a lesson after confirmation.
 *
 * Usage (list page):  <DeleteLessonButton lessonId={id} lessonTitle={title} />
 * Usage (detail page): <DeleteLessonButton lessonId={id} lessonTitle={title} redirectAfter />
 */
export function DeleteLessonButton({
  lessonId,
  lessonTitle,
  redirectAfter = false,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a aula "${lessonTitle}"?\n\nEsta ação é irreversível e removerá todos os módulos e pontuações associadas.`,
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteLesson(lessonId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Aula excluída com sucesso 🗑️')

      if (redirectAfter) {
        router.push('/teacher/lessons')
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Excluir aula"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                 text-red-500 border border-red-200 hover:bg-red-50
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
