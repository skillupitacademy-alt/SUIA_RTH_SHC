# SkillHubCore Admin — Phase 1 Architecture Audit (Source Evidence)

**Review date:** 8 November 2026 (Asia/Kolkata)  
**Scope:** `apps/skillhubcore-admin` and directly imported SHC Admin helpers. Other application code was *not* audited here.  
**Repository:** `skillupitacademy-alt/SUIA_RTH_SHC`  
**Branch:** `feature/project-llm-linux-worker`  
**Immutable source commit:** `4207cb1ca11abc29ca263310f5a4d54b859cd77f`  
**Audit type:** Read-only, source inspection + GitHub tree inventory. No application execution, test run, live Hostinger access, database query, or modifications.  
**Standard:** `ProjectSoftwareArchitectureStandard.md`, `ProjectServiceAcceptanceStandard.md`, `SHC_Admin_Architecture_Acceptance_Checklist_v1.md`.

> **Scope caution.** All 34 page entry files and 46 Next API route entry files were fetched and examined at least at entry-point/contract level. Selected auth, BFF, component, data, and orchestration modules were examined in more depth. This **does not** certify every nested component, shared downstream backend, or end-to-end business path. Source-level failures are called out separately from missing runtime proof. The current Hostinger deployment version was **not** established.

## Summary

- **34** page entries, **46** API route entries, **172** app tree tracked files, **32** separate `src/components` source files, **29** `src/lib` tree files, **21** test-like tracked paths under `src/app` (some are fixtures/helpers). These counts are inventory metrics, not coverage percentages.
- **16** grouped findings: 7 high and 9 medium. No demonstrated external exploit or runtime failure is claimed; severe source defects need follow-up testing.
- **Verdict:** **NOT ARCHITECTURE ACCEPTED / FAIL (source defects) + PENDING (runtime evidence)**. This is a pre-user development audit, not a declaration that a production system was attacked or that every feature is broken.
- **Preservation rule:** Do not delete SHC Admin pages, transfer brand-admin logic, migrate databases or change deployment based on this report. Reconcile with current worktree before remediation.

## What belongs here versus shared-domain owner

SHC Admin should remain the **control plane** for shared academic hierarchy, question content, tutorial authoring, marketing governance, global identity/entitlements, and platform operations. It is not required that all backend source files physically reside in `skillhubcore-service`. However, **one authoritative service/module must own each shared business rule**, and any BFF direct-DB access must be explicitly justified. RTH/SUIA brand admins continue to own their respective student operations; shared business capabilities must be reused.

## Detailed findings (verified from examined source)

### SHCA-001 — HIGH: Page access control for privileged server-rendered pages is browser-side

**Evidence:** `src/proxy.ts` only matches `/api/:path*`; protected page layouts use client `AdminGuard`. Unauthenticated page HTML/RSC payload denial has not been proven. Static data today reduces immediate PII exposure but not future risk.  
**Source locations:** `src/proxy.ts` L18; `(admin)/layout.tsx` L10-16; `components/auth/AdminGuard.tsx` L39 onward  
**Action / decision:** Add server-side page/session guard; negative HTTP GET and RSC tests before real-data views.  
**Acceptance gates:** `SHCA-F02, SHCA-F03, SHCA-A02, U-07`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-002 — HIGH: Sensitive user/subscription actions reference non-existent SHC Admin endpoints

**Evidence:** `TotpActionModal` calls `/api/admin/auth/verify-totp`; user and subscription pages call `/api/admin/users/*` and `/api/admin/subscriptions/*` absent from 46 API routes. Current UI cannot complete these flows through this app unless external rewriting is added, which next.config does not show.  
**Source locations:** `components/totp-action-modal.tsx` L37; `(admin)/users/page.tsx` L69-77; `(admin)/subscriptions/page.tsx` L35-62  
**Action / decision:** Label disabled/unfinished; later integrate authoritative SHC role/entitlement and TOTP service, test negative/positive.  
**Acceptance gates:** `SHCA-F05, SHCA-F06, SHCA-A01, U-06`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-003 — HIGH: Academic hierarchy BFF directly mutates database and hard-deletes records

**Evidence:** Domains/subjects/topics/subtopics/skills routes use `getDb()` / Drizzle in route handlers; multiple DELETE paths use `.delete(...)` including comment claiming soft delete. Bulk deletion lacks explicit dependency analysis in handler.  
**Source locations:** `api/admin/domains/route.ts` L139-169; `api/admin/subtopics/batch-delete/route.ts` L6-20  
**Action / decision:** Retain SHC Admin UI; establish single hierarchy authority and deletion policy; migrate after contract/compatibility tests.  
**Acceptance gates:** `SHCA-A04, SHCA-F11, U-01, U-02, U-08`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-004 — HIGH: Demo records presented in global user/subscription/audit/event/metrics views

**Evidence:** Static `skillhubcore-admin-data.ts` contains example identities, plans, audit data and KPIs imported directly by several SHC Admin pages.  
**Source locations:** `lib/skillhubcore-admin-data.ts` L40-125; `(admin)/users/page.tsx` L4; `(admin)/audit/page.tsx` L5; `(admin)/metrics/page.tsx` L1  
**Action / decision:** Replace with authoritative SHC APIs or clearly label and hide demo views in operational mode.  
**Acceptance gates:** `SHCA-F04..F07, SHCA-F21, U-10`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-005 — HIGH: Dashboard hardcoded enrollment, exam and placement statistics

**Evidence:** Dashboard shows hardcoded totals including 128,540 users and 98,765 learners despite project development phase with no real end users.  
**Source locations:** `(admin)/dashboard/page.tsx` L30-37  
**Action / decision:** Serve measured totals from responsible shared service, or prominently mark development mock.  
**Acceptance gates:** `SHCA-F04, SHCA-F21, U-10`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-006 — HIGH: Project AI review approval is local component state

**Evidence:** Specification-review page toggles `approved` using `useState`/`setApproved(true)` and displays Human Sign-Off; no authoritative submission is visible in that handler. This is not a trustworthy approval record.  
**Source locations:** `(admin)/tools/project-llm/specification-review/page.tsx` L14, L180-205  
**Action / decision:** Require backend sign-off with actor, workflow version, audit event, policy; distinguish demo UI until integrated.  
**Acceptance gates:** `SHCA-F18, SHCA-F20, U-08`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-007 — HIGH: Marketing governance uses React Query without visible provider in parent layouts

**Evidence:** Marketing page calls `useQuery` five times; root layout, admin layout, ClientShell and AdminGuard inspected without `QueryClientProvider`. Likely client runtime error; confirm in browser.  
**Source locations:** `(admin)/marketing/page.tsx` L29-58; `app/layout.tsx`; `(admin)/layout.tsx`; `(admin)/ClientShell.tsx`  
**Action / decision:** Add correct React Query provider at intended boundary or replace fetch layer, then test page rendering.  
**Acceptance gates:** `SHCA-F08, SHCA-F22, U-11`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-008 — MEDIUM: Login redirect target is accepted from query string without validation

**Evidence:** `router.push(redirectTarget || "/dashboard")` receives untrusted `searchParams.get("redirect")`. Must restrict to safe relative routes; Next warns against dangerous URL schemes.  
**Source locations:** `(public)/login/page.tsx` L64-65  
**Action / decision:** Validate route starts with single `/` and is approved, reject `//`, scheme-based and control character values.  
**Acceptance gates:** `SHCA-F01, U-07`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-009 — MEDIUM: Brand authorization helper is role-only

**Evidence:** `requireBrandAccess` and `requireSubtopicAccess` check tutorial-author role, not actual brand or assigned subtopic; source marks fine-grained grant checks as future enhancements. Central SHC admin may intentionally be cross-brand but permissions must be explicit/audited.  
**Source locations:** `lib/auth-helpers.ts` L340-410  
**Action / decision:** Specify global SHC vs brand-limited admin roles and test each tenant/content action.  
**Acceptance gates:** `SHCA-I01, SHCA-I03, U-07`  
**Status:** **PENDING — risk requires deeper verification**; runtime exploit/impact remains unverified where noted.

### SHCA-010 — MEDIUM: Navigation includes inactive and unimplemented links

**Evidence:** Left sidebar includes `#` placeholders and `/content-intelligence/...` hrefs with no matching Next page in the examined app tree.  
**Source locations:** `(admin)/components/LeftSidebar.tsx` L82-88, L112-116, L140-145  
**Action / decision:** Hide or label unavailable links and add route-link integrity E2E.  
**Acceptance gates:** `SHCA-F02, SHCA-F22`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-011 — MEDIUM: Tutorial sidebar API combines multiple authoritative concerns

**Evidence:** 945-line route combines hierarchy synchronization, cross-database persistence, public navigation publishing and logging; transaction is scoped to tutorial DB while upstream hierarchy is separately read.  
**Source locations:** `api/tutorial-left-sidebar/route.ts` L97-520, L723-945  
**Action / decision:** Define orchestration ownership, measure complexity and write dual-database failure/consistency tests before splitting.  
**Acceptance gates:** `SHCA-A07, SHCA-F16, U-02, U-08`  
**Status:** **PENDING — risk requires deeper verification**; runtime exploit/impact remains unverified where noted.

### SHCA-012 — MEDIUM: Hierarchy listing query limit is parsed without bounded validation

**Evidence:** Several list handlers use `parseInt(query.limit || "20")` directly and pass `limit + 1` into database query; malformed/negative/large numbers lack bounded schema validation.  
**Source locations:** `api/admin/domains/route.ts` L15-35; `api/admin/subtopics/route.ts` L15-35  
**Action / decision:** Use shared cursor/limit schema with defined min/max and consistent pagination semantics.  
**Acceptance gates:** `SHCA-A04, U-06, U-09`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-013 — MEDIUM: Tutorial block composer has unreachable page implementation

**Evidence:** `/tools/tutorial-block-composer` immediately redirects to `/tools/tutorial-page-content`, leaving the rest of the 234-line function unreachable.  
**Source locations:** `(admin)/tools/tutorial-block-composer/page.tsx` L114-117  
**Action / decision:** Retain redirect; later remove unreachable UI only after link/consumer checks.  
**Acceptance gates:** `SHCA-F15, U-04`  
**Status:** **FAIL — source-level defect identified**; runtime exploit/impact remains unverified where noted.

### SHCA-014 — MEDIUM: Project AI catch-all forwards arbitrary backend paths by default

**Evidence:** Adapter concatenates catch-all segments into backend path, uses request-text buffering and forwards GET/POST/PUT/DELETE. Backend enforcement is documented but not verified; upload size and cancellation handling require tests.  
**Source locations:** `api/project-llm/[...path]/route.ts` L52-96, L152-200  
**Action / decision:** Inventory backend route permissions; allowlist if needed, bound payload and verify worker authorization and timeouts.  
**Acceptance gates:** `SHCA-A08, SHCA-F19, U-07, U-09`  
**Status:** **PENDING — risk requires deeper verification**; runtime exploit/impact remains unverified where noted.

### SHCA-015 — MEDIUM: Marketing proxy response and timeout behavior needs qualification

**Evidence:** Brand ID interpolated into downstream path; several `fetch` calls have no explicit timeout/allowlist. These are protected admin APIs; failure behavior and vendor config should be tested.  
**Source locations:** `api/marketing/bootstrap/[brandId]/route.ts` L24-50; `api/marketing/control-plane/[brandId]/route.ts` L24-50  
**Action / decision:** Validate brand ID against known catalog, set bounded timeout and verify upstream error mapping.  
**Acceptance gates:** `SHCA-A09, U-06, U-09`  
**Status:** **PENDING — risk requires deeper verification**; runtime exploit/impact remains unverified where noted.

### SHCA-016 — MEDIUM: No reproducible runtime/CI evidence captured during read-only source audit

**Evidence:** 21 test-like files identified in SHC app route tree, security and boundary scripts exist. None were executed here; deployed Hostinger image SHA, database integration results and cross-brand E2E remain unknown.  
**Source locations:** `package.json` scripts; `scripts/check-api-boundaries.mjs`; `infra/hostinger/compose`  
**Action / decision:** Run local commands against safe test env and capture exact source SHA, results, image digest, smoke/auth checks.  
**Acceptance gates:** `SHCA-D01..D08, U-11..U-13`  
**Status:** **PENDING — risk requires deeper verification**; runtime exploit/impact remains unverified where noted.

## Frontend route-by-route entrypoint matrix

All routes below are Next.js page entrypoint reviews. Unless specifically found failing, a PENDING status means source wiring exists but relevant nested component, live-data or runtime verification has not been completed.

| Page | Entry file | Ownership decision | Primary observation | Status |
|---|---|---|---|---|
| `/` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/page.tsx) | Keep | Redirect to dashboard; server-side authorization inherited only from client-admin layout, review HTTP response guard | **PENDING** |
| `/login` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28public%29/login/page.tsx) | Keep, fix | After login forwards unvalidated URL `redirect` to `router.push`; guard destination to same-origin approved path | **FAIL** |
| `/dashboard` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/dashboard/page.tsx) | Keep, replace fixtures | Hardcoded user/learner/course/exam/placement figures presented without demonstration label | **FAIL** |
| `/users` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/users/page.tsx) | Keep, integrate | Demo users; search input not wired; two sensitive actions target endpoints absent from app API inventory | **FAIL** |
| `/users/[userId]` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/users/%5BuserId%5D/page.tsx) | Keep, integrate | Reads mock user, subscriptions and audit; step-up action endpoints absent | **FAIL** |
| `/subscriptions` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/subscriptions/page.tsx) | Keep, integrate | Static subscriptions; inert filters; update/cancel endpoints absent | **FAIL** |
| `/subscriptions/[id]` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/subscriptions/%5Bid%5D/page.tsx) | Keep, integrate | Static record; hardcoded plan prices; step-up endpoints absent | **FAIL** |
| `/audit` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/audit/page.tsx) | Keep, integrate | Client-side filtering of static `adminAuditLogs`; not authoritative audit history | **FAIL** |
| `/events` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/events/page.tsx) | Keep, integrate | Static `adminEventLog`/metrics; not authoritative delivery state | **FAIL** |
| `/metrics` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/metrics/page.tsx) | Keep, integrate | Static KPI values and distributions | **FAIL** |
| `/marketing` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/marketing/page.tsx) | Keep, verify provider | Real brand-aware API queries; no `QueryClientProvider` found in inspected root/admin layouts or ClientShell | **FAIL** |
| `/certificate-generator` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/certificate-generator/page.tsx) | Keep, verify issuance | Uses shared `@quiz/marketing-site` certificate generator; eligibility/signature/revocation not verified | **PENDING** |
| `/certificate-preview` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/certificate-preview/page.tsx) | Keep, verify | Uses shared certificate preview; proof of brand-correct durable issuance absent | **PENDING** |
| `/content-generation/layman-architecture` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/content-generation/layman-architecture/page.tsx) | Review/label demo | Mostly presentational architecture screen with controls lacking action handlers | **FAIL** |
| `/tools/tutorial-block-composer` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/tutorial-block-composer/page.tsx) | Redirect/retire safely | Immediately redirects to page-content; remainder of 234-line page unreachable | **FAIL** |
| `/tools/tutorial-left-sidebar` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/tutorial-left-sidebar/page.tsx) | Keep, qualify | Real builder client; backend implementation large/dual database and brand policy checks pending | **PENDING** |
| `/tools/tutorial-page-content` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/tutorial-page-content/page.tsx) | Keep, qualify | Modular editor/hook pipeline and draft/publish controls present; runtime/brand tests pending | **PENDING** |
| `/tools/project-llm` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/page.tsx) | Keep, verify | Broad dashboard with static presentation and backend-linked pathways; statuses need authoritative provenance | **PENDING** |
| `/tools/project-llm/registry` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/registry/page.tsx) | Keep, verify | Static/reference block corpus registry, distinguish reference vs live service state | **PENDING** |
| `/tools/project-llm/explorer` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/explorer/page.tsx) | Keep, verify | Reference version descriptions and registry; verify labels/actual provenance | **PENDING** |
| `/tools/project-llm/matrix` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/matrix/page.tsx) | Keep/mark illustration | Local relationship rule data, not yet shown as durable governed configuration | **PENDING** |
| `/tools/project-llm/mix-match` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/mix-match/page.tsx) | Keep, verify | Local component selection and optimistic quality assertions; backend validation needed | **PENDING** |
| `/tools/project-llm/create` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/create/page.tsx) | Keep, verify | Uses projectLlmClient to create workflow; contract and state transition tests pending | **PENDING** |
| `/tools/project-llm/compliance-brief` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/compliance-brief/page.tsx) | Keep, verify | Backend engineering contract integration; static requirement cards also present | **PENDING** |
| `/tools/project-llm/specification-review` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/specification-review/page.tsx) | Keep, fix | Human review approval is component-local `useState`, not a durable signed-off backend event | **FAIL** |
| `/tools/project-llm/external-ai-handoff` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/external-ai-handoff/page.tsx) | Keep, verify | Backend engineering contract + external handoff; review security and AI-provider failure handling | **PENDING** |
| `/tools/project-llm/candidate-upload` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/candidate-upload/page.tsx) | Keep, qualify | Backend candidate upload present; file limits/long operations and source provenance require tests | **PENDING** |
| `/tools/project-llm/integration-certification` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/integration-certification/page.tsx) | Keep, qualify | Substantial certification workflow (~2480 lines); service-backed result vs visual claims needs tests | **PENDING** |
| `/tools/project-llm/workflow-details` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28admin%29/tools/project-llm/workflow-details/page.tsx) | Keep, verify | Backend state polling/use callback; transitions/history/ownership tests pending | **PENDING** |
| `/questions` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28authenticated%29/questions/page.tsx) | Keep, qualify | Tables for hierarchy and questions; route contract and permissions need E2E | **PENDING** |
| `/questions/new` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28authenticated%29/questions/new/page.tsx) | Keep, qualify | Shared API client, manual and bulk authoring; data contract/security review pending | **PENDING** |
| `/questions/[id]/edit` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28authenticated%29/questions/%5Bid%5D/edit/page.tsx) | Keep, qualify | API client and hierarchy selection; versioning/publish integrity pending | **PENDING** |
| `/factory/question-generator` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28authenticated%29/factory/question-generator/page.tsx) | Keep, qualify | Factory context/review service; non-production mock-job branch exists; regression tests pending | **PENDING** |
| `/factory/question-generator/review` | [`page.tsx`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/%28authenticated%29/factory/question-generator/review/page.tsx) | Keep, qualify | Question review console/context; approval persistence/permission tests pending | **PENDING** |

## API/BFF route-by-route entrypoint matrix

All routes below were inspected at route-handler level. **FAIL** refers to observed source-level architecture/validation/deletion problems, not to executed tests. PENDING means no acceptance without backend-contract and runtime checks.

| Route file | Area | Integration/implementation pattern | Finding / verification still needed | Status |
|---|---|---|---|---|
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/auth/me/route.ts) | Identity/session | Shared service proxy | Auth/session response and permission checks | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/blueprints/route.ts) | Question-blueprint | Upstream API proxy | Contract and update permission tests | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/blueprints/%5Bid%5D/route.ts) | Question-blueprint | Upstream API proxy | Object ownership and deletion rules | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/questions/route.ts) | Question bank | Upstream API proxy | Validation and question provenance | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/questions/%5Bid%5D/route.ts) | Question bank | Upstream API proxy | Object-level approval/deletion | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/questions/bulk/route.ts) | Question bank | Upstream API proxy | Batch input bounds and partial failure | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/questions/batch-delete/route.ts) | Question bank | Upstream API proxy | Dependency/permission checks | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/domains/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct ORM; hard-delete despite soft-delete comment; unbounded limit; schema gaps | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/domains/%5Bid%5D/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct ORM hard delete, weak schema validation | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/domains/batch-delete/route.ts) | Academic hierarchy | Direct `@quiz/db` bulk delete | Hard delete without verified dependency guard | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/subjects/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct ORM and unbounded pagination/deletion | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/subjects/%5Bid%5D/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Hard delete and permissive payload | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/subjects/batch-delete/route.ts) | Academic hierarchy | Direct `@quiz/db` bulk delete | Hard delete without established dependency policy | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/topics/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct ORM; duplicated CRUD and weak bounds | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/topics/%5Bid%5D/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct hard delete | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/topics/batch-delete/route.ts) | Academic hierarchy | Direct `@quiz/db` bulk delete | Bulk hard delete | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/topics/%5Bid%5D/skills/route.ts) | Academic hierarchy | Upstream API proxy | Contract and topic-skill relationship checks | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/subtopics/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct ORM, hard deletes and validation bounds | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/subtopics/%5Bid%5D/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Hard delete and weak schema validation | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/subtopics/batch-delete/route.ts) | Academic hierarchy | Direct `@quiz/db` bulk delete | Bulk hard delete without dependency check | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/skills/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Direct ORM hard delete and unbounded limit | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/skills/%5Bid%5D/route.ts) | Academic hierarchy | Direct `@quiz/db` CRUD | Hard delete and weak input policy | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/admin/skills/batch-delete/route.ts) | Academic hierarchy | Direct `@quiz/db` bulk delete | Hard delete | **FAIL** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/auth/login/route.ts) | Auth | Upstream login proxy | Origin and cookie issuance present; wrong-password/error cases not executed | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/auth/logout/route.ts) | Auth | Upstream logout proxy | Cookie clearance and upstream revocation evidence pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/auth/me/route.ts) | Auth | Upstream identity proxy | JWT and role checks present; runtime verification pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/factory/check-duplicates/route.ts) | Factory | Upstream API proxy | Duplicate semantic rules and input bounds | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/factory/save/route.ts) | Factory | Upstream API proxy | Bulk save transaction and idempotence | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/health/route.ts) | Operations | Local health endpoint | Liveness-only vs readiness semantics | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/logs/client/route.ts) | Observability | Upstream API proxy | PII-safe log size/content/correlation | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/marketing/bootstrap/%5BbrandId%5D/route.ts) | Marketing | HTTP downstream proxy | Brand ID/timeout/upstream error contract | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/marketing/control-plane/%5BbrandId%5D/route.ts) | Marketing | HTTP downstream proxy | Brand ID allowlist and response/timeout | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/marketing/collector/observability/route.ts) | Marketing | HTTP downstream proxy | Correct health representation, authorization and timeout | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/project-llm/%5B...path%5D/route.ts) | Project AI | Authenticated catch-all proxy | No visible path allowlist; backend auth, input bounds, timeouts and method map need tests | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/analysis/route.ts) | Tutorial | Shared tutorial service | Schema validated; subtopic/brand policy testing pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/block-suggestions/route.ts) | Tutorial | Shared tutorial service | Schema validated; brand policy tests pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/import/route.ts) | Tutorial | Shared tutorial service | Schema validated; input limits + brand tests | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/presentation-ideas/route.ts) | Tutorial | Shared tutorial service | Schema validated; suggestion ownership/replay tests | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts) | Tutorial | Shared tutorial service | Server-side list lacks local `requireBrandAccess` filter; verify intended SHC-global privilege | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/%5BsectionId%5D/route.ts) | Tutorial | Shared tutorial service | Brand-aware object authorization present; tests/DB owner pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/%5BsectionId%5D/blocks/route.ts) | Tutorial | Shared tutorial service | Brand-aware append and schema present; durability tests pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/%5BsectionId%5D/publish/route.ts) | Tutorial | Shared tutorial service | Brand-aware publish; student portal visibility tests pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/%5BsectionId%5D/suggestions/apply/route.ts) | Tutorial | Shared tutorial service | Optimistic version workflow present; negative/rollback tests pending | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/hierarchy/route.ts) | Tutorial navigation | Direct `@quiz/db` read | Canonical hierarchy owner and contract needed | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/navigation-nodes/route.ts) | Tutorial navigation | Direct multi-db read | Brand and main/tut DB ID mapping verification | **PENDING** |
| [`route.ts`](https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/blob/4207cb1ca11abc29ca263310f5a4d54b859cd77f/apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts) | Tutorial navigation | Multi-database orchestration | 945-line BFF mixes hierarchy synchronization, tutorial DB transaction, navigation publication | **FAIL** |

## Security boundary evaluation

**Evidence of existing positive controls (implementation present, not runtime-passed):**

- `src/lib/auth-helpers.ts`: verifies an admin token with `audience: 'shc-admin'`, checks `brand === 'skillhubcore'`, normalizes roles and maps permissions.
- `src/lib/admin-route-guard.ts`: server-side `requireAdminRequest`, role/permission matrix and origin validation for mutations; page protection requires an independent review because `src/proxy.ts` matches `/api/*` only.
- `src/lib/upstream-proxy.ts`: rebuilds trusted identity headers and brand `skillhubcore` for upstream rather than forwarding browser-supplied identity headers wholesale.
- `src/app/api/tutorial-composer/*`: several operations validate typed schemas and use `@quiz/db-tutorial` services; operations that fetch an existing tutorial verify its brand through `requireBrandAccess`. This helper is role-only and therefore still needs a documented SHC-global/brand-specific access policy.
- `scripts/check-api-boundaries.mjs`: static tripwire for API guard presence, useful but not a substitute for negative authorization tests.

**Blocking checks to execute before real-data operation:** unauthenticated SSR/RSC page fetch, forbidden admin-role JWT, forged brand header and direct-origin requests, cross-brand tutorial write, hard-delete dependency case, staff privilege escalation and TOTP unavailable-route behavior.

## Functional workflows / backend owners

| Workflow | Existing code to preserve | SHC ownership decision needed | Follow-up evidence |
|---|---|---|---|
| Academic taxonomy | `api/admin/{domains,subjects,topics,subtopics,skills}` | Canonical hierarchy service/repository; admin pages remain in SHC | Current database authority, FK/delete policy, migration compatibility |
| Question bank/blueprints | `api/admin/questions/*`, `blueprints/*`, `api/factory/*` | Existing upstream shared API may already own domain; confirm | Exact backend routes, permissions, idempotency, negative tests |
| Tutorials/content | `api/tutorial-composer/*`, editor and hooks | Existing `@quiz/db-tutorial` service; avoid unnecessary physical relocation | Both SUIA and RTH publish/display compatibility, versions and draft isolation |
| Tutorial left sidebar | `api/tutorial-left-sidebar/*`, sidebar builder | Clarify cross-DB sync authority | Dual-database failure and idempotent publication tests |
| User and subscriptions | Presentational screens and `TotpActionModal` | SHC identity/subscription authority | Actual API routes, TOTP confirmation and permissions |
| Certificates | `@quiz/marketing-site/certificates/*` UI | SHC issuance/eligibility authority to confirm | Real eligibility/issuance/revocation, brand template and authenticity |
| Marketing governance | `api/marketing/*`, React Query dashboard | Shared marketing/collector governance | Query provider, brand allowlist, safe analytics views |
| Project AI | `api/project-llm/[...path]`, tool pages | Dedicated Project AI backend with SHC governance | Request allowlist, permissions, durable approvals and tests |

## Test and operations acceptance — all PENDING

**Existing local commands (not executed in this audit):**

```bash
pnpm --filter @quiz/skillhubcore-admin check:boundaries
pnpm --filter @quiz/skillhubcore-admin lint
pnpm --filter @quiz/skillhubcore-admin type-check
pnpm --filter @quiz/skillhubcore-admin test:security
pnpm --filter @quiz/skillhubcore-admin test
pnpm --filter @quiz/skillhubcore-admin build
```

Before actually running, verify that tests and fixtures do not point at your development or Hostinger database; use isolated test credentials/storage. Then test both brands' real content consumption, negative auth, browser accessibility, route integrity, Docker health and failure behavior. The project presently uses local Docker/Hostinger deployment; no GitHub Actions requirement is imposed. Record SHA, image digest and results from approved local checks.

## Proposed action queue (NOT permission to change code)

1. **Security first:** make privileged page responses fail closed on the server; verify bad/foreign JWT and auth before connecting real data.
2. **Honest operational screens:** label or disable static dashboard/user/subscription/audit/event/metric screens; make missing TOTP actions non-operative until SHC APIs exist.
3. **Academic ownership:** document hierarchy owner, deletion safeguards, shared API and DB path before refactoring or moving logic.
4. **Project AI review integrity:** move human approval to durable backend workflow before treating it as an acceptance gate.
5. **Runtime correctness:** verify marketing page QueryClient provider, login redirect validation, sidebar nav paths and content-page redirect cleanup.
6. **Do not begin enquiry migration:** complete SUIA Web, RTH Web and both marketing-site app audits first, then derive the cross-app ownership matrix as agreed.

## Limits of this audit

- No secure remote read of the running Hostinger container or image SHA; deployed code may differ from repository snapshot.
- No GitHub workflow/CI assertions; this project intentionally runs local quality checks.
- No test run, load result, database schema migration execution or browser replay.
- No comprehensive deep review of every nested component, schema and external service. This document is an **entrypoint-complete, targeted static source first pass**.
- Absence of a route in this SHC Admin route tree does not by itself prove the service is absent elsewhere; for SHC Admin's action wiring, an app-local route or configured rewrite must be traced.
