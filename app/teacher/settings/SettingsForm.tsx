'use client'

import { useState, useTransition } from 'react'
import { createBrowserClient }     from '@supabase/ssr'
import { Save, User, Mail, Image } from 'lucide-react'
import toast                       from 'react-hot-toast'
import type { Database }           from '@/lib/supabase/types'

interface SettingsFormProps {
  userId:        string
  initialName:   string
  initialAvatar: string
  email:         string
}

export function SettingsForm({ userId, initialName, initialAvatar, email }: SettingsFormProps) {
  const [fullName,  setFullName]  = useState(initialName)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar)
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name:  fullName.trim()   || null,
          avatar_url: avatarUrl.trim()  || null,
        })
        .eq('id', userId)

      if (error) {
        toast.error('Erro ao salvar. Tente novamente.')
      } else {
        toast.success('Perfil atualizado com sucesso!')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 animate-fade-in-up"
    >
      {/* E-mail (read-only) */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
          <span className="flex items-center gap-1.5">
            <Mail size={12} /> E-mail
          </span>
        </label>
        <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200
                        bg-slate-50 text-slate-400 text-sm font-semibold select-none">
          {email}
        </div>
        <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado aqui.</p>
      </div>

      {/* Full name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5"
        >
          <span className="flex items-center gap-1.5">
            <User size={12} /> Nome completo
          </span>
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Seu nome completo"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200
                     text-ms-dark text-sm font-semibold placeholder:text-slate-300
                     focus:outline-none focus:ring-2 focus:ring-ms-medium/30
                     focus:border-ms-medium transition-all"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label
          htmlFor="avatarUrl"
          className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5"
        >
          <span className="flex items-center gap-1.5">
            <Image size={12} /> URL do avatar (opcional)
          </span>
        </label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200
                     text-ms-dark text-sm font-semibold placeholder:text-slate-300
                     focus:outline-none focus:ring-2 focus:ring-ms-medium/30
                     focus:border-ms-medium transition-all"
        />

        {/* Avatar preview */}
        {avatarUrl && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Preview do avatar"
              className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <p className="text-xs text-slate-400">Preview do avatar</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                   bg-ms-gradient text-white font-bold text-sm
                   hover:opacity-90 disabled:opacity-60 transition-all"
      >
        <Save size={16} />
        {isPending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}
