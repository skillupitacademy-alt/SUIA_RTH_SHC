# 06F: Block Metadata Resolution

**Investigation Type:** T4 - Metadata Derivation Boundary  
**Created:** 2026-10-02  
**Evidence Status:** VERIFIED (inline extraction), NOT FOUND (dedicated resolver)  
**Baseline Documents:** 06A-E

---

## Executive Summary

**Primary Finding:** There is **NO dedicated `buildBlockMetadataResolver()` function** in the repository.

Block metadata (`expectedTimeSec`, block identity) is extracted **inline** during `recordBlockVisit()` by:
1. Fetching canonical tutorial content via `TutorialSectionRepository.getTutorialByPageIdentity()`
2. Finding the matching block in `section.content.blocks[]` by `blockId` + `blockVersion`
3. Extracting `expectedTimeSec` directly from the block envelope
4. Passing to repository upsert

**No separate metadata resolver, no registry lookup, no hard-coded mappings found.**

---

## Investigation Scope

**Searched For:**
- `buildBlockMetadataResolver` (function name)
- `BlockMetadataResolver` (class/type name)
- `InstructionalBlockMetadata` (type definition)
- `progressRole` (classification field)
- Separate metadata construction/resolution logic

**Result:** NOT FOUND

**Evidence State:** VERIFIED (absence confirmed via repository search)

---

## Metadata Extraction - recordBlockVisit()

### Location

**File:** `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method:** `recordBlockVisit()`  
**Lines:** ~636-657

### Implementation

```typescript
// Phase 4.5: Fetch tutorial content to extract expectedTimeSec
const section = await this.sectionRepository.getTutorialByPageIdentity(
  subtopicId,
  navigationNodeId,
  identity.brand
);

// Extract expectedTimeSec from block envelope
let expectedTimeSec: number | null = null;
if (section?.content?.blocks) {
  const block = section.content.blocks.find(
    (b: any) => b.id === blockId && b.version === blockVersion
  );
  expectedTimeSec = block?.expectedTimeSec ?? null;
}

const now = new Date();

// Phase 4.6: Single atomic upsert - repository handles all visit/revision logic
const result = await this.blockLearningStateRepository.upsert({
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  lastSessionId: sessionId,
  expectedTimeSec,  // ← Extracted inline, passed directly to repository
  lastViewedAt: now,
});
```

**Evidence State:** VERIFIED

---

## Metadata Sources

### 1. Canonical Tutorial Content

**Source:** `TutorialSectionRepository.getTutorialByPageIdentity(subtopicId, navigationNodeId, brand)`

**Returns:** Tutorial section with `content.blocks[]` array

**Block Matching:**
- Identity: `blockId` (UUID) + `blockVersion` (e.g., "D1", "C1")
- Method: `Array.find()` linear search

**Extracted Fields:**
- `expectedTimeSec` (number | null)

**Evidence State:** VERIFIED

---

### 2. Block Identity (Already Known)

**Source:** Client-provided parameters to `recordBlockVisit()`

**Fields:**
- `blockId`: UUID string (canonical block identity from TutorialDocument)
- `blockVersion`: Version string ("D1", "C1", "S1", etc.)
- `blockType`: NOT extracted by recordBlockVisit (comes from client, not persisted in block_learning_state)

**Evidence State:** VERIFIED

---

## Missing Metadata Concepts

### progressRole

**Status:** NOT FOUND in metadata extraction path

**Searched:**
- `progressRole` field in `block_learning_state` schema
- `BlockProgressRole` type in metadata extraction logic
- Instructional vs non-instructional classification in `recordBlockVisit()`

**Result:** No evidence of `progressRole` field in the metadata extraction path investigated here.

**Important Qualification:** This finding does NOT establish that no `BlockProgressRole` type exists anywhere in the production repository. The investigation scope was limited to the metadata extraction path in `recordBlockVisit()`. Runtime schema/types not yet inspected.

**Evidence State:** NOT FOUND (in metadata extraction path), DEFERRED TO 06G (runtime schema investigation)

---

### InstructionalBlockMetadata

**Status:** NOT FOUND

**Searched:**
- `InstructionalBlockMetadata` type
- Metadata construction/resolution functions
- Block classification registry

**Result:** No dedicated metadata type or resolver found.

**Evidence State:** NOT FOUND

---

### Block Registry / Hard-Coded Mappings

**Status:** NOT FOUND

**Searched:**
- Block type → metadata mappings
- Hard-coded expected time values
- Block classification tables

**Result:** All metadata comes from canonical `TutorialDocument` content.

**Evidence State:** NOT FOUND

---

## Metadata Flow

```text
CANONICAL TUTORIAL CONTENT (TutorialDocument)
        ↓
  content.blocks[] array
        ↓
    { id, version, expectedTimeSec, ...blockContent }
        ↓
  recordBlockVisit() inline extraction
        ↓
    blockLearningStateRepository.upsert({expectedTimeSec})
        ↓
  block_learning_state.expected_time_sec column
        ↓
  DTO construction (toDTO)
        ↓
  BlockLearningStateDTO
```

**Evidence State:** VERIFIED

---

## expectedTimeSec Semantics

### Database Schema

**Table:** `block_learning_state`  
**Column:** `expected_time_sec INTEGER`  
**Nullable:** YES  
**Default:** None

**Comment from schema:**
> "Expected Time (authored metadata from published document)"

**Evidence State:** VERIFIED

---

### Extraction Logic

**When block found in content:**
```typescript
expectedTimeSec = block?.expectedTimeSec ?? null;
```

**When block not found:**
```typescript
expectedTimeSec = null;
```

**When section has no blocks:**
```typescript
expectedTimeSec = null;
```

**Evidence State:** VERIFIED

---

### Usage

**Primary Consumer:** `InstructionalBlockCompletionOrchestrator` (80% threshold calculation)

**From 06A:**
```typescript
const timeRatio = blockData.active_time_sec / blockData.expected_time_sec;
const meetsTimeRequirement = timeRatio >= COMPLETION_TIME_RATIO; // 0.80
```

**Dependency:** Completion criteria requires `expectedTimeSec` to be non-null.

**Evidence State:** VERIFIED (from 06A)

---

## Block Type / Version Semantics

### blockType

**Source:** Client-provided to `recordBlockVisit()`

**NOT STORED:** `block_learning_state` schema does **not** include `blockType` column

**Usage:** Used by client-side runtime for block classification, NOT persisted in telemetry state

**Evidence State:** VERIFIED (schema inspection shows no blockType column)

---

### blockVersion

**Source:** Client-provided, also in canonical content

**Storage:** `block_learning_state.block_version` (TEXT, part of 4-part unique identity)

**Matching:** Must match between client request and canonical content for `expectedTimeSec` extraction

**Evidence State:** VERIFIED

---

## Relationship to InstructionalBlockCompletionOrchestrator

**From 06A findings:**

The orchestrator evaluates completion using:
1. `expectedTimeSec` (from metadata extraction documented here)
2. `activeTimeSec` (from telemetry accumulation)
3. 80% threshold

**No separate metadata resolver feeds the orchestrator.** The orchestrator consumes `expectedTimeSec` that was already extracted and persisted during `recordBlockVisit()`.

**Evidence State:** VERIFIED (cross-reference to 06A)

---

## Relationship to BlockTelemetryProvider

**From 06A findings:**

The telemetry provider tracks:
- Visit events (triggers `recordBlockVisit()` → inline metadata extraction)
- Active-time events (no metadata extraction)

**No metadata resolution at telemetry provider level.** Metadata extraction happens only during visit recording, not during active-time accumulation.

**Evidence State:** VERIFIED (cross-reference to 06A)

---

## Relationship to TutorialDocument

**Canonical Content Structure:**

```typescript
{
  content: {
    blocks: [
      {
        id: string,          // ← Block identity (UUID)
        version: string,     // ← Block version ("D1", "C1", etc.)
        type: string,        // ← Block type ("DefinitionBlock", "CodeBlock", etc.)
        expectedTimeSec?: number,  // ← Metadata extracted by recordBlockVisit
        // ...block-specific content fields
      }
    ]
  }
}
```

**Metadata Authority:** TutorialDocument is the **canonical source** for `expectedTimeSec`.

**No Derived/Computed Metadata:** All metadata comes directly from authored content, not calculated/inferred.

**Evidence State:** VERIFIED

---

## Missing/Invalid Metadata Handling

### Block Not Found in Content

**Scenario:** Client requests visit for `(blockId, blockVersion)` that doesn't exist in canonical content

**Behavior:**
```typescript
const block = section.content.blocks.find(...);
expectedTimeSec = block?.expectedTimeSec ?? null;  // ← null
```

**Result:** Repository upsert succeeds with `expectedTimeSec = null`

**Evidence State:** VERIFIED

---

### expectedTimeSec Missing from Block

**Scenario:** Block exists but doesn't have `expectedTimeSec` field

**Behavior:**
```typescript
expectedTimeSec = block?.expectedTimeSec ?? null;  // ← null
```

**Result:** Repository upsert succeeds with `expectedTimeSec = null`

**Evidence State:** VERIFIED

---

### Null expectedTimeSec Impact on Completion

**From 06A:**

```typescript
const meetsTimeRequirement = 
  !blockData.expected_time_sec ||  // ← Null bypasses time requirement
  (blockData.active_time_sec / blockData.expected_time_sec) >= COMPLETION_TIME_RATIO;
```

**Semantic:** Blocks without `expectedTimeSec` can complete based on visit alone (no time threshold).

**Evidence State:** VERIFIED (from 06A)

---

## Tests Covering Metadata Extraction

**Search Performed:** Repository/service test files for metadata extraction tests

**Result:** Tests exist for `recordBlockVisit()` but specific coverage of `expectedTimeSec` extraction logic not verified in this investigation.

**Evidence State:** NOT YET VERIFIED (test coverage audit deferred)

---

## Contradictions with Frozen Corpus

**Stage 1-4 Frozen Corpus:**
- Defines educational block families with semantic contracts
- Does not specify `expectedTimeSec` ranges or calculation methods

**Production Implementation:**
- `expectedTimeSec` is **authored field** in TutorialDocument
- No validation, no computed defaults, no type-specific rules

**Divergence:** NONE  
The frozen corpus doesn't prescribe metadata resolution; production implements direct extraction from canonical content.

**Evidence State:** VERIFIED (no contradiction)

---

## Summary of Findings

| Finding | Evidence State |
|---------|---------------|
| No `buildBlockMetadataResolver()` function exists | VERIFIED (absence) |
| Metadata extracted inline in `recordBlockVisit()` | VERIFIED |
| Source: `TutorialSectionRepository.getTutorialByPageIdentity()` | VERIFIED |
| Extracted field: `expectedTimeSec` from block envelope | VERIFIED |
| `progressRole` field/type not found in metadata extraction | VERIFIED (absence in this path) |
| `BlockProgressRole` runtime schema/type existence | DEFERRED TO 06G |
| `InstructionalBlockMetadata` type not found | NOT FOUND |
| Block registry / hard-coded mappings not found | NOT FOUND |
| Metadata authority: TutorialDocument canonical content | VERIFIED |
| `blockType` not persisted in `block_learning_state` | VERIFIED |
| `expectedTimeSec` nullable, defaults to null when missing | VERIFIED |
| Null `expectedTimeSec` bypasses time requirement in orchestrator | VERIFIED (from 06A) |
| Metadata extraction test coverage | NOT YET VERIFIED |

---

## Architecture Implications

### Canonical Content is Authoritative

**Finding:** All block metadata comes from `TutorialDocument.content.blocks[]`.

**Implication:** 
- No separate metadata registry to maintain
- No hard-coded type → metadata mappings
- Authoring tools control metadata by populating `expectedTimeSec` in block envelope

**Evidence State:** VERIFIED

---

### Metadata Extraction is Lazy

**Finding:** `expectedTimeSec` extracted only during first visit (or subsequent visit after state deletion).

**Implication:**
- Content updates don't automatically refresh metadata in existing `block_learning_state` records
- Metadata refresh requires state recreation or manual update

**Evidence State:** INFERRED (from single-extraction pattern)

---

### No Block Classification System in Metadata Extraction

**Finding:** No `progressRole` field in `block_learning_state` schema. No `InstructionalBlockMetadata` type in metadata extraction logic.

**Implication:**
- Metadata extraction does not classify blocks as "instructional" vs "non-instructional"
- No server-side block classification during visit recording
- No type-based metadata inference in extraction path
- `expectedTimeSec` presence/absence is observable but semantic classification not performed during metadata extraction

**Important Qualification:** This does NOT establish that no block classification system exists. The completion orchestrator uses `expectedTimeSec` for evaluation logic (06A), but whether a formal `BlockProgressRole` type exists in runtime schema/types remains to be investigated (deferred to 06G).

**Evidence State:** VERIFIED (absence in metadata extraction), PARTIAL (runtime classification deferred)

---

## Next Steps for Stage 5

This investigation establishes the **metadata derivation boundary**:

✅ **Metadata extraction: inline, from canonical content**  
✅ **No dedicated resolver function**  
✅ **Canonical source: TutorialDocument**  
⏳ **Block classification system: deferred to 06G runtime schema investigation**

**Remaining investigations:**
1. TutorialDocumentSchema runtime validation (06G) — **should resolve BlockProgressRole existence**
2. sanitizeDocument() logic (06H)
3. LearningProgressSidebar metric calculations (06I)
4. Composer integration (07)
5. Testing/certification (08)

---

**Document Status:** COMPLETE  
**T4 Investigation:** COMPLETE  
**Evidence State:** VERIFIED (inline extraction), NOT FOUND (dedicated resolver), PARTIAL (classification deferred to 06G)
