import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

export default async function StudentSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <p className="text-ms-medium font-semibold text-sm uppercase tracking-widest mb-1">
          Conta
        </p>
        <h1 className="text-ms-dark font-black text-3xl">Configurações</h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">
          Edite seus dados de perfil
        </p>
      </div>

      <SettingsForm
        userId={user!.id}
        initialName={profile?.full_name ?? ''}
        initialAvatar={profile?.avatar_url ?? ''}
        email={user!.email ?? profile?.email ?? ''}
      />
    </div>
  )
}
