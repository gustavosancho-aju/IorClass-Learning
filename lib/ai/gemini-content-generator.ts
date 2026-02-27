/**
 * lib/ai/gemini-content-generator.ts
 *
 * AI-powered content generation using Google Gemini API.
 * Generates high-quality pedagogical content (Resumo, Tarefas, Oratório)
 * for each slide of a public speaking lesson.
 *
 * Uses native JSON schema output (responseMimeType: 'application/json')
 * for reliable structured responses — zero parse risk.
 *
 * Free tier available at: https://aistudio.google.com/app/apikey
 * Model: GOOGLE_AI_MODEL env var (default: gemini-2.0-flash)
 */

import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from '@google/generative-ai'
import type { SlideData }    from '../ppt-parser'
import type { ModuleContent } from '../content-generator'

/* ── Constants ───────────────────────────────────────────────────── */

const DEFAULT_MODEL = 'gemini-2.0-flash'

/* ── JSON response schema ────────────────────────────────────────── */

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    slides: {
      type: SchemaType.ARRAY,
      description: 'One content object per input slide, in the same order.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          slide_number: {
            type: SchemaType.NUMBER,
            description: 'Slide number (1-based, from input)',
          },
          title: {
            type: SchemaType.STRING,
            description: 'Slide title (from source)',
          },
          resumo: {
            type: SchemaType.OBJECT,
            description: 'Educational summary of the slide',
            properties: {
              text: {
                type: SchemaType.STRING,
                description: '2-3 sentences in English reinforcing the core concept',
              },
              bullets: {
                type: SchemaType.ARRAY,
                description: 'Key takeaways as short bullet strings (max 4)',
                items: { type: SchemaType.STRING },
              },
            },
            required: ['text', 'bullets'],
          },
          tarefas: {
            type: SchemaType.OBJECT,
            description: 'Multiple-choice comprehension tasks',
            properties: {
              questions: {
                type: SchemaType.ARRAY,
                description: 'Exactly 3 questions with cognitive progression (recall → application → analysis)',
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    question: { type: SchemaType.STRING },
                    type: {
                      type: SchemaType.STRING,
                      description: 'Always "multiple_choice"',
                    },
                    options: {
                      type: SchemaType.ARRAY,
                      description: 'Exactly 4 options (A-D)',
                      items: { type: SchemaType.STRING },
                    },
                    correct: {
                      type: SchemaType.NUMBER,
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
            type: SchemaType.OBJECT,
            description: 'Speaking practice prompt',
            properties: {
              prompt: {
                type: SchemaType.STRING,
                description: '1-2 sentences in Brazilian Portuguese challenging the student to speak about the topic',
              },
              target_phrase: {
                type: SchemaType.STRING,
                description: 'Key English phrase from the slide (5-15 words) the student should use',
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
- The "correct" field is 0-based (0 = first option)
- All questions and options must be in English

**ORATÓRIO** (Speaking Practice)
- "prompt": 1-2 sentences in Brazilian Portuguese motivating the student to speak about the topic
- "target_phrase": a key English phrase from the slide (5-15 words) the student should produce naturally

Slides to process:

${slideBlocks}

Return content for ALL ${slides.length} slide(s) in the same order they appear above.`
}

/* ── Main export ─────────────────────────────────────────────────── */

export async function generateModuleContentWithAI(
  slides: SlideData[],
): Promise<ModuleContent[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured')
  }

  const modelName = process.env.GOOGLE_AI_MODEL ?? DEFAULT_MODEL

  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema:   RESPONSE_SCHEMA,
    },
  })

  /* ── Single API call for all slides ────────────────────────────── */
  const result = await model.generateContent(buildPrompt(slides))
  const text   = result.response.text()

  /* ── Parse structured JSON response ────────────────────────────── */
  let parsed: { slides: ModuleContent[] }
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`Failed to parse Gemini JSON response: ${text.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed.slides)) {
    throw new Error('Gemini response missing slides array')
  }

  /* ── Guard: pad missing slides with rule-based if needed ─────────*/
  if (parsed.slides.length < slides.length) {
    console.warn(
      `[gemini-content-generator] Expected ${slides.length} slides, got ${parsed.slides.length}`,
    )
  }

  console.info(
    `[gemini-content-generator] Generated content for ${parsed.slides.length} slides using ${modelName}`,
  )

  return parsed.slides
}
