# Story 6.1 — Course Modules: Agrupamento de Aulas por Módulo (FEAT-01)

## Status
Ready for Review

## Story
**As a** professor (teacher) no Master Speaking LMS,
**I want** to create course modules and assign lessons to them during upload,
**So that** I can organize my content into logical units (e.g., "Módulo 1: Cumprimentos", "Módulo 2: Apresentações") and students can navigate the course in a structured way.

## Context & Naming Clarification
> ⚠️ **IMPORTANTE — Conflito de nomenclatura:**
> O banco já possui uma tabela `modules` que representa **unidades de slide** dentro de uma aula (Resumo, Tarefas, Oratório). Essa tabela **NÃO deve ser alterada**.
>
> O novo conceito chama-se **`course_modules`** no banco de dados.
> Na interface do usuário, aparece como **"Módulo"** (ex: "Módulo 1", "Módulo 2").
>
> Hierarquia final: `course_modules` → `lessons` → `modules` (slides)

## Acceptance Criteria

### Banco de Dados
- [ ] Migration `20260227000011_course_modules.sql` criada em `supabase/migrations/`
- [ ] Tabela `course_modules` criada:
  ```sql
  CREATE TABLE public.course_modules (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL CHECK (char_length(trim(title)) >= 1),
    description text,
    order_index integer NOT NULL DEFAULT 0,
    created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
  );
  ```
- [ ] Coluna `course_module_id` adicionada à tabela `lessons`:
  ```sql
  ALTER TABLE public.lessons
    ADD COLUMN course_module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL;
  ```
- [ ] RLS habilitado em `course_modules`:
  - Teachers podem INSERT/UPDATE/DELETE nos próprios módulos (`created_by = auth.uid()`)
  - Todos os autenticados podem SELECT (students precisam ver)
- [ ] Index: `CREATE INDEX ON public.course_modules (created_by);`
- [ ] Index: `CREATE INDEX ON public.lessons (course_module_id);`

### Tipos TypeScript
- [ ] `lib/supabase/types.ts` atualizado com a tipagem de `course_modules` e a nova coluna `course_module_id` em `lessons`

### Nova Página: `/teacher/modules`
- [ ] Arquivo `app/teacher/modules/page.tsx` criado (Server Component)
- [ ] Lista todos os `course_modules` criados pelo professor (`created_by = user.id`)
- [ ] Exibe para cada módulo: título, quantidade de aulas, ordem
- [ ] Formulário inline (ou modal) para criar novo módulo: campo `title` obrigatório, `description` opcional
- [ ] Server Action `createCourseModule` em `app/actions/modules.ts`:
  - Valida: título não vazio
  - Insere na tabela `course_modules` com `created_by = user.id`
  - Chama `revalidatePath('/teacher/modules')`
- [ ] Server Action `deleteCourseModule` em `app/actions/modules.ts`:
  - Verifica ownership (`created_by = user.id`) antes de deletar
  - Lições associadas ficam com `course_module_id = null` (ON DELETE SET NULL no banco)
  - Chama `revalidatePath('/teacher/modules')`
- [ ] Empty state com `<EmptyState illustration="lessons" title="Nenhum módulo ainda" description="Crie seu primeiro módulo para organizar suas aulas" />`

### Upload Flow — Seleção de Módulo
- [ ] `app/teacher/upload/page.tsx` busca `course_modules` do professor via Supabase server client
- [ ] Passa lista de módulos como prop para `<PptDropzone>`
- [ ] `components/upload/PptDropzone.tsx` recebe `courseModules: { id: string; title: string }[]`
- [ ] Adiciona campo **"Módulo (opcional)"** no formulário do dropzone, antes do botão de upload:
  - `<select>` com opção padrão "— Sem módulo —" (valor vazio)
  - Opções: um `<option>` por módulo disponível
  - Link "**+ Criar novo módulo**" abaixo do select que abre `/teacher/modules` em nova aba
- [ ] `app/actions/upload.ts` — interface `CreatePptUploadInput` recebe campo opcional `courseModuleId?: string`
- [ ] `createPptUploadRecord` passa `course_module_id: courseModuleId ?? null` no INSERT de `lessons`

### Lista de Aulas do Professor (`/teacher/lessons`)
- [ ] Query atualizada para fazer join com `course_modules`: `.select('*, course_modules(title), modules(count)')`
- [ ] Cada aula exibe badge do módulo (ex: chip `"Módulo 1"`) quando `course_module_id` não for null
- [ ] Aulas sem módulo exibem chip `"Sem módulo"` em estilo neutro (slate)

### Lista de Aulas do Aluno (`/student/lessons`)
- [ ] Query atualizada para buscar aulas com join em `course_modules`
- [ ] Aulas agrupadas visualmente por módulo na listagem:
  - Cabeçalho de seção: `"📚 Módulo 1: [título]"` em `text-ms-dark font-bold`
  - Aulas sem módulo ficam em seção `"Outras aulas"` no final
- [ ] Sem módulo = comportamento igual ao atual (não quebra nada)

### Navegação (Teacher)
- [ ] `components/layout/Sidebar.tsx` — adicionar item "Módulos" com ícone `Layers` entre "Aulas" e "Alunos":
  ```tsx
  { href: '/teacher/modules', icon: <Layers size={18} />, label: 'Módulos' }
  ```
- [ ] `components/layout/BottomNav.tsx` — teacher tabs já tem 5 tabs (limite de espaço mobile). **Não adicionar** na bottom nav. Módulos é acessível pelo sidebar no desktop e via `/teacher/modules` direto no mobile.

### Build & Qualidade
- [ ] `npm run build` passa sem erros TypeScript
- [ ] `npm run lint` passa sem erros
- [ ] Nenhuma alteração nas tabelas `modules` ou `scores` existentes

## Technical Notes

### Arquivos a criar
```
supabase/migrations/20260227000011_course_modules.sql
app/teacher/modules/page.tsx
app/actions/modules.ts
```

### Arquivos a modificar
```
lib/supabase/types.ts                        → adicionar course_modules type + lessons.course_module_id
app/teacher/upload/page.tsx                  → buscar course_modules + passar para PptDropzone
components/upload/PptDropzone.tsx            → prop courseModules + select field
app/actions/upload.ts                        → aceitar + persistir courseModuleId
app/teacher/lessons/page.tsx                 → join course_modules + badge
app/student/lessons/page.tsx                 → join + agrupar por módulo
components/layout/Sidebar.tsx               → adicionar item Módulos
```

### Padrões a seguir (existentes no codebase)
- Server Actions: ver `app/actions/upload.ts` — padrão `'use server'`, validação, rollback
- Server Components com Supabase: ver `app/teacher/lessons/page.tsx`
- EmptyState: `<EmptyState illustration="..." title="..." description="..." />`
- Padding responsivo: `px-4 py-6 md:p-8`
- Revalidação: `revalidatePath('/teacher/...')` após mutations

### Não fazer (fora de escopo desta story)
- ❌ Reordenação drag-and-drop de módulos
- ❌ Edição do título do módulo (criar + deletar é suficiente para MVP)
- ❌ Módulo no BottomNav (teacher já tem 5 tabs — limite de espaço)
- ❌ Progresso do aluno por módulo (story futura)

## Tasks

- [x] 1. Criar migration `20260227000011_course_modules.sql`
- [x] 2. Atualizar `lib/supabase/types.ts` com novos tipos
- [x] 3. Criar `app/actions/modules.ts` (createCourseModule + deleteCourseModule)
- [x] 4. Criar `app/teacher/modules/page.tsx`
- [x] 5. Modificar `app/teacher/upload/page.tsx` (buscar módulos)
- [x] 6. Modificar `components/upload/PptDropzone.tsx` (select de módulo)
- [x] 7. Modificar `app/actions/upload.ts` (aceitar courseModuleId)
- [x] 8. Modificar `app/teacher/lessons/page.tsx` (badge de módulo)
- [x] 9. Modificar `app/student/lessons/page.tsx` (agrupar por módulo)
- [x] 10. Modificar `components/layout/Sidebar.tsx` (item Módulos)
- [x] 11. Rodar build + lint

## Dev Agent Record
- **Agent:** Dex (dev)
- **Model:** claude-sonnet-4-5
- **Started:** 2026-02-27
- **Completed:** 2026-02-27
- **Debug log:** Fixed 2 lint errors: removed unused `revalidatePath` import from modules page; changed `let` → `const` for `lessonCounts`. All 3 remaining warnings are pre-existing (SettingsForm alt-text ×2, server.ts any).
- **Notes:** student/lessons uses smart grouping: flat view when no modules assigned (preserves legacy behavior), grouped view when ≥1 module exists. `course_module_id` inserted as NULL when user selects "— Sem módulo —".

## File List
- `supabase/migrations/20260227000011_course_modules.sql` (new)
- `app/teacher/modules/page.tsx` (new)
- `app/actions/modules.ts` (new)
- `lib/supabase/types.ts` (modified)
- `app/teacher/upload/page.tsx` (modified)
- `components/upload/PptDropzone.tsx` (modified)
- `app/actions/upload.ts` (modified)
- `app/teacher/lessons/page.tsx` (modified)
- `app/student/lessons/page.tsx` (modified)
- `components/layout/Sidebar.tsx` (modified)
