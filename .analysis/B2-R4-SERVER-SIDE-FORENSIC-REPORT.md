# B.2-R-4 Server-Side Forensic Investigation — Final Report

**Investigation Date:** 2026-09-12  
**Phase Scope:** Phase 1-5 (Process topology, authentication, API capture, root-cause analysis)  
**Methodology:** Server-side only — no browser verification  

---

## Executive Summary

### RTH Finding: Contract-Inconsistent State Exposed at API Boundary

**API Classification:** `CONTRACT_INCONSISTENCY_CONFIRMED`

The RTH navigation API exposes:
- `completedBlockCount: 4`
- `totalBlockCount: 2`
- 4 completion references (all orphaned)
- 2 current blocks (both `completedAt: null`)
- 0 matching completions

**A contract-inconsistent state is exposed at the API boundary.** The observed response does not enforce or reconcile consistency between completion references and current published blocks.

### SkillUp Finding: Clean State with High Pace

**API Classification:** `API_CAPTURE_SUCCESS` + `NO_4_OVER_2_ANOMALY_IN_THIS_FIXTURE`

The SkillUp navigation API shows:
- `completedBlockCount: 0`
- `totalBlockCount: 2`
- 0 completion references
- 2 current blocks with high pace values (1646%, 158%)

**The previously reported 1096% pace issue is NOT reproduced** in this specific fixture. This does NOT prove the historical issue never existed.

---

## Classification Summary

### RTH
```
API_CAPTURE_SUCCESS
CONTRACT_INCONSISTENCY_CONFIRMED
completedBlockCount = 4
totalBlockCount = 2
orphanedCompletions = 4
matchingCompletions = 0
```

### SkillUp
```
API_CAPTURE_SUCCESS
NO_4_OVER_2_ANOMALY_IN_THIS_FIXTURE
completedBlockCount = 0
totalBlockCount = 2
orphanedCompletions = 0
```

---

## Phase 1: Process Topology

### Running Processes

| Service | Port | Listener PID | Parent Process | Status |
|---------|------|--------------|----------------|--------|
| API Server | 3000 | 27460 | pnpm (27136) | ✅ Running |
| RTH Web | 3003 | 21848 | pnpm (25760) / next (37684) | ✅ Running |
| SkillUp Web | 3009 | 16300 | pnpm (27524) / next (34824) | ✅ Restarted |
| Gateway | 8787 | 10176 | pnpm (28464) | ✅ Running |

**Process Relationship:**
- `pnpm` parent spawns `next dev` child
- `next dev` spawns `start-server.js` listener
- Port ownership verified via `Get-NetTCPConnection`

---

## Phase 2: Authentication Matrix

### Authentication Requirements

**Branded localhost domains required:**
- RTH: `http://realtutorialhub.localhost:3003`
- SkillUp: `http://skillup.localhost:3009`

Plain `localhost` causes `brand_unresolved` error.

**Authentication:**
- Authenticated read-only capture completed for both brands.
- Credentials were supplied through the local test configuration.
- No credentials, tokens, or cookie values are included in this report.

### Brand Resolution Chain

```
Client → BFF (branded hostname)
      ↓
resolveBrandFromHostname() reads Host header
      ↓
Sets x-brand header
      ↓
Forwards to API with brand context
```

**Code References:**
- `src/share-branding/auth/authBffRoute.ts`
- `packages/types/src/brand-resolution.ts` (lines 109-128)

---

## Phase 3: API Capture Results

### Endpoint Tested
```
GET /api/tutorial/ils/navigation/whatisjava?subtopicId=414f63eb-cccf-4bd1-bcc0-b52df69ce499
```

### RTH Response (2026-09-12T13:31:48Z)

**Response structure:**
```json
{
  "data": {
    "completedBlockCount": 4,
    "totalBlockCount": 2,
    "completedBlocks": [...],
    "blocks": [...]
  }
}
```

**Completion References (4 orphaned):**
1. `gate-3c1r-phase-d-block-le3-1789057672929-cbxbbt:D1` (2026-09-10T16:27:53Z)
2. `gate-3c1r-phase-d-block-le4-1789057673771-og3ccr:D1` (2026-09-10T16:27:54Z)
3. `gate-3c1r-phase-d-block-le7-1789057676750-8zifbx:D1` (2026-09-10T16:27:57Z)
4. `gate-3c1r-phase-d-completion-1789058906687-fjogsh:D1` (2026-09-10T16:48:29Z)

**Current Blocks (2, neither completed):**
1. `79ae6e0f-0374-4dfe-8d76-cefbe42f8996:D1`
   - activeTimeSec: 1086, expectedTimeSec: 180
   - pace: 603.33%
   - completedAt: null

2. `fb6b1e9d-3fe2-48f5-891e-73f8e22797b9:C1`
   - activeTimeSec: 100, expectedTimeSec: 300
   - pace: 33.33%
   - completedAt: null

**Identity Matching:**
- Completion references: 4
- Current blocks: 2
- Matching completions: 0
- Orphaned completions: 4

### SkillUp Response (2026-09-12T13:31:48Z)

**Completion References:** 0 (none)

**Current Blocks (2, neither completed):**
1. `79ae6e0f-0374-4dfe-8d76-cefbe42f8996:D1`
   - activeTimeSec: 2964, expectedTimeSec: 180
   - pace: 1646.67%
   - completedAt: null

2. `fb6b1e9d-3fe2-48f5-891e-73f8e22797b9:C1`
   - activeTimeSec: 473, expectedTimeSec: 300
   - pace: 157.67%
   - completedAt: null

**Identity Matching:**
- Completion references: 0
- Current blocks: 2
- Matching completions: 0
- Orphaned completions: 0

---

## Phase 4: SkillUp 404 Investigation

### Initial Symptom
SkillUp navigation endpoint returned HTML 404 page (Next.js not found page).

### Evidence
- Endpoint returned: `text/html; charset=utf-8` with title "404: This page could not be found"
- Route file exists in source: `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts`
- Other ILS routes (`/visit`, `/block-visit`, `/complete-node`) returned JSON responses

### Resolution Timeline
After restarting SkillUp dev server (`pnpm --filter @quiz/skillup-web dev` with 120s startup wait), the same endpoint returned HTTP 200 with valid JSON.

### Assessment
**Strong correlation observed:** Restart preceded successful response.

**Caveat:** No before/after build manifest or compiled route evidence was captured. The restart clearly preceded success, but the specific build-state root cause is not definitively proven by this investigation.

---

## Phase 5: Root-Cause Analysis

### RTH: Working Hypothesis

**Most likely explanation:** Content migration without progress reconciliation.

**Pattern evidence:**
- Orphaned IDs: `gate-3c1r-phase-d-*` (old naming convention)
- Current IDs: UUID format (new convention)
- Zero identity matches between old and new

**Plausible scenario:**
1. Old content had multiple blocks with `gate-3c1r` structure
2. Content was replaced with new 2-block structure using UUIDs
3. User progress retained old completion references
4. No reconciliation or migration was performed
5. API exposes raw historical state without filtering

**Observed behavior:**
The observed response does not enforce or reconcile consistency between completion references and current published blocks.

### SkillUp: No 4/2 Anomaly in This Fixture

This specific test fixture has:
- Zero completion references
- Clean progress state
- High pace values (1646%, 158%)

**Important:** The absence of 4/2 anomaly in this fixture does NOT prove:
- The 1096% issue never existed
- No other SkillUp users have orphaned completions
- The issue is RTH-specific

---

## Unresolved Questions

### Outside Server-Side Scope

1. **UI/RSSB propagation:** Does RSSB receive raw API response or transformed data?
2. **RSSB filtering:** Does RSSB filter orphaned completions at render time?
3. **RSSB calculations:** What is the exact RSSB pace calculation formula?
4. **UI display:** Does the UI display 4/2 or filtered state?

### Historical Issues

1. **1096% pace:** Which user/fixture/node exhibited this value?
2. **Reproducibility:** Is it reproducible with current data?
3. **SkillUp orphans:** Do other SkillUp fixtures have orphaned completions?

### Policy Decisions Required

1. Should API preserve raw historical state (current behavior)?
2. Should API filter orphaned completions (defensive approach)?
3. Should API reject impossible states with validation errors?
4. Should historical completions be tracked separately?

---

## Evidence Artifacts

### Scripts
- `scripts/.tmp-b2r4-working-api-capture.mjs` (corrected parser)
- `scripts/.tmp-b2r4-skillup-404-investigation.mjs`
- `scripts/.tmp-test-skillup-ils-routes.mjs`

### Data
- `.analysis/b2r4-api-capture-2026-09-12T13-31-48.json` (final capture)
- Raw JSON path: `results[].apiData.data`

### Parser Implementation
Corrected parser reads:
```javascript
const payload = result.apiData?.data;
const completedCount = payload.completedBlockCount;
const totalCount = payload.totalBlockCount;
const identity = `${block.blockId}:${block.blockVersion}`;
```

---

## Remediation Considerations (NOT IMPLEMENTED)

**No remediation was selected or implemented during this investigation.**

### Options for Future Consideration

1. **Database cleanup:** Destructive, loses historical data
2. **DTO filtering:** Could hide rather than reconcile orphaned data — NOT RECOMMENDED without explicit policy
3. **Migration/reconciliation:** Complex, requires content version history
4. **Separate historical field:** Requires API contract change and frontend updates

**Critical constraint:** Orphaned historical completion records must NOT be silently discarded without:
- Explicit data-contract policy decision
- User notification or migration plan
- Approval from product and engineering leadership

---

## Investigation Status

### COMPLETE — Server-Side Evidence Collected

**CONFIRMED:**
- ✅ RTH API exposes a contract-inconsistent 4/2 state
- ✅ All four RTH completion references are orphaned relative to the two current blocks
- ✅ SkillUp's tested fixture exposes 0/2 and no orphaned completions
- ✅ Both branded authentication and navigation API requests succeeded
- ✅ No database mutations or remediation changes were performed

**NOT CONFIRMED:**
- ❌ The definitive cause of the historical RTH state
- ❌ The definitive cause of the temporary SkillUp 404
- ❌ Reproduction of the historical SkillUp 1096% issue
- ❌ UI/RSSB propagation or rendering behavior

**NOT IMPLEMENTED:**
- ❌ No database modifications
- ❌ No DTO filtering
- ❌ No migration logic
- ❌ No code changes
- ❌ No production data cleanup

---

## Gate Decision

### BLOCKED FOR RELEASE CERTIFICATION

**REASON:**  
The RTH API contract inconsistency remains unresolved, and no data-contract or reconciliation policy has been approved.

**What This Investigation Achieved:**
- Identified the contract violation at the API boundary
- Documented exact orphaned completion references
- Verified clean SkillUp fixture state
- Established authentication requirements
- Provided working API capture methodology

**What Remains Unverified:**
- UI/RSSB propagation is outside the scope of this server-side investigation and is not certified
- Production impact assessment
- Data reconciliation approach
- Remediation implementation

---

## Timeline

| Time | Event |
|------|-------|
| 12:35 | Authentication matrix complete |
| 12:37 | RTH capture — 4/2 contract inconsistency exposed |
| 12:37 | SkillUp capture — 404 error |
| 13:02 | SkillUp 404 investigation |
| 13:12 | SkillUp dev server restarted |
| 13:14 | SkillUp capture — clean state confirmed |
| 13:31 | Corrected parser, final capture with accurate console output |
| 13:35 | Report finalized |

---

## Appendix: Response Structure

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

---

**Report Status:** ✅ COMPLETE — Server-side investigation finished  
**Gate Status:** 🔴 BLOCKED FOR CERTIFICATION — RTH contract inconsistency unresolved  
**Scope Boundary:** UI/RSSB behavior remains outside server-side investigation scope
