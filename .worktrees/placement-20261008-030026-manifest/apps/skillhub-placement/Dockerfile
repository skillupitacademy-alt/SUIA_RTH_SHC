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
COPY apps/skillhub-placement/package.json ./apps/skillhub-placement/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db-placement/package.json ./packages/db-placement/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/skillhub-placement/node_modules ./apps/skillhub-placement/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db-placement/node_modules ./packages/db-placement/node_modules
COPY . .
RUN pnpm --filter @quiz/skillhub-placement build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV PORT=3008
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/skillhub-placement/.next/standalone ./
COPY --from=builder /app/apps/skillhub-placement/.next/static ./apps/skillhub-placement/.next/static
EXPOSE 3008
CMD ["node", "apps/skillhub-placement/server.js"]
