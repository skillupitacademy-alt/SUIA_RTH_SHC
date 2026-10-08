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
COPY apps/faculty-app/package.json ./apps/faculty-app/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db-people/package.json ./packages/db-people/
COPY packages/events/package.json ./packages/events/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/faculty-app/node_modules ./apps/faculty-app/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db-people/node_modules ./packages/db-people/node_modules
COPY --from=deps /app/packages/events/node_modules ./packages/events/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY . .
RUN pnpm --filter @quiz/faculty-app build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3006
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/faculty-app/.next/standalone ./
COPY --from=builder /app/apps/faculty-app/.next/static ./apps/faculty-app/.next/static
COPY --from=builder /app/apps/faculty-app/public ./apps/faculty-app/public
EXPOSE 3006
CMD ["node", "apps/faculty-app/server.js"]
