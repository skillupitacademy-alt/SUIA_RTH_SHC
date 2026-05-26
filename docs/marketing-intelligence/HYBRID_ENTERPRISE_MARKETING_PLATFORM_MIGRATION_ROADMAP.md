# Hybrid Enterprise Marketing Platform Migration Roadmap

## Purpose

This document translates the enterprise audit into a repo-specific execution roadmap for:

- `SUIA`
- `RTH`
- `SHC`

It is written for actual execution inside this repository, not as a greenfield architecture exercise.

## Scope

Move the current marketing system from:

- brochure-oriented static/export-capable brand sites

To:

- ISR-capable hybrid Next runtime
- edge-aware personalization and experiment hinting
- SHC-centered control plane
- external first-party analytics ingestion
- governed content platform
- warehouse-first intelligence delivery

## Implemented Tranche

The following items from this roadmap are now implemented in the repo:

- brand sites now default to `standalone` Next runtime instead of hard static export, while retaining an opt-in export fallback through `NEXT_OUTPUT_MODE=export`
- home pages and course pages now use explicit ISR revalidation boundaries
- both brand apps now have `proxy.ts` middleware for lightweight experiment, attribution, and device hint propagation
- both brand proxies now attempt to consume SHC control-plane data for experiment and personalization hinting before falling back locally
- SHC service now exposes public marketing bootstrap endpoints under `/public/marketing/*`
- shared marketing package now has governed content contracts, fallback snapshots, and server-side loaders in [packages/marketing-site/src/content](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/content)
- brand layouts now hydrate a `MarketingContentProvider` from server-fetched content snapshots, removing nav/contact/footer ownership from direct hardcoded imports
- course catalog and course detail delivery now use transport-safe snapshots instead of passing live icon components through the runtime boundary
- a standalone [analytics-collector-service](/d:/onlinewebsites/quiz-platform/services/analytics-collector-service) now exists with dedicated Cloud Build and Docker assets
- SHC admin now has a marketing governance surface at [marketing page](/d:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/marketing/page.tsx)

Still pending after this tranche:

- SHC-admin editing workflows for governed marketing content
- deployment-script rollout wiring for the standalone analytics collector
- warehouse/dbt/AI orchestration phases later in the roadmap

## Current Repo Map

### Marketing Presentation Layer

- [apps/realtutorialhub-site](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site)
- [apps/skillupitacademy-site](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site)
- shared package: [packages/marketing-site](/d:/onlinewebsites/quiz-platform/packages/marketing-site)

### Control Plane and Shared Services

- SHC admin UI: [apps/skillhubcore-admin](/d:/onlinewebsites/quiz-platform/apps/skillhubcore-admin)
- SHC service: [services/skillhubcore-service](/d:/onlinewebsites/quiz-platform/services/skillhubcore-service)
- central API runtime: [apps/api-server](/d:/onlinewebsites/quiz-platform/apps/api-server)
- gateway: [services/api-gateway](/d:/onlinewebsites/quiz-platform/services/api-gateway)

### Data Layer

- brand DB packages:
  - [packages/db-rth](/d:/onlinewebsites/quiz-platform/packages/db-rth)
  - [packages/db-skillup](/d:/onlinewebsites/quiz-platform/packages/db-skillup)
- shared/governance:
  - [packages/db-people](/d:/onlinewebsites/quiz-platform/packages/db-people)
  - [packages/db-tutorial](/d:/onlinewebsites/quiz-platform/packages/db-tutorial)
  - [packages/db-payment](/d:/onlinewebsites/quiz-platform/packages/db-payment)
  - [packages/db-placement](/d:/onlinewebsites/quiz-platform/packages/db-placement)

### Deployment Layer

- brand site Cloud Build:
  - [cloudbuild.realtutorialhub-site.yaml](/d:/onlinewebsites/quiz-platform/cloudbuild.realtutorialhub-site.yaml)
  - [cloudbuild.skillupitacademy-site.yaml](/d:/onlinewebsites/quiz-platform/cloudbuild.skillupitacademy-site.yaml)
- main deployment script:
  - [scripts/deploy-direct.sh](/d:/onlinewebsites/quiz-platform/scripts/deploy-direct.sh)

## Phase 1: Repo Discovery and Current-State Report

### Findings

#### Rendering Graph

- `apps/realtutorialhub-site` and `apps/skillupitacademy-site` currently build with normal `next build` and run behind `server.mjs`.
- Their `next.config.mjs` files were previously `output: "export"` and are now build-safe for hybrid evolution after the recent fixes.
- Public route inventory is intentionally small:
  - home pages
  - `/courses/[slug]`
  - certificate utilities

#### Content Ownership Graph

- marketing content is largely embedded in TypeScript modules under:
  - [packages/marketing-site/src/lib](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib)
  - especially course content and nav/footer/contact structures
- brand apps mostly compose shared package outputs rather than own content logic

#### Analytics Flow Graph

- browser tracking and intelligence foundations live in:
  - [packages/marketing-site/src/lib/analytics](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/analytics)
- current public brand sites do not host site-local analytics ingestion routes
- ingestion now depends on explicitly configured external endpoints:
  - `NEXT_PUBLIC_RTH_ANALYTICS_ENDPOINT`
  - `NEXT_PUBLIC_SUIA_ANALYTICS_ENDPOINT`

#### Deployment Graph

- brand sites build independently
- brand sites deploy separately from API and SHC
- `deploy-direct.sh` already sequences:
  - API
  - BFFs
  - SHC admin
  - brand marketing sites

### ISR / Middleware / Edge Blockers

#### Blockers Identified

1. Hardcoded content in `packages/marketing-site` makes ISR less valuable until content is externalized.
2. Current brand-site route surface has no request-time middleware/proxy yet.
3. Analytics docs still contain stale references to site-local ingestion routes.
4. Brand deployment is still framed around “static site” operational assumptions.
5. SHC APIs for campaign registry, experiment registry, content publishing, and personalization hints do not yet exist.

#### Hydration-Risk Components

Primary areas requiring care:

- [packages/marketing-site/src/components/analytics/GTMProvider.tsx](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/components/analytics/GTMProvider.tsx)
- particle-heavy and animation-heavy client components
- route-sensitive client components using navigation hooks
- personalization overlays that may diverge from SEO shell HTML

### Dependency Impact Matrix

| Area | Directly Impacted By Migration |
|---|---|
| `apps/realtutorialhub-site` | next config, runtime, route caching, proxy/middleware, deployment |
| `apps/skillupitacademy-site` | same as RTH |
| `packages/marketing-site` | data loading, content source, analytics endpoint strategy, personalization overlays |
| `apps/skillhubcore-admin` | new control plane APIs and content/governance consoles |
| `services/skillhubcore-service` | campaign, content, flags, experiment, consent, recommendation APIs |
| `apps/api-server` | collector integration, revalidation hooks, personalization APIs, analytics governance |
| `scripts/deploy-direct.sh` | rollout order and runtime env changes |

## Target Architecture

```text
                   ┌──────────────────────────────┐
                   │ CDN / Edge / Worker Layer    │
                   │ geo, bot, UTM, variant hints │
                   └──────────────┬───────────────┘
                                  │
                  ┌───────────────▼────────────────┐
                  │ Hybrid Next Brand Runtime      │
                  │ RTH site / SUIA site           │
                  │ static+ISR shell               │
                  └───────────────┬────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐     ┌──────────▼─────────┐    ┌──────────▼──────────┐
│ SHC Control    │     │ Analytics Collector │    │ Content / Publish   │
│ feature flags  │     │ ingestion + queue   │    │ course+campaign API │
│ experiments    │     │ identity + consent  │    │ revalidation hooks  │
│ consent rules  │     └──────────┬─────────┘    └──────────┬──────────┘
└───────┬────────┘                │                           │
        │                 ┌───────▼────────┐          ┌──────▼──────────┐
        │                 │ BigQuery /     │          │ Brand / shared  │
        │                 │ feature marts  │          │ domain OLTP DBs │
        │                 └────────────────┘          └─────────────────┘
```

## Execution Principles

1. No big-bang rendering switch.
2. No intelligence source-of-truth logic in brand frontends.
3. No new site-local ingestion APIs inside brand sites.
4. Move control and governance to SHC first, then activate runtime consumption.
5. Convert page rendering one route family at a time.
6. Introduce middleware/proxy only after explicit observability and kill switches exist.

## PR Breakdown

### PR 1: Documentation and Contract Corrections

Goal:

- eliminate stale static-export and site-local ingestion assumptions

Files:

- [docs/marketing-intelligence/ENTERPRISE_MARKETING_INTELLIGENCE_PLATFORM.md](/d:/onlinewebsites/quiz-platform/docs/marketing-intelligence/ENTERPRISE_MARKETING_INTELLIGENCE_PLATFORM.md)
- [docs/marketing-intelligence/MARKETING_SITE_ENTERPRISE_ARCHITECTURE_AUDIT.md](/d:/onlinewebsites/quiz-platform/docs/marketing-intelligence/MARKETING_SITE_ENTERPRISE_ARCHITECTURE_AUDIT.md)
- add this roadmap

Deliverables:

- current-state rendering truth
- current analytics topology truth
- migration guardrails

Rollback:

- none needed

### PR 2: Runtime Capability Enablement

Goal:

- make both brand sites ISR-capable without changing page behavior yet

Files:

- [apps/realtutorialhub-site/next.config.mjs](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/next.config.mjs)
- [apps/skillupitacademy-site/next.config.mjs](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/next.config.mjs)
- [apps/realtutorialhub-site/server.mjs](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/server.mjs)
- [apps/skillupitacademy-site/server.mjs](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/server.mjs)
- build/deploy files

Required changes:

- ensure no `output: "export"` remains
- ensure server runtime can serve ISR outputs correctly
- preserve static caching headers for unchanged routes
- add environment kill switch:
  - `NEXT_PUBLIC_MARKETING_RUNTIME_MODE=static|hybrid`

Implementation notes:

- keep page code behavior unchanged
- treat this as infrastructure preparation

Rollback:

- switch runtime mode flag to `static`
- revert server handler logic

### PR 3: Edge Hinting Layer

Goal:

- add request-time hinting without changing core page rendering

Files to create:

- [apps/realtutorialhub-site/proxy.ts](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/proxy.ts)
- [apps/skillupitacademy-site/proxy.ts](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/proxy.ts)

Reason:

- this repo already uses `proxy.ts` in [apps/skillhub-placement/src/proxy.ts](/d:/onlinewebsites/quiz-platform/apps/skillhub-placement/src/proxy.ts), so follow the same project convention

Responsibilities:

- geo detection
- UTM capture normalization
- campaign hint header/cookie
- device class hint
- bot filtering
- abuse throttling hint fields
- experiment hint placeholder hook

Do not do in this PR:

- full HTML personalization
- server-side experiment mutation

Output contract:

- request headers and cookies only
- no business logic duplication

Rollback:

- matcher off
- proxy returns `NextResponse.next()` only

### PR 4: SHC Control Plane API Expansion

Goal:

- make SHC the authority for intelligence configuration

Primary files/folders:

- `services/skillhubcore-service/src/modules/marketing-governance/*`
- `services/skillhubcore-service/src/modules/experiments/*`
- `services/skillhubcore-service/src/modules/campaigns/*`
- `services/skillhubcore-service/src/modules/consent/*`
- `services/skillhubcore-service/src/modules/personalization/*`
- `services/skillhubcore-service/src/modules/recommendations/*`
- route registration in [services/skillhubcore-service/src/index.ts](/d:/onlinewebsites/quiz-platform/services/skillhubcore-service/src/index.ts)

Admin UI surfaces to add under:

- [apps/skillhubcore-admin/src/app/(admin)](/d:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin))

New pages:

- `campaigns/page.tsx`
- `experiments/page.tsx`
- `feature-flags/page.tsx`
- `consent-governance/page.tsx`
- `personalization/page.tsx`
- `marketing-content/page.tsx`

Data ownership:

- definitions in SHC
- event facts in warehouse
- runtime hints consumed by brand sites

Rollback:

- hide admin pages behind flag
- leave existing brand behavior unchanged

### PR 5: Content Platform Foundations

Goal:

- remove content as a TypeScript constant dependency for future changes

Current hardcoded ownership to audit and migrate:

- [packages/marketing-site/src/lib/CoursesCardData.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/CoursesCardData.ts)
- [packages/marketing-site/src/lib/ContactData.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/ContactData.ts)
- [packages/marketing-site/src/lib/FooterData.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/FooterData.ts)
- [packages/marketing-site/src/lib/NavBarData.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/NavBarData.ts)
- [packages/marketing-site/src/lib/courses](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/courses)

Implementation target:

- SHC-owned content definitions and brand overrides in shared DB
- publishable content records
- cacheable read API
- preview and publish state

Recommended storage:

- content and version metadata in `db-tutorial` or a new SHC marketing content schema
- do not store as brand-local DB truth

New APIs:

- `GET /marketing/content/:brand/:page`
- `GET /marketing/course/:brand/:slug`
- `POST /marketing/publish`
- `POST /marketing/revalidate`

Brand app migration step:

- create loaders in `packages/marketing-site/src/lib/content-loaders/*`
- initially dual-read:
  - API if enabled
  - hardcoded fallback if disabled

Rollback:

- fallback to existing static constants

### PR 6: External Analytics Collector Service

Goal:

- formalize ingestion outside static/hybrid brand runtimes

Create:

- `services/analytics-collector-service/`

Suggested layout:

```text
services/analytics-collector-service/
  src/
    index.ts
    app.ts
    routes/
      ingest.route.ts
      observability.route.ts
      health.route.ts
    modules/
      ingestion/
      consent/
      identity/
      attribution/
      queue/
      providers/
```

Refactor source reuse from:

- [packages/marketing-site/src/lib/analytics/server/pipeline.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/analytics/server/pipeline.ts)
- [packages/marketing-site/src/lib/analytics/server/route.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/analytics/server/route.ts)

Strategy:

- move server-only analytics pipeline logic out of brand package into service or shared server package
- keep browser tracker in `packages/marketing-site`
- point brand env vars to collector domain

Deployment:

- Cloud Run service
- independent scale and rollout

Rollback:

- disable internal provider fan-out via feature flag

### PR 7: ISR and Route Conversion

Goal:

- convert public pages to explicit hybrid rendering strategies

#### Homepage

Files:

- [apps/realtutorialhub-site/app/page.tsx](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/app/page.tsx)
- [apps/skillupitacademy-site/app/page.tsx](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/app/page.tsx)
- [packages/marketing-site/src/MarketingHome.tsx](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/MarketingHome.tsx)

Target:

- ISR page shell
- client-hydrated personalization modules
- optional edge hints from cookies/headers

#### Course Pages

Files:

- [apps/realtutorialhub-site/app/courses/[slug]/page.tsx](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/app/courses/[slug]/page.tsx)
- [apps/skillupitacademy-site/app/courses/[slug]/page.tsx](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/app/courses/[slug]/page.tsx)
- [packages/marketing-site/src/course-page.tsx](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/course-page.tsx)

Target:

- ISR with content API read
- optional recommendation/CTA overlay fetched client-side

Add:

- page-level `revalidate`
- explicit cache boundaries

### PR 8: Personalization Runtime

Goal:

- safely add adaptive marketing without altering SEO shell stability

New shared modules:

- `packages/marketing-site/src/lib/personalization/client.ts`
- `packages/marketing-site/src/lib/personalization/schema.ts`
- `packages/marketing-site/src/components/personalization/*`

API ownership:

- SHC returns small, cache-safe payloads:
  - CTA variant
  - hero message variant
  - region/legal copy
  - recommendation slot payload

Rule:

- server-render stable HTML first
- hydrate only bounded slots

Rollback:

- personalization components return defaults

### PR 9: Feature Flags and Experiments Operationalization

Goal:

- connect existing package abstractions to SHC-owned truth

Current package layer:

- [packages/marketing-site/src/lib/feature-flags](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/feature-flags)

Work:

- replace local/static flag assumptions with SHC-backed registry fetch
- use edge hint for assignment seed
- write experiment exposure events to collector

New files:

- `packages/marketing-site/src/lib/experiments/*`
- SHC APIs and admin pages

Rollback:

- default all flags to control

### PR 10: Brand DB Rationalization

Goal:

- reduce duplicated brand identity ownership

Current duplication:

- [packages/db-rth/src/schema/users.ts](/d:/onlinewebsites/quiz-platform/packages/db-rth/src/schema/users.ts)
- [packages/db-skillup/src/schema/users.ts](/d:/onlinewebsites/quiz-platform/packages/db-skillup/src/schema/users.ts)
- shared people truth already exists in [packages/db-people/src/schema](/d:/onlinewebsites/quiz-platform/packages/db-people/src/schema)

Execution:

1. inventory every API dependency on brand-local user tables
2. introduce adapter layer:
   - `apps/api-server/src/modules/identity-bridge/*`
3. move new identity/governance writes to SHC-owned people authority
4. treat brand DB user data as compatibility mirrors during migration

Do not:

- attempt immediate destructive removal

Rollback:

- stop sync consumers
- continue reading brand DB mirrors

### PR 11: Warehouse Expansion

Goal:

- make intelligence downstream truly warehouse-first

Add:

- dbt or SQL transformation repo/folder
- BigQuery marts for:
  - attribution
  - journeys
  - lead scoring
  - recommendations
  - experiments

Suggested repo area:

- `warehouse/`
- or `analytics/warehouse/`

Suggested structure:

```text
warehouse/
  models/
    staging/
    marts/marketing/
    marts/attribution/
    marts/identity/
    marts/ai_features/
  tests/
  docs/
```

Rollback:

- warehouse models are additive; disable downstream consumers

### PR 12: AI Orchestration in SHC

Goal:

- serve model outputs from SHC, not from brand site runtime

APIs:

- recommendations
- lead-quality score access
- retention segment
- campaign audience segment

Data path:

- warehouse features
- optional cache/vector store
- SHC inference API

Brand usage:

- consume outputs in lightweight, bounded slots only

### PR 13: Observability Hardening

Goal:

- make hybrid behavior observable before full rollout

Metrics required:

- ISR revalidation success/failure
- proxy execution volume and latency
- hint assignment rates
- cache hit ratio
- personalization API latency
- collector throughput
- dead-letter depth
- experiment exposure count

Files to touch:

- [packages/observability](/d:/onlinewebsites/quiz-platform/packages/observability)
- collector service
- SHC services
- deployment scripts for health gates

### PR 14: Deployment Evolution

Goal:

- align Cloud Build and runtime topology to hybrid delivery

Files:

- [cloudbuild.realtutorialhub-site.yaml](/d:/onlinewebsites/quiz-platform/cloudbuild.realtutorialhub-site.yaml)
- [cloudbuild.skillupitacademy-site.yaml](/d:/onlinewebsites/quiz-platform/cloudbuild.skillupitacademy-site.yaml)
- [scripts/deploy-direct.sh](/d:/onlinewebsites/quiz-platform/scripts/deploy-direct.sh)
- brand Dockerfiles

Required changes:

- add collector deployment
- add SHC control-plane rollout dependency
- add ISR/runtime env contracts
- add feature-flag rollback path
- split content publish from app deploy where possible

## Exact File-Level Change List

### Brand Apps

- [apps/realtutorialhub-site/next.config.mjs](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/next.config.mjs)
- [apps/skillupitacademy-site/next.config.mjs](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/next.config.mjs)
- [apps/realtutorialhub-site/proxy.ts](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/proxy.ts)
- [apps/skillupitacademy-site/proxy.ts](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/proxy.ts)
- [apps/realtutorialhub-site/app/page.tsx](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/app/page.tsx)
- [apps/skillupitacademy-site/app/page.tsx](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/app/page.tsx)
- [apps/realtutorialhub-site/app/courses/[slug]/page.tsx](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/app/courses/[slug]/page.tsx)
- [apps/skillupitacademy-site/app/courses/[slug]/page.tsx](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/app/courses/[slug]/page.tsx)
- [apps/realtutorialhub-site/server.mjs](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-site/server.mjs)
- [apps/skillupitacademy-site/server.mjs](/d:/onlinewebsites/quiz-platform/apps/skillupitacademy-site/server.mjs)

### Shared Marketing Package

- [packages/marketing-site/src/MarketingHome.tsx](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/MarketingHome.tsx)
- [packages/marketing-site/src/course-page.tsx](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/course-page.tsx)
- [packages/marketing-site/src/config/analytics.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/config/analytics.ts)
- [packages/marketing-site/src/lib/tracking.ts](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/tracking.ts)
- [packages/marketing-site/src/lib/analytics](/d:/onlinewebsites/quiz-platform/packages/marketing-site/src/lib/analytics)
- add `lib/content-loaders/*`
- add `lib/personalization/*`
- add `lib/experiments/*`

### SHC Service

- [services/skillhubcore-service/src/index.ts](/d:/onlinewebsites/quiz-platform/services/skillhubcore-service/src/index.ts)
- add modules for:
  - campaigns
  - experiments
  - feature flags
  - consent governance
  - personalization rules
  - recommendation orchestration
  - marketing content

### SHC Admin

- [apps/skillhubcore-admin/src/app/(admin)](/d:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin))
- add operational pages for:
  - campaigns
  - experiments
  - flags
  - consent
  - content publishing
  - personalization

### Collector Service

- create `services/analytics-collector-service/*`

### Deployment

- [scripts/deploy-direct.sh](/d:/onlinewebsites/quiz-platform/scripts/deploy-direct.sh)
- brand Cloud Build files
- collector build config

## Rollout Sequence

1. Documentation and contract cleanup
2. Runtime capability enablement
3. Edge hinting with no behavior changes
4. SHC control plane APIs
5. Content platform dual-read
6. External collector deployment
7. Homepage and course-page ISR conversion
8. Personalization slot rollout behind flags
9. Experimentation activation
10. DB rationalization adapters
11. Warehouse and AI orchestration expansion
12. Full observability hardening

## Rollback Strategy

### Rendering Rollback

- feature flag all dynamic modules
- keep default static shell data path
- disable proxy matcher or return passthrough only

### Control Plane Rollback

- SHC APIs additive only at first
- keep package-level defaults

### Content Rollback

- dual-read strategy:
  - content API primary
  - TypeScript constants fallback

### Collector Rollback

- disable internal provider or set endpoint env empty

### Personalization Rollback

- static default CTA/message
- remove hint consumption without changing route output

## Observability Gates Before Each Phase

Before promoting any hybrid/runtime phase:

- build success in both brand apps
- static page count unchanged unless intentional
- Lighthouse baseline within agreed threshold
- analytics event parity test
- no increase in hydration warnings
- edge/proxy latency dashboard green
- collector health and dead-letter depth green

## Final Recommendation

Do not attempt this as a single migration branch.

The correct enterprise execution order in this repo is:

1. establish SHC control-plane truth
2. establish external collector truth
3. keep brand frontends thin and cacheable
4. convert rendering to ISR/hybrid only where it unlocks real business value
5. move content and governance out of code constants and into managed services

That sequence preserves SEO, reduces rollout risk, and aligns the repo with the intelligence architecture it is already trying to become.
