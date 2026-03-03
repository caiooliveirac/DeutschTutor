# Deploy Guide — DeutschTutor Pro

> **Audience:** Agente AI (Opus) executando deploy guiado no servidor EC2.
> Leia este documento inteiro antes de executar qualquer comando.

---

## Visão Geral

| Item | Valor |
|------|-------|
| **App** | DeutschTutor Pro — Next.js 16 + SQLite + Anthropic Claude |
| **URL pública** | `https://mnrs.com.br/tutor` |
| **Login** | `https://mnrs.com.br/tutor/login` (autenticação obrigatória) |
| **Servidor** | EC2 AWS (Ubuntu ARM64/aarch64), acesso via `ssh samuspd` |
| **Domínio** | `mnrs.com.br` (por trás de Cloudflare) |
| **basePath** | `/tutor` |
| **Porta interna** | `3000` (dentro do container) |
| **Porta host** | `127.0.0.1:8091:3000` (expor apenas em localhost) |
| **Container name** | `deutschtutor` |
| **Rede Docker** | `perguntas_default` (rede compartilhada com o nginx) |

---

## ⚠️ ARMADILHAS CONHECIDAS — Leia Antes de Tudo

Esta seção documenta todos os problemas encontrados durante o deploy original.
**Cada item aqui custou tempo real de debug.** Não pule.

### 1. `better-sqlite3` + `pnpm-workspace.yaml` (`ignoredBuiltDependencies`)

**Problema:** O `pnpm-workspace.yaml` deste projeto contém:
```yaml
ignoredBuiltDependencies:
  - better-sqlite3
```
Isso faz o `pnpm install` **pular a compilação do binding nativo C++** do `better-sqlite3`,
mesmo que `python3`, `make` e `g++` estejam instalados. O resultado é um crash em runtime:
```
Error: Could not find native binding for better-sqlite3
```

**Solução no Dockerfile:** Usar `sed` para remover a linha **antes** do `pnpm install`:
```dockerfile
RUN sed -i '/- better-sqlite3/d' pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile
```

**Pegadinha extra:** O `COPY . .` posterior **sobrescreve** o `pnpm-workspace.yaml` editado.
É preciso rodar o `sed` novamente após o COPY e fazer um rebuild manual:
```dockerfile
COPY . .
RUN sed -i '/- better-sqlite3/d' pnpm-workspace.yaml
RUN cd node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3 && npx --yes node-gyp rebuild
```

> **Nota:** A versão do better-sqlite3 no path (`12.6.2`) pode mudar. Verifique
> com `ls node_modules/.pnpm/ | grep better-sqlite3` se o build falhar.

### 2. `ANTHROPIC_API_KEY` exigida em build time

**Problema:** O Next.js faz "page data collection" durante `pnpm build`. Ele importa
`src/lib/ai/client.ts` que contém `throw new Error("ANTHROPIC_API_KEY required")`.
O build falha mesmo que a chave só seja necessária em runtime.

**Solução:** Definir uma chave dummy no Dockerfile, apenas para build:
```dockerfile
ENV ANTHROPIC_API_KEY=sk-ant-build-dummy
```
A chave real é injetada via `docker-compose.yml` em runtime.

### 3. Nomes de modelos Anthropic deprecados

**Problema:** O código original usa `claude-haiku-3-5-20241022` (nome errado) ou
`claude-3-5-haiku-20241022` (deprecado). Ambos retornam 404 da API Anthropic.

**Solução:** Usar modelos atuais. Em março de 2026:
```typescript
// src/lib/ai/client.ts
export const MODEL = "claude-sonnet-4-20250514";
export const MODEL_FAST = "claude-sonnet-4-20250514";
```

**Verificação:** Testar o modelo antes de trocar:
```bash
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}' \
  | head -c 200
```
Se retornar `"type":"message"`, o modelo funciona. Se retornar `"type":"error"`, está deprecado.

### 4. `fetch()` no frontend NÃO usa `basePath` automaticamente

**Problema:** O Next.js aplica `basePath` apenas a `<Link>`, `<Image>`, `useRouter()` e
`redirect()`. Chamadas manuais de `fetch("/api/...")` **NÃO** recebem o prefixo `/tutor`.
Resultado: todas as chamadas de API dão 404 ou caem no handler errado do nginx.

O erro na UI é genérico: "Entschuldigung, es gab einen Fehler".

**Solução:** Criar um helper e usá-lo em TODOS os fetch calls:
```typescript
// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}
```

Uso:
```typescript
import { apiUrl } from "@/lib/api";
// ANTES (errado):  fetch("/api/stats")
// DEPOIS (correto): fetch(apiUrl("/api/stats"))
```

**Arquivos afetados (10 arquivos, 22 fetch calls):**
- `src/app/page.tsx`
- `src/app/chat/session/page.tsx`
- `src/app/einstellungen/page.tsx`
- `src/app/fehlertagebuch/page.tsx`
- `src/app/fortschritt/page.tsx`
- `src/app/grammatik/[topicId]/page.tsx`
- `src/app/schreiben/[taskId]/page.tsx`
- `src/app/wortschatz/page.tsx`
- `src/app/wortschatz/review/page.tsx`
- `src/components/chat/AnalysisPanel.tsx`

> **Regra geral:** Qualquer novo arquivo que fizer `fetch("/api/...")` no frontend DEVE usar `apiUrl()`.

### 5. `JWT_SECRET` throw em build time (auth)

**Problema:** Se `auth.ts` fizer `const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)`
no escopo do módulo, o import durante o build falha porque `JWT_SECRET` não existe em build time.

**Solução:** Usar inicialização lazy:
```typescript
const JWT_SECRET_RAW = process.env.JWT_SECRET || "";
function getSecret() {
  if (!JWT_SECRET_RAW) throw new Error("JWT_SECRET env var is required");
  return new TextEncoder().encode(JWT_SECRET_RAW);
}
```
O `getSecret()` só é chamado quando realmente precisa assinar/verificar JWT (em runtime).

### 6. Middleware matcher não captura a rota raiz `/`

**Problema:** O matcher padrão do Next.js middleware:
```typescript
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
```
Quando combinado com `basePath: "/tutor"`, a regex resultante exige **pelo menos um segmento**
após `/tutor`. Resultado: `/tutor` (rota raiz) **não é protegida** pelo middleware.
`/tutor/chat` é protegido, mas `/tutor` serve a página sem autenticação.

**Solução:** Adicionar `"/"` explicitamente ao matcher:
```typescript
export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 7. Estágio único no Dockerfile (não usar multi-stage deps+builder)

**Problema:** O template padrão usa 3 estágios (deps → builder → runner). Mas com o workaround
do `sed` para `pnpm-workspace.yaml` + rebuild manual do `better-sqlite3`, é mais simples e seguro
usar apenas 2 estágios (builder → runner) para evitar inconsistências entre estágios.

---

## Arquitetura no Servidor

```
Internet → Cloudflare → EC2:443 → nginx (container repo-nginx-1)
                                      ├── /tutor  → deutschtutor:3000 (com auth)
                                      ├── /alemao → deutschbruecke:3000
                                      ├── /manual → web:8000
                                      ├── /frases → frases_web:8000
                                      └── ... outros serviços
```

O nginx é configurado pelo arquivo:
```
~/samu-normas/repo/nginx/default.conf
```

O docker-compose principal do ecossistema está em:
```
~/samu-normas/repo/docker-compose.prod.yml
```

---

## Pré-requisitos no Servidor

Já instalados:
- Docker 28.4.0
- Node 20.20.0 (para debug local, mas o deploy é via Docker)
- Rede Docker `perguntas_default` (já existe)

Necessário criar no servidor antes do deploy:
- Arquivo `.env` com `ANTHROPIC_API_KEY`, `JWT_SECRET` e `AUTH_USER`

---

## Passo a Passo do Deploy

### 1. Clonar o repositório

```bash
cd ~
git clone https://github.com/caiooliveirac/DeutschTutor.git deutschtutor-pro
cd deutschtutor-pro
```

### 2. Criar o arquivo .env

```bash
# Gerar JWT secret
JWT_SECRET=$(openssl rand -hex 32)

# Gerar hash para o usuário admin (substitua usuario e senha)
# O formato AUTH_USER é username:salt:scrypthash
# Use o script abaixo para gerar:
node -e "
const crypto = require('crypto');
const user = 'USUARIO';
const pass = 'SENHA_FORTE';
const salt = crypto.randomBytes(16).toString('hex');
crypto.scrypt(pass, salt, 64, (err, key) => {
  console.log(user + ':' + salt + ':' + key.toString('hex'));
});
"

cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-COLOQUE_A_CHAVE_AQUI
JWT_SECRET=COLOQUE_O_JWT_SECRET_GERADO
AUTH_USER=COLOQUE_OUTPUT_DO_SCRIPT_ACIMA
EOF
chmod 600 .env
```

> **IMPORTANTE:**
> - Peça ao usuário a chave da API Anthropic.
> - O `JWT_SECRET` deve ter pelo menos 32 bytes hex (64 caracteres).
> - O `AUTH_USER` segue o formato `username:salt_hex:scrypt_hash_hex`.

### 3. Criar diretório de dados

```bash
mkdir -p data
chmod 777 data
```

O SQLite ficará em `./data/deutschtutor.db` (persistido via volume Docker).

### 4. O Dockerfile

O Dockerfile já está no repositório e contempla todos os workarounds documentados na seção
"Armadilhas Conhecidas" acima. **Não alterar sem ler essa seção.**

Pontos-chave do Dockerfile atual:
- Estágio `builder`: instala build tools, aplica `sed` no `pnpm-workspace.yaml`,
  faz `pnpm install`, depois `COPY . .`, re-aplica `sed`, rebuild manual do `better-sqlite3`,
  e finalmente `pnpm build` com `ANTHROPIC_API_KEY=sk-ant-build-dummy`
- Estágio `runner`: Alpine mínimo + `libstdc++` para runtime do better-sqlite3

### 5. O docker-compose.yml

O `docker-compose.yml` já está no repositório. Variáveis de ambiente necessárias:
- `ANTHROPIC_API_KEY` — chave da API Anthropic (do `.env`)
- `JWT_SECRET` — segredo para assinar JWTs (do `.env`)
- `AUTH_USER` — credenciais do admin no formato `user:salt:hash` (do `.env`)
- `NEXT_PUBLIC_BASE_PATH` — default `/tutor`

### 6. Build e start

```bash
cd ~/deutschtutor-pro
docker compose build --no-cache
docker compose up -d
```

Verificar se subiu:
```bash
docker ps | grep deutschtutor
docker logs deutschtutor --tail 20
```

Testar localmente:
```bash
# Deve redirecionar para /tutor/login (307)
curl -sI http://127.0.0.1:8091/tutor

# Deve retornar 401
curl -s http://127.0.0.1:8091/tutor/api/stats

# Deve carregar o formulário de login
curl -s http://127.0.0.1:8091/tutor/login | head -20
```

### 7. Configurar o Nginx

Editar o arquivo:
```
~/samu-normas/repo/nginx/default.conf
```

#### 7a. Adicionar o upstream (junto com os outros upstreams):

```nginx
upstream app_tutor {
    server deutschtutor:3000;
    keepalive 32;
}
```

#### 7b. Adicionar os location blocks (dentro do `server { listen 443 }`)

```nginx
    # ── DeutschTutor Pro ──
    location = /tutor {
        proxy_pass http://app_tutor;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $proxy_x_forwarded_proto;
        proxy_set_header X-Forwarded-Prefix /tutor;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_redirect off;
    }

    location ^~ /tutor/ {
        proxy_pass http://app_tutor;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $proxy_x_forwarded_proto;
        proxy_set_header X-Forwarded-Prefix /tutor;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_redirect off;
    }
```

> **Por que NÃO rewrite?** O Next.js com `basePath: "/tutor"` já espera receber as requests com `/tutor/...` no path. Não fazer rewrite — apenas proxy direto. Isso é diferente de apps sem basePath nativo.

#### 7c. Adicionar a rede no nginx service (se necessário)

O container `deutschtutor` usa a rede `perguntas_default`. O nginx já está nessa rede (verificar no `docker-compose.prod.yml`). Se NÃO estiver, adicionar.

### 8. Reload do Nginx

```bash
cd ~/samu-normas/repo
docker compose -f docker-compose.prod.yml exec nginx nginx -t
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

Se `nginx -t` der erro, corrigir o `default.conf` antes de recarregar.

### 9. Testar a URL pública

```bash
# Deve redirecionar para /tutor/login
curl -sI https://mnrs.com.br/tutor

# Login
curl -sv -c /tmp/dt_cookies.txt -X POST https://mnrs.com.br/tutor/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"USUARIO","password":"SENHA"}'

# Deve retornar JSON com stats (usando cookie da sessão)
curl -s -b /tmp/dt_cookies.txt https://mnrs.com.br/tutor/api/stats
```

---

## Sistema de Autenticação

O app exige login para acessar qualquer página ou API (exceto `/login` e `/api/auth`).

### Componentes

| Arquivo | Função |
|---------|--------|
| `src/lib/auth.ts` | Hash de senha (scrypt), JWT (jose/HS256), cookie helpers, user store |
| `src/app/api/auth/route.ts` | POST=login, DELETE=logout, GET=check |
| `src/app/login/page.tsx` | Formulário de login (UI em alemão) |
| `src/middleware.ts` | Intercepta todas as rotas, redireciona para login ou retorna 401 |

### Fluxo

1. Usuário acessa qualquer página → middleware verifica cookie `dt_session`
2. Se não autenticado: páginas → redirect 307 para `/tutor/login`; APIs → 401 JSON
3. Login: POST `/tutor/api/auth` com `{username, password}` → cookie JWT HttpOnly setado
4. Cookie: `dt_session`, HttpOnly, Secure, SameSite=lax, Path=/tutor, 30 dias
5. Logout: DELETE `/tutor/api/auth` → cookie limpo

### Segurança

- Senhas armazenadas com `crypto.scrypt` + salt aleatório de 16 bytes
- Comparação timing-safe para username e password
- Delay de 800ms-1200ms em tentativas de login inválidas (anti brute-force)
- Dummy hash verification quando username não existe (previne timing leak)
- JWT HS256 com expiração de 30 dias

### Gerenciar usuários

Para trocar senha ou criar novo usuário:
```bash
# Gerar novo hash
node -e "
const crypto = require('crypto');
const pass = 'NovaSenhaForte123!';
const salt = crypto.randomBytes(16).toString('hex');
crypto.scrypt(pass, salt, 64, (err, key) => {
  console.log('novouser:' + salt + ':' + key.toString('hex'));
});
"
# Atualizar AUTH_USER no .env e reiniciar
docker compose restart
```

---

## Troubleshooting

### Container não conecta na rede

```bash
docker network ls | grep perguntas
docker network inspect perguntas_default | grep deutschtutor
```

Se não estiver na rede, verifique o `docker-compose.yml` e recrie:
```bash
docker compose down && docker compose up -d
```

### better-sqlite3 falha no build

Verificar:
1. O `sed` está removendo `- better-sqlite3` do `pnpm-workspace.yaml`?
2. O `node-gyp rebuild` está rodando no path correto?
3. A versão no path mudou? Checar: `ls node_modules/.pnpm/ | grep better-sqlite3`

Se a versão mudou, atualizar o path no Dockerfile.

> **Alternativa extrema:** Usar `node:20-slim` (Debian) em vez de Alpine, que tem gcc nativo.

### API Claude retorna 404

O modelo está deprecado. Verificar modelos disponíveis:
```bash
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

Atualizar `MODEL` e `MODEL_FAST` em `src/lib/ai/client.ts` e rebuild.

### Frontend dá erro genérico ("Entschuldigung, es gab einen Fehler")

Provavelmente um fetch sem o prefixo basePath. Verificar no browser DevTools (Network tab):
- Se as requests vão para `/api/...` em vez de `/tutor/api/...`, falta o `apiUrl()` wrapper.
- Corrigir importando `apiUrl` de `@/lib/api` no componente afetado.

### Login funciona mas página raiz serve sem auth

Verificar se o middleware matcher inclui `"/"`:
```typescript
export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Nginx não resolve o upstream

O nginx precisa estar na mesma rede Docker. Verificar:
```bash
docker inspect repo-nginx-1 --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
```

### API retorna 402 / credit balance

Créditos Anthropic acabaram. Recarregar em https://console.anthropic.com/settings/billing

### Logs

```bash
# App logs
docker logs deutschtutor --tail 50 -f

# Nginx logs (requisições para /tutor)
docker compose -f ~/samu-normas/repo/docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log | grep tutor
```

---

## Referência Rápida

| Ação | Comando |
|------|---------|
| Rebuild app | `cd ~/deutschtutor-pro && docker compose build --no-cache && docker compose up -d` |
| Ver logs | `docker logs deutschtutor --tail 50 -f` |
| Restart app | `cd ~/deutschtutor-pro && docker compose restart` |
| Reload nginx | `cd ~/samu-normas/repo && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload` |
| Test nginx config | `cd ~/samu-normas/repo && docker compose -f docker-compose.prod.yml exec nginx nginx -t` |
| Check status | `docker ps \| grep deutschtutor` |
| Shell no container | `docker exec -it deutschtutor sh` |
| Ver DB | `docker exec -it deutschtutor ls -la /app/data/` |
| Pull updates | `cd ~/deutschtutor-pro && git pull && docker compose build --no-cache && docker compose up -d` |
| Testar auth | `curl -sI http://127.0.0.1:8091/tutor` (esperar 307 → login) |

---

## Estrutura de Arquivos no Servidor (após deploy)

```
~/deutschtutor-pro/                    ← Repo clonado
├── .env                               ← ANTHROPIC_API_KEY + JWT_SECRET + AUTH_USER (NÃO comitar)
├── data/                              ← SQLite DB (volume Docker, no .gitignore)
│   └── deutschtutor.db
├── Dockerfile                         ← Build com workarounds para better-sqlite3
├── docker-compose.yml                 ← Service definition
├── next.config.ts                     ← basePath: "/tutor"
├── src/
│   ├── lib/
│   │   ├── api.ts                     ← apiUrl() helper para fetch com basePath
│   │   ├── auth.ts                    ← JWT + scrypt + cookie management
│   │   └── ai/client.ts              ← Anthropic client + model constants
│   ├── app/
│   │   ├── api/auth/route.ts          ← Login/logout/check API
│   │   ├── login/page.tsx             ← Login UI
│   │   └── ...                        ← Páginas da app
│   └── middleware.ts                  ← Route protection
└── ...

~/samu-normas/repo/nginx/
└── default.conf                       ← Nginx config (upstream + location blocks)
```

---

## Notas para o Agente

1. **NÃO altere** o `docker-compose.prod.yml` principal em `~/samu-normas/repo/` — o DeutschTutor tem seu próprio compose isolado.
2. **O nginx** precisa fazer proxy para `deutschtutor:3000` pelo nome do container na rede `perguntas_default`.
3. **O basePath** `/tutor` é definido no build do Next.js (variável `NEXT_PUBLIC_BASE_PATH`). Mudar após o build requer rebuild.
4. **Não faça rewrite** no nginx para `/tutor` — o Next.js já lida com o prefixo via `basePath`.
5. **O `.env`** no servidor NÃO deve ser comitado. O `.gitignore` já ignora `.env*`.
6. **O SQLite** fica em `./data/` que é montado como volume. Está no `.gitignore`.
7. **Cloudflare** não precisa de configuração adicional — o wildcard `mnrs.com.br/*` já está configurado.
8. **A porta 8091** foi escolhida para ser a porta local (não conflita com nenhum outro serviço).
9. **O container name `deutschtutor`** é o hostname DNS dentro da rede Docker — é isso que o nginx usa como upstream.
10. **Qualquer `fetch()` novo** no frontend DEVE usar `apiUrl()` de `@/lib/api` — caso contrário, o basePath não é aplicado e a chamada falha silenciosamente.
11. **Modelos Anthropic** deprecam frequentemente. Se APIs começarem a dar 404, verificar e atualizar `MODEL`/`MODEL_FAST` em `src/lib/ai/client.ts`.
12. **Qualquer env var usada em runtime** que seja importada no escopo do módulo precisa ter fallback vazio ou inicialização lazy — senão o build do Next.js falha.
13. **O middleware matcher** precisa incluir `"/"` explicitamente para proteger a rota raiz quando há `basePath` configurado.
