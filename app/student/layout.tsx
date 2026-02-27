import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/teacher/dashboard')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role="student"
        userName={profile?.full_name ?? user.email ?? 'Aluno'}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav role="student" />
    </div>
  )
}
