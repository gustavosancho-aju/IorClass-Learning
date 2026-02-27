# Supabase Setup Guide — Master Speaking LMS

> Guia completo para configurar o banco de dados do zero.

---

## Estrutura de Migrations

```
supabase/
├── migrations/
│   ├── 20260226000001_enums.sql      ← Custom types (user_role, module_type, upload_status)
│   ├── 20260226000002_tables.sql     ← Core tables com constraints + comments
│   ├── 20260226000003_indexes.sql    ← Indexes baseados em access patterns reais
│   ├── 20260226000004_triggers.sql   ← Auto updated_at + auto-create profile on signup
│   ├── 20260226000005_views.sql      ← student_performance aggregation view
│   ├── 20260226000006_rls.sql        ← Row Level Security (todas as tabelas)
│   ├── 20260226000007_storage.sql    ← Bucket ppt-uploads + storage policies
│   └── 20260226000008_rollback.sql   ← Teardown completo (CUIDADO: destrói dados)
└── seed.sql                          ← Demo data para desenvolvimento
```

---

## Setup Passo a Passo

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Anote:
   - **Project URL**: `https://<ref>.supabase.co`
   - **Anon Key**: Settings → API → `anon public`
   - **Service Role Key**: Settings → API → `service_role` (**NUNCA exponha isso no front-end**)

### 2. Configurar variáveis de ambiente

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
ELEVENLABS_API_KEY=<opcional-para-tts>
```

### 3. Executar as Migrations

Acesse **Supabase Dashboard → SQL Editor** e execute **em ordem**:

```
① 20260226000001_enums.sql
② 20260226000002_tables.sql
③ 20260226000003_indexes.sql
④ 20260226000004_triggers.sql
⑤ 20260226000005_views.sql
⑥ 20260226000006_rls.sql
⑦ 20260226000007_storage.sql
```

> **Dica:** Cole o conteúdo de cada arquivo e clique **Run**. Todos são idempotentes (seguros para rodar mais de uma vez).

### 4. Criar contas de teste

Via **Supabase Dashboard → Authentication → Users → Add User**:

| Conta          | Email                      | Senha        | Metadata                         |
|----------------|----------------------------|--------------|----------------------------------|
| Professor      | `teacher@iorclass.dev`     | `Teacher@123`| `{ "role": "teacher", "full_name": "Ana Lima" }` |
| Aluno          | `student@iorclass.dev`     | `Student@123`| `{ "role": "student", "full_name": "João Silva" }` |

> O trigger `handle_new_user()` criará o profile automaticamente após o signup.

### 5. (Opcional) Seed de dados demo

Após criar a conta teacher, execute `seed.sql` no SQL Editor para criar uma aula de demonstração.

---

## Modelo de Dados

```
auth.users (Supabase Auth)
    │
    ▼ (trigger: handle_new_user)
profiles          role: teacher | student
    │
    ▼ (created_by FK)
lessons           is_published: false → draft, true → visible to students
    │
    ├──▶ modules  type: summary | tasks | speaking | content_json: JSONB
    │
    └──▶ scores   UNIQUE(student_id, lesson_id, module_id, module_type)
    │
    └──▶ ppt_uploads  status: processing → completed | error

storage.objects → bucket: ppt-uploads  (private, 50MB, .pptx only)
```

---

## Modelo de Segurança (RLS)

| Tabela        | Student                         | Teacher                              | Service Role     |
|---------------|---------------------------------|--------------------------------------|------------------|
| `profiles`    | SELECT/UPDATE próprio           | SELECT todos, UPDATE próprio         | Tudo             |
| `lessons`     | SELECT publicadas                | CRUD próprias                        | Tudo             |
| `modules`     | SELECT (lições publicadas)      | SELECT todas                         | INSERT/UPDATE/DELETE |
| `scores`      | SELECT/INSERT/UPDATE próprios   | SELECT lições próprias              | Tudo             |
| `ppt_uploads` | —                               | SELECT/INSERT próprios              | UPDATE (status)  |

**Regra crítica:** `SUPABASE_SERVICE_ROLE_KEY` bypassa todo RLS. Use **somente** em:
- `app/api/process-ppt/route.ts` (download + insert modules)
- Nunca exponha no front-end

---

## Verificação Pós-Setup

Execute no SQL Editor para confirmar que tudo está OK:

```sql
-- Verificar tabelas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verificar policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Verificar triggers
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- Verificar bucket de storage
SELECT id, name, public, file_size_limit FROM storage.buckets;

-- Verificar indexes
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Rollback

Para reset completo (⚠️ **destrói todos os dados**):

```sql
-- Execute 20260226000008_rollback.sql no SQL Editor
```

---

*Dara (data-engineer) — arquitetando dados 🗄️*
