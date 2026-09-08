# GATE 3C.1: UNIVERSAL BLOCK TELEMETRY & CONTRACT AUDIT

**Date:** 2026-09-08  
**Purpose:** Verify block telemetry is generic before freezing ILSActiveBlockProgress contract  
**Status:** PRE-IMPLEMENTATION AUDIT

---

## 🎯 AUDIT OBJECTIVE

**DO NOT freeze the `ILSActiveBlockProgress` contract yet.**

Before proceeding to implementation, verify that the existing block-level telemetry infrastructure is **genuinely universal** and that D1/C1 are not special-cased.

**Core Question:**
> Is the existing block-learning-state implementation already the correct generic contract that every future block can automatically participate in, or are D1/C1 currently relying on block-specific integration that must be generalized before LSNB/RSSB/Composer integration?

**Why This Matters:**

The goal is NOT merely "make RSSB work for D1/C1."

The goal is:
> **Make D1/C1 the first consumers of a generic block contract that future blocks (I1, O1, S1, X1, etc.) automatically inherit without new telemetry code.**

---

## 🏗️ TARGET ARCHITECTURE

### Desired Universal Flow

```text
                    TUTORIAL COMPOSER
                           │
                    TutorialDocument
                           │
                       blocks[]
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
         D1               C1            Future I1/O1/S1/X1
          │                │                │
          └────────────────┼────────────────┘
                           │
                      UBRC Contract
                    (generic identity)
                           │
                           ▼
                  Universal ILS Runtime
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
            LSNB                       RSSB
       navigation/state          block metrics
```

### Universal Block Identity

```text
navigationNodeId
+
blockId
+
blockVersion
+
blockType
```

**Preserved throughout:**
- Composer → TutorialDocument
- DOM rendering
- ActiveBlockContext
- ILS telemetry
- block_learning_state persistence
- Navigation API
- ILSProvider
- RSSB/LSNB

---

## 📋 AUDIT CHECKLIST

### ✅ AUDIT 1: Block Telemetry Producer Path (CRITICAL)

**Objective:** Verify nothing in the telemetry chain is D1-specific or C1-specific

**Trace Complete Path:**
```text
Block enters viewport
       ↓
ActiveBlockContext identifies block
       ↓
ILS tracking triggered
       ↓
recordBlockVisit()
       ↓
recordBlockActiveTime()
       ↓
recordBlockCompletion()
       ↓
BlockLearningStateRepository
       ↓
block_learning_state
```

**Questions:**

1. **Does ActiveBlockContext use generic block identity?**
   - [ ] Uses `data-block-id`, `data-block-type`, `data-block-version` attributes?
   - [ ] NOT D1-specific selectors?
   - [ ] NOT C1-specific DOM queries?

2. **Are telemetry methods generic?**
   - [ ] `recordBlockVisit(identity, navigationNodeId, blockId, blockVersion, ...)`?
   - [ ] NOT `recordD1Visit()`?
   - [ ] NOT `recordC1Visit()`?
   - [ ] NOT block-type switch statements?

3. **Does repository use generic identity?**
   - [ ] Upsert by `(userId, navigationNodeId, blockId, blockVersion)`?
   - [ ] NOT hardcoded D1/C1 values?

**Expected Evidence:**
```typescript
// ✅ GOOD (Generic)
recordBlockVisit({
  navigationNodeId,
  blockId,
  blockType,
  blockVersion,
  sessionId
});

// ❌ BAD (Block-specific)
if (blockType === 'definition') {
  recordD1Visit(...);
} else if (blockType === 'code') {
  recordC1Visit(...);
}
```

**Investigation Steps:**
1. Read `LearningProgressService` - all public methods
2. Read `BlockLearningStateRepository` - all public methods
3. Search codebase for `blockType === 'definition'` or `blockType === 'code'`
4. Verify no switch statements on blockType in telemetry layer

---

### ✅ AUDIT 2: Metric Producer Matrix

**Objective:** Verify every required metric has a generic producer

| Metric | DB Field | Write Method | Generic? | Evidence | Status |
|--------|----------|--------------|----------|----------|--------|
| **visitCount** | `visit_count` | ? | ? | ? | ⚠️ |
| **revisionCount** | `revision_count` | ? | ? | ? | ⚠️ |
| **activeTimeSec** | `active_time_sec` | `recordBlockActiveTime()` | ✅? | Runtime logs show upsert | ⚠️ |
| **expectedTimeSec** | `expected_time_sec` | ? | ? | ? | ⚠️ |
| **firstViewedAt** | `first_viewed_at` | ? | ? | ? | ⚠️ |
| **lastViewedAt** | `last_viewed_at` | ? | ✅? | Upsert updates timestamp | ⚠️ |
| **completedAt** | `completed_at` | ? | ? | ? | ⚠️ |
| **isCompleted** | derived | ? | ? | `completedAt !== null`? | ⚠️ |

**For Each Metric, Verify:**

1. **Write method exists**
2. **Write method is generic** (not block-specific)
3. **Write method is called by runtime** (not manually per block)
4. **Database field is populated correctly**

**Investigation Steps:**
1. Read `LearningProgressService` implementation
2. Find all methods that write to `block_learning_state`
3. Trace how each metric is initialized
4. Trace how each metric is updated
5. Verify no D1/C1 hardcoding

---

### ✅ AUDIT 3: Expected Time Origin (CRITICAL)

**Objective:** Verify expected time comes from block definition, not hardcoded

**Anti-Pattern to Reject:**
```typescript
// ❌ BAD
const BLOCK_EXPECTED_TIMES = {
  'D1': 300,
  'C1': 240,
  'S1': 180,
};
```

**Desired Pattern:**
```text
Block Definition (authored content)
       ↓
TutorialDocument.blocks[].expectedTimeSec
       ↓
Block metadata passed to ILS
       ↓
BlockLearningStateRepository
       ↓
block_learning_state.expected_time_sec
```

**Questions:**

1. **Where does expectedTimeSec originate?**
   - [ ] Block definition metadata?
   - [ ] TutorialDocument schema?
   - [ ] Hardcoded per block type?
   - [ ] Authored by content creator?

2. **How is it propagated to ILS?**
   - [ ] Via block runtime context?
   - [ ] Via service method parameter?
   - [ ] Via repository upsert?

3. **Is it nullable?**
   - [ ] Yes (some blocks may not have expected time)?
   - [ ] No (required for all blocks)?

**Investigation Steps:**
1. Search for `expectedTimeSec` or `expected_time_sec` in codebase
2. Find where it's first set/initialized
3. Verify it comes from block content/metadata
4. Verify ILS receives it generically

---

### ✅ AUDIT 4: Block Identity Contract

**Objective:** Verify canonical identity is preserved end-to-end

**Canonical Block Identity:**
```typescript
{
  blockId: string;        // UUID
  blockType: string;      // 'definition', 'code', 'summary', etc.
  blockVersion: string;   // 'D1', 'C1', 'S1', etc.
}
```

**Identity Flow to Verify:**
```text
1. Composer assembles TutorialDocument
       ↓
   block.id, block.type, block.version

2. Block rendered to DOM
       ↓
   data-block-id, data-block-type, data-block-version

3. ActiveBlockContext reads DOM
       ↓
   { blockId, blockType, blockVersion }

4. ILS receives identity
       ↓
   navigationNodeId + blockId + blockVersion

5. Database persists
       ↓
   block_learning_state (navigation_node_id, block_id, block_version)

6. Navigation API reads
       ↓
   blocks[].blockId, blocks[].blockVersion

7. ILSProvider resolves
       ↓
   activeBlockProgress.blockId, activeBlockProgress.blockVersion

8. RSSB displays
       ↓
   Metrics for active block
```

**Questions:**

1. **Is blockId stable?**
   - [ ] Same block = same blockId?
   - [ ] NOT generated per session?
   - [ ] NOT generated per render?

2. **Is blockVersion required?**
   - [ ] Database unique constraint includes it?
   - [ ] ActiveBlockContext captures it?
   - [ ] ILS matching uses it?

3. **Is blockType metadata or identity?**
   - [ ] Used for display only?
   - [ ] Used for database lookup?
   - [ ] Part of unique constraint?

**Investigation Steps:**
1. Read `ActiveBlockContext.tsx` - identity extraction
2. Read block rendering - DOM attribute setting
3. Read `block_learning_state` schema - unique constraint
4. Read repository methods - identity parameters
5. Verify no ID translation/mapping

---

### ✅ AUDIT 5: Completion Semantics

**Objective:** Verify completion is centrally defined, not duplicated

**Proposed Contract:**
```typescript
completedAt: Date | null;
isCompleted: boolean;  // Derived from completedAt !== null
```

**Questions:**

1. **Is completion recorded centrally?**
   - [ ] Via `recordBlockCompletion()` or similar?
   - [ ] Via `LearningProgressService` method?
   - [ ] NOT per-block logic?

2. **Is isCompleted derived?**
   - [ ] `isCompleted = completedAt !== null`?
   - [ ] NOT stored separately in database?
   - [ ] NOT block-specific calculation?

3. **What triggers completion?**
   - [ ] Explicit API call?
   - [ ] Scroll to end?
   - [ ] Time threshold?
   - [ ] Block-specific logic?

**Investigation Steps:**
1. Search for `recordBlockCompletion` or `completeBlock`
2. Read implementation
3. Verify no block-type conditionals
4. Check if `isCompleted` is database field or derived

**Expected:**
```typescript
// Database
completed_at: timestamp | null

// Public contract (ILSProvider)
isCompleted: boolean = completedAt !== null
```

---

### ✅ AUDIT 6: Revision Semantics

**Objective:** Verify revision logic is centralized and session-aware

**Current Understanding:**
- Phase 4.6 uses session identity for atomic visit/revision decisions
- NOT time-based heuristic
- Implemented in repository/service layer

**Questions:**

1. **How is revisionCount determined?**
   - [ ] Session-aware logic in repository?
   - [ ] Compared to completedAt?
   - [ ] Atomic increment logic?

2. **Definition frozen?**
   - [ ] Clear semantic: "return visits after first completion"?
   - [ ] OR "return visits after any completion"?
   - [ ] OR different definition?

3. **Is logic centralized?**
   - [ ] In `BlockLearningStateRepository`?
   - [ ] In `LearningProgressService`?
   - [ ] NOT in block components?

**Investigation Steps:**
1. Read `revision_count` logic in repository
2. Find where it's incremented
3. Verify session-based decision
4. Confirm no block-specific branching

---

### ✅ AUDIT 7: Active Time Semantics

**Objective:** Verify active time is universal, not per-block

**Evidence So Far:**
- ✅ Runtime logs show `recordBlockActiveTime()` executing
- ✅ `active_time_sec` being updated in `block_learning_state`
- ✅ Phase 4.6 has 600-second limit per tracking operation

**Questions:**

1. **Is active time tracked universally?**
   - [ ] `LearningProgressService.recordBlockActiveTime()`?
   - [ ] Same logic for all block types?
   - [ ] NOT D1-specific timer?
   - [ ] NOT C1-specific timer?

2. **How is active time triggered?**
   - [ ] IntersectionObserver?
   - [ ] ActiveBlockContext?
   - [ ] Automatic for any block?

3. **Is the 600s limit universal?**
   - [ ] Applied to all blocks?
   - [ ] NOT block-type dependent?

**Investigation Steps:**
1. Read `recordBlockActiveTime()` implementation
2. Find caller (likely BlockTelemetryProvider)
3. Verify no block-type conditionals
4. Confirm 600s limit is universal constant

**Expected Flow:**
```text
D1/C1/I1/O1/S1/X1
       ↓
ActiveBlockContext (universal)
       ↓
BlockTelemetryProvider (universal)
       ↓
recordBlockActiveTime() (universal)
       ↓
block_learning_state (universal table)
```

---

### ✅ AUDIT 8: Read Path Gap

**Objective:** Confirm write path is universal, read path needs enhancement

**Known:**
- ✅ Write path exists and works (metrics being recorded)
- ❌ Read path incomplete (metrics not exposed via API)

**Questions:**

1. **Does repository have read method?**
   - [ ] `getBlockState(userId, navigationNodeId, blockId, blockVersion)`?
   - [ ] `getBlockStatesForNode(userId, navigationNodeId)`?
   - [ ] Some other method?

2. **Is it used anywhere?**
   - [ ] Currently called by any service?
   - [ ] Currently called by any API?
   - [ ] Exists but unused?

3. **Can it be reused?**
   - [ ] Returns all required fields?
   - [ ] Handles multiple blocks?
   - [ ] Respects soft deletes?

**Investigation Steps:**
1. List all methods in `BlockLearningStateRepository`
2. Find read/query methods
3. Check if used by `getNavigationProgress()`
4. Determine if suitable for Gate 3C needs

**Expected Outcome:**
- **IF** read method exists → Reuse it
- **IF** read method partial → Extend minimally
- **IF** no read method → Create minimal one

---

### ✅ AUDIT 9: UBRC Participation

**Objective:** Verify future blocks can participate without custom telemetry

**Hypothetical New Block:**
```typescript
// Future Introduction Block (I1)
{
  id: "intro-block-uuid",
  type: "introduction",
  version: "I1",
  content: { ... }
}
```

**Questions:**

1. **What must I1 do to participate in ILS?**
   - [ ] Nothing (automatic via UBRC)?
   - [ ] Implement lifecycle hooks?
   - [ ] Call specific APIs?
   - [ ] Register with telemetry?

2. **Will I1 metrics appear in RSSB/LSNB?**
   - [ ] Automatically?
   - [ ] After configuration?
   - [ ] After custom code?

3. **Does Composer need I1-specific logic?**
   - [ ] No (generic block assembly)?
   - [ ] Yes (special handling)?

**Expected Answer:**
```text
I1 satisfies UBRC:
  - Renders with data-block-id, data-block-type, data-block-version
  - DOM structure allows IntersectionObserver
  - No custom telemetry code
       ↓
Universal Runtime handles rest:
  - ActiveBlockContext identifies I1
  - ILS records visits/time/completion
  - LSNB shows navigation state
  - RSSB shows block metrics
       ↓
Composer simply includes I1 in blocks[]
```

**Investigation Steps:**
1. Review D1 component implementation
2. Review C1 component implementation
3. Identify UBRC requirements (what both do identically)
4. Verify no telemetry calls inside components
5. Confirm telemetry is externally orchestrated

---

### ✅ AUDIT 10: Expected Time Propagation

**Objective:** Trace exact path from authored content to ILS

**Questions:**

1. **Where is expected time authored?**
   - [ ] TutorialDocument JSON?
   - [ ] Database tutorial_sections table?
   - [ ] Block definition metadata?
   - [ ] Composer configuration?

2. **How does it reach block_learning_state?**
   - [ ] Passed via TutorialPagePayload?
   - [ ] Passed via block runtime context?
   - [ ] Passed to recordBlockVisit()?
   - [ ] Passed to upsert()?

3. **Is it block-type agnostic?**
   - [ ] Any block can have expectedTimeSec?
   - [ ] Optional for all blocks?
   - [ ] NOT D1/C1 specific field?

**Investigation Steps:**
1. Find TutorialDocument type definition
2. Check if blocks[] includes expectedTimeSec
3. Trace to runtime context
4. Trace to repository call
5. Verify generic propagation

---

### ✅ AUDIT 11: Visit Semantics

**Objective:** Verify visit tracking is universal and session-aware

**Questions:**

1. **What constitutes a "visit"?**
   - [ ] Block enters viewport?
   - [ ] Block viewed for minimum duration?
   - [ ] Session-based deduplication?

2. **How is visitCount incremented?**
   - [ ] `recordBlockVisit()` called automatically?
   - [ ] Session ID used for atomic logic?
   - [ ] Repository handles deduplication?

3. **Is it generic?**
   - [ ] Same logic for D1/C1/future blocks?
   - [ ] NOT block-type dependent?

**Investigation Steps:**
1. Read `recordBlockVisit()` implementation
2. Find where it's called
3. Verify session-aware logic
4. Confirm block-type independence

---

### ✅ AUDIT 12: Null/Default Semantics

**Objective:** Define behavior when block has no learning state

**Scenario:** New block X1 just added, learner hasn't viewed it yet

**Questions:**

1. **Database behavior:**
   - [ ] No row exists yet?
   - [ ] Row created with defaults on first view?
   - [ ] Row created on page load?

2. **API behavior:**
   - [ ] Returns null for X1?
   - [ ] Returns default values?
   - [ ] Excludes X1 from blocks[]?

3. **ILSProvider behavior:**
   - [ ] activeBlockProgress = null?
   - [ ] activeBlockProgress with zero values?
   - [ ] Distinct from "loading"?

4. **RSSB display:**
   - [ ] "No metrics yet"?
   - [ ] "0 visits, 0m 0s"?
   - [ ] Empty state?

**Expected Defaults:**
```typescript
// No database row yet
{
  visitCount: 0,
  revisionCount: 0,
  activeTimeSec: 0,
  expectedTimeSec: (from block metadata or null),
  firstViewedAt: null,
  lastViewedAt: null,
  completedAt: null,
  isCompleted: false
}
```

**Investigation Steps:**
1. Check repository upsert logic
2. Check if defaults are database-level or service-level
3. Verify null handling in API
4. Confirm ILSProvider null handling

---

## 🎯 ACCEPTANCE CRITERIA

**Gate 3C.1 audit is COMPLETE when all 12 audits are verified:**

### Architecture
- [ ] Block telemetry producer path is generic
- [ ] No D1-specific logic found
- [ ] No C1-specific logic found
- [ ] No block-type switch statements in telemetry

### Metrics
- [ ] All 8 metrics have verified generic producers
- [ ] Visit/revision logic is centralized and session-aware
- [ ] Active time logic is universal
- [ ] Completion logic is centralized
- [ ] Expected time comes from block metadata

### Identity
- [ ] Canonical block identity preserved end-to-end
- [ ] No ID translation/mapping
- [ ] blockVersion participates in uniqueness
- [ ] Same identity: Composer → DOM → ILS → Database → API → RSSB

### Contract
- [ ] UBRC participation requirements are minimal
- [ ] Future blocks can participate automatically
- [ ] No per-block telemetry registration required
- [ ] Composer assembly is generic

### Read Path
- [ ] Write path confirmed universal
- [ ] Read path gap identified
- [ ] Existing repository capabilities documented
- [ ] Reuse strategy determined

---

## 🚀 OUTCOMES

### IF ALL AUDITS PASS:

**✅ FREEZE CONTRACT:**
```typescript
interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
  isCompleted: boolean;
}
```

**✅ PROCEED TO:**
1. Enhance ILS read path (Gate 3C implementation)
2. ILSProvider enhancement
3. RSSB implementation (Gate 3D)

### IF ANY AUDIT FAILS:

**⚠️ BLOCK AND FIX:**
1. Document which audit failed
2. Identify specific block-specific logic
3. Refactor to generic implementation
4. Re-audit
5. THEN proceed

---

## 📋 FINAL VALIDATION TEST

**The Ultimate Test:**

Create a new hypothetical block (X1) and answer:

> **Can X1 participate in ILS/LSNB/RSSB without writing any new telemetry code?**

**Required Answer:** YES

**If YES:**
- X1 renders with data-block-* attributes
- Universal runtime handles the rest
- LSNB shows X1 navigation state
- RSSB shows X1 metrics
- Composer includes X1 in blocks[]
- NO X1-specific telemetry code needed

**If NO:**
- Architecture is not yet universal
- Audit identified the gap
- Fix before freezing contract

---

**Audit End** | Status: READY TO EXECUTE | Blocks: Gate 3C Implementation
