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
COPY apps/skillup-web/package.json ./apps/skillup-web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db-people/package.json ./packages/db-people/
COPY packages/db-payment/package.json ./packages/db-payment/
COPY packages/db-placement/package.json ./packages/db-placement/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/skillup-web/node_modules ./apps/skillup-web/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db-people/node_modules ./packages/db-people/node_modules
COPY --from=deps /app/packages/db-payment/node_modules ./packages/db-payment/node_modules
COPY --from=deps /app/packages/db-placement/node_modules ./packages/db-placement/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY . .
RUN pnpm --filter @quiz/skillup-web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/skillup-web/.next/standalone ./
COPY --from=builder /app/apps/skillup-web/.next/static ./apps/skillup-web/.next/static
COPY --from=builder /app/apps/skillup-web/public ./apps/skillup-web/public
EXPOSE 3004
CMD ["node", "apps/skillup-web/server.js"]
