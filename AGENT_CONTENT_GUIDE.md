# Agent Content Guide — DeutschTutor Pro

> **Audience:** Qualquer IA (Claude, GPT, Gemini, Grok, DeepSeek, ou futura)
> que precise criar conteúdo, contribuir código, ou entender esta aplicação.
>
> **Última atualização:** Março 2026
>
> Este documento é o ponto de entrada único. Leia-o inteiro antes de fazer qualquer coisa.

---

## Índice

1. [O que é esta aplicação](#1-o-que-é-esta-aplicação)
2. [Stack técnica](#2-stack-técnica)
3. [Arquitetura de arquivos](#3-arquitetura-de-arquivos)
4. [Tipos de conteúdo](#4-tipos-de-conteúdo)
5. [Como criar novos Scenarios (Sprechen)](#5-como-criar-novos-scenarios-sprechen)
6. [Como criar novos Schreiben Tasks](#6-como-criar-novos-schreiben-tasks)
7. [Como criar novos Grammar Topics](#7-como-criar-novos-grammar-topics)
8. [Schema do banco de dados](#8-schema-do-banco-de-dados)
9. [API Routes — Mapa completo](#9-api-routes--mapa-completo)
10. [Sistema de IA — Como funciona](#10-sistema-de-ia--como-funciona)
11. [Contratos JSON — O que a IA deve retornar](#11-contratos-json--o-que-a-ia-deve-retornar)
12. [Prompts — Os system prompts exatos](#12-prompts--os-system-prompts-exatos)
13. [Sistema de revisão (SRS/FSRS)](#13-sistema-de-revisão-srsfsrs)
14. [Regras pedagógicas](#14-regras-pedagógicas)
15. [Multi-Provider — Arquitetura futura](#15-multi-provider--arquitetura-futura)
16. [Atribuição — Quem criou o quê](#16-atribuição--quem-criou-o-quê)
17. [Como contribuir — Checklist](#17-como-contribuir--checklist)
18. [Deploy e infraestrutura](#18-deploy-e-infraestrutura)

---

## 1. O que é esta aplicação

**DeutschTutor Pro** é um tutor pessoal de alemão voltado para a preparação do exame **Goethe B1**.
O estudante é um **médico brasileiro** que vai trabalhar na Alemanha.

A app oferece 5 modos de aprendizado:

| Modo | O que faz | IA necessária? |
|------|-----------|----------------|
| **Sprechen** (Conversação) | Chat ao vivo com IA simulando cenários do exame B1 | Sim |
| **Schreiben** (Escrita) | Escrever e-mails avaliados pelos critérios oficiais Goethe | Sim |
| **Grammatik** (Gramática) | Aulas interativas com exercícios progressivos | Sim |
| **Wortschatz** (Vocabulário) | Exercícios de produção ativa (recall, não reconhecimento) | Sim |
| **Review** (Revisão SRS) | Flashcards com FSRS v4 para repetição espaçada | Não |

Todos os modos de IA retornam **JSON estruturado** — não texto livre.
Isso é fundamental: qualquer IA que responda deve retornar JSON válido nos formatos especificados.

---

## 2. Stack técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | Node.js | 20.x |
| Linguagem | TypeScript | 5.x |
| Banco de dados | SQLite via better-sqlite3 + Drizzle ORM | — |
| IA (atual) | Anthropic Claude (SDK direto) | claude-sonnet-4-20250514 |
| Revisão | FSRS v4 (implementação local) | — |
| UI | React 19 + shadcn/ui + Tailwind CSS | — |
| Deploy | Docker + Nginx reverse proxy + Cloudflare | — |
| Auth | JWT (jose) + scrypt password hashing | — |

**basePath:** A app roda em `/tutor` (configurado via `NEXT_PUBLIC_BASE_PATH`).
Todos os `fetch()` no frontend usam `apiUrl()` de `src/lib/api.ts` para prefixar o basePath.

---

## 3. Arquitetura de arquivos

```
src/
├── app/                          ← Páginas Next.js (App Router)
│   ├── page.tsx                  ← Dashboard / Home
│   ├── login/page.tsx            ← Login
│   ├── chat/
│   │   ├── page.tsx              ← Seletor de cenários
│   │   └── session/page.tsx      ← Chat ao vivo
│   ├── schreiben/
│   │   ├── page.tsx              ← Seletor de tarefas
│   │   └── [taskId]/page.tsx     ← Editor + avaliação
│   ├── grammatik/
│   │   ├── page.tsx              ← Seletor de tópicos
│   │   └── [topicId]/page.tsx    ← Aula interativa
│   ├── wortschatz/
│   │   ├── page.tsx              ← Exercícios de vocabulário
│   │   └── review/page.tsx       ← Flashcards SRS
│   ├── fehlertagebuch/page.tsx   ← Diário de erros
│   ├── fortschritt/page.tsx      ← Dashboard de progresso
│   ├── einstellungen/page.tsx    ← Configurações / Export
│   └── api/                      ← API Routes
│       ├── auth/route.ts         ← Login/logout
│       ├── chat/route.ts         ← Chat com IA
│       ├── analyze/route.ts      ← Análise de mensagem
│       ├── schreiben/route.ts    ← Avaliação de escrita
│       ├── grammatik/route.ts    ← Gerador de aulas
│       ├── vocab/route.ts        ← Exercícios de vocabulário
│       ├── errors/route.ts       ← CRUD de erros
│       ├── persist/route.ts      ← Persistência unificada
│       ├── review/route.ts       ← Fila de revisão SRS
│       ├── stats/route.ts        ← Estatísticas
│       └── export/route.ts       ← Exportação de dados
├── components/
│   ├── ui/                       ← shadcn/ui primitives
│   └── chat/                     ← ChatMessage, ChatInput, AnalysisPanel
├── lib/
│   ├── api.ts                    ← apiUrl() helper para basePath
│   ├── auth.ts                   ← JWT + password hashing
│   ├── rate-limit.ts             ← Token bucket rate limiter
│   ├── scenarios.ts              ← ★ 12 cenários de conversação
│   ├── schreiben-tasks.ts        ← ★ 6 tarefas de escrita
│   ├── grammar-topics.ts         ← ★ 10 tópicos de gramática
│   ├── ai/
│   │   ├── client.ts             ← Anthropic SDK + MODEL constants
│   │   ├── prompts.ts            ← ★ 5 system prompts + interfaces TypeScript
│   │   ├── parsers.ts            ← safeParseJSON + response type interfaces
│   │   └── analyze.ts            ← analyzeMessage() function
│   ├── db/
│   │   ├── index.ts              ← Database connection
│   │   └── schema.ts             ← ★ 7 tabelas Drizzle ORM
│   └── srs/
│       └── fsrs.ts               ← FSRS v4 algorithm
└── middleware.ts                 ← Auth middleware (protege todas as rotas)
```

Os arquivos marcados com ★ são os mais importantes para contribuição.

---

## 4. Tipos de conteúdo

O conteúdo fica em **arrays TypeScript estáticos** — não no banco de dados, não em JSON, não em markdown.
Cada tipo tem uma interface definida em `src/lib/ai/prompts.ts`.

### Conteúdo existente (março 2026)

| Tipo | Arquivo | Quantidade | IDs existentes |
|------|---------|------------|----------------|
| Scenario (Sprechen) | `src/lib/scenarios.ts` | 12 | `geburtstag-planen`, `ausflug-planen`, `praesentation-gesundheit`, `beim-arzt`, `wohnungssuche`, `beschwerde`, `vorstellungsgespraech`, `restaurant`, `reiseplanung`, `meinung`, `medizinisch`, `frei` |
| SchreibenTask | `src/lib/schreiben-tasks.ts` | 6 | `einladung`, `beschwerde-internet`, `urlaub-empfehlung`, `sprachkurs`, `reparatur`, `neue-arbeit` |
| GrammarTopic | `src/lib/grammar-topics.ts` | 10 | `perfekt-praeteritum`, `konjunktiv-ii`, `nebensaetze`, `relativsaetze`, `passiv`, `praepositionen`, `reflexive-verben`, `indirekte-rede`, `adjektivdeklination`, `konnektoren` |

---

## 5. Como criar novos Scenarios (Sprechen)

### Interface TypeScript

```typescript
interface Scenario {
  id: string;            // kebab-case, único, ex: "telefongespraech-bank"
  title: string;         // Título em alemão, ex: "Telefongespräch mit der Bank"
  description: string;   // Descrição curta em PT-BR, ex: "Ligue para o banco"
  icon: string;          // Emoji único, ex: "🏦"
  examPart: string;      // Uma das categorias abaixo
  prompt: string;        // System prompt em ALEMÃO para a IA — ver regras abaixo
  suggestedVocab?: string[]; // 3-5 palavras-chave em alemão (opcional)
}
```

### Categorias válidas para `examPart`

| Valor | Descrição |
|-------|-----------|
| `"Sprechen Teil 1"` | Goethe B1 Teil 1: Gemeinsam etwas planen |
| `"Sprechen Teil 2"` | Goethe B1 Teil 2: Ein Thema präsentieren |
| `"Alltagssituation"` | Situações do dia a dia |
| `"Diskussion"` | Debates e opiniões |
| `"Fachsprache"` | Vocabulário médico/profissional |
| `"Frei"` | Conversa livre |

### Exemplo real (copie e adapte)

```typescript
{
  id: "beim-arzt",
  title: "Beim Arzt",
  description: "Consulta médica — descreva sintomas",
  icon: "👨‍⚕️",
  examPart: "Alltagssituation",
  prompt: "Du bist ein Arzt in einer deutschen Praxis. Der Patient ruft an, um einen Termin zu vereinbaren und Symptome zu beschreiben. Verwende medizinische Alltagssprache auf B1-Niveau.",
  suggestedVocab: ["Symptome", "Termin vereinbaren", "Rezept", "Überweisung", "Untersuchung"],
},
```

### Regras para o `prompt`

1. **Escreva em alemão** — o prompt define o papel da IA na conversa
2. **Defina o papel** ("Du bist ein...") — quem a IA está interpretando
3. **Defina a situação** — o que está acontecendo
4. **Mencione o nível** — use "B1-Niveau" ou a variável que será injetada
5. **Dê instruções de comportamento** — "Frage nach...", "Reagiere auf..."
6. **NÃO inclua instruções de formato JSON** — isso é adicionado pelo `getConversationPrompt()`
7. **Máximo ~3 linhas** — seja conciso no prompt do cenário

### Onde adicionar

Edite `src/lib/scenarios.ts` e adicione o novo objeto ao array `SCENARIOS`.
Agrupe por `examPart` usando comentários `// ── Categoria ──`.

---

## 6. Como criar novos Schreiben Tasks

### Interface TypeScript

```typescript
interface SchreibenTask {
  id: string;                    // kebab-case, único
  title: string;                 // Título em alemão
  instruction: string;           // Instrução do exame em alemão (Imperativ)
  situation: string;             // Situação contextual em alemão
  points: string[];              // Exatamente 4 pontos a abordar (padrão Goethe B1)
  wordCount: {
    min: number;     // 80
    target: number;  // 120
    max: number;     // 160
  };
  register: "formal" | "informal";  // Determina Sie vs du
}
```

### Exemplo real (copie e adapte)

```typescript
{
  id: "beschwerde-internet",
  title: "Beschwerde: Internetanschluss",
  instruction: "Schreiben Sie eine E-Mail an den Kundenservice.",
  situation: "Ihr Internetanschluss funktioniert seit einer Woche nicht richtig.",
  points: [
    "Warum schreiben Sie?",
    "Beschreiben Sie das Problem genau.",
    "Seit wann besteht das Problem?",
    "Was erwarten Sie (Lösung/Entschädigung)?",
  ],
  wordCount: { min: 80, target: 120, max: 160 },
  register: "formal",
},
```

### Regras

1. **Sempre 4 pontos** — é o formato Goethe B1 Schreiben Teil 1
2. **`instruction` e `situation` em alemão** — como no exame real
3. **`points` em alemão** — perguntas que o texto deve responder
4. **wordCount padrão:** `{ min: 80, target: 120, max: 160 }` (Goethe B1)
5. **`register`:** `"formal"` para e-mails a empresas/instituições (Sie), `"informal"` para amigos (du)

### Sugestões de novos tasks

| ID sugerido | Título | Register |
|-------------|--------|----------|
| `krankmeldung` | Krankmeldung beim Arbeitgeber | formal |
| `wg-suche` | WG-Zimmer suchen | informal |
| `kurs-absage` | Kursabsage und Rückerstattung | formal |
| `danksagung` | Dankesbrief an Gastfamilie | informal |
| `termin-verschieben` | Arzttermin verschieben | formal |
| `nachbar-laerm` | Lärmbeschwerde an Nachbar | formal |

### Onde adicionar

Edite `src/lib/schreiben-tasks.ts` e adicione ao array `SCHREIBEN_TASKS`.

---

## 7. Como criar novos Grammar Topics

### Interface TypeScript

```typescript
interface GrammarTopic {
  id: string;                                           // kebab-case
  title: string;                                        // Título em alemão
  description: string;                                  // Descrição em PT-BR
  examples: string[];                                   // 2-3 exemplos em alemão
  difficulty: number;                                   // 1=fácil, 2=médio, 3=difícil
  examRelevance: "critical" | "high" | "medium" | "low"; // Relevância para Goethe B1
}
```

### Exemplo real (copie e adapte)

```typescript
{
  id: "nebensaetze",
  title: "Nebensätze (weil, dass, obwohl, wenn, als, ob)",
  description: "Orações subordinadas — verbo vai para o final",
  examples: [
    "Ich lerne Deutsch, weil ich nach Deutschland möchte.",
    "Obwohl es regnet, gehe ich spazieren.",
  ],
  difficulty: 2,
  examRelevance: "critical",
},
```

### Relevância para o exame

| Valor | Significado |
|-------|-------------|
| `"critical"` | Aparece em praticamente todas as provas, erro aqui = reprovação |
| `"high"` | Muito frequente, pontuação significativa |
| `"medium"` | Aparece, mas erro não é decisivo |
| `"low"` | Bom saber, mas raro no B1 |

### Sugestões de novos topics

| ID | Título | Difficulty | ExamRelevance |
|----|--------|-----------|---------------|
| `modalverben` | Modalverben (können, müssen, dürfen, sollen, wollen, mögen) | 1 | critical |
| `trennbare-verben` | Trennbare und untrennbare Verben | 2 | high |
| `komparativ-superlativ` | Komparativ und Superlativ | 2 | high |
| `imperativ` | Imperativ | 1 | medium |
| `futur` | Futur I und II | 2 | medium |
| `genitiv` | Genitiv | 3 | low |
| `partizip-als-adjektiv` | Partizip I und II als Adjektiv | 3 | medium |
| `zweiteilige-konnektoren` | Zweiteilige Konnektoren (sowohl...als auch, weder...noch) | 3 | high |
| `falls-sofern-vorausgesetzt` | Konditionale Nebensätze (falls, sofern, vorausgesetzt) | 2 | medium |

### Onde adicionar

Edite `src/lib/grammar-topics.ts` e adicione ao array `GRAMMAR_TOPICS`.

---

## 8. Schema do banco de dados

Engine: **SQLite** via better-sqlite3 + **Drizzle ORM**.
Schema: `src/lib/db/schema.ts`.

### Tabelas

#### `vocabulary` — Palavras aprendidas
```
id              INTEGER PK auto
word_de         TEXT NOT NULL       — Palavra em alemão
word_pt         TEXT NOT NULL       — Tradução em português
example_sentence TEXT               — Frase de exemplo
category        TEXT                — noun|verb|adjective|adverb|phrase|conjunction
gender          TEXT                — der|die|das (só para substantivos)
plural          TEXT                — Forma plural
tags            TEXT                — JSON array de tags
collocations    TEXT                — JSON array de colocações
word_family     TEXT                — JSON array da família de palavras
times_seen      INTEGER default 0
times_produced  INTEGER default 0
times_failed    INTEGER default 0
ease_factor     REAL default 2.5
interval_days   INTEGER default 0
next_review_at  TEXT                — ISO timestamp
created_at      TEXT
updated_at      TEXT
```

#### `errors` — Erros cometidos
```
id              INTEGER PK auto
original_text   TEXT NOT NULL       — O que o aluno escreveu
corrected_text  TEXT NOT NULL       — Versão corrigida
explanation     TEXT NOT NULL       — Explicação do erro
category        TEXT NOT NULL       — grammar|vocabulary|syntax|spelling|register
subcategory     TEXT                — Detalhe: dativ_akkusativ, wortstellung, etc.
source_context  TEXT                — Contexto de onde veio o erro
times_repeated  INTEGER default 1   — Incrementa se o aluno repete o mesmo erro
resolved        INTEGER(bool) default false
last_seen_at    TEXT
created_at      TEXT
```

#### `sessions` — Sessões de estudo
```
id              INTEGER PK auto
scenario_id     TEXT NOT NULL       — ID do cenário (referência ao array TS)
scenario_title  TEXT NOT NULL
mode            TEXT NOT NULL       — conversation|schreiben|grammatik|wortschatz|sprechen
messages        TEXT NOT NULL       — JSON array de mensagens
analysis_results TEXT               — JSON array de análises
stats           TEXT                — JSON object com estatísticas
duration_minutes INTEGER
created_at      TEXT
```

#### `daily_stats` — Estatísticas diárias
```
id              INTEGER PK auto
date            TEXT NOT NULL UNIQUE — YYYY-MM-DD
messages_sent   INTEGER default 0
vocab_learned   INTEGER default 0
vocab_reviewed  INTEGER default 0
errors_made     INTEGER default 0
errors_resolved INTEGER default 0
avg_quality     REAL default 0
minutes_studied INTEGER default 0
streak_days     INTEGER default 0
```

#### `schreiben_submissions` — Textos submetidos
```
id              INTEGER PK auto
task_text       TEXT NOT NULL
user_text       TEXT NOT NULL
corrected_text  TEXT
scores          TEXT                — JSON: {erfuellung, kohaerenz, wortschatz, strukturen}
total_score     INTEGER             — 0-20
feedback        TEXT
improvement_tips TEXT               — JSON array
created_at      TEXT
```

#### `review_queue` — Fila de revisão FSRS
```
id              INTEGER PK auto
item_type       TEXT NOT NULL       — vocabulary|error|grammar_rule
item_id         INTEGER NOT NULL    — FK para vocabulary ou errors
due_at          TEXT NOT NULL       — ISO timestamp
difficulty      REAL default 0.3    — FSRS difficulty
stability       REAL default 1.0    — FSRS stability
reps            INTEGER default 0
lapses          INTEGER default 0
last_review_at  TEXT
created_at      TEXT
```

#### `goals` — Metas de estudo
```
id, title, description, category, target_value, current_value, completed, created_at
```

---

## 9. API Routes — Mapa completo

Todas as rotas requerem autenticação (cookie `dt_session` com JWT válido),
exceto `/api/auth` e a página `/login`.

### Rotas de IA (consomem créditos $$$)

| Rota | Método | Body | Modelo | max_tokens | Descrição |
|------|--------|------|--------|-----------|-----------|
| `/api/chat` | POST | `{messages, scenarioId?, level?}` | FAST | 800 | Chat de conversação |
| `/api/analyze` | POST | `{message, conversationContext?, level?}` | FAST | 1200 | Análise de mensagem |
| `/api/schreiben` | POST | `{userText, taskInstruction?, taskSituation?, taskPoints?, register?, level?}` | QUALITY | 3000 | Avaliação Goethe |
| `/api/grammatik` | POST | `{topicId, level?}` | QUALITY | 3000 | Geração de aula |
| `/api/vocab` | POST | `{recentWords?, errorPatterns?, level?}` | FAST | 1500 | Exercícios de vocabulário |

### Rotas de dados (sem custo de IA)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/errors` | GET | Lista erros + stats por categoria |
| `/api/errors` | PATCH | Toggle resolved |
| `/api/errors` | POST | Adiciona erro à fila de revisão |
| `/api/persist` | POST | Salva vocab/erros/schreiben/track message/quality |
| `/api/review` | GET | Items de revisão pendentes (due) |
| `/api/review` | POST | Submete rating FSRS (1-4) |
| `/api/stats` | GET | Dashboard stats |
| `/api/stats` | POST | Cria/atualiza sessão |
| `/api/export` | GET | Export JSON backup ou CSV vocabulário |

### Rate limiting

- Rotas IA: **20 burst / 5 refill por minuto**
- Export: **5 burst / 1 por minuto**

---

## 10. Sistema de IA — Como funciona

### Fluxo atual (single provider)

```
Frontend → fetch(apiUrl("/api/chat")) → API Route → anthropic.messages.create() → JSON
                                                      ↓
                                              system prompt (de prompts.ts)
                                              + mensagens do usuário
                                                      ↓
                                              safeParseJSON<T>(response)
                                                      ↓
                                              retorna JSON tipado ao frontend
```

### Regras fundamentais

1. **Toda resposta de IA é JSON estruturado** — nunca texto livre
2. O parser `safeParseJSON()` remove code fences e tenta extrair JSON mesmo de respostas malformadas
3. Se o parse falhar, funções `getDefault*()` retornam fallbacks seguros
4. Os prompts são em **português brasileiro** (instruções para a IA) com exemplos em **alemão**
5. As respostas da IA dentro do JSON são uma mistura: conteúdo em alemão, explicações em PT-BR
6. Todos os endpoints têm rate limiting e tratamento de erro padronizado

### Modelos (dois tiers)

| Constante | Uso | Token budget | Quando |
|-----------|-----|-------------|--------|
| `MODEL` (quality) | Schreiben, Grammatik | 3000 | Tarefas complexas que exigem precisão |
| `MODEL_FAST` | Chat, Analyze, Vocab | 800-1500 | Respostas rápidas e frequentes |

---

## 11. Contratos JSON — O que a IA deve retornar

**Esta é a seção mais importante.** Qualquer IA que responda a qualquer endpoint
DEVE retornar JSON que faça parse nestes tipos TypeScript.

### 11.1 ConversationResponse (Chat)

```typescript
interface ConversationResponse {
  response: string;      // Resposta em alemão (2-4 frases, B1)
  translation: string;   // Tradução em PT-BR
  keyVocab: {
    de: string;          // Palavra em alemão
    pt: string;          // Tradução
    example: string;     // Frase de exemplo em alemão
  }[];                   // 1-3 palavras relevantes
  grammarNote: string;   // Nota gramatical em PT-BR sobre algo usado na resposta
}
```

**Exemplo completo:**
```json
{
  "response": "Natürlich! Ich denke, wir könnten die Feier am Samstag machen. Was meinst du — sollen wir bei mir zu Hause feiern oder ein Restaurant reservieren?",
  "translation": "Claro! Eu acho que poderíamos fazer a festa no sábado. O que você acha — devemos comemorar na minha casa ou reservar um restaurante?",
  "keyVocab": [
    {
      "de": "die Feier",
      "pt": "a festa/celebração",
      "example": "Die Feier beginnt um 19 Uhr."
    },
    {
      "de": "reservieren",
      "pt": "reservar",
      "example": "Können wir einen Tisch reservieren?"
    }
  ],
  "grammarNote": "'könnten' é o Konjunktiv II de 'können' — usado para sugestões educadas. Equivale a 'poderíamos' em português."
}
```

### 11.2 AnalysisResponse (Análise de mensagem)

```typescript
interface AnalysisResponse {
  overallQuality: number;         // 1-10
  corrections: {
    original: string;             // O que o aluno escreveu
    corrected: string;            // Versão corrigida
    explanation: string;          // Explicação em PT-BR
    category: "grammar" | "vocabulary" | "syntax" | "spelling" | "register";
    subcategory: string;          // Ex: "dativ_akkusativ", "wortstellung"
  }[];
  sentenceSurgery: {
    studentVersion: string;       // Frase do aluno
    nativeVersion: string;        // Como um nativo B2/C1 diria
    differences: string[];        // Diferenças explicadas em PT-BR
  };
  positives: string[];            // Aspectos positivos ESPECÍFICOS (em PT-BR)
  vocabularyExpansion: {
    word: string;                 // Palavra que o aluno usou
    alternatives: string[];       // Sinônimos em alemão
    collocations: string[];       // Combinações comuns
    wordFamily: string[];         // Família de palavras
  }[];
  activeRecallChallenge: {
    type: "cloze" | "reverseTranslation" | "reconstruction" | "conjugation";
    question: string;             // Pergunta em PT-BR
    answer: string;               // Resposta em alemão
    hint: string;                 // Dica
  };
  proficiencySignals: {
    level: "A2" | "B1" | "B2";   // Nível detectado
    evidence: string;             // Evidência específica
  };
}
```

**Exemplo completo:**
```json
{
  "overallQuality": 7,
  "corrections": [
    {
      "original": "Ich gehe in den Arzt",
      "corrected": "Ich gehe zum Arzt",
      "explanation": "Com 'gehen' + pessoas/profissionais, usamos 'zu + Dativ', não 'in + Akkusativ'. 'zum' = 'zu dem'. Dica: 'in' é para lugares físicos (in die Praxis), 'zu' é para pessoas (zum Arzt).",
      "category": "grammar",
      "subcategory": "praepositionen"
    }
  ],
  "sentenceSurgery": {
    "studentVersion": "Ich gehe in den Arzt weil ich bin krank.",
    "nativeVersion": "Ich gehe zum Arzt, weil ich krank bin.",
    "differences": [
      "'in den Arzt' → 'zum Arzt': preposição diferente para ir a uma pessoa",
      "Vírgula antes de 'weil': obrigatória antes de orações subordinadas",
      "'ich bin krank' → 'ich krank bin': em Nebensatz com 'weil', o verbo conjugado vai para o FINAL"
    ]
  },
  "positives": [
    "Usou corretamente 'krank' como adjetivo predicativo (sem declinação)",
    "Estrutura da frase principal está correta (SVO)"
  ],
  "vocabularyExpansion": [
    {
      "word": "krank",
      "alternatives": ["unwohl", "erkältet", "verletzt"],
      "collocations": ["krank werden", "krank sein", "sich krank fühlen"],
      "wordFamily": ["die Krankheit", "das Krankenhaus", "der Krankenwagen"]
    }
  ],
  "activeRecallChallenge": {
    "type": "reverseTranslation",
    "question": "Traduza: 'Eu vou ao médico porque estou doente.'",
    "answer": "Ich gehe zum Arzt, weil ich krank bin.",
    "hint": "Lembre: weil + verbo no final"
  },
  "proficiencySignals": {
    "level": "A2",
    "evidence": "Erro de Wortstellung em Nebensatz e uso incorreto de preposição indicam A2 em gramática, mas vocabulário adequado para B1."
  }
}
```

### 11.3 SchreibenResponse (Avaliação de escrita)

```typescript
interface SchreibenResponse {
  scores: {
    erfuellung: { score: number; comment: string };   // 0-5
    kohaerenz: { score: number; comment: string };    // 0-5
    wortschatz: { score: number; comment: string };   // 0-5
    strukturen: { score: number; comment: string };   // 0-5
  };
  totalScore: number;          // 0-20
  passed: boolean;             // totalScore >= 12
  correctedVersion: string;    // Texto completo corrigido em alemão
  detailedFeedback: string;    // Feedback em PT-BR
  improvementTips: string[];   // 3 dicas práticas em PT-BR
  modelPhrases: string[];      // Frases modelo com tradução
}
```

### 11.4 GrammatikResponse (Aula de gramática)

```typescript
interface GrammatikResponse {
  explanation: string;           // Explicação em PT-BR com exemplos em alemão
  exercises: {
    type: "fillBlank" | "transform" | "correct" | "translate" | "reorder";
    difficulty: number;          // 1-3
    instruction: string;         // Instrução em PT-BR
    question: string;            // Pergunta/frase em alemão
    answer: string;              // Resposta correta
    acceptableAnswers: string[]; // Variações aceitáveis
    hint: string;                // Dica
    explanation: string;         // Por que esta é a resposta
  }[];                           // 4-6 exercícios progressivos
  memoryTip: string;             // Dica mnemônica criativa em PT-BR
  commonMistakes: string[];      // Erros comuns de brasileiros
}
```

### 11.5 VocabResponse (Exercícios de vocabulário)

```typescript
interface VocabResponse {
  exercises: {
    type: "ptToDe" | "contextGuess" | "collocation" | "wordFamily" | "sentenceBuild";
    prompt: string;              // O prompt do exercício
    answer: string;              // Resposta correta
    acceptableAnswers: string[]; // Variações aceitáveis
    hint: string;
    explanation: string;
  }[];                           // 5 exercícios variados
  wordWeb: {
    centerWord: string;          // Palavra central
    related: {
      word: string;
      relation: string;          // sinônimo|antônimo|colocação|família|composto
      example: string;
    }[];
  };
}
```

---

## 12. Prompts — Os system prompts exatos

Os prompts ficam em `src/lib/ai/prompts.ts`. Cada um é uma função que retorna uma string.
Os prompts são **agnósticos de provider** — funcionam com qualquer IA que aceite system + user messages.

### Resumo

| Função | Recebe | Idioma do prompt | Idioma da resposta |
|--------|--------|-----------------|-------------------|
| `getConversationPrompt(scenario, level)` | Scenario + nível | Alemão | JSON misto (DE + PT) |
| `getAnalysisPrompt(level)` | nível | PT-BR | JSON misto |
| `getSchreibenPrompt(level)` | nível | PT-BR | JSON misto |
| `getVocabPrompt(words, errors, level)` | arrays + nível | PT-BR | JSON misto |
| `getGrammatikPrompt(topic, level)` | GrammarTopic + nível | PT-BR | JSON misto |

Todos os prompts terminam com a instrução de retornar **APENAS JSON válido, sem markdown, sem backticks**.

Para ver os prompts completos, leia o arquivo `src/lib/ai/prompts.ts` (204 linhas).

---

## 13. Sistema de revisão (SRS/FSRS)

**FSRS v4** (Free Spaced Repetition Scheduler) é implementado localmente em `src/lib/srs/fsrs.ts`.

### Como funciona

1. Quando o aluno aprende vocab ou comete erro → item vai para `review_queue`
2. FSRS calcula `due_at` baseado em `difficulty`, `stability`, `reps`, `lapses`
3. Quando `due_at <= agora` → item aparece em `/wortschatz/review` como flashcard
4. Aluno avalia: 1 (Again) → 2 (Hard) → 3 (Good) → 4 (Easy)
5. FSRS recalcula próxima revisão

### Parâmetros FSRS (17 parâmetros tuned para language learning)

Definidos em `src/lib/srs/fsrs.ts`. Não altere sem entender o algoritmo.

---

## 14. Regras pedagógicas

Qualquer IA que gere conteúdo ou responda ao aluno DEVE seguir estas regras:

### Perfil do aluno
- **Nacionalidade:** Brasileiro
- **Profissão:** Médico (vai trabalhar na Alemanha)
- **Nível:** Goethe B1 (preparação para exame)
- **Idioma de instrução:** Português brasileiro (PT-BR)
- **Idioma de conteúdo:** Alemão (Hochdeutsch)
- **Vocabulário passivo:** Extenso (Duolingo), mas produção ativa fraca

### Princípios

1. **Produção ativa > Reconhecimento passivo** — sempre forçar o aluno a produzir em alemão
2. **Corrigir COM explicação** — nunca só "está errado", sempre "está errado PORQUE..."
3. **Comparar com português** — quando facilitar a compreensão
4. **Vocabulário médico** — sempre que o contexto permitir, inserir termos médicos
5. **Formato Goethe B1** — respeitar os critérios oficiais do exame
6. **Encorajamento** — ser justo mas motivador ("gut gemacht, aber...")
7. **JSON válido** — SEMPRE retornar JSON parseável, NUNCA texto livre

### Critérios Goethe B1 Schreiben (os 4 oficiais)

| Critério | 0-5 | O que avalia |
|----------|-----|-------------|
| **Erfüllung** | Todos os 4 pontos abordados? Registro (du/Sie) correto? |
| **Kohärenz** | Texto fluido? Conectores usados? Lógica? |
| **Wortschatz** | Vocabulário variado e adequado para B1? |
| **Strukturen** | Gramática correta? Nebensätze? Perfekt? Variedade? |

Aprovação: totalScore ≥ 12 (de 20).

---

## 15. Multi-Provider — Arquitetura futura

> ⚠️ Esta seção descreve a arquitetura PLANEJADA para suporte a múltiplos provedores de IA.
> Em março 2026, apenas Anthropic Claude está implementado.

### Providers planejados

| Provider | Modelos prováveis | Tier | Env var | SDK |
|----------|------------------|------|---------|-----|
| **Anthropic** (atual) | claude-sonnet-4, claude-haiku-4 | premium / standard | `ANTHROPIC_API_KEY` | `@anthropic-ai/sdk` |
| **OpenAI** | gpt-4o, gpt-4o-mini, o3-mini | premium / economy | `OPENAI_API_KEY` | `openai` |
| **Google** | gemini-2.5-pro, gemini-2.5-flash | premium / economy | `GOOGLE_AI_KEY` | `@google/genai` |
| **xAI** | grok-3, grok-3-mini | premium / economy | `XAI_API_KEY` | API compatível OpenAI |
| **DeepSeek** | deepseek-chat, deepseek-reasoner | economy | `DEEPSEEK_API_KEY` | API compatível OpenAI |

> **Nota:** Modelos e nomes de API se atualizam rapidamente.
> Ao implementar, verifique os modelos disponíveis nas docs oficiais de cada provider.
> Grok e DeepSeek usam formato OpenAI-compatible — podem compartilhar o mesmo adapter base.

### Interface de abstração (a ser implementada)

```typescript
interface AIProvider {
  id: string;                    // "anthropic" | "openai" | "google" | "xai" | "deepseek"
  name: string;                  // "Claude Sonnet 4" — nome amigável
  tier: "premium" | "standard" | "economy";
  available: boolean;            // true se a key está configurada no .env

  /**
   * Envia mensagens com system prompt e retorna texto (JSON string).
   * Todos os providers devem retornar o MESMO formato JSON.
   * Os prompts de src/lib/ai/prompts.ts são provider-agnostic.
   */
  chat(params: {
    systemPrompt: string;
    messages: { role: "user" | "assistant"; content: string }[];
    maxTokens: number;
  }): Promise<string>;
}
```

### Princípio fundamental

**Os prompts não mudam entre providers.** Todos recebem o mesmo system prompt e devem retornar o mesmo JSON.
O `safeParseJSON()` já trata code fences e respostas levemente malformadas.

### No .env (futuro)

```bash
# Provider keys — apenas configure os que quiser usar.
# O app detecta automaticamente quais estão disponíveis.
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_KEY=AI...
XAI_API_KEY=xai-...
DEEPSEEK_API_KEY=sk-...
```

---

## 16. Atribuição — Quem criou o quê

Todo conteúdo adicionado ao repositório deve ser **atribuído** ao seu criador.

### Para conteúdo estático (scenarios, tasks, topics)

Adicione um comentário no código:

```typescript
// ── Adicionado por GPT-4o — março 2026 ──
{
  id: "telefongespraech-bank",
  title: "Telefongespräch mit der Bank",
  ...
},
```

### Para contribuições de código

Use o commit message:

```
feat(content): add 3 new Schreiben tasks [gpt-4o]
feat(provider): add OpenAI provider adapter [claude]
fix(grammar): correct Konjunktiv II examples [gemini]
```

### No banco de dados (futuro)

Quando multi-provider estiver implementado, a tabela `sessions` ganhará coluna `provider`:

```sql
ALTER TABLE sessions ADD COLUMN provider TEXT DEFAULT 'anthropic';
```

---

## 17. Como contribuir — Checklist

### Para adicionar conteúdo (cenários, tasks, tópicos)

- [ ] Ler seção 5, 6 ou 7 (dependendo do tipo)
- [ ] Copiar exemplo existente e adaptar
- [ ] Usar IDs kebab-case únicos (verificar IDs existentes na seção 4)
- [ ] Manter o nível B1 (nem mais fácil, nem mais difícil)
- [ ] Prompts de cenário em **alemão**
- [ ] Descrições e instructions seguindo os padrões Goethe
- [ ] Adicionar comentário de atribuição
- [ ] Rodar `pnpm build` para verificar que compila

### Para contribuições arquiteturais

- [ ] Ler seção 10 (Sistema de IA) e 11 (Contratos JSON)
- [ ] Qualquer novo endpoint de IA DEVE retornar JSON nos tipos de `parsers.ts`
- [ ] Qualquer `fetch()` no frontend DEVE usar `apiUrl()` de `src/lib/api.ts`
- [ ] Variáveis de ambiente de runtime DEVEM ter fallback vazio (`|| ""`) ou init lazy
- [ ] Middleware protege todas as rotas — novas rotas públicas devem ser adicionadas a `PUBLIC_PATHS`
- [ ] Rate limiting deve ser aplicado a qualquer nova rota de IA

### Para adicionar um novo provider de IA

- [ ] Implementar a interface `AIProvider` (seção 15)
- [ ] Adicionar env var ao `.env.example` e `docker-compose.yml`
- [ ] Registrar no factory/registry de providers
- [ ] Testar com os 5 endpoints (chat, analyze, schreiben, grammatik, vocab)
- [ ] Validar que o JSON de resposta faz parse nos tipos de `parsers.ts`
- [ ] Adicionar ao seletor de provider no frontend

---

## 18. Deploy e infraestrutura

Para detalhes completos de deploy, leia `DEPLOY.md`.

Resumo:
- **URL:** `https://mnrs.com.br/tutor`
- **Docker:** `docker compose build --no-cache && docker compose up -d`
- **Porta:** `127.0.0.1:8091:3000`
- **Rede:** `perguntas_default` (compartilhada com nginx)
- **Nginx:** upstream `app_tutor` → `deutschtutor:3000`
- **Auth:** Login obrigatório (JWT cookie)

### Armadilhas conhecidas

Veja `DEPLOY.md` seção "Armadilhas Conhecidas" — lista 7 problemas documentados
que custaram tempo real de debug. **Leia antes de qualquer mudança de infra.**

---

## Prompt para usar em outra IA

Copie e cole o bloco abaixo em qualquer IA (ChatGPT, Gemini, Grok, etc.) para gerar conteúdo:

````
Você vai criar conteúdo para o DeutschTutor Pro, um app de aprendizado de alemão
nível Goethe B1 para um médico brasileiro.

REGRAS:
- Nível: B1 (nem mais fácil, nem mais difícil)
- Descrições e explicações: em português brasileiro (PT-BR)
- Conteúdo linguístico: em alemão padrão (Hochdeutsch)
- Contexto médico quando possível
- Formato: TypeScript objects que serão adicionados a arrays existentes

TAREFA: Crie [QUANTIDADE] novos [TIPO] seguindo EXATAMENTE este formato:

[COLE AQUI A INTERFACE TYPESCRIPT DA SEÇÃO 5, 6 OU 7]

[COLE AQUI UM EXEMPLO REAL DA SEÇÃO CORRESPONDENTE]

IDs existentes (NÃO repita): [COLE OS IDs DA SEÇÃO 4]

Retorne os objetos TypeScript prontos para copiar e colar no código.
Adicione um comentário: // ── Criado por [SEU NOME] — [DATA] ──
````

---

*Este documento foi criado por Claude (Anthropic) em março de 2026.
Atualize-o sempre que a estrutura da app mudar significativamente.*
