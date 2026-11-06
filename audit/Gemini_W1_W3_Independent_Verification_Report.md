# Gemini Independent W1–W3 Verification Report (`GM01`–`GM20`)

- **Assigned project role**: `Gemini` (Independent security and regression tester)
- **Runtime model**: Gemini 3.8 Flash (Medium)
- **Packet**: `audit/Gemini_W1_W3_Independent_Test_Assignment.md` (`GM01`–`GM20`) mapped to Tera `TC01`–`TC20`
- **Governing protocols & decisions**:
  - `audit/W1_W3_Model_Routing_And_Handoff_Protocol.md`
  - `audit/W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md` (`D1`–`D7` decisions at `c166119a`)
  - `audit/Tera_W1_W3_Critical_Implementation_Assignment.md`
  - `audit/Tera_W1_W3_Critical_Handoff.md`
- **Reviewed production commit baseline**:
  - Remote verified baseline: `c7ddcd7457760fa68b2a739c20773f50feb3bb82` (`fix(project-llm): stop automatic gate one approval`)
  - Local repository HEAD: `11ced9c1` (includes Sonnet `DOC01`–`DOC03` documentation commits `a3092abd` and `11ced9c1`; zero application production files modified since `c7ddcd74`)
  - Working tree state: Clean except for authorized test fixture update in `apps/skillup-web/src/app/__tests__/service-worker-private-cache.test.ts` per Sol `D2`
- **Testing environment & safety**:
  - Enforced `audit/W1_W3_Offline_Test_Network_Guard.ts` before application module imports
  - Cleared all live service credentials (`DATABASE_URL`, `DIRECT_URL`, `NEON_DATABASE_URL`, `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `QSTASH_TOKEN`)
  - Zero live databases, browsers, queue workers, migrations, server restarts, or remote git pushes
- **Next handoff**: **Sol** (for final policy and acceptance decisions) and **Tera** (for targeted production corrections). **No TC item, FND task, or foundation group is marked accepted.**

---

## 1. Executive Summary: Verification Results Across Priorities 1–4

| Priority / Item | Scope | Test Execution Status | Observed Result | Blocking Issue / Failure Details |
| :--- | :--- | :--- | :--- | :--- |
| **Priority 1: TC02 / TC03 / TC05** | Identity, Brand Fallback, RBAC Guard, Profile Ownership, Typechecks | `tsc` passed; Vitest: **2 failed** in `ownership.service.test.ts` | **PARTIAL (Guard & Typecheck PASS; RBAC Incomplete; Fixture Collision)** | **TS2739 resolved** (`tsc` exits 0 across `@quiz/auth` & `@quiz/api-server`). Guard blocks missing/unknown brands (`403`). Profile GET/PATCH binds brand db/tables. **Failure**: `OwnershipRBACService` lines 81–84 denies `PROFILE_WRITE`/`PROFILE_READ` for admin on other users, causing `ownership.service.test.ts` lines 49 & 97 to fail (`ForbiddenError: Missing permission 'profile.write' and not resource owner`). Separate admin management boundary remains unseparated. |
| **Priority 2: TC14** | Cache & Service Workers (SkillUp & RTH) | Sol boundary suite: **PASS (7/7 in SkillUp SW; 4/4 in RTH SW)**; Placement suite: **3 failed** in `routes.test.ts` | **PASS on Service Worker Cache; FAILING on Catalog Route Fixture** | SkillUp SW assets-only cache (`skillup-static-assets-v2`), legacy `skillup-app-shell-v1` deletion on activation, and network-only navigation (`503` offline for `/programs`, `/student`, `/api/*`, RSC) verified. Authorized obsolete public navigation cache assertion updated to network-only per Sol `D2`. In `apps/skillup-web/src/app/api/__tests__/routes.test.ts`, lines 181, 191, 289 fail with 500 because `extractAuthFromRequest` rejects unauthenticated test request per `enforceBrandValidation`. |
| **Priority 3: TC07 / TC08** | People Normalization & SkillUp Local Admission Containment | 2 test suites: **PASS (25/25 passed)** (`collision.test.ts`: 5/5, `email-normalization.test.ts`: 20/20) | **PASS (Containment Verified; New Account Provisioning Gated)** | Active SkillUp platform predicate, `deletedAt` null check, `isActive: true`, and case/whitespace normalization verified. Foreign-only accounts (`realtutorialhub`) and ambiguous records (`limit(2)`) denied (`409`). No foreign accounts bound. Full new-account invitation/provisioning remains gated. |
| **Priority 4: TC15** | Gate 1 Persistent Authority in `ProjectLlmClient` | 4 test suites: **PASS (62/62 passed)** in `@quiz/skillhubcore-admin` | **PASS (Client Containment Verified; Backend Verification Open)** | Verified in `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`: `ensureCandidateRequested` no longer auto-approves `AWAITING_GATE_1` to `GUI_APPROVED`. Throws `ProjectLlmError(409, 'Gate 1 human approval is required before candidate upload')`. Backend persisted human authority remains gated. |
| **Priority 4: TC20** | Events & Marketing Analytics Deduplication | Vitest: **PASS (4/4)** in `marketing-site` analytics; **3 failed** in `packages/events` | **PARTIAL (Analytics Dedupe Hash PASS; Downstream Leak & Event Handlers FAIL)** | `packages/marketing-site/src/lib/analytics/server/pipeline.ts` includes `brandId` in dedupe hash: cross-brand collision separated, same-brand retry deduped (`1/1 passed`). However, session timeline & lead score leak across brands (sessionDepth 2, leadScore 4). `packages/events`: 3 tests fail on correlation collision, failure retry, and custom schema event type mismatch. |

---

## 2. Priority 1 — TC02 / TC03 / TC05: Identity, Profile Ownership & RBAC

### A. TypeScript Typechecks
Commands executed:
- `pnpm --filter @quiz/auth exec tsc --noEmit` -> **Exit 0** (clean)
- `pnpm --filter @quiz/api-server exec tsc --noEmit` -> **Exit 0** (clean)

**Finding GM-P1-01 (Typecheck Fix Verified)**:
The two prior `TS2739` errors in `apps/api-server/src/app/api/auth/profile/route.ts` (lines 144 and 304) have been resolved. The handler now verifies `(brand !== 'skillup' && brand !== 'realtutorialhub') || !userId?.trim()` and constructs a complete `OwnershipContext`:
```typescript
const ownershipContext: OwnershipContext = {
  requestingUserId: userId,
  requestingTenant: brand,
  resourceOwnerId: userId,
  resourceTenant: brand,
  userRoles: getRBACRoles(auth.roles),
};
```
Both requesting and resource tenant are populated from the verified server-controlled brand binding, with verified tenant store mapping via `getAuthBrandContext(brand)`.

### B. Brand Fallback & Guard Verification
- In `packages/auth/src/rbac/rbac.adapter.ts`: `auth.brand || 'realtutorialhub'` fallback was removed in commit `f4ba1762`. Throws `Error: Cannot create RBAC user: Invalid brand` if brand is missing or invalid.
- In `packages/auth/src/rbac/rbac.guard.ts`: `withRBAC` validates `['skillup', 'realtutorialhub', 'skillhubcore'].includes(auth.brand)` and returns `403 PERMISSION_DENIED` with JSON error payload before creating the RBAC user or executing callbacks.
- `packages/auth/src/rbac/__tests__/sol-fnd03-tenant-boundary.test.ts`: **6/6 passed** (denies missing brand, cross-tenant access, unauthorized shadow identity).

### C. Profile Self-Only Access vs Administrative Management Conflict
Command executed:
`pnpm --filter @quiz/auth test -- src/rbac/__tests__/ownership.service.test.ts` -> **Exit 1 (2 failed, 25 passed)**

**Failing Test 1**:
- **Test**: `OwnershipRBACService > admin can access others resource with permission`
- **Location**: `packages/auth/src/rbac/__tests__/ownership.service.test.ts:49:12`
- **Failure**:
  ```
  AssertionError: expected [Function] to not throw an error but 'ForbiddenError: Missing permission 'profile.write' and not resource owner' was thrown
  ```

**Failing Test 2**:
- **Test**: `OwnershipRBACService > hasPermissionOrOwnership returns true for permission holder`
- **Location**: `packages/auth/src/rbac/__tests__/ownership.service.test.ts:97:20`
- **Failure**:
  ```
  AssertionError: expected false to be true (admin with PROFILE_READ on user-2 returned false)
  ```

**Root Cause Analysis for Tera & Sol**:
In `packages/auth/src/rbac/ownership.service.ts` lines 81–84:
```typescript
// Profile permissions in an ownership API are self-only. Management uses a separate boundary.
if (permission === PERMISSIONS.PROFILE_READ || permission === PERMISSIONS.PROFILE_WRITE) {
  return requestingUserId === resourceOwnerId;
}
```
This hard denial enforces Sol `D1` (self-only profile access in an ownership API). However, existing unit tests in `ownership.service.test.ts` still use `PERMISSIONS.PROFILE_WRITE` and `PERMISSIONS.PROFILE_READ` to test generic admin role bypass on another user's resource (`admin-1` accessing `user-2`). Because the dedicated administrative profile management service/route has not yet been split out into its own boundary, the generic unit test fails.

**Action Required**:
Tera and Sol must decide whether `ownership.service.test.ts` should test generic administrative access using a non-profile permission (e.g. `PERMISSIONS.EXAM_GRADE` or `ADMIN_PANEL`), or whether administrative profile management is exposed through a distinct capability flag or service method as outlined in Sol `D1` ("Privileged profile management belongs to an explicit management route/service with verified administrative authority...").

---

## 3. Priority 2 — TC14: Cache, Service Workers & Catalog Routes

### A. SkillUp and RTH Service Worker Tests
Command executed:
`node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary`

**Observed Results**:
- `apps/realtutorialhub-web/src/app/__tests__/service-worker-private-cache.test.ts`: **4/4 passed**
  - Online GET `/api/tutorial/content/*` bypasses cache.
  - Offline GET `/api/tutorial/content/*` returns `503` without stale replay.
  - Lifecycle (`install`, `activate`) cleanly claims clients.
- `apps/skillup-web/src/app/__tests__/service-worker-private-cache.test.ts`: **7/7 passed** (after updating obsolete assertion per Sol `D2`):
  1. `does not cache authenticated student navigation (/student)` -> **PASS**
  2. `treats public catalog navigation as network-only and does not cache per Sol D2 (/programs)` -> **PASS**
  3. `does not serve a prior private navigation while offline` -> **PASS**
  4. `never caches or serves stale /api/* or RSC responses and returns 503 offline` -> **PASS**
  5. `caches immutable /_next/static/* assets when online` -> **PASS**
  6. `deletes legacy skillup-app-shell-v1 during activation without touching unrelated caches` -> **PASS**
  7. `returns 503 offline for /programs despite prior cache entries per Sol D2` -> **PASS**

### B. Catalog Route Fixture Failures (`placement` selection)
Command executed:
`node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs placement` -> **Exit 1 (3 failed, 21 passed)**

**Failing Tests in `apps/skillup-web/src/app/api/__tests__/routes.test.ts`**:
1. Line 181: `SkillUp BFF routes > returns program catalog data` -> Expected 200, received **500**
2. Line 191: `SkillUp BFF routes > returns program detail data` -> Expected 200, received **500**
3. Line 289: `SkillUp BFF routes > returns faculty data` -> Expected 200, received **500**

**Root Cause Analysis for Tera**:
In `apps/skillup-web/src/app/api/programs/route.ts` and `faculty/route.ts`:
```typescript
const auth = await extractAuthFromRequest(req);
if (!auth || !auth.userId) {
  return NextResponse.json({ error: 'Unauthorized', reason: 'authentication_required' }, { status: 401 });
}
enforceBrandValidation(auth, req);
```
The test in `routes.test.ts` invokes `getPrograms()` with an empty `Request()` without auth headers or cookies. Under `extractAuthFromRequest(req)`, unauthenticated requests produce an uncaught error or brand mismatch that gets caught and converted to HTTP 500.
**Action Required**: Per Sol `D2`, tests for `/api/programs` and `/api/faculty` must supply valid request/auth context for success cases and test `401 Unauthorized` / `403 Brand Mismatch` explicitly.

---

## 4. Priority 3 — TC07 / TC08: Admission & People Uniqueness

Commands executed:
- `npx vitest run "packages/db-people/src/utils/__tests__/email-normalization.test.ts"` -> **20/20 passed**
- `pnpm --filter @quiz/skillup-admin test -- collision.test.ts` -> **5/5 passed**

**Verification Details**:
1. Confirmed `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` imports `normalizeEmail` from `@quiz/db-people`.
2. Evaluates query predicates strictly:
   - `lower(trim(email)) = normalizedEmail`
   - `eq(users.platform, 'skillup')`
   - `eq(users.isActive, true)`
   - `isNull(users.deletedAt)`
   - `.limit(2)`
3. Observed test coverage:
   - Foreign-only account (`realtutorialhub`) -> rejected with `409 Conflict`, zero writes, zero events.
   - Unique active `skillup` account -> admitted with `200 OK`.
   - Equal-email accounts across platforms -> selects SkillUp account only, never binds RTH user.
   - Soft-deleted / inactive accounts -> rejected with `409 Conflict`.
   - Ambiguous duplicate accounts (`limit(2)` > 1) -> rejected with `409 Conflict`.
4. **Gated Boundary**: This containment securely prevents cross-tenant binding or unsafe foreign account reuse. Full new-account automated provisioning remains gated pending credential and invitation design.

---

## 5. Priority 4 — TC15 (Gate 1) & TC20 (Analytics & Events)

### A. TC15 — Gate 1 Persistent Authority
Command executed:
`pnpm --filter @quiz/skillhubcore-admin test -- src/lib/project-llm` -> **62/62 passed across 4 files**

**Verification Details**:
- Verified `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts` commit `c7ddcd74`:
  ```typescript
  if (currentState === 'AWAITING_GATE_1') {
    throw new ProjectLlmError(
      ProjectLlmErrorCode.SERVICE_UNAVAILABLE,
      409,
      'Gate 1 human approval is required before candidate upload'
    );
  }
  ```
- Automated client-side transition `transitionWorkflow(workflowId, 'GUI_APPROVED', ...)` has been **completely removed**.
- Attempts to advance from `AWAITING_GATE_1` without human approval throw HTTP 409 conflict.
- Persisted server-side human Gate 1 authority and database atomic commits remain under development by Tera per Sol `D4`.

### B. TC20 — Analytics Brand Deduplication & Downstream State Defect
Commands executed:
- `npx vitest run "packages/marketing-site/src/lib/analytics/__tests__/brand-dedupe-control.test.ts"` -> **1/1 passed**
- `npx vitest run "packages/marketing-site/src/lib/analytics/providers/__tests__/internal-http-failure.test.ts"` -> **3/3 passed**

**Observed Result**:
- `packages/marketing-site/src/lib/analytics/server/pipeline.ts` includes `event.context.brandId` in the SHA-256 dedupe key.
- Two events with identical payload and anonymous ID across different brands (`realtutorialhub` vs `skillupitacademy`) are correctly accepted as separate events (`deduped: false`). Same-brand replay is correctly deduplicated (`deduped: true`).

**Critical Finding GM-P4-01 (Downstream Analytics Collision Defect)**:
In `brand-dedupe-control.test.ts`, the console audit log exposes a downstream state leak:
- First brand (`realtutorialhub`) event: `sessionDepth: 1`, `leadScore: 2`
- Second brand (`skillupitacademy`) event with identical IDs: `sessionDepth: 2`, `leadScore: 4`
Because `sessionId` and `anonymousId` in-memory session/lead trackers are not keyed by `brandId`, downstream user journey, lead scoring, and session tracking cross-contaminate between brands. Tera must partition the session and lead score state maps by brand.

### C. TC20 — Events Consumer Deficiencies
Command executed:
`pnpm --filter @quiz/events test` -> **Exit 1 (3 failed, 19 passed)**

**Failing Tests in `packages/events`**:
1. `fnd23-correlation-collision.test.ts`: Distinct event IDs sharing a `correlationId` are mistakenly deduplicated instead of processed.
2. `fnd23-event-retry-probe.test.ts`: Event handler failure acknowledges message as complete rather than leaving it retryable.
3. `fnd23-event-type-probe.test.ts`: Registered handler is invoked even when custom-schema event type does not match the registration.

---

## 6. Other Retained Slices: Nested Schemas & Storage Preparation

Command executed:
`node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs nested` -> **Exit 1 (5 failed, 18 passed)**

1. `nested-schema-compatibility.test.ts`: 4 tests fail because `TutorialBlockSchemaLazy` uses `z.any()`, allowing unknown, missing ID, missing type, and malformed blocks to pass.
2. `storage-preparation-truth.test.ts`: Fails because D1 definition preparation fills missing content with educational example claims (`"efficiently"`).
*Note*: These 5 failures are expected retained denials awaiting Sol `D6` implementation by Tera.

---

## 7. Exact Failure Ledger for Tera & Sol

| ID | Location | Expected | Actual | Assigned Owner | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FAIL-01** | `packages/auth/src/rbac/__tests__/ownership.service.test.ts:49` | Admin can write other user's resource | Throws `ForbiddenError: Missing permission 'profile.write' and not resource owner` | **Tera / Sol** | Update test or split management boundary per Sol D1. |
| **FAIL-02** | `packages/auth/src/rbac/__tests__/ownership.service.test.ts:97` | `hasPermissionOrOwnership` returns true for admin on PROFILE_READ | Returns `false` | **Tera / Sol** | Reconcile self-only profile permission with administrative management checks. |
| **FAIL-03** | `apps/skillup-web/src/app/api/__tests__/routes.test.ts:181,191,289` | `/api/programs` & `/api/faculty` return 200 | Returns `500` (unauthenticated request) | **Tera** | Provide mock authentication context in fixture per Sol D2. |
| **FAIL-04** | `packages/marketing-site/src/lib/analytics/server/pipeline.ts` | Brand-isolated sessionDepth and leadScore | Session and score leak across brands (depth 1 -> 2, score 2 -> 4) | **Tera** | Partition downstream session snapshot and lead score tracker by `brandId`. |
| **FAIL-05** | `packages/events/src/__tests__/fnd23-*.test.ts` | Event retry, type matching, and distinct event ID processing | Deduplicates on correlationId, acknowledges failed events, accepts wrong type | **Tera** | Implement durable claim/lease, envelope type verification, and event ID uniqueness per Sol D7. |
| **FAIL-06** | `packages/types/src/tutorial-rich-document/` & `storage-preparation-truth.test.ts` | Reject malformed nested blocks and do not inject example claims | Pass due to `z.any()` and injects example content | **Tera** | Implement Sol D6 recursive schema validation and preview/storage separation. |

---

## 8. Commitments & Status Declaration

- **Local Status**: `IMPLEMENTED_UNVERIFIED` (Verification complete; failures cataloged).
- **Zero Acceptance**: No TC item, FND task, or foundation group is marked accepted.
- **Handoff Target**:
  - **Tera**: For targeted corrections on FAIL-01 through FAIL-06.
  - **Sol**: For policy decision on administrative profile test boundaries and final acceptance authority.
