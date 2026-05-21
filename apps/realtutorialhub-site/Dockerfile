FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/realtutorialhub-site/package.json ./apps/realtutorialhub-site/
COPY packages/marketing-site/package.json ./packages/marketing-site/
RUN pnpm install --frozen-lockfile --filter @quiz/realtutorialhub-site...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/realtutorialhub-site/node_modules ./apps/realtutorialhub-site/node_modules
COPY --from=deps /app/packages/marketing-site/node_modules ./packages/marketing-site/node_modules
COPY . .
RUN pnpm --filter @quiz/realtutorialhub-site build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
WORKDIR /app/apps/realtutorialhub-site
COPY --from=builder /app/apps/realtutorialhub-site/out ./out
COPY --from=builder /app/apps/realtutorialhub-site/server.mjs ./server.mjs
EXPOSE 3004
CMD ["node", "server.mjs"]
