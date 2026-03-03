# Dev Guide — DeutschTutor Pro

> **Audience:** Agente AI de desenvolvimento local (macOS) ou desenvolvedor humano.
> Leia este documento **inteiro** antes de fazer qualquer alteração no código.
>
> **Última atualização:** Março 2026

---

## Visão Geral da Arquitetura

| Item | Valor |
|------|-------|
| **Framework** | Next.js 16.1.6 (App Router, React 19, Turbopack) |
| **Linguagem** | TypeScript 5 (strict mode) |
| **Gerenciador** | pnpm 10.30.3 (declarado em `packageManager` no `package.json`) |
| **Banco** | SQLite via `better-sqlite3` + Drizzle ORM |
| **Node** | 20.x (produção usa `node:20-alpine` no Docker) |
| **CSS** | Tailwind CSS v4 |
| **Compilador** | React Compiler (`babel-plugin-react-compiler`) habilitado |
| **Output** | `standalone` (Next.js gera server.js autocontido) |
| **Prod URL** | `https://mnrs.com.br/tutor` (atrás de Cloudflare + nginx) |
| **Prod basePath** | `/tutor` |

---

## Setup Inicial (macOS)

```bash
# 1. Node 20.x (mesma versão do Docker de produção)
brew install node@20
# ou via nvm:
nvm install 20 && nvm use 20

# 2. pnpm via corepack
corepack enable && corepack prepare pnpm@10.30.3 --activate

# 3. Clone
git clone git@github.com:caiooliveirac/DeutschTutor.git deutschtutor-pro
cd deutschtutor-pro

# 4. Instale dependências
pnpm install

# 5. Crie o .env na raiz (ver seção abaixo)
# 6. Crie diretório de dados
mkdir -p data

# 7. Rode
pnpm dev
# → http://localhost:3000
```

### Variáveis de ambiente (`.env`)

```env
# ── AI Providers (preencha as que quiser ativar) ──
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_KEY=AI...
XAI_API_KEY=xai-...
DEEPSEEK_API_KEY=sk-...

# ── Auth ──
JWT_SECRET=<string-aleatória-longa-mínimo-32-chars>
AUTH_USERS=usuario:salt:hash
```

> O `.env` está no `.gitignore` — **nunca** commite chaves.

---

## ⚠️ ARMADILHAS CRÍTICAS — Leia Antes de Tudo

Cada item abaixo custou horas de debug real. **Não pule.**

### 1. `NEXT_PUBLIC_BASE_PATH` — dev vs produção

| Ambiente | Valor | Acesso |
|----------|-------|--------|
| **Dev local** | vazio / não definido | `http://localhost:3000/` |
| **Produção** | `/tutor` | `https://mnrs.com.br/tutor/` |

**Se definir `/tutor` localmente**, todas as rotas vão exigir prefixo `/tutor/` e nada funciona direto. **Nunca defina** essa variável no `.env` local.

### 2. `fetch()` no frontend DEVE usar `apiUrl()`

O Next.js **não** aplica `basePath` em `fetch()` manual. Todo fetch de API DEVE usar o helper:

```typescript
import { apiUrl } from "@/lib/api";

// ✅ Correto
fetch(apiUrl("/api/stats"))

// ❌ Errado — funciona local, quebra em produção
fetch("/api/stats")
```

**Se criar qualquer componente/page que faz `fetch("/api/...")`, use `apiUrl()`.**

### 3. `auth.ts` vs `auth.server.ts` — Edge Runtime

O middleware do Next.js roda em **Edge Runtime**, que **não suporta** Node.js `crypto`.

A autenticação está separada em dois arquivos:

| Arquivo | Runtime | Contém |
|---------|---------|--------|
| `src/lib/auth.ts` | Edge-safe | JWT (jose), cookies, `verifyRequestToken()` |
| `src/lib/auth.server.ts` | Node-only | `crypto.scrypt()`, `hashPassword()`, `verifyPassword()`, `authenticateUser()` |

**Regras:**
- O `middleware.ts` importa **apenas** de `auth.ts`
- API routes importam de `auth.ts` (cookies/JWT) **e** `auth.server.ts` (password)
- **Nunca** importe `crypto`, `fs`, `path`, `child_process` ou qualquer módulo Node.js em `auth.ts`
- **Nunca** importe `auth.server.ts` em qualquer arquivo que possa ser incluído no middleware bundle

Se violar isso, o `next build` falha com:
```
A Node.js module is loaded ('crypto') which is not supported in the Edge Runtime.
```

### 4. `better-sqlite3` — binding nativo C++

O `pnpm-workspace.yaml` contém `ignoredBuiltDependencies: [better-sqlite3]`, o que **pula** a compilação do binding nativo. No macOS geralmente funciona porque o pnpm baixa prebuilt binaries. Se der erro:

```bash
# Instalar build tools (se ainda não tem)
xcode-select --install

# Forçar rebuild
cd node_modules/better-sqlite3 && npx node-gyp rebuild && cd ../..
```

No Docker de produção isso é tratado pelo `sed` + rebuild manual no Dockerfile.

### 5. `db/index.ts` executa no top-level

O `src/lib/db/index.ts` faz `new Database()` e `CREATE TABLE IF NOT EXISTS` **no escopo do módulo** (top-level). Isso significa:
- O diretório `data/` **precisa existir** para o build funcionar
- Durante `next build`, o Next.js roda "Collecting page data" que importa esse módulo
- Se não houver binding nativo compilado, o build falha

**Regra:** sempre tenha `mkdir -p data` antes de rodar `pnpm build`.

### 6. Inicialização lazy de env vars

Variáveis como `JWT_SECRET` e API keys **não existem** em build time (no Docker). O código usa padrão lazy:

```typescript
// ✅ Correto — falha só quando chamado em runtime
const JWT_SECRET_RAW = process.env.JWT_SECRET || "";
function getSecret() {
  if (!JWT_SECRET_RAW) throw new Error("JWT_SECRET required");
  return new TextEncoder().encode(JWT_SECRET_RAW);
}

// ❌ Errado — falha no build
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
```

**Se adicionar novas env vars, sempre use inicialização lazy.**

### 7. `serverExternalPackages` no `next.config.ts`

O `better-sqlite3` está em `serverExternalPackages` para que o bundler do Next.js não tente inline o módulo nativo:

```typescript
serverExternalPackages: ["better-sqlite3"],
```

**Se adicionar outra dependência com binding nativo (ex: `sharp`, `canvas`), adicione aqui também.**

---

## Pipeline CI/CD

```
push main → CI (lint + typecheck, ~20s)
                ↓ se passou
            CD (SSH → EC2 → docker compose build + deploy, ~3min)
```

### CI (`.github/workflows/ci.yml`)

Roda em todo push/PR para `main`:
1. Setup Node 20 + pnpm
2. `pnpm install --frozen-lockfile`
3. `pnpm lint` (ESLint 9)
4. `pnpm exec tsc --noEmit` (typecheck)

> `next build` **não** roda no CI porque `better-sqlite3` não compila de forma confiável no GitHub Actions runner. O build completo é validado dentro do Docker no CD.

### CD (`.github/workflows/cd.yml`)

Só roda quando o CI completa com sucesso (`workflow_run`):
1. SSH no EC2
2. `git fetch && git reset --hard origin/main`
3. `docker compose up -d --build --force-recreate`
4. `docker image prune -f`

### Antes de fazer push

```bash
# Validação rápida local (mesma coisa que o CI faz)
pnpm lint && pnpm exec tsc --noEmit

# Se quiser validar build completo (como o CD faz)
docker compose build
```

---

## Estrutura de Código — Guia de Navegação

### API Routes (`src/app/api/`)

| Rota | Função | Usa DB? | Usa AI? |
|------|--------|---------|---------|
| `/api/auth` | Login/logout/session | Não (env-based) | Não |
| `/api/chat` | Conversação com IA | Não | Sim |
| `/api/analyze` | Análise de mensagem | Não | Sim |
| `/api/grammatik` | Geração de aula | Não | Sim |
| `/api/schreiben` | Avaliação de escrita | Não | Sim |
| `/api/vocab` | Exercícios de vocabulário | Sim (leitura) | Sim |
| `/api/review` | SRS review queue | Sim | Não |
| `/api/persist` | Salvar dados no DB | Sim (escrita) | Não |
| `/api/stats` | Estatísticas | Sim (leitura) | Não |
| `/api/errors` | Fehlertagebuch | Sim | Não |
| `/api/export` | Exportar dados | Sim (leitura) | Não |
| `/api/providers` | Listar providers ativos | Não | Não |

### AI Pipeline (`src/lib/ai/`)

```
prompts.ts        → System prompts por endpoint
parsers.ts        → safeParseJSON + sanitizers por tipo de resposta
providers/
  registry.ts     → Registro de providers disponíveis
  types.ts        → Interface AIProvider
  anthropic.ts    → Anthropic SDK
  openai-compat.ts → OpenAI-compatible (OpenAI, xAI, DeepSeek)
  google.ts       → Google GenAI
  index.ts        → resolveProviders() com fallback chain
client.ts         → callAI() — orquestra a chamada com retry
```

**Fluxo:** API route → `callAI(prompt, messages, maxTokens)` → tenta providers em sequência → `safeParseJSON()` → sanitizer → resposta tipada

### Separação de Concerns

| Camada | Responsabilidade | Edge-safe? |
|--------|------------------|------------|
| `middleware.ts` | Auth guard (JWT verify) | ✅ Sim |
| `src/lib/auth.ts` | JWT + cookies | ✅ Sim |
| `src/lib/auth.server.ts` | Password hashing (crypto) | ❌ Node-only |
| `src/lib/db/` | SQLite (better-sqlite3) | ❌ Node-only |
| `src/lib/ai/` | AI providers | ❌ Node-only |
| `src/lib/api.ts` | Helper `apiUrl()` | ✅ Client-side |
| `src/components/` | React components | ✅ Client-side |

---

## Padrões de Código Obrigatórios

### 1. Imports não usados = CI falha

O ESLint está configurado com `@typescript-eslint/no-unused-vars` como **warning** e o React Compiler com regras estritas. Evite:

```typescript
// ❌ Falha no CI
import { Card, CardHeader, CardTitle } from "@/components/ui/card"; // se CardTitle não é usado

// ✅ Correto
import { Card, CardHeader } from "@/components/ui/card";
```

### 2. Interfaces vazias → use `type`

```typescript
// ❌ Erro de lint
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// ✅ Correto
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
```

### 3. Hook dependencies completas

```typescript
// ❌ Falha no lint — providerId e level usados no corpo mas não listados
const loadLesson = useCallback(async () => {
  fetch(apiUrl("/api/grammatik"), {
    body: JSON.stringify({ topicId, provider: providerId, level }),
  });
}, [topicId]);

// ✅ Correto
}, [topicId, providerId, level]);
```

### 4. Tipos importados como `type`

```typescript
// ❌ Se não usar o tipo, remove. Se usar, importe como tipo:
import { safeParseJSON, type VocabResponse } from "@/lib/ai/parsers";

// ✅ Se não precisa do tipo:
import { safeParseJSON } from "@/lib/ai/parsers";
```

### 5. Nunca `setState` direto em `useEffect`

```typescript
// ❌ Erro do React Compiler
useEffect(() => {
  setMobileOpen(false);
}, [pathname]);

// ✅ Correto — guard com condição
useEffect(() => {
  if (mobileOpen) setMobileOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pathname]);
```

---

## Docker — Desenvolvimento Local

### Testar build completo (simula produção)

```bash
# Build sem fazer push (valida tudo)
docker compose build

# Rodar localmente (como produção)
docker compose up -d
# → http://localhost:8091/tutor/
```

> Lembre: o Docker usa `NEXT_PUBLIC_BASE_PATH=/tutor`. Para dev normal, use `pnpm dev` sem Docker.

### Volume do banco de dados

O `docker-compose.yml` monta `./data:/app/data`. Isso significa:
- O banco SQLite persiste no host em `./data/deutschtutor.db`
- `docker compose down` **preserva** os dados
- `docker compose down -v` **NÃO** afeta (não usa Docker volumes)
- Deletar `./data/` manualmente **apaga** todos os dados

### Rede Docker

O `docker-compose.yml` usa `perguntas_default` (rede compartilhada com nginx no servidor). **No macOS local, ignore** — use `pnpm dev`.

Se quiser testar Docker localmente, comente a seção `networks` ou crie a rede:
```bash
docker network create perguntas_default
```

---

## Banco de Dados

### Schema

Definido em dois lugares (que devem estar em sincronia):
- `src/lib/db/schema.ts` — Schema Drizzle (para queries tipadas)
- `src/lib/db/index.ts` — `CREATE TABLE IF NOT EXISTS` (para inicialização automática)

### Tabelas

| Tabela | Propósito |
|--------|-----------|
| `vocabulary` | Palavras aprendidas + SRS metadata |
| `errors` | Fehlertagebuch (diário de erros) |
| `sessions` | Histórico de conversas |
| `daily_stats` | Estatísticas por dia |
| `schreiben_submissions` | Submissões de escrita avaliadas |
| `review_queue` | Fila de revisão espaçada (FSRS) |
| `goals` | Metas de aprendizado |

### Migrations

```bash
pnpm db:generate  # Gera migration SQL
pnpm db:migrate   # Aplica migration
pnpm db:studio    # UI visual do Drizzle
```

---

## Checklist: Antes de Cada Push

- [ ] `pnpm lint` → zero erros e zero warnings
- [ ] `pnpm exec tsc --noEmit` → zero erros
- [ ] Todo `fetch("/api/...")` usa `apiUrl()`
- [ ] Nenhum import de módulo Node.js em `auth.ts` ou qualquer arquivo importado pelo middleware
- [ ] Novas env vars usam inicialização lazy (não `throw` no top-level)
- [ ] `data/` existe (para build local funcionar)
- [ ] Se adicionou dependência nativa → adicionou em `serverExternalPackages`

## Checklist: Antes de Criar Novo Arquivo

- [ ] **Novo componente client** → `"use client"` no topo
- [ ] **Nova API route** → não importar `auth.server.ts` se não precisar de password
- [ ] **Novo fetch no frontend** → usar `apiUrl()`
- [ ] **Novo hook effect** → deps array completo

---

## Fluxo de Trabalho Recomendado

```
1. pnpm dev                        # Desenvolve com hot reload (~100ms)
2. Testa manualmente               # http://localhost:3000
3. pnpm lint && pnpm exec tsc --noEmit  # Valida antes do commit
4. git add -A && git commit -m "..."
5. git push origin main            # CI roda lint+typecheck
6. CI passa → CD faz deploy automático no EC2
```

Se o CD falhar (docker build quebra), o container anterior continua rodando — sem downtime.

### Validação de build Docker local (opcional, pré-push)

```bash
# Só buildar (valida que o Dockerfile compila)
docker compose -f docker-compose.dev.yml build

# Buildar E rodar localmente em modo produção
docker compose -f docker-compose.dev.yml up -d
# → http://localhost:3000 (sem basePath, diferente de produção que usa /tutor)

# Parar
docker compose -f docker-compose.dev.yml down
```

> **Quando usar:** Antes de pushes que alteram dependências, `next.config.ts`,
> Dockerfile, ou qualquer coisa que possa quebrar o build Docker. Não é necessário
> para mudanças de código normais — o CI + CD já validam tudo.

---

## Por que NÃO usar Docker para dev ativo

1. **`better-sqlite3` é nativo** — compila binários diferentes para macOS arm64 vs Linux x64. Bind mount de `node_modules` entre host e container quebra.
2. **macOS Docker bind mount é lento** — cada file change leva 2-5s para sincronizar vs ~100ms nativo. Turbopack precisa de filesystem rápido.
3. **O Dockerfile é multi-stage otimizado para produção** (`output: "standalone"`) — não suporta hot reload.
4. **`pnpm dev` é superior em tudo** — hot reload instantâneo, debug direto, sem overhead de container.

O `docker-compose.dev.yml` existe apenas para **validar o build de produção** localmente quando necessário.

---

## Prompt para Agente de Dev Local (macOS)

Copie este prompt **inteiro** para instruir o agente Opus no macOS.
Ele contém tudo que o agente precisa saber para operar com segurança.

---

<details>
<summary><strong>📋 CLIQUE PARA EXPANDIR O PROMPT COMPLETO</strong></summary>

```markdown
# Instruções — DeutschTutor Pro (Dev Local macOS)

Você é um agente de desenvolvimento trabalhando no projeto DeutschTutor Pro.
Antes de qualquer alteração, leia o arquivo DEV_GUIDE.md na raiz do projeto.

## Setup Inicial (executar apenas uma vez)

Se o projeto ainda não está configurado:

1. Verificar Node e pnpm:
   node -v   # Deve ser 20.x
   corepack enable && corepack prepare pnpm@10.30.3 --activate

2. Instalar dependências:
   pnpm install

3. Criar .env na raiz (solicitar ao usuário as chaves necessárias):
   ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_KEY, XAI_API_KEY, DEEPSEEK_API_KEY
   JWT_SECRET (string aleatória longa)
   AUTH_USERS (formato: usuario:salt:hash)

4. Criar diretório de dados:
   mkdir -p data

5. Verificar que funciona:
   pnpm dev   # Deve abrir em http://localhost:3000

## Após cada git pull

   pnpm install   # Atualiza deps se lockfile mudou
   mkdir -p data   # Garante diretório de dados

## Regras OBRIGATÓRIAS durante desenvolvimento

### Nunca fazer:
- NÃO defina NEXT_PUBLIC_BASE_PATH no .env local (funciona sem, produção usa /tutor)
- NÃO importe módulos Node.js (crypto, fs, path) em src/lib/auth.ts — é Edge Runtime
- NÃO importe src/lib/auth.server.ts em arquivos que o middleware possa incluir
- NÃO faça fetch("/api/...") sem usar apiUrl() — quebra em produção
- NÃO use interfaces vazias (use type alias)
- NÃO deixe imports não usados — o CI falha
- NÃO rode pnpm build localmente sem mkdir -p data primeiro
- NÃO faça docker compose up com o docker-compose.yml de produção localmente (rede perguntas_default não existe)

### Sempre fazer:
- SEMPRE use apiUrl("/api/...") para fetch no frontend (import de @/lib/api)
- SEMPRE liste todas as dependências em arrays de useCallback/useEffect
- SEMPRE valide antes de commit: pnpm lint && pnpm exec tsc --noEmit
- SEMPRE use inicialização lazy para env vars (não throw no top-level)
- SEMPRE adicione novos pacotes nativos em serverExternalPackages no next.config.ts
- SEMPRE separe lógica Edge-safe (auth.ts) de Node-only (auth.server.ts)

### Separação Edge vs Node:
- auth.ts → JWT (jose), cookies, verifyRequestToken → PODE ser importado no middleware
- auth.server.ts → crypto.scrypt, hashPassword, authenticateUser → SÓ em API routes
- db/index.ts → better-sqlite3 → SÓ em API routes (server-side)

### Arquitetura de AI providers:
- Novos providers → implementar interface AIProvider em src/lib/ai/providers/types.ts
- Registrar em src/lib/ai/providers/registry.ts
- Respostas DEVEM ser JSON puro — ver AGENT_RUNTIME_GUIDE.md para contratos

## Workflow de desenvolvimento

1. pnpm dev                                    # Hot reload ativo
2. [fazer alterações]
3. pnpm lint && pnpm exec tsc --noEmit         # Validar
4. git add -A && git commit -m "descrição"
5. git push origin main                        # CI valida, CD faz deploy

## Se precisar validar build Docker:

docker compose -f docker-compose.dev.yml build   # Testa build de produção
docker compose -f docker-compose.dev.yml up -d    # Roda como produção local
# Acesso: http://localhost:3000
docker compose -f docker-compose.dev.yml down     # Para

## Documentação de referência:
- DEV_GUIDE.md → Este guia (armadilhas, padrões, checklists)
- AGENT_RUNTIME_GUIDE.md → Contratos JSON dos endpoints de IA
- AGENT_CONTENT_GUIDE.md → Conteúdo pedagógico (cenários, gramática, etc.)
- DEPLOY.md → Deploy em produção (EC2/Docker)
```

</details>

---

*Documento criado em março 2026. Atualize quando a arquitetura mudar.*
