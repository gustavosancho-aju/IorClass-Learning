/**
 * lib/ppt-parser.ts
 *
 * Parses a .pptx file (Buffer) using JSZip and extracts structured slide data.
 * PPTX is a ZIP archive containing XML files at ppt/slides/slide{N}.xml.
 *
 * Text extraction strategy (Wave 2 — no AI):
 *   - Title:   <p:ph type="title"> or <p:ph type="ctrTitle"> placeholder shapes
 *   - Body:    All other <p:sp> shapes (body/content placeholders + text boxes)
 *   - Bullets: Each <a:p> paragraph in the body shapes (non-empty lines)
 */

import JSZip from 'jszip'

/* ── Types ───────────────────────────────────────────────────────── */
export interface SlideData {
  slideNumber: number
  title:       string
  body:        string   // full body text joined
  bullets:     string[] // individual paragraph lines (non-empty)
  notes:       string   // speaker notes (if present)
}

/* ── Constants ───────────────────────────────────────────────────── */
const TITLE_PLACEHOLDER_TYPES = new Set(['title', 'ctrTitle'])

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Extract raw text content from an XML string via <a:t> elements. */
function extractText(xml: string): string {
  // Use Array.from instead of for...of to avoid downlevelIteration requirement
  return Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g), m => m[1]).join('')
}

/**
 * Extract paragraph-level text from a shape XML node.
 * Each <a:p>…</a:p> block becomes one "bullet" line.
 */
function extractParagraphs(shapeXml: string): string[] {
  return Array.from(
    shapeXml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g),
    m => extractText(m[1]).trim()
  ).filter(Boolean)
}

/** Determine whether a <p:sp> XML block is a title placeholder. */
function isTitleShape(shapeXml: string): boolean {
  // Look for <p:ph type="title"> or <p:ph type="ctrTitle">
  const phMatch = shapeXml.match(/<p:ph[^>]+type="([^"]+)"/)
  if (!phMatch) return false
  return TITLE_PLACEHOLDER_TYPES.has(phMatch[1])
}

/** Parse a single slide XML into title + body paragraphs. */
function parseSlideXml(xml: string, slideNumber: number): SlideData {
  let title   = ''
  const bodyParagraphs: string[] = []

  // Iterate over all shapes (<p:sp>) — using Array.from for ES compat
  const shapes = Array.from(xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g))
  for (const match of shapes) {
    const shapeXml = match[0]
    if (isTitleShape(shapeXml)) {
      title = extractText(shapeXml).trim()
    } else {
      bodyParagraphs.push(...extractParagraphs(shapeXml))
    }
  }

  // Fallback: if no title shape found, use the first non-empty paragraph
  if (!title && bodyParagraphs.length > 0) {
    title = bodyParagraphs.shift()!
  }

  const body = bodyParagraphs.join('\n')

  return {
    slideNumber,
    title: title || `Slide ${slideNumber}`,
    body,
    bullets: bodyParagraphs,
    notes: '',
  }
}

/** Parse speaker notes XML (ppt/notesSlides/notesSlide{N}.xml). */
function parseNotesXml(xml: string): string {
  const paragraphs = extractParagraphs(xml)
  // Notes slides include placeholder text; skip if it starts with typical note placeholder
  return paragraphs
    .filter(p => !p.match(/^Click to edit/i))
    .join(' ')
    .trim()
}

/* ── Main export ─────────────────────────────────────────────────── */
export async function parsePptx(buffer: Buffer): Promise<SlideData[]> {
  const zip = await JSZip.loadAsync(buffer)

  // Find all slide files and sort by number
  const slideEntries = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] ?? '0')
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] ?? '0')
      return numA - numB
    })

  const slides: SlideData[] = []

  for (let i = 0; i < slideEntries.length; i++) {
    const entry   = slideEntries[i]
    const slideNum = i + 1

    const slideXml = await zip.file(entry)!.async('string')
    const slide    = parseSlideXml(slideXml, slideNum)

    // Try to load speaker notes
    const notesPath = entry.replace('ppt/slides/', 'ppt/notesSlides/')
                           .replace('slide', 'notesSlide')
    const notesFile = zip.file(notesPath)
    if (notesFile) {
      const notesXml = await notesFile.async('string')
      slide.notes    = parseNotesXml(notesXml)
    }

    slides.push(slide)
  }

  return slides
}
