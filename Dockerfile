# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# better-sqlite3 tem binding nativo — precisa de build tools
RUN apk add --no-cache python3 make g++

ARG NEXT_PUBLIC_BASE_PATH=/tutor
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Providers are lazily instantiated at request time — no dummy key needed.
# Real keys are injected via docker-compose at runtime.

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
# Remove better-sqlite3 da lista ignoredBuiltDependencies para compilar o binding nativo
RUN sed -i '/- better-sqlite3/d' pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY . .
# Re-apply sed pois COPY . . sobrescreve pnpm-workspace.yaml
RUN sed -i '/- better-sqlite3/d' pnpm-workspace.yaml
# pnpm rebuild não funciona com ignoredBuiltDependencies; usar npm rebuild direto
RUN cd node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3 && npx --yes node-gyp rebuild
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
