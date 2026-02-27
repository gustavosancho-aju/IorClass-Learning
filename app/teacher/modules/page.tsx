import { redirect }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/server'
import { EmptyState }          from '@/components/ui/EmptyState'
import { Layers }              from 'lucide-react'
import { ModuleForm }          from '@/components/modules/ModuleForm'
import { DeleteModuleButton }  from '@/components/modules/DeleteModuleButton'

export const metadata = { title: 'Módulos — Master Speaking' }

/* ── Page ────────────────────────────────────────────────────────── */
export default async function TeacherModulesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* Fetch modules with lesson count */
  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, description, order_index, created_at')
    .eq('created_by', user.id)
    .order('order_index')

  /* For each module, count associated lessons */
  const moduleIds = (modules ?? []).map(m => m.id)
  const lessonCounts: Record<string, number> = {}

  if (moduleIds.length > 0) {
    const { data: lessonRows } = await supabase
      .from('lessons')
      .select('course_module_id')
      .in('course_module_id', moduleIds)

    for (const row of lessonRows ?? []) {
      if (row.course_module_id) {
        lessonCounts[row.course_module_id] = (lessonCounts[row.course_module_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="px-4 py-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <p className="text-ms-medium font-semibold text-sm uppercase tracking-widest mb-1">
          Organização
        </p>
        <h1 className="text-ms-dark font-black text-3xl flex items-center gap-2">
          <Layers size={28} className="text-ms-medium" />
          Módulos
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">
          Agrupe suas aulas em módulos temáticos
        </p>
      </div>

      {/* Create form — Client Component with toast + loading state */}
      <ModuleForm />

      {/* Module list */}
      {!modules || modules.length === 0 ? (
        <EmptyState
          illustration="lessons"
          title="Nenhum módulo ainda"
          description="Crie seu primeiro módulo para organizar suas aulas"
        />
      ) : (
        <div className="space-y-3">
          {modules.map((mod, idx) => {
            const count = lessonCounts[mod.id] ?? 0
            return (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-slate-200 p-4
                           flex items-center gap-4 hover:border-slate-300
                           transition-colors animate-fade-in-up"
              >
                {/* Order badge */}
                <div className="w-10 h-10 rounded-xl ms-gradient-bg flex-shrink-0
                                flex items-center justify-center">
                  <span className="text-white font-black text-sm">{idx + 1}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-ms-dark font-bold truncate">{mod.title}</p>
                  {mod.description && (
                    <p className="text-slate-400 text-xs truncate mt-0.5">{mod.description}</p>
                  )}
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">
                    {count} {count === 1 ? 'aula' : 'aulas'}
                  </p>
                </div>

                {/* Delete — Client Component with toast + loading state */}
                <DeleteModuleButton moduleId={mod.id} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
