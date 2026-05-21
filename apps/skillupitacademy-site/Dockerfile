FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/skillupitacademy-site/package.json ./apps/skillupitacademy-site/
COPY packages/marketing-site/package.json ./packages/marketing-site/
RUN pnpm install --frozen-lockfile --filter @quiz/skillupitacademy-site...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/skillupitacademy-site/node_modules ./apps/skillupitacademy-site/node_modules
COPY --from=deps /app/packages/marketing-site/node_modules ./packages/marketing-site/node_modules
COPY . .
RUN pnpm --filter @quiz/skillupitacademy-site build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME=0.0.0.0
WORKDIR /app/apps/skillupitacademy-site
COPY --from=builder /app/apps/skillupitacademy-site/out ./out
COPY --from=builder /app/apps/skillupitacademy-site/server.mjs ./server.mjs
EXPOSE 3005
CMD ["node", "server.mjs"]
