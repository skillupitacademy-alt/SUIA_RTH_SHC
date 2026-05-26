# Enterprise Marketing Intelligence Platform

## Scope

This platform implements a governed, multi-brand marketing analytics system for:

- SUIA (`skillupitacademy`)
- RTH (`realtutorialhub`)

It is designed for:

- Next.js App Router marketing sites
- first-party server-side analytics ingestion
- multi-provider fan-out to GA4, GTM, Meta, and the internal warehouse
- funnel intelligence, lead scoring, and automation triggers
- deployment-safe brand isolation

## Folder Structure

```text
packages/marketing-site/src/
  config/
    analytics.ts
  components/
    analytics/GTMProvider.tsx
    Tracking/TrackingScripts.tsx
  lib/
    tracking.ts
    analytics/
      events.ts
      context.ts
      enrichment.ts
      tracker.ts
      funnel.ts
      lead-scoring.ts
      automation.ts
      observability.ts
      warehouse.ts
      providers/
        ga4.provider.ts
        gtm.provider.ts
        meta.provider.ts
        internal.provider.ts
        types.ts
      server/
        route.ts
        admin-route.ts
        pipeline.ts
      __tests__/
        marketing-intelligence.test.ts

apps/realtutorialhub-site/app/api/analytics/
  track/route.ts
  observability/route.ts

apps/skillupitacademy-site/app/api/analytics/
  track/route.ts
  observability/route.ts
```

## Phase Mapping

1. Event governance: `events.ts`
2. Unified SDK: `tracker.ts`, `providers/*`
3. Multi-brand config: `config/analytics.ts`
4. GTM architecture: `components/analytics/GTMProvider.tsx`
5. Metadata enrichment: `enrichment.ts`, `context.ts`
6. Server-side pipeline: `server/pipeline.ts`, `server/route.ts`
7. Funnel intelligence: `funnel.ts`
8. BigQuery warehouse contract: `warehouse.ts`
9. Lead scoring: `lead-scoring.ts`
10. Automation engine: `automation.ts`
11. Observability and governance: `observability.ts`, `server/admin-route.ts`
12. Deployment and DevOps: Cloud Build files, Dockerfiles, `scripts/deploy-direct.sh`

## Event Lifecycle

1. Browser component calls `trackEvent()` or domain helpers from `lib/tracking.ts`
2. Tracker builds browser context, enriches metadata, validates the schema, deduplicates, and fans out
3. Internal provider posts the normalized event to `/api/analytics/track`
4. Server pipeline validates again, rate-limits, deduplicates, and queues the event
5. Pipeline dispatches to:
   - GA4 Measurement Protocol
   - Meta Conversion API
   - internal warehouse stream
6. Pipeline also derives:
   - funnel progress
   - lead score
   - automation executions
   - observability counters

## BigQuery Warehouse Design

Dataset: `marketing_intelligence`

Primary tables:

- `fact_marketing_events`
- `fact_funnel_progress`
- `dim_marketing_sessions`
- `dim_marketing_users`
- `fact_lead_scores`
- `fact_marketing_automations`

Partitioning and retention:

- partition by `event_date`
- cluster by `brand_id`, `event_name`, `traffic_source`
- retain 730 days in the raw fact layer

Recommended modeling pattern:

- raw landing table from internal stream
- validated fact table for canonical events
- incremental session and user dimensions
- attribution mart for last-touch and first-touch reporting
- revenue mart for `checkout_started` and `payment_completed`

## Governance Rules

- All production events must be declared in `events.ts`
- Every event must carry a schema version
- Every event must resolve a `brandId`
- No ad platform IDs are hardcoded in application code
- Metadata enrichment happens centrally, not in component-local snippets
- Server-side ingestion is first-party and remains the source of truth

## Rollout Strategy

1. Deploy with `NEXT_PUBLIC_ANALYTICS_ENABLED=true` and provider IDs set only in staging
2. Validate `/api/analytics/track` and `/api/analytics/observability` for both brands
3. Verify dead-letter depth stays at zero during synthetic traffic
4. Enable production IDs brand-by-brand
5. Release GTM and Meta tags behind existing deployment process
6. Confirm warehouse row volume and provider delivery parity before widening traffic

## Migration Strategy

- Keep old CTA call sites importing `trackLead()` from `lib/tracking.ts`
- Route legacy event helpers into the governed tracker
- Add any new event name only by extending taxonomy first
- Migrate raw provider-specific calls to domain helpers incrementally

## Testing Strategy

- Type safety: `pnpm --filter @quiz/marketing-site type-check`
- Unit tests: analytics lifecycle tests under `src/lib/analytics/__tests__`
- Integration tests:
  - route contract for `/api/analytics/track`
  - route contract for `/api/analytics/observability`
  - provider fan-out smoke tests in staging
- Production checks:
  - GA4 receipt validation
  - Meta CAPI event delivery health
  - warehouse row count parity checks

## Monitoring Strategy

Track the following operational metrics:

- accepted events
- deduped events
- failed events
- provider failures
- validation failures
- dead-letter queue depth
- queue lag
- funnel completion rate by brand
- lead temperature distribution by source and campaign

## Failure Recovery Strategy

- If provider dispatch fails, retain event details in the dead-letter queue
- If a brand misconfiguration occurs, internal ingestion still persists the event lifecycle
- If third-party scripts are blocked client-side, server-side ingestion still receives internal events
- Roll back using existing Cloud Run revision rollback flow in `deploy-direct.sh`

## Required Environment Variables

RTH:

- `NEXT_PUBLIC_RTH_GA4_MEASUREMENT_ID`
- `NEXT_PUBLIC_RTH_META_PIXEL_ID`
- `NEXT_PUBLIC_RTH_GTM_CONTAINER_ID`
- `RTH_GA4_MEASUREMENT_API_SECRET`
- `RTH_META_CAPI_TOKEN`

SUIA:

- `NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID`
- `NEXT_PUBLIC_SUIA_META_PIXEL_ID`
- `NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID`
- `SUIA_GA4_MEASUREMENT_API_SECRET`
- `SUIA_META_CAPI_TOKEN`

Shared:

- `NEXT_PUBLIC_ANALYTICS_ENABLED`
- `NEXT_PUBLIC_ANALYTICS_ENV`
- `NEXT_PUBLIC_ANALYTICS_DEBUG`
- `ANALYTICS_ADMIN_TOKEN`

