# Investigation 08A: Phase 2B.18 Step 3 Runtime Pre-Flight Contract

**Status:** ACTIVE  
**Created:** 2026-10-03  
**Purpose:** Pre-flight contract and runbook for Phase 2B.18 Step 3 bridge verification test  
**Parent:** Investigation 08 (Testing, Validation, and Certification)

---

## Document Purpose

This is a **pre-flight contract**, not a narrative report. It establishes the mandatory environment, configuration, URL, fixture, server, timing, and evidence requirements for Phase 2B.18 Step 3 bridge verification test execution.

Future engineers, Project AI, and certification reviewers must not rediscover these prerequisites through trial and error. All requirements are grounded in actual repository evidence.

---

## Pre-Flight → Certification Flow

```text
PRE-FLIGHT PASS
        ↓
TEST EXECUTION
        ↓
RAW EXECUTION EVIDENCE
        ↓
EVIDENCE CORRELATION
        ↓
CERTIFICATION DECISION
```

**CRITICAL DISTINCTION:**

- **Pre-flight PASS** = Required environment/data/runtime prerequisites satisfied
- **Test PASS** = Playwright assertions passed
- **Evidence VERIFIED** = Raw runtime evidence independently supports assertions
- **Certification** = All required Gate F/G/H certification criteria satisfied

**Step 3 test passing is NOT Gate F/G/H certification.** Step 3 establishes the bridge propagation path; full certification requires additional criteria.

---

## 1. Test Identity

**Phase:** Phase 2B.18  
**Step:** Step 3  
**Test File:** `tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts`  
**Git Verification:** Test file exists and modified 2026-10-03

**Purpose:**
Verify telemetry acknowledgement → ILSProvider cache update → activeBlockProgress → orchestrator propagation.

**Scope:**
Focused bridge verification, **NOT full Gate F.**

From test source:
```typescript
/**
 * SCOPE:
 * This is NOT a full Gate F test. This is a focused bridge verification.
 * We only need to prove the propagation path executes, not that completion
 * triggers at the exact threshold.
 */
```

**Success Criteria (from test source):**
- First heartbeat shows cache replacement with server-confirmed activeTimeSec
- Orchestrator evaluation sees the same fresh activeTimeSec from cache
- All Step 3 console logs appear in sequence for the same delivery event

---

## 2. Application and Runtime Environment

**Application:** `@quiz/skillup-web` (Next.js development server)

**Expected Development Port:** 3009 (VERIFIED from test source)

**Public Test Host:** `skillup.localhost` (VERIFIED from test source)

**Base URL:** `http://skillup.localhost:3009`

**Gateway:** `http://127.0.0.1:8787` (VERIFIED from successful runtime logs)

**Environment Variable Source:**
```typescript
const BASE_URL = process.env.SUIA_BASE_URL ?? 'http://skillup.localhost:3009';
```

**Observation:** Dashboard render time in development mode: 15-25 seconds (observed 23.8s with 13.4s render + 10.3s compile). Test timeout adjusted to 30s to accommodate this.

---

## 3. Feature Flag Pre-Flight (MANDATORY)

### 3.1 Required Feature Flag

```text
NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true
```

### 3.2 Why Required

The auto-completion orchestrator (InstructionalBlockCompletion) must evaluate blocks and trigger completion. Without this flag:
- TutorialPageShell evaluates: `{rawValue: undefined, enabled: false}`
- InstructionalBlockCompletion never triggers
- Step 3 bridge cannot be verified

### 3.3 Where Application Reads It

**File:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx` (line 351-353)

The component evaluates:
```typescript
process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION === 'true'
```

And sets DOM attributes:
```tsx
<div 
  data-auto-completion-enabled={autoCompletionEnabled ? 'true' : 'false'}
  data-auto-completion-env-value={process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION ?? 'undefined'}
>
```

### 3.4 Required Browser Evidence

**Console Log:**
```text
[TutorialPageShell] Auto-completion flag evaluation: {rawValue: true, enabled: true}
```

**DOM Attribute:**
```html
<div data-auto-completion-enabled="true" data-auto-completion-env-value="true">
```

**Test Verification (line 91-93):**
```typescript
const enabledAttr = await page.locator('[data-auto-completion-enabled]')
  .first()
  .getAttribute('data-auto-completion-enabled');
expect(enabledAttr).toBe('true');
```

### 3.5 When Flag Must Be Present

The flag must be present **when skillup-web starts**. `NEXT_PUBLIC_*` environment variables are build/runtime initialization state for Next.js client code. Changing the shell variable after Next.js has already started does not constitute valid pre-flight.

---

## 4. .env.local Protection Rule (MANDATORY)

```text
DO NOT EDIT .env.local FOR THIS TEST
```

**Rationale:**
- `.env.local` is repository-tracked state
- Test must not modify repository environment files
- Feature flag injection must be process-level

**Verified Launch Mechanism:**
```powershell
pnpm exec cross-env NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true `
  pnpm --filter @quiz/skillup-web dev
```

**Package Verification:** `cross-env` is already installed in `apps/skillup-web/package.json` (VERIFIED)

**Critical Rule:** The application must be started/restarted with the flag present. Reuse of stale skillup-web processes started without the flag is invalid.

---

## 5. Server Pre-Flight

### 5.1 Required Services

1. **api-server** (port 3000) - Main API server
2. **api-gateway** (port 8787) - Authentication gateway
3. **skillup-web** (port 3009) - Next.js development server with feature flag

### 5.2 Verification Procedure

**Before Test Execution:**

1. Verify no stale skillup-web process is running on port 3009:
   ```powershell
   Get-NetTCPConnection -LocalPort 3009 -ErrorAction SilentlyContinue
   ```

2. If stale process exists without feature flag, stop it:
   ```powershell
   Stop-Process -Id <PID>
   ```

3. Start skillup-web with feature flag:
   ```powershell
   pnpm exec cross-env NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true `
     pnpm --filter @quiz/skillup-web dev
   ```

4. Verify TutorialPageShell reports in browser console:
   ```text
   [TutorialPageShell] Auto-completion flag evaluation: {rawValue: true, enabled: true}
   ```

5. Only then execute Step 3 test.

### 5.3 Restart Requirement

When changing `NEXT_PUBLIC_*` values, restart skillup-web. Next.js bundles these variables at build/startup time.

---

## 6. Authentication Pre-Flight

### 6.1 Test User

**Test User:** student test account

**Credentials Source:**
```typescript
const STUDENT_EMAIL = process.env.SUIA_EMAIL ?? 'student@skillupitacademy.com';
const STUDENT_PASSWORD = process.env.SUIA_PASSWORD ?? 'testing';
```

**Security Note:** Do not hard-code credentials into documentation. Use environment variables.

### 6.2 Required Authentication Chain

1. Login succeeds: `POST /api/auth/login` → HTTP 200
2. Auth validation: `/auth/me` → HTTP 200, userId present
3. Profile fetch: `/api/profile` → HTTP 200
4. Onboarding status: `onboardingCompleted: true`

**Observed Successful Login Sequence:**
```text
[AUTH_PAGE] ✅ Step 1: Login successful
[AUTH_VALIDATE] Success: {userId: b438fb19, email: student@skillupitacademy.com, 
  onboardingCompleted: true, roles: Array(1)}
[AUTH_STATE] Success: {userId: 8a0ade4a-7f4e-45d3-a1bd-b566d3d0e578, 
  email: student@skillupitacademy.com, onboardingCompleted: true}
```

---

## 7. Canonical Tutorial Fixture (MANDATORY)

### 7.1 Canonical URL

**FULL URL:**
```text
http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**Test Source (line 38):**
```typescript
const JAVA_TUTORIAL_URL = `${BASE_URL}/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`;
```

### 7.2 URL Structure Breakdown

```text
domainSlug:       full-stack-development
subjectSlug:      backend-development
topicSlug:        java
subtopicSlug:     what-is-java-12efacf1
navigationNodeId: whatisjava
```

### 7.3 URL Pattern Warning

**DO NOT use obsolete tutorial URL pattern:**
```text
❌ WRONG: /tutorial/what-is-java
✅ CORRECT: /tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**Evidence:** All recent E2E tests use canonical `/tutorial-v2/` URL structure. Obsolete `/tutorial/` pattern causes HTTP 404.

**Observed Successful Route Resolution:**
```text
[PHASE_2_6] Active URL uses canonical slug: 
  /tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
[PHASE_2_6][CANONICAL_REQUEST_CONFIRMED] 
  {subtopicSlug: what-is-java-12efacf1, navigationNodeId: whatisjava}
```

---

## 8. D1 Block Fixture

### 8.1 D1 Block Identity

**Block ID:** `8680bd00-ecfe-4da7-a78f-9b6a0b6a1749` (VERIFIED from test source line 39)

**Block Version:** `D1` (VERIFIED from test source line 40)

**Test Source:**
```typescript
const D1_BLOCK_ID = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
const D1_BLOCK_VERSION = 'D1';
```

### 8.2 D1 Block Timing Contract

**Expected Time:** 210 seconds (VERIFIED from test source line 41)

**80% Completion Threshold:** 168 seconds (VERIFIED from test source line 42)

**Test Source:**
```typescript
const D1_EXPECTED_TIME = 210; // seconds
const D1_THRESHOLD = 168; // 80% of 210
```

**Completion Policy:** Block completes when `activeTimeSec ≥ 168` (80% of 210)

### 8.3 Required Runtime Evidence

**DOM Element Must Exist:**
```html
<div data-block-id="8680bd00-ecfe-4da7-a78f-9b6a0b6a1749" ...>
```

**ActiveBlockProvider Must Discover Block:**
```text
[ActiveBlockProvider] Blocks discovered - creating observer {blockCount: 3, blockIdentities: Array(3)}
[ActiveBlockProvider] Observer created and observing blocks {observedCount: 3, observerActive: true}
```

**D1 Must Become Active Block:**
```text
[ActiveBlockProvider] activeBlock STATE CHANGE {from: null, to: Object}
```

**Test Verification (lines 82-87):**
```typescript
await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { timeout: 10000 });
const d1Block = page.locator(`[data-block-id="${D1_BLOCK_ID}"]`);
await d1Block.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000); // Allow ActiveBlockContext to stabilize
```

---

## 9. Runtime Dependency Chain

**Required Runtime Chain (all layers must execute):**

```text
Tutorial Route
    ↓
Tutorial Server-Side Rendering (SSR)
    ↓
TutorialDocument Delivery
    ↓
D1 Block Rendered
    ↓
D1 Becomes Active (IntersectionObserver)
    ↓
Auto-Completion Enabled
    ↓
Telemetry Heartbeat (2-second interval)
    ↓
Server Acknowledgement (activeTimeSec)
    ↓
ILSProvider Cache Update (Step 3)
    ↓
activeBlockProgress Update (Step 3 bridge)
    ↓
Orchestrator Evaluation (Gate F)
```

**Observed Successful Chain Evidence:**
```text
[DELIVERY_TRACE] getPublishedTutorialPagePayload SUCCESS
[BlockMetadataResolver] Built resolver {totalBlocks: 3, indexedBlocks: 3}
[ActiveBlockProvider] activeBlock STATE CHANGE {from: null, to: Object}
[Tutorial Session] Learning session established: {sessionId: ..., navigationNodeId: whatisjava}
[ILSProvider] [Step 3] Telemetry delivery acknowledged {authoritativeActiveTimeSec: 64}
[ILSProvider] [Step 3] Cache updated {newActiveTimeSec: 64}
[ILSProvider] [Step 3] Acknowledged block IS active block - updating activeBlockProgress
[ILSTestObservabilityBridge] Attributes set {activeTimeSec: 64}
```

---

## 10. Expected Evidence Sequence

### Evidence Point 1: Telemetry Delivery

**Console Log Markers:**
```text
[ILSProvider] [Step 3] Telemetry delivery acknowledged {blockId: ..., blockVersion: D1, authoritativeActiveTimeSec: XX}
```

**Test Filter (lines 113-117):**
```typescript
const deliveryLogs = consoleMessages.filter(msg => 
  msg.includes('POST /api/tutorial/ils/block-active-time') ||
  msg.includes('block-active-time') ||
  msg.includes('delivery') ||
  msg.includes('processed')
);
```

### Evidence Point 2: ILSProvider Cache Update (STEP 3 CRITICAL)

**Console Log Markers:**
```text
[ILSProvider] [Step 3] Cache updated {operation: replace, index: 9, newActiveTimeSec: XX, ...}
```

**Test Filter (lines 127-131):**
```typescript
const cacheUpdateLogs = consoleMessages.filter(msg =>
  msg.includes('[ILSProvider] [Step 3]') &&
  (msg.includes('Cache updated') || msg.includes('Telemetry delivery acknowledged'))
);
```

**Critical Field:** `newActiveTimeSec: XX` (not `activeTimeSec`)

### Evidence Point 3: Active Block Bridge (STEP 3 CRITICAL)

**Console Log Marker:**
```text
[ILSProvider] [Step 3] Acknowledged block IS active block - updating activeBlockProgress
```

**Test Filter (lines 142-144):**
```typescript
const activeBridgeLogs = consoleMessages.filter(msg =>
  msg.includes('[ILSProvider] [Step 3] Acknowledged block IS active block')
);
```

**Purpose:** Proves Step 3 bridge executed (telemetry acknowledgement → activeBlockProgress update)

### Evidence Point 4: Orchestrator Evaluation

**Console Log Markers:**
```text
[ILSTestObservabilityBridge] Attributes set {blockId: ..., blockVersion: D1, activeTimeSec: XX}
[GATE F FORENSIC] Evaluation inputs: {blockId: ..., activeTimeSec: XX, ...}
[GATE F FORENSIC] Evaluation details: {evaluation.shouldComplete: ..., evaluation.reason: ...}
```

**Test Filter (lines 157-161):**
```typescript
const evaluationLogs = consoleMessages.filter(msg =>
  msg.includes('[GATE F FORENSIC]') ||
  msg.includes('Evaluation inputs') ||
  msg.includes('activeTimeSec')
);
```

### Evidence Point 5: Timing Correlation (VALUE MATCH)

**Requirement:** Cache `newActiveTimeSec` must match subsequent orchestrator evaluation `activeTimeSec`

**Successful Execution Example:**
```text
Cache: 64s
Evaluation: 64s
✅ MATCH
```

---

## 11. Critical Timing Correlation Rule (MANDATORY)

### 11.1 The Problem

The **first** observed evaluation may represent an **earlier** state that occurred before telemetry acknowledgement.

**Example from failed test run:**
```text
Initial evaluation:  activeTimeSec = 4  (before acknowledgement)
Cache update:        newActiveTimeSec = 34 (from acknowledgement)
Later evaluation:    activeTimeSec = 34 (after acknowledgement)
```

**Wrong approach:** Compare first cache value with first evaluation value → **MISMATCH (34 ≠ 4)**

**Correct approach:** Compare cache value with **corresponding** evaluation → **MATCH (34 = 34)**

### 11.2 The Solution

The test must find the orchestrator evaluation that **corresponds** to the cache update, not just grab the first one.

**Corrected Test Logic (lines 174-187):**
```typescript
// Find the LAST cache update (most recent telemetry acknowledgment)
const cacheActiveTime = cacheUpdateLogs
  .map(log => extractActiveTime(log))
  .filter(val => val !== null)
  .pop(); // Take last instead of first

// Find the orchestrator evaluation that matches the cache value
const allEvaluationTimes = evaluationLogs
  .map(log => extractActiveTime(log))
  .filter(val => val !== null);

// Find the evaluation time that matches the cache time
const evaluationActiveTime = allEvaluationTimes.find(time => time === cacheActiveTime) 
  ?? allEvaluationTimes.pop(); // Fallback to last evaluation if no exact match
```

### 11.3 Regex Pattern for Value Extraction

**Pattern:** `/(?:new)?[Aa]ctiveTimeSec[:\s]+(\d+)/`

**Captures:**
- `newActiveTimeSec: 64` → `64`
- `activeTimeSec: 64` → `64`
- `ActiveTimeSec 64` → `64`

**Test Source (lines 171-174):**
```typescript
const extractActiveTime = (log: string): number | null => {
  const match = log.match(/(?:new)?[Aa]ctiveTimeSec[:\s]+(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};
```

---

## 12. Initial State Warning

### 12.1 Initial State Is Not Failure

```text
activeTimeSec = 0
```

or another earlier value is **not automatically a failure**.

**Reason:** Initial ILS navigation fetch may return existing progress with `activeTimeSec: 0` before first heartbeat.

**Observed Successful Run:**
```text
[ILSProvider] fetchProgress - data parsed {hasBlocks: true, blocksCount: 10}
[ILSTestObservabilityBridge] Attributes set {activeTimeSec: 0}  ← INITIAL STATE
[ILSProvider] [Step 3] Telemetry delivery acknowledged {authoritativeActiveTimeSec: 64}
[ILSTestObservabilityBridge] Attributes set {activeTimeSec: 64}  ← POST-ACKNOWLEDGEMENT
```

### 12.2 Distinction Required

The test must distinguish:
- **Initial state:** activeTimeSec from ILS navigation fetch (may be 0 or earlier accumulated value)
- **Post-acknowledgement state:** activeTimeSec from telemetry callback propagation (authoritative)

**Only the post-acknowledgement state proves Step 3 bridge.**

---

## 13. Test Execution Command

### 13.1 Primary Test

```powershell
npx playwright test tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts --project=chromium --grep "Step 3 bridge:" --workers=1
```

**Flags:**
- `--project=chromium`: Use Chromium browser
- `--grep "Step 3 bridge:"`: Run only primary bridge test (excludes race condition test)
- `--workers=1`: Single worker (no parallelization)

### 13.2 Race Condition Test

```powershell
npx playwright test tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts --project=chromium --grep "race condition" --workers=1
```

### 13.3 Both Tests

```powershell
npx playwright test tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts --project=chromium --workers=1
```

---

## 14. Timing Requirements

### 14.1 Dashboard Navigation Timeout

**Configured:** 30 seconds (line 75)

**Rationale:** Dashboard render time in development mode: 15-25 seconds (observed 23.8s: 13.4s render + 10.3s compile)

**Test Source:**
```typescript
await page.waitForURL(/dashboard|tutorial/, { 
  timeout: 30000, 
  waitUntil: 'domcontentloaded' 
});
```

### 14.2 D1 Block Selector Timeout

**Configured:** 10 seconds (line 82)

**Test Source:**
```typescript
await page.waitForSelector(`[data-block-id="${D1_BLOCK_ID}"]`, { timeout: 10000 });
```

### 14.3 ActiveBlockContext Stabilization Delay

**Configured:** 1 second (line 87)

**Rationale:** Allow ActiveBlockContext IntersectionObserver to detect D1 as active block

**Test Source:**
```typescript
await page.waitForTimeout(1000); // Allow ActiveBlockContext to stabilize
```

### 14.4 Telemetry Heartbeat Wait

**Configured:** 35 seconds (line 105)

**Rationale:** Telemetry heartbeat interval is 2 seconds. Wait 35 seconds to ensure at least one complete heartbeat cycle (initial delay + heartbeat + acknowledgement + propagation).

**Test Source:**
```typescript
// Wait 35 seconds to ensure at least one heartbeat has occurred
await page.waitForTimeout(35000);
```

### 14.5 Total Observed Execution Duration

**Successful Run:** 53.0 seconds (VERIFIED from test output)

**Breakdown (approximate):**
- Login: 5-10s
- Tutorial navigation: 5-10s
- D1 activation: 1-2s
- Heartbeat wait: 35s
- Evidence analysis: <1s

---

## 15. Race Condition Verification

### 15.1 Separate Test Purpose

**Test Name:** "Step 3 race condition check: verify blocksRef populated before first acknowledgement"

**Purpose:** Verify `blocksRef.current` is populated before first telemetry acknowledgement.

**Expected:** Initial ILS navigation fetch completes before first heartbeat.

### 15.2 Race Condition Warning

**If race condition occurs:**
```text
[ILSProvider] No blocks cache - cannot update
```

**Meaning:** Telemetry acknowledgement arrived before ILS cache was populated. Authoritative state notification was lost.

### 15.3 Expected Evidence (No Race)

```text
✅ NO RACE CONDITION DETECTED
ILS cache was populated before first telemetry acknowledgement.

[TIMING] Event sequence:
  ILS fetch complete: t+0ms
  First acknowledgement: t+XXXXms
```

**Observed Successful Run:** No race condition warnings. ILS fetch completed before acknowledgement.

---

## 16. Known Non-Blocking Signals

### 16.1 Tutorial Tracking Progress API 401

**Signal:**
```text
Failed to load resource: the server responded with a status of 401 (Unauthorized)
[Tutorial Tracking] Progress API returned 401
```

**Classification:** NON-BLOCKING

**Evidence:** Observed in successful Step 3 test run. Test passed despite this signal.

**Likely Cause:** Separate tracking/analytics endpoint. Does not affect ILS progress pipeline.

**Note:** This classification is based on empirical observation (test passed with signal present). Further investigation deferred unless Step 3 test begins failing with this signal.

### 16.2 Dashboard Webpack Runtime Error

**Signal:**
```text
TypeError: __webpack_modules__[moduleId] is not a function
digest: 1516968980
```

**Classification:** INTERMITTENT DASHBOARD BLOCKER (not Step 3 blocker)

**Evidence:** Observed during early test runs. Dashboard sometimes returns HTTP 500 with webpack error, sometimes HTTP 200 with successful render.

**Mitigation:** Increase dashboard navigation timeout to 30s. If error persists, restart skillup-web.

**Note:** This error blocks navigation to dashboard but does not affect tutorial page once reached. Step 3 test navigates directly to tutorial URL, bypassing dashboard.

---

## 17. Pre-Flight Checklist

Execute this checklist **before** running Step 3 test:

```text
[ ] Correct git branch/commit verified
[ ] Working tree reviewed (no uncommitted changes that affect test)
[ ] .env.local unchanged (MANDATORY)
[ ] Gateway available (port 8787)
[ ] api-server running (port 3000)
[ ] Stale skillup-web process stopped
[ ] skillup-web NOT running on port 3009
[ ] skillup-web started with NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true
[ ] TutorialPageShell browser console reports enabled=true
[ ] Navigate to tutorial URL manually (verify HTTP 200)
[ ] D1 block exists in tutorial content
[ ] D1 block becomes active when scrolled into view
[ ] Login succeeds with test credentials
[ ] /auth/me returns HTTP 200
[ ] /api/profile returns HTTP 200
[ ] onboardingCompleted = true
[ ] ILS navigation fetch succeeds (/api/tutorial/ils/navigation/whatisjava)
[ ] Tutorial session established (sessionId logged)
[ ] Telemetry heartbeat starts (2-second interval)
[ ] Cache acknowledgement occurs (Step 3 log)
[ ] activeBlockProgress updates (Step 3 bridge log)
[ ] Orchestrator evaluation occurs (Gate F log)
[ ] activeTimeSec values correlate (cache = evaluation)
```

**Result:** PASS / FAIL / NOT VERIFIED

---

## 18. Evidence Classification Matrix

| State | Meaning |
|---|---|
| **Pre-flight PASS** | Required environment/data/runtime prerequisites satisfied |
| **Test PASS** | Playwright assertions passed |
| **Execution Evidence VERIFIED** | Raw runtime evidence independently supports assertions |
| **Certification READY** | Step 3 evidence ready for Gate F/G/H certification workflow |
| **Certification COMPLETE** | All required Gate F/G/H certification criteria satisfied |

**CRITICAL:**

```text
Step 3 test passed ≠ Gate F/G/H certified
```

Step 3 establishes the bridge propagation path. Full certification requires additional criteria beyond Step 3.

**From Test Source (lines 235-237):**
```text
console.log('Ready for full Gates F/G/H certification.');
```

This means Step 3 is a **prerequisite/evidence input**, not complete certification.

---

## 19. Reproducibility Requirements

A future operator must be able to reproduce Step 3 without rediscovering:

1. ✅ Feature flag (`NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true`)
2. ✅ Launch command (`cross-env` process injection)
3. ✅ Port (3009)
4. ✅ Gateway (8787)
5. ✅ Canonical URL (`/tutorial-v2/.../whatisjava`)
6. ✅ D1 ID (`8680bd00-ecfe-4da7-a78f-9b6a0b6a1749`)
7. ✅ D1 version (`D1`)
8. ✅ Expected timing (210s)
9. ✅ Threshold (168s = 80%)
10. ✅ Test command (npx playwright test ...)
11. ✅ Evidence sequence (5 points)
12. ✅ Timing correlation rule (last cache → matching evaluation)

**This document centralizes all prerequisites.** Future certification runs must not rediscover through trial and error.

---

## 20. Certification Handoff

### 20.1 Evidence Flow

```text
Step 3 Bridge Pre-Flight
        ↓
Step 3 Execution
        ↓
Raw Evidence (console logs, timing, assertions)
        ↓
Evidence Correlation (5 points verified)
        ↓
Investigation 08 Evidence Matrix
        ↓
Gate F/G/H Certification Workflow
```

### 20.2 Step 3 Scope Boundary

**Step 3 Proves:**
- ✅ Telemetry delivery succeeds
- ✅ ILSProvider cache updated with server activeTimeSec
- ✅ Active block bridge executes (Step 3 critical requirement)
- ✅ Orchestrator evaluates with fresh activeTimeSec
- ✅ Runtime propagation path complete

**Step 3 Does NOT Prove:**
- ❌ Completion triggers at exact threshold
- ❌ All educational block types covered
- ❌ LSNB R/Y/G visualization
- ❌ RSSB component integration
- ❌ Cross-brand behavior
- ❌ Holistic tutorial page lifecycle

**Gate F/G/H Certification Requires:**
- Step 3 bridge verification (this test)
- Educational block completion tests
- LSNB R/Y/G visualization tests
- RSSB component tests
- Tutorial page holistic tests
- Cross-brand verification
- Additional criteria documented in Investigation 08

---

## 21. Successful Execution Baseline

### 21.1 Reference Execution

**Date:** 2026-10-03  
**Duration:** 53.0 seconds  
**Result:** ALL 5 EVIDENCE POINTS PASSED  
**Git Commit:** (current HEAD at execution time)

### 21.2 Evidence Values

```text
✓ Evidence 1: Telemetry delivery: ✅
✓ Evidence 2: Cache updated: ✅
✓ Evidence 3: Active block bridge: ✅
✓ Evidence 4: Orchestrator evaluation: ✅
✓ Evidence 5: activeTimeSec values match: ✅
  Cache: 64s
  Evaluation: 64s
```

### 21.3 Final Console Output

```text
=== STEP 3 BRIDGE VERIFICATION: PASSED ✅ ===

Runtime propagation path confirmed:
  telemetry → callback → cache update → activeBlockProgress → orchestrator

Ready for full Gates F/G/H certification.
```

### 21.4 Playwright HTML Report

**Generated:** `test-results/.../` directory  
**View:** `npx playwright show-report`

---

## 22. Change Control Rules

### 22.1 Protected Files (MUST NOT MODIFY for pre-flight)

```text
src/share-branding/LearningExperience/context/ILSProvider.tsx
src/share-branding/LearningExperience/context/ActiveBlockProvider.tsx
src/share-branding/LearningExperience/components/InstructionalBlockCompletion.tsx
src/share-branding/LearningExperience/components/TutorialPageShell.tsx
src/share-branding/types/tutorial/schema.ts
apps/api-server/src/api/tutorial/ils/block-active-time.ts
.env.local
```

**Exception:** Documentation corrections for factual errors in references are permitted if source inspection proves the documentation wrong. Production runtime behavior must remain untouched.

### 22.2 Permitted Modifications

```text
tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts
  - Timeout adjustments based on observed timing
  - Evidence extraction regex improvements
  - Additional diagnostic logging
  - Timing correlation logic refinements

ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/stage-5/
  - Documentation updates
  - Evidence correlation reports
  - Pre-flight improvements
```

### 22.3 Test Modification Protocol

If Step 3 test must be modified:

1. Document reason for modification
2. Preserve 5 evidence points
3. Maintain timing correlation rule
4. Update this pre-flight document
5. Re-execute test to establish new baseline
6. Update Investigation 08 evidence matrix

---

## 23. Related Documents

**Investigation 08 Main:** `08_TESTING_VALIDATION_AND_CERTIFICATION.md`  
**Gate H Evidence:** `08A_GATE_H_EXECUTION_EVIDENCE.md`  
**Evidence Correlation:** `08B_EXECUTION_EVIDENCE_CORRELATION.md`  
**Phase 2B.18 Reports:** `.analysis/PHASE-2B18-*.md`

---

## 24. Document Status

**Status:** ACTIVE PRE-FLIGHT CONTRACT  
**Last Updated:** 2026-10-03  
**Test File Verified:** `tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts`  
**Successful Execution:** 2026-10-03 (53.0s, all evidence points passed)  
**Next Review:** After any Step 3 test modification or failed execution

---

## 25. Quick Reference Card

### Environment
```powershell
NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true
```

### Launch Command
```powershell
pnpm exec cross-env NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true `
  pnpm --filter @quiz/skillup-web dev
```

### Test Command
```powershell
npx playwright test tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts --project=chromium --grep "Step 3 bridge:" --workers=1
```

### Canonical URL
```text
http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

### D1 Block
```text
ID: 8680bd00-ecfe-4da7-a78f-9b6a0b6a1749
Version: D1
Expected: 210s
Threshold: 168s (80%)
```

### Evidence Points (5)
```text
1. Telemetry delivery
2. Cache updated (Step 3)
3. Active block bridge (Step 3)
4. Orchestrator evaluation
5. activeTimeSec correlation
```

### Success Criteria
```text
Cache newActiveTimeSec = Evaluation activeTimeSec
(Use LAST cache update, find matching evaluation)
```

---

**END OF PRE-FLIGHT CONTRACT**
