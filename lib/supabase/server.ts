import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Cria o cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
 * Gerencia cookies automaticamente para manter a sessão do usuário.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: object }[]) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookiesToSet.forEach(({ name, value, options }) =>
              (cookieStore as any).set(name, value, options)
            )
          } catch {
            // Chamado de um Server Component — os cookies serão atualizados
            // pelo middleware. Este catch evita erros desnecessários.
          }
        },
      },
    }
  )
}
