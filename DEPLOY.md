# Deploy Guide — DeutschTutor Pro

> **Audience:** Agente AI (Opus) executando deploy guiado no servidor EC2.
> Leia este documento inteiro antes de executar qualquer comando.

---

## Visão Geral

| Item | Valor |
|------|-------|
| **App** | DeutschTutor Pro — Next.js 16 + SQLite |
| **URL pública** | `https://mnrs.com.br/tutor` |
| **Servidor** | EC2 AWS (Ubuntu), acesso via `ssh samuspd` |
| **Domínio** | `mnrs.com.br` (por trás de Cloudflare) |
| **basePath** | `/tutor` |
| **Porta interna** | `3000` (dentro do container) |
| **Porta host** | `127.0.0.1:8091:3000` (expor apenas em localhost) |
| **Container name** | `deutschtutor` |
| **Rede Docker** | `perguntas_default` (rede compartilhada com o nginx) |

---

## Arquitetura no Servidor

```
Internet → Cloudflare → EC2:443 → nginx (container repo-nginx-1)
                                      ├── /tutor  → deutschtutor:3000
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
- Arquivo `.env` com a chave `ANTHROPIC_API_KEY`

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
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-COLOQUE_A_CHAVE_AQUI
EOF
chmod 600 .env
```

> **IMPORTANTE:** Peça ao usuário a chave da API Anthropic. Sem ela, a IA não funciona.

### 3. Criar diretório de dados

```bash
mkdir -p data
chmod 777 data
```

O SQLite ficará em `./data/deutschtutor.db` (persistido via volume Docker).

### 4. Criar o Dockerfile

O projeto ainda NÃO tem Dockerfile. Crie um baseado no padrão já usado em `~/aulas-alemao/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Instala dependências nativas para better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_BASE_PATH=/tutor
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# better-sqlite3 precisa de libstdc++ no runtime
RUN apk add --no-cache libstdc++

ARG NEXT_PUBLIC_BASE_PATH=/tutor
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

> **Nota sobre `better-sqlite3`:** Este pacote tem binding nativo em C++. O Dockerfile acima:
> - Instala `python3 make g++` no estágio de build (deps) para compilar o binding
> - Instala `libstdc++` no estágio runner para o runtime funcionar
> - Se der erro de compilação, tente `RUN npm rebuild better-sqlite3` após o COPY

### 5. Criar o docker-compose.yml

```yaml
services:
  deutschtutor:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_BASE_PATH: ${NEXT_PUBLIC_BASE_PATH:-/tutor}
    container_name: deutschtutor
    environment:
      - NODE_ENV=production
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH:-/tutor}
    volumes:
      - ./data:/app/data
    ports:
      - "127.0.0.1:8091:3000"
    networks:
      - perguntas_default
    restart: unless-stopped

networks:
  perguntas_default:
    external: true
    name: perguntas_default
```

**Detalhes importantes:**
- A porta `8091` foi escolhida para não conflitar com outros serviços (8087=deutschbruecke, 8090=ev1000)
- A rede `perguntas_default` é obrigatória — é por ela que o nginx se comunica com os containers
- O volume `./data:/app/data` persiste o banco SQLite entre rebuilds
- A `ANTHROPIC_API_KEY` é lida do `.env` no mesmo diretório

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
curl -s http://127.0.0.1:8091/tutor | head -20
```

### 7. Configurar o Nginx

Editar o arquivo:
```
~/samu-normas/repo/nginx/default.conf
```

#### 7a. Adicionar o upstream (junto com os outros upstreams, na seção de upstreams):

```nginx
upstream app_tutor {
    server deutschtutor:3000;
    keepalive 32;
}
```

#### 7b. Adicionar os location blocks (dentro do bloco `server { listen 443 ... }`, seguindo o padrão dos outros apps):

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
curl -sI https://mnrs.com.br/tutor
curl -s https://mnrs.com.br/tutor | head -20
curl -s https://mnrs.com.br/tutor/api/stats
```

Esperado:
- `/tutor` → HTML da página (dashboard)
- `/tutor/api/stats` → JSON com `{"vocabCount":0, ...}`

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

Se o build Docker falhar na compilação do `better-sqlite3`:

```bash
# No Dockerfile, estágio deps, verificar se python3/make/g++ estão presentes
# Alternativa: usar imagem base não-alpine (node:20-slim) que vem com gcc
```

### Nginx não resolve o upstream

O nginx precisa estar na mesma rede Docker que o container `deutschtutor`. Verificar:
```bash
docker inspect repo-nginx-1 --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
```

Se `perguntas_default` não aparece, o nginx precisa ser adicionado a essa rede no `docker-compose.prod.yml`:
```yaml
  nginx:
    networks:
      - default
      - scoreboard_net
      - perguntas_net
      # Adicionar se necessário (mas provavelmente já está via perguntas_net)
```

### API retorna 402 / credit balance

O Anthropic retorna erro 402 quando os créditos acabam. O app já trata isso com mensagem amigável. O usuário precisa recarregar créditos em https://console.anthropic.com/settings/billing

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
| Restart app | `docker compose -f ~/deutschtutor-pro/docker-compose.yml restart` |
| Reload nginx | `cd ~/samu-normas/repo && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload` |
| Test nginx config | `cd ~/samu-normas/repo && docker compose -f docker-compose.prod.yml exec nginx nginx -t` |
| Check status | `docker ps \| grep deutschtutor` |
| Shell no container | `docker exec -it deutschtutor sh` |
| Ver DB | `docker exec -it deutschtutor ls -la /app/data/` |
| Pull updates | `cd ~/deutschtutor-pro && git pull && docker compose build --no-cache && docker compose up -d` |

---

## Estrutura de Arquivos no Servidor (após deploy)

```
~/deutschtutor-pro/              ← Repo clonado
├── .env                         ← ANTHROPIC_API_KEY (NÃO comitar)
├── data/                        ← SQLite DB (volume Docker)
│   └── deutschtutor.db
├── Dockerfile                   ← Multi-stage build
├── docker-compose.yml           ← Service definition
├── next.config.ts               ← basePath: "/tutor"
├── src/                         ← Código-fonte
└── ...

~/samu-normas/repo/nginx/
└── default.conf                 ← Nginx config (adicionar upstream + location)
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
