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
ARG NEXT_PUBLIC_SUIA_META_PIXEL_ID
ENV NEXT_PUBLIC_SUIA_META_PIXEL_ID=$NEXT_PUBLIC_SUIA_META_PIXEL_ID
ARG NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID
ENV NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID
ARG NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID
ENV NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID=$NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID
ARG NEXT_PUBLIC_ANALYTICS_ENABLED
ENV NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED
ARG NEXT_PUBLIC_ANALYTICS_ENV
ENV NEXT_PUBLIC_ANALYTICS_ENV=$NEXT_PUBLIC_ANALYTICS_ENV
ARG NEXT_PUBLIC_SHC_CONTENT_BASE_URL
ENV NEXT_PUBLIC_SHC_CONTENT_BASE_URL=$NEXT_PUBLIC_SHC_CONTENT_BASE_URL
ARG MARKETING_CONTENT_API_BASE_URL
ENV MARKETING_CONTENT_API_BASE_URL=$MARKETING_CONTENT_API_BASE_URL
ARG NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT
ENV NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT=$NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT
RUN pnpm --filter @quiz/skillupitacademy-site build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /app/apps/skillupitacademy-site/.next/standalone ./
COPY --from=builder /app/apps/skillupitacademy-site/.next/static ./apps/skillupitacademy-site/.next/static
COPY --from=builder /app/apps/skillupitacademy-site/public ./apps/skillupitacademy-site/public
EXPOSE 3005
CMD ["node", "apps/skillupitacademy-site/server.js"]
