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
COPY packages/auth/package.json ./packages/auth/
COPY packages/db-tutorial/package.json ./packages/db-tutorial/
COPY packages/events/package.json ./packages/events/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api-server/node_modules ./apps/api-server/node_modules
COPY --from=deps /app/packages/api-client/node_modules ./packages/api-client/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/db-tutorial/node_modules ./packages/db-tutorial/node_modules
COPY --from=deps /app/packages/events/node_modules ./packages/events/node_modules
COPY --from=deps /app/packages/observability/node_modules ./packages/observability/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_APP_URL
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG INTERNAL_GATEWAY_SECRET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEB_APP_URL=$NEXT_PUBLIC_WEB_APP_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV INTERNAL_GATEWAY_SECRET=$INTERNAL_GATEWAY_SECRET
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
