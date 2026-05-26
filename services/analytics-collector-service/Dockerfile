FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/analytics-collector-service/package.json ./services/analytics-collector-service/
COPY packages/marketing-site/package.json ./packages/marketing-site/
RUN pnpm install --frozen-lockfile --filter @quiz/analytics-collector-service...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/analytics-collector-service/node_modules ./services/analytics-collector-service/node_modules
COPY --from=deps /app/packages/marketing-site/node_modules ./packages/marketing-site/node_modules
COPY . .
RUN pnpm --filter @quiz/analytics-collector-service build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 8080
CMD ["/app/services/analytics-collector-service/node_modules/.bin/tsx", "--tsconfig", "services/analytics-collector-service/tsconfig.json", "services/analytics-collector-service/src/index.ts"]
