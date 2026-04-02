# Deployment Status Matrix

This is the canonical deployment planning file. Append future deployment-related notes here only.
It is based on the current repository contents and the active `.kiro` architecture docs.
It does not claim to verify live GCP or Cloudflare resources.

## Priority Sequence

1. Finalize the host/domain map and gateway split.
2. Verify and store production secrets and environment variables.
3. Confirm GCP Cloud Run services and images build/deploy cleanly.
4. Confirm Cloudflare DNS and Worker routing.
5. Confirm GitHub Actions and deployment automation.
6. Run the final end-to-end go-live gate.

## Legend

- `Exists` = present in the repo/docs and usable as a starting point
- `Missing` = not present or not aligned with the target architecture
- `Needs cloud-side confirmation` = cannot be verified from local repo contents alone

## Canonical Host / Route Map

| Host | Purpose | Target platform | Route / behavior |
|---|---|---|---|
| `user.realtutorialhub.com` | RTH user portal | GCP Cloud Run | Login, signup, profile, dashboard |
| `admin.realtutorialhub.com` | RTH admin portal | GCP Cloud Run | Admin UI and account tools |
| `api.realtutorialhub.com` | RTH auth gateway | Cloudflare Worker | `/auth/*` to RTH auth, other traffic proxied with `x-brand: realtutorialhub` |
| `user.skillupitacademy.com` | SkillUp user portal | GCP Cloud Run | Login, register, profile, dashboard |
| `admin.skillupitacademy.com` | SkillUp admin portal | GCP Cloud Run | Admin UI and account tools |
| `faculty.skillupitacademy.com` | SkillUp faculty portal | GCP Cloud Run | Faculty-specific UI and workflows |
| `api.skillupitacademy.com` | SkillUp auth gateway | Cloudflare Worker | `/auth/*` to SkillUp auth, other traffic proxied with `x-brand: skillup` |
| `quiz.skillhubcore.in` | Shared quiz/exam engine | GCP Cloud Run | Shared quiz/exam routes |
| `tutorial.skillhubcore.in` | Shared tutorial engine | GCP Cloud Run | Shared tutorial routes |
| `placement.skillhubcore.in` | Shared placement service | GCP Cloud Run | Shared placement routes |
| `api.skillhubcore.in` | SkillHub shared API gateway | Cloudflare Worker | `/quiz/*`, `/exam/*`, `/tutorial/*`, `/placement/*`, `/payment/*` |
| `admin.skillhubcore.in` | SkillHub super admin portal | GCP Cloud Run | Cross-brand admin/control plane |

## 1. GCP / Cloud Run

| Item | Spec target | Repo status | Notes |
|---|---|---:|---|
| RTH user portal | `user.realtutorialhub.com` | Exists | Current repo has RTH frontend apps and Dockerfiles |
| RTH admin portal | `admin.realtutorialhub.com` | Exists | Current repo has admin app and Dockerfile |
| RTH auth API | `api.realtutorialhub.com` | Exists | Current `apps/api-server` plus Cloud Run deploy workflow |
| SkillUp user portal | `user.skillupitacademy.com` | Exists | Current repo has `apps/skillup-web` and Dockerfile |
| SkillUp admin portal | `admin.skillupitacademy.com` | Exists | Current repo has `apps/skillup-admin` and Dockerfile |
| SkillUp faculty portal | `faculty.skillupitacademy.com` | Exists | Current repo has `apps/faculty-app` and Dockerfile |
| SkillUp auth API | `api.skillupitacademy.com` | Missing | Spec target exists, but current repo deploys a shared gateway model |
| Quiz service | `quiz.skillhubcore.in` | Exists | `services/skillhubcore-service` / related build and deploy path exist |
| Tutorial service | `tutorial.skillhubcore.in` | Partially exists | Route/service docs exist; confirm live service split if you want separate Cloud Run targets |
| Placement service | `placement.skillhubcore.in` | Partially exists | Similar to tutorial: docs exist, live service split needs confirmation |
| SkillHub API | `api.skillhubcore.in` | Partially exists | Current repo has a shared `services/api-gateway` worker pattern |
| SkillHub admin | `admin.skillhubcore.in` | Exists | Current repo has `apps/skillhubcore-admin` and Dockerfile |

### Microservice Split Gap

| Spec microservice | Separate service in repo? | Current repo equivalent | Status |
|---|---:|---|---|
| `rth-auth-service` | No | `apps/api-server` auth flow | Pending as a split service |
| `skillup-auth-service` | No | `apps/api-server` auth flow + brand-aware frontend | Pending as a split service |
| `skillhub-auth-validator` | No | `services/skillhubcore-service` | Pending as a split service |
| `api-gateway-rth` | No | `services/api-gateway` | Pending as a split gateway |
| `api-gateway-skillup` | No | `services/api-gateway` | Pending as a split gateway |
| `api-gateway-skillhub` | No | `services/api-gateway` | Pending as a split gateway |

This gap is intentional to track the difference between the current consolidated implementation and the stricter split architecture described in `.kiro`.

### GCP Pre-Deploy Checklist

- [ ] `apps/api-server`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
  - [ ] Health endpoint responds correctly
  - [ ] Required env vars are attached
- [ ] `apps/realtutorialhub-quiz`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
  - [ ] Required public URLs are injected
- [ ] `apps/realtutorialhub-admin`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
  - [ ] Required public URLs are injected
- [ ] `apps/realtutorialhub-web`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
  - [ ] Required public URLs are injected
- [ ] `apps/skillup-web`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
  - [ ] Required public URLs are injected
- [ ] `apps/skillup-admin`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
- [ ] `apps/faculty-app`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
- [ ] `apps/skillhubcore-admin`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
- [ ] `services/skillhubcore-service`
  - [ ] Image builds successfully
  - [ ] Service deploys to Cloud Run
  - [ ] Health endpoint responds correctly
  - [ ] Shared service env vars are attached
- [ ] GCP Secret Manager
  - [ ] All runtime secrets exist in Secret Manager
  - [ ] Secrets are mounted into Cloud Run services
  - [ ] Local `.env.local` files are not used in production
  - [ ] Database secrets are separated by service/domain
- [ ] GCP Infrastructure
  - [ ] Artifact Registry exists and is accessible from GitHub Actions
  - [ ] Cloud Run region is set consistently to `asia-south1`
  - [ ] Service accounts have deploy permissions
  - [ ] Workload Identity Federation is configured for GitHub Actions

## 2. Cloudflare / Workers / DNS

| Item | Spec target | Repo status | Notes |
|---|---|---:|---|
| RTH API gateway worker | `api.realtutorialhub.com/*` | Exists | `services/api-gateway/wrangler.toml` currently routes to RTH-related hosts |
| SkillUp API gateway worker | `api.skillupitacademy.com/*` | Missing | Spec target exists, current worker config does not fully match it |
| SkillHub API gateway worker | `api.skillhubcore.in/*` | Exists | Current `services/api-gateway/wrangler.toml` includes this route |
| Cloudflare DNS for RTH | `user/admin/api.realtutorialhub.com` | Needs cloud-side confirmation | Spec defines the final DNS map |
| Cloudflare DNS for SkillUp | `user/admin/faculty/api.skillupitacademy.com` | Needs cloud-side confirmation | Spec defines the final DNS map |
| Cloudflare DNS for SkillHub | `quiz/tutorial/placement/api/admin.skillhubcore.in` | Needs cloud-side confirmation | Spec defines the final DNS map |
| Worker secrets | `JWT_SECRET`, `ADMIN_JWT_SECRET`, `INTERNAL_GATEWAY_SECRET` | Exists | GitHub workflow already sets these for the worker |

### Cloudflare Pre-Deploy Checklist

- [ ] RTH gateway routes `/auth/*` to RTH auth service
- [ ] RTH gateway proxies non-auth traffic to SkillHub with `x-brand: realtutorialhub`
- [ ] SkillUp gateway routes `/auth/*` to SkillUp auth service
- [ ] SkillUp gateway proxies non-auth traffic to SkillHub with `x-brand: skillup`
- [ ] SkillHub gateway routes `/quiz/*`, `/exam/*`, `/tutorial/*`, `/placement/*`, `/payment/*`
- [ ] Worker secrets are configured with `wrangler secret put`
- [ ] Worker route patterns match the final hostnames
- [ ] Cloudflare proxy is enabled where required
- [ ] SSL/TLS mode is set to Full (strict)
- [ ] Cookie domains match brand domains
- [ ] Cross-brand cookie leakage is prevented

## 3. GitHub Automation

| Item | Status | Notes |
|---|---:|---|
| Cloud Run deploy workflow | Exists | `.github/workflows/deploy-cloudrun.yml` builds and deploys multiple apps |
| Gateway deploy workflow | Exists | `.github/workflows/deploy-gateway.yml` deploys the worker |
| Dockerfiles for deployable apps | Exists | Present for `api-server`, `realtutorialhub-*`, `skillup-*`, `faculty-app`, `skillhubcore-*`, `skillhubcore-service` |
| WIF / GCP auth | Exists | Workflow uses `google-github-actions/auth@v2` with workload identity |
| GitHub secrets alignment to final target map | Needs review | Some names still reflect legacy/current naming, not the spec target names |

### GitHub Pre-Deploy Checklist

- [ ] `.github/workflows/deploy-cloudrun.yml` is aligned with the final hostnames
- [ ] `.github/workflows/deploy-gateway.yml` is aligned with the final gateway hosts
- [ ] Workflow triggers cover the right app/service paths
- [ ] Workflow secrets are present in GitHub
- [ ] `GCP_PROJECT_ID`
- [ ] `WIF_PROVIDER`
- [ ] `WIF_SERVICE_ACCOUNT`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_ZONE_ID`
- [ ] `INTERNAL_GATEWAY_SECRET`
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `ADMIN_JWT_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Any required database and service URL secrets
- [ ] Dockerfiles exist for every deployable app/service
- [ ] Docker builds succeed locally or in CI
- [ ] Images are pushed to Artifact Registry
- [ ] Cloud Run deploys use the pushed image tags
- [ ] Cloudflare Worker deploys use the expected `wrangler` environment

## 4. Environment Variables

| Variable group | Repo status | Spec status | Notes |
|---|---:|---:|---|
| `DATABASE_URL_RTH` / `DATABASE_DIRECT_URL_RTH` | Exists | Required | Used by RTH DB package and workflows |
| `DATABASE_URL_SKILLUP` / `DATABASE_DIRECT_URL_SKILLUP` | Exists | Required | Used by SkillUp DB package and workflows |
| `DATABASE_URL_PEOPLE` / `DATABASE_DIRECT_URL_PEOPLE` | Exists | Required | Used by identity bridge and shared packages |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SKILLHUB_SECRET` | Exists | Required | Present in spec and repo tests/config |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Exists | Required | Present across auth, cache, and gateway code |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Exists in spec; not fully verified in repo | Required | Needs cloud-side / secrets confirmation |
| `COOKIE_DOMAIN` | Exists | Required | Used by auth routes and production config |
| `BRAND` | Exists in spec / gateway config | Required | Used for brand-aware routing |
| `APP_URL` | Exists | Required for auth email flows | Used by signup / forgot password flows |
| `NEXT_PUBLIC_API_URL` | Exists | Required | Used widely across frontend apps |
| `NEXT_PUBLIC_WEB_APP_URL` | Exists | Required | Used by frontends and tests |
| `NEXT_PUBLIC_APP_URL` | Exists | Required | Used by some legacy/current apps and workflows |
| `RTH_AUTH_SERVICE_URL`, `SKILLUP_AUTH_SERVICE_URL`, `SKILLHUB_API_URL`, `SKILLHUB_AUTH_VALIDATOR_URL` | Exists in spec; partial repo wiring | Required | Gateway/env mapping still needs final alignment |
| `QUIZ_SERVICE_URL`, `TUTORIAL_SERVICE_URL`, `PLACEMENT_SERVICE_URL`, `PAYMENT_SERVICE_URL` | Exists | Required | Shared gateway routing |

### App-Level Configuration Checklist

- [ ] `NEXT_PUBLIC_API_URL` matches the final API gateway for each brand
- [ ] `NEXT_PUBLIC_WEB_APP_URL` matches the final frontend base URL
- [ ] `NEXT_PUBLIC_APP_URL` is correct where used
- [ ] `COOKIE_DOMAIN` matches the brand domain
- [ ] `BRAND` is correct for each brand deployment
- [ ] `APP_URL` is correct for email verification and password reset
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are available where required
- [ ] `DATABASE_URL_*` and `DATABASE_DIRECT_URL_*` are present where required
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT` is present where observability is expected

## 5. What Is Ready Now

| Area | Ready? | Why |
|---|---:|---|
| Building Docker images | Yes | Dockerfiles already exist for the major apps/services |
| Deploying to Cloud Run from GitHub | Yes, mostly | Workflow exists and already builds/pushes images |
| Deploying Cloudflare Worker gateways | Yes, mostly | Worker workflow and `wrangler.toml` exist |
| Using repo env vars as local dev input | Yes | `.env.local` exists and the apps already read from env |
| End-to-end seamless deployment with final spec hostnames | Not yet | Hostname / gateway naming still needs alignment with the `.kiro` target map |

## 6. Main Gaps Before Seamless Deploy

| Gap | Impact |
|---|---|
| Legacy hostnames still appear in workflow/config files | Deployment will not match the final `.kiro` DNS map cleanly |
| One shared worker vs three target gateways | Spec wants RTH, SkillUp, and SkillHub gateways clearly separated |
| Cloudflare DNS records are not verifiable from repo alone | You need live Cloudflare confirmation before cutover |
| GCP Secret Manager values are not verifiable from repo alone | You need live GCP confirmation before cutover |
| Some spec names are aspirational versus current repo names | Config and docs need a normalization pass |

## 7. Final Go-Live Gate

- [ ] GCP services are deployed and healthy
- [ ] Cloudflare DNS resolves to the correct endpoints
- [ ] Cloudflare Workers are deployed and routing correctly
- [ ] GitHub Actions can redeploy without manual changes
- [ ] Environment variables are sourced from secret managers, not local files
- [ ] Frontend can authenticate, refresh, and reach shared services seamlessly
- [ ] Brand isolation and cookie isolation are verified

## 8. Practical Conclusion

- The repo already contains most build/deploy scaffolding.
- The `.kiro` target architecture is clear.
- What still needs work is alignment:
  - final hostnames
  - final gateway split
  - live Cloudflare DNS
  - live GCP secret/service verification
- Keep all future deployment planning in this file.

## 9. Current Repo -> Target Deployment Mapping

| Current repo item | Target deployment / spec location | Action |
|---|---|---|
| `apps/api-server` | `rth-auth-service` / `skillup-auth-service` auth responsibilities | Deploy as-is first; split only if you want the stricter spec architecture |
| `services/skillhubcore-service` | `skillhub-auth-validator` + shared SkillHub auth/session logic | Deploy as-is first; extract validator later if needed |
| `services/api-gateway` | `api-gateway-rth`, `api-gateway-skillup`, `api-gateway-skillhub` | Deploy as-is first; split worker later if needed |
| `apps/realtutorialhub-quiz` | `user.realtutorialhub.com` | Cloud Run deployment target exists now |
| `apps/realtutorialhub-admin` | `admin.realtutorialhub.com` | Cloud Run deployment target exists now |
| `apps/realtutorialhub-web` | Brand-specific tutorial / learning surface | Cloud Run deployment target exists now |
| `apps/skillup-web` | `user.skillupitacademy.com` | Cloud Run deployment target exists now |
| `apps/skillup-admin` | `admin.skillupitacademy.com` | Cloud Run deployment target exists now |
| `apps/faculty-app` | `faculty.skillupitacademy.com` | Cloud Run deployment target exists now |
| `apps/skillhubcore-admin` | `admin.skillhubcore.in` | Cloud Run deployment target exists now |
| `packages/db-rth` | RTH DB support | Use as the RTH database package |
| `packages/db-skillup` | SkillUp DB support | Use as the SkillUp database package |
| `packages/db-people` | Identity bridge / shared identity storage | Use as the shared identity package |
| `apps/api-server` + `services/api-gateway` | Cloudflare + GCP edge flow | Update hostnames and secrets to match final target map |

### Recommended Next Action

1. Deploy the repo as it currently exists, using the consolidated services.
2. Verify Cloud Run, Cloudflare DNS, and Secret Manager live values.
3. Normalize hostnames and environment variables to the `.kiro` target map.
4. Split consolidated services only if you still need the stricter microservice layout after the initial deployment is stable.

## 10. Per-Service Action List

| Service / app | Action now | Why |
|---|---|---|
| `apps/api-server` | Keep and deploy first | It already covers the brand auth APIs, verification flows, audit logging, and health checks |
| `services/skillhubcore-service` | Keep and deploy first | It already covers shared auth/session/SSO-like behavior for SkillHub core |
| `services/api-gateway` | Keep and deploy first | It is the existing edge/router layer; splitting can be done later if needed |
| `apps/realtutorialhub-quiz` | Deploy as current RTH user portal | This is the active RTH frontend entry point in the repo |
| `apps/realtutorialhub-admin` | Deploy as current RTH admin portal | Existing admin portal with its own Dockerfile and workflow support |
| `apps/realtutorialhub-web` | Deploy as current RTH tutorial/learning surface | Existing brand-specific learning app |
| `apps/skillup-web` | Deploy as current SkillUp user portal | Existing SkillUp learner app with auth recovery pages now added |
| `apps/skillup-admin` | Deploy as current SkillUp admin portal | Existing admin surface for SkillUp |
| `apps/faculty-app` | Deploy as current SkillUp faculty portal | Existing faculty-specific portal |
| `apps/skillhubcore-admin` | Deploy as current SkillHub super admin portal | Existing shared admin/control plane app |
| `packages/db-rth` | Keep as RTH DB package | Already represents the brand-specific DB layer for RTH |
| `packages/db-skillup` | Keep as SkillUp DB package | Already represents the brand-specific DB layer for SkillUp |
| `packages/db-people` | Keep as shared identity package | Already supports identity bridge and shared user storage |
| `services/rth-auth-service` | Do not create yet | Spec target exists, but current implementation is consolidated in `apps/api-server` |
| `services/skillup-auth-service` | Do not create yet | Spec target exists, but current implementation is consolidated in `apps/api-server` |
| `services/skillhub-auth-validator` | Do not create yet | Spec target exists, but current implementation is consolidated in `services/skillhubcore-service` |
| `services/api-gateway-rth` | Do not create yet | Spec target exists, but current implementation is consolidated in `services/api-gateway` |
| `services/api-gateway-skillup` | Do not create yet | Spec target exists, but current implementation is consolidated in `services/api-gateway` |
| `services/api-gateway-skillhub` | Do not create yet | Spec target exists, but current implementation is consolidated in `services/api-gateway` |

### Suggested Execution Order

1. Deploy current consolidated apps and services.
2. Verify live DNS and Cloud Run URLs.
3. Verify production secrets in GCP and Cloudflare.
4. Normalize hostnames and env vars to the `.kiro` target map.
5. Split consolidated services only if the stricter microservice layout is still desired after the first stable deployment.

## 11. Environment-Specific Deploy Checklist

### Local

- [ ] `.env.local` exists for development only
- [ ] Dockerfiles build locally for each deployable app/service
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes

### GitHub Actions

- [ ] `deploy-cloudrun.yml` runs on the intended paths
- [ ] `deploy-gateway.yml` runs on the intended paths
- [ ] WIF auth works for GCP deployment
- [ ] GitHub secrets are configured
- [ ] Build images are pushed to Artifact Registry
- [ ] Deploy jobs use the correct image tags

### GCP

- [ ] Cloud Run services exist
- [ ] Cloud Run services are healthy
- [ ] Secret Manager contains runtime secrets
- [ ] Secret values are attached to the correct service
- [ ] Artifact Registry is accessible from GitHub Actions
- [ ] Region is `asia-south1`

### Cloudflare

- [ ] DNS records exist for final hostnames
- [ ] Workers exist for the API gateway layers
- [ ] Worker secrets are set
- [ ] Route patterns match the final host map
- [ ] SSL/TLS is `Full (strict)`

### App-Specific

- [ ] `NEXT_PUBLIC_API_URL` points to the correct brand gateway
- [ ] `NEXT_PUBLIC_WEB_APP_URL` points to the correct web app
- [ ] `COOKIE_DOMAIN` matches the brand
- [ ] `APP_URL` is correct for email flows
- [ ] Database URLs point to the right database per service

### Final Validation

- [ ] Authentication works end to end
- [ ] Refresh / logout works end to end
- [ ] Brand-specific cookie isolation is correct
- [ ] Shared service routing works
- [ ] Health checks are green
- [ ] DNS and service URLs match the `.kiro` target map
