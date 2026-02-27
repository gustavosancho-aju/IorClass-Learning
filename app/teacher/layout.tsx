import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function TeacherLayout({
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

  if (profile?.role !== 'teacher') redirect('/student/dashboard')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role="teacher"
        userName={profile?.full_name ?? user.email ?? 'Professor'}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav role="teacher" />
    </div>
  )
}
