/**
 * POST /api/process-ppt
 *
 * Reads a previously-uploaded .pptx from Supabase Storage,
 * parses each slide, generates Resumo / Tarefas / Oratório content,
 * and bulk-inserts module records.
 *
 * Request body: { pptUploadId: string }
 * Response:     { modules: Module[], lessonId: string }
 *              | { error: string }
 */

import { NextResponse }          from 'next/server'
import { createClient }          from '@/lib/supabase/server'
import { createAdminClient }     from '@/lib/supabase/admin'
import { parsePptx }             from '@/lib/ppt-parser'
import { generateModuleContent } from '@/lib/content-generator'
import { checkRateLimit }        from '@/lib/rate-limit'

// Standard Node.js runtime (needs Buffer + JSZip — no edge compat)
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    /* ── 1. Parse + validate request body ──────────────────────── */
    const body = await request.json().catch(() => null)
    if (!body || typeof body.pptUploadId !== 'string') {
      return NextResponse.json({ error: 'pptUploadId is required' }, { status: 400 })
    }
    const { pptUploadId } = body as { pptUploadId: string }

    /* ── 2. Auth check (user client — respeita RLS) ─────────────── */
    const supabase      = createClient()        // anon key — para verificar sessão
    const supabaseAdmin = createAdminClient()   // service role — para escrita

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Role check — only teachers can process PPTs ──────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // ─────────────────────────────────────────────────────────────

    // ── Rate limit — 5 process jobs per hour per user ─────────────
    const rl = await checkRateLimit(user.id, {
      endpoint:      'process-ppt',
      maxRequests:   5,
      windowMinutes: 60,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }
    // ─────────────────────────────────────────────────────────────

    /* ── 3. Fetch ppt_uploads record (admin — sem restrição RLS) ── */
    const { data: upload, error: uploadFetchError } = await supabaseAdmin
      .from('ppt_uploads')
      .select('*')
      .eq('id', pptUploadId)
      .single()

    if (uploadFetchError || !upload) {
      return NextResponse.json({ error: 'Upload record not found' }, { status: 404 })
    }
    if (!upload.lesson_id) {
      return NextResponse.json({ error: 'Upload has no associated lesson' }, { status: 400 })
    }

    /* ── 4. Download file from Supabase Storage (admin) ─────────── */
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('ppt-uploads')
      .download(upload.storage_path)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError?.message}` },
        { status: 500 }
      )
    }

    // Convert Blob → ArrayBuffer → Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    /* ── 5. Parse slides from PPTX ──────────────────────────────── */
    let slides
    try {
      slides = await parsePptx(buffer)
    } catch (parseErr) {
      // Mark upload as error so teacher knows something went wrong
      await supabaseAdmin
        .from('ppt_uploads')
        .update({ status: 'error' })
        .eq('id', pptUploadId)

      return NextResponse.json(
        { error: `Failed to parse PPTX: ${parseErr instanceof Error ? parseErr.message : 'unknown'}` },
        { status: 422 }
      )
    }

    if (slides.length === 0) {
      return NextResponse.json({ error: 'No slides found in the PPTX file' }, { status: 422 })
    }

    /* ── 6. Generate module content + bulk insert ───────────────── */
    const moduleInserts = slides.map((slide, idx) => {
      const content = generateModuleContent(slide)
      return {
        lesson_id:    upload.lesson_id!,
        type:         'summary' as const, // single module per slide; all content in content_json
        title:        slide.title,
        content_json: content as unknown as Record<string, unknown>,
        order_index:  idx,
      }
    })

    const { data: modules, error: insertError } = await supabaseAdmin
      .from('modules')
      .insert(moduleInserts)
      .select()

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save modules: ${insertError.message}` },
        { status: 500 }
      )
    }

    /* ── 7. Update ppt_uploads status to 'completed' (admin) ─────── */
    await supabaseAdmin
      .from('ppt_uploads')
      .update({ status: 'completed' })
      .eq('id', pptUploadId)

    /* ── 8. Return result ────────────────────────────────────────── */
    return NextResponse.json({
      lessonId: upload.lesson_id,
      modules,
    })

  } catch (err) {
    console.error('[process-ppt] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
