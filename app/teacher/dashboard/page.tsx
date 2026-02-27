import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, TrendingUp, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatScore, getScoreLevel } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function TeacherDashboard() {
  const supabase = createClient()

  await supabase.auth.getUser()

  // ── Dados agregados ──────────────────────────────────────
  const [
    { count: totalLessons },
    { count: totalStudents },
    { data: recentScores },
    { data: lessons },
  ] = await Promise.all([
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase
      .from('scores')
      .select('score, module_type, created_at, student_id')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('lessons')
      .select('id, title, order_index, is_published')
      .order('order_index')
      .limit(5),
  ])

  const avgScore = recentScores?.length
    ? recentScores.reduce((a, b) => a + (b.score ?? 0), 0) / recentScores.length
    : 0

  const scoreLevel = getScoreLevel(avgScore)

  // ── Hora do dia ──────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="px-4 py-6 md:p-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8 animate-fade-in-up">
        <p className="text-ms-light font-semibold text-sm uppercase tracking-widest mb-1">
          {greeting}, Professor 👋
        </p>
        <h1 className="text-ms-dark font-black text-3xl">
          Dashboard do Instrutor
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">
          Acompanhe o progresso dos seus alunos em tempo real
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="text-ms-medium" size={22} />}
          label="Aulas Criadas"
          value={String(totalLessons ?? 0)}
          sub="módulos de conteúdo"
          color="border-ms-medium/20 bg-blue-50"
        />
        <StatCard
          icon={<Users className="text-ms-dark" size={22} />}
          label="Alunos Ativos"
          value={String(totalStudents ?? 0)}
          sub="cadastrados na plataforma"
          color="border-ms-dark/20 bg-slate-50"
        />
        <StatCard
          icon={<TrendingUp className="text-emerald-600" size={22} />}
          label="Nota Média"
          value={formatScore(avgScore)}
          sub={scoreLevel.label}
          color="border-emerald-200 bg-emerald-50"
        />
        <StatCard
          icon={<Star className="text-ms-gold" size={22} />}
          label="Atividades"
          value={String(recentScores?.length ?? 0)}
          sub="respostas recentes"
          color="border-ms-gold/30 bg-amber-50"
        />
      </div>

      {/* ── Grid principal ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Aulas */}
        <div className="lg:col-span-2 ms-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-ms-dark font-black text-lg">Aulas</h2>
            <Link
              href="/teacher/lessons"
              className="text-ms-medium text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>

          {lessons && lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson, i) => (
                <Link
                  key={lesson.id}
                  href={`/teacher/lessons/${lesson.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-ms-beige
                             transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl ms-gradient-bg flex items-center
                                  justify-center text-white font-black text-sm flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ms-dark font-bold text-sm truncate">{lesson.title}</p>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">
                      Resumo · Tarefas · Oratório
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    lesson.is_published
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {lesson.is_published ? 'Publicada' : 'Rascunho'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="lessons"
              title="Nenhuma aula criada ainda"
              description="Importe um PPT para gerar sua primeira aula"
              ctaLabel="Enviar apresentação"
              ctaHref="/teacher/upload"
            />
          )}
        </div>

        {/* Atividade recente */}
        <div className="ms-card">
          <h2 className="text-ms-dark font-black text-lg mb-5">Atividade Recente</h2>

          {recentScores && recentScores.length > 0 ? (
            <div className="space-y-3">
              {recentScores.map((s, i) => {
                const level = getScoreLevel(s.score ?? 0)
                const moduleEmoji =
                  s.module_type === 'summary'  ? '📚' :
                  s.module_type === 'tasks'    ? '✏️' : '🎤'

                return (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="text-xl">{moduleEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ms-dark text-xs font-bold truncate">
                        Aluno {s.student_id.slice(0, 6)}…
                      </p>
                      <p className="text-slate-400 text-xs capitalize">{s.module_type}</p>
                    </div>
                    <span className={`text-xs font-black ${level.color}`}>
                      {formatScore(s.score ?? 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              illustration="activity"
              title="Nenhuma atividade ainda"
              description="Aparecerá aqui quando alunos completarem módulos"
            />
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          href="/teacher/upload"
          icon="📤"
          title="Enviar PPT"
          desc="Importe uma apresentação para gerar aula"
        />
        <QuickAction
          href="/teacher/students"
          icon="👥"
          title="Ver Alunos"
          desc="Gerencie os alunos cadastrados"
        />
        <QuickAction
          href="/teacher/analytics"
          icon="📊"
          title="Analytics"
          desc="Relatórios detalhados de desempenho"
        />
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────── */
function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className={`ms-card border ${color} animate-fade-in-up`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-ms-dark">{value}</p>
      <p className="text-ms-dark/70 font-bold text-sm mt-0.5">{label}</p>
      <p className="text-slate-400 text-xs font-semibold mt-1">{sub}</p>
    </div>
  )
}

function QuickAction({
  href, icon, title, desc,
}: {
  href: string
  icon: string
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="ms-card hover:border-ms-medium/30 hover:shadow-md
                 transition-all duration-200 group flex items-center gap-4"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-ms-dark font-black text-sm group-hover:text-ms-medium transition-colors">
          {title}
        </p>
        <p className="text-slate-400 text-xs font-semibold mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-ms-medium
                                          group-hover:translate-x-1 transition-all" />
    </Link>
  )
}

