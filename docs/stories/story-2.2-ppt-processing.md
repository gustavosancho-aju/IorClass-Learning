# Story 2.2 — PPT Processing API (Slides → JSON Content)

## Status
Ready for Dev

## Story
**As a** teacher,
**I want** the uploaded PowerPoint to be automatically parsed into structured content,
**So that** each slide becomes a lesson module with Resumo, Tarefas, and Oratório sections.

## Acceptance Criteria
- [ ] API route `POST /api/process-ppt` accepts `{ pptUploadId }` payload
- [ ] Route reads the `.pptx` file from Supabase Storage
- [ ] Parses slides using `pptx2json` or `officegen` — extracts: title, body text, bullet points, speaker notes
- [ ] For each slide, generates a structured module object:
  ```json
  {
    "lesson_id": "...",
    "slide_number": 1,
    "title": "Introduction",
    "resumo_content": { "text": "...", "bullets": ["..."] },
    "tarefas_content": { "questions": [{ "question": "...", "type": "multiple_choice", "options": [...] }] },
    "oratorio_content": { "prompt": "...", "target_phrase": "..." }
  }
  ```
- [ ] Each module is inserted into `modules` table in Supabase
- [ ] `ppt_uploads.status` updated to `'processed'` on success, `'failed'` on error
- [ ] `lessons.status` updated to `'draft'` after processing
- [ ] API returns `{ modules: Module[], lessonId }` on success

## Dev Notes

### Tech Stack
- Next.js App Router Route Handler: `app/api/process-ppt/route.ts`
- `pptx2json` npm package for slide extraction (install needed)
- Supabase Storage `download()` to get file bytes
- Supabase client (server) for DB inserts

### Install
```bash
npm install pptx2json
```

### Processing Flow
```
POST /api/process-ppt { pptUploadId }
  → fetch ppt_uploads record (get file_path, lesson_id)
  → download file from Supabase Storage
  → parse with pptx2json → array of slide objects
  → for each slide:
      → generate resumo_content (text + bullets from slide body)
      → generate tarefas_content (2-3 comprehension questions based on content)
      → generate oratorio_content (speaking prompt from slide title/key phrase)
      → INSERT into modules table
  → UPDATE ppt_uploads SET status = 'processed'
  → UPDATE lessons SET status = 'draft'
  → return { modules, lessonId }
```

### Module Content Generation (MVP — no AI needed for Wave 2)
For Wave 2, use simple extraction rules:
- `resumo_content.text` = slide body text joined
- `resumo_content.bullets` = bullet point list from slide
- `tarefas_content.questions` = 2 multiple choice questions auto-generated from bullet points
- `oratorio_content.prompt` = "Fale sobre: " + slide title
- `oratorio_content.target_phrase` = first bullet point or slide title

### Key Files to Create
- `app/api/process-ppt/route.ts` — Route Handler
- `lib/ppt-parser.ts` — PPT parsing utility
- `lib/content-generator.ts` — Content structure generator

## Tasks

- [ ] **Task 1**: Install `pptx2json` + add types if needed
  - [ ] `npm install pptx2json`
  - [ ] Create `lib/ppt-parser.ts` with `parsePptx(buffer: Buffer): SlideData[]`
- [ ] **Task 2**: Create `lib/content-generator.ts`
  - [ ] `generateResumo(slide: SlideData): ResumoContent`
  - [ ] `generateTarefas(slide: SlideData): TarefasContent`
  - [ ] `generateOratorio(slide: SlideData): OratorioContent`
- [ ] **Task 3**: Create `app/api/process-ppt/route.ts`
  - [ ] Validate request body `{ pptUploadId: string }`
  - [ ] Fetch `ppt_uploads` record from DB
  - [ ] Download file from Supabase Storage
  - [ ] Parse slides
  - [ ] Generate content for each slide
  - [ ] Batch insert into `modules` table
  - [ ] Update `ppt_uploads.status` and `lessons.status`
  - [ ] Return response
- [ ] **Task 4**: Trigger processing after upload (Story 2.1 integration)
  - [ ] After successful upload in `app/actions/upload.ts`, call `fetch('/api/process-ppt', { ... })`
  - [ ] Or: add "Process" button on lesson detail page
- [ ] **Task 5**: Update `lib/supabase/types.ts` if `modules` table needs new columns
- [ ] **Task 6**: Run `npm run build` — fix TypeScript errors

## Dev Agent Record

### Agent Model Used
_To be filled by @dev_

### Debug Log
_To be filled by @dev_

### Completion Notes
_To be filled by @dev_

### File List
_To be filled by @dev_

### Change Log
_To be filled by @dev_
