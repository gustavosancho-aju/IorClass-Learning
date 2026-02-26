# Wave 3 — Architecture Handoff
**Master Speaking LMS** | Autor: Aria (@architect) | Data: 2026-02-26

---

## 1. Contexto — O que foi construído

### Stack atual (Wave 1 + 2 + 2.5)
```
Next.js 14 (App Router)
├── Runtime Misto
│   ├── Edge:    /api/tts          (ElevenLabs proxy — latência mínima)
│   └── Node.js: /api/process-ppt  (JSZip + Buffer — sem edge compat)
│
Supabase
├── Auth:    JWT, email+senha, magic link
├── DB:      5 tabelas + 1 view + 3 enums + 4 triggers
├── Storage: bucket ppt-uploads (privado, 50MB)
└── RLS:     JWT claims (auth.jwt() -> 'user_metadata' ->> 'role')
│
Vercel Production: https://master-speaking-lms.vercel.app
GitHub:            wave1-pr → main (PR #2 aberto)
```

### Dependências externas instaladas
| Serviço | Uso | Key no .env |
|---|---|---|
| ElevenLabs | TTS (áudio do resumo) | `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` |
| Anthropic Claude | Geração de módulos (PPT→JSON) | Dentro de `lib/content-generator.ts` |
| Supabase | Auth + DB + Storage | `NEXT_PUBLIC_SUPABASE_URL` + anon + service role |

> **Nota:** Nenhum SDK de STT instalado ainda. `package.json` não tem `openai`, `deepgram`, `assemblyai`. Wave 3 precisa adicionar.

---

## 2. GAP Analysis — Rotas 404 existentes AGORA

> Estas rotas estão no sidebar mas **não têm `page.tsx`** → quebram ao clicar.

### Teacher (4 rotas ausentes)
| Rota | Sidebar label | Prioridade Wave 3 |
|---|---|---|
| `/teacher/lessons` | Aulas (lista) | 🔴 Alta |
| `/teacher/students` | Alunos | 🟡 Média |
| `/teacher/analytics` | Analytics | 🟡 Média |
| `/teacher/settings` | Configurações | 🟢 Baixa |

### Student (1 rota ausente)
| Rota | Sidebar label | Prioridade Wave 3 |
|---|---|---|
| `/student/settings` | Configurações | 🟢 Baixa |

---

## 3. Feature Central da Wave 3 — Módulo Oratório

### Estado atual
`OratorioTab.tsx` tem um botão `<Mic>` **disabled** com badge "Em breve". O componente exibe:
- Prompt de fala (ex: "Fale sobre este slide.")
- Frase-alvo (ex: "Public speaking is an important skill.")
- **Zero funcionalidade de gravação ou pontuação**

### Arquitetura proposta — Speech Evaluation Pipeline

```
Browser                    Next.js Edge/Node              External
───────                    ─────────────────              ────────
[Mic Button]
    │ MediaRecorder API
    │ (WebM/Opus blob)
    ▼
[AudioBlob ~30s]
    │ POST multipart/form-data
    ▼
/api/speech-eval ──────────────────────────────► OpenAI Whisper API
    │                                              (transcription)
    │◄──────────────────────── { text: "..." } ──
    │
    │ Compare text vs target_phrase
    │ (similarity score 0-100)
    │
    │ Optional: POST to Claude ──────────────────► Anthropic API
    │                                              (pronunciation tips)
    │◄──────────────────────── { feedback } ──
    │
    ▼
{ score, transcript, feedback }
    │
    ▼
Supabase scores table
(student_id, lesson_id, module_id, module_type='speaking', score)
    │
    ▼
[Result UI in OratorioTab]
```

### Decisão de STT: Whisper vs Web Speech API

| Critério | OpenAI Whisper | Web Speech API |
|---|---|---|
| Custo | $0.006/min (~$0 nos primeiros usos) | **Grátis** |
| Precisão | Alta (multilíngue) | Média (varia por browser) |
| Suporte a PT-BR | ✅ Excelente | ✅ OK |
| Offline | ❌ Precisa de API | ✅ Funciona |
| Server-side | ✅ Privado, controlado | ❌ Client-only |
| Dependência nova | `npm install openai` | Nenhuma |
| Setup | `OPENAI_API_KEY` no Vercel | Zero |

**Recomendação:** **Fase 3.1** — Web Speech API (zero custo, zero setup, entrega rápida). **Fase 3.2** — migrar para Whisper para precisão em inglês profissional.

---

## 4. Plano de Stories — Wave 3

### Story 3.1 — Oratório: Gravação via Web Speech API ⭐ CRÍTICA
**Agente:** `@dev`
**Complexidade:** Média (3-4h)

**Acceptance Criteria:**
- [ ] `OratorioTab` tem botão Mic funcional (não disabled)
- [ ] Ao clicar: microfone ativa, timer countdown 30s
- [ ] Web Speech API (`window.SpeechRecognition`) captura áudio em EN-US
- [ ] Transcrição exibida ao usuário em tempo real
- [ ] Score calculado: similaridade entre transcript e `target_phrase` (0–100)
- [ ] POST `PATCH /api/scores` salva score no banco (module_type='speaking')
- [ ] Feedback visual: badge de score + texto motivacional
- [ ] Graceful degradation: se browser não suportar, mensagem clara

**Novo endpoint necessário:**
```typescript
// POST /api/scores
// Body: { student_id, lesson_id, module_id, module_type, score }
// Auth: user session (anon client)
// RLS: scores: students insert own (já existe!)
```

**Arquivo a modificar:**
- `app/student/lessons/[lessonId]/tabs/OratorioTab.tsx` — implementar gravação
- **Nenhum novo backend** necessário se usar Web Speech API (tudo client-side)

---

### Story 3.2 — Teacher: Lista de Aulas (`/teacher/lessons`) ⭐ CRÍTICA
**Agente:** `@dev`
**Complexidade:** Baixa (1-2h)

**Acceptance Criteria:**
- [ ] Rota `/teacher/lessons/page.tsx` criada
- [ ] Lista todas as lições do professor (filtrado por `created_by = user.id`)
- [ ] Cada card mostra: título, emoji, status (publicada/rascunho), qtd de módulos
- [ ] Botão "Nova Aula" (abre modal ou rota `/teacher/lessons/new`)
- [ ] Botão "Ver/Editar" → `/teacher/lessons/[id]` (já existe)
- [ ] Botão toggle publicar/despublicar inline

**Queries necessárias:**
```typescript
supabase
  .from('lessons')
  .select('*, modules(count)')
  .eq('created_by', user.id)
  .order('order_index')
```

---

### Story 3.3 — Teacher: Painel de Alunos (`/teacher/students`)
**Agente:** `@dev`
**Complexidade:** Média (2-3h)

**Acceptance Criteria:**
- [ ] Rota `/teacher/students/page.tsx` criada
- [ ] Lista todos os alunos (`profiles` WHERE role='student')
- [ ] Para cada aluno: nome, e-mail, média geral, última atividade
- [ ] Usa a view `student_performance` (já criada no Supabase!)
- [ ] Click no aluno → drawer/modal com progresso por aula

**Query já pronta no banco:**
```sql
-- View: public.student_performance (criada na migration 005)
SELECT student_id, student_name, lesson_id, lesson_title,
       avg_score, modules_completed, last_activity
FROM public.student_performance;
```

---

### Story 3.4 — Teacher: Analytics Dashboard (`/teacher/analytics`)
**Agente:** `@dev`
**Complexidade:** Média (2-3h)

**Acceptance Criteria:**
- [ ] Rota `/teacher/analytics/page.tsx` criada
- [ ] Métricas: total alunos, média da turma, módulo com mais dificuldade
- [ ] Gráfico de barras: média por aula (sem biblioteca extra, CSS puro)
- [ ] Tabela: top 5 alunos + bottom 5 alunos por score
- [ ] Filtro de período: última semana / mês / todo período

---

### Story 3.5 — Settings Pages (teacher + student)
**Agente:** `@dev`
**Complexidade:** Baixa (1-2h)

**Acceptance Criteria:**
- [ ] `/teacher/settings` e `/student/settings` criados
- [ ] Form: editar `full_name` e `avatar_url` no profile
- [ ] Botão "Salvar" → PATCH via Server Action → atualiza profiles table
- [ ] Toast de sucesso/erro

---

### Story 3.6 — Oratório: Upgrade para Whisper (opcional)
**Agente:** `@dev`
**Complexidade:** Alta (4-6h)
**Bloqueado por:** Story 3.1 concluída + decisão de adicionar custo OpenAI

**O que muda:**
- Adicionar `openai` ao `package.json`
- Novo endpoint `/api/speech-eval` (Node.js runtime, processa áudio)
- OratorioTab envia blob de áudio → servidor → Whisper → score
- OPENAI_API_KEY no Vercel

---

## 5. Diagrama de Rotas Completas (pós Wave 3)

```
/
├── /login                          ✅ Wave 1
├── /auth/callback                  ✅ Wave 1
│
├── /teacher/
│   ├── dashboard                   ✅ Wave 1
│   ├── upload                      ✅ Wave 2
│   ├── lessons/                    🔴 Story 3.2 (lista)
│   │   └── [lessonId]/             ✅ Wave 2 (detalhe)
│   ├── students/                   🔴 Story 3.3
│   ├── analytics/                  🟡 Story 3.4
│   └── settings/                   🟢 Story 3.5
│
├── /student/
│   ├── dashboard                   ✅ Wave 1/2
│   ├── lessons/                    ✅ Wave 2
│   │   └── [lessonId]/             ✅ Wave 2
│   │       ├── Resumo tab          ✅ Wave 2
│   │       ├── Tarefas tab         ✅ Wave 2
│   │       └── Oratório tab        🔴 Story 3.1 (gravação)
│   ├── progress/                   ✅ Wave 2.5 fix (hoje)
│   └── settings/                   🟢 Story 3.5
│
└── /api/
    ├── tts                         ✅ Wave 2 (Edge)
    ├── process-ppt                 ✅ Wave 2 (Node.js)
    └── speech-eval                 🔴 Story 3.6 (opcional, Whisper)
```

---

## 6. Contratos de API — Novos endpoints Wave 3

### POST /api/scores (Story 3.1)
> Alternativa: chamar Supabase diretamente do client com anon key + RLS

```typescript
// Se usar Server Action (recomendado para validação)
// app/actions/scores.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function saveScore(payload: {
  lesson_id:   string
  module_id:   string
  module_type: 'summary' | 'tasks' | 'speaking'
  score:       number  // 0-100
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  return supabase.from('scores').upsert({
    student_id: user.id,
    ...payload
  }, { onConflict: 'student_id,lesson_id,module_id' })
}
```

### Score Similarity Algorithm (Story 3.1)
```typescript
// lib/speech-score.ts
export function scoreSpeech(transcript: string, targetPhrase: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const t = normalize(transcript)
  const p = normalize(targetPhrase)

  const targetWords   = p.split(/\s+/)
  const spokenWords   = new Set(t.split(/\s+/))
  const matchedWords  = targetWords.filter(w => spokenWords.has(w))

  return Math.round((matchedWords.length / targetWords.length) * 100)
}
```

---

## 7. Dados — Sem migrações novas necessárias

A Wave 3 **não precisa de migrações de banco**. O esquema atual suporta todas as features:

| Feature | Tabela/View | Já existe? |
|---|---|---|
| Scores de Oratório | `scores` (module_type='speaking') | ✅ |
| Lista de alunos | `profiles` WHERE role='student' | ✅ |
| Analytics turma | `student_performance` view | ✅ |
| Editar perfil | `profiles` (UPDATE próprio) | ✅ |
| Lista aulas do prof | `lessons` WHERE created_by | ✅ |

> @data-engineer **não é necessário** na Wave 3.

---

## 8. Variáveis de Ambiente — Novas (se Story 3.6)

| Variável | Serviço | Obrigatória? |
|---|---|---|
| `OPENAI_API_KEY` | Whisper STT | Apenas Story 3.6 |

Todas as outras variáveis já estão configuradas no Vercel.

---

## 9. Sequência de Execução Recomendada

```
Semana 1 (crítico — remove 404s):
  @dev → Story 3.1 (Oratório Web Speech) + Story 3.2 (Teacher Lessons)

Semana 2 (completa o professor):
  @dev → Story 3.3 (Students) + Story 3.4 (Analytics)

Semana 3 (polish):
  @dev → Story 3.5 (Settings) + merge PR #2 → main
  @devops → novo PR wave3-pr
```

---

## 10. Decisões Arquiteturais Registradas

| # | Decisão | Alternativa rejeitada | Motivo |
|---|---|---|---|
| ADR-01 | Web Speech API para STT (3.1) | Whisper imediato | Zero custo, zero config, entrega em horas |
| ADR-02 | Server Action para scores | Novo API route | Menos boilerplate, validação server-side nativa |
| ADR-03 | CSS puro para gráficos (analytics) | Recharts/Chart.js | Sem dependência nova, LMS leve |
| ADR-04 | View `student_performance` para analytics | Query ad-hoc | View já criada na Wave 2.5, reutilizar |
| ADR-05 | RLS JWT claims para todas as policies | Profile subquery | Recursão infinita resolvida, mais rápido |

---

*— Aria, arquitetando o futuro 🏗️*

**Próximo agente:** `@dev` para Story 3.1 (Oratório) ou `@sm` para criar as stories formais.
