import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PptDropzone } from '@/components/upload/PptDropzone'

export const metadata = { title: 'Upload PPT — Master Speaking' }

export default async function UploadPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ms-dark mb-2">
          📎 Upload de Aula
        </h1>
        <p className="text-slate-500 text-sm">
          Envie um arquivo PowerPoint (.pptx) para gerar automaticamente os módulos
          de Resumo, Tarefas e Oratório.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-ms-light border border-ms-medium/30 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-2xl">💡</span>
        <div className="text-sm text-ms-dark/80">
          <p className="font-bold mb-1">Como funciona?</p>
          <ol className="list-decimal list-inside space-y-0.5 text-ms-dark/60">
            <li>Faça upload do seu arquivo .pptx</li>
            <li>O sistema extrai o conteúdo de cada slide</li>
            <li>Cria automaticamente os módulos de aprendizado</li>
            <li>Você revisa e publica a aula para os alunos</li>
          </ol>
        </div>
      </div>

      {/* Dropzone */}
      <PptDropzone teacherId={user.id} />
    </div>
  )
}
