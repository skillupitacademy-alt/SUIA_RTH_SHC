FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/skillhubcore-service/package.json ./services/skillhubcore-service/
COPY packages/types/package.json ./packages/types/
COPY packages/auth/package.json ./packages/auth/
COPY packages/events/package.json ./packages/events/
COPY packages/db-people/package.json ./packages/db-people/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/skillhubcore-service/node_modules ./services/skillhubcore-service/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/events/node_modules ./packages/events/node_modules
COPY --from=deps /app/packages/db-people/node_modules ./packages/db-people/node_modules
COPY . .
RUN pnpm --filter @quiz/skillhubcore-service build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/skillhubcore-service ./services/skillhubcore-service
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["/app/services/skillhubcore-service/node_modules/.bin/tsx", "--tsconfig", "services/skillhubcore-service/tsconfig.json", "services/skillhubcore-service/src/index.ts"]
