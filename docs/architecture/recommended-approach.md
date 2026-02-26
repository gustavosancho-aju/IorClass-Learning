# Abordagem Recomendada: Master Speaking — Evolução do Sistema

**Gerado em:** 26 de Fevereiro de 2026
**Gerado por:** @architect — Aria (Visionária)

---

## Estado Atual vs. Estado Desejado

| Dimensão | Estado Atual | Estado Desejado |
|----------|-------------|-----------------|
| Arquitetura | Single-file HTML monolítico | Multi-arquivo organizado |
| Linguagem | JavaScript puro | JavaScript (manter) ou migrar para TypeScript |
| Build | Nenhum (CDN) | Vite (leve, sem overhead) |
| Deploy | Vercel (estático) | Vercel (manter) |
| Dados | Hard-coded no HTML | Arquivos JSON separados |
| Testes | Zero | Jest/Vitest básico |
| Segurança | API Key exposta | Proxy via Vercel Functions |
| Aulas | 1 completa / 12 planejadas | 12 completas |

---

## Recomendação Primária: Evolução Incremental

> Não quebrar o que funciona. Evoluir o sistema em camadas sem perder o estado atual funcional.

### Fase 1 — Estabilização (Imediato)

**Objetivo:** Corrigir riscos críticos e organizar o código.

1. **Inicializar repositório Git**
   - `git init` + primeiro commit
   - Criar `.gitignore` adequado (já existe via AIOS)

2. **Proteger a API Key da Eleven Labs**
   - Mover para variável de ambiente
   - Criar Vercel Edge Function como proxy
   - Nunca expor no client-side

3. **Limpar arquivos obsoletos**
   - Remover `index-old.html`, `index-backup-*.html`, `index-novo.html`
   - Manter: `index.html`, `index-aula1-completa.html`, `index-simple.html`, `index-debug.html`

4. **Conectar navegação**
   - `index.html` deve linkar para `index-aula1-completa.html`
   - Criar rota clara: Home → Aula 1 → [demais aulas]

### Fase 2 — Estruturação (Curto Prazo)

**Objetivo:** Separar conteúdo de apresentação.

```
iorclass-professional/
├── index.html              # Home/Landing
├── aula.html               # Template único de aula (parametrizado)
├── data/
│   ├── aula-01.json        # Conteúdo da Aula 1
│   ├── aula-02.json        # Conteúdo da Aula 2
│   └── ...
├── js/
│   ├── tts.js              # Serviço TTS (extraído)
│   ├── speech.js           # Reconhecimento de fala (extraído)
│   ├── modules/
│   │   ├── resumo.js       # Módulo 1
│   │   ├── tarefas.js      # Módulo 2
│   │   └── oratorio.js     # Módulo 3
│   └── app.js              # Inicialização
├── css/
│   ├── brand.css           # Design tokens e variáveis
│   ├── components.css      # Componentes visuais
│   └── modules.css         # Estilos por módulo
└── api/
    └── tts.js              # Vercel Edge Function (proxy Eleven Labs)
```

### Fase 3 — Expansão de Conteúdo (Médio Prazo)

**Objetivo:** Completar as 12 aulas.

- Usar `TEMPLATES_AULAS.js` como base
- Criar JSON de conteúdo para Aulas 2–12
- Usar @pm para criar stories por aula
- Usar @dev para implementar cada aula

### Fase 4 — Backend (Longo Prazo, Opcional)

**Objetivo:** Suportar múltiplos alunos com progresso persistente.

```
Opções (por custo/complexidade):
A) Supabase (recomendado) — PostgreSQL + Auth + Row Level Security
B) Firebase — Firestore + Auth (alternativa Google)
C) Manter LocalStorage (se plataforma for mono-usuário)
```

---

## Decisões Arquiteturais

### Build Tool: Vite (Recomendado)

**Rationale:**
- Zero config para projetos estáticos
- Compatível com o Vercel atual
- Permite separar JS em módulos sem CDN
- HMR para desenvolvimento rápido

```bash
npm create vite@latest . -- --template vanilla
```

### Proxy da API (Segurança)

**Rationale:** A API Key da Eleven Labs **não pode** estar no client-side em produção.

```javascript
// api/tts.js (Vercel Edge Function)
export default async function handler(req, res) {
  const { text } = req.body;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVEN_LABS_KEY },
    body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: {...} })
  });
  // ... stream response
}
```

### Separação de Dados

**Rationale:** Permite adicionar novas aulas sem tocar no código.

```json
// data/aula-01.json
{
  "id": 1,
  "title": "Speaker Support",
  "slides": [...],
  "tasks": [...],
  "speaking": [...]
}
```

---

## Próximos Passos Imediatos

| Prioridade | Ação | Agente |
|-----------|------|--------|
| 🔴 1 | Inicializar Git e fazer primeiro commit | `@devops` |
| 🔴 2 | Proteger API Key (criar proxy Vercel) | `@dev` |
| 🟡 3 | Criar story para Fase 1 | `@pm *create-story` |
| 🟡 4 | Conectar index.html → index-aula1-completa.html | `@dev` |
| 🟢 5 | Limpar arquivos de backup obsoletos | `@dev` |
| 🟢 6 | Criar conteúdo Aula 2 | `@dev` |

---

## Avaliação de Risco por Fase

| Fase | Risco | Mitigação |
|------|-------|-----------|
| 1 - Estabilização | Baixo — apenas correções | Git como safety net |
| 2 - Estruturação | Médio — refatoração | Manter cópia funcional durante migração |
| 3 - Expansão | Baixo — adição de conteúdo | Templates padronizados |
| 4 - Backend | Alto — nova infraestrutura | MVP com Supabase Free Tier |

---

*— Aria, arquitetando o futuro 🏗️*
