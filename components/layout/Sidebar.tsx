'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, Users, BarChart2,
  Upload, Settings, LogOut, ChevronRight, Layers
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

/* ── Types ─────────────────────────────────────────────── */
interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  role: 'teacher' | 'student'
  userName: string
  userEmail: string
}

/* ── Nav configs ────────────────────────────────────────── */
const teacherNav: NavItem[] = [
  { href: '/teacher/dashboard', label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { href: '/teacher/lessons',   label: 'Aulas',        icon: <BookOpen size={18} /> },
  { href: '/teacher/modules',   label: 'Módulos',      icon: <Layers size={18} /> },
  { href: '/teacher/students',  label: 'Alunos',       icon: <Users size={18} /> },
  { href: '/teacher/analytics', label: 'Analytics',    icon: <BarChart2 size={18} /> },
  { href: '/teacher/upload',    label: 'Upload PPT',   icon: <Upload size={18} /> },
]

const studentNav: NavItem[] = [
  { href: '/student/dashboard', label: 'Início',       icon: <LayoutDashboard size={18} /> },
  { href: '/student/lessons',   label: 'Minhas Aulas', icon: <BookOpen size={18} /> },
  { href: '/student/progress',  label: 'Progresso',    icon: <BarChart2 size={18} /> },
]

/* ── Component ──────────────────────────────────────────── */
export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const navItems = role === 'teacher' ? teacherNav : studentNav

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="hidden md:flex w-64 min-h-screen ms-gradient-bg flex-col">
      {/* ── Logo ── */}
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">💬</span>
          <span className="text-2xl">🪽</span>
        </div>
        <p className="text-white font-black text-xl tracking-tight leading-none">
          MASTER SPEAKING
        </p>
        <p className="text-white/40 text-xs font-semibold mt-0.5 uppercase tracking-widest">
          {role === 'teacher' ? 'Professor' : 'Aluno'}
        </p>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href ||
                           (item.href !== '/teacher/dashboard' &&
                            item.href !== '/student/dashboard' &&
                            pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'ms-nav-link',
                isActive && 'active'
              )}
            >
              <span className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                isActive ? 'bg-ms-gold/20 text-ms-gold' : 'text-white/50'
              )}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-ms-gold text-ms-dark text-xs font-black px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight size={14} className="text-white/40" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 pb-5 border-t border-white/10 pt-4 space-y-1">
        <Link
          href={`/${role}/settings`}
          className="ms-nav-link"
        >
          <span className="w-10 h-10 rounded-lg flex items-center justify-center text-white/50">
            <Settings size={18} />
          </span>
          Configurações
        </Link>

        <button
          onClick={handleLogout}
          className="ms-nav-link w-full text-left text-red-300/70 hover:text-red-300"
        >
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <LogOut size={18} />
          </span>
          Sair
        </button>

        {/* Avatar */}
        <div className="mt-4 px-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ms-gold/30 border border-ms-gold/40
                          flex items-center justify-center flex-shrink-0">
            <span className="text-ms-gold font-black text-sm">{initials}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm truncate">{userName}</p>
            <p className="text-white/40 text-xs truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
