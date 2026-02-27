'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, BookOpen, Users, BarChart2, Upload } from 'lucide-react'

interface BottomNavProps {
  role: 'teacher' | 'student'
}

const studentTabs = [
  { href: '/student/dashboard', label: 'Início',    icon: LayoutDashboard },
  { href: '/student/lessons',   label: 'Aulas',     icon: BookOpen },
  { href: '/student/progress',  label: 'Progresso', icon: BarChart2 },
]

const teacherTabs = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/lessons',   label: 'Aulas',     icon: BookOpen },
  { href: '/teacher/students',  label: 'Alunos',    icon: Users },
  { href: '/teacher/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/teacher/upload',    label: 'Upload',    icon: Upload },
]

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const tabs = role === 'student' ? studentTabs : teacherTabs

  return (
    <nav className="fixed bottom-0 inset-x-0 h-14 ms-gradient-bg flex md:hidden z-50 border-t border-white/10">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== '/teacher/dashboard' &&
           href !== '/student/dashboard' &&
           pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]',
              'transition-colors',
              isActive ? 'text-ms-gold' : 'text-white/50 hover:text-white/80'
            )}
          >
            <Icon size={20} className={cn(isActive && 'drop-shadow-sm')} />
            <span className="text-[10px] font-bold leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
