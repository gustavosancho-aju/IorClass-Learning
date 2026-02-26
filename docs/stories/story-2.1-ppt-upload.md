# Story 2.1 — PPT Upload UI + Supabase Storage

## Status
Ready for Dev

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

- [ ] **Task 1**: Create Supabase Storage bucket + RLS policies (manual SQL step, documented above)
- [ ] **Task 2**: Create `app/teacher/upload/page.tsx` with basic layout + form
  - [ ] Add "Upload PPT" link to Sidebar `teacher` nav items
  - [ ] Page layout: heading, description, dropzone area
- [ ] **Task 3**: Build `components/upload/PptDropzone.tsx`
  - [ ] Drag-and-drop zone with visual feedback (border color change on drag over)
  - [ ] File picker fallback button
  - [ ] Client-side validation: file type + 50MB size check
  - [ ] Progress bar during upload (use `XMLHttpRequest` or Supabase upload progress)
- [ ] **Task 4**: Create `app/actions/upload.ts` Server Action
  - [ ] Upload file to `ppt-uploads/{teacherId}/{lessonId}/{filename}`
  - [ ] Insert row into `ppt_uploads`: `{ teacher_id, lesson_id, file_path, original_filename, status: 'pending' }`
  - [ ] Return `{ lessonId, error }`
- [ ] **Task 5**: Wire up success/error states
  - [ ] On success: `router.push('/teacher/lessons/' + lessonId)` + toast
  - [ ] On error: toast with message
- [ ] **Task 6**: Run `npm run build` — fix any TypeScript errors

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
