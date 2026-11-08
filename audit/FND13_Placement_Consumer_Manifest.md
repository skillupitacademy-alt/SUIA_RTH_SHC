# FND13 Placement API Consumer Manifest

**Repository:** `e:/onlinewebsites/quiz-platform`
**Branch:** `remediation/w1-2-batch-05-targeted`
**HEAD Commit:** `ebbd67e7`
**Generated:** Pre-implementation audit
**Purpose:** Document all consumers of `apps/skillup-web/src/app/api/student/placement/route.ts` response before FND13 truth corrections

---

## Executive Summary

**Total Consumers Identified:** 9 files

- **API Route Handler:** 1 file
- **Data Layer Functions:** 1 file
- **Type Definitions:** 1 file
- **Test Files:** 3 files
- **Page Components:** 2 files
- **API Client:** 1 file

**Critical Finding:** No direct UI components render placement profile fields (roleGoal, resumeStatus, profileCompletion, interviewCount) beyond the aggregate count. The dashboard displays only `placementMatches` (open job count), not individual job match percentages or profile details.

---

## 1. API Route Handler

### `apps/skillup-web/src/app/api/student/placement/route.ts`

**Role:** HTTP endpoint that exposes placement data

**Response Contract:**
```typescript
{
  profile: {
    roleGoal: string,
    resumeStatus: string,
    profileCompletion: number,
    interviewCount: number,
    skills: string[]
  },
  jobs: Array<{
    id: string,
    company: string,
    title: string,
    location: string,
    match: number
  }>
}
```

**Placement Data Used:**
- Returns complete result from `getSkillupPlacement(auth.userId)`
- All profile fields: `roleGoal`, `resumeStatus`, `profileCompletion`, `interviewCount`, `skills`
- All job fields: `id`, `company`, `title`, `location`, `match`

**Null/Unavailable Handling:**
- Delegates to `getSkillupPlacement` — no explicit null handling at route level
- Returns 401/403 for auth failures (via `requireStudentAuth`)

**Dependencies:**
- `@/lib/skillup-data::getSkillupPlacement`
- `@/lib/student-auth::requireStudentAuth`

---

## 2. Data Layer

### `apps/skillup-web/src/lib/skillup-data.ts`

**Function:** `getSkillupPlacement(userId: string)`

**Placement Data Sources:**
- `@quiz/db-placement::studentPlacementProfiles` — user profile with readinessScore, skills, preferences
- `@quiz/db-placement::jobListings` — open job records
- `@quiz/db-placement::findJobsForStudent` — vector matching service

**Profile Fields Generated:**

| Field | Source | Current Behavior | Null Handling |
|-------|--------|------------------|---------------|
| `roleGoal` | `profileRows[0].skills[0]` | First skill from profile, or `'Placement-ready role'` fallback | Uses FALLBACK_PLACEMENT profile when no active profile exists |
| `resumeStatus` | `profileRows[0].status === 'active'` | Hardcoded `'Ready for review'` or `'Paused'` | Uses FALLBACK_PLACEMENT constant |
| `profileCompletion` | `profileRows[0].readinessScore` | Direct DB column value | Uses hardcoded `82` from FALLBACK_PLACEMENT |
| `interviewCount` | `Math.max(1, Math.round(readinessScore / 20))` | **FABRICATED** — calculated from readinessScore | Uses hardcoded `4` from FALLBACK_PLACEMENT |
| `skills` | `profileRows[0].skills` | Direct DB array | Uses hardcoded array from FALLBACK_PLACEMENT |

**Job Match Fields Generated:**

| Field | Source | Current Behavior | Null Handling |
|-------|--------|------------------|---------------|
| `match` | Vector score or fallback calculation | `Math.max(1, Math.round(score * 100))` when vector succeeds; `Math.max(60, 90 - index * 3)` or `readinessScore - index * 3` when vector fails or no profile | **Always returns number ≥ 1**, never null |

**FALLBACK_PLACEMENT Constant:**
```typescript
const FALLBACK_PLACEMENT = {
  profile: {
    roleGoal: 'Frontend Developer',
    resumeStatus: 'Ready for review',
    profileCompletion: 82,
    interviewCount: 4,
    skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing']
  },
  jobs: [ /* 3 hardcoded fixture jobs with fabricated match scores */ ]
}
```

**Null/Unavailable Handling:**
- **No profile exists:** Returns entire `FALLBACK_PLACEMENT.profile` (fabricated profile)
- **Vector service fails:** Falls back to index-based match calculation
- **Vector returns empty:** Falls back to DB-ordered jobs with calculated match scores
- **Zero vector score:** Currently floors to `Math.max(1, ...)`, producing invented `match: 1`

**Error Propagation:**
- DB query failures throw and propagate to caller
- Vector service errors are caught and trigger fallback logic (no throw)

---

## 3. Type Definitions

### `apps/skillup-web/src/lib/skillup-types.ts`

**Type:** `SkillupJobMatch`

```typescript
export type SkillupJobMatch = {
  id: string;
  company: string;
  title: string;
  location: string;
  match: number;
};
```

**Placement Data Used:**
- Defines the shape of job match objects
- `match` field is typed as `number` (not nullable)

**Null/Unavailable Handling:**
- Type system enforces non-null `match` values
- No optional fields in the type

**Impact:** Type definition permits current `match: 1` floor behavior but does not require it. Can be updated to `match: number | null` without breaking if runtime changes to allow null.

---

## 4. Test Files

### `apps/skillup-web/src/lib/__tests__/placement-zero-control.test.ts`

**Purpose:** Characterizes zero vector score display behavior

**Placement Data Tested:**
- `result.jobs[0].match` after vector returns `{ score: 0 }`

**Current Expectation:**
```typescript
expect(result.jobs[0].match).toBe(1);
```

**Null/Unavailable Coverage:**
- **Does NOT test null match values**
- Tests only the floor behavior (`0 → 1`)

**Dependencies:**
- Mocks `@quiz/db-placement` with fixture profile and job
- Mocks `findJobsForStudent` vector service

---

### `apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts`

**Purpose:** HTTP-level truth controls for placement data integrity

**Placement Data Tested:**

| Test Case | Profile Fields | Job Fields | Match Values | Null States |
|-----------|----------------|------------|--------------|-------------|
| `propagates DB profile query failure` | N/A (throws) | N/A | N/A | Error propagation |
| `propagates DB job listing query failure` | All fields from fixture | N/A (throws) | N/A | Error propagation |
| `returns profile with fallback jobs when vector service fails` | `roleGoal`, `skills` | `match` calculated from `readinessScore - index*3` | 80, 77 | Vector failure fallback |
| `uses vector scoring when service succeeds` | `roleGoal` | `match` from vector scores | 92, 87 | Vector success path |
| `returns fallback profile when no active profile exists` | All FALLBACK_PLACEMENT fields | `match` fabricated (90 - index*3) | 90 | No profile fallback |
| `handles empty job listings gracefully` | `roleGoal` | Empty array | N/A | Empty jobs |
| `handles null deadline dates` | N/A | All job fields (deadline not exposed) | 90 (fabricated) | Null deadline |
| `does not fabricate future recording or session dates` | All profile fields shape-checked | All job fields shape-checked | 75 | No synthetic fields |

**Null/Unavailable Coverage:**
- ✅ Tests no-profile scenario (returns FALLBACK_PLACEMENT)
- ✅ Tests empty jobs array
- ✅ Tests vector service failure
- ❌ **Does NOT test `match: null` for unknown scores**

**Current Assertions:**
- All `match` values are expected as numbers
- No test expects or verifies `match: null`

---

### `apps/skillup-web/src/app/api/__tests__/routes.test.ts`

**Purpose:** Integration test for all API routes including placement

**Placement Data Tested:**
- Lines 232-238: `GET /api/student/placement`

**Test Expectations:**
```typescript
const payload = await readJson<{ profile: { roleGoal: string }; jobs: unknown[] }>(response);
expect(response.status).toBe(200);
expect(payload.profile.roleGoal).toBeTruthy();
expect(payload.jobs.length).toBeGreaterThan(0);
expect(mocks.getSkillupPlacement).toHaveBeenCalledWith('student-1');
```

**Mock Response (Lines 142-151):**
```typescript
{
  profile: {
    roleGoal: 'Frontend Developer',
    resumeStatus: 'Ready for review',
    profileCompletion: 82,
    interviewCount: 4,
    skills: ['React', 'Next.js']
  },
  jobs: [ /* fixture jobs */ ]
}
```

**Null/Unavailable Coverage:**
- ✅ Tests successful placement response structure
- ❌ **Does NOT test null profile scenario**
- ❌ **Does NOT test null match values**

---

## 5. Page Components

### `apps/skillup-web/src/app/student/page.tsx`

**Purpose:** Student dashboard displaying summary stats

**Placement Data Used:**
- **Only `summary.placementMatches: number`** — aggregate count of open jobs
- Does NOT consume individual job match percentages
- Does NOT render profile fields (roleGoal, resumeStatus, etc.)

**Response Contract:**
```typescript
type DashboardResponse = {
  summary: {
    placementMatches: number;
    // ... other dashboard fields
  };
  sessions: SkillupSession[];
}
```

**Display:**
- Line 74: `{ label: 'Open jobs', value: summary.placementMatches }`
- Rendered as a stat card with numeric value

**Null/Unavailable Handling:**
- `placementMatches` is typed as `number` (not nullable)
- No explicit null check in component
- Dashboard fetches from `/api/student/dashboard`, NOT `/api/student/placement`

**Data Source:**
- `getSkillupStudentDashboard` (different function) queries `placementJobListings` directly
- Does NOT call `getSkillupPlacement`

**Impact:** Dashboard is isolated from placement profile/match changes. Only the aggregate open job count is displayed.

---

### `apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx`

**Purpose:** Page-level truth controls for rendered content

**Placement Data Tested:**
- Line 36: Dashboard renders `placementMatches: 4` as "Open jobs"

**Test Expectations:**
```typescript
const summary = { /* ... */ placementMatches: 4, /* ... */ };
expect(screen.getByText('Open jobs')).toBeTruthy();
expect(screen.queryByText('Job matches')).toBeNull();
```

**Null/Unavailable Coverage:**
- ✅ Verifies label is "Open jobs" not "Job matches"
- ✅ Tests with specific numeric value (4)
- ❌ **Does NOT test `placementMatches: 0` or null**

**Impact:** Confirms dashboard uses aggregate count, not per-job match percentages.

---

## 6. API Client

### `apps/skillup-web/src/lib/skillup-api.ts`

**Function:** `fetchSkillupApi<T>(path: string)`

**Placement-Related Behavior:**
- Line 84: `/api/student/placement` is in the protected route list
- If fetch fails, throws error: `'Protected SkillUp data fetch failed for ${path}'`
- Does NOT fall back to `getSkillupPlacement` directly

**Null/Unavailable Handling:**
- Auth failures (401/403) throw `SkillupAuthorizationError`
- Network/server failures throw generic Error
- No placement-specific fallback logic

**Impact:** Client layer does not transform or validate placement response structure.

---

## 7. Cross-App Consumers

**Finding:** No cross-app consumers found.

**Search Scope:**
- Searched all `apps/skillup-web/` TypeScript files
- Checked for imports of placement types and functions
- Verified no external packages consume placement response

**Placement Bridge:**
- `apps/skillup-web/src/app/placement/page.tsx` redirects to external placement portal (`https://placement.skillhubcore.in`)
- Does NOT consume the `/api/student/placement` response
- Uses `/api/auth/placement-handoff` for SSO, not placement data

---

## Authorized Changes Summary (FND13 Decision)

Based on [Sol's decision](E:/onlinewebsites/quiz-platform/audit/FND13_Placement_Truth_Sol_Decision_e6121f40.md):

### Approved Corrections

1. **Remove fabricated `interviewCount`**
   - Current: `Math.max(1, Math.round(readinessScore / 20))`
   - Approved: Remove field entirely from response

2. **Return `null` for unknown match percentages**
   - Current: `Math.max(1, Math.round(score * 100))` floors to 1
   - Approved: Return `null` when `score` is unavailable or 0

3. **Return `profile: null` when no profile exists**
   - Current: Returns `FALLBACK_PLACEMENT.profile` with fabricated data
   - Approved: Return `null` instead of fixture data

4. **Keep persisted jobs browsable**
   - Current: Returns all open jobs from DB
   - Approved: Maintain this behavior (no change)

5. **Remove invented completion metrics**
   - Current: `FALLBACK_PLACEMENT` includes fabricated `profileCompletion: 82`
   - Approved: Return actual DB value or `null`

### NOT Approved

- `match: 1` floor (Sol explicitly rejected this)

---

## Implementation Impact Assessment

### Files Requiring Edits

1. **`apps/skillup-web/src/lib/skillup-data.ts`**
   - Remove `FALLBACK_PLACEMENT` constant
   - Change `profile` return type to allow `null`
   - Remove `interviewCount` calculation
   - Change `match` calculation to return `null` for unknown/zero scores
   - Return `profile: null` when `profileRows[0] === undefined`

2. **`apps/skillup-web/src/lib/skillup-types.ts`**
   - Update `SkillupJobMatch` type: `match: number | null`
   - Create new type for placement profile (currently inline)
   - Make profile nullable in placement response type

3. **`apps/skillup-web/src/lib/__tests__/placement-zero-control.test.ts`**
   - Update expectation: `expect(result.jobs[0].match).toBe(null)` (was `1`)

4. **`apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts`**
   - Update no-profile test to expect `profile: null` (not FALLBACK_PLACEMENT)
   - Update match score assertions to allow `null`
   - Remove `interviewCount` from all assertions

5. **`apps/skillup-web/src/app/api/__tests__/routes.test.ts`**
   - Update mock to remove `interviewCount`
   - Update type annotation to allow nullable profile

### Files NOT Requiring Edits

- **`apps/skillup-web/src/app/api/student/placement/route.ts`** — Passes through data layer response unchanged
- **`apps/skillup-web/src/app/student/page.tsx`** — Uses dashboard API, not placement API
- **`apps/skillup-web/src/lib/skillup-api.ts`** — Generic fetch client, no placement-specific logic
- **`apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx`** — Tests dashboard aggregate count, not placement details

### Breaking Changes

**External API Contract:**
- `profile` field becomes nullable
- `interviewCount` field removed
- `match` field becomes nullable

**Risk:** Any external consumers (mobile apps, third-party integrations) expecting non-null profile will break.

**Mitigation:** This is a BFF (Backend-For-Frontend) API, not a public API. The only known consumer is the SkillUp web app itself, which does not render placement profile details in the current implementation.

---

## Null Handling Gaps

### Current Gaps

1. **Zero vector scores are floored to 1**
   - Location: `skillup-data.ts:388`
   - Current: `Math.max(1, Math.round((match.score ?? 0) * 100))`
   - Gap: Cannot distinguish "no score available" from "1% match"

2. **No profile returns fabricated data**
   - Location: `skillup-data.ts:365-372`
   - Current: Returns `FALLBACK_PLACEMENT.profile`
   - Gap: Cannot distinguish "no profile" from "actual profile with these values"

3. **Interview count is always present**
   - Location: `skillup-data.ts:369`
   - Current: Always calculates value from readinessScore
   - Gap: No way to represent "interview data unavailable"

### Authorized Fixes

All three gaps will be resolved by the approved FND13 corrections.

---

## Test Coverage

### Existing Coverage

| Scenario | Test File | Coverage |
|----------|-----------|----------|
| Zero vector score | `placement-zero-control.test.ts` | ✅ Flooring behavior |
| Vector service failure | `placement-http-truth.test.ts` | ✅ Fallback to DB ordering |
| No active profile | `placement-http-truth.test.ts` | ✅ FALLBACK_PLACEMENT return |
| Empty job listings | `placement-http-truth.test.ts` | ✅ Empty array handling |
| DB query failure | `placement-http-truth.test.ts` | ✅ Error propagation |
| HTTP route integration | `routes.test.ts` | ✅ 200 response structure |
| Dashboard aggregate count | `truth-pages.test.tsx` | ✅ "Open jobs" label |

### Missing Coverage

- `profile: null` scenario (will be added with implementation)
- `match: null` scenario (will be added with implementation)
- Nullable field handling in type system

---

## Dependencies

### Internal Dependencies

```
route.ts → getSkillupPlacement (skillup-data.ts)
           → @quiz/db-placement::studentPlacementProfiles
           → @quiz/db-placement::jobListings
           → @quiz/db-placement::findJobsForStudent
```

### External Service Dependencies

- **Vector matching service:** `findJobsForStudent` from `@quiz/db-placement`
  - May throw errors (caught and handled with fallback)
  - May return empty array (handled gracefully)
  - May return `{ score: 0 }` (currently floored to 1, will become null)

### Database Schema Dependencies

**Tables:**
- `student_placement_profiles` (from `@quiz/db-placement`)
  - Columns used: `userId`, `status`, `readinessScore`, `skills`, `preferredLocation`, `expectedCtc`, `experienceSummary`, `deletedAt`
- `job_listings` (from `@quiz/db-placement`)
  - Columns used: `id`, `companyName`, `title`, `location`, `ctcMin`, `ctcMax`, `deadline`, `status`, `deletedAt`, `createdAt`

---

## Manifest Validation

**Search Commands Used:**
```bash
graphify path "placement/route.ts" "skillup-data.ts"
graphify query "What files consume placement API route.ts response?"
grep "placement" apps/skillup-web/**/*.test.ts
grep "placementMatches" apps/skillup-web/**/*.tsx
grep "/api/student/placement" apps/skillup-web/**/*
grep "getSkillupPlacement" apps/skillup-web/**/*.{ts,tsx}
grep "SkillupJobMatch|profile.*placement" apps/skillup-web/**/*.ts
grep "roleGoal|resumeStatus|profileCompletion|interviewCount" apps/skillup-web/**/*.{ts,tsx}
```

**Files Read:**
- `apps/skillup-web/src/app/api/student/placement/route.ts`
- `apps/skillup-web/src/lib/skillup-data.ts`
- `apps/skillup-web/src/lib/skillup-types.ts`
- `apps/skillup-web/src/lib/skillup-api.ts`
- `apps/skillup-web/src/lib/__tests__/placement-zero-control.test.ts`
- `apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts`
- `apps/skillup-web/src/app/api/__tests__/routes.test.ts`
- `apps/skillup-web/src/app/student/page.tsx`
- `apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx`

**Verification:**
- ✅ All API route handlers identified
- ✅ All data layer functions traced
- ✅ All type definitions documented
- ✅ All test files covering placement enumerated
- ✅ All page components consuming placement fields listed
- ✅ No cross-app consumers found
- ✅ External service dependencies documented
- ✅ Database schema dependencies verified

---

## Conclusion

**Consumer Count:** 9 files total

**Implementation Scope:** 5 files require edits for FND13 truth corrections

**Breaking Change Risk:** Low — placement profile details are not rendered in any current UI component. Only the aggregate open job count (`placementMatches`) is displayed on the dashboard, which uses a separate API endpoint.

**Test Updates Required:** 3 test files need assertion updates to match new null-aware behavior.

**Ready for Implementation:** ✅ All consumers documented. Proceed with authorized corrections.
