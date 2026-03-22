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
COPY apps/skillup-admin/package.json ./apps/skillup-admin/
COPY packages/auth/package.json ./packages/auth/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/skillup-admin/node_modules ./apps/skillup-admin/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY . .
RUN pnpm --filter @quiz/skillup-admin build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/skillup-admin/.next/standalone ./
COPY --from=builder /app/apps/skillup-admin/.next/static ./apps/skillup-admin/.next/static
COPY --from=builder /app/apps/skillup-admin/public ./apps/skillup-admin/public
EXPOSE 3005
CMD ["node", "apps/skillup-admin/server.js"]
