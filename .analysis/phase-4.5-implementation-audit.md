# Phase 4.5 - Implementation Audit (READ-ONLY)

## EXISTING DATA FLOW (Verified)

### How Service Currently Fetches Tutorial Content

**File**: `packages/db-tutorial/src/services/learning-progress.hierarchy-resolution.ts`

**Method**: `resolveRequiredBlocks()` (Line 44)

**Current Usage**:
```typescript
export async function resolveRequiredBlocks(
  sectionRepository: TutorialSectionRepository,
  subtopicId: string,
  navigationNodeId: string,
  identity: AuthenticatedIdentity
): Promise<Array<{ blockId: string; blockVersion: string }>> {
  // ✅ ALREADY FETCHES TUTORIAL CONTENT
  const section = await sectionRepository.getTutorialByPageIdentity(
    subtopicId,
    navigationNodeId,
    identity.brand
  );

  if (!section || !section.content || !section.content.blocks) {
    return [];
  }

  // ✅ ALREADY ITERATES OVER BLOCKS
  for (const block of section.content.blocks) {
    const versionedBlock = block as { id: string; version?: string };
    
    if (versionedBlock.version && 
        (versionedBlock.version === 'D1' || 
         versionedBlock.version === 'C1' || 
         versionedBlock.version === 'S1')) {
      requiredBlocks.push({
        blockId: versionedBlock.id,
        blockVersion: versionedBlock.version,
      });
    }
  }

  return requiredBlocks;
}
```

**Observations**:
1. ✅ Service ALREADY has `sectionRepository` injected
2. ✅ Service ALREADY uses `getTutorialByPageIdentity()`
3. ✅ Service ALREADY accesses `section.content.blocks`
4. ✅ Pattern is established and working

---

## REPOSITORY METHOD (Verified)

**File**: `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`

**Method**: `getTutorialByPageIdentity()` (Line 122)

```typescript
async getTutorialByPageIdentity(
  subtopicId: string,
  navigationNodeId: string,
  brandId: string = 'shared'
): Promise<TutorialSection | undefined> {
  const rows = await this.runRead(
    this.dbInstance
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, subtopicId),
          eq(tutorialSections.navigationNodeId, navigationNodeId),
          or(
            eq(tutorialSections.brandId, brandId as any),
            eq(tutorialSections.brandId, 'shared')
          ),
          isNull(tutorialSections.deletedAt)
        )
      )
      .limit(1),
    'TutorialSectionRepository.getTutorialByPageIdentity'
  );

  return rows[0];
}
```

**Returns**: `TutorialSection | undefined`

---

## TYPE STRUCTURE (Verified)

### TutorialSection
**File**: `packages/db-tutorial/src/schema/tutorial-sections.ts`

```typescript
export type TutorialSection = typeof tutorialSections.$inferSelect;

// Schema includes:
{
  id: uuid,
  subtopicId: uuid,
  navigationNodeId: text,
  content: jsonb<TutorialDocument>,  // ← The content field
  status: enum,
  brandId: enum,
  // ... other fields
}
```

### TutorialDocument
**File**: `packages/types/src/tutorial-rich-document/document.ts`

```typescript
export interface TutorialDocument {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  blocks: TutorialBlock[];  // ← Array of blocks
}
```

### TutorialBlock
**File**: `packages/types/src/tutorial-rich-document/blocks/content.ts`

```typescript
export interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
  expectedTimeSec?: number;  // ← The field we need
  // ... other fields
}

// Specific block types extend BaseBlock
export interface TutorialDefinitionBlock extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1Content;
}

export interface TutorialCodeBlock extends BaseBlock {
  type: 'code';
  version: 'C1';
  content: CodeC1Content;
}

export type TutorialBlock = 
  | TutorialDefinitionBlock
  | TutorialCodeBlock
  | TutorialSummaryBlock
  // ... etc
```

---

## RECORDBLOCKVISIT CURRENT IMPLEMENTATION

**File**: `packages/db-tutorial/src/services/learning-progress.service.ts` (Line 544)

**Current Code**:
```typescript
async recordBlockVisit(
  identity: AuthenticatedIdentity,
  navigationNodeId: string,
  subtopicId: string,
  blockId: string,
  blockVersion: string,
  sessionId: string
): Promise<BlockLearningState> {
  // Validate inputs
  validateUserId(identity.userId);
  validateNavigationNodeId(navigationNodeId);
  validateBlockId(blockId);
  validateBlockVersion(blockVersion);
  validateSessionId(sessionId);
  validateSubtopicId(subtopicId);

  // Validate navigation hierarchy
  await this.validateNavigationHierarchy(
    navigationNodeId,
    subtopicId,
    null,
    identity
  );

  // ❌ DOES NOT FETCH TUTORIAL CONTENT
  // ❌ DOES NOT EXTRACT expectedTimeSec

  // Get existing block state
  const existing = await this.blockLearningStateRepository.findOne({
    userId: identity.userId,
    navigationNodeId,
    blockId,
    blockVersion,
  });

  const now = new Date();

  // Session-aware visit logic
  if (!existing) {
    // First visit - create new state
    return await this.blockLearningStateRepository.upsert({
      userId: identity.userId,
      navigationNodeId,
      blockId,
      blockVersion,
      visitCount: 1,
      revisionCount: 0,
      activeTimeSec: 0,
      // ❌ expectedTimeSec: NOT SET
      firstViewedAt: now,
      lastViewedAt: now,
    });
  }

  // ... existing session logic (omitted for brevity)
}
```

---

## BLOCKLEARNINGSTATE REPOSITORY

**File**: `packages/db-tutorial/src/repositories/block-learning-state.repository.ts`

### Upsert Input Type
```typescript
interface UpsertBlockLearningStateInput {
  userId: string;
  navigationNodeId: string;
  blockId: string;
  blockVersion: string;
  expectedTimeSec?: number | null;  // ✅ SUPPORTED
  visitCount?: number;
  revisionCount?: number;
  activeTimeSec?: number;
  firstViewedAt?: Date | null;
  lastViewedAt?: Date | null;
  completedAt?: Date | null;
}
```

### Upsert Behavior
```typescript
async upsert(data: UpsertBlockLearningStateInput): Promise<BlockLearningState> {
  const existing = await this.findOne({
    userId: data.userId,
    navigationNodeId: data.navigationNodeId,
    blockId: data.blockId,
    blockVersion: data.blockVersion,
  });

  if (!existing) {
    // INSERT - use provided expectedTimeSec or null
    return await this.create({
      ...data,
      expectedTimeSec: data.expectedTimeSec ?? null,
    });
  }

  // UPDATE - preserve existing if not provided
  return await this.update(existing.id, {
    ...data,
    expectedTimeSec: 
      data.expectedTimeSec !== undefined 
        ? data.expectedTimeSec 
        : existing.expectedTimeSec,  // ✅ PRESERVES EXISTING
  });
}
```

**Key Behavior**:
- ✅ If `expectedTimeSec` is provided → use it
- ✅ If `expectedTimeSec` is undefined → preserve existing value
- ✅ If `expectedTimeSec` is null → set to null

---

## IMPLEMENTATION PLAN

### Required Change Location
**File**: `packages/db-tutorial/src/services/learning-progress.service.ts`  
**Method**: `recordBlockVisit()` (after Line 566, before creating/updating state)

### Steps

1. **Fetch tutorial content** (using existing pattern):
```typescript
// NEW: Fetch section to get expectedTimeSec
const section = await this.sectionRepository.getTutorialByPageIdentity(
  subtopicId,
  navigationNodeId,
  identity.brand
);
```

2. **Extract expectedTimeSec**:
```typescript
let expectedTimeSec: number | null = null;

if (section?.content?.blocks) {
  const block = section.content.blocks.find(
    (b) => b.id === blockId && b.version === blockVersion
  );
  expectedTimeSec = block?.expectedTimeSec ?? null;
}
```

3. **Pass to repository** (modify existing upsert calls):
```typescript
return await this.blockLearningStateRepository.upsert({
  userId: identity.userId,
  navigationNodeId,
  blockId,
  blockVersion,
  visitCount: 1,
  revisionCount: 0,
  activeTimeSec: 0,
  expectedTimeSec,  // ✅ NOW INCLUDED
  firstViewedAt: now,
  lastViewedAt: now,
});
```

### Edge Cases to Handle

1. **Section not found**: `expectedTimeSec = null` (acceptable)
2. **Block not found in content**: `expectedTimeSec = null` (acceptable)
3. **Block has no expectedTimeSec**: `expectedTimeSec = null` (acceptable - optional field)
4. **Existing block state**: Repository preserves existing value if undefined, updates if provided

---

## ARCHITECTURE ALIGNMENT

### Follows Existing Patterns
- ✅ Uses same `sectionRepository.getTutorialByPageIdentity()` as `resolveRequiredBlocks()`
- ✅ Uses same `section.content.blocks` iteration pattern
- ✅ Uses authenticated `identity.brand` (no override)
- ✅ Handles missing data gracefully (returns empty/null)

### Maintains Separation of Concerns
- ✅ ILS does NOT invent/calculate expectedTimeSec
- ✅ Composer is authority (tutorial_sections.content.blocks)
- ✅ ILS copies metadata during visit ingestion
- ✅ Block-level metric (not page-level)

### Performance Consideration
- ⚠️ Adds one DB query per block visit
- ✅ But query is already indexed and fast (uq_tutorial_v2_identity_active)
- ✅ Visit recording is already async/background operation
- ✅ Could cache in future if needed

---

## TESTING REQUIREMENTS

### 1. Unit Test: Service Layer
**File**: `packages/db-tutorial/src/services/__tests__/learning-progress-phase-4.3.test.ts`

**Test Cases**:
- ✅ Block visit with expectedTimeSec in content → populated
- ✅ Block visit without expectedTimeSec → null
- ✅ Block visit when section not found → null
- ✅ Block visit when block not in content → null
- ✅ Existing state preserves expectedTimeSec if not provided

### 2. Repository Test
**File**: Already exists with coverage

**Existing Tests** (verified):
- Line 223: "creates with expectedTimeSec"
- Line 244: "creates without expectedTimeSec (nullable)"
- Line 341: "updates expectedTimeSec"
- Line 480: "handles expectedTimeSec in upsert"

### 3. Integration Test
**Approach**: Real learner visit flow
1. Composer creates tutorial with expectedTimeSec
2. Learner visits block
3. Verify block_learning_state.expected_time_sec populated

---

## READY FOR IMPLEMENTATION

### Prerequisites Met
- ✅ Database schema has column
- ✅ Repository supports parameter
- ✅ Existing pattern identified
- ✅ Type definitions complete
- ✅ Edge cases documented

### Implementation Scope
- 🎯 Single method: `recordBlockVisit()`
- 🎯 ~10 lines of code
- 🎯 Follows existing patterns
- 🎯 No breaking changes
- 🎯 Backward compatible (nullable field)

### Risk Assessment
- ✅ Low risk (adding optional field)
- ✅ Non-breaking (existing visits unaffected)
- ✅ Testable (mocks existing repository)
- ✅ Reversible (can set to null if needed)

---

## NEXT STEP

Implement the change in `recordBlockVisit()` following the documented pattern.
