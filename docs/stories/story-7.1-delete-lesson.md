# Story 7.1 — Teacher: Excluir Aula (FEAT-07)

## Status
Ready for Review

## Story
**As a** professor (teacher) no Master Speaking LMS,
**I want** to permanently delete a lesson I created,
**So that** I can remove content that is no longer relevant, fix mistakes, or clean up my course without accumulating outdated material.

## Context & Technical Background

> **Motivação:** Atualmente o professor não tem como remover uma aula após criá-la. Isso força a acumulação de aulas de teste, aulas com erros e conteúdo desatualizado na listagem, poluindo a experiência de uso.
>
> **Cascata de exclusão:** Uma aula possui relacionamentos com:
> - `modules` (slides gerados — Resumo, Tarefas, Oratório) → devem ser deletados junto
> - `ppt_uploads` (registro do upload original) → deve ser deletado junto
> - `scores` (pontuações dos alunos nesta aula) → devem ser deletados junto
> - `course_module_id` em `lessons` → a aula desaparece; o `course_module` **permanece intacto**
>
> **Padrão a seguir:** `deleteCourseModule` em `app/actions/modules.ts` — auth guard + ownership check + revalidatePath.
> O botão segue o padrão de `DeleteModuleButton.tsx` com `useTransition` + `react-hot-toast`.
>
> **Confirmação obrigatória:** A exclusão é **irreversível** e afeta pontuações de alunos.
> Requer confirmação explícita do professor antes de executar.

---

## Acceptance Criteria

### Server Action
- [ ] `app/actions/lessons.ts` criado com a action `deleteLesson(lessonId: string)`
- [ ] Auth guard: retorna `{ error: 'Não autorizado.' }` se usuário não estiver autenticado
- [ ] Role check: retorna `{ error: 'Forbidden.' }` se role não for `'teacher'`
- [ ] Ownership check: retorna `{ error: 'Você não tem permissão para excluir esta aula.' }` se `created_by !== user.id`
- [ ] Delete executado via Supabase client (RLS garante que teacher só deleta a própria aula)
- [ ] Após delete bem-sucedido, `revalidatePath` chamado para:
  - `/teacher/lessons`
  - `/teacher/dashboard`
  - `/student/lessons`
- [ ] Retorna `{ success: true }` em caso de sucesso
- [ ] Retorna `{ error: string }` em caso de falha

---

### Cascata de Exclusão no Banco
- [ ] Verificar em `supabase/migrations/` se `modules.lesson_id` já possui `ON DELETE CASCADE` — se não, adicionar migration de correção
- [ ] Verificar se `ppt_uploads.lesson_id` possui `ON DELETE CASCADE` — se não, adicionar migration de correção
- [ ] Verificar se `scores.lesson_id` possui `ON DELETE CASCADE` — se não, adicionar migration de correção
- [ ] Após exclusão de uma aula, nenhum registro órfão deve restar em `modules`, `ppt_uploads` ou `scores`

**Referência — SQL de correção de FK (se necessário):**
```sql
-- Exemplo para a tabela modules:
ALTER TABLE public.modules
  DROP CONSTRAINT modules_lesson_id_fkey,
  ADD CONSTRAINT modules_lesson_id_fkey
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
```

---

### Componente `DeleteLessonButton`
- [ ] `components/lessons/DeleteLessonButton.tsx` criado como Client Component (`'use client'`)
- [ ] Props: `lessonId: string`, `lessonTitle: string`, `redirectAfter?: boolean` (padrão `false`)
- [ ] Exibe botão "Excluir" com ícone `Trash2` (Lucide) e visual `text-red-500 hover:text-red-700`
- [ ] Ao clicar, exibe confirmação com a mensagem:
  > *"Tem certeza que deseja excluir a aula '[lessonTitle]'? Esta ação é irreversível e removerá todos os módulos e pontuações associadas."*
- [ ] Confirmação via `window.confirm` (nativo, sem dependências extras)
- [ ] Se confirmado → chama `deleteLesson(lessonId)` dentro de `useTransition`
- [ ] Durante a ação → botão desabilitado com spinner `Loader2` no lugar do ícone
- [ ] Sucesso → `toast.success('Aula excluída com sucesso 🗑️')`
- [ ] Erro → `toast.error(mensagem de erro retornada pela action)`
- [ ] Se `redirectAfter === true` → usa `router.push('/teacher/lessons')` após sucesso (para uso na página de detalhe)

---

### Listagem de Aulas (`/teacher/lessons`)
- [ ] `app/teacher/lessons/page.tsx` inclui `<DeleteLessonButton>` em cada card de aula
- [ ] Botão posicionado discretamente no canto superior direito do card (ícone de lixeira pequeno)
- [ ] Layout e espaçamento do card preservados — nenhuma quebra visual
- [ ] Botão renderizado apenas quando `lesson.created_by === user.id` (verificação no Server Component)

---

### Detalhe de Aula (`/teacher/lessons/[lessonId]`)
- [ ] `app/teacher/lessons/[lessonId]/page.tsx` inclui `<DeleteLessonButton redirectAfter>` na área de ações
- [ ] Botão posicionado ao lado do botão "Visualizar como Aluno" (ou abaixo, dependendo do espaço)
- [ ] Visual: botão outline `border-red-200 text-red-500 hover:bg-red-50` para não competir com o CTA principal
- [ ] Após exclusão bem-sucedida → `router.push('/teacher/lessons')` via prop `redirectAfter`

---

### Build & Qualidade
- [ ] `npm run build` passa sem erros TypeScript
- [ ] `npm run lint` passa sem novos warnings

---

## Technical Notes

### Arquivos a criar
```
app/actions/lessons.ts                      → deleteLesson Server Action
components/lessons/DeleteLessonButton.tsx   → Client Component (confirm + toast + redirect)
supabase/migrations/YYYYMMDDXXXXXX_fix_lesson_cascade.sql  → (condicional, apenas se FK sem CASCADE)
```

### Arquivos a modificar
```
app/teacher/lessons/page.tsx                → adicionar DeleteLessonButton em cada card
app/teacher/lessons/[lessonId]/page.tsx     → adicionar DeleteLessonButton + redirect pós-exclusão
```

### Padrão de referência no codebase
| O que referenciar | Onde está |
|-------------------|-----------|
| Server Action com auth + ownership + revalidate | `app/actions/modules.ts` → `deleteCourseModule` |
| Client Component com useTransition + toast | `DeleteModuleButton.tsx` (ver story 6.2) |
| Toast de sucesso/erro | `react-hot-toast` — já instalado |
| Ícone de lixeira | `Trash2` de `lucide-react` — já instalado |
| Spinner de loading | `Loader2` de `lucide-react` — já instalado |

### Não fazer (fora de escopo desta story)
- ❌ Soft delete / arquivamento (somente hard delete)
- ❌ Exclusão em lote de múltiplas aulas
- ❌ Exclusão por admin
- ❌ Restauração de aula excluída
- ❌ Notificação para alunos quando aula é removida
- ❌ Exclusão de arquivos no Supabase Storage (apenas o registro no banco é removido)

---

## Tasks

- [x] 1. Verificar FKs nas migrations (`modules`, `ppt_uploads`, `scores`) — adicionar `ON DELETE CASCADE` se ausente
- [x] 2. Criar `app/actions/lessons.ts` com Server Action `deleteLesson`
- [x] 3. Criar `components/lessons/DeleteLessonButton.tsx` (Client Component)
- [x] 4. Modificar `app/teacher/lessons/page.tsx` — botão de exclusão nos cards
- [x] 5. Modificar `app/teacher/lessons/[lessonId]/page.tsx` — botão de exclusão + redirect pós-exclusão
- [x] 6. Rodar `npm run build` + `npm run lint` e confirmar zero erros

---

## Dev Agent Record
- **Agent:** Dex (@dev)
- **Model:** claude-sonnet-4-6
- **Started:** 2026-02-27
- **Completed:** 2026-02-27
- **Debug log:** `ppt_uploads.lesson_id` tinha `ON DELETE SET NULL` — corrigido para `CASCADE` via migration 014. `modules.lesson_id` e `scores.lesson_id` já tinham `CASCADE`. Build e lint: zero erros novos (3 warnings pré-existentes mantidos).
- **Notes:** `DeleteLessonButton` usa `window.confirm` nativo para confirmação (sem dependências extras). Prop `redirectAfter` controla comportamento pós-exclusão: `false` na lista (revalidação automática), `true` na página de detalhe (router.push). Na página de detalhe, o botão foi posicionado como irmão do link "Visualizar como Aluno" em uma `flex` row, mantendo visual coeso.

## File List
- `supabase/migrations/20260228000014_fix_ppt_uploads_cascade.sql` (new)
- `app/actions/lessons.ts` (new)
- `components/lessons/DeleteLessonButton.tsx` (new)
- `app/teacher/lessons/page.tsx` (modified)
- `app/teacher/lessons/[lessonId]/page.tsx` (modified)

## Change Log
| Date | Author | Change |
|------|--------|--------|
| 2026-02-27 | @sm (River) | Story criada |
| 2026-02-27 | Dex (@dev) | Implementação completa — todas as tasks [x] |
