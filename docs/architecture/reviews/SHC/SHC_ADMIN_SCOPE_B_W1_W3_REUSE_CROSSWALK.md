# SHC Admin Scope B — W1–W3 reuse crosswalk and revised change manifest

Date: 2026-11-08. Reviewer: Sol architectural-review role.
Disposition: **READ-ONLY REVIEW COMPLETE; proposed changes await owner review.**

## 1. Inspected baseline and authority

- Actual local branch: `main`.
- Inspected HEAD: `322aa3bc5b57376ce2023ffcf5262bb51c5cf9de`.
- Scope A implementation ancestor: `8c8f86a394aafb8391d99711b8aa14e0970194e0`.
- Existing focused Scope B design: `SHC_ADMIN_SCOPE_B_SECURITY_DESIGN_REVIEW.md`, introduced in ancestor `914fdcd47b9e6ee2676bb5101db7d197cde019d3`. Its conditional design decision remains authoritative; this crosswalk narrows its implementation scope rather than replacing it.
- No remote fetch, new GitHub HEAD verification, test execution or runtime qualification was performed for this source/evidence review. Historical test results below retain their original revision and scope.
- The checkout was already dirty with Scope A test/evidence changes. During this review, additional test changes were visible. Those files were not edited or restored by this review. Only this supporting report was authored; neither the canonical 62-row ledger nor its manifest was changed.

`audit/FinalAechitecture.md:321–335` requires single ownership, server-side authorization, explicit validated brand context and testability. Lines 745–755 require reuse of authoritative business logic, with local adapters only where they provide real value. Lines 855–875 distinguish tenant learner authority from people projections. This supports adapting the existing SHC verifier to server pages, not introducing another JWT issuer, role table, session store or general authentication framework. SHC's own administrative people accounts must not be confused with tenant learner projections.

All full commit IDs in section 8 were checked with `git merge-base --is-ancestor <SHA> HEAD`; each returned exit 0. Relevant implementation files were read in current `main`. An ancestral commit establishes provenance, not proof that its historical tests passed again at today's HEAD.

## 2. Capability crosswalk

Paths in this report are repository-relative. SHC paths are under `apps/skillhubcore-admin`; API paths under `apps/api-server`. Evidence details and full SHAs follow the table.

| Capability | Existing implementation in current main | Provenance | Evidence and limits | Remaining gap / Scope B change genuinely needed? |
| --- | --- | --- | --- | --- |
| JWT signing and verification | **Present.** `packages/auth/src/token.service.ts:116,281,407–433`: shared identity validation, signing and admin verification. `apps/api-server/src/modules/auth/token.service.ts` re-exports this implementation. SHC `src/lib/auth-helpers.ts:53–97` selects existing access cookies, calls `verifyAdminAccessToken(..., { audience: 'shc-admin' })`, requires `brand === 'skillhubcore'`, normalizes roles and maps identity. SHC login signs through that same TokenService. | P1, P2, P3, P14 | Shared token tests and SHC security tests exist; prior focused Scope B review records 61 passing SHC security tests. AQ-03 additionally verifies a bounded real SHC login/control journey. None is a new 32-page server-guard test. | **No new cryptography or issuer. Yes to reuse/wiring.** Extract/adapt the existing verification operation for request and server-cookie callers without changing existing API behavior. Do not infer current account status or revocation from a valid signature. Any issuer/algorithm/required-expiry tightening beyond the existing contract needs explicit compatibility evidence; it is not automatically authorized here. |
| Shared roles and permissions | **Present.** `packages/auth/src/rbac/{roles.ts,normalize-roles.ts,rbac.service.ts,role-permissions.ts,enforcer.ts,rbac.guard.ts,ownership.service.ts}`. SHC `auth-helpers.ts:174–320` uses shared admin-level and action permission checks; `admin-route-guard.ts:64–91` checks route permissions before effects. Shared admin level is admin/super_admin. | P3, P4, P5, P6 | `packages/auth/src/rbac/__tests__/{rbac.service.test.ts,ownership.service.test.ts,sol-fnd03-tenant-boundary.test.ts}`; SHC `admin-boundary.test.ts`. Source and earlier review evidence, not newly executed tests. | **No new RBAC system. Yes to client/server policy alignment.** Existing client `infrastructure` acceptance must not become a new server grant. Stored browser roles and development bypasses cannot authorize protected pages. Page policy should reference existing permissions rather than define a second role-to-permission matrix. |
| Gateway and API security | **Present and wired.** `services/api-gateway/src/index.ts` invokes trusted-brand resolution and `middleware/auth.ts`; it is not merely an inert proxy. API `src/proxy.ts` and `src/lib/request-brand.ts` enforce their existing ingress/admin/tenant contracts. SHC `src/lib/{admin-route-guard.ts,upstream-proxy.ts}` performs JWT/role/action checks, origin checks and trusted upstream header reconstruction. SHC `src/proxy.ts:5–19` currently matches API paths only. | P3, P7, P8, P15; later origin compatibility adjustment P16 | SHC `src/lib/__tests__/{admin-boundary.test.ts,upstream-proxy.test.ts}`: earlier reported 56 + 5 passes. Existing `check:boundaries` reported 80 guarded handlers. Gateway auth and API `admin-01-proxy.test.ts` tests exist. Static guard coverage does not prove every object's authorization or deployed gateway behavior. | **Do not rewrite gateway/API controls. Yes to extending the existing SHC Proxy to actual page URLs.** Preserve public health/login/logout behavior, mutation origin checks, all handler guards and trusted-header reconstruction. Auth route exceptions in API Proxy require their endpoint's own verification; they are not evidence that current SHC account checks are complete. |
| Current account, token expiry, revocation and refresh | **Components present; SHC integration incomplete.** Shared JWT verifies expiration when present; defaults are access 8h and refresh 7d. SHC `src/lib/admin-session-cookies.ts` uses existing four compatibility cookies. API `src/modules/auth/shc-auth.service.ts:166–219` reads current SHC/non-deleted people account, returns role/isActive, and attempts refresh-token revocation at logout. `src/modules/auth/repositories/token.repository.ts`, `global-logout.service.ts` and `token-refresh.service.ts` implement owner-scoped revocation and atomic refresh controls. | P1, P9, P10, P11, P12, P14, P17 | Accepted W1.2 SESS-01 and REFRESH-02/03 evidence is scoped, with follow-ups. `batch-08-shc-session-binding.test.ts` exercises actual SHC service with isolated dependencies and demonstrates the SHC refresh binding gap. Policy decision remains pending. Tenant REFRESH-05/06 freshness tests do not certify SHC. | **A real SHC freshness gap exists; no duplicate session infrastructure.** `/api/shc/auth/me` returns isActive/current role but does not itself reject inactive/demoted accounts; its catch maps outages to 401. SHC issues an unregistered refresh JWT and has no mounted SHC refresh route. Logout revocation failure is absorbed; it does not invalidate an already issued access JWT. Current-account integration can be bounded, but full lifecycle/revocation behavior requires the existing pending owner policy decision. Do not silently include a new lifecycle model in Scope B. |
| 32 protected SHC pages | **Pages present; server-page admission missing.** `src/app/(admin)/layout.tsx:10–16` and `(authenticated)/layout.tsx:11–17` render `AdminGuard → ClientShell → children`. `src/proxy.ts` matches `/api/:path*` only. `src/components/auth/AdminGuard.tsx` is a client guard with a question-route development bypass, cached-user shortcut and combined 401/403 login behavior. | Original shell P18; API hardening P3; existing Scope B design P19 | Current mechanical inventory: 34 `page.tsx` files, 32 in protected groups, `/` and `/login` outside. Prior AQ-03 verifies login/API control, not server rejection for these 32 pages. | **Yes: this is the principal new Scope B work.** Add server admission through the existing verifier, retain both shells and auth synchronization, distinguish unauthenticated/forbidden/unavailable, and test direct HTML/RSC/prefetch/HEAD as applicable. Layout checks cannot substitute for data-boundary checks. |
| Sensitive reads/writes and cross-brand permission | **Existing controls present, with limits.** SHC `admin-route-guard.ts` and `upstream-proxy.ts`; tutorial `src/app/api/tutorial-composer/sections/[sectionId]/route.ts:95–118,168–191,279–302` applies request/action and resource helpers. `auth-helpers.ts:340–409` implements `requireSubtopicAccess`/`requireBrandAccess`. Shared `ownership.service.ts`/`enforcer.ts` enforce canonical tenant/local-owner rules, including self-only profile policy. | P3, P5, P6, P7, P8 | SHC boundary tests validate guard/header behavior. Tutorial route tests can mock the brand/subtopic helpers, so they do not prove assigned-brand enforcement. Shared tenant ownership tests do not automatically apply to SHC's platform-admin policy. | **Preserve existing enforcement; no blanket backend rewrite.** The SHC resource helpers currently grant by authoring role/permission; assigned brand/subtopic checks are explicit future placeholders. A successful shell check is not a cross-brand grant. Fine-grained assignment enforcement is a genuine unresolved policy/authority seam, not a missing JWT system. Do not invent an assignment database, treat learner identity as SHC authority, or claim assigned-brand qualification. Any new sensitive server reader/action must call reused authorization at its own boundary before effects. |

## 3. Important reuse limits already documented in W1–W3

### SHC is not covered merely because tenant refresh is implemented

`apps/api-server/src/modules/auth/token-refresh.service.ts:115–119,306–399` limits fresh tenant account/role checks to its scoped RTH/SUIA principal paths. Its explicit SHC/default branch at 389–398 preserves the earlier behavior. Likewise `src/modules/auth/rbac.service.ts`'s active-account verification targets the two learner brands. Passing a SHC brand to that helper is not the missing connection; it would use the wrong contract.

`audit/W1.2_Batch_08_SHC_Session_Policy_Decision.md:3,14–23,29–36` already records the pending SHC lifecycle decision, absent refresh route, minted-but-unregistered refresh token and distinction between people DB and default DB. The 15-minute client idle lock is not a server idle-expiry or immediate-revocation mechanism. The existing 8h compatibility behavior is not approval of every proposed absolute-session model.

Therefore:

1. Reuse the current SHC people-account lookup for any approved current-account check; do not copy a learner lookup or create another account authority.
2. Reuse existing repository/CAS/revocation components only with explicit SHC store/owner binding after the lifecycle contract is chosen.
3. Do not label inactive-account denial, current-role enforcement, successful SHC refresh or immediate access-token revocation as already verified.
4. Preserve the existing pending policy item. This is an already identified decision dependency, not a reason to reopen all W1–W3 or conduct another 62-item audit.

### Cross-brand authority is distinct from the token's own brand

Requiring `skillhubcore` + `shc-admin` identifies the administrative portal credential. It does not establish which SUIA/RTH content that principal may administer. Current authoring helper comments deliberately describe broad role-based access and future assignment checks. This review does not decide that all global administrative access is a defect, nor that every admin should receive it: the permitted global/assigned policy and authoritative assignment source must be explicit before changing those helpers. The prior Scope B review already retains this limitation.

## 4. Protected page coverage confirmed at current HEAD

The current source matches the 32-page inventory in section 4 of the existing focused Scope B review. Route groups in parentheses do **not** appear in browser URLs. Do not match `/(admin)/:path*` or create a competing middleware file.

| Source group | Actual protected URLs |
| --- | --- |
| `(admin)`: operational shell (10) | `/audit`, `/certificate-generator`, `/certificate-preview`, `/content-generation/layman-architecture`, `/dashboard`, `/events`, `/marketing`, `/metrics`, `/subscriptions`, `/subscriptions/[id]` |
| `(admin)`: Project LLM (12) | `/tools/project-llm`, `/tools/project-llm/candidate-upload`, `/tools/project-llm/compliance-brief`, `/tools/project-llm/create`, `/tools/project-llm/explorer`, `/tools/project-llm/external-ai-handoff`, `/tools/project-llm/integration-certification`, `/tools/project-llm/matrix`, `/tools/project-llm/mix-match`, `/tools/project-llm/registry`, `/tools/project-llm/specification-review`, `/tools/project-llm/workflow-details` |
| `(admin)`: tutorial and users (5) | `/tools/tutorial-block-composer`, `/tools/tutorial-left-sidebar`, `/tools/tutorial-page-content`, `/users`, `/users/[userId]` |
| `(authenticated)` (5) | `/factory/question-generator`, `/factory/question-generator/review`, `/questions`, `/questions/new`, `/questions/[id]/edit` |

Total: 27 + 5 = 32. Public pages: `/login`, and `/` (currently redirects to login). Use exact/segment-aware matching, test lookalike prefixes and generate coverage checks against the actual page inventory. This list protects existing pages, including currently unavailable feature stubs; it does not authorize implementing those features.

## 5. Revised proposed Scope B implementation manifest

This is a **proposal for owner review**, not implementation authorization. It contains adapters and missing enforcement only. Existing API guards, shared JWT/RBAC and session components remain the authority.

### B1 — Bounded page-protection integration

| Existing/new path under `apps/skillhubcore-admin` | Only justified change | Required validation |
| --- | --- | --- |
| Existing `src/lib/auth-helpers.ts`; proposed `src/lib/server-page-auth.ts` | Extract/reuse existing verified-principal logic through server-only cookie/request adapters. Preserve cookie precedence, shared verifier, exact audience/brand, identity mapping and shared roles. Check runtime/import compatibility before using from Proxy. Do not import DB/client UI barrels into Proxy. | Real signed-token tests: valid SHC, expired/malformed/wrong-secret/wrong-audience/wrong-brand/wrong-token-class, unsupported/empty roles; existing API behavior unchanged. |
| Proposed `src/lib/admin-page-policy.ts` | Small pure URL-to-existing-policy adapter covering the 32 pages. No new permission matrix or role names. | Full inventory coverage; dynamic path segments, trailing slashes and false-prefix cases; public pages remain public. |
| Existing `src/proxy.ts` | Extend the existing matcher/control flow for actual protected pages and early verified admission. Retain existing API/origin/health behavior. | Missing/invalid/forbidden principal denied before protected render; HTML/RSC/prefetch/HEAD paths; no forged-header or development bypass. |
| Existing `src/app/(admin)/layout.tsx`, `src/app/(authenticated)/layout.tsx` | Await reused server authorization, then retain `AdminGuard → ClientShell → children` and all context. | Both groups server-denied and valid-user rendered; no shell/context regression. Do not rely on layout alone for sensitive effects. |
| Existing `src/components/auth/AdminGuard.tsx`; optional `src/app/(public)/forbidden/page.tsx` | Align client UX with server decisions. Remove security effect of question-route dev bypass/cached-role shortcut; separate 401 login from 403 denial and 5xx retry. Preserve lock/logout/auth synchronization. Optional denial view only if required by selected framework response behavior. | No redirect loop, no rendering private children after server denial, development and production modes; no claim of HTTP 403 if implementation only navigates to a denial page. |
| New focused tests alongside these adapters/layouts/Proxy | Verify integration of the existing security components, not another auth implementation. | Existing boundary/security suite plus new page tests; rendered shell smoke, denied-before-read tests and explicit no-store/session error behavior. |

No broad edits to 32 page files are justified solely to duplicate the same shell check. Any page-specific sensitive server operation must still be checked at its owning data/service boundary. Existing client-to-API pages retain those API checks; do not add a speculative blanket DAL/service rewrite.

### B2 — Genuine current-account seam, conditional on the already reviewed contract

Exact existing paths: `apps/api-server/src/modules/auth/shc-auth.service.ts` and `apps/api-server/src/app/api/shc/auth/me/route.ts`, plus the existing SHC BFF/session forwarding path if response mapping requires it.

The missing behavior is a truthful current-principal result: inactive/deleted/missing account, current permitted role, authenticated-but-forbidden versus expired/missing token, and dependency outage. Reuse the current SHC account query and shared role/permission authority. Do not treat the route's current `isAdmin: true` response or returned `isActive` field as enforced eligibility. Do not trust an arbitrary client header for account identity.

This is **conditional bounded integration**, not permission to change all auth services. Before implementation, the owner must confirm freshness/failure behavior and backend call/runtime contract already required by the focused Scope B review. The server page adapter must not convert backend outage into access or silently redefine it as bad credentials. The same contract must apply to sensitive operations that rely on current eligibility; a layout-only freshness check is insufficient.

### B3 — Record dependencies; do not implement by assumption

- Full SHC refresh/session-family/revocation lifecycle: pending existing session-policy decision. No automatic new refresh route, session store, blacklist, TTL change or schema migration.
- Assigned brand/subtopic enforcement: needs explicit global-versus-assigned policy and authoritative grants source before changing `requireBrandAccess`/`requireSubtopicAccess`. Until then, retain the limitation in the canonical ledger; do not promote cross-brand acceptance.
- No new JWT/RBAC/gateway system; no default-deny role expansion or `infrastructure` grant invented to reconcile client behavior.
- No Scope A changes, feature stubs implementation, invitation/outbox migration, parked W1–W3 restart or W4 implementation.

These dependencies prevent claiming complete Scope B security acceptance. They do not justify duplicating already accepted infrastructure. The owner can authorize the bounded B1 integration separately while retaining explicit unresolved B2/B3 qualifications; that is not full application acceptance.

## 6. Evidence to preserve and evidence still needed

| Existing evidence | What it supports | What it does not establish |
| --- | --- | --- |
| `docs/architecture/reviews/SHC/SHC_ADMIN_SCOPE_B_SECURITY_DESIGN_REVIEW.md`; SHC `src/lib/__tests__/admin-boundary.test.ts`, `upstream-proxy.test.ts` | Prior focused Sol review's 61 passing tests, exact audience/brand/role/origin/header controls; prior static 80-handler check. | Page server guards, current account freshness, assigned-resource authorization or new execution at current HEAD. |
| `audit/W1.2-SESS-01_Sol_Acceptance.md`; API `repositories/__tests__/token.repository.ownership.test.ts`, `__tests__/global-logout.ownership.test.ts` | Scoped owner-conditioned revocation acceptance, with follow-ups. | SHC access-token immediate revocation or correct binding of its newly minted refresh JWT. |
| `audit/W1.2-REFRESH-02-03_Sol_Acceptance.md` (reviewed `3195b8918561b974b8f33d4902c88750826f2535`) | Recorded 11 files/48 focused API tests and 9 files/153 shared-auth tests; scoped atomic rotation accepted with follow-up. | Later SHC lifecycle approval or physical distributed qualification. Do not aggregate these historical counts with today's other reports as one run. |
| API `__tests__/token-refresh.{atomic-rotation,authority,lifecycle}.test.ts`; W1.2 REFRESH-07 source | Actual scoped tenant authority/rotation regression test implementations and later correction lineage. | Fresh SHC role lookup: the production branch explicitly excludes SHC. No fresh pass claim is made here. |
| API `__tests__/batch-08-shc-session-binding.test.ts`; `audit/W1.2_Batch_08_SHC_Session_Policy_Decision.md` | Actual SHC service path with isolated dependencies: minted refresh is not registered; owner logout calls revocation; error absorption is visible. | Successful mounted SHC refresh, server-side idle expiry or complete logout invalidation. Tests exposing a gap are not acceptance of the gap. |
| `audit/W1.2_Browser_SHC_Control_Sol_Acceptance.md`, commit P12 | AQ-03: 1 real Chromium test passed, exit 0, at reported source `3d392ead`: fresh endpoint 401, authorized GUI login/cookies, authenticated endpoint 200 or 204. | All 32 pages, role/brand negative matrix, immediate revocation, gateway deployment or whole BROWSER-01 closure. The report explicitly keeps BROWSER-01 and RC-ID-01 IN_PROGRESS. |

Read-only checks performed here: source inspection, Git ancestry checks, current page inventory and existing evidence review. **No new unit, build, database, browser or security test results are manufactured.** New B1/B2 tests are NOT IMPLEMENTED / NOT RUN. No acceptance counts were changed.

## 7. Result for the owner

The proposed security infrastructure largely already exists. Scope B should integrate it into missing server-page and current-principal boundaries, preserving the existing client shell and API enforcement. The two important qualifications are already documented: SHC-specific session lifecycle is not equivalent to tenant refresh, and portal-brand validation is not assigned content-brand authorization.

No new architectural contradiction was found that requires repeating Sol's focused review. The existing conditional decision and pending policy dependencies stand. This packet stops at source/evidence reconciliation and an implementation proposal; it grants no code, commit, deployment, database or W4 authorization.

## 8. Provenance register

All entries below are ancestors of the inspected HEAD. Entries marked pre-existing are not relabeled as new W1–W3 work. They are retained dependencies of that remediation.

| Ref | Exact commit | Relevant change/provenance |
| --- | --- | --- |
| P1 | `a6ecc34821dc4d18ad84fff24f1a989659afb475` | W1.2 atomic refresh / shared token lineage. |
| P2 | `006f737f3cebdd725696a1d7bcfd64e8f880d475` | Wave 1A JWT alignment. |
| P3 | `1d80c92a1cb38e32c49a691176cdacb00542212d` | Priority trust boundaries: current SHC auth helper, upstream reconstruction, API guard integration and security tests. |
| P4 | `7b822a53bb2586b497adfcccba85da99b89469ef` | Pre-existing shared RBAC hardening; reused, not a new Scope B role system. |
| P5 | `39500ac9f69caa2c22d6f8ccecd80f362bcf3d06` | TC03/TC14 profile/admin ownership boundary. |
| P6 | `26c70f1ea7888207fa89d23a4fb094f95eee26c3` | Removal of unsafe tenant fallback in shared enforcement. |
| P7 | `e4c9c9f08399f74e660df6cd1ac162d78f862b6f` | W1–W3 API/tenant ingress corrections. |
| P8 | `a7d59877d46f3b8f9d15024d6db6fe79272114ba` | ADMIN-01 tenant verification and API Proxy routing. |
| P9 | `d92efb6945709890e2fbbcf78d2363161f090f13` | W1.2 SESS-01 owner-scoped session revocation. |
| P10 | `a85da07ddf8d1d5f1c0c8d7b05fe2f2258829e72` | REFRESH-07 failure/metadata/rollback containment. |
| P11 | `d512beb8a89c18cf3ed8f182ff85e240b1d0015c` | Scoped tenant REFRESH-05/06 fresh account/role authority. |
| P12 | `d9a6f91ef1a8d13cbe79401dff2b37109071cba9` | Sol's bounded SHC AQ-03 browser/control acceptance. |
| P13 | `c1f1008164c9b203c59cbb94ab4b3e70a9ab8969` | SESS-04 logout-all adapter/service lineage. |
| P14 | `1d5e00c869f06556e5793f83ee96b57f73ce2464` | Earlier Phase 4 auth/rotation/gateway lineage; SHC service retained from this source. |
| P15 | `66d95ef33af9f8d26ce44556b7142b1a938ba611` | Existing gateway trusted-host/fail-closed ingress lineage. |
| P16 | `e1b26a9e0e4feb0da38adf400e94dc911f495b2c` | Later SHC development-origin/referer compatibility adjustment; not a new W1 scoped acceptance. |
| P17 | `d217753e5908791fff9dfb9a6ce6e8bf0072c561` | Pending SHC session-policy continuation/evidence. |
| P18 | `08d7c05abdbb7f2be09a7163e9fae72f3996c9b6` | Pre-existing SHC login/shell implementation. |
| P19 | `914fdcd47b9e6ee2676bb5101db7d197cde019d3` | Existing focused Scope B security design review, subsequently included in current main. |
