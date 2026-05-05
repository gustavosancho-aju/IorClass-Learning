import type {
  ModuleContent,
  OratorioContent,
  ResumoContent,
  TarefaQuestion,
  TarefasContent,
} from './content-generator'

const MAX_TEXT_LENGTH = 3000
const MAX_BULLETS = 6
const MAX_QUESTIONS = 5
const MAX_OPTIONS = 4

function text(value: unknown, fallback = '') {
  return typeof value === 'string'
    ? value.trim().slice(0, MAX_TEXT_LENGTH)
    : fallback
}

function list(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback

  return value
    .map(item => text(item))
    .filter(Boolean)
    .slice(0, MAX_BULLETS)
}

function sanitizeResumo(value: unknown, fallbackTitle: string): ResumoContent {
  const source = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

  return {
    text: text(source.text, fallbackTitle),
    bullets: list(source.bullets),
  }
}

function fallbackQuestion(fallbackTitle: string): TarefaQuestion {
  return {
    question: `What is the main topic of "${fallbackTitle}"?`,
    type: 'multiple_choice',
    options: [
      fallbackTitle,
      'A grammar exception',
      'An unrelated vocabulary list',
      'A pronunciation rule',
    ],
    correct: 0,
  }
}

function sanitizeQuestion(value: unknown): TarefaQuestion | null {
  const source = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}
  const question = text(source.question)
  const options = list(source.options, []).slice(0, MAX_OPTIONS)
  const correct = Number(source.correct)

  if (!question || options.length !== MAX_OPTIONS) return null

  return {
    question,
    type: 'multiple_choice',
    options,
    correct: Number.isInteger(correct) && correct >= 0 && correct < options.length
      ? correct
      : 0,
  }
}

function sanitizeTarefas(value: unknown, fallbackTitle: string): TarefasContent {
  const source = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}
  const questions = Array.isArray(source.questions)
    ? source.questions
        .map(question => sanitizeQuestion(question))
        .filter((question): question is TarefaQuestion => question !== null)
        .slice(0, MAX_QUESTIONS)
    : []

  return {
    questions: questions.length > 0 ? questions : [fallbackQuestion(fallbackTitle)],
  }
}

function sanitizeOratorio(value: unknown, fallbackTitle: string): OratorioContent {
  const source = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

  return {
    prompt: text(source.prompt, `Fale sobre: ${fallbackTitle}`),
    target_phrase: text(source.target_phrase, fallbackTitle),
  }
}

export function sanitizeModuleContent(
  value: unknown,
  fallback: { title: string; slideNumber: number }
): ModuleContent {
  const source = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}
  const title = text(source.title, fallback.title) || fallback.title

  return {
    slide_number: Number(source.slide_number) || fallback.slideNumber,
    title,
    resumo: sanitizeResumo(source.resumo, title),
    tarefas: sanitizeTarefas(source.tarefas, title),
    oratorio: sanitizeOratorio(source.oratorio, title),
  }
}
