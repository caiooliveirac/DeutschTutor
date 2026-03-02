# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# better-sqlite3 tem binding nativo — precisa de build tools
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile


FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_BASE_PATH=/tutor
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# better-sqlite3 precisa de build tools no builder também (drizzle-kit gera SQL)
RUN apk add --no-cache python3 make g++

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
