# syntax=docker/dockerfile:1.7
# =======================================================
# apps/web — TanStack Start (Vite + Nitro) on Bun.
# Build context MUST be the repo root:
#     docker build -f apps/web/Dockerfile -t nrc-full/web .
# =======================================================

ARG BUN_VERSION=1.3.10

# -------------------------------------------------------
# 1. Base
# -------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app
ENV CI=true \
    HUSKY=0
RUN apk add --no-cache tini

# -------------------------------------------------------
# 2. Deps — install ALL workspace deps (devDeps needed for build).
# -------------------------------------------------------
FROM base AS deps
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json       ./apps/web/
COPY apps/server/package.json    ./apps/server/
COPY packages/api/package.json   ./packages/api/
COPY packages/db/package.json    ./packages/db/
COPY packages/env/package.json   ./packages/env/
COPY packages/config/package.json ./packages/config/
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# -------------------------------------------------------
# 3. Builder — vite build produces dist/{client,server}.
# -------------------------------------------------------
FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    bun run build --filter=web

# -------------------------------------------------------
# 4. Runner — only the built artefact + prod runtime deps.
# -------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app

COPY --from=builder --chown=bun:bun /app/apps/web/dist          ./dist
COPY --from=builder --chown=bun:bun /app/apps/web/package.json  ./package.json
COPY --from=builder --chown=bun:bun /app/node_modules           ./node_modules

USER bun
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "run", "dist/server/server.js"]
