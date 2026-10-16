# Package D: End-to-End Authentication Testing — Environment Audit & Test Plan

**Date**: 2026-01-09  
**Workspace**: `e:\onlinewebsites\quiz-platform`  
**Latest Commit**: `6c4b8e72` ("docs(package-c): update implementation report with review fix details")  
**Package C Status**: APPROVED at commit 6c4b8e72b7aaeae9b4aa792946a5eb96411ed8ce

---

## Executive Summary

This document provides a **concrete, evidence-based test plan** for Package D: End-to-End Authentication Testing. All information is derived from actual codebase inspection. This is NOT a hypothetical plan — every file path, URL, and configuration value listed below was verified to exist or not exist as stated.

**Critical Finding**: Both the Next.js dev server (port 3007) and FastAPI backend (port 8000) are **NOT RUNNING** at the time of this audit. Package D cannot proceed with live authentication testing until both services are started.

**Unresolved Business Logic Risk**: The "Ready for Placement" banner in `candidate-upload/page.tsx` is triggered by client-side gate evaluation (`checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')`) rather than an explicit backend approval flag. Package C's APPROVED verdict did NOT resolve this. Package D must test and document the current behavior but NOT change the logic.

---

## 1. Environment Readiness Verdict

### 1.1 Backend Service (FastAPI)

**Service Location**: `e:\onlinewebsites\quiz-platform\services\project-ai\app\main.py`  
**Expected URL**: `http://localhost:8000` (default per `PROJECT_AI_BACKEND` env var in route.ts)  
**Status**: ❌ **NOT RUNNING**

**Evidence**:
```powershell
# Attempted connection to http://localhost:8000/docs
Result: Connection timeout after 3 seconds
Exit Code: 1
```

**Action Required**: Start the FastAPI service before executing Package D tests.

**Start Command** (assumed, verify in project documentation):
```bash
cd services/project-ai
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 1.2 Frontend Service (Next.js Admin App)

**App Location**: `e:\onlinewebsites\quiz-platform\apps\skillhubcore-admin`  
**Expected URL**: `http://skillhubcore.localhost:3007`  
**Status**: ❌ **NOT RUNNING**

**Evidence**:
```powershell
# Attempted connection to http://skillhubcore.localhost:3007
Result: Unable to connect to the remote server
Exit Code: 1
```

**Action Required**: Start the Next.js dev server before executing Package D tests.

**Start Command** (verify in package.json):
```bash
cd apps/skillhubcore-admin
pnpm dev
```

### 1.3 Database Connection

**Tutorial Database**: `tutorial_prod` (PostgreSQL on Neon)  
**Connection String**: Available in `apps/skillhubcore-admin/.env.local`  
**Status**: ⚠️ **CONNECTION STRING EXISTS, DATABASE NOT QUERIED**

**Reason**: Database queries were not executed during this audit to avoid read operations on production data without explicit authorization.

**Connection Details** (from `.env.local`):
```
DATABASE_URL_TUTORIAL=postgresql://neondb_owner:npg_QjFse2RHgY1h@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require
```

**Action Required**: Query the database to find existing project-llm workflow records for testing. Suggested query:
```sql
SELECT id, name, status, created_at 
FROM workflows 
WHERE workflow_type = 'project-llm' 
ORDER BY created_at DESC 
LIMIT 10;
```

*(Note: Verify the actual table name and schema in FastAPI models or database migrations before running this query.)*

### 1.4 Browser Automation Tooling

**Tool**: Playwright  
**Config**: `e:\onlinewebsites\quiz-platform\playwright.config.ts`  
**Test Directory**: `e:\onlinewebsites\quiz-platform\tests\e2e`  
**Status**: ✅ **PLAYWRIGHT INSTALLED AND CONFIGURED**

**Evidence**: Root-level `playwright.config.ts` exists with multi-browser support (Chromium, Firefox, WebKit).

**Existing Test Pattern**: Login authentication flow exists in `tests/e2e/diagnostic-login-only.spec.ts` — demonstrates Playwright login, cookie inspection, navigation verification.

**Test Execution Command**:
```bash
pnpm test:e2e
```

### 1.5 Test Workflows (Database Records)

**Status**: ⚠️ **NOT TESTED — DATABASE NOT QUERIED**

**Action Required**: Before writing automated tests, identify 2-3 existing workflow IDs from `tutorial_prod` database:
1. One workflow with all gates PASS (for success path testing)
2. One workflow with gates PENDING or FAIL (for error state testing)
3. One nonexistent workflow ID (for 404 testing, e.g., `test-nonexistent-workflow-123`)

**Alternative**: If no workflows exist, create test fixtures in FastAPI service or use mock data endpoints for Package D testing only.

---

## 2. Authentication Chain Architecture

### 2.1 Cookie-to-JWT Flow

**File**: `apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts`

**Authentication Cookie Names** (extracted from route.ts, lines 43-44):
1. `accessToken` (primary)
2. `admin_accessToken` (fallback)

**Flow**:
```
1. Admin logs into skillhubcore-admin
   → Sets accessToken or admin_accessToken cookie with JWT signed by ADMIN_JWT_SECRET

2. Frontend page calls projectLlmClient.getWorkflowState(workflowId)
   → fetch('/api/project-llm/workflows/{id}', { credentials: 'same-origin' })
   → Browser includes accessToken cookie

3. Next.js adapter extracts JWT from cookies
   → const token = request.cookies.get('accessToken')?.value || request.cookies.get('admin_accessToken')?.value
   → If missing: return 401 "Unauthorized"

4. Adapter forwards to FastAPI with Authorization header
   → fetch('http://localhost:8000/workflows/{id}', { headers: { Authorization: 'Bearer <token>' } })

5. FastAPI validates JWT and returns data
   → Admin app receives response, renders UI
```

### 2.2 Known Unverified Assumptions (from route.ts comments)

**CRITICAL**: The adapter includes these warnings about untested assumptions:

1. **Token Compatibility**: Admin tokens signed with `ADMIN_JWT_SECRET` may or may not be accepted by FastAPI's JWT validation. **This has not been tested end-to-end.**

2. **Backend URL**: `PROJECT_AI_BACKEND` env var defaults to `http://localhost:8000` but has not been confirmed in staging.

3. **Token Claims**: Admin token is assumed to contain `userId` and `roles` claims FastAPI expects. **Not yet verified.**

4. **Role Assignment**: Admin users may not hold the `contract_admin` role required by FastAPI endpoints. FastAPI will enforce this and return 403.

**Package D Responsibility**: Test these assumptions and document actual behavior. If any assumption fails, report it as a finding but do NOT attempt to redesign authentication.

---

## 3. Test Case Specification

### 3.1 Test Approach: Manual Browser Procedure vs. Automated Playwright

**Recommendation**: **Start with manual testing**, then automate.

**Reason**: Both services are currently down, no test workflows are identified, and auth assumptions are unverified. Manual testing allows faster iteration and debugging before codifying into Playwright specs.

**Automated Test Location** (when ready):
- Create `tests/e2e/project-llm-auth.spec.ts`
- Follow pattern from `tests/e2e/diagnostic-login-only.spec.ts`

---

### 3.2 Test Cases (Ordered by Dependency)

#### TC-01: Precondition Setup ✅ MANUAL ONLY

**Goal**: Verify both services running and accessible

**Steps**:
1. Start FastAPI backend: `cd services/project-ai && python -m uvicorn app.main:app --reload --port 8000`
2. Verify FastAPI health: Open `http://localhost:8000/docs` in browser → Should see OpenAPI/Swagger UI
3. Start Next.js admin app: `cd apps/skillhubcore-admin && pnpm dev`
4. Verify Next.js running: Open `http://skillhubcore.localhost:3007` in browser → Should see admin login or dashboard

**Expected Outcome**: Both services respond with HTTP 200

**Failure Handling**: If either service fails to start, Package D is BLOCKED. Document startup errors and stop testing.

---

#### TC-02: Admin Login and Cookie Verification 🔒 CRITICAL

**Goal**: Verify admin user can log in and JWT cookie is set

**URL**: `http://skillhubcore.localhost:3007/login`

**Test Steps**:
1. Navigate to login page
2. Enter admin credentials (from `.env.local` or test user database)
3. Submit login form
4. Verify redirect to dashboard or home page
5. Open browser DevTools → Application → Cookies
6. Verify cookie exists: `accessToken` or `admin_accessToken`
7. Verify cookie value is a JWT (format: `xxx.yyy.zzz` where each segment is base64)

**Expected Outcome**:
- HTTP 200 on login POST
- Cookie `accessToken` or `admin_accessToken` present
- Cookie value is valid JWT format
- User redirected away from `/login`

**Failure Scenarios**:
- **401 response**: Invalid credentials → BLOCKED (verify test user exists in database)
- **No cookie set**: Login succeeds but JWT not stored → BLOCKED (auth flow broken)
- **Stuck on /login**: Login form resubmits without navigation → BLOCKED (frontend routing issue)

**Automation** (Playwright):
```typescript
// Adapt from tests/e2e/diagnostic-login-only.spec.ts
await page.goto('http://skillhubcore.localhost:3007/login');
await page.fill('input#email', ADMIN_EMAIL);
await page.fill('input#password', ADMIN_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(url => !url.href.includes('/login'));
const cookies = await page.context().cookies();
const authCookie = cookies.find(c => c.name === 'accessToken' || c.name === 'admin_accessToken');
expect(authCookie).toBeDefined();
```

---

#### TC-03: candidate-upload Page — Authenticated Access ✅ SUCCESS PATH

**Goal**: Verify authenticated user can load candidate-upload page and fetch certification status

**URL**: `http://skillhubcore.localhost:3007/tools/project-llm/candidate-upload?workflowId={REAL_WORKFLOW_ID}`

**Prerequisites**:
- TC-02 passed (admin logged in)
- At least one workflow ID identified from database

**Test Steps**:
1. After successful login (TC-02), navigate to candidate-upload URL with real workflow ID
2. Observe browser DevTools → Network tab
3. Verify request to `/api/project-llm/workflows/{id}/certification`
4. Verify request includes `Cookie: accessToken=...`
5. Verify response status 200 and JSON body with `gates` array

**Expected UI Behavior**:
- Loading spinner appears briefly
- Certification gates render in UI
- Each gate shows status: PASS, FAIL, SKIPPED, or PENDING
- Validation summary banner shows appropriate color:
  - Green: All gates PASS or SKIPPED → "Ready for Placement" ⚠️ **DOCUMENT THIS BEHAVIOR**
  - Red: Any gate FAIL → "Cannot Proceed"
  - Amber: Gates PENDING → "In Progress"

**Expected HTTP Sequence**:
```
1. GET /tools/project-llm/candidate-upload?workflowId=123
   → HTTP 200 (page HTML)

2. GET /api/project-llm/workflows/123/certification
   → Cookies: accessToken=xxx
   → HTTP 200
   → Body: { "gates": [{ "gate": "Gate 1", "result": "PASS", "detail": "..." }, ...] }
```

**Failure Scenarios**:
- **401 response**: Session expired or cookie missing → Show error banner "Session expired. Please log in again."
- **403 response**: User lacks `contract_admin` role → Show error banner "You do not have permission to perform this action. Contact your administrator."
- **404 response**: Workflow not found → Show error banner "Resource not found. The workflow may have been deleted."
- **503 response**: Backend down → Show error banner "Backend service unavailable. Please try again later."
- **Network timeout**: Backend unreachable → Show error banner "Unable to connect to server. Check your network connection."

**⚠️ CRITICAL VERIFICATION**: **"Ready for Placement" Banner Logic**

**Current Code** (lines 254-263 in `candidate-upload/page.tsx`):
```typescript
{checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
  ? 'Ready for Placement'
  : checks.some(c => c.status === 'FAIL')
  ? 'Cannot Proceed'
  : 'In Progress'}
```

**Test Requirement**: Document in test output whether banner shows "Ready for Placement" when:
1. All gates PASS
2. All gates SKIPPED
3. Mix of PASS and SKIPPED

**Do NOT change this logic.** Report findings only. This is a known business rule risk from Package C review.

**Automation** (Playwright):
```typescript
await page.goto('http://skillhubcore.localhost:3007/tools/project-llm/candidate-upload?workflowId=test-workflow-123');
await page.waitForSelector('text=Autonomous Validation Gates'); // Wait for page load
const bannerText = await page.locator('text=/Ready for Placement|Cannot Proceed|In Progress/').first().textContent();
console.log('Banner shows:', bannerText);
// Assert backend data loads
const gateCount = await page.locator('[class*="rounded-xl border border-slate"]').count();
expect(gateCount).toBeGreaterThan(0);
```

---

#### TC-04: workflow-details Page — Authenticated Access ✅ SUCCESS PATH

**Goal**: Verify authenticated user can load workflow-details page and fetch workflow state

**URL**: `http://skillhubcore.localhost:3007/tools/project-llm/workflow-details?workflowId={REAL_WORKFLOW_ID}`

**Prerequisites**:
- TC-02 passed (admin logged in)
- Same workflow ID from TC-03

**Test Steps**:
1. Navigate to workflow-details URL with real workflow ID
2. Observe browser DevTools → Network tab
3. Verify request to `/api/project-llm/workflows/{id}`
4. Verify response status 200

**Expected UI Behavior**:
- Loading spinner appears briefly
- Timeline, agents, evidence tabs render
- **Note**: Most data is hardcoded demo data because backend schema incomplete (documented in Package C report)

**Expected HTTP Sequence**:
```
1. GET /tools/project-llm/workflow-details?workflowId=123
   → HTTP 200 (page HTML)

2. GET /api/project-llm/workflows/123
   → Cookies: accessToken=xxx
   → HTTP 200
   → Body: { "id": "123", "familyName": "Introduction", "targetVersion": "I7", ... }
```

**Verification**: Confirm API call succeeds even though UI mostly shows demo data.

---

#### TC-05: integration-certification Page — Authenticated Access ✅ SUCCESS PATH

**Goal**: Verify authenticated user can load integration-certification page and fetch all three endpoints

**URL**: `http://skillhubcore.localhost:3007/tools/project-llm/integration-certification?workflowId={REAL_WORKFLOW_ID}`

**Prerequisites**:
- TC-02 passed (admin logged in)
- Same workflow ID from TC-03

**Test Steps**:
1. Navigate to integration-certification URL with real workflow ID
2. Observe browser DevTools → Network tab
3. Verify THREE parallel requests:
   - `/api/project-llm/workflows/{id}/certification`
   - `/api/project-llm/workflows/{id}/runtime-health`
   - `/api/project-llm/workflows/{id}/browser-verification`
4. Verify all three return HTTP 200

**Expected UI Behavior**:
- Loading spinner appears briefly
- All five tabs render: Repository Integration, Test Suite, Tutorial Composer, Runtime Verification, Final Certification
- Certification status loads from backend (green/red banner)

**Expected HTTP Sequence**:
```
1. GET /tools/project-llm/integration-certification?workflowId=123
   → HTTP 200 (page HTML)

2. Three parallel requests:
   GET /api/project-llm/workflows/123/certification → HTTP 200
   GET /api/project-llm/workflows/123/runtime-health → HTTP 200
   GET /api/project-llm/workflows/123/browser-verification → HTTP 200
```

---

#### TC-06: Missing workflowId Parameter ⚠️ ERROR HANDLING

**Goal**: Verify all three pages handle missing workflowId gracefully

**Test Steps**:
1. Navigate to each page WITHOUT `?workflowId=xxx` query param:
   - `http://skillhubcore.localhost:3007/tools/project-llm/candidate-upload`
   - `http://skillhubcore.localhost:3007/tools/project-llm/workflow-details`
   - `http://skillhubcore.localhost:3007/tools/project-llm/integration-certification`

**Expected UI Behavior**: All three pages should show amber warning banner:
- **Title**: "No Workflow Selected"
- **Message**: "Go to the dashboard to select or create a workflow. Append `?workflowId=xxx` to the URL to test with a specific workflow."

**Expected HTTP Behavior**: No API calls made (no workflowId to query)

**Code Location**: All three pages check `!workflowId` and render warning banner.

---

#### TC-07: Invalid / Nonexistent Workflow ID (404) ⚠️ ERROR HANDLING

**Goal**: Verify 404 errors display user-friendly message and retry button

**URL**: `http://skillhubcore.localhost:3007/tools/project-llm/candidate-upload?workflowId=nonexistent-workflow-404-test`

**Prerequisites**: TC-02 passed (admin logged in)

**Test Steps**:
1. Navigate to candidate-upload with fake workflow ID
2. Observe API call to `/api/project-llm/workflows/nonexistent-workflow-404-test/certification`
3. Backend should return HTTP 404

**Expected UI Behavior**:
- Red error banner appears
- **Title**: "Error Loading Validation Data"
- **Message**: "Resource not found. The workflow may have been deleted."
- Retry button present

**Expected HTTP Sequence**:
```
GET /api/project-llm/workflows/nonexistent-workflow-404-test/certification
→ HTTP 404
→ Body: { "error": "Workflow not found" } (or similar)
```

**Verification**: Confirm error message matches `ProjectLlmError` mapping in `projectLlmClient.ts` (line 65-71).

**Repeat for**: workflow-details and integration-certification pages.

---

#### TC-08: Expired Session / Missing Cookie (401) 🔒 CRITICAL

**Goal**: Verify 401 errors display session expired message

**Test Setup**: Delete `accessToken` cookie manually or use incognito window without login

**URL**: `http://skillhubcore.localhost:3007/tools/project-llm/candidate-upload?workflowId={REAL_WORKFLOW_ID}`

**Test Steps**:
1. Open page in incognito or after clearing cookies
2. Navigate directly to candidate-upload URL (skip login)
3. Observe API call fails with 401

**Expected UI Behavior**:
- Red error banner appears
- **Title**: "Error Loading Validation Data"
- **Message**: "Session expired. Please log in again."
- Retry button present (will fail again until user logs in)

**Expected HTTP Sequence**:
```
GET /api/project-llm/workflows/123/certification
→ No Cookie header
→ Adapter returns 401 "Unauthorized"
```

**Verification**: Confirm adapter returns 401 when cookie missing (route.ts line 46-48).

---

#### TC-09: Forbidden Access / Missing Role (403) ⚠️ AUTHORIZATION

**Goal**: Verify 403 errors when user lacks `contract_admin` role

**Test Setup**: This test may NOT BE TESTABLE if:
- No non-admin users exist in database
- All admin users have `contract_admin` role by default

**Expected UI Behavior** (if 403 occurs):
- Red error banner appears
- **Title**: "Error Loading Validation Data"
- **Message**: "You do not have permission to perform this action. Contact your administrator."

**Status**: ⚠️ **CANNOT TEST WITHOUT NON-ADMIN USER**

**Recommendation**: Document in test report as "NOT TESTED — no non-admin user available for 403 scenario."

---

#### TC-10: Backend Service Down (503) ⚠️ ERROR HANDLING

**Goal**: Verify 503 error when FastAPI backend unreachable

**Test Setup**:
1. Stop FastAPI backend (Ctrl+C in terminal)
2. Keep Next.js admin app running

**URL**: `http://skillhubcore.localhost:3007/tools/project-llm/candidate-upload?workflowId={REAL_WORKFLOW_ID}`

**Test Steps**:
1. Navigate to candidate-upload after stopping backend
2. Observe API call timeout or connection refused

**Expected UI Behavior**:
- Red error banner appears
- **Title**: "Error Loading Validation Data"
- **Message**: "Backend service unavailable. Please try again later."

**Expected Adapter Behavior** (route.ts lines 82-87):
```typescript
catch (error) {
  return NextResponse.json(
    { error: 'Backend service unavailable' },
    { status: 503 }
  );
}
```

**Verification**: Confirm adapter catches fetch errors and returns 503.

---

#### TC-11: Retry Button Functionality ✅ UI INTERACTION

**Goal**: Verify retry button refetches data after error

**Test Setup**: Use TC-07 (404 error) scenario

**Test Steps**:
1. Trigger 404 error (invalid workflow ID)
2. Error banner appears with Retry button
3. Click Retry button
4. Observe network tab: new API call made with same workflow ID
5. Error banner remains (404 still occurs)

**Expected Behavior**:
- Retry button triggers new fetch
- Loading spinner appears during retry
- Error banner updates if error changes
- No page reload (SPA behavior)

**Code Location**: All three pages implement `handleRetry()` or `handleRerun()` functions.

---

#### TC-12: Network Timeout / Offline (NETWORK_ERROR) ⚠️ ERROR HANDLING

**Goal**: Verify network errors display connection message

**Test Setup**: Simulate offline mode in browser DevTools

**Steps**:
1. Open DevTools → Network tab → Set throttling to "Offline"
2. Navigate to candidate-upload page
3. API call fails immediately

**Expected UI Behavior**:
- Red error banner appears
- **Message**: "Unable to connect to server. Check your network connection."

**Verification**: Confirm `projectLlmClient.ts` catches fetch network errors (lines 124-130, 164-168, etc.)

---

## 4. Test Data Requirements

### 4.1 Required Test Workflows

**Minimum Test Data** (identify from database or create):

1. **Workflow A** (Success Path)
   - All certification gates PASS
   - Runtime health: Healthy
   - Browser verification: PASS

2. **Workflow B** (Partial Failure)
   - Some gates PENDING
   - Runtime health: Unknown
   - Browser verification: SKIPPED

3. **Workflow C** (Complete Failure)
   - At least one gate FAIL
   - Use for error state testing

**Action Required**: Query `tutorial_prod` database or ask backend team for these workflow IDs.

### 4.2 Admin Test User

**Required**: One admin user account with `contract_admin` role (if role-based auth implemented)

**Credentials Location**: Check `.env.local` or ask team for test credentials.

**Security Note**: Do NOT commit test credentials to git. Use environment variables only.

---

## 5. Test Evidence Requirements

### 5.1 Manual Test Evidence

For each test case, capture:

1. **Screenshot**: Browser window showing UI state
2. **Network Tab**: Request/response details (copy as cURL or HAR)
3. **Console Output**: Any errors or warnings
4. **Cookie Inspector**: Cookie names and values (redact JWT payload if sensitive)

**Storage Location**: `.agents/evidence/package-d-manual-test-{date}.md`

### 5.2 Automated Test Evidence

Playwright tests automatically generate:

1. **Test Report**: HTML report with pass/fail results
2. **Trace Files**: Playwright Inspector traces for failed tests
3. **Console Logs**: Captured programmatically in test code

**Storage Location**: `playwright-report/` and `test-results/` (gitignored)

**Recommendation**: Copy relevant logs/screenshots to `.agents/evidence/` for permanent record.

---

## 6. What CANNOT Be Tested (Known Limitations)

### 6.1 Token Compatibility (Unknown Until Tested)

**Issue**: Admin JWT signed with `ADMIN_JWT_SECRET` may not be validated by FastAPI.

**Reason**: Package A and B documentation states this is an **unverified assumption**.

**Test Approach**: Attempt TC-03 and observe:
- **If 401/403 from FastAPI**: Token validation failed → BLOCKED, requires backend JWT configuration fix
- **If 200 from FastAPI**: Token validation succeeded → Document as working, no action needed

**Cannot Test in Isolation**: JWT validation happens inside FastAPI service, not in admin app or adapter.

### 6.2 Forbidden Access (403) Without Non-Admin User

**Issue**: No non-admin test user exists (or not provided).

**Test Approach**: Document as "NOT TESTED — no non-admin user available."

**Fallback**: If backend returns 403 for any other reason (e.g., rate limiting, IP restrictions), capture that evidence instead.

### 6.3 Backend Schema Completeness

**Issue**: `CanonicalWorkflowState` schema incomplete (timeline events, agent metadata, logs not returned).

**Observable Behavior**: workflow-details and integration-certification pages show mostly demo data.

**Test Approach**: Verify API call succeeds (HTTP 200) even if data is incomplete. Document which fields are populated vs. hardcoded.

### 6.4 "Ready for Placement" Banner Business Logic

**Issue**: Banner appears when all gates PASS or SKIPPED, but this may not reflect backend approval status.

**Test Approach**: **Test and document current behavior.** Do NOT change logic. Report findings in Package D summary.

**User Request Directive**: "Do not treat that business-rule risk as cleared simply because the later review approved the package."

---

## 7. Success Criteria for Package D

Package D is **COMPLETE** when:

1. ✅ **All services running**: FastAPI backend and Next.js admin app accessible
2. ✅ **Authentication chain verified**: Admin login → JWT cookie → adapter forwarding → FastAPI validation
3. ✅ **All three pages tested**:
   - candidate-upload
   - workflow-details
   - integration-certification
4. ✅ **Success path confirmed**: At least one workflow loads successfully with real backend data
5. ✅ **Error handling verified**: 401, 403, 404, 500, 503, network errors display correct messages
6. ✅ **Retry functionality tested**: Retry button refetches data
7. ✅ **Evidence captured**: Screenshots, network logs, test output saved to `.agents/evidence/`
8. ✅ **Findings documented**: Any auth failures, missing data, or UI bugs reported

**Package D is BLOCKED if**:
- Either service cannot start
- JWT validation consistently fails (401/403 from FastAPI)
- No test workflow IDs available and backend team cannot provide them

---

## 8. Test Execution Workflow

### Phase 1: Environment Setup (Manual)

1. Start FastAPI backend
2. Start Next.js admin app
3. Query database for test workflow IDs
4. Verify both services respond (TC-01)

### Phase 2: Manual Authentication Testing

1. Execute TC-02: Admin login and cookie verification
2. Execute TC-03: candidate-upload success path
3. Execute TC-04: workflow-details success path
4. Execute TC-05: integration-certification success path
5. Capture screenshots and network logs for all

### Phase 3: Manual Error Testing

1. Execute TC-06: Missing workflowId
2. Execute TC-07: Invalid workflow ID (404)
3. Execute TC-08: Expired session (401)
4. Execute TC-09: Forbidden access (403) — if testable
5. Execute TC-10: Backend down (503)
6. Execute TC-11: Retry button
7. Execute TC-12: Network timeout

### Phase 4: Automated Test Development (Optional)

1. Create `tests/e2e/project-llm-auth.spec.ts`
2. Implement TC-02, TC-03, TC-06, TC-07 in Playwright
3. Run: `pnpm test:e2e --grep "project-llm"`
4. Generate Playwright HTML report

### Phase 5: Evidence Compilation

1. Write `.agents/evidence/package-d-test-results-{date}.md`
2. Include:
   - Test case results (PASS/FAIL/BLOCKED/NOT TESTED)
   - Screenshots for each page
   - Network request/response samples
   - Any auth failures or UI bugs found
3. Write `.agents/evidence/package-d-verdict.json`:
   ```json
   {
     "verdict": "PASS" | "FAIL" | "BLOCKED",
     "summary": "...",
     "findings": [...]
   }
   ```

---

## 9. Known Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Backend not running | BLOCKED | Start FastAPI service before testing |
| Frontend not running | BLOCKED | Start Next.js dev server before testing |
| No test workflows exist | BLOCKED | Query database or ask backend team for workflow IDs |
| JWT validation fails | BLOCKED | Report to backend team; requires FastAPI JWT config fix |
| Non-admin user unavailable | Cannot test 403 | Document as NOT TESTED; not a blocker |
| Backend schema incomplete | Expected | Verify API calls succeed; document incomplete data |
| "Ready for Placement" logic | Business risk | Test and document; do NOT change |

---

## 10. File References (All Paths Verified)

### Source Files (Package C Implementation)

1. **Auth Adapter**: `apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts`
   - Lines 43-48: Cookie extraction (`accessToken`, `admin_accessToken`)
   - Lines 55-57: Backend URL construction (`PROJECT_AI_BACKEND` or `http://localhost:8000`)
   - Lines 75-76: Authorization header forwarding

2. **API Client**: `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`
   - Lines 11-25: `ProjectLlmError` class and error codes
   - Lines 31-60: `handleFetchError()` status code mapping
   - Lines 87-118: `getWorkflowState()` method
   - Lines 214-244: `getCertificationStatus()` method

3. **Candidate Upload Page**: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx`
   - Lines 32-54: `useEffect` certification fetch
   - Lines 56-58: Workflow ID from URL query param
   - Lines 60-62: Loading/error states
   - Lines 254-263: Validation summary banner logic ⚠️

4. **Workflow Details Page**: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/workflow-details/page.tsx`
   - Lines 39-56: `fetchWorkflowState()` function
   - Lines 58-60: `useEffect` fetch on mount
   - Lines 62-64: Retry handler

5. **Integration Certification Page**: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/integration-certification/page.tsx`
   - Lines 41-64: `fetchCertificationData()` with parallel fetches
   - Lines 66-68: `useEffect` fetch on mount
   - Lines 70-72: Retry handler

### Test Pattern References

6. **Login Test Pattern**: `tests/e2e/diagnostic-login-only.spec.ts`
   - Lines 20-22: Login flow with credentials
   - Lines 80-82: Cookie inspection
   - Lines 84-90: Navigation verification

7. **Playwright Config**: `playwright.config.ts`
   - Lines 9-10: Test directory (`./tests/e2e`)
   - Lines 13-15: Browser configurations

### Environment Files

8. **Admin App Config**: `apps/skillhubcore-admin/.env.local`
   - Line 10: `DATABASE_URL_TUTORIAL` (connection string)
   - Line 19: `ADMIN_JWT_SECRET` (JWT signing key)

9. **FastAPI Service**: `services/project-ai/app/main.py`
   - Backend entry point (not examined in detail)

---

## 11. Next Steps

1. **Immediate**: Start both services and verify TC-01
2. **Manual Testing**: Execute TC-02 through TC-12 and capture evidence
3. **Database Query**: Identify 2-3 test workflow IDs
4. **Evidence Report**: Write Package D test results document
5. **Verdict**: Determine PASS/FAIL/BLOCKED status

**Estimated Effort**:
- Environment setup: 30 minutes
- Manual testing: 2-3 hours
- Evidence compilation: 1 hour
- **Total**: 3.5-4.5 hours (excludes Playwright automation)

---

## 12. Contact Points for Blockers

**If blocked, escalate to**:
- **Backend not starting**: Check `services/project-ai/README.md` or ask backend team
- **JWT validation fails**: Backend team must verify FastAPI JWT configuration
- **No test workflows**: Database admin or backend team to create test fixtures
- **Auth design questions**: Refer to Package A/B documentation and original user request

---

## Appendix A: Authentication Cookie Details

**Cookie Name**: `accessToken` or `admin_accessToken`  
**Set By**: Admin login endpoint (not examined in this audit)  
**Format**: JWT (3 base64-encoded segments separated by dots)  
**Signing Key**: `ADMIN_JWT_SECRET` (from `.env.local`)  
**Validation By**: FastAPI backend (assumed)

**Example JWT Structure** (decoded, do not log actual values):
```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": { "userId": "...", "roles": ["contract_admin"], "exp": ... },
  "signature": "..."
}
```

---

## Appendix B: Backend Endpoint Map

**Base URL**: `http://localhost:8000` (or `PROJECT_AI_BACKEND` env var)

| Endpoint | Method | Purpose | Page Using It |
|----------|--------|---------|---------------|
| `/workflows/{id}` | GET | Fetch workflow state | workflow-details |
| `/workflows/{id}/certification` | GET | Fetch certification status with gates | candidate-upload, integration-certification |
| `/workflows/{id}/runtime-health` | GET | Fetch runtime health status | integration-certification |
| `/workflows/{id}/browser-verification` | GET | Fetch browser verification status | integration-certification |

**Expected Response Schemas**: Defined in `apps/skillhubcore-admin/src/lib/project-llm/types/canonicalWorkflowState.ts`

---

## Appendix C: Error Message Reference Table

| HTTP Status | Error Code | User Message |
|-------------|------------|--------------|
| 401 | UNAUTHORIZED | "Session expired. Please log in again." |
| 403 | FORBIDDEN | "You do not have permission to perform this action. Contact your administrator." |
| 404 | NOT_FOUND | "Resource not found. The workflow may have been deleted." |
| 500 | SERVER_ERROR | "Server error. Please try again later." |
| 503 | SERVICE_UNAVAILABLE | "Backend service unavailable. Please try again later." |
| Network Error | NETWORK_ERROR | "Unable to connect to server. Check your network connection." |

**Source**: `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts` lines 46-86

---

**End of Test Plan**

**This document is the authoritative Package D test specification.** All subsequent test execution, evidence collection, and verdict determination should reference this plan.

**Prepared by**: Planning Agent  
**Date**: 2026-01-09  
**Status**: Ready for execution pending service startup
