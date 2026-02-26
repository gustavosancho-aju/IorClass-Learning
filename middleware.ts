import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  // Atualiza sessão do usuário
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ─── Rotas públicas ──────────────────────────────────────
  const publicRoutes = ['/login', '/auth/callback']
  const isPublic = publicRoutes.some(r => pathname.startsWith(r))

  // Usuário não autenticado tentando acessar rota privada
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Usuário autenticado tentando acessar login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ─── Proteção por role ───────────────────────────────────
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Teacher tentando acessar área de aluno
    if (role === 'teacher' && pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }

    // Aluno tentando acessar área de professor
    if (role === 'student' && pathname.startsWith('/teacher')) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    // Redirect da raiz "/" para o dashboard correto
    if (pathname === '/') {
      const dest = role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
