# Shared Branded UI Source of Truth Master Plan

Date: 2026-04-13
Repo: `d:\onlinewebsites\quiz-platform`
Audience: AI implementation agent and human reviewer
Status: Planning document for phased execution

## Purpose

This document is the execution playbook to make `src/share-branding` the source of truth for user-facing UI now, then apply the same pattern to admin-facing UI later.

It is designed to work with the current repo shape:

- Next.js app hosts in `apps/*`
- shared branded UI in `src/share-branding/*`
- shared API client in `packages/api-client`
- shared auth package in `packages/auth`
- gateway in `services/api-gateway`
- central identity target in `services/skillhubcore-service`

This plan also accounts for:

- auth/authz requirements from the existing auth documents
- current lack of final lint, typecheck, tests, build, Docker, deployment validation for the new shared UI direction
- current GitHub Actions and Cloud Run deployment targeting app-owned surfaces
- Cloudflare gateway and GCP routing updates still needed
- existing BFFs that still assume app-local GUI ownership
- future admin-side migration using the same shared source-of-truth model

## Governing References

The following documents are mandatory constraints for implementation:

- `.kiro/AUTHENTICATION_STATUS.md`
- `.kiro/AUTH_BRAND_AGNOSTIC_IMPLEMENTATION.md`
- `.kiro/AUTH_IMPLEMENTATION_ACTION_PLAN.md`
- `.kiro/AUTH_ARCHITECTURE_VISUAL_MAP.md`
- `.kiro/COMPREHENSIVE_AUTH_ANALYSIS_APRIL_2026.md`
- `docs/completeproject/FINAL_AUTH_SUMMARY_APRIL_2026.md`
- `docs/completeproject/auth_architecture_master_guide.md`

If this document conflicts with those auth documents, treat the auth documents as the security and backend source of truth. This document defines UI ownership, app host responsibilities, migration order, and rollout mechanics.

## Executive Decision

The correct target architecture is not "delete `apps/*`".

The correct target architecture is:

- `src/share-branding` owns branded user UI rendering and shared screen composition
- `apps/*` remains the app host layer only
- route wrappers, metadata, proxies, and app-runtime config stay in `apps/*`
- shared browser-side user request logic moves out of app-local components into shared modules
- BFFs are reduced, standardized, or retired based on clear rules
- auth/authz continues to be implemented according to the referenced auth docs

The same model should later be applied to admin:

- shared admin branded UI as source of truth
- app hosts remain thin
- admin-specific BFF and auth flows are standardized separately after user migration stabilizes

## Non-Negotiable Rules

1. `src/share-branding` is the only place allowed to own branded user page composition going forward.
2. `apps/*` may own only:
   - `src/app/**/page.tsx` thin wrappers
   - `layout.tsx`
   - `proxy.ts`
   - app API routes that are still required
   - app metadata
   - app environment and deployment config
3. No new user-facing branded JSX trees should be added to `apps/realtutorialhub-web`, `apps/skillup-web`, or `apps/realtutorialhub-quiz` once a route family is migrated.
4. Authentication and authorization must remain aligned with the auth reference docs.
5. Frontend must not become the source of truth for session state.
6. Browser auth remains cookie-backed.
7. Proxies remain app-owned until gateway standardization is complete.
8. Shared UI migration and auth service extraction are related but separate workstreams. Do not mix them carelessly in one PR unless the phase explicitly requires it.

## Current Repo Reality

### Already aligned with shared branded UI

The following routes already use `src/share-branding` as thin wrappers or near-thin wrappers:

- `apps/realtutorialhub-web/src/app/page.tsx`
- `apps/realtutorialhub-web/src/app/login/page.tsx`
- `apps/realtutorialhub-web/src/app/dashboard/page.tsx`
- `apps/realtutorialhub-web/src/app/onboarding/page.tsx`
- `apps/realtutorialhub-web/src/app/exam/page.tsx`
- `apps/skillup-web/src/app/page.tsx`
- `apps/skillup-web/src/app/login/page.tsx`
- `apps/skillup-web/src/app/dashboard/page.tsx`
- `apps/skillup-web/src/app/launch-exam/page.tsx`

These are strong signals that the target architecture is already partially established.

### Still app-local on the user side

The following are still materially app-owned and must be migrated or standardized:

- `apps/realtutorialhub-web/src/app/forgot-password/page.tsx`
- `apps/realtutorialhub-web/src/app/reset-password/page.tsx` if still app-local in the same pattern
- `apps/skillup-web/src/components/auth/LoginForm.tsx`
- `apps/skillup-web/src/components/auth/RegisterForm.tsx`
- `apps/skillup-web/src/app/forgot-password/page.tsx`
- `apps/skillup-web/src/app/reset-password/page.tsx`
- `apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx`
- `apps/realtutorialhub-quiz/src/components/auth/AuthForms.tsx`
- `apps/realtutorialhub-quiz/src/context/auth-context.tsx`
- `apps/realtutorialhub-quiz/src/store/auth-store.ts`
- `apps/realtutorialhub-quiz` user-facing dashboard/report/session surfaces that still own their own branded rendering

### App host concerns that must remain in `apps/*`

- `apps/realtutorialhub-web/src/proxy.ts`
- `apps/skillup-web/src/proxy.ts`
- `apps/realtutorialhub-quiz/src/proxy.ts`
- app `layout.tsx`
- app route registration
- app-specific metadata
- app runtime env and Docker/Cloud Run configuration

### Infra and deployment still reflect older ownership

Current workflows deploy app-specific services directly:

- `.github/workflows/deploy-cloudrun.yml`
- `.github/workflows/deploy-gateway.yml`

This is expected for now, because deployment units are still app hosts. The change needed is not to stop deploying apps. The change needed is to ensure those apps build shared UI wrappers rather than app-local UI trees.

## Target Architecture

### User-side target

#### Ownership model

- `src/share-branding`
  - shared branded screen modules
  - view models
  - screen loaders
  - request mappers
  - user auth form components
  - route-level page compositions
  - brand-aware copy, tokens, and UI behavior

- `packages/api-client`
  - shared browser and server-safe request client
  - session bootstrap helpers
  - auth request methods
  - user portal client contracts

- `apps/realtutorialhub-web`
  - thin route wrappers for RTH brand
  - proxy and metadata only

- `apps/skillup-web`
  - thin route wrappers for SkillUp brand
  - proxy and metadata only

- `apps/realtutorialhub-quiz`
  - either:
    - a thin host for shared exam and shared report screens
    - or a bridge app that redirects to dedicated shared surfaces
  - no app-owned login/auth form UI after migration

### Admin-side target later

Mirror the same structure:

- shared admin branded screens in a dedicated shared module area
- thin app hosts in:
  - `apps/realtutorialhub-admin`
  - `apps/skillup-admin`
  - `apps/skillhubcore-admin` as applicable
- admin auth pages standardized into shared branded admin screens
- shared admin API/BFF conventions

## Source of Truth Definition

`src/share-branding` is considered the source of truth only when all of the following are true for a route family:

1. The app `page.tsx` is a thin wrapper.
2. The app does not own branded page composition for that route family.
3. Shared loaders or shared client methods provide the data boundary.
4. Brand differences come from config, not duplicated JSX.
5. Tests assert the shared screen contract rather than app-local implementation.

## Route Strategy

### User routes to migrate first

Phase order for user routes:

1. `login`
2. `signup/register`
3. `forgot-password`
4. `reset-password`
5. `dashboard`
6. `onboarding`
7. `launch-exam` and `exam`
8. quiz shared entry, session bootstrap, report shell, settings shell
9. tutorial/learning route family only if it still has app-local branded ownership

### Why auth UI first

Auth UI is the best first full migration because it has:

- highest user-entry impact
- duplicated form logic today
- brand-aware copy and styling needs
- direct dependency on the auth docs
- clear success criteria

## Required Folder Structure

Create or normalize the following under `src/share-branding`:

```text
src/share-branding/
  auth/
    authViewData.ts
    authMapper.ts
    authLoader.ts
    authActions.ts
    authSchemas.ts
  screens/
    user/
      LoginScreen.tsx
      SignupScreen.tsx
      ForgotPasswordScreen.tsx
      ResetPasswordScreen.tsx
      DashboardScreen.tsx
      OnboardingScreen.tsx
      LaunchExamScreen.tsx
      ExamScreen.tsx
    shared/
      SessionExpiredScreen.tsx
      UnsupportedBrandScreen.tsx
  services/
    userAuthClient.ts
    sessionClient.ts
  routes/
    user/
      realtutorialhub.ts
      skillup.ts
  brandConfig.ts
```

Later, create:

```text
src/share-branding/admin/
  screens/
  loaders/
  services/
  view-models/
```

## User Migration Plan

### Phase U0 - Freeze and baseline

Goal:

- stop the architecture from drifting further
- measure the current state before migration

Actions:

1. Freeze new user-facing branded UI in:
   - `apps/realtutorialhub-web`
   - `apps/skillup-web`
   - `apps/realtutorialhub-quiz`
2. Allow only wrapper, proxy, route, or infrastructure changes in those apps during migration.
3. Add a rule to the execution plan:
   - no new app-local branded user UI unless explicitly approved as temporary bridge code
4. Inventory current route families into three buckets:
   - already shared
   - partially shared
   - app-local

Deliverables:

- migration inventory table
- route ownership matrix
- branch naming convention for migration work

### Phase U1 - Establish shared auth engine pattern

Goal:

- align auth UI with the same pattern already used by shared exam/dashboard pages

Required files to create:

- `src/share-branding/auth/authViewData.ts`
- `src/share-branding/auth/authMapper.ts`
- `src/share-branding/auth/authLoader.ts`
- `src/share-branding/services/userAuthClient.ts`

Rules:

- follow the auth docs' Option 2 + Option 3 + Option 4 pattern
- do not let shared screens consume raw backend payloads directly
- create stable UI-facing view models

Recommended `AuthViewData` responsibilities:

- brand identity
- portal identity
- copy and messaging state
- session status
- allowed auth modes
- redirect targets
- loader-prepared initial view state

This phase must not change auth security semantics. It only creates the correct shared UI-facing boundary.

### Phase U2 - Migrate user auth screens into shared UI

Goal:

- make auth routes shared across RTH and SkillUp

Routes to migrate:

- RTH user login
- SkillUp user login
- SkillUp register
- RTH forgot password
- SkillUp forgot password
- RTH reset password
- SkillUp reset password
- quiz public login if it remains a user-facing login surface

Implementation approach:

1. Create shared screens:
   - `LoginScreen`
   - `SignupScreen`
   - `ForgotPasswordScreen`
   - `ResetPasswordScreen`
2. Move app-local auth form components into shared modules.
3. Move fetch logic into `src/share-branding/services/userAuthClient.ts` or a shared package service.
4. Replace app page files with wrappers that only:
   - pick the brand config
   - load view data
   - render the shared screen
5. Delete or deprecate app-local auth form files after the wrappers are stable.

Definition of done:

- no app-local branded auth form logic remains for migrated screens
- both brands render from the same shared screen code
- brand-specific differences come only from config and data

### Phase U3 - Standardize user session bootstrap and state

Goal:

- remove app-specific auth/session UI logic where shared behavior is intended

Current risk:

- `realtutorialhub-quiz` still carries app-local auth context and auth store behavior
- some apps mirror cookie state in client stores

Approach:

1. Define a shared session bootstrap contract:
   - `getSession()`
   - `refreshSession()`
   - `logoutSession()`
2. Keep cookie-backed auth as the real source of truth.
3. Treat client stores as UI mirrors only.
4. For quiz:
   - determine whether its login/session UX should be shared with the user portal auth surfaces
   - if yes, move it under shared branded auth/session components
   - if no, explicitly mark quiz as an exception and isolate it

Target result:

- one shared session interaction contract
- no route-specific login semantics hidden in app-local forms

### Phase U4 - Migrate user route families beyond auth

Goal:

- finish the user-side source-of-truth migration

Priority order:

1. dashboard and settings shells
2. onboarding flow
3. exam launch/configuration
4. exam shell
5. tutorial route shells
6. report shells

Rule:

If a route is already mostly shared, finish it rather than partially rewriting another route family.

### Phase U5 - BFF normalization for user apps

Goal:

- remove BFF behavior that exists only because UI is app-local

Decision framework:

Keep a BFF route only if it does one of the following:

- server-only secret injection
- response shaping for SSR/streaming
- secure cookie/header forwarding that browser calls cannot perform safely
- gateway or domain rewrite logic that is genuinely required

Retire or simplify a BFF route if it is only:

- proxying the same payload unchanged
- compensating for app-local UI coupling
- duplicating `packages/api-client` behavior

User-side BFF migration order:

1. identify all user-facing BFF routes in `apps/realtutorialhub-web`, `apps/skillup-web`, `apps/realtutorialhub-quiz`
2. classify each route:
   - keep
   - simplify
   - retire
3. update shared UI screens to use the standardized client/BFF contract

### Phase U6 - Gateway and routing alignment

Goal:

- ensure all user-facing shared UI routes and APIs align with the gateway target architecture

Required outcomes:

- all intended public auth routes go through gateway-defined paths
- direct service calls are eliminated where the auth plan requires gateway usage
- route hosts and domains align with current Cloudflare/GCP entrypoints

Use the auth docs for the gateway target state:

- gateway verifies JWT at edge
- services trust forwarded identity or gateway secret contract
- auth service extraction progresses toward `services/skillhubcore-service`

This phase is where UI migration must stop assuming the old API shape forever. Shared screens should call standardized client methods, not hardcoded old endpoints.

## Admin Migration Plan Later

Do not start admin migration until user migration reaches stable verification gates.

### Phase A0 - Admin inventory

Inventory:

- `apps/realtutorialhub-admin`
- `apps/skillup-admin`
- `apps/skillhubcore-admin`

Bucket admin surfaces into:

- shared candidate
- brand-specific variant
- true app-specific operational UI

### Phase A1 - Shared admin source of truth

Create a dedicated shared admin UI module area:

- `src/share-branding/admin/screens`
- `src/share-branding/admin/loaders`
- `src/share-branding/admin/services`

Do not mix admin and user shared screens in one flat folder.

### Phase A2 - Shared admin auth

Current admin auth is inconsistent:

- shared `PortalLoginPage` exists
- `/auth/login` and `/admin/auth/login` both exist
- usage varies by app

Admin migration must standardize:

- one shared admin login screen contract
- one clear admin auth route strategy
- one clear portal identity model

### Phase A3 - Shared admin dashboards and operational surfaces

Migrate in this order:

1. admin login and password recovery
2. admin shell and nav
3. admin dashboard
4. admin content/workflow screens
5. admin analytics/reporting screens

## Auth and Authorization Requirements

The AI model must implement all user and later admin changes in a way that preserves these requirements from the auth documents:

1. Browser auth remains cookie-based with httpOnly cookies.
2. Frontend must not become the real session source of truth.
3. Brand awareness must continue through request body/header and token claims until backend centralization is fully finished.
4. Shared auth UI must not hardcode brand-specific auth logic.
5. Shared auth UI must map backend/token/session state into a shared auth view model.
6. Proxy-level route protection remains in place until gateway ownership replaces or simplifies it.
7. No token storage in localStorage.
8. No duplicate JWT verification logic introduced in shared UI code.
9. BFF and gateway changes must preserve CSRF and cookie-domain behavior.
10. Admin and faculty role gating must not be weakened during UI migration.

## Route-by-Route User Matrix

### RealTutorialHub Web

Keep as thin app host:

- `apps/realtutorialhub-web/src/app/page.tsx`
- `apps/realtutorialhub-web/src/app/login/page.tsx`
- `apps/realtutorialhub-web/src/app/dashboard/page.tsx`
- `apps/realtutorialhub-web/src/app/onboarding/page.tsx`
- `apps/realtutorialhub-web/src/app/exam/page.tsx`
- `apps/realtutorialhub-web/src/proxy.ts`

Migrate into shared source of truth:

- `apps/realtutorialhub-web/src/app/forgot-password/page.tsx`
- `apps/realtutorialhub-web/src/app/reset-password/page.tsx` if still app-local
- any remaining app-local user auth or recovery UI
- tutorial route shells if their branding/composition is still app-owned

### SkillUp Web

Keep as thin app host:

- `apps/skillup-web/src/app/page.tsx`
- `apps/skillup-web/src/app/dashboard/page.tsx`
- `apps/skillup-web/src/app/launch-exam/page.tsx`
- `apps/skillup-web/src/proxy.ts`

Migrate into shared source of truth:

- `apps/skillup-web/src/components/auth/LoginForm.tsx`
- `apps/skillup-web/src/components/auth/RegisterForm.tsx`
- `apps/skillup-web/src/app/login/page.tsx` if it still composes app-local auth pieces
- `apps/skillup-web/src/app/register/page.tsx` if present and app-local
- `apps/skillup-web/src/app/forgot-password/page.tsx`
- `apps/skillup-web/src/app/reset-password/page.tsx`

### RealTutorialHub Quiz

Keep as host/bridge only:

- `apps/realtutorialhub-quiz/src/proxy.ts`
- bridge routes such as tutorial redirects if intentionally retained
- app runtime layout only where needed for quiz-only behavior

Migrate or rationalize:

- `apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx`
- `apps/realtutorialhub-quiz/src/components/auth/AuthForms.tsx`
- `apps/realtutorialhub-quiz/src/context/auth-context.tsx`
- `apps/realtutorialhub-quiz/src/store/auth-store.ts`
- session watcher and session expiry UX if shared behavior is desired
- dashboard/settings/report branded shells if they should follow the shared branded system

Decision note:

If `realtutorialhub-quiz` is intended to remain a distinct product UX, keep product-specific exam/report internals there. Only move the shared brand entry, auth, and shell layers into shared branding.

## BFF Migration Rules

### Keep BFF

Keep BFF routes if they:

- add `x-gateway-secret`
- normalize cross-domain cookies
- safely aggregate multiple service calls
- hide service-private contracts from the browser

### Refactor BFF

Refactor BFF routes if they:

- duplicate the same fetch wrapper logic already in `packages/api-client`
- exist only because a UI component fetches from the wrong place
- return raw backend payloads without shaping

### Remove BFF

Remove BFF routes if they:

- simply forward one request unchanged
- exist only to preserve an old app-local route layout
- are no longer needed once shared screens use the standardized shared client

## Deployment and Infrastructure Plan

### Current deployment reality

Current deployment units remain app-based and service-based:

- `apps/api-server`
- `apps/realtutorialhub-web`
- `apps/realtutorialhub-quiz`
- `apps/realtutorialhub-admin`
- `apps/skillup-web`
- `apps/skillup-admin`
- `apps/faculty-app`
- `apps/skillhubcore-admin`
- `apps/skillhub-placement`
- `services/skillhubcore-service`
- `services/api-gateway`

This is acceptable. Shared UI source of truth does not require fewer deployment units.

### Deployment changes required

#### Git remote and branch hygiene

Before rollout:

1. confirm intended canonical remote
2. update local remote URLs if needed
3. verify workflow permissions and deployment secrets
4. document deployment branch rules for user migration

#### GitHub Actions updates

Update:

- `.github/workflows/deploy-cloudrun.yml`
- `.github/workflows/deploy-gateway.yml`
- `.github/workflows/quality.yml`

Required changes:

1. ensure shared UI changes under `src/share-branding/**` trigger the correct build and deploy jobs
2. ensure app hosts that consume shared branding rebuild when shared branding changes
3. ensure gateway validation runs when auth/gateway/client path changes affect runtime behavior
4. ensure quality workflow includes all impacted apps after shared migration

#### Cloudflare workflow updates

Update:

- worker routes
- upstream service URLs
- secret propagation
- gateway validation assumptions

The gateway must reflect the real production routing after the shared UI migration, not legacy assumptions about app-local login or direct service calls.

#### GCP / Cloud Run updates

Required:

1. verify each Cloud Run service still points to the correct hostnames
2. confirm `NEXT_PUBLIC_*` URLs are compatible with shared UI expectations
3. update secrets/env if shared auth routes or gateway paths change
4. verify health checks for all affected user apps
5. verify domain mappings remain correct after route changes

#### GCP routing and host mapping

Explicitly verify:

- `user.realtutorialhub.com`
- `user.skillupitacademy.com`
- `quiz.skillhubcore.in`
- `tutorial.skillhubcore.in`
- `api.realtutorialhub.com`
- `api.skillupitacademy.com`
- `api.skillhubcore.in`

The new shared UI must be reachable through the same intended branded domains.

## Quality Gates

### Current status

As of this document, the new shared branded UI direction is not yet considered fully validated because the following are still pending or need re-run after migration:

- lint
- typecheck
- test execution
- build verification
- Docker image builds
- deployment verification

### Mandatory gates per phase

#### After each migration phase

Run at minimum:

```bash
pnpm lint:all
pnpm typecheck:all
pnpm test
pnpm build:all
```

If scope is smaller, run targeted package/app commands first, then full commands before merge.

#### Before Docker rollout

Run:

```bash
pnpm build:all
pnpm validate:cloudrun-coverage
pnpm validate:gateway
```

#### Before production cutover

Run:

```bash
pnpm lint:all
pnpm typecheck:all
pnpm test
pnpm build:all
pnpm audit:csrf-cross-subdomain
pnpm validate:gateway
pnpm validate:cloudrun-coverage
```

#### Additional recommended validation

- targeted Playwright auth flow tests
- targeted login/signup/reset password tests for both brands
- protected route redirect tests via proxy behavior
- cookie and CSRF validation across domains

## Suggested PR and Rollout Structure

Do not attempt this as one giant PR.

Recommended PR sequence:

1. PR 1: architecture freeze, route inventory, shared auth engine primitives
2. PR 2: shared login/signup/forgot/reset screens for user
3. PR 3: user session bootstrap normalization
4. PR 4: quiz public auth and shared session UX migration
5. PR 5: BFF normalization for user flows
6. PR 6: workflow and deployment path updates
7. PR 7: gateway and routing alignment for migrated user flows
8. PR 8: production rollout and validation
9. PR 9+: admin migration in the same pattern

## Detailed AI Execution Prompts

Use these prompts phase by phase. The AI model must read this file and the auth docs before acting.

### Prompt 1 - User route inventory and freeze

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- .kiro/AUTHENTICATION_STATUS.md
- .kiro/AUTH_BRAND_AGNOSTIC_IMPLEMENTATION.md

Task:
Create a route ownership inventory for user-facing apps only:
- apps/realtutorialhub-web
- apps/skillup-web
- apps/realtutorialhub-quiz

Classify each route family into:
- already shared
- partially shared
- app-local

Then implement only the minimal guardrails needed to freeze new app-local branded user UI additions.

Constraints:
- do not migrate admin yet
- do not change auth behavior yet
- do not change deployment yet
- preserve proxies

Output:
- updated markdown inventory
- any minimal code/documentation guardrails needed
```

### Prompt 2 - Shared auth engine primitives

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- .kiro/AUTH_BRAND_AGNOSTIC_IMPLEMENTATION.md
- .kiro/AUTH_IMPLEMENTATION_ACTION_PLAN.md
- docs/completeproject/auth_architecture_master_guide.md

Task:
Implement the shared auth engine primitives under src/share-branding/auth:
- authViewData.ts
- authMapper.ts
- authLoader.ts
- authActions.ts or equivalent

Requirements:
- follow the Option 2 + Option 3 + Option 4 pattern from the auth docs
- shared UI must consume mapped view models, not raw backend payloads
- preserve cookie-backed auth
- do not store tokens in localStorage
- do not weaken existing auth or proxy rules

Deliverables:
- code changes
- tests for mapper/loader behavior
- no app page migrations yet unless needed for compilation
```

### Prompt 3 - Migrate user auth routes to shared source of truth

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- .kiro/AUTHENTICATION_STATUS.md
- .kiro/AUTH_BRAND_AGNOSTIC_IMPLEMENTATION.md

Task:
Migrate all user auth route families to shared branded UI source of truth:
- login
- signup/register
- forgot-password
- reset-password

Apps in scope:
- apps/realtutorialhub-web
- apps/skillup-web
- apps/realtutorialhub-quiz if its public login is intended to be shared

Rules:
- shared screens go in src/share-branding
- app page files become thin wrappers
- fetch and action logic must move into shared services or shared client methods
- preserve auth semantics from the auth docs
- preserve current cookie and CSRF behavior

Validation:
- run targeted tests for both brands
- run lint, typecheck, and targeted build commands
```

### Prompt 4 - Normalize user session bootstrap

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- .kiro/AUTHENTICATION_STATUS.md
- docs/completeproject/FINAL_AUTH_SUMMARY_APRIL_2026.md

Task:
Standardize user session bootstrap and session refresh/logout behavior across user apps.

Focus:
- cookie-backed session remains source of truth
- client stores are UI mirrors only
- unify shared session logic where appropriate
- reduce app-specific auth context duplication, especially in realtutorialhub-quiz

Do not:
- remove proxies
- centralize backend auth service in the same PR unless absolutely required
```

### Prompt 5 - User BFF migration

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- .kiro/AUTH_IMPLEMENTATION_ACTION_PLAN.md
- .kiro/AUTH_ARCHITECTURE_VISUAL_MAP.md

Task:
Audit all user-facing BFF routes and classify them into keep, simplify, or retire.

Then implement the first safe wave:
- retire only the routes that are pure pass-through and no longer needed
- keep routes that add secrets, cookie-domain handling, or secure aggregation
- update shared UI to use the standardized client/BFF contract

Validation:
- preserve auth headers, gateway secret behavior, CSRF, and cookie-domain behavior
```

### Prompt 6 - Workflow, Docker, Cloudflare, and GCP rollout

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- docs/completeproject/APPROVED_DEPLOYMENT_PLAN.md
- .github/workflows/deploy-cloudrun.yml
- .github/workflows/deploy-gateway.yml

Task:
Update CI/CD and deployment configuration so shared branding changes rebuild and deploy the correct app hosts and services.

Include:
- GitHub Actions triggers
- build scope updates
- Cloudflare worker validation if routing changed
- Cloud Run env and host assumptions
- any required remote or documentation updates for deployment operations

Do not:
- delete deployment units
- assume apps are gone
```

### Prompt 7 - Admin preparation

```text
Read:
- docs/completeproject/SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md
- .kiro/AUTHENTICATION_STATUS.md
- .kiro/AUTH_BRAND_AGNOSTIC_IMPLEMENTATION.md

Task:
Create the admin migration inventory and shared admin architecture proposal using the same source-of-truth model already applied to user flows.

Scope:
- realtutorialhub-admin
- skillup-admin
- skillhubcore-admin

Output:
- admin route inventory
- shared admin module structure
- auth and BFF standardization plan

Do not start admin migration code until user rollout is validated.
```

## Acceptance Criteria for the Full User Program

The user-side migration is complete only when all of the following are true:

1. `src/share-branding` owns all branded user auth screens.
2. app page files for migrated user screens are thin wrappers.
3. no app-local branded user auth forms remain in scope.
4. shared auth data model and mapping layer exist.
5. session behavior is standardized and still cookie-backed.
6. app proxies still protect routes correctly.
7. user BFFs are classified and rationalized.
8. CI passes:
   - lint
   - typecheck
   - tests
   - builds
9. Docker builds succeed for impacted services.
10. Cloud Run deploys succeed for impacted app hosts.
11. Cloudflare gateway routing remains valid.
12. branded domains continue to work correctly in production.

## Risks and Mitigations

### Risk: accidental auth regression

Mitigation:

- treat auth docs as hard constraints
- add tests for login, refresh, logout, and protected route redirect
- avoid mixing auth extraction with UI migration early

### Risk: moving too much quiz-specific UX into shared branding

Mitigation:

- only move shared brand entry, auth, and shell concerns first
- keep truly product-specific exam/report internals where they belong until a clear shared abstraction exists

### Risk: deployment drift

Mitigation:

- update workflows only after code structure is stable
- verify shared branding paths trigger rebuilds
- run pre-production validation against Cloud Run and gateway

### Risk: BFF breakage across domains

Mitigation:

- keep BFF routes that are still needed for cookie-domain and secret-handling
- run CSRF and cross-domain audits after each BFF change set

## Final Recommendation

Execute this as a phased program:

1. freeze and inventory
2. build shared auth primitives
3. migrate user auth screens
4. normalize session behavior
5. rationalize user BFFs
6. align gateway, workflows, and deployment
7. validate production
8. repeat the same structure for admin

Do not attempt to centralize all backend auth and all admin UI in the same wave as the initial user shared-source-of-truth migration. User shared UI source of truth must become stable first.

