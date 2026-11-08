# FND13-16 Implementation Review

**Reviewer:** Independent Review Agent
**Baseline:** cc100f47..HEAD (remediation/w1-2-batch-05-targeted)
**Review Date:** 2026-01-12
**Authority:** audit/FND13_16_Implementation_Manifest.md, audit/FND17_W2_Coverage_Map.md

---

## Executive Summary

**VERDICT: CHANGES_REQUESTED**

The FND13-16 implementation addresses some truth corrections but contains **1 HIGH severity blocker** preventing approval:

- **HIGH-1**: FND13 placement scoring fabricates match percentages (90%, 87%, 84%...) when no profile exists, presenting uncalibrated scores as algorithmic matches (line 379 of skillup-data.ts)

**Session Accomplishments (cc100f47..HEAD):**
- Added jsdom environment annotations to 4 test files
- Created placement scoring decision brief
- Created comprehensive implementation manifest
- Verified 33 tests passing

**Prior Implementations (Before Baseline):**
- Newsletter unavailable message (FND16)
- Recovery acknowledgement wording (FND16)
- Exam report key-based remount (FND14)
- Student data helpers with truth boundaries (FND13)

**Status:**
- **Test Quality:** ADEQUATE (33 passing tests, isolated fixtures, honest boundaries documented)
- **Truth Accuracy:** VIOLATION (fabricated placement match scores)
- **Completeness:** PARTIAL (FND15 deferred, auth contracts out of scope, placement blocked)
- **Limitations:** DOCUMENTED (physical tests, decision gates, architectural constraints)

---

## Detailed Findings

### HIGH-1: Fabricated Placement Match Percentages (BLOCKER)

**Severity:** HIGH
**Category:** truth-accuracy
**Finding ID:** FND13 (Placement Scoring)

**Description:**
When a student has NO placement profile, `getSkillupPlacement()` returns fabricated job match percentages:

```typescript
// apps/skillup-web/src/lib/skillup-data.ts:379
match: Math.max(60, 90 - index * 3),  // Returns 90%, 87%, 84%, 81%, ...
```

This presents uncalibrated scores that **suggest algorithmic calibration** when no profile vector exists to compare against. Users see "90% match" for job listings when the system has zero information about their skills, experience, or preferences.

**User-Visible Consequence:**
Students without profiles see ranked job matches implying semantic similarity analysis that never occurred. This is **fabricated data presented as real** per the review criteria.

**Source Evidence:**
- File: `apps/skillup-web/src/lib/skillup-data.ts`
- Lines: 374-380
- Function: `getSkillupPlacement(userId: string)`
- Branch condition: `profileRows[0] === undefined`

**Why Decision Brief Is Not Sufficient:**
The decision brief exists (`audit/FND13_Placement_Zero_Vector_Decision_Brief.md`) and documents three options:
1. Clamp to match=1 (honest floor)
2. Return empty array (no profile → no jobs)
3. Readiness score fallback (requires implementation)

However, **no decision has been recorded** and **fabricated scores remain in production code**. A blocker exists regardless of whether Sol has been asked - the code presents false calibration.

**Required Correction:**
1. **Immediate:** Implement Option 1 (match=1) as minimal truth correction, OR
2. **Product Gate:** If Sol must choose, mark placement dashboard "unavailable pending profile" until decision, OR
3. **Explicit Deferral:** If placement feature is prototype-only, mark it "Demo - not calibrated" in UI

**Recommendation:**
Implement Option 1 (clamp to match=1) immediately. This is a **single-line change** that makes the limitation visible and honest. Product enhancement (better UX, readiness scoring) can follow as separate work after truth violation is removed.

---

## Coverage Assessment by Finding

### FND13: SkillUp Student Data Truth

**Status:** PARTIAL (19 tests passing, 1 truth violation)

**Implemented Corrections:**
✅ Program catalog: Returns persisted batches, empty arrays for missing curriculum
✅ Faculty data: Returns persisted faculty, "unavailable" for missing descriptions
✅ Batch/session data: Returns enrolled batch+sessions, no fabricated recordings
✅ Dashboard: Persisted profile+batch+sessions, `null` for uncomputed attendance
✅ Attendance records: Persisted records, "unavailable" for missing notes
✅ Payment installments: Raw SQL query, throws when unavailable
⛔ **Placement scoring: FABRICATED match percentages (BLOCKER)**

**Test Coverage:**
- program-truth.test.ts: 3 tests (empty, persisted, error) ✅
- faculty-truth.test.ts: 3 tests (empty, persisted, error) ✅
- batch-truth.test.ts: 10 tests (2 functions × 5 cases each) ✅
- attendance-truth.test.ts: 1 test ✅
- dashboard-truth.test.ts: 3 tests (incomplete suite) ⚠️
- payment-truth.test.ts: 2 tests ✅

**Coverage Gaps:**
- Dashboard comprehensive tests missing (attendance/progress/payment integration)
- Placement scoring truth violation
- Physical database tests not executed (isolated fixtures only)

**Verdict:** CHANGES_REQUESTED (placement scoring blocker)

---

### FND14: Assessment Report Truth

**Status:** COMPLETE (10 tests passing, no violations)

**Implemented Corrections:**
✅ Exam ID reset: Key-based remount prevents stale report
✅ Zero vs missing: Distinguishes `0` score from `null`
✅ Error handling: "Error Loading Results" on fetch failure
✅ Question details: "unavailable" when incomplete
✅ Unevaluated answers: "Incorrect: Unavailable" for isCorrect=null

**Test Coverage:**
- sol-report-truth-boundaries.test.tsx: 3 tests (stale race, obsolete response, error) ✅
- exam-summary-truth.test.tsx: 7 tests (zero, error, persisted, missing, aggregates, unevaluated, skipped) ✅

**Source Verification:**
```tsx
// src/share-branding/ExamSummaryReport.tsx:29
return <ExamSummaryReportForExam key={props.examId ?? ''} {...props} />;
```
Key-based remount ensures React unmounts old component on examId change, preventing stale report visibility during pending fetch.

**Coverage Gaps:**
- ReportEngine backend tests not added (server-side logic unverified)
- Per-question timeSpent null→0 ambiguity not resolved
- Physical browser rendering not verified

**Verdict:** APPROVED (within helper-level evidence boundaries)

---

### FND15: SHC Operational and Governance Truth

**Status:** DEFERRED (out of scope for FND13-16 task)

**Reason:**
FND13-16 focuses on SkillUp student data (FND13), assessment reports (FND14), and forms (FND16). FND15 SHC admin operational data requires separate implementation session.

**Coverage Map Status:** PARTIAL (previous sessions addressed some SHC corrections)

**Verdict:** DEFERRED (not blocking FND13-16 approval; requires separate task)

---

### FND16: Form Persistence and Success Claims

**Status:** COMPLETE (1 test passing, source verified)

**Implemented Corrections:**
✅ Newsletter: "currently unavailable" (no fake success alert)
✅ Password recovery: "Unable to confirm the request" (acknowledgement, not delivery guarantee)
✅ Student count claim: Removed (per manifest, not verified in this review)

**Test Coverage:**
- newsletter-truth.test.tsx: 1 test (unavailable message) ✅
- recovery-acknowledgement.test.tsx: 2 tests (BLOCKED by JSX parsing, manually verified)

**Source Verification:**
```tsx
// packages/marketing-site/src/components/footer/FooterBrand.tsx:23
<p className="text-gray-600">Newsletter subscriptions are currently unavailable.</p>
```

```tsx
// apps/skillup-web/src/app/forgot-password/page.tsx:37
throw new Error('Unable to confirm the request. Please try again.');
```

**Coverage Gaps:**
- Auth signup/login contracts not inspected (documented as out of scope)
- RTH local newsletter not verified separately
- Broader form survey not conducted (enrollment/consent forms)
- Recovery test architectural limitation (JSX parsing)

**Verdict:** APPROVED (form persistence claims removed; auth contracts properly scoped out)

---

## Truth Accuracy Assessment

### Violations Found

**HIGH-1: Fabricated Placement Match Percentages**
- Location: apps/skillup-web/src/lib/skillup-data.ts:379
- Type: Fabricated data presented as real
- Impact: Users see fake algorithmic calibration (90%, 87%, 84%...)
- Status: ACTIVE VIOLATION

### Legitimate Data Preserved

✅ Program catalog: Persisted batch records retained
✅ Faculty data: Persisted faculty information retained
✅ Batch/session data: Enrolled batch+sessions retained
✅ Dashboard: Persisted profile+batch+sessions+payments retained
✅ Attendance: Persisted records retained
✅ Payment: Raw SQL to payment DB (persisted data)
✅ Exam reports: Persisted scores and results retained
✅ Newsletter: No false success claim
✅ Recovery: Acknowledgement (not delivery confirmation)

### Zero vs Missing Distinguished

✅ Exam report: Distinguishes `0` score from `null`/missing
✅ Program curriculum: Empty array (not missing data)
✅ Dashboard: `null` for attendancePercent (not computed)
⚠️ Placement: Uses FALLBACK_PLACEMENT profile when none exists (documented)

### Unavailable States Disclosed

✅ Program duration: "Unavailable" when not computed
✅ Batch currentTopic: "Unavailable" when missing
✅ Attendance notes: "Details unavailable" when missing
✅ Faculty description: "Faculty details unavailable" when missing
✅ Exam report: "Error Loading Results" on fetch failure
✅ Exam questions: "Question details unavailable" when incomplete
✅ Newsletter: "currently unavailable"

---

## Test Quality Assessment

### Test Count Verification

**Manifest Claim:** 33 tests passing
**Verification Result:** ✅ ACCURATE

```
Test Files  9 passed (9)
Tests  33 passed (33)
Duration  1.81s
```

**Breakdown:**
- program-truth.test.ts: 3 tests ✅
- faculty-truth.test.ts: 3 tests ✅
- batch-truth.test.ts: 10 tests ✅
- attendance-truth.test.ts: 1 test ✅
- dashboard-truth.test.ts: 3 tests ✅
- payment-truth.test.ts: 2 tests ✅
- sol-report-truth-boundaries.test.tsx: 3 tests ✅
- exam-summary-truth.test.tsx: 7 tests ✅
- newsletter-truth.test.tsx: 1 test ✅

**Test Count History:**
The manifest correctly reconciles previous inflation claim (22 tests in program-truth.test.ts → actually 3 tests). Current counts verified via direct execution.

### Offline Network Guard

**Status:** ACCEPTABLE (per-test mocking pattern)

**Implementation:**
```typescript
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => {
    throw new Error('Unexpected network request');
  }));
});
```

**Assessment:**
Per-test mocking is explicit and visible. Global guard integration would be preferable for broader test suites, but isolated truth tests benefit from per-test control. This is **acceptable** for the current scope.

### Environment Configuration

**Status:** FIXED (jsdom annotations added)

**Changes in This Session:**
Added `// @vitest-environment jsdom` to:
- exam-summary-truth.test.tsx ✅
- sol-report-truth-boundaries.test.tsx ✅
- newsletter-truth.test.tsx ✅
- recovery-acknowledgement.test.tsx ✅

### Test Coverage

**Positive Cases:** ✅ ADEQUATE
- Persisted program, faculty, batch, payment, attendance, dashboard data
- Exam report with valid scores
- Newsletter unavailable message

**Zero/Empty Cases:** ✅ ADEQUATE
- Empty program catalog
- Empty curriculum/highlights arrays
- Zero exam scores distinguished from null

**Error Cases:** ✅ ADEQUATE
- Unavailable storage propagation
- Exam fetch failure
- Missing exam ID
- Recovery acknowledgement failure

**Missing Coverage:**
- Dashboard comprehensive tests (attendance/progress/payment integration)
- Placement zero-profile behavior (blocked by truth violation)
- ReportEngine backend tests

### Evidence Boundaries Documentation

**Status:** EXCELLENT

The manifest includes honest "Evidence Boundaries" section:

**Helper-Level Evidence:**
- ✅ Documented what isolated fixtures prove
- ✅ Documented what they do NOT prove
- ✅ Explicitly states: "No physical Postgres, Redis, or external services"

**HTTP-Level Evidence:**
- ✅ Documented as NOT EXECUTED
- ✅ Lists requirements (running API, auth, tenant isolation)

**Browser-Level Evidence:**
- ✅ Documented as NOT EXECUTED
- ✅ Lists requirements (Playwright/Cypress, DOM, interaction)

### Commands Reproducible

✅ All verification commands provided in manifest
✅ Successfully reproduced 33-test verification
✅ Individual suite commands work correctly

---

## Limitations Documentation

### Documented Limitations

✅ **Placement calibration:** Decision brief exists, blocker documented
✅ **Physical database:** Explicitly stated as NOT EXECUTED
✅ **Browser rendering:** Explicitly stated as NOT EXECUTED
✅ **Auth contracts:** Documented as out of scope
✅ **FND15:** Documented as deferred
✅ **Recovery test:** JSX parsing architectural limitation documented
⚠️ **Dashboard tests:** Incomplete coverage acknowledged

### Missing Documentation

None - all known limitations are documented.

### Legitimate Unavailable Features

✅ Newsletter subscription: Unavailable (no backend service)
✅ Learning workspace: Unavailable (no data source)
✅ Exam listing: Unavailable (implementation incomplete)

These are **legitimately unavailable** (not fabrications) and properly disclosed.

---

## Completeness Assessment

### W2 Findings Addressed

**FND13 (Student Data):**
- ✅ Program catalog truth
- ✅ Faculty data truth
- ✅ Batch/session truth
- ✅ Dashboard truth (partial)
- ✅ Attendance truth
- ✅ Payment truth
- ⛔ **Placement scoring (BLOCKER)**

**FND14 (Assessment Reports):**
- ✅ Exam ID reset (stale report race)
- ✅ Zero vs missing distinction
- ✅ Error handling
- ✅ Question detail gaps
- ✅ Unevaluated answers

**FND15 (SHC Operational):**
- ⏸️ Deferred (out of scope)

**FND16 (Form Persistence):**
- ✅ Newsletter unavailable
- ✅ Recovery acknowledgement
- ✅ Student count claim removed

### Test Coverage Completeness

**Positive Cases:** ✅ Covered (persisted data scenarios)
**Zero/Empty Cases:** ✅ Covered (empty arrays, null values)
**Error Cases:** ✅ Covered (unavailable storage, fetch failures)
**Missing Cases:** Dashboard integration, placement zero-profile, ReportEngine backend

### W2 Findings Without Implementation

**From Coverage Map (FND17_W2_Coverage_Map.md):**
- MKT-012 through MKT-055: Most NOT_STARTED (marketing site corrections)
- SU-CACHE-002/004/005: Service worker private cache (VERIFICATION_FAILED)
- RTH-EXP-001 to RTH-EXP-006: Foreign-tenant export (VERIFICATION_FAILED)
- SU-PROGRESS-004 to SU-PROGRESS-008: Concurrency (VERIFICATION_FAILED)
- PH05-005: Exam deadline/idempotency (NOT_STARTED)
- SHC-DIP-001: Taxonomy direct-DB coupling (NOT_STARTED)

**Assessment:**
FND13-16 task scope is **narrow** (4 findings) within broader 177 W2 findings. Other findings are legitimately out of scope for this review. Coverage Map shows 113 findings remain NOT_STARTED or DEFERRED.

---

## Violations Check

### No Invented Calibrations

⛔ **VIOLATION:** Placement match percentages (90%, 87%, 84%...) are fabricated calibration

### No Invented Percentages

⛔ **VIOLATION:** Placement match percentages present as algorithmic when no algorithm ran

### No Future Dates

✅ No fabricated future dates found

### No Prototype as Production

⚠️ **CAUTION:** Placement system uses FALLBACK_PLACEMENT with demo profile data:
```typescript
const FALLBACK_PLACEMENT = {
  profile: {
    roleGoal: 'Frontend Developer',
    resumeStatus: 'Ready for review',
    profileCompletion: 82,
    interviewCount: 4,
    skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing'],
  },
  jobs: [
    { id: 'job-1', company: 'BrightStack', title: 'Junior Frontend Engineer', location: 'Bengaluru', match: 94 },
    ...
  ],
};
```

This is used as `.profile` fallback when no profile exists (line 373). The manifest documents this as "fallback demo" but the code returns it as if it were the user's actual profile. This **may** constitute prototype-as-production depending on whether UI labels it "demo" or presents it as user data.

**Recommendation:** Verify UI presentation. If FALLBACK_PLACEMENT.profile is shown without "demo" label, this is a second truth violation.

### Legitimate Behavior Preserved

✅ All persisted data (programs, faculty, batch, payments, attendance, exams) retained
✅ Auth denial preserved (not inspected but no changes made)
✅ Historical inputs preserved (no schema changes)

---

## Recommendations

### Immediate Actions Required

1. **FIX HIGH-1 (Placement Scoring):**
   ```typescript
   // apps/skillup-web/src/lib/skillup-data.ts:379
   // BEFORE:
   match: Math.max(60, 90 - index * 3),

   // AFTER:
   match: 1,  // No profile → honest floor
   ```

   **OR** if Sol must approve calibration policy first:

   ```typescript
   // Return empty jobs array pending profile
   jobs: profileRows[0] === undefined ? [] : ...
   ```

   **OR** mark placement dashboard "Demo - not calibrated" in UI until decision.

2. **VERIFY FALLBACK_PLACEMENT UI Presentation:**
   Check whether `FALLBACK_PLACEMENT.profile` is labeled "demo" or presented as user's actual profile. If latter, add "Demo profile" label or use empty/null values instead.

### Follow-on Work

3. **Complete Dashboard Tests:**
   Add comprehensive tests for dashboard attendance/progress/payment integration.

4. **Add ReportEngine Tests:**
   Server-side report generation logic currently unverified.

5. **Physical Test Execution:**
   Database/HTTP/browser tests required before deployment acceptance.

6. **Sol Placement Decision:**
   After truth violation fixed, obtain Sol decision on long-term calibration policy (Options 1/2/3 in decision brief).

7. **FND15 Implementation:**
   Separate session for SHC operational truth corrections.

### Documentation Updates

8. **Update Coverage Map:**
   FND17_W2_Coverage_Map.md shows FND14 as VERIFICATION_FAILED but tests now pass. Reconcile status.

9. **Record Placement Fix:**
   Once implemented, update FND13_16_Implementation_Manifest.md with correction commit and verification.

---

## Conclusion

**The FND13-16 implementation demonstrates strong test discipline, honest evidence boundaries, and good documentation quality.** However, **one HIGH severity blocker prevents approval:**

**Placement match scoring fabricates percentages (90%, 87%, 84%...) when no profile exists**, presenting uncalibrated scores as algorithmic matches. This is a **truth violation** per the review criteria.

**Required for Approval:**
- Fix placement scoring truth violation (single-line change to match=1, OR gate feature pending profile, OR add "demo" label)
- Verify FALLBACK_PLACEMENT UI presentation (ensure not presented as user's actual profile without demo label)

**Strengths:**
- 33 tests passing (verified)
- Test count inflation corrected
- FND14 stale report race verified fixed
- Honest evidence boundaries documented
- Limitations properly disclosed
- jsdom environment issues resolved

**Path to Approval:**
1. Implement placement scoring fix (30 minutes)
2. Verify FALLBACK_PLACEMENT UI labeling
3. Re-run placement tests
4. Submit for re-review

**Estimated Time to Address Blockers:** 1-2 hours (including UI verification and testing)

---

## Review Metadata

**Baseline Verified:** cc100f47 (FND19 Sol review commit)
**HEAD Verified:** e6121f40 (jsdom environment fix)
**Commits Reviewed:** 4 (documentation + jsdom annotations + decision brief)
**Test Execution:** 33 tests verified passing
**Source Files Inspected:** 12 files
**Coverage Map Cross-Referenced:** FND17_W2_Coverage_Map.md
**Prior Implementations Verified:** Newsletter, recovery, exam report, student data helpers

**Review Complete:** 2026-01-12
