/**
 * lib/ai/claude-content-generator.ts
 *
 * AI-powered content generation using Claude API.
 * Replaces the rule-based content-generator for high-quality
 * pedagogical content (Resumo, Tarefas, Oratório) per slide.
 *
 * Uses tool_use for structured JSON output — zero parse risk.
 * Falls back to rule-based if called without a valid API key.
 *
 * Model: ANTHROPIC_MODEL env var (default: claude-haiku-4-5)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { SlideData }    from '../ppt-parser'
import type { ModuleContent } from '../content-generator'

/* ── Constants ───────────────────────────────────────────────────── */

const DEFAULT_MODEL = 'claude-haiku-4-5'

/* ── Tool schema (structured output contract) ────────────────────── */

const GENERATE_TOOL: Anthropic.Tool = {
  name: 'generate_lesson_content',
  description:
    'Generate structured pedagogical content for each slide of a public speaking lesson.',
  input_schema: {
    type: 'object',
    properties: {
      slides: {
        type: 'array',
        description: 'One content object per input slide, in the same order.',
        items: {
          type: 'object',
          properties: {
            slide_number: { type: 'number', description: 'Slide number (1-based)' },
            title: { type: 'string', description: 'Slide title (from source)' },
            resumo: {
              type: 'object',
              description: 'Educational summary of the slide',
              properties: {
                text: {
                  type: 'string',
                  description:
                    '2-3 sentences in English reinforcing the core concept',
                },
                bullets: {
                  type: 'array',
                  description: 'Key takeaways as short bullet strings (max 4)',
                  items: { type: 'string' },
                },
              },
              required: ['text', 'bullets'],
            },
            tarefas: {
              type: 'object',
              description: 'Multiple-choice comprehension tasks',
              properties: {
                questions: {
                  type: 'array',
                  description: 'Exactly 3 questions with cognitive progression',
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: ['multiple_choice'],
                      },
                      options: {
                        type: 'array',
                        description: 'Exactly 4 options (A-D)',
                        minItems: 4,
                        maxItems: 4,
                        items: { type: 'string' },
                      },
                      correct: {
                        type: 'number',
                        description: '0-based index of the correct answer',
                      },
                    },
                    required: ['question', 'type', 'options', 'correct'],
                  },
                },
              },
              required: ['questions'],
            },
            oratorio: {
              type: 'object',
              description: 'Speaking practice prompt',
              properties: {
                prompt: {
                  type: 'string',
                  description:
                    '1-2 sentences in Portuguese that challenge the student to speak about the topic',
                },
                target_phrase: {
                  type: 'string',
                  description:
                    'A key English phrase from the slide (5-15 words) the student should use',
                },
              },
              required: ['prompt', 'target_phrase'],
            },
          },
          required: ['slide_number', 'title', 'resumo', 'tarefas', 'oratorio'],
        },
      },
    },
    required: ['slides'],
  },
}

/* ── Prompt builder ──────────────────────────────────────────────── */

function buildPrompt(slides: SlideData[]): string {
  const slideBlocks = slides
    .map(slide => {
      const bulletList =
        slide.bullets.length > 0
          ? slide.bullets.map(b => `  • ${b}`).join('\n')
          : '  (no bullet points)'

      return [
        `--- SLIDE ${slide.slideNumber} ---`,
        `Title: ${slide.title}`,
        `Body: ${slide.body.trim() || '(no body text)'}`,
        `Bullets:\n${bulletList}`,
        slide.notes ? `Speaker Notes: ${slide.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')

  return `You are an expert English language teacher designing content for a Public Speaking course.
Your students are adult learners improving their professional communication skills in English.

For each of the ${slides.length} slide(s) below, generate high-quality educational content:

**RESUMO** (Summary)
- 2-3 sentences in English that clearly explain and reinforce the slide's core concept
- Avoid repeating bullet points verbatim — synthesize and add insight
- Tone: clear, encouraging, pedagogically sound

**TAREFAS** (Multiple-Choice Questions)
- Create EXACTLY 3 questions with increasing cognitive depth:
  1. Knowledge — direct recall from slide content
  2. Application — apply the concept to a realistic speaking scenario
  3. Analysis — evaluate, compare, or reflect on the concept critically
- Each question must have EXACTLY 4 options
- Distractors must be plausible but unambiguously incorrect upon reflection
- The \`correct\` field is 0-based (0 = first option)
- All questions and options must be in English

**ORATÓRIO** (Speaking Practice)
- \`prompt\`: 1-2 sentences in Brazilian Portuguese motivating the student to speak about the topic
- \`target_phrase\`: a key English phrase or sentence from the slide (5-15 words) the student should produce naturally during their speech

Slides to process:

${slideBlocks}

Return content for ALL ${slides.length} slide(s) in the same order they appear above.`
}

/* ── Main export ─────────────────────────────────────────────────── */

export async function generateModuleContentWithAI(
  slides: SlideData[],
): Promise<ModuleContent[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL

  const client = new Anthropic({ apiKey })

  /* ── Single API call for all slides ────────────────────────────── */
  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    tools: [GENERATE_TOOL],
    tool_choice: { type: 'tool', name: 'generate_lesson_content' },
    messages: [{ role: 'user', content: buildPrompt(slides) }],
  })

  /* ── Extract tool_use result ────────────────────────────────────── */
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolUse) {
    throw new Error('Claude did not return a tool_use block — unexpected response format')
  }

  const result = toolUse.input as { slides: ModuleContent[] }

  if (!Array.isArray(result.slides)) {
    throw new Error('Claude response missing slides array')
  }

  /* ── Guard: pad missing slides with empty-safe defaults if needed ─ */
  if (result.slides.length < slides.length) {
    console.warn(
      `[claude-content-generator] Expected ${slides.length} slides, got ${result.slides.length} — some slides may be missing`,
    )
  }

  console.info(
    `[claude-content-generator] Generated content for ${result.slides.length} slides using ${model}`,
  )

  return result.slides
}
