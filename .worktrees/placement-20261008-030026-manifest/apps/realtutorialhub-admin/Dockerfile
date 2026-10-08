FROM public.ecr.aws/docker/library/node:20-alpine AS base
RUN apk add --no-cache \
  libc6-compat \
  python3 \
  make \
  g++
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/realtutorialhub-admin/package.json ./apps/realtutorialhub-admin/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/db-tutorial/package.json ./packages/db-tutorial/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/observability/package.json ./packages/observability/
COPY packages/ui/package.json ./packages/ui/
COPY packages/events/package.json ./packages/events/
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_APP_URL
ARG NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEB_APP_URL=$NEXT_PUBLIC_WEB_APP_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
RUN pnpm --filter @quiz/realtutorialhub-admin build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/realtutorialhub-admin/.next/standalone ./
COPY --from=builder /app/apps/realtutorialhub-admin/.next/static ./apps/realtutorialhub-admin/.next/static
COPY --from=builder /app/apps/realtutorialhub-admin/public ./apps/realtutorialhub-admin/public
COPY --from=builder /app/docs ./docs
EXPOSE 3002
CMD ["node", "apps/realtutorialhub-admin/server.js"]
