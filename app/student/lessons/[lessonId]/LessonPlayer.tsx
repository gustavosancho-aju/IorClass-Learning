'use client'

import { useState }   from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResumoTab }  from './tabs/ResumoTab'
import { TarefasTab } from './tabs/TarefasTab'
import { OratorioTab } from './tabs/OratorioTab'
import type { Database }     from '@/lib/supabase/types'
import type { LessonModule } from './types'

/* ── Types ───────────────────────────────────────────────────────── */
type Lesson = Database['public']['Tables']['lessons']['Row']
type Score  = Database['public']['Tables']['scores']['Row']

interface LessonPlayerProps {
  lesson:    Lesson
  modules:   LessonModule[]
  scores:    Score[]
  studentId: string
}

type TabId = 'resumo' | 'tarefas' | 'oratorio'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'resumo',   label: 'Resumo',   emoji: '📖' },
  { id: 'tarefas',  label: 'Tarefas',  emoji: '✏️' },
  { id: 'oratorio', label: 'Oratório', emoji: '🎤' },
]

/* ── Component ───────────────────────────────────────────────────── */
export function LessonPlayer({ lesson, modules, scores, studentId }: LessonPlayerProps) {
  const [activeTab,     setActiveTab]     = useState<TabId>('resumo')
  const [currentSlide,  setCurrentSlide]  = useState(0)

  const currentModule = modules[currentSlide]

  function goToSlide(idx: number) {
    const clamped = Math.max(0, Math.min(modules.length - 1, idx))
    setCurrentSlide(clamped)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Lesson header */}
      <div>
        <h1 className="text-2xl font-black text-ms-dark">{lesson.title}</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Slide {currentSlide + 1} de {modules.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-ms-medium rounded-full"
          animate={{ width: `${((currentSlide + 1) / modules.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg',
              'text-sm font-bold transition-all',
              activeTab === tab.id
                ? 'bg-white text-ms-dark shadow-sm'
                : 'text-slate-400 hover:text-ms-dark',
            ].join(' ')}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — animated */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${currentSlide}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'resumo' && (
            <ResumoTab
              module={currentModule}
              currentSlide={currentSlide}
              totalSlides={modules.length}
              onPrev={() => goToSlide(currentSlide - 1)}
              onNext={() => goToSlide(currentSlide + 1)}
              lessonId={lesson.id}
              studentId={studentId}
              modules={modules}
              existingScores={scores}
            />
          )}
          {activeTab === 'tarefas' && (
            <TarefasTab
              module={currentModule}
              lessonId={lesson.id}
              studentId={studentId}
              existingScore={scores.find(s => s.module_id === currentModule.id && s.module_type === 'tasks')}
            />
          )}
          {activeTab === 'oratorio' && (
            <OratorioTab
              module={currentModule}
              lessonId={lesson.id}
              studentId={studentId}
              existingScore={scores.find(
                s => s.module_id === currentModule.id && s.module_type === 'speaking'
              )}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
