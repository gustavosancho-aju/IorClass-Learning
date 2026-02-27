/**
 * lib/content-generator.ts
 *
 * Content generation pipeline — two strategies:
 *   1. AI-powered (Claude API) — when ANTHROPIC_API_KEY is set (default)
 *   2. Rule-based fallback       — deterministic, zero external deps
 *
 * Use generateModuleContentBatch() in API routes.
 * Individual helpers (generateResumo, etc.) remain for direct use / testing.
 */

import type { SlideData } from './ppt-parser'

/* ── Types ───────────────────────────────────────────────────────── */

export interface ResumoContent {
  text:    string
  bullets: string[]
}

export interface TarefaQuestion {
  question: string
  type:     'multiple_choice'
  options:  string[]
  correct:  number   // 0-based index of the correct answer
}

export interface TarefasContent {
  questions: TarefaQuestion[]
}

export interface OratorioContent {
  prompt:        string
  target_phrase: string
}

export interface ModuleContent {
  slide_number: number
  title:        string
  resumo:       ResumoContent
  tarefas:      TarefasContent
  oratorio:     OratorioContent
}

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Shuffle array in place using Fisher-Yates. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generate 2-3 multiple-choice questions from a slide's bullet points.
 * Wave 2 strategy: turn each bullet into a "What did the slide say about X?" question.
 */
function buildQuestions(slide: SlideData): TarefaQuestion[] {
  const bullets = slide.bullets.filter(b => b.length > 5) // skip very short lines

  if (bullets.length === 0) {
    // Fallback: single generic comprehension question
    return [
      {
        question: `What is the main topic of the slide "${slide.title}"?`,
        type:     'multiple_choice',
        options:  [
          slide.title,
          'Grammar rules',
          'Vocabulary lists',
          'Pronunciation tips',
        ],
        correct: 0,
      },
    ]
  }

  const questions: TarefaQuestion[] = []

  // Use up to 3 bullets for questions
  for (const bullet of bullets.slice(0, 3)) {
    // Construct distractors by taking other bullets; pad with generic fillers
    const distractors = [
      ...bullets.filter(b => b !== bullet),
      'This point was not mentioned in the slide',
      'The speaker did not address this topic',
    ].slice(0, 3)

    // Build options: correct + 3 distractors, then shuffle keeping track of correct index
    const allOptions = [bullet, ...distractors].slice(0, 4)
    const shuffled   = [...allOptions]
    shuffle(shuffled)
    const correctIdx = shuffled.indexOf(bullet)

    questions.push({
      question: `Which statement accurately reflects the content of the slide?`,
      type:     'multiple_choice',
      options:  shuffled,
      correct:  correctIdx,
    })
  }

  return questions
}

/* ── Generators ──────────────────────────────────────────────────── */

export function generateResumo(slide: SlideData): ResumoContent {
  const text = slide.body.trim() || slide.title
  return {
    text,
    bullets: slide.bullets,
  }
}

export function generateTarefas(slide: SlideData): TarefasContent {
  return {
    questions: buildQuestions(slide),
  }
}

export function generateOratorio(slide: SlideData): OratorioContent {
  const targetPhrase = slide.bullets[0] || slide.title
  return {
    prompt:        `Fale sobre: ${slide.title}`,
    target_phrase: targetPhrase,
  }
}

export function generateModuleContent(slide: SlideData): ModuleContent {
  return {
    slide_number: slide.slideNumber,
    title:        slide.title,
    resumo:       generateResumo(slide),
    tarefas:      generateTarefas(slide),
    oratorio:     generateOratorio(slide),
  }
}

/* ── Batch generator with AI + rule-based fallback ───────────────── */

/**
 * Generate content for all slides in a single pass.
 *
 * Strategy:
 *   - If ANTHROPIC_API_KEY is set → use Claude API (one request for all slides)
 *   - On error or missing key    → fall back to rule-based per slide
 *
 * This is the function API routes should call.
 */
export async function generateModuleContentBatch(
  slides: SlideData[],
): Promise<ModuleContent[]> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { generateModuleContentWithAI } = await import('./ai/claude-content-generator')
      const results = await generateModuleContentWithAI(slides)

      // If AI returned fewer slides than expected, pad with rule-based fallback
      if (results.length < slides.length) {
        const padded = [...results]
        for (let i = results.length; i < slides.length; i++) {
          padded.push(generateModuleContent(slides[i]))
        }
        return padded
      }

      return results
    } catch (err) {
      console.warn(
        '[content-generator] Claude API failed — falling back to rule-based generation:',
        err instanceof Error ? err.message : err,
      )
    }
  }

  // Rule-based fallback (synchronous)
  return slides.map(generateModuleContent)
}
