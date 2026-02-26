# Story 2.1 — PPT Upload UI + Supabase Storage

## Status
Ready for Review

## Story
**As a** teacher,
**I want to** upload a PowerPoint file for a lesson,
**So that** the system can process it into structured lesson content.

## Acceptance Criteria
- [ ] Teacher can navigate to `/teacher/upload` via sidebar "Upload PPT" link
- [ ] Page shows a drag-and-drop zone + file picker (accepts `.ppt`, `.pptx` only)
- [ ] File is uploaded to Supabase Storage bucket `ppt-uploads/{teacherId}/{lessonId}/{filename}`
- [ ] A record is inserted into `ppt_uploads` table: `{ teacher_id, lesson_id, file_path, status: 'pending' }`
- [ ] Upload progress indicator shown during upload
- [ ] On success: redirect to `/teacher/lessons/{lessonId}` with toast "Upload successful!"
- [ ] On error: toast with error message, file not saved
- [ ] Max file size: 50MB enforced client-side with clear error message

## Dev Notes

### Tech Stack
- Next.js App Router — Server Action for upload logic
- Supabase Storage — bucket: `ppt-uploads` (create if not exists)
- `@supabase/ssr` client for server-side upload
- `react-hot-toast` for notifications

### Key Files to Create/Modify
- `app/teacher/upload/page.tsx` — Upload page
- `components/upload/PptDropzone.tsx` — Drag-and-drop component
- `app/actions/upload.ts` — Server Action: upload to Storage + insert DB record

### Supabase Storage Setup
```sql
-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public) VALUES ('ppt-uploads', 'ppt-uploads', false);

CREATE POLICY "Teachers can upload PPTs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ppt-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Teachers can view own PPTs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ppt-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Server Action Pattern
```ts
// app/actions/upload.ts
'use server'
export async function uploadPpt(formData: FormData) {
  const supabase = createClient()
  const file = formData.get('file') as File
  // 1. Upload to storage
  // 2. Insert ppt_uploads record
  // 3. Return { lessonId, error }
}
```

## Tasks

- [x] **Task 1**: Create Supabase Storage bucket + RLS policies (manual SQL step, documented above)
- [x] **Task 2**: Create `app/teacher/upload/page.tsx` with basic layout + form
  - [x] Add "Upload PPT" link to Sidebar `teacher` nav items
  - [x] Page layout: heading, description, dropzone area
- [x] **Task 3**: Build `components/upload/PptDropzone.tsx`
  - [x] Drag-and-drop zone with visual feedback (border color change on drag over)
  - [x] File picker fallback button
  - [x] Client-side validation: file type + 50MB size check
  - [x] Progress bar during upload (simulated: 0→90→95→100%)
- [x] **Task 4**: Create `app/actions/upload.ts` Server Action
  - [x] Upload file to `ppt-uploads/{teacherId}/{lessonId}/{filename}` (client-side via Supabase Storage)
  - [x] Insert row into `ppt_uploads`: `{ filename, storage_path, lesson_id, uploaded_by, status: 'processing' }`
  - [x] Return `{ lessonId, error }`
- [x] **Task 5**: Wire up success/error states
  - [x] On success: `router.push('/teacher/lessons/' + lessonId)` + toast
  - [x] On error: toast with message + inline error display
- [x] **Task 6**: Run `npm run build` — fix any TypeScript errors

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (via Dex @dev)

### Debug Log
- `lessons.Insert` in `lib/supabase/types.ts` did not include `id?` field — added to allow pre-generated UUID coordination between storage path and DB record
- Supabase JS SDK v2 does not expose XHR upload progress natively — simulated via state jumps (0→90→95→100%)
- Storage upload done client-side via `createBrowserClient` (not Server Action) to allow progress tracking

### Completion Notes
- Upload is done client-side (browser → Supabase Storage directly) for progress UX
- Server Action `createPptUploadRecord` handles DB writes only (lesson + ppt_uploads records)
- `lessonId` generated client-side with `crypto.randomUUID()` so storage path and DB ID are consistent
- Lesson detail page `/teacher/lessons/[lessonId]` is a placeholder — full player in Story 2.3
- Task 1 (Storage bucket + RLS) is a manual Supabase SQL step documented in Dev Notes

### File List
- `lib/supabase/types.ts` — modified: added `id?: string` to `lessons.Insert`
- `app/teacher/upload/page.tsx` — created: Server Component upload page
- `components/upload/PptDropzone.tsx` — created: Client Component drag-and-drop uploader
- `app/actions/upload.ts` — created: Server Action for lesson + ppt_uploads DB records
- `app/teacher/lessons/[lessonId]/page.tsx` — created: Placeholder lesson detail page

### Change Log
- feat: Story 2.1 — PPT Upload UI + Supabase Storage complete
