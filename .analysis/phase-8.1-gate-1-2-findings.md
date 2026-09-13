# PHASE 8.1 — GATE 1 & 2 FINDINGS

## GATE 1: Canonical Fixture Verification

### Database Source of Truth
- **Subtopic Name:** `What is Java?`
- **Subtopic Slug:** `what-is-java-12efacf1` (with hyphens + UUID suffix)
- **Subtopic Internal ID:** `414f63eb-cccf-4bd1-bcc0-b52df69ce499`
- **Subtopic External ID:** `12efacf1-b5ad-4b43-9fe4-17ba1cf249e4`
- **Topic ID:** `fb47747d-ac1c-4091-bd8e-a8a7d7378e07`
- **Topic External ID:** `4b21ddc0-123b-41e3-8ea1-280d37f7f035`

### Sidebar Navigation (tutorial_sidebar_trees_v2)
- **Brand:** `shared` (NOT `realtutorialhub`)
- **Topic ID:** `4b21ddc0-123b-41e3-8ea1-280d37f7f035`
- **Status:** `published`
- **Navigation Node ID:** `whatisjava` ✅ **CORRECT VALUE**
- **Navigation Node Name:** `What Is Java?`
- **Navigation Node Slug:** `whatisjava`
- **Navigation Node Type:** `page`

### Critical Finding: navigationNodeId Mismatch

**Phase 8.1 Prompt Expected:** `'whatisjava'` (no hyphens)  
**Actual in Sidebar:** `'whatisjava'` ✅ MATCH  
**Current Test Files Use:** `'what-is-java'` ❌ **INCORRECT**

All 5 modified integration test files currently use:
```typescript
const TEST_NAV_NODE_ID = 'what-is-java';
```

This should be:
```typescript
const TEST_NAV_NODE_ID = 'whatisjava';
```

### Brand Mismatch

Tests use brand `'realtutorialhub'` but the sidebar only exists for brand `'shared'`.

---

## GATE 2: Tuple Identity Verification

### Schema Contract (tutorial_sections)

**Identity Tuple:** `(subtopicId, navigationNodeId, brandId)`

```typescript
// From packages/db-tutorial/src/schema/tutorial-sections.ts

export const tutorialSections = pgTable('tutorial_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Internal FK to tutorial_subtopics.id
  subtopicId: uuid('subtopic_id')
    .notNull()
    .references(() => tutorialSubtopics.id, { onDelete: 'cascade' }),
  
  // Navigation identity (sidebar node.id)
  navigationNodeId: text('navigation_node_id').notNull(),
  
  // Brand partition
  brandId: brandEnum('brand_id').notNull().default('shared'),
  
  // Content
  content: jsonb('content').$type<TutorialDocument>().notNull(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  
  // ... other fields
}, (table) => ({
  // Partial unique index: only applies when deletedAt IS NULL
  uqTutorialV2IdentityActive: uniqueIndex('uq_tutorial_v2_identity_active')
    .on(table.subtopicId, table.navigationNodeId, table.brandId)
    .where(sql`${table.deletedAt} IS NULL`),
}));
```

### Service Contract (TutorialComposerService)

**Input:** External IDs  
**Persistence:** Internal IDs  

```typescript
// From packages/db-tutorial/src/services/tutorial-composer.service.ts

async createTutorial(
  input: CreateTutorialServiceInput,
  context: TutorialComposerServiceContext
): Promise<TutorialSection> {
  // Step 1: Resolve external subtopic ID → internal ID
  const internalSubtopicId = await this.repository.resolveSubtopicId(input.subtopicId);
  
  // Step 2: Validate navigationNodeId via sidebar
  const validation = await SidebarNavigationValidatorService.validateNavigationNode(
    internalSubtopicId,
    input.navigationNodeId,
    brandId
  );
  
  // Step 3: Check for existing tutorial
  const existingTutorial = await this.repository.getTutorialByPageIdentity(
    internalSubtopicId,
    input.navigationNodeId,
    brandId
  );
  
  if (existingTutorial) {
    throw new TutorialAlreadyExistsError(
      `Tutorial already exists for subtopic ${input.subtopicId}, page ${input.navigationNodeId}, brand ${brandId}`
    );
  }
  
  // Step 4: Create with internal ID
  const repositoryInput: CreateTutorialInput = {
    subtopicId: internalSubtopicId, // Internal ID for FK
    navigationNodeId: input.navigationNodeId,
    brandId,
    content: document,
  };
  
  const tutorial = await this.repository.createTutorial(repositoryInput);
  return tutorial;
}
```

### Repository Contract (TutorialSectionRepository)

**Lookup:** Uses internal subtopic ID

```typescript
// From packages/db-tutorial/src/repositories/tutorial-section.repository.ts

async getTutorialByPageIdentity(
  subtopicId: string, // Internal tutorial_subtopics.id
  navigationNodeId: string,
  brandId: string = 'shared'
): Promise<TutorialSection | undefined> {
  const rows = await this.dbInstance
    .select()
    .from(tutorialSections)
    .where(
      and(
        eq(tutorialSections.subtopicId, subtopicId), // Internal ID
        eq(tutorialSections.navigationNodeId, navigationNodeId),
        eq(tutorialSections.brandId, brandId),
        isNull(tutorialSections.deletedAt)
      )
    )
    .limit(1);
  
  return rows[0];
}
```

### Identity Flow Summary

```
TEST INPUT
  ↓
testSubtopicId = javaSubtopic.externalId (12efacf1-b5ad-4b43-9fe4...)
navigationNodeId = 'what-is-java' ❌ WRONG VALUE
brandId = 'realtutorialhub' ⚠️  Sidebar only exists for 'shared'
  ↓
COMPOSER SERVICE
  ↓
resolveSubtopicId(externalId) → internalId (414f63eb-cccf-4bd1-bcc0...)
validateNavigationNode(internalId, 'what-is-java', 'realtutorialhub')
  ↓
VALIDATION FAILURE or BRAND MISMATCH
  ↓
getTutorialByPageIdentity(internalId, 'what-is-java', 'realtutorialhub')
  ↓
PERSISTENCE (if validation passes)
tutorial_sections.subtopicId = internalId (414f63eb...)
tutorial_sections.navigationNodeId = 'what-is-java' ❌
tutorial_sections.brandId = 'realtutorialhub' ⚠️
```

### Correct Flow Should Be

```
TEST INPUT
  ↓
testSubtopicId = javaSubtopic.externalId (12efacf1...)
navigationNodeId = 'whatisjava' ✅ CORRECT
brandId = 'shared' ✅ CORRECT (or test creates sidebar for 'realtutorialhub')
  ↓
COMPOSER SERVICE
  ↓
resolveSubtopicId(externalId) → internalId (414f63eb...)
validateNavigationNode(internalId, 'whatisjava', 'shared') ✅
  ↓
getTutorialByPageIdentity(internalId, 'whatisjava', 'shared')
  ↓
PERSISTENCE
tutorial_sections.subtopicId = internalId (414f63eb...)
tutorial_sections.navigationNodeId = 'whatisjava' ✅
tutorial_sections.brandId = 'shared' ✅
```

---

## Test Cleanup Requirements

### Database Cleanup MUST Use Internal ID

```typescript
// CORRECT cleanup pattern
await db
  .delete(tutorialSections)
  .where(
    and(
      eq(tutorialSections.subtopicId, javaSubtopic.id), // Internal ID
      eq(tutorialSections.navigationNodeId, 'whatisjava'), // Correct node ID
      eq(tutorialSections.brandId, 'shared') // Correct brand
    )
  );
```

### Test Input MUST Use External ID

```typescript
// CORRECT input pattern
const input: CreateTutorialServiceInput = {
  subtopicId: javaSubtopic.externalId, // External ID for service input
  navigationNodeId: 'whatisjava', // Correct node ID
  brandId: 'shared', // Correct brand
  content: { /* ... */ }
};
```

---

## Next Steps: GATE 3

Query existing tutorials to determine:
1. Are there pre-existing tutorials for the canonical Java fixture?
2. Which navigationNodeId values exist in the database?
3. Which brandId values are in use?
4. Is test cleanup removing them correctly?

Then classify the `SectionAlreadyExistsError` root cause.
