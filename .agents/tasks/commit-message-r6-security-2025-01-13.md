fix(security): R6 authenticated authorization remediation - SHC admin verification, RTH session cancellation, exam engine ownership

## Executive Summary

Implements Sol's R6-A authenticated authorization review findings addressing critical security vulnerabilities
across SkillHubCore admin verification, RealTutorialHub session cancellation, and exam engine authorization.

**Sol's Review:** docs/architecture/reviews/SHC/SOL_R6_EXISTING_AUTHORIZATION_AND_ENGINEERING_REVIEW.md
- 7 security findings corrected with 191 targeted tests passing
- 116 HTTP assertions across populated runtime evidence (78+4+18+12+4)
- 195-method authorization matrix: 27 rows with new bounded evidence (30 PARTIAL, 161 PENDING, 4 N/A)
- Q48 acceptance status: OPEN for owner release decision

**Key Vulnerabilities Fixed:**
1. Direct backend SHC account eligibility bypass - stale admin tokens reached protected resources
2. RTH cancellation proxy admission - eligible learners rejected before ownership validation
3. RTH cancellation error disclosure - provider exceptions exposed in public 500 responses
4. Quiz mutation ownership status - foreign answers returned 400 instead of 403
5. Exam-question membership ordering - idempotency shortcuts bypassed ownership checks
6. Stale active exam cache - completed exams accepted new answers from cached started state
7. SHC action-specific RBAC - existing permissions now verified with 26 real-signature guard tests

**Verification Status:**
- Targeted test suites: 191/191 tests passing
- Wider exam suite: 93/94 passing (1 known report-generator URL failure - see OWNER_DECISIONS_AND_HOLDS.md)
- All quality gates: PASS (typecheck, lint, boundaries, production builds for all 3 apps)
- HTTP runtime evidence: 116/117 assertions (1 SUIA cold-start 500 preserved, separate warm run passed)

**Files Changed:**
- 14 modified (admin verification, exam engine, session routes, authProxy middleware)
- 5 new (3 R6 test files, 1 Sol review doc, 1 evidence directory)

---

## 1. SkillHubCore Admin Account Eligibility (Direct Backend)

### Security Finding
Disabled, demoted, and deleted SHC accounts with stale signed admin tokens bypassed current-account
authority checks and reached question lookup (returned 404 instead of proper 401/403).

### File: apps/api-server/src/modules/auth/admin-audience.util.ts

**Changes Made:**
- Added live SHC account eligibility verification for \shc-admin\ audience
- Enforces current account status: \isActive === true\, \platform === 'skillhubcore'\, role in \['admin', 'super_admin']\
- Returns 401 for deleted accounts (UserNotFoundError), 503 for authority service unavailable
- Implements token privilege ceiling: removes stale super-admin if current account demoted to admin
- Does NOT elevate admin token when current account is super-admin (preserves token claims as ceiling)
- Preserves super-admin only when both token AND current account authorize it

**Code Before:**
\\\	ypescript
if (audience === 'shc-admin') {
  // Only checked token claims, never queried current account status
  const hasSkillHubCoreAdminAccess = 
    payload.brand === 'skillhubcore' &&
    payload.isAdmin === true &&
    (roles.includes('admin') || roles.includes('super_admin'));
  
  if (!hasSkillHubCoreAdminAccess) {
    throw forbidden('SkillHubCore admin access only');
  }
}
\\\

**Code After:**
\\\	ypescript
if (audience === 'shc-admin') {
  if (route.startsWith('/api/analytics/admin')) {
    throw forbidden('SkillHubCore admin access not permitted for tenant analytics');
  }
  
  const roles = Array.isArray(payload.roles) ? payload.roles.map(r => r.toLowerCase()) : [];
  const hasSkillHubCoreAdminAccess =
    payload.brand === 'skillhubcore' &&
    payload.isAdmin === true &&
    (roles.includes('admin') || roles.includes('super_admin') || roles.includes('infrastructure'));

  if (!hasSkillHubCoreAdminAccess) {
    throw forbidden('SkillHubCore admin access only');
  }
  
  // NEW: Direct backend callers must satisfy current-account authority
  let currentAccount: Awaited<ReturnType<SHCAuthService['me']>>;
  try {
    currentAccount = await new SHCAuthService().me(payload.userId);
  } catch (error) {
    if (error instanceof UserNotFoundError) throw unauthorized('Administrator not found');
    throw new ApiError(503, 'Administrator verification unavailable');
  }
  
  if (currentAccount.isActive !== true || 
      currentAccount.platform !== 'skillhubcore' ||
      (currentAccount.role !== 'admin' && currentAccount.role !== 'super_admin')) {
    throw forbidden('Account is not eligible for administrative access');
  }
  
  // Implement token privilege ceiling
  payload.roles = currentAccount.role === 'super_admin' && roles.includes('super_admin')
    ? ['super_admin'] 
    : ['admin'];
}
\\\

**Security Benefits:**
- Disabled accounts: stale tokens now return 403 before reaching business logic
- Demoted accounts: faculty/student demotions immediately revoke admin access
- Deleted accounts: return 401 (not 404), preventing account enumeration
- Authority outage: fails closed with 503, never admits requests when verification unavailable
- Token privilege ceiling: prevents indefinite privilege persistence after demotion

**Verification:**
- Unit tests: batch-08-admin-verification.test.ts - 19 test cases covering:
  - Token verification boundary (missing, malformed, expired, wrong-signature, wrong-audience)
  - Brand/audience preservation (skillup/admin, skillhubcore/shc-admin, skillup/infra)
  - Cookie precedence and bearer fallback
  - Forbidden after verified principal (role-ineligible, disabled, demoted, deleted)
  - Authority service unavailable (503)
  - Super-admin privilege handling (demotion, elevation prevention, mutual authorization)
  - Independently signed token rejection
  - Metric failure boundary (does not relabel 500 as 401)

- HTTP runtime: shc-populated-http-results.json (12/12 assertions)
  - Real password login, actual synthetic question
  - BFF/gateway/backend reads 200 for current super-admin
  - Account disabled: both BFF and backend denied
  - Demotion to faculty/student: backend DELETE denied, question remained present
  - Fixture cleanup verified

---

## 2. RealTutorialHub Session Cancellation Security

### Security Finding #1: Proxy Admission
Eligible learners were rejected 403 before reaching the existing owner-checked handler.

### Security Finding #2: Error Disclosure
Injected provider exception text appeared in public 500 response, leaking connection strings and SQL.

### File: src/share-branding/middleware/authProxy.ts

**Changes Made:**
- Added browser-owned DELETE exception for exact UUID pattern: \/api/tutorial/sessions/[uuid]\
- Pattern: \/^\/api\/tutorial\/sessions\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\$/i\
- Requires DELETE method (GET/POST/PATCH/PUT/HEAD denied)
- No extra segments allowed (malformed paths return 403)
- Still subject to: requireCurrentLearnerSession, origin validation, and service-level ownership

**Code Addition:**
\\\	ypescript
const isBffInternalRoute = pathname.startsWith('/api/') && (
  pathname.startsWith('/api/auth/') ||
  pathname.startsWith('/api/profile') ||
  // ... other internal routes ...
  
  // NEW: Existing learner cancellation remains subject to current-session,
  // origin and service-level request ownership validation.
  (request.method === 'DELETE' && 
   /^\/api\/tutorial\/sessions\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\$/i.test(pathname))
);
\\\

**Security Benefits:**
- Only authenticated learners with active sessions reach the handler
- Hostile origin still denied by existing CSRF protection
- Adjacent methods (GET/POST) do not bypass to handler
- Malformed or extra segments (/sessions/uuid/extra) return 403
- Anonymous and revoked sessions denied before handler

**Verification:**
- Unit tests: src/share-branding/middleware/__tests__/r6-session-cancellation.test.ts (8 tests)
  - Active learner reaches existing owner-checked handler (200)
  - Anonymous cancellation denied (401)
  - Revoked device denied before handler (401)
  - Hostile origin denied (403)
  - Adjacent methods denied (GET, POST, PATCH, PUT, HEAD all return 403)
  - Malformed/extra segments denied (403)

### File: apps/realtutorialhub-web/src/app/api/tutorial/sessions/[requestId]/route.ts

**Changes Made:**
- Wrapped route handler in \equireStudent(req)\ for authentication
- Wrapped service call in typed error handling (SessionRequestForbiddenError → 403, SessionRequestNotFoundError → 404)
- Top-level catch uses existing \serverErrorResponse\ helper with correlation ID and \private, no-store\ cache policy
- Preserves existing service ownership validation (\cancelMyRequest\ checks userId ownership)

**Code Before:**
\\\	ypescript
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  // No authentication, service called directly
  const result = await liveSessionService.cancelMyRequest(userId, requestId);
  return NextResponse.json({ data: result }, { status: 200 });
}
\\\

**Code After:**
\\\	ypescript
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const session = await requireStudent(req); // NEW: Authentication
    
    try {
      const result = await liveSessionService.cancelMyRequest(session.userId, requestId);
      return NextResponse.json(
        { data: result }, 
        { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
      );
    } catch (error) {
      // NEW: Typed error handling
      if (error instanceof SessionRequestForbiddenError) {
        return NextResponse.json(
          { error: 'Request access denied' }, 
          { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
      if (error instanceof SessionRequestNotFoundError) {
        return NextResponse.json(
          { error: 'Request not found' }, 
          { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
      return serverErrorResponse(req, 500, 'Failed to cancel request', error);
    }
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json(
        { error: error.message }, 
        { status: error.statusCode, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }
    return serverErrorResponse(req, 500, 'Request cancellation unavailable', error);
  }
}
\\\

**Security Benefits:**
- Provider exceptions (connection strings, SQL, database details) never appear in response
- Opaque 500 with correlation ID for debugging without disclosure
- \private, no-store\ cache policy prevents caching sensitive error states
- Typed ownership (403) and missing (404) errors preserved from service layer

**Verification:**
- Unit tests: apps/realtutorialhub-web/src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts (1 test)
  - Sanitizes provider failures (postgres connection string, private database secrets not in response)
  - Verifies \private, no-store\ cache policy on 500 responses

- HTTP runtime: authenticated-http-results.json (subset of 78/79 assertions)
  - Actual populated owner cancellation: 200
  - Foreign cancellation: 403
  - Foreign row retained (ownership validation works)
  - Fixture cleanup verified

---

## 3. Quiz Answer Engine Ownership and Membership

### Security Finding #1: Foreign Answer Status
Foreign answer attempts returned 400 despite authorization denial (should be 403).

### Security Finding #2: Membership and Idempotency Ordering
Missing question within owned exam returned success. Accepted idempotency key returned success
for foreign exam before ownership validation.

### Security Finding #3: Stale Active Exam Cache
Cached started header admitted new answer after current exam state became completed.

### File: apps/api-server/src/modules/exam-engine/exam.engine.ts

**Changes Made:**

#### 1. Ownership Before Idempotency Acknowledgement
Moved exam ownership check to BEFORE idempotent acknowledgement in \submitAnswer\:

\\\	ypescript
async submitAnswer(examId: string, questionId: string, answer: string, userId: string, idempotencyKey?: string) {
  // Step 1: Get current exam state (not just cache)
  const exam = await this.getAndCacheActiveExam(userId, examId, true);
  
  // Step 2: Ownership check BEFORE idempotency
  if (exam.userId !== userId) throw forbidden('Unauthorized');
  
  // Step 3: Exam-question membership BEFORE idempotency
  const examQuestion = await this.examRepo.findQuestionByExamAndQuestion(examId, questionId);
  if (!examQuestion) throw notFound('Question in exam');
  
  // Step 4: NOW check idempotency (after ownership and membership verified)
  if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
    const cacheKey = \idem:ans:\:\\;
    const cache = await this.getCache();
    const existing = await cache.get(cacheKey).catch(() => null);
    if (existing !== null) return; // Idempotent acknowledgement AFTER authorization
  }
  
  // Step 5: Check current state (not cached state)
  if (exam.status !== 'started') throw new Error('Exam is not active');
  
  // ... rest of answer persistence
}
\\\

**Before:** Idempotency check happened first, returning success for foreign exams with accepted keys.
**After:** Ownership and membership verified first, then idempotency acknowledged only for authorized requests.

#### 2. Current State Validation Over Cache
\getAndCacheActiveExam\ now queries current database state when \skipCache = true\:

\\\	ypescript
private async getAndCacheActiveExam(userId: string, examId: string, skipCache = false) {
  const cacheKey = \exam-state:\\;
  const cache = await this.getCache();
  
  if (!skipCache) {
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
  }
  
  // Always fetch current state for answer submissions
  const exam = await this.examRepo.findByIdWithBlueprint(examId);
  if (!exam) throw notFound('Exam');
  
  await cache.set(cacheKey, exam, 60 * 30); // Refresh cache with current state
  return exam;
}
\\\

**Security Benefits:**
- Foreign exam with accepted idempotency key: returns 403 before acknowledging retry
- Missing question in owned exam: returns 404 before staging answer
- Completed exam with cached started header: queries current state, returns 400 (not persisted)
- Accepted retry for completed exam: returns 200 without mutation (idempotency preserved)
- All authorization checks happen before mutation

**Verification:**
- Unit tests: exam.engine.test.ts (updated 4 critical test cases)
  1. Rejects completed exam despite older started header in cache
  2. Preserves accepted retry for owned question after exam completes (no mutation)
  3. Denies foreign exam even with accepted idempotency key (403 before acknowledgement)
  4. Rejects question outside owned exam before staging or updating answer (404)

- HTTP runtime: quiz-answer-http-results.json (18/18 assertions)
  - Real populated answers persist and score
  - Foreign exam: 403
  - Unrelated question: 404 (both with and without accepted key)
  - Completed-exam mutation: 400
  - Previously accepted same-resource retry: 200 (no mutation)

- Additional exam engine tests updated (branch, gap, tail2, phase3):
  - Historical fixtures updated with explicit valid resources
  - Stronger assertions verify membership before answer acceptance

---

## 4. SkillHubCore Action-Specific RBAC

### Security Finding
Existing admin grants already include delete/edit/publish permissions, but were not independently verified.

### File: apps/skillhubcore-admin/src/lib/__tests__/r6-action-authorization.test.ts (NEW)

**Created 26 real-signature guard tests:**
- Real JWT signatures with controlled current-account authority mock
- 5 representative paths × 5 test scenarios + 1 origin test

**Test Matrix:**
\\\	ypescript
const paths = [
  ['/api/admin/questions/[id]', 'DELETE', PERMISSIONS.COURSE_DELETE],
  ['/api/admin/blueprints/[id]', 'PATCH', PERMISSIONS.COURSE_EDIT],
  ['/api/admin/domains/batch-delete', 'POST', PERMISSIONS.COURSE_DELETE],
  ['/api/tutorial-composer/sections/[id]/publish', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
  ['/api/tutorial-left-sidebar', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
];
\\\

**Test Scenarios (each path × 5):**
1. Admin role: allows action (200/null response)
2. Super-admin role: allows action (200/null response)
3. Faculty role: denies action (403)
4. Student role: denies action (403)
5. Controlled permission removal: proves guard checks THIS specific permission (403)

**Plus:** Hostile origin test - valid signed admin mutation from untrusted origin (403)

**Code Sample:**
\\\	ypescript
it.each(paths)('checks the action permission independently of the admin-level gate at %s', 
  async (path, method, permission) => {
    const prior = ROLE_PERMISSIONS.admin;
    // Controlled policy injection proves guard checks this particular permission
    ROLE_PERMISSIONS.admin = prior.filter((value): value is Permission => 
      value !== '*' && value !== permission
    );
    try {
      expect((await requireAdminRequest(await request(path, method, 'admin')))?.status).toBe(403);
    } finally {
      ROLE_PERMISSIONS.admin = prior;
    }
  }
);
\\\

**Security Benefits:**
- Establishes existing admin/super-admin grants are correctly enforced
- Proves faculty/student denial for sensitive mutations
- Controlled permission removal verifies guard boundary (not just admin-level check)
- Hostile origin protection verified independently

**Verification:**
- Unit tests: 26 tests passing (shc-actions-final.log)
- Note: These are cryptographic boundary tests with controlled current authority
- Actual populated HTTP mutation and downstream business contracts remain PENDING

---

## 5. Admin Verification Test Suite Improvements

### File: apps/api-server/src/modules/auth/__tests__/batch-08-admin-verification.test.ts

**Changes Made:**
- Updated test suite to verify precise underlying claim failures separately from public 401 contract
- Added controlled faulty-verifier injection to demonstrate independent RBAC class boundary
- New test cases for SHC current-account authority (disabled, demoted, deleted, unavailable)
- Token privilege ceiling tests (demotion removes super-admin, elevation prevention)
- Metric failure boundary tests (does not relabel 500 as 401)

**New Test Cases (19 total):**
1. Rejects missing/malformed/expired/wrong-signature/wrong-audience before RBAC
2. Preserves skillup/admin, skillup/infra, skillhubcore/shc-admin principals
3. Preserves scoped admin cookie precedence and bearer fallback
4. Preserves forbidden authorization after verified principal
5. Does not select infrastructure cookie under admin extraction scope
6. Denies role-ineligible SHC principal (403, not 401)
7. Denies current SHC account ineligibility despite stale admin claims (disabled/demoted)
8. Returns 401 for deleted SHC account
9. Returns 503 when current SHC account authority unavailable
10. Removes stale super-admin privileges after current account demotion
11. Does not elevate admin token when current account is super-admin
12. Preserves super-admin when both token AND account authorize it
13. Rejects independently signed wrong-audience tokens
14. Does not relabel success-metric failure as credential rejection (500, not 401)
15. Surfaces failure-metric outage as operational error after rejected verification (500)
16. Does not translate service resolution failure into 401 (500)
17. Does not translate later RBAC errors into 401 (500)

**Code Sample:**
\\\	ypescript
it.each([
  { role: 'admin', isActive: false },
  { role: 'student', isActive: true },
  { role: 'faculty', isActive: true },
])('denies current SHC account eligibility %j despite stale admin claims', async account => {
  vi.mocked(SHCAuthService.prototype.me).mockResolvedValueOnce({
    id: 'admin', email: 'fixture@example.invalid', platform: 'skillhubcore',
    createdAt: new Date(), ...account,
  });
  expect(await status(requireAdminRouteAccess(
    req(await token('skillhubcore', 'shc-admin'), 'shc-admin')
  ))).toBe(403);
});
\\\

**Security Benefits:**
- Verifies fail-closed behavior: unavailable authority returns 503, never admits requests
- Proves token privilege ceiling prevents indefinite privilege persistence
- Establishes 401/403/500 boundary correctness (no misclassification)
- Controlled faulty-verifier injection demonstrates independent RBAC boundary

---

## 6. Exam Engine Test Suite Updates

### Files Modified:
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.branch.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.branch.gap.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.tail2.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.phase3.test.ts

**Changes Made:**
- Historical fixtures updated with explicit valid resources (owned exams, valid questions)
- Stronger assertions verify membership before answer acceptance
- New test cases for authorization ordering (ownership → membership → idempotency)
- Current state validation tests (cache vs database state)

**Key Test Updates:**

1. **exam.engine.test.ts** - Added 4 critical authorization test cases:
   - Rejects completed exam despite cached started header
   - Preserves accepted retry after exam completes (no mutation)
   - Denies foreign exam with accepted idempotency key (403)
   - Rejects unrelated question before staging answer (404)

2. **exam.engine.branch.test.ts, exam.engine.branch.gap.test.ts** - Updated fixtures:
   - Mock \indQuestionByExamAndQuestion\ returns valid exam-question associations
   - Historical tests assumed implicit membership, now explicit

3. **exam.engine.tail2.test.ts** - Idempotency and completion tests:
   - Verified idempotency only acknowledged after ownership
   - Completion state checked from current database, not cache

4. **exam.phase3.test.ts** - Integration tests:
   - Full exam lifecycle with ownership validation at each step

**Verification:**
- Targeted exam tests: 15/15 passing (api-exam-regressions gate)
- Wider exam suite: 93/94 passing (1 known report-generator URL failure)
- Note: Report-generator failure is in exam.observer.tail.test.ts (localhost 3002 vs api.skillhubcore.in)
  This is a configuration issue, not an authorization failure. See OWNER_DECISIONS_AND_HOLDS.md.

---

## 7. Shared Middleware Admin Guard Test Updates

### File: apps/api-server/src/modules/auth/__tests__/fixture-02-admin-guard.test.ts

**Changes Made:**
- Updated to match new SHC current-account authority contract
- Mock \SHCAuthService.me\ returns valid current account for token verification
- Tests still verify admin guard placement and audience matching

**No functional changes to middleware itself** - only test mocks updated to satisfy new authority requirement.

---

## Architectural Benefits and Security Improvements

### 1. Defense in Depth - Multiple Authorization Layers

**Proxy Layer (authProxy.ts):**
- Session authentication and device validation
- Origin validation (CSRF protection)
- Brand boundary enforcement
- Method and path pattern validation

**Route Layer (route.ts handlers):**
- Typed authentication (requireStudent, requireAdminRouteAccess)
- Service-level ownership validation
- Typed error handling with proper status codes

**Service Layer (exam.engine.ts, liveSessionService):**
- Resource ownership checks
- Exam-question membership validation
- Current state verification (not cached state)

### 2. Fail-Closed Error Handling

**Authority Unavailable:**
- SHC account verification unavailable: 503 (never admits)
- Metric recording failure: 500 (never misclassified as auth failure)
- Service resolution failure: 500 (never 401)

**Clear Status Code Boundaries:**
- 401: Authentication failure, credential invalid, account deleted
- 403: Authorization failure, ownership denied, permission missing
- 404: Resource not found (after authorization passed)
- 500: Operational error, service unavailable
- 503: Dependency unavailable (explicit service outage)

### 3. Information Disclosure Prevention

**Error Sanitization:**
- Provider exceptions (SQL, connection strings) never in public response
- Opaque 500 with correlation ID for debugging
- \private, no-store\ cache policy on sensitive error states

**Account Enumeration Prevention:**
- Deleted SHC accounts: 401 (not 404)
- Missing resources after authorization: 404
- Timing attacks not addressed in this scope (requires rate limiting)

### 4. Token Privilege Ceiling

**SHC Admin Demotion:**
- Stale super-admin token + current admin account = admin privileges only
- Current super-admin account + admin token = admin privileges only (no elevation)
- Current super-admin account + super-admin token = super-admin privileges (mutual authorization)

**Benefits:**
- Prevents indefinite privilege persistence after demotion
- Forces token refresh after privilege changes
- No privilege elevation from current account alone

### 5. Idempotency Without Authorization Bypass

**Ordering:**
1. Authentication (token verification)
2. Ownership (resource belongs to authenticated user)
3. Membership (exam-question association exists)
4. Current state (exam still active, not completed)
5. Idempotency acknowledgement (safe retry for authorized request)

**Benefits:**
- Foreign exam with accepted key: 403 before acknowledgement
- Missing question with accepted key: 404 before acknowledgement
- Completed exam with accepted key: 200 without mutation (preserves idempotency semantics)

---

## Quality Gates and Verification Commands

### Targeted Test Suites (191 tests passing)

\\\ash
# Backend admin verification
pnpm --filter @quiz/api-server exec vitest run \\
  src/modules/auth/__tests__/batch-08-admin-verification.test.ts \\
  --pool=threads --maxWorkers=1 --reporter=verbose

# Backend guard regressions
pnpm --filter @quiz/api-server exec vitest run \\
  src/modules/auth/__tests__/fixture-02-admin-guard.test.ts \\
  --pool=threads --maxWorkers=1 --reporter=verbose

# SHC action authorization (26 real-signature guard tests)
pnpm --filter @quiz/skillhubcore-admin exec vitest run \\
  src/lib/__tests__/r6-action-authorization.test.ts \\
  --pool=threads --maxWorkers=1 --reporter=verbose

# SHC security suite (65 tests)
pnpm --filter @quiz/skillhubcore-admin exec vitest run \\
  src/lib/__tests__/shc-security.test.ts \\
  --pool=threads --maxWorkers=1 --reporter=verbose

# Shared proxy/origin/configuration (28 tests)
pnpm --filter @quiz/share-branding exec vitest run \\
  src/middleware/__tests__/ \\
  --pool=threads --maxWorkers=1 --reporter=verbose

# RTH cancellation routes (9 tests)
pnpm --filter @quiz/realtutorialhub-web exec vitest run \\
  src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts \\
  src/app/api/tutorial/sessions/__tests__/routes.test.ts \\
  --environment=node --pool=threads --maxWorkers=1 --reporter=verbose

# Exam engine targeted tests (15 tests)
pnpm --filter @quiz/api-server exec vitest run \\
  src/modules/exam-engine/__tests__/exam.engine.tail2.test.ts \\
  src/modules/exam-engine/__tests__/exam.engine.test.ts \\
  --pool=threads --maxWorkers=1 --reporter=verbose
\\\

### Static Analysis

\\\ash
# API server typecheck and lint
pnpm --filter @quiz/api-server exec tsc --noEmit
pnpm --filter @quiz/api-server exec eslint \\
  src/modules/exam-engine/exam.engine.ts \\
  src/modules/auth/admin-audience.util.ts \\
  --max-warnings=0

# SHC admin typecheck, lint, and boundaries
pnpm --filter @quiz/skillhubcore-admin type-check
pnpm --filter @quiz/skillhubcore-admin exec eslint \\
  src/lib/__tests__/r6-action-authorization.test.ts --max-warnings=0
pnpm --filter @quiz/skillhubcore-admin check:boundaries

# RTH typecheck and lint
pnpm --filter @quiz/realtutorialhub-web type-check
pnpm --filter @quiz/realtutorialhub-web lint --max-warnings=0

# SUIA typecheck and lint
pnpm --filter @quiz/skillup-web type-check
pnpm --filter @quiz/skillup-web lint --max-warnings=0

# Shared source lint
pnpm exec eslint --config .eslintrc.json \\
  src/share-branding/middleware/authProxy.ts --max-warnings=0
\\\

### Production Builds

\\\ash
# API server production build
pnpm --filter @quiz/api-server build

# All three web apps production builds
pnpm --filter @quiz/skillhubcore-admin build
pnpm --filter @quiz/skillup-web build
pnpm --filter @quiz/realtutorialhub-web build
\\\

### HTTP Runtime Evidence (116/117 assertions)

**Locations:**
- .evidence/r6-existing-p1/authenticated-http-results.json (78/79)
- .evidence/r6-existing-p1/quiz-positive-http-results.json (4/4)
- .evidence/r6-existing-p1/quiz-answer-http-results.json (18/18)
- .evidence/r6-existing-p1/shc-populated-http-results.json (12/12)
- .evidence/r6-existing-p1/shc-backend-http-results.json (4/4)

**Note:** One SUIA own-result 500 during cold-start memory pressure preserved in authenticated-after.log.
Separate warm-fixture run returned 202 for each portal with real login and verified cleanup.

---

## Known Limitations and PENDING Work

### Report Generator Default URL (exam.observer.tail.test.ts)
- Expects localhost:3002, current source defaults to api.skillhubcore.in
- Source inspection finds literal fallback internal credential in existing observer
- No report provider invoked by this verification
- Requires focused disposition in OWNER_DECISIONS_AND_HOLDS.md
- Status: 1 test failure in wider exam suite (93/94 passing)

### Authorization Matrix Status (195 methods across 151 route files)
- 27 rows with new R6-A bounded evidence
- 30 rows: PARTIAL (guard tests or limited positive evidence)
- 161 rows: PENDING (complete role/tenant/object cases require mapped evidence)
- 4 rows: N/A

### OWNER HOLD Categories
- Attendance, payments, Marketing
- Broader accessibility/performance
- Complete operation-specific role, membership, enrollment, ownership matrices
- Full Question Bank CRUD and policy permutations
- Enrollment/membership lifecycle
- All protected backend entry points (individual gaps remain)

### R6-B, R6-C, R6-D Workstreams
- R6-B: Identity investigation (Claude-owned)
- R6-C: QStash automatic continuation proposal (Claude-owned)
- R6-D: Recovery tests and runbook (Gemini-owned)

### Q48 Acceptance
- Status: OPEN for owner acceptance
- Release controls retain their own gates
- Deployed provenance belongs to release owner

---

## Statistics

### Files Changed (19 total)
**Modified (14):**
- apps/api-server/src/modules/auth/admin-audience.util.ts
- apps/api-server/src/modules/auth/__tests__/batch-08-admin-verification.test.ts
- apps/api-server/src/modules/auth/__tests__/fixture-02-admin-guard.test.ts
- apps/api-server/src/modules/exam-engine/exam.engine.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.branch.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.branch.gap.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.engine.tail2.test.ts
- apps/api-server/src/modules/exam-engine/__tests__/exam.phase3.test.ts
- apps/realtutorialhub-web/src/app/api/tutorial/sessions/[requestId]/route.ts
- apps/realtutorialhub-web/next-env.d.ts (generated)
- apps/skillup-web/next-env.d.ts (generated)
- src/share-branding/middleware/authProxy.ts
- .agents/evidence/agent-runs.jsonl (workflow metadata)

**New (5):**
- apps/skillhubcore-admin/src/lib/__tests__/r6-action-authorization.test.ts (26 tests)
- apps/realtutorialhub-web/src/app/api/tutorial/sessions/__tests__/r6-cancellation-security.test.ts (1 test)
- src/share-branding/middleware/__tests__/r6-session-cancellation.test.ts (8 tests)
- docs/architecture/reviews/SHC/SOL_R6_EXISTING_AUTHORIZATION_AND_ENGINEERING_REVIEW.md
- .evidence/r6-existing-p1/ (directory with 5 CSV/MD evidence files)

### Test Coverage
- **New R6 tests:** 35 (26 SHC action + 8 proxy + 1 route sanitization)
- **Updated test files:** 6 (batch-08, fixture-02, 4 exam engine test files)
- **Total targeted tests passing:** 191/191
- **Wider exam suite:** 93/94 (1 known report-generator URL failure)
- **HTTP runtime assertions:** 116/117 (1 SUIA cold-start 500, separate warm run passed)

### Key Modules Affected
1. **Authentication & Authorization:** admin-audience.util.ts, authProxy.ts
2. **Exam Engine:** exam.engine.ts (ownership ordering, current state validation)
3. **RealTutorialHub Routes:** session cancellation route with error sanitization
4. **SkillHubCore Admin:** new action-specific RBAC guard tests

### Security Boundaries Verified
- Token verification boundary (expired, wrong-signature, wrong-audience)
- Current-account authority (disabled, demoted, deleted, unavailable)
- Ownership validation (foreign exam/question denial)
- Membership validation (exam-question association)
- Origin validation (CSRF protection)
- Error sanitization (no information disclosure)
- Token privilege ceiling (super-admin demotion handling)
- Idempotency authorization ordering (no bypass)

---

## Evidence and Documentation

### Sol's Review
docs/architecture/reviews/SHC/SOL_R6_EXISTING_AUTHORIZATION_AND_ENGINEERING_REVIEW.md

### Evidence Directory
.evidence/r6-existing-p1/
- AUTHENTICATED_AUTHORIZATION_MATRIX_R6.csv (195 methods, current status)
- Q01_Q48_R6_A_DELTA.md (derived acceptance delta)
- R6_B_FINAL_IDENTITY_ARCHITECTURE_SIMPLIFICATION.md
- R6_B_IDENTITY_DEPENDENCY_AND_CHANGE_MATRIX.csv
- R6_B_MAINDB_IDENTITY_CONTRACT_ADDENDUM.md
- R6_B_MAINDB_IDENTITY_CONTRACT_REVIEW.md
- FINAL_SOURCE_MANIFEST.json (file hashes)
- authenticated-http-results.json (78/79 assertions)
- authenticated-after.log (includes cold-start 500)
- quiz-positive-http-results.json (4/4)
- quiz-answer-http-results.json (18/18)
- shc-populated-http-results.json (12/12)
- shc-backend-http-results.json (4/4)
- Various test logs (shc-actions-final.log, api-exam-regressions.log, etc.)

### Initial Baseline
Git commit: 62f920f4782b8bbb277f88dc27930cd3b86f1b15

### Provenance Note
Initial read-only Git provenance commands were executed before the attachment's literal ban was read.
This execution deviation is disclosed. Subsequent provenance uses file hashes.

### Graphify Update
graphify update . completed with receipt in graphify-update.log. Parser/cache/community-label
warnings preserved. No paid semantic-label refresh performed.

---

## References

**Sol's Findings:**
1. Direct backend SHC account eligibility bypass
2. RTH cancellation proxy admission denial
3. RTH cancellation error disclosure
4. Quiz mutation ownership status (400 vs 403)
5. Exam-question membership and idempotency ordering
6. Stale active exam cache admission
7. SHC action-specific RBAC verification

**Quality Gates:** All PASS (typecheck, lint, boundaries, builds)
**Test Suites:** 191/191 targeted tests, 93/94 wider exam suite
**HTTP Runtime:** 116/117 assertions (1 cold-start failure, separate warm run passed)
**Authorization Matrix:** 27 rows with new bounded evidence (30 PARTIAL, 161 PENDING, 4 N/A)
**Q48 Status:** OPEN for owner acceptance

This commit implements Sol's R6-A scope only. R6-B/C/D remain with assigned models.
Owner acceptance and release controls retain their own gates.
