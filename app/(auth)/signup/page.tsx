'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPwd, setShowPwd]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [confirmed, setConfirmed]       = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // ── Validações client-side ──────────────────────────────
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'student',       // lido pelo trigger handle_new_user()
          full_name: fullName,   // lido pelo trigger handle_new_user()
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpError) {
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('user already registered') || msg.includes('already registered')) {
        setError('Este e-mail já está cadastrado.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
      return
    }

    setConfirmed(true)
  }

  // ── Tela de confirmação pós-cadastro ───────────────────────
  if (confirmed) {
    return (
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-5xl">💬</span>
            <span className="text-5xl">🪽</span>
          </div>
          <h1 className="text-white font-black text-4xl tracking-tight leading-none">
            MASTER
          </h1>
          <h1 className="text-ms-gold font-black text-4xl tracking-tight leading-none -mt-1">
            SPEAKING
          </h1>
        </div>

        <div className="ms-glass rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-white text-xl font-bold mb-2">Conta criada!</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Enviamos um e-mail de confirmação para{' '}
            <span className="text-ms-gold font-bold">{email}</span>.
            Clique no link para ativar sua conta e fazer login.
          </p>
          <p className="text-white/40 text-xs mt-4">
            Não recebeu? Verifique sua caixa de spam.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-ms-gold text-sm font-bold hover:underline"
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulário de cadastro ─────────────────────────────────
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      {/* ── Logo ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-5xl">💬</span>
          <span className="text-5xl">🪽</span>
        </div>
        <h1 className="text-white font-black text-4xl tracking-tight leading-none">
          MASTER
        </h1>
        <h1 className="text-ms-gold font-black text-4xl tracking-tight leading-none -mt-1">
          SPEAKING
        </h1>
        <p className="text-white/60 text-sm mt-3 font-semibold tracking-wide uppercase">
          Plataforma de Inglês Profissional
        </p>
      </div>

      {/* ── Card ── */}
      <div className="ms-glass rounded-2xl p-8 shadow-2xl">
        <h2 className="text-white text-2xl font-bold mb-1">Criar sua conta</h2>
        <p className="text-white/50 text-sm mb-7">
          Cadastre-se gratuitamente como aluno
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Nome completo */}
          <div>
            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              required
              autoComplete="name"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                         text-white placeholder:text-white/30 font-semibold text-sm
                         focus:outline-none focus:ring-2 focus:ring-ms-gold/60
                         focus:border-ms-gold transition-all duration-200"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                         text-white placeholder:text-white/30 font-semibold text-sm
                         focus:outline-none focus:ring-2 focus:ring-ms-gold/60
                         focus:border-ms-gold transition-all duration-200"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20
                           text-white placeholder:text-white/30 font-semibold text-sm
                           focus:outline-none focus:ring-2 focus:ring-ms-gold/60
                           focus:border-ms-gold transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2
                           text-white/40 hover:text-white/80 transition-colors rounded-lg"
                aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
              Confirmar senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20
                           text-white placeholder:text-white/30 font-semibold text-sm
                           focus:outline-none focus:ring-2 focus:ring-ms-gold/60
                           focus:border-ms-gold transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2
                           text-white/40 hover:text-white/80 transition-colors rounded-lg"
                aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !fullName || !email || !password || !confirmPassword}
            className="w-full py-3 rounded-xl font-black text-ms-dark text-sm uppercase tracking-widest
                       bg-ms-gold hover:opacity-90 active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Criando conta…
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        {/* Link para login */}
        <p className="text-center text-white/40 text-sm mt-6">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="text-ms-gold font-bold hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-white/25 text-xs mt-6 font-semibold">
        © {new Date().getFullYear()} Master Speaking · Todos os direitos reservados
      </p>
    </div>
  )
}
