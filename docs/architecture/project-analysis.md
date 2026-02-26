# Project Analysis: Master Speaking — Plataforma de Inglês

**Gerado em:** 26 de Fevereiro de 2026
**Gerado por:** @architect — Aria (Visionária)
**Modo:** Comprehensivo / Leitura Completa do Sistema

---

## 1. Visão Geral do Projeto

| Aspecto | Valor |
|---------|-------|
| Nome | Master Speaking |
| Domínio | EdTech — Ensino de Inglês Online |
| Tipo | Brownfield (projeto existente) |
| Arquitetura atual | Static HTML Single-File Application |
| Framework | Vanilla JS + Babel CDN (sem build toolchain) |
| AIOS instalado | v2.1.0 (instalado em 26/02/2026) |
| Deploy | Vercel (configurado) |
| Linguagem primária | JavaScript (100% — sem TypeScript) |
| Testes | Nenhum (0 arquivos de teste) |
| Banco de dados | Nenhum (LocalStorage apenas) |

---

## 2. Inventário de Arquivos

### Arquivos de Aplicação (Raiz)

| Arquivo | Tamanho | Status | Descrição |
|---------|---------|--------|-----------|
| `index.html` | ~21 KB | ✅ Ativo | Home/Landing page — Design Master Speaking completo |
| `index-aula1-completa.html` | ~52 KB | ✅ Ativo (Principal) | Aula 1 — Módulos 1, 2 e 3 completos |
| `index-simple.html` | ~6 KB | ⚠️ Legado | Menu de navegação antigo (stub) |
| `index-debug.html` | ~6 KB | 🔧 Dev | Ferramenta de diagnóstico |
| `index-master-speaking.html` | ~21 KB | 🔄 Duplicata | Cópia do index.html |
| `index-novo.html` | ~15 KB | ⚠️ Legado | Versão intermediária descartada |
| `index-old.html` | ~60 KB | ⚠️ Legado | Versão antiga — código React CDN |
| `index-aula1-completa-backup.html` | ~50 KB | 💾 Backup | Backup da aula 1 |
| `index-backup-old.html` | ~2 KB | 💾 Backup | Backup antigo |
| `index-backup-previous.html` | ~15 KB | 💾 Backup | Backup intermediário |
| `TEMPLATES_AULAS.js` | ~20 KB | 📄 Template | Templates para Aulas 3–12 (não integrados) |

### Configuração e Deploy

| Arquivo | Descrição |
|---------|-----------|
| `vercel.json` | Deploy Vercel — roteia `/` para `index.html` |
| `.vercel/project.json` | ID do projeto: `prj_ueQK3RINvpI4PPQ0FCX66ORBeAFl` |
| `netlify.toml` | Config alternativa para Netlify |
| `.env.local` | Token OIDC do Vercel (auto-gerado) |
| `.gitignore` | Atualizado pelo AIOS |

### Documentação (Raiz — legada)

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documentação técnica geral |
| `COMECE_AQUI.md` | Guia rápido do usuário |
| `STATUS_FINAL.md` | Status do projeto na entrega inicial |
| `RESUMO_PROJETO.md` | Resumo executivo |
| `AULA_01_COMPLETA.txt` | Breakdown de conteúdo — Aula 1 |
| `MODULO_TAREFAS_COMPLETO.md` | Documentação do Módulo 2 |
| `DEPLOY.md` / `DEPLOY_RAPIDO.md` | Guias de deploy |
| `GUIA_DE_USO.md` | Manual do usuário/professor |

---

## 3. Arquitetura da Aplicação

### 3.1 Stack Tecnológico Atual

```
FRONTEND
├── HTML5 Semântico
├── CSS3 (inline — Custom Properties, Flexbox, Grid, Animations)
├── JavaScript ES6+ (Vanilla — sem framework)
│
APIs EXTERNAS
├── Eleven Labs TTS API (Text-to-Speech)
│   ├── Voice ID: RILOU7YmBhvwJGDGjNmP
│   ├── Model: eleven_turbo_v2_5
│   └── ⚠️  API Key exposta no client-side
│
APIs NATIVAS DO NAVEGADOR
├── Web Speech API (SpeechRecognition — reconhecimento de voz)
├── MediaRecorder API (gravação de áudio)
└── LocalStorage API (persistência de progresso)

TIPOGRAFIA
└── Google Fonts — Big Shoulders Display (300–800)

DEPLOY
├── Vercel (configurado e ativo)
└── Netlify (configurado como alternativa)
```

### 3.2 Estrutura do Arquivo Principal (`index-aula1-completa.html`)

```
index-aula1-completa.html (~1.678 linhas)
├── <head>
│   ├── Meta tags + Google Fonts
│   └── CSS inline (~500 linhas)
│       ├── CSS Variables (brand colors)
│       ├── Layout (container, header, card)
│       ├── Module tabs
│       ├── Vocabulary grid
│       ├── Grammar boxes
│       ├── Audio recorder / Waveform
│       ├── Score circle / Metrics
│       ├── Word chips / Fill blanks
│       └── Quiz options
│
├── <body>
│   ├── Header (logo + botão voltar)
│   ├── Module Tabs (Resumo | Tarefas | Oratório)
│   ├── #module-resumo (Módulo 1)
│   ├── #module-tarefas (Módulo 2 — hidden)
│   └── #module-oratorio (Módulo 3 — hidden)
│
└── <script> (~1.100 linhas)
    ├── ELEVEN_LABS_CONFIG (configuração da API)
    ├── TTS Service (speak, playAudio, fallbackSpeak, cache)
    ├── SLIDES[] — 16 slides de conteúdo
    ├── SPEAKING_EXERCISES[] — 6 exercícios de oratório
    ├── TASKS[] — 10 exercícios (fill-in + quiz)
    ├── State management (currentSlide, currentTask, etc.)
    ├── Slide functions (renderSlide, nextSlide, updateSlideUI)
    ├── Module switching (switchModule, completeResumo)
    ├── Speaking functions (renderSpeakingExercise, toggleRecording)
    ├── Audio evaluation (showEvaluation, calculateSimilarity)
    └── Task functions (renderFillTask, renderQuizTask, checkAnswers)
```

---

## 4. Módulos de Aprendizado (Aula 1 — Speaker Support)

### Módulo 1 — Resumo (16 slides)

| # | Tipo | Conteúdo |
|---|------|----------|
| 1 | Cover | Master Speaking — Speaker Support L01 |
| 2 | Vocabulary | Funções no Evento (8 termos + ícones) |
| 3 | Grammar | MAY I...? (estrutura + 5 exemplos) |
| 4 | Grammar | COULD YOU...? (estrutura + 5 exemplos) |
| 5 | Grammar | HOW CAN I...? (estrutura + 5 exemplos) |
| 6 | Practice | Verb TO BE — Past Tense |
| 7 | Numbers | 11–19 (eleven → nineteen) |
| 8 | Numbers | Dezenas e grandes números |
| 9 | Directions | Vocabulário de direções (7 itens) |
| 10 | Q&A | Perguntas frequentes do evento |
| 11 | Sentences | Drop Off |
| 12 | Sentences | Guidance (entrada + backstage) |
| 13 | Sentences | Reassurance |
| 14 | Review | Key Points resumo |
| 15 | Practice Ready | CTA para Oratório |
| 16 | End | Thank You / Conclusão |

### Módulo 2 — Tarefas (10 exercícios)

| # | Tipo | Assunto |
|---|------|---------|
| 1 | Fill-in | May I ___ your ___, please? |
| 2 | Quiz | Tradução "Speaker Support Team" |
| 3 | Fill-in | ___ ___ help you? |
| 4 | Quiz | "110" em inglês |
| 5 | Fill-in | Could you ___ ___ a moment? |
| 6 | Quiz | Frase mais educada |
| 7 | Fill-in | Go ___ and turn ___ |
| 8 | Quiz | Significado de "backstage" |
| 9 | Fill-in | Welcome, I am ___ of the Speaker Support ___ |
| 10 | Quiz | "1.500" em inglês |

### Módulo 3 — Oratório (6 exercícios)

| # | Frase | Dica |
|---|-------|------|
| 1 | Welcome, I am part of the Speaker Support team. | Professional tone |
| 2 | May I see your badge, please? | Rising intonation |
| 3 | Could you follow me, please? | Emphasize "please" |
| 4 | The event is on the eighteenth floor. | Pronounce "eighteenth" |
| 5 | Go straight ahead and turn left at the second corridor. | Moderate pace |
| 6 | Good morning! Welcome to the event... (frase completa) | Natural flow |

---

## 5. Identidade Visual (Brand Master Speaking)

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary-dark` | `#023d52` | Texto principal, botões |
| `--primary-medium` | `#267189` | Gradiente, links |
| `--primary-light` | `#5e96a7` | Gradiente claro |
| `--secondary-brown` | `#69432b` | Texto dourado |
| `--secondary-gold` | `#cea66f` | Detalhes, CTAs |
| `--secondary-beige` | `#f3eee7` | Backgrounds suaves |
| Fonte | Big Shoulders Display | Títulos e corpo |
| Logotipo | 💬 + 🪽 | Ícones da marca |

---

## 6. Integração AIOS (Instalado em 26/02/2026)

### Estrutura `.aios-core/`

```
.aios-core/
├── core/                    # Engine do framework
│   ├── code-intel/          # Análise de código
│   ├── config/              # Gerenciamento de config
│   ├── session/             # Gestão de sessões
│   ├── synapse/             # Context e memória
│   └── orchestration/       # Execução de tarefas
│
├── development/             # Ferramentas de desenvolvimento
│   ├── agents/              # 11 agentes disponíveis
│   │   ├── architect, dev, qa, pm, po, sm
│   │   ├── analyst, data-engineer, devops
│   │   ├── ux, squad-creator
│   │   └── aios-master (orquestrador)
│   ├── tasks/               # ~140 tarefas executáveis
│   ├── workflows/           # Workflows multi-step
│   ├── templates/           # Templates de código
│   └── checklists/          # Checklists de validação
│
├── infrastructure/          # Infra e integrações
│   ├── integrations/        # AI providers, PM adapters
│   ├── scripts/             # IDE sync, LLM routing, git hooks
│   └── tools/               # MCP, CLI, local tools
│
├── data/                    # Tech presets e dados
├── workflow-intelligence/   # Engine de workflows inteligentes
└── core-config.yaml         # Configuração central
```

### Configuração AIOS

| Parâmetro | Valor |
|-----------|-------|
| Tipo de projeto | Brownfield |
| IDE | Claude Code + Codex |
| Perfil do usuário | Advanced |
| MCP | Desabilitado |
| Stories location | `docs/stories/` |
| Architecture docs | `docs/architecture/` |
| PRD location | `docs/prd/` |

---

## 7. Estado Atual do Sistema

### Funcionalidades Completas ✅

- [x] Home page (`index.html`) — design Master Speaking completo
- [x] Aula 1 completa — todos os 3 módulos funcionais
- [x] Integração Eleven Labs TTS com cache
- [x] Web Speech Recognition (reconhecimento de fala)
- [x] Sistema de avaliação de pronúncia (algoritmo Levenshtein simplificado)
- [x] 10 exercícios interativos (fill-in + quiz)
- [x] Deploy Vercel configurado
- [x] AIOS Framework instalado

### Funcionalidades Pendentes ⏳

- [ ] **Navegação Home → Aula 1** (sem link entre os arquivos)
- [ ] **Aulas 2–12** (templates existem em `TEMPLATES_AULAS.js`, sem conteúdo real)
- [ ] **Sistema de progresso persistente** entre aulas (LocalStorage parcial)
- [ ] **TypeScript** (projeto 100% JavaScript)
- [ ] **Testes automatizados** (zero arquivos de teste)
- [ ] **Build toolchain** (Vite, Webpack ou similar)
- [ ] **Backend/API** (dados hard-coded nos HTML)
- [ ] **Sistema de autenticação** (para múltiplos alunos)

### Riscos Críticos ⚠️

| Risco | Severidade | Detalhe |
|-------|-----------|---------|
| API Key exposta | 🔴 CRÍTICO | `sk_14eb9b2e73d...` visível no HTML público |
| Código duplicado | 🟡 ALTO | 10 arquivos HTML (maioria são backups/variações) |
| Sem versionamento Git | 🟡 ALTO | Projeto não tem repositório Git |
| Arquivo único monolítico | 🟡 MÉDIO | 1.678 linhas em um só arquivo |
| Zero testes | 🟡 MÉDIO | Nenhuma cobertura de testes |

---

## 8. Padrões Identificados

### Padrões de Linguagem

| Métrica | Valor |
|---------|-------|
| Arquivos JavaScript | 1 (TEMPLATES_AULAS.js) |
| JavaScript inline (HTML) | ~1.100 linhas |
| TypeScript | 0 arquivos |
| Linguagem primária | JavaScript |

### Padrões de Configuração

| Padrão | Presente |
|--------|---------|
| `.env` / variáveis de ambiente | ✅ (AIOS criou) |
| `.env.example` | ✅ |
| `vercel.json` | ✅ |
| `netlify.toml` | ✅ |
| `package.json` | ❌ (nenhum) |
| `jest.config.js` / testes | ❌ |

### Padrões de Documentação

| Padrão | Status |
|--------|--------|
| README | ✅ presente |
| JSDoc / comentários | ✅ (alguns no código inline) |
| CLAUDE.md | ✅ (AIOS) |
| Architecture docs | ✅ (este arquivo — novo) |

---

## 9. Squad de Agentes Recomendados

Para a evolução do projeto, os seguintes agentes AIOS são relevantes:

| Agente | Papel | Quando usar |
|--------|-------|-------------|
| `@architect` (Aria) | Arquitetura e decisões técnicas | Ao definir estrutura de novas funcionalidades |
| `@dev` | Implementação de código | Ao criar novas aulas, módulos, features |
| `@pm` (Morgan) | Criação de stories e roadmap | Ao planejar próximas funcionalidades |
| `@qa` | Qualidade e testes | Após implementações |
| `@ux-design-expert` | Design e experiência | Melhorias visuais / UX |
| `@data-engineer` | Banco de dados | Ao introduzir backend/persistência |

---

*Gerado por @architect (Aria) — Master Speaking Project Analysis v1.0*
*— Aria, arquitetando o futuro 🏗️*
