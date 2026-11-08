# FND21 Nested Schema Compatibility Constraint

**Finding**: FND21 nested document schema accepts unknown child blocks
**Status**: VERIFICATION_FAILED (intentional - pending compatibility assessment)
**Baseline commits**: 1d510f14 (nested schema), 6ae971b9 (authoring truth)

## Problem Statement

### Issue 1: Overly Permissive Nested Schema

`packages/types/src/tutorial-rich-document/schemas/container-blocks.schema.ts` defines:

```typescript
export const TutorialBlockSchemaLazy: TutorialBlockSchemaType = z.lazy(() => z.any());
```

This placeholder accepts **any** nested content within container blocks (two-column, card-grid, timeline), including:
- Unknown block types (`type: 'unrecognized'`)
- Blocks missing required fields (id, type)
- Malformed content structures
- Invalid or corrupted data

**Test evidence**: `packages/types/src/tutorial-rich-document/__tests__/nested-schema-contract.test.ts` line 13 FAILS - schema accepts `{ id: 'child-1', type: 'unrecognized', content: {} }` when it should reject.

### Issue 2: Example Content Injection in Storage Preparation

`apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/blockPayloadNormalizers.ts` fills missing fields with example content:

**Definition D1**: `normalizeDefinitionD1Payload` uses `definitionD1Example.page` defaults for:
- `type`, `category`, `title`, `intro`, `definition`
- `explanation` array, `example.language`, `example.code`
- `characteristics` array, `takeaway`

**Introduction I1**: `normalizeIntroductionI1Payload` uses `introductionI1Example.page` defaults for:
- `badge`, `title`, `subtitle`, `motto.lines`
- `learningGoal`, `topic.*`, `whereFit.*`, `solution.*`
- `whereUsed.*`, `roadmap.*`, `whyMatters.*`, `keyTakeaway`

**Impact**: When `prepareBlockForStorage` is called with incomplete author content (e.g., only title provided), the persisted document contains example educational claims about arrays, not the actual lesson topic.

**Test evidence**: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/__tests__/storage-preparation-truth.test.ts` - incomplete "Python Lists" or "Django" lessons get filled with example array content.

**Caller**: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/hooks/useTutorialBlockEditor.ts` line 98 calls `prepareBlockForStorage` before adding block to editor state.

## Document Consumer Inventory

### 1. Import Pipeline
- **Service**: `packages/db-tutorial/src/services/tutorial-import.service.ts`
- **Validation**: Uses `TutorialDocumentSchema.safeParse()` for imported content
- **Risk**: Imported documents with malformed nested blocks currently pass validation

### 2. Composer (Authoring)
- **Service**: `packages/db-tutorial/src/services/tutorial-composer.service.ts`
- **Tests**: `v2-composer-integration.test.ts`, `tutorial-composer.service.phase1.test.ts`
- **Risk**: Authored documents stored with example content instead of incomplete real content

### 3. Delivery (Learner-facing)
- **Service**: `packages/db-tutorial/src/services/tutorial-delivery.service.ts`
- **Validation**: Uses `TutorialDocumentSchema.parse()` on retrieved documents
- **Tests**: `v2-delivery-integration.test.ts`, `tutorial-delivery.service.phase1.test.ts`
- **Risk**: Invalid nested structures could reach learners if stored before schema tightening

### 4. SHC Analysis
- **Service**: `packages/db-tutorial/src/services/content-analysis.service.ts`
- **Use**: Analyzes document structure, complexity, interactivity
- **Risk**: Analysis may process malformed nested structures incorrectly

### 5. RTH Delivery
- **Component**: `src/share-branding/LearningExperience/TutorialPage.tsx`
- **Tests**: `learner-page-resolution.phase1.test.ts`
- **Risk**: Rendering malformed blocks could cause UI errors

### 6. Sanitization
- **Service**: `packages/db-tutorial/src/services/tutorial-content-sanitization.service.ts`
- **Purpose**: XSS protection, content normalization
- **Risk**: May not handle unknown block types correctly

### 7. Block Transformation
- **Service**: `packages/db-tutorial/src/services/block-transformation.service.ts`
- **Purpose**: AI-driven block suggestions and transformations
- **Risk**: Unknown nested types may break transformation logic

## Supported Structural Shapes

### Current Schema Version
- **Version**: `CURRENT_SCHEMA_VERSION = 1` (from `packages/types/src/tutorial-rich-document/constants.ts`)

### Content Blocks (non-container)
- heading, paragraph, list, table, image, callout, quote, summary, diagram, comparison
- **Versioned**: code (legacy CodeBlock + CodeC1Block), definition (D1), introduction (I1), objective (O1/O2), example

### Container Blocks (can hold nested blocks)
- **two-column**: left.blocks[], right.blocks[]
- **three-column**: columns[0-2].blocks[]
- **card-grid**: cards[].blocks[]
- **timeline**: items[].blocks[] (optional)

### Legacy Compatibility
- Blocks without explicit `version` field default to v1 or type-specific defaults (D1, C1, S1, I1, O1)
- `payloadFormat: 'legacy' | 'canonical'` distinguishes storage representations

### Historical Documents
- Unknown how many production documents exist with:
  - Deeply nested structures (3+ levels)
  - Mixed legacy/canonical payloads
  - Custom/experimental block types from earlier iterations
  - Forward-compatibility fields added by newer schema versions

## Preview vs Persisted Content Distinction

### Current Implementation (INCORRECT)
Both preview normalization and storage preparation use the same functions:
- `normalizePreview: (payload) => ({ content: normalizeDefinitionD1Payload(payload), ... })`
- `prepareForStorage: (payload) => ({ content: normalizeDefinitionD1Payload(payload), ... })`

### Required Behavior

**Preview Normalization** (for UI rendering in editor):
- ✅ SHOULD fill missing fields with defaults/examples
- Purpose: Author sees complete visual representation while editing
- No persistence risk

**Storage Preparation** (for database persistence):
- ❌ MUST NOT inject example content into incomplete author fields
- Options:
  1. Store exactly what author provided (sparse JSON)
  2. Fill missing fields with empty/null values
  3. Reject incomplete blocks (require validation before save)

**Current Risk**: `useTutorialBlockEditor.ts` calls `prepareBlockForStorage` which injects examples into persisted state.

## Compatible Schema Tightening Strategy (NOT IMPLEMENTED)

### Option A: Replace z.any() with Proper Recursive Union

**Change**: In `container-blocks.schema.ts`:
```typescript
// Replace:
export const TutorialBlockSchemaLazy: TutorialBlockSchemaType = z.lazy(() => z.any());

// With:
export const TutorialBlockSchemaLazy: TutorialBlockSchemaType = z.lazy(() => TutorialBlockSchema);
```

**Impact**:
- ✅ Rejects unknown nested block types
- ✅ Validates nested structure recursively
- ⚠️ May reject historical documents with experimental/legacy nested blocks
- ⚠️ Requires historical document migration or compatibility layer

### Option B: Gradual Tightening with Version Check

**Change**: Keep z.any() for schema v1, introduce stricter nested validation for v2:
```typescript
export const TutorialBlockSchemaLazy: TutorialBlockSchemaType = z.lazy(() =>
  z.union([TutorialBlockSchema, z.any()]) // Lenient for backward compat
);
```

Add validation at service layer for new documents only.

### Option C: Adapter Pattern for Historical Documents

**Change**: Introduce `LegacyDocumentAdapter` that:
1. Detects documents with unknown nested blocks
2. Migrates/normalizes to supported types
3. Logs/reports incompatible structures
4. Fails closed on unmigratable content

## Separation of Preview vs Storage (NOT IMPLEMENTED)

### Required Changes

**1. Create separate storage normalizers**:
```typescript
// New: minimal storage preparation without example injection
function prepareDefinitionD1ForStorage(payload: unknown): DefinitionD1StorageContent {
  const raw = isRecord(payload) ? payload : {};
  const page = isRecord(raw.page) ? raw.page : raw;

  return {
    page: {
      title: typeof page.title === 'string' ? page.title : undefined,
      intro: typeof page.intro === 'string' ? page.intro : undefined,
      definition: typeof page.definition === 'string' ? page.definition : undefined,
      // Store only what author provided, no example injection
      ...(Array.isArray(page.explanation) && { explanation: page.explanation }),
      ...(page.example && { example: page.example }),
    },
  };
}
```

**2. Update BlockVersionDefinition**:
```typescript
{
  type: 'definition',
  version: 'D1',
  normalizePreview: (payload) => ({
    content: normalizeDefinitionD1Payload(payload), // Keep example filling for preview
    memoryModelWarning: ''
  }),
  prepareForStorage: (payload) => ({
    content: prepareDefinitionD1ForStorage(payload), // NEW: no example injection
    payloadFormat: 'legacy',
    memoryModelWarning: ''
  }),
}
```

**3. Add validation guard**:
```typescript
// Reject incomplete blocks at save boundary
if (!isCompleteDefinition(content)) {
  throw new ValidationError('Definition block missing required fields');
}
```

## Required Actions Before Implementation

### 1. Physical Document Audit (NOT EXECUTED)
- Query production database for all tutorial_sections.content_json
- Identify documents with:
  - Nested blocks 2+ levels deep
  - Unknown block types in nested positions
  - Missing required fields in nested blocks
  - Example content in persisted D1/I1 blocks (evidence of current bug)
- Count affected documents by tenant/brand

### 2. Historical Compatibility Matrix (NOT COMPLETE)
- Enumerate all block type/version combinations in production
- Test each combination against proposed stricter schema
- Document migration path for incompatible structures

### 3. Consumer Impact Assessment (PARTIAL - inventory done, testing not executed)
- Test stricter schema against import, composer, delivery, analysis services
- Verify error handling for rejected documents
- Ensure backward compatibility for read operations

### 4. Sol Approval (REQUIRED)
- Select storage preparation policy: sparse JSON, empty defaults, or validation gate
- Approve schema tightening approach: recursive union, gradual, or adapter
- Define migration strategy for historical documents with example content
- Approve breaking vs non-breaking change classification

## Test Coverage

### Implemented (VERIFICATION_FAILED - intentionally failing)

**Nested Schema**: `packages/types/src/tutorial-rich-document/__tests__/nested-schema-compatibility.test.ts`
- ✅ Valid nested blocks (paragraph, definition, code, introduction, deep nesting)
- ❌ FAILING: Unknown nested type rejection
- ❌ FAILING: Missing required fields (id, type)
- ❌ FAILING: Malformed content structure
- ✅ Schema version validation
- ✅ Legacy compatibility scenarios

**Storage Preparation**: `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/__tests__/storage-preparation-truth.test.ts`
- ❌ FAILING: Definition D1 incomplete → no example injection
- ❌ FAILING: Definition D1 partial → no example injection
- ✅ Definition D1 complete → preserved
- ❌ FAILING: Introduction I1 incomplete → no example injection
- ❌ FAILING: Introduction I1 partial → no example injection
- ✅ Introduction I1 complete → preserved
- ✅ Storage preparation metadata (payloadFormat)
- ✅ Preview vs storage distinction documentation

**Original Tests** (preserved):
- `nested-schema-contract.test.ts`: 3 tests, 1 failing (unknown child accepted)
- `authoring-truth-control.test.ts`: would fail with proper imports (D1/I1 example injection)

### Required (NOT IMPLEMENTED)
- Historical document compatibility suite
- Migration adapter tests
- Service-layer validation at import/composer/delivery boundaries
- Backward compatibility tests (read old documents with new schema)
- Forward compatibility tests (new documents readable by old code)

## Limitations

**NOT EXECUTED**:
- Physical database document inspection
- Historical document migration
- Browser-based authoring workflow with real persistence
- Production schema deployment
- Cross-service integration tests with actual HTTP/DB

**DEPENDENCIES**:
- FND03: Private owner authority for tutorial documents
- FND24: Complete schema→API→service composition validation
- FND25: Concurrency-safe document updates
- FND27: Compatibility evidence and migration strategy

**CONSTRAINTS**:
- DO NOT tighten schema without Sol-approved migration plan
- DO NOT modify normalizers without separating preview/storage paths
- DO NOT fix failing tests until compatibility assessment complete
- Retain intentionally failing tests as regression controls

## Recommendation

**Immediate**: Keep tests VERIFICATION_FAILED as regression controls. Document in W1_W3_Terra_Consolidated_Handoff.md.

**Sol Decision Required**:
1. Storage preparation policy (sparse, empty defaults, or validation gate)
2. Schema tightening approach (recursive union, gradual, or adapter)
3. Breaking change acceptable? If yes, migration timeline.
4. Acceptable loss of historical documents with unknown nested types?

**Implementation Sequence** (after Sol approval):
1. Physical document audit → affected count
2. Implement historical adapter if needed
3. Separate preview/storage normalizers (D1, I1)
4. Deploy storage changes with backward-compatible reads
5. Tighten nested schema validation for new documents only
6. Migrate historical documents in controlled batches
7. Enable strict validation globally after migration complete

## References

- **Finding**: FND21 in `audit/W1_W3_Terra_Consolidated_Implementation_Task.md`
- **Evidence**: Baselines 1d510f14, 6ae971b9, commit 627e1f13
- **Architecture**: `audit/FinalAechitecture.md` section on ILS contracts
- **Handover**: `Claude_Sonnet45_W1_W3_Detailed_Implementation_Handover_a239ca39.md` section D4
- **Related**: FND03 (private owner), FND24 (contracts), FND25 (concurrency), FND27 (compatibility)
