'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function getAuthRedirectUrl() {
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  const currentOrigin = window.location.origin
  const isLocalConfiguredBase = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    configuredBase ?? ''
  )
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(currentOrigin)
  const shouldUseConfiguredBase =
    configuredBase &&
    /^https?:\/\//.test(configuredBase) &&
    (!isLocalConfiguredBase || isLocalOrigin)

  const base = shouldUseConfiguredBase
    ? configuredBase
    : currentOrigin

  return `${base}/auth/callback`
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : 'Erro ao entrar. Tente novamente.'
      )
      setLoading(false)
      return
    }

    // Middleware redireciona para o dashboard correto
    window.location.href = '/'
  }

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
        <h2 className="text-white text-2xl font-bold mb-1">Bem-vindo de volta</h2>
        <p className="text-white/50 text-sm mb-7">
          Entre com suas credenciais para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20
                           text-white placeholder:text-white/30 font-semibold text-sm
                           focus:outline-none focus:ring-2 focus:ring-ms-gold/60
                           focus:border-ms-gold transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2
                           text-white/40 hover:text-white/80 transition-colors
                           rounded-lg"
                aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
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
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-black text-ms-dark text-sm uppercase tracking-widest
                       bg-ms-gold hover:opacity-90 active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-semibold">OU</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Magic Link */}
        <MagicLinkSection supabase={supabase} />
      </div>

      {/* Link para cadastro */}
      <p className="text-center text-white/40 text-sm mt-6">
        Não tem conta?{' '}
        <Link
          href="/signup"
          className="text-ms-gold font-bold hover:underline"
        >
          Cadastre-se
        </Link>
      </p>

      {/* Footer */}
      <p className="text-center text-white/25 text-xs mt-6 font-semibold">
        © {new Date().getFullYear()} Master Speaking · Todos os direitos reservados
      </p>
    </div>
  )
}

/* ── Magic Link (link por e-mail) ─────────────────────────── */
function MagicLinkSection({ supabase }: { supabase: ReturnType<typeof createBrowserClient> }) {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const redirectUrl = getAuthRedirectUrl()
    const options = {
      emailRedirectTo: redirectUrl,
      redirectTo: redirectUrl,
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options,
    })

    setLoading(false)

    if (signInError) {
      const message = signInError.message.toLowerCase()
      setError(
        message.includes('rate limit') || message.includes('too many')
          ? 'Muitas tentativas. Aguarde alguns minutos antes de solicitar outro link.'
          : 'Não foi possível enviar o magic link. Tente novamente.'
      )
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-2">
        <div className="text-2xl mb-2">📧</div>
        <p className="text-white/80 text-sm font-semibold">
          Link enviado para <span className="text-ms-gold">{email}</span>
        </p>
        <p className="text-white/40 text-xs mt-1">Verifique sua caixa de entrada</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleMagicLink} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Entre com magic link por e-mail"
        required
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20
                   text-white placeholder:text-white/30 font-semibold text-sm
                   focus:outline-none focus:ring-2 focus:ring-ms-gold/60
                   focus:border-ms-gold transition-all duration-200"
      />
      {error && (
        <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3">
          <p className="text-red-300 text-sm font-semibold">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full py-3 rounded-xl font-bold text-white text-sm
                   bg-white/10 border border-white/20 hover:bg-white/15
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : '✉️'}
        {loading ? 'Enviando…' : 'Enviar magic link'}
      </button>
    </form>
  )
}
