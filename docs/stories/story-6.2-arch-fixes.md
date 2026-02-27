# Story 6.2 — Correções Arquiteturais: Middleware JWT + Feedback de Módulos + Rate Limiter Atômico

## Status
Ready for Review

## Story
**As a** sistema Master Speaking LMS,
**I want** to operate with optimized middleware performance, user-visible error feedback on module operations, and race-condition-free rate limiting,
**So that** every page navigation does not incur an unnecessary database roundtrip, teachers see clear feedback when module operations fail, and concurrent API requests cannot bypass the rate limiter.

## Context & Technical Background
> Correções identificadas por Aria (@architect) na revisão arquitetural pós-Story 6.1.
>
> **Três problemas independentes — um ciclo de implementação:**
>
> 1. **[HIGH] Middleware DB query por request** — `middleware.ts` faz `supabase.from('profiles').select('role')` em CADA requisição autenticada. A role já está em `user.user_metadata.role` (campo do JWT retornado por `auth.getUser()`) — sem necessidade de query ao banco.
>
> 2. **[MEDIUM] Silêncio no formulário de módulos** — `teacher/modules/page.tsx` chama `createCourseModule` via Server Action sem exibir toast de sucesso/erro. Se a action falhar, o formulário parece "travar" sem feedback.
>
> 3. **[MEDIUM] Race condition no rate limiter** — `lib/rate-limit.ts` faz SELECT → UPDATE separados. Dois requests simultâneos podem ambos passar pelo SELECT antes do incremento, efetivamente dobrando o limite. Solução: mover a lógica para uma função PostgreSQL atômica via `supabase.rpc()`.

---

## Acceptance Criteria

### Fix 1 — Middleware JWT (HIGH)

- [x] `middleware.ts` **não faz mais** `supabase.from('profiles').select('role')` para usuários autenticados
- [x] A role é lida de `user.user_metadata?.role` (campo JWT, zero DB query)
- [x] Comportamento de redirecionamento idêntico ao atual:
  - Teacher em `/student/**` → redirect `/teacher/dashboard`
  - Student em `/teacher/**` → redirect `/student/dashboard`
  - Qualquer role em `/` → redirect para o dashboard correto
- [x] Usuário sem `user_metadata.role` (edge case) → não redireciona, segue normalmente (sem crash)

**Referência — mudança esperada em `middleware.ts`:**
```typescript
// ANTES (query ao banco):
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()
const role = profile?.role

// DEPOIS (leitura do JWT — sem DB query):
const role = user.user_metadata?.role as 'teacher' | 'student' | undefined
```

---

### Fix 2 — Feedback Visual no Formulário de Módulos (MEDIUM)

- [x] Ao criar um módulo com sucesso → toast verde "Módulo criado com sucesso! 🎉"
- [x] Ao criar um módulo com erro (título inválido, DB error) → toast vermelho com a mensagem de erro retornada pela action
- [x] Ao excluir um módulo com sucesso → toast amarelo "Módulo excluído"
- [x] Ao excluir um módulo com erro → toast vermelho com a mensagem de erro
- [x] Formulário limpa os campos após criação com sucesso
- [x] Durante submit, botão "Criar Módulo" fica desabilitado com estado de loading (spinner)

**Abordagem recomendada:**
- Extrair `<ModuleForm />` como Client Component separado em `components/modules/ModuleForm.tsx`
- Usar `useTransition` + chamar Server Action diretamente
- Usar `react-hot-toast` (já instalado no projeto)
- O `teacher/modules/page.tsx` permanece Server Component, renderiza `<ModuleForm />` e a lista de módulos

**Padrão de referência:** `components/upload/PptDropzone.tsx` usa o mesmo padrão toast + loading state

---

### Fix 3 — Rate Limiter Atômico via PostgreSQL RPC (MEDIUM)

- [x] Nova migration `supabase/migrations/20260228000012_atomic_rate_limit.sql` criada
- [x] Function PostgreSQL `check_and_increment_rate_limit` criada com:
  - Parâmetros: `p_user_id uuid, p_endpoint text, p_max_requests integer, p_window_minutes integer`
  - Retorno: `TABLE (allowed boolean, remaining integer)`
  - Operação atômica: `INSERT ... ON CONFLICT DO UPDATE` (single statement)
  - Reset de janela: quando `window_start < agora - p_window_minutes`, reinicia o contador
  - Bloqueio: quando `request_count >= p_max_requests` **e** janela vigente, não incrementa → retorna `allowed=false, remaining=0`
- [x] `lib/rate-limit.ts` atualizado para usar `supabase.rpc('check_and_increment_rate_limit', {...})` em vez de SELECT + UPDATE separados
- [x] Interface `RateLimitResult` mantida idêntica (`{ allowed: boolean, remaining: number }`)
- [x] Endpoints TTS (20/min) e process-ppt (5/hora) funcionam corretamente com a nova implementação
- [x] `npm run build` e `npm run lint` passam sem erros

**Spec da função SQL:**
```sql
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id       uuid,
  p_endpoint      text,
  p_max_requests  integer,
  p_window_minutes integer
) RETURNS TABLE (allowed boolean, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
-- Atomic INSERT ON CONFLICT logic:
-- • Window expired → reset counter to 1, return allowed=true
-- • Count < max    → increment atomically, return allowed=true
-- • Count >= max   → no update, return allowed=false
$$;
```

---

## Tasks

- [x] 1. Corrigir `middleware.ts` — substituir query profiles por `user.user_metadata.role`
- [x] 2. Criar `components/modules/ModuleForm.tsx` — Client Component com toast + loading state
- [x] 3. Atualizar `app/teacher/modules/page.tsx` — usar `<ModuleForm>` e manter lista como Server Component
- [x] 4. Criar `supabase/migrations/20260228000012_atomic_rate_limit.sql` — função PostgreSQL atômica
- [x] 5. Atualizar `lib/rate-limit.ts` — usar `supabase.rpc('check_and_increment_rate_limit')`
- [x] 6. Rodar `npm run build` + `npm run lint` — zero erros

## Dev Agent Record
- **Agent:** Dex (@dev)
- **Model:** claude-sonnet-4-5
- **Started:** 2026-02-27
- **Completed:** 2026-02-27
- **Debug log:** TypeScript error on `supabase.rpc('check_and_increment_rate_limit')` — `Database.Functions` was `[_ in never]: never`. Fixed by adding function signature to `lib/supabase/types.ts`.
- **Notes:** Added `components/modules/DeleteModuleButton.tsx` (bonus, not in original task list) to fully complete Fix 2 — the delete button also needed a Client Component for toast feedback. All 6 tasks complete, build passes clean.

## File List
- `middleware.ts` (modified — Fix 1)
- `components/modules/ModuleForm.tsx` (new — Fix 2)
- `components/modules/DeleteModuleButton.tsx` (new — Fix 2, bonus)
- `app/teacher/modules/page.tsx` (modified — Fix 2, usa novos componentes)
- `supabase/migrations/20260228000012_atomic_rate_limit.sql` (new — Fix 3)
- `lib/rate-limit.ts` (modified — Fix 3)
- `lib/supabase/types.ts` (modified — adicionado tipo `check_and_increment_rate_limit` em `Functions`)

## Technical Notes

### Fix 1 — Por que `user_metadata.role`?
O Supabase inclui `raw_user_meta_data` do registro `auth.users` no payload JWT retornado por `auth.getUser()`. O campo `user_metadata.role` é definido no momento do cadastro (`auth.signUp({ options: { data: { role: 'teacher' } } })`). É o mesmo valor usado pelos RLS policies (`auth.jwt() -> 'user_metadata' ->> 'role'`) — consistente e sem roundtrip ao banco.

### Fix 2 — Por que Client Component separado?
`teacher/modules/page.tsx` é um Server Component. Server Components não podem usar `useState` ou `react-hot-toast`. Extrair apenas o formulário como Client Component mantém o restante da página como Server Component (lista de módulos renderizada no servidor — sem estado desnecessário no cliente).

### Fix 3 — Por que função PostgreSQL?
O problema do SELECT→UPDATE separados é que são duas transações independentes. Uma função PL/pgSQL com `INSERT ON CONFLICT DO UPDATE ... WHERE` garante atomicidade dentro de uma única transação PostgreSQL. A cláusula `WHERE` no `DO UPDATE` impede o incremento quando o limite já foi atingido, e o `RETURNING` permite saber se o update aconteceu ou não.

### Relação com Story 4.4
A Story 4.4 criou a tabela `rate_limits` e o mecanismo básico. Esta story apenas substitui a implementação da função `checkRateLimit` em TypeScript por uma implementação atômica na camada PostgreSQL. A tabela e os limites configurados (TTS: 20/min, process-ppt: 5/hora) não mudam.
