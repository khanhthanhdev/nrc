# syntax=docker/dockerfile:1.7
# =======================================================
# apps/server — monorepo-aware, multi-stage Bun image.
# Build context MUST be the repo root:
#     docker build -f apps/server/Dockerfile -t nrc-full/server .
# =======================================================

ARG BUN_VERSION=1.3.10

# -------------------------------------------------------
# 1. Base — pinned, slim, with tini for proper PID 1.
# -------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app
ENV CI=true \
    HUSKY=0 \
    NODE_ENV=production
RUN apk add --no-cache tini

# -------------------------------------------------------
# 2. Deps — install workspace deps with BuildKit cache.
# -------------------------------------------------------
FROM base AS deps
# Copy only manifests first → maximises layer cache.
COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json    ./apps/server/
COPY apps/web/package.json       ./apps/web/
COPY packages/api/package.json   ./packages/api/
COPY packages/db/package.json    ./packages/db/
COPY packages/env/package.json   ./packages/env/
COPY packages/config/package.json ./packages/config/
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# -------------------------------------------------------
# 3. Builder — compile the server bundle with tsdown.
# -------------------------------------------------------
FROM deps AS builder
ENV NODE_ENV=production
COPY . .
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    bun run build --filter=server

# -------------------------------------------------------
# 4. Runner — minimal image, non-root, signal-safe.
# -------------------------------------------------------
FROM base AS runner
ENV PORT=3000 \
    HOST=0.0.0.0

# `bun` user already exists in the official image (uid/gid 1000).
WORKDIR /app

# Bundle is self-contained (tsdown noExternal: @nrc-full/*) but we
# still need runtime node_modules for third-party deps.
COPY --from=builder --chown=bun:bun /app/apps/server/dist        ./dist
COPY --from=builder --chown=bun:bun /app/apps/server/package.json ./package.json
COPY --from=builder --chown=bun:bun /app/node_modules            ./node_modules

USER bun
EXPOSE 3000

# tini reaps zombies & forwards SIGTERM cleanly.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "run", "dist/index.mjs"]
