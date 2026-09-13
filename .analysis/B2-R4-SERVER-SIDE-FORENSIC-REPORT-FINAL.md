# B.2-R-4 Server-Side Forensic Investigation Report

**Investigation Date:** 2026-09-12  
**Phase Scope:** Phase 1-5 (Process topology, authentication, API capture, root-cause analysis)  
**Methodology:** Server-side only — no browser verification  
**Status:** ✅ **COMPLETE** — Both brands verified

---

## Executive Summary

### RTH Finding: 4/2 Anomaly CONFIRMED at API Layer

The RTH navigation API exposes a contract-inconsistent state:
- `completedBlockCount: 4`
- `totalBlockCount: 2`
- All 4 completed block references are orphaned (do not match current block identities)
- Both current blocks have `completedAt: null`

**This is NOT a frontend-only issue.** The API boundary returns mathematically impossible completion state.

### SkillUp Finding: Clean State, High Pace Values

The SkillUp navigation API shows:
- `completedBlockCount: 0`
- `totalBlockCount: 2`
- No orphaned completions
- High pace values: D1 = 1646%, C1 = 158%

**The 1096% pace issue is not reproduced** in the current API capture for the test user.

---

## Phase 1: Process Topology

### Running Processes (Verified)

| Service | Port | PID | Brand | Status |
|---------|------|-----|-------|--------|
| API Server | 3000 | 27172 | Shared | ✅ Running |
| RTH Web (BFF) | 3003 | 37684 | realtutorialhub | ✅ Running |
| SkillUp Web (BFF) | 3009 | 34824 → 16300 | skillup | ✅ Running (restarted) |
| Gateway | 8787 | 10176 | N/A | ✅ Running |

### Authentication Requirements

**Critical Discovery:** Brand resolution requires **branded localhost domains**:
- RTH: `http://realtutorialhub.localhost:3003`
- SkillUp: `http://skillup.localhost:3009`

Plain `localhost` returns `brand_unresolved` error.

**Brand Resolution Chain:**
```
Client Request → BFF (branded hostname)
              ↓
resolveBrandFromHostname() reads hostname
              ↓
Sets x-brand header
              ↓
Forwards to API with brand context
              ↓
API queries user progress for brand
```

**Code References:**
- `src/share-branding/auth/authBffRoute.ts` → `createForwardHeaders()`
- `packages/types/src/brand-resolution.ts` (lines 109-128) → supports `*.localhost` domains
- `services/api-gateway/src/lib/request-brand.ts` → `resolveTrustedRequestBrand()`

---

## Phase 2: Authentication Matrix

### Test Results

| Target | URL | Credentials | Result |
|--------|-----|-------------|--------|
| RTH BFF | realtutorialhub.localhost:3003 | ajayshah@gmail.com | ✅ 200 |
| SkillUp BFF | skillup.localhost:3009 | student@skillupitacademy.com | ✅ 200 |
| RTH (plain localhost) | localhost:3003 | (any) | ❌ brand_unresolved |

**Working Pattern** (from `scripts/save-tutorial-html.mjs`):
```javascript
fetch('http://skillup.localhost:3009/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@skillupitacademy.com',
    password: 'testing',
    platform: 'skillup'
  })
})
```

---

## Phase 3: Navigation API Capture

### Execution Details

- **Script:** `scripts/.tmp-b2r4-working-api-capture.mjs`
- **Method:** Cookie-based authentication
- **Endpoint:** `GET /api/tutorial/ils/navigation/whatisjava?subtopicId=414f63eb-cccf-4bd1-bcc0-b52df69ce499`
- **Timestamp:** 2026-09-12T13:14:03Z

### RTH API Response ✅

**Response Structure:**
```json
{
  "data": {
    "completedBlockCount": 4,
    "totalBlockCount": 2,
    "completedBlocks": [
      { "blockId": "gate-3c1r-phase-d-block-le3-...", "blockVersion": "D1", ... },
      { "blockId": "gate-3c1r-phase-d-block-le4-...", "blockVersion": "D1", ... },
      { "blockId": "gate-3c1r-phase-d-block-le7-...", "blockVersion": "D1", ... },
      { "blockId": "gate-3c1r-phase-d-completion-...", "blockVersion": "D1", ... }
    ],
    "blocks": [
      { "blockId": "79ae6e0f-0374-4dfe-8d76-cefbe42f8996", "blockVersion": "D1", "completedAt": null, ... },
      { "blockId": "fb6b1e9d-3fe2-48f5-891e-73f8e22797b9", "blockVersion": "C1", "completedAt": null, ... }
    ]
  }
}
```

**Completion References (4):**
1. `gate-3c1r-phase-d-block-le3-1789057672929-cbxbbt:D1` (completed 2026-09-10T16:27:53Z)
2. `gate-3c1r-phase-d-block-le4-1789057673771-og3ccr:D1` (completed 2026-09-10T16:27:54Z)
3. `gate-3c1r-phase-d-block-le7-1789057676750-8zifbx:D1` (completed 2026-09-10T16:27:57Z)
4. `gate-3c1r-phase-d-completion-1789058906687-fjogsh:D1` (completed 2026-09-10T16:48:29Z)

**Current Blocks (2):**
1. `79ae6e0f-0374-4dfe-8d76-cefbe42f8996:D1`
   - visitCount: 4
   - activeTimeSec: 1086
   - expectedTimeSec: 180
   - **pace: 604%**
   - completedAt: null

2. `fb6b1e9d-3fe2-48f5-891e-73f8e22797b9:C1`
   - visitCount: 4
   - activeTimeSec: 100
   - expectedTimeSec: 300
   - **pace: 33%**
   - completedAt: null

**Identity Matching:**
- **Matching completions:** 0
- **Orphaned completions:** 4 (all references)
- **Pattern:** Orphaned IDs follow `gate-3c1r-phase-d-*` naming (old content structure)
- **Current IDs:** UUID format (new content structure)

### SkillUp API Response ✅

**Response Structure:**
```json
{
  "data": {
    "completedBlockCount": 0,
    "totalBlockCount": 2,
    "completedBlocks": [],
    "blocks": [
      { "blockId": "79ae6e0f-0374-4dfe-8d76-cefbe42f8996", "blockVersion": "D1", "completedAt": null, ... },
      { "blockId": "fb6b1e9d-3fe2-48f5-891e-73f8e22797b9", "blockVersion": "C1", "completedAt": null, ... }
    ]
  }
}
```

**Completion References:** 0 (none)

**Current Blocks (2):**
1. `79ae6e0f-0374-4dfe-8d76-cefbe42f8996:D1`
   - visitCount: 9
   - activeTimeSec: 2964
   - expectedTimeSec: 180
   - **pace: 1646%**
   - completedAt: null

2. `fb6b1e9d-3fe2-48f5-891e-73f8e22797b9:C1`
   - visitCount: 6
   - activeTimeSec: 473
   - expectedTimeSec: 300
   - **pace: 158%**
   - completedAt: null

**Identity Matching:**
- **Matching completions:** N/A (no completions)
- **Orphaned completions:** 0
- **State:** Clean (no historical completion references)

---

## Phase 4: SkillUp 404 Investigation

### Initial Problem

SkillUp navigation endpoint returned HTTP 404 (HTML page) despite route file existing in source.

### Root Cause

**Stale Next.js build:** The navigation route existed in source code but was NOT compiled into the running dev server build.

**Evidence:**
- Route file exists: `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts`
- Build directory missing route: `apps/skillup-web/.next/dev/server/app/api/tutorial/ils/` contained only 3/8 routes
- Other ILS routes returned JSON responses (routes existed in build)
- Navigation route returned HTML 404 page (route missing from build)

**Resolution:**
1. Stopped SkillUp dev server (PID 27524/34824)
2. Restarted with: `pnpm --filter @quiz/skillup-web dev`
3. Wait 120 seconds for full compilation
4. Navigation endpoint now returns valid JSON response

**Diagnostic Commands Used:**
```powershell
# Check which routes exist in running build
Get-ChildItem "apps\skillup-web\.next\dev\server\app\api\tutorial\ils" -Recurse

# Test route availability
node scripts/.tmp-test-skillup-ils-routes.mjs
```

---

## Phase 5: Root-Cause Analysis

### RTH: Contract-Inconsistent Completion State

**Proven Facts:**
1. API exposes `completedBlockCount (4) > totalBlockCount (2)`
2. All 4 completion references are orphaned when matched by `blockId + blockVersion`
3. Current blocks are not completed (both `completedAt: null`)
4. Orphaned IDs follow old content pattern (`gate-3c1r-phase-d-*`)
5. Current IDs follow new content pattern (UUID)

**Likely Cause:**
Content migration without progress reconciliation:
- Old content had 4+ blocks with gate-3c1r structure
- New content has 2 blocks with UUID identifiers
- User progress still references old block IDs
- No migration/cleanup was performed
- API exposes raw orphaned state without filtering

**Data Contract Violation:**
The API `toDTO()` transformation permits mathematically impossible state:
```typescript
{
  completedBlocks: [4 items],
  totalBlockCount: 2
}
```

This indicates missing defensive validation or filtering logic.

### SkillUp: Clean State with High Pace

**Proven Facts:**
1. No completion references (clean state)
2. High pace values present: 1646% and 158%
3. No 4/2 anomaly
4. No orphaned completions

**Previously Reported 1096% Pace:**
Not reproduced in current API capture. Possible explanations:
- Different user account
- Different navigation node
- Different time window
- Historical snapshot vs. current state
- Display calculation issue vs. API data issue

**Pace Calculation:**
- D1: 2964s / 180s = 1646%
- C1: 473s / 300s = 158%

Both blocks have valid `expectedTimeSec` values. The pace is high but mathematically consistent with the API data.

---

## Evidence Artifacts

### Scripts Created
- `scripts/.tmp-b2r4-working-api-capture.mjs` — Live API capture
- `scripts/.tmp-b2r4-skillup-404-investigation.mjs` — 404 diagnostic
- `scripts/.tmp-test-skillup-ils-routes.mjs` — Route availability test

### Data Captured
- `.analysis/b2r4-api-capture-2026-09-12T12-37-08.json` — Initial capture (SkillUp 404)
- `.analysis/b2r4-api-capture-2026-09-12T13-14-03.json` — Final capture (both brands success)
- `.analysis/b2r4-skillup-404-investigation-*.json` — 404 metadata

### Key Code References
- `packages/types/src/brand-resolution.ts` (lines 109-128) — Branded domain support
- `src/share-branding/auth/authBffRoute.ts` — `resolveBrandFromHostname()`
- `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` — BFF proxy
- `apps/realtutorialhub-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` — BFF proxy

---

## Remediation Options (Not Implemented)

### Option 1: Database Cleanup (Destructive)
Delete orphaned completion references from user progress records.

**Pros:** Clean state, removes contract-inconsistent data  
**Cons:** Loses historical learning data, irreversible

### Option 2: DTO Filtering (Defensive)
Filter orphaned completion references in API `toDTO()` transformation before returning response.

```typescript
// Pseudo-code
const currentIdentities = new Set(
  currentBlocks.map(b => `${b.id}:${b.version}`)
);

const filteredCompletions = completedBlocks.filter(cb => 
  currentIdentities.has(`${cb.blockId}:${cb.blockVersion}`)
);

return {
  ...dto,
  completedBlocks: filteredCompletions,
  completedBlockCount: filteredCompletions.length
};
```

**Pros:** Preserves database, fixes API contract, non-destructive  
**Cons:** Silent data discrepancy, may hide other issues, filters rather than reconciles

### Option 3: Migration/Reconciliation
Map old block IDs to new block IDs using content version history.

**Pros:** Preserves learning continuity, maintains historical accuracy  
**Cons:** Complex, requires content history tracking, migration logic

### Option 4: Separate Historical Completions
Preserve orphaned completions in separate field for historical reference.

```typescript
return {
  ...dto,
  completedBlocks: matchingCompletions,
  historicalCompletions: orphanedCompletions,
  completedBlockCount: matchingCompletions.length
};
```

**Pros:** Full transparency, preserves data, clear contract  
**Cons:** API contract change, requires frontend updates

---

## Outstanding Questions

### Browser/RSSB Verification Pending

**Out of scope** for this server-side forensic phase, but required for complete certification:

1. Does RSSB display 4/2 or filtered state?
2. Does RSSB receive the raw API response or transformed data?
3. What is the exact pace calculation formula in RSSB?
4. Are orphaned blocks filtered at render time?
5. Is the 1096% pace issue reproducible in browser for specific users/nodes?

### Data Contract Policy

Decision required:
1. Should the API preserve raw historical state (current behavior)?
2. Should the API filter orphaned completions (defensive)?
3. Should the API reject impossible states with validation errors?
4. Should historical completions be tracked separately?

---

## Gate Status Assessment

### Final Status: ✅ **PASS (Phase 1-5)**

**Completed:**
- ✅ RTH authenticated navigation API verified
- ✅ SkillUp authenticated navigation API verified
- ✅ RTH 4/2 anomaly confirmed at API boundary
- ✅ All orphaned completions identified
- ✅ SkillUp clean state confirmed
- ✅ Brand resolution requirements documented
- ✅ Authentication pattern established
- ✅ Process topology verified
- ✅ SkillUp 404 root cause identified and resolved

**Key Findings:**
1. **RTH exposes contract-inconsistent state** — 4 completions, 2 total blocks
2. **SkillUp shows clean state** — 0 completions, 2 total blocks
3. **High pace values exist in both brands** — not correlated with 4/2 anomaly
4. **Orphaned completions are from content migration** — old `gate-3c1r-*` IDs vs. new UUID IDs
5. **Brand resolution requires branded domains** — critical for BFF authentication

**Pending (Out of Phase 1-5 Scope):**
- Browser/RSSB verification
- Live rendered pace values vs. API values
- Remediation decision and implementation
- Production data cleanup strategy
- 1096% pace issue reproduction

---

## Recommendations

### Immediate Actions

1. **Document the RTH 4/2 anomaly** as a known data-integrity issue
2. **Do NOT implement remediation** until browser verification is complete
3. **Verify the complete data flow:** Database → API → ILSProvider → RSSB
4. **Test remediation options** on a disposable database first

### Investigation Continuation

To proceed beyond Phase 5:

**Phase 6: Browser Verification**
1. Open RTH in browser with affected user
2. Inspect RSSB component state via React DevTools
3. Compare API response vs. rendered state
4. Verify pace calculation formula
5. Check if filtering occurs at render time

**Phase 7: Remediation Design**
1. Define data contract policy
2. Choose remediation approach (filtering, migration, or separation)
3. Design migration plan if needed
4. Create test plan for chosen approach

**Phase 8: Implementation**
1. Implement chosen remediation
2. Test on disposable database
3. Verify API contract consistency
4. Update frontend if needed
5. Deploy to production with monitoring

---

## Investigator Notes

### What Worked

1. **Using existing working scripts** (`save-tutorial-html.mjs`) instead of debugging custom implementations saved significant time
2. **Server-side investigation** provided definitive evidence without browser complexity
3. **Process verification** (PIDs, ports, builds) identified the SkillUp stale build issue
4. **Systematic route testing** quickly isolated missing routes in compiled build

### Critical Discovery

The **branded localhost domain requirement** was the key authentication blocker. This is documented in code but not obvious from API testing.

### SkillUp 404 Resolution

The stale build issue demonstrates that Next.js dev mode can silently fail to compile routes. The symptom (HTML 404 page vs. JSON error) was diagnostic - HTML 404 means "route not found in app", JSON error means "route found, handler failed".

---

## Appendix A: Test Credentials

### RTH
- Email: `ajayshah@gmail.com`
- Password: `testing`
- Platform: `realtutorialhub`
- Test User: Has orphaned completions

### SkillUp
- Email: `student@skillupitacademy.com`
- Password: `testing`
- Platform: `skillup`
- Test User: Clean state, no orphaned completions

---

## Appendix B: Timeline

| Time | Event |
|------|-------|
| 12:35 | Authentication matrix complete |
| 12:37 | RTH API capture SUCCESS — 4/2 anomaly confirmed |
| 12:37 | SkillUp API capture FAILED — 404 on navigation endpoint |
| 12:40 | Draft forensic report created |
| 13:02 | SkillUp 404 investigation — identified stale build |
| 13:12 | SkillUp dev server restarted |
| 13:14 | SkillUp API capture SUCCESS — clean state confirmed |
| 13:15 | Final forensic report complete |

---

## Appendix C: API Response Shape

**Both brands return identical structure:**
```typescript
{
  data: {
    navigationNodeId: string;
    sectionId: string;
    subtopicId: string;
    status: "not_started" | "in_progress" | "completed";
    progressPercentage: number;
    completedBlocks: Array<{
      blockId: string;
      blockVersion: string;
      completedAt: string;
    }>;
    completedBlockCount: number;
    totalBlockCount: number;
    requiredBlocks: Array<{
      blockId: string;
      blockVersion: string;
    }>;
    blocks: Array<{
      blockId: string;
      blockVersion: string;
      visitCount: number;
      revisionCount: number;
      activeTimeSec: number;
      expectedTimeSec: number;
      firstViewedAt: string | null;
      lastViewedAt: string | null;
      completedAt: string | null;
    }>;
    timeSpentActiveSec: number;
    visitCount: number;
    revisionCount: number;
    firstViewedAt: string;
    lastViewedAt: string;
    completedAt: string | null;
  }
}
```

**Note:** Response is wrapped in `{ data: {...} }`, not bare object.

---

**Report Status:** ✅ **COMPLETE**  
**Phase 1-5:** All objectives met  
**Certification:** Ready for Phase 6 (Browser Verification)
