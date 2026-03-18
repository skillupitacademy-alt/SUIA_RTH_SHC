FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-app/package.json ./apps/admin-app/
COPY packages/db/package.json ./packages/db/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/types/package.json ./packages/types/
COPY packages/observability/package.json ./packages/observability/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin-app/node_modules ./apps/admin-app/node_modules
COPY . .
RUN pnpm --filter @quiz/admin-app build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/admin-app/.next/standalone ./
COPY --from=builder /app/apps/admin-app/.next/static ./apps/admin-app/.next/static
COPY --from=builder /app/apps/admin-app/public ./apps/admin-app/public
EXPOSE 3002
CMD ["node", "apps/admin-app/server.js"]
