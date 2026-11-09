# RTH Web & Admin Deferred Integration & Architecture Acceptance Handoff

**Document Version:** 1.2.0  
**Date:** November 9, 2026  
**Governing Standard:** PSEG-001 (Project Software Architecture and Engineering Governance Standard)  
**Target Applications:**  
- `apps/realtutorialhub-web` (Learner Portal: Port 3003)  
- `apps/realtutorialhub-admin` (Brand Admin: Port 3002)  
- `apps/realtutorialhub-quiz` (Quiz & Assessment Engine)  
**Parent Register:** [`docs/architecture/reviews/SHARED_BRAND_INTEGRATION_HANDOFF.md`](file:///e:/onlinewebsites/quiz-platform/docs/architecture/reviews/SHARED_BRAND_INTEGRATION_HANDOFF.md)  
**Status:** **PROPOSED ARCHITECTURAL REGISTER — ZERO SOURCE MUTATION — ZERO COMMITS/PUSHES**  

---

## 1. Executive Summary & Online/AI Brand Paradigm

Real Tutorial Hub (RTH) delivers an **online, self-paced, AI-assisted learning experience**. Its educational architecture centers on:

1. **Self-Paced Progression:** Unrestricted navigation across all published tutorial topics without cohort locks or calendar restrictions.
2. **24/7 AI-Assisted Mentoring:** Inline AI chat assistant, automated code explanations, and interactive sandbox environments.
3. **Instant Automated Assessments:** Chapter-end quizzes evaluated automatically via `@quiz/db` with immediate feedback and retry mechanisms.
4. **Frictionless Digital Entitlement:** Instant self-registration or freemium subscription without manual admission interviews.
5. **Strict Application Partitioning:** Public learners navigate `apps/realtutorialhub-web`; brand content managers curate tutorials in `apps/realtutorialhub-admin`.

> [!IMPORTANT]
> Zero lines of application code in RTH repositories have been modified in this SHC Admin governance batch. All findings and requirements documented below represent a structured integration backlog for an authorized future RTH workstream.

---

## 2. RTH Issue Register (`RTH-HO-*`)

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-001** |
| **Capability** | Learner Tutorial Delivery Hydration via V2 Engine |
| **Logical owner** | SHC Tutorial Engine & RTH Delivery |
| **Current implementation owner** | `apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx` |
| **Affected consumer** | `apps/realtutorialhub-web` |
| **Evidence** | `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx#L45-L55` (`resolveRuntimeContext({ brandId: 'realtutorialhub', ... })`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | RTH Web consumes canonical published tutorials from PostgreSQL Neon database. It reuses shared `resolveRuntimeContext` and renders within `TutorialPageShell`. |
| **Risk** | Renderer mismatch: If a new block type authored in SHC Admin lacks a corresponding React component in RTH's block registry, the page may throw a rendering exception. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED ARCHITECTURE** |
| **Implementation maturity** | Implemented and verified in source |
| **Future acceptance test** | Request an authorized RTH tutorial URL on port 3003; verify `resolveRuntimeContext` resolves with `brandId: 'realtutorialhub'`, and blocks render correctly. |
| **Recommended correction** | Add fallback generic block renderer in `TutorialPageShell` to gracefully display unknown block types. |
| **Dependency** | `packages/db-tutorial`, `src/share-branding/LearningExperience/` |
| **Future workstream** | RTH Web Content Delivery |
| **Governance mapping** | PSEG-001 §3.1, §4.1 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-002** |
| **Capability** | Multi-Tenant Brand Isolation & Tenant Scoping |
| **Logical owner** | Central Authorization Engine |
| **Current implementation owner** | `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts#L70-L85` |
| **Affected consumer** | `apps/realtutorialhub-web` & `apps/realtutorialhub-admin` |
| **Evidence** | `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts#L75` (`brandId: params.brandId`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | RTH requests supply `brandId: 'realtutorialhub'`. Shared delivery queries fetch rows where `brand_id = 'realtutorialhub' OR brand_id IS NULL`. Service assertion guards reject mutations across brands. |
| **Risk** | Cross-tenant visibility: If a query omits the brand filter, SUIA private cohort materials could leak into RTH search results. |
| **Severity** | **High** |
| **Finding state** | **CONFIRMED ARCHITECTURE** |
| **Implementation maturity** | Implemented and verified |
| **Future acceptance test** | Attempt to fetch an SUIA-exclusive tutorial section using an RTH learner session; verify HTTP 404 or 403 response. |
| **Recommended correction** | Maintain strict `brand_id` filtering in all database repository queries. |
| **Dependency** | `packages/db-tutorial`, `packages/types` |
| **Future workstream** | Shared Backend / RTH Web |
| **Governance mapping** | PSEG-001 §5.2, SHCA-A05 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-003** |
| **Capability** | RTH Web Session & Cookie Isolation |
| **Logical owner** | Central Authentication Architecture |
| **Current implementation owner** | `packages/auth/src/middleware/cookie.middleware.ts`, `apps/realtutorialhub-web` |
| **Affected consumer** | `apps/realtutorialhub-web` |
| **Evidence** | `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx#L25` (`cookieStore.get('accessToken')?.value`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | RTH Web reads session tokens from `accessToken`. Cookies are configured with `SameSite=None; Secure=true; Domain=.realtutorialhub.com`. In local development, cookies fail to attach on plain `http://localhost:3003`. |
| **Risk** | Session drop during local development; unauthenticated redirect loops. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED** |
| **Implementation maturity** | Implemented but fragile in local dev |
| **Future acceptance test** | Log in on `http://localhost:3003/login`; verify session cookie persists across navigation and page reloads. |
| **Recommended correction** | Strip `Domain` attribute and disable `Secure` flag when running on `localhost`. |
| **Dependency** | `packages/auth`, `src/share-branding/auth/` |
| **Future workstream** | RTH Web Authentication |
| **Governance mapping** | PSEG-001 §5.1, SHCA-S01 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-004** |
| **Capability** | RTH Admin BFF Logout Route & Session Invalidation |
| **Logical owner** | RTH Admin Security Architecture |
| **Current implementation owner** | `apps/realtutorialhub-admin/src/app/api/auth/logout/route.ts` |
| **Affected consumer** | `apps/realtutorialhub-admin` (Brand Admin: Port 3002) |
| **Evidence** | `apps/realtutorialhub-admin/src/app/api/auth/logout/route.ts#L1-L28` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Implemented in baseline `8cd7a7ba`. The handler proxies the logout request to upstream API server and executes `clearAuthCookies(response, 'realtutorialhub', true)` and `clearAuthCookies(response, 'realtutorialhub', false)`. Awaiting real runtime qualification on port 3002. |
| **Risk** | Lingering admin sessions if real browser cookie clearance fails due to domain mismatch on local dev port 3002. |
| **Severity** | **High** |
| **Finding state** | **IMPLEMENTED IN SOURCE — RUNTIME QUALIFICATION PENDING** |
| **Implementation maturity** | Implemented but unverified at runtime |
| **Future acceptance test** | Execute real HTTP POST to `http://localhost:3002/api/auth/logout` with admin cookies; verify 200 response and Set-Cookie headers with `Max-Age=0` and matching domain. |
| **Recommended correction** | Validate port 3002 runtime execution with Playwright headless browser test. |
| **Dependency** | `apps/realtutorialhub-admin`, `packages/auth` |
| **Future workstream** | **RTH Admin Security Workstream (Dependency)** |
| **Governance mapping** | PSEG-001 §5.1, SHCA-S04 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-005** |
| **Capability** | Optimistic Concurrency in RTH Admin Composer |
| **Logical owner** | SHC Central Publishing & RTH Admin |
| **Current implementation owner** | `apps/realtutorialhub-admin/src/app/(admin)/tools/` |
| **Affected consumer** | `apps/realtutorialhub-admin` |
| **Evidence** | Review of RTH Admin content mutation routes |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | While SHC Admin now enforces `expectedVersion` across all tutorial write paths, RTH Admin composer tools still perform unversioned updates. If an RTH admin edits a shared tutorial, it could clobber concurrent edits. |
| **Risk** | Lost updates and concurrent modification clobbering. |
| **Severity** | **High** |
| **Finding state** | **CONFIRMED ARCHITECTURE GAP** |
| **Implementation maturity** | Partial |
| **Future acceptance test** | In RTH Admin composer, attempt to save a section when the underlying version has advanced; verify rejection with HTTP 409 and preservation of unsaved edits. |
| **Recommended correction** | Adopt `UpdateTutorialContentRequestSchema` with `expectedVersion` in RTH Admin composer and map `VersionConflictError` to HTTP 409. |
| **Dependency** | `packages/types`, `packages/db-tutorial`, `apps/realtutorialhub-admin` |
| **Future workstream** | RTH Admin Content Curation |
| **Governance mapping** | PSEG-001 §3.1, SHCA-U08, SHCA-F14 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-006** |
| **Capability** | Dual-DB Academic Hierarchy Sync for RTH Guide Discovery |
| **Logical owner** | Platform Data Architecture |
| **Current implementation owner** | MongoDB core & PostgreSQL Neon |
| **Affected consumer** | `apps/realtutorialhub-web` |
| **Evidence** | Reference `SHARED-INT-001` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Identical to `SHARED-INT-001`. RTH Web relies on consistent domain/subject/topic hierarchy between MongoDB catalog and PostgreSQL tutorial navigation trees. |
| **Risk** | Broken tutorial links and SEO 404 indexing errors. |
| **Severity** | **High** |
| **Finding state** | **CONFIRMED (Cross-Reference SHARED-INT-001)** |
| **Implementation maturity** | Partial |
| **Future acceptance test** | See `SHARED-INT-001` acceptance test. |
| **Recommended correction** | See `SHARED-INT-001` recommendation. |
| **Dependency** | `SHARED-INT-001` |
| **Future workstream** | Shared Backend / Database Architecture |
| **Governance mapping** | PSEG-001 §4.2, SHCA-U01 |
| **Owner approval** | **Required** |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-007** |
| **Capability** | Delivery Cache Invalidation Receiver for RTH Web |
| **Logical owner** | SHC Tutorial Engine & RTH Delivery |
| **Current implementation owner** | `apps/realtutorialhub-web` |
| **Affected consumer** | `apps/realtutorialhub-web` |
| **Evidence** | Reference `SHARED-INT-002` |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Identical to `SHARED-INT-002`. RTH Web lacks an automated webhook listener to revalidate ISR cached tutorial pages when content is updated centrally. |
| **Risk** | Stale tutorial delivery to self-paced learners. |
| **Severity** | **Medium** |
| **Finding state** | **CONFIRMED (Cross-Reference SHARED-INT-002)** |
| **Implementation maturity** | Partial |
| **Future acceptance test** | See `SHARED-INT-002` acceptance test. |
| **Recommended correction** | Add `POST /api/revalidate` in `apps/realtutorialhub-web`. |
| **Dependency** | `SHARED-INT-002` |
| **Future workstream** | RTH Web Content Delivery |
| **Governance mapping** | PSEG-001 §7.3, SHCA-F18 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-008** |
| **Capability** | Navigation Node URL Route Alignment |
| **Logical owner** | Central URL Architecture |
| **Current implementation owner** | `src/share-branding/LearningExperience/` |
| **Affected consumer** | `apps/realtutorialhub-web` |
| **Evidence** | `apps/realtutorialhub-web/src/app/tutorial-v2/.../page.tsx#L18` (`navigationNodeId: string`) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | RTH Web routes resolve `/:domainSlug/:subjectSlug/:topicSlug/:subtopicSlug/:navigationNodeId`. The persistent UUID `navigationNodeId` serves as the permalink route segment. |
| **Risk** | Discrepancy if search engines or external links use legacy slug-only format. |
| **Severity** | **Low** |
| **Finding state** | **CONFIRMED ARCHITECTURE** |
| **Implementation maturity** | Implemented and verified |
| **Future acceptance test** | Verify that legacy tutorial URLs automatically 301/308 redirect to the canonical `navigationNodeId` permalink route. |
| **Recommended correction** | Implement canonical route redirect in RTH Web middleware. |
| **Dependency** | `src/share-branding/LearningExperience/` |
| **Future workstream** | RTH Web Routing |
| **Governance mapping** | PSEG-001 §3.1 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-009** |
| **Capability** | AI Learning Assistant & Chatbot Handoff |
| **Logical owner** | RTH AI Mentoring |
| **Current implementation owner** | RTH AI Chatbot Components |
| **Affected consumer** | `apps/realtutorialhub-web` |
| **Evidence** | Inline AI chat assistant components in RTH learner UI |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | RTH Web integrates an AI Assistant resolving learner coding questions using vector embeddings. Embeddings must be scoped to public and RTH content. |
| **Risk** | Private data leakage: AI assistant vector search retrieving internal SHC governance notes or SUIA private cohort curriculum. |
| **Severity** | **Medium** |
| **Finding state** | **UNVERIFIED** |
| **Implementation maturity** | Implemented but unverified for tenant isolation |
| **Future acceptance test** | Query the RTH AI Assistant with prompt injections targeting SUIA cohort data; verify strict refusal and brand scoping. |
| **Recommended correction** | Enforce `brand_id = 'realtutorialhub'` filter in Upstash vector search queries. |
| **Dependency** | `@upstash/vector`, AI Chat service |
| **Future workstream** | RTH AI Mentoring |
| **Governance mapping** | PSEG-001 §5.2 |
| **Owner approval** | Not required |

---

| Field | Detail |
| :--- | :--- |
| **Issue ID** | **RTH-HO-010** |
| **Capability** | Headless E2E Qualification Suite for RTH Applications |
| **Logical owner** | Quality & Verification Architecture |
| **Current implementation owner** | Future automated test suite (`apps/realtutorialhub-web/scripts/verify-rth-e2e.mjs`) |
| **Affected consumer** | `apps/realtutorialhub-web` (Port 3003) & `apps/realtutorialhub-admin` (Port 3002) |
| **Evidence** | `apps/skillhubcore-admin/scripts/verify-scope-b1-e2e.mjs` (Reference implementation) |
| **SHA** | `ec82952d6852696d499e9ecfb15e2f554a120015` |
| **Observation** | Automated qualification scripts exist for SHC Admin on port 3007, but real HTTP/Chromium test suites for RTH on ports 3003/3002 are missing. |
| **Risk** | Undetected regressions in RTH login, tutorial rendering, or admin logout prior to production deployment. |
| **Severity** | **Medium** |
| **Finding state** | **DEFERRED VERIFICATION** |
| **Implementation maturity** | Not implemented |
| **Future acceptance test** | Execute `node apps/realtutorialhub-web/scripts/verify-rth-e2e.mjs`; verify 100% pass across learner navigation and admin logout roundtrip. |
| **Recommended correction** | Create automated Playwright E2E qualification script for RTH. |
| **Dependency** | `apps/realtutorialhub-web`, `apps/realtutorialhub-admin`, Playwright |
| **Future workstream** | Quality & Test Automation |
| **Governance mapping** | PSEG-001 §6.2 |
| **Owner approval** | Not required |

---

## 3. Dedicated RTH Admin Dependency Section (Authentication & Cookies)

A critical distinction must be maintained between `apps/realtutorialhub-web` (public learner portal) and `apps/realtutorialhub-admin` (authenticated brand admin portal):

```mermaid
flowchart TD
    subgraph Public Learner Realm [Port 3003: user.realtutorialhub.com]
        LClient[Learner Browser] --> LWeb[RTH Web App]
        LWeb -->|Learner Auth: rth_user_token| LBFF[/api/tutorial-v2, /api/ai-chat]
        LBFF -->|Fetch Published Tutorials & AI Hints| TDB[(Tutorial Database)]
    end

    subgraph Brand Admin Realm [Port 3002: admin.realtutorialhub.com]
        AClient[Brand Admin Browser] --> AApp[RTH Admin App]
        AApp -->|Admin Auth: rth_admin_token| ABFF[/api/auth, /api/tutorial-composer]
        ABFF -->|Version-Checked Content Curation| TDB
    end

    subgraph Central Super Admin [Port 3007: admin.skillhubcore.in]
        SHC[SHC Super Admin] -->|Curriculum Authoring & Governance| TDB
    end
```

### RTH Admin Security Truth Table:
1. **BFF Logout Route (`RTH-HO-004`):**
   - File: [`apps/realtutorialhub-admin/src/app/api/auth/logout/route.ts`](file:///e:/onlinewebsites/quiz-platform/apps/realtutorialhub-admin/src/app/api/auth/logout/route.ts)
   - Verified present at commit `ec82952d`. It proxies logout requests to `FALLBACK_API_BASE_RTH` and clears admin cookies via `clearAuthCookies(response, 'realtutorialhub', true)`.
   - **Remaining Task:** Execution of real HTTP integration test on port 3002 to verify browser cookie clearing under real network conditions.
2. **Admin Cookie Lifecycle:**
   - Cookie names: `admin_accessToken` (15 min expiry) and `admin_refreshToken` (24 hr expiry).
   - Flag attributes: `HttpOnly=true; Secure=true; SameSite=None; Path=/; Domain=.realtutorialhub.com`.
   - **Local Dev Isolation:** When testing on `localhost:3002`, `rewriteSetCookie` must ensure the domain attribute is omitted to prevent browser rejection over HTTP.
3. **Shared Admin Lock Screen:**
   - File: [`apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx`](file:///e:/onlinewebsites/quiz-platform/apps/realtutorialhub-admin/src/components/auth/AdminLockScreen.tsx)
   - Re-authenticates exclusively against `/api/auth/reauthenticate` or `/api/auth/login`. It never redirects to SHC Admin endpoints. If re-authentication fails, it invokes `/api/auth/logout` and fails closed.

---

## 4. Future Acceptance & Quality Gates for RTH

When an active implementation batch on RTH is commissioned by the project owner:

- [ ] **Gate RTH-1 (Build & Type Integrity):** `pnpm --filter @quiz/realtutorialhub-web type-check` and `pnpm --filter @quiz/realtutorialhub-admin type-check` pass with 0 errors.
- [ ] **Gate RTH-2 (Logout BFF Contract):** Real HTTP POST to `http://localhost:3002/api/auth/logout` returns 200 and expires `admin_accessToken` and `admin_refreshToken`.
- [ ] **Gate RTH-3 (Delivery Parity):** Real HTTP GET to `http://localhost:3003/tutorial-v2/...` successfully renders published canonical blocks (D1, C1, P1).
- [ ] **Gate RTH-4 (Concurrency Protection):** Simultaneous edit attempts on RTH Admin reject conflicting updates with HTTP 409.
- [ ] **Gate RTH-5 (Zero Cross-Brand Contamination):** Automated tests verify RTH learner cannot query or mutate SUIA brand content.
