import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina classes Tailwind de forma segura */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata score (0–100) para exibição */
export function formatScore(score: number): string {
  return `${Math.round(score)}%`
}

/** Retorna label e cor baseados no score */
export function getScoreLevel(score: number): {
  label: string
  color: string
  bg: string
} {
  if (score >= 80) return { label: 'Excelente', color: 'text-emerald-700', bg: 'bg-emerald-50' }
  if (score >= 60) return { label: 'Bom trabalho', color: 'text-ms-medium', bg: 'bg-blue-50' }
  return { label: 'Continue praticando', color: 'text-amber-700', bg: 'bg-amber-50' }
}

/** Retorna emoji e label do tipo de módulo */
export function getModuleInfo(type: 'summary' | 'tasks' | 'speaking'): {
  emoji: string
  label: string
  description: string
} {
  const map = {
    summary:  { emoji: '📚', label: 'Resumo',  description: 'Conteúdo teórico com áudio' },
    tasks:    { emoji: '✏️', label: 'Tarefas', description: 'Exercícios interativos' },
    speaking: { emoji: '🎤', label: 'Oratório', description: 'Treino de pronúncia' },
  }
  return map[type]
}

/** Calcula nota média de um array de scores */
export function calcAvgScore(scores: number[]): number {
  if (!scores.length) return 0
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/** Trunca texto longo */
export function truncate(str: string, len = 60): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}
