# Story 8.1 — Aluno: Auto-Cadastro via Página de Registro (AUTH-01)

## Status
Ready for Review

## Story
**As a** visitante (futuro aluno) do Master Speaking LMS,
**I want** to create my own account from the signup page,
**So that** I can start using the platform without depending on the teacher to register me manually.

## Context & Technical Background

> **Motivação:** Atualmente só existe a rota `/login`. Alunos não conseguem se registrar por conta própria — dependem do professor cadastrá-los manualmente. Isso cria fricção desnecessária no onboarding e bloqueia o crescimento orgânico da plataforma.
>
> **Boa notícia — infraestrutura já está pronta:**
> - O trigger `handle_new_user()` (migration 004) já cria automaticamente a linha em `public.profiles` ao registrar um usuário em `auth.users`
> - O campo `role` é lido de `raw_user_meta_data->>'role'` com **default `'student'`** se omitido
> - A rota `/auth/callback` já existe e trata o código de confirmação pós-e-mail
> - O layout `app/(auth)/layout.tsx` já aplica o background gradiente — o signup herda automaticamente
>
> **O que falta:** apenas a página `/signup` + adicionar `/signup` nas rotas públicas do middleware.
>
> **Padrão a seguir:** `app/(auth)/login/page.tsx` — mesma estrutura visual, mesmo `createBrowserClient`, mesmo glass card.
>
> **Fluxo completo esperado:**
> 1. Aluno acessa `/signup`
> 2. Preenche nome, e-mail, senha, confirmar senha
> 3. `supabase.auth.signUp({ email, password, options: { data: { role: 'student', full_name: name } } })`
> 4. Supabase envia e-mail de confirmação
> 5. Aluno clica no link → `/auth/callback?code=...`
> 6. Callback troca code por sessão → redireciona para `/`
> 7. Middleware lê `user.user_metadata.role === 'student'` → `/student/dashboard`

---

## Acceptance Criteria

### Middleware — Rota Pública
- [ ] `middleware.ts`: `/signup` adicionado ao array `publicRoutes`
- [ ] Usuário não autenticado consegue acessar `/signup` sem ser redirecionado para `/login`
- [ ] Usuário já autenticado que tenta acessar `/signup` é redirecionado para `/` (mesmo comportamento do `/login`)

---

### Página `/signup`
- [ ] Arquivo criado em `app/(auth)/signup/page.tsx` como **Client Component** (`'use client'`)
- [ ] Layout visual idêntico ao `/login`: glass card `ms-glass`, fundo via `AuthLayout`, logo Master Speaking com emojis 💬🪽
- [ ] Campos do formulário:
  - `full_name` (text, required, placeholder: "Seu nome completo")
  - `email` (email, required, placeholder: "seu@email.com")
  - `password` (password, required, placeholder: "••••••••", mínimo 6 caracteres)
  - `confirm_password` (password, required, placeholder: "••••••••")
- [ ] Botão toggle show/hide senha em ambos os campos de senha (`Eye`/`EyeOff` Lucide)
- [ ] Validação client-side antes de chamar a API:
  - Senha deve ter mínimo 6 caracteres
  - `password !== confirm_password` → exibe erro "As senhas não coincidem."
- [ ] Ao submeter: chama `supabase.auth.signUp({ email, password, options: { data: { role: 'student', full_name } } })`
- [ ] Estado de loading: botão desabilitado com spinner `Loader2` enquanto aguarda
- [ ] **Sucesso:** exibe tela de confirmação (sem redirecionar):
  > 📧 *"Conta criada! Enviamos um e-mail de confirmação para [email]. Clique no link para ativar sua conta e fazer login."*
- [ ] **Erro da API:** exibe mensagem de erro traduzida no card:
  - `User already registered` → "Este e-mail já está cadastrado."
  - Outros erros → "Erro ao criar conta. Tente novamente."
- [ ] Link "Já tem conta? **Entrar**" que aponta para `/login` (abaixo do formulário)

---

### Login Page — Link de Cadastro
- [ ] `app/(auth)/login/page.tsx` inclui link "Não tem conta? **Cadastre-se**" apontando para `/signup`
- [ ] Link posicionado abaixo do card, com mesmo estilo do footer (texto `text-white/40`)

---

### Integração com Banco
- [ ] Após clicar no link de confirmação e autenticar, `public.profiles` contém registro com:
  - `role = 'student'` (via trigger `handle_new_user()` — lê de `raw_user_meta_data`)
  - `full_name` preenchido com o nome informado no cadastro
  - `email` preenchido corretamente
- [ ] **Nenhuma migration nova necessária** — o trigger já trata o cadastro automaticamente

---

### Build & Qualidade
- [ ] `npm run build` passa sem erros TypeScript
- [ ] `npm run lint` passa sem novos warnings

---

## Technical Notes

### Arquivos a criar
```
app/(auth)/signup/page.tsx    → Página de cadastro (Client Component)
```

### Arquivos a modificar
```
middleware.ts                            → adicionar '/signup' ao array publicRoutes
app/(auth)/login/page.tsx               → adicionar link "Cadastre-se" → /signup
```

### Trigger existente — não precisa alterar
```sql
-- Migration 004: handle_new_user()
-- Lê role de raw_user_meta_data->>'role', default: 'student'
-- Lê full_name de raw_user_meta_data->>'full_name'
-- Chamado automaticamente no INSERT em auth.users (via Supabase signUp)
INSERT INTO public.profiles (id, email, role, full_name)
VALUES (NEW.id, NEW.email, COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'), NEW.raw_user_meta_data->>'full_name')
ON CONFLICT (id) DO NOTHING;
```

### Chamada correta de signUp no cliente
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: 'student',      // Lido pelo trigger — define profiles.role
      full_name: fullName,  // Lido pelo trigger — define profiles.full_name
    },
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

### Padrão de referência no codebase
| O que referenciar | Onde está |
|-------------------|-----------|
| Estrutura visual do card de auth | `app/(auth)/login/page.tsx` |
| Layout de fundo gradiente | `app/(auth)/layout.tsx` — herdado automaticamente |
| Callback de confirmação de e-mail | `app/auth/callback/route.ts` — já funciona |
| Proteção de rotas públicas | `middleware.ts` → array `publicRoutes` |
| Ícones de senha | `Eye`, `EyeOff`, `Loader2` de `lucide-react` — já instalados |

### Não fazer (fora de escopo desta story)
- ❌ Cadastro de professor (apenas aluno nesta story)
- ❌ OAuth / login social (Google, GitHub, etc.)
- ❌ Validação de e-mail corporativo / domínio
- ❌ Onboarding pós-cadastro (tutorial, tour)
- ❌ Reenvio manual de e-mail de confirmação
- ❌ Política de senha customizada (além de mín. 6 chars — Supabase aplica a sua própria)
- ❌ Admin aprovando cadastros antes de ativar

---

## Tasks

- [x] 1. Modificar `middleware.ts` — adicionar `'/signup'` ao array `publicRoutes` (linha 30)
- [x] 2. Criar `app/(auth)/signup/page.tsx` — formulário com nome, e-mail, senha, confirmar senha + validações client-side
- [x] 3. Implementar chamada `supabase.auth.signUp()` com `data: { role: 'student', full_name }` + tela de confirmação pós-sucesso
- [x] 4. Adicionar link "Cadastre-se" na `app/(auth)/login/page.tsx` apontando para `/signup`
- [x] 5. Rodar `npm run build` + `npm run lint` e confirmar zero erros

---

## Dev Agent Record
- **Agent:** Dex (@dev)
- **Model:** claude-sonnet-4-6
- **Started:** 2026-02-27
- **Completed:** 2026-02-27
- **Debug log:** Nenhum problema encontrado. Build e lint passaram com zero erros novos (apenas 3 warnings pré-existentes mantidos).
- **Notes:** Middleware atualizado para redirecionar usuário autenticado que tenta acessar `/signup` (mesmo comportamento do `/login`). Signup page usa `confirmed` state para exibir tela de confirmação sem redirecionar — aguarda o aluno clicar no link do e-mail. O trigger `handle_new_user()` já existente cuida de criar o `profiles` com `role: 'student'` automaticamente — nenhuma migration necessária. `Link` do Next.js importado em `login/page.tsx` para o botão "Cadastre-se".

## File List
- `app/(auth)/signup/page.tsx` (new)
- `middleware.ts` (modified)
- `app/(auth)/login/page.tsx` (modified)

## Change Log
| Date | Author | Change |
|------|--------|--------|
| 2026-02-27 | @sm (River) | Story criada |
| 2026-02-27 | Dex (@dev) | Implementação completa — todas as tasks [x] |
