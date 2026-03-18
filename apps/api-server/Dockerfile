FROM node:20-alpine AS base
RUN apk add --no-cache \
  libc6-compat \
  python3 \
  make \
  g++
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/db/package.json ./packages/db/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/types/package.json ./packages/types/
COPY packages/observability/package.json ./packages/observability/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api-server/node_modules ./apps/api-server/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/api-client/node_modules ./packages/api-client/node_modules
COPY --from=deps /app/packages/observability/node_modules ./packages/observability/node_modules
COPY . .
RUN pnpm --filter @quiz/api-server build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/api-server/.next/standalone ./
COPY --from=builder /app/apps/api-server/.next/static ./apps/api-server/.next/static
RUN mkdir -p ./apps/api-server/public
EXPOSE 3000
CMD ["node", "apps/api-server/server.js"]
