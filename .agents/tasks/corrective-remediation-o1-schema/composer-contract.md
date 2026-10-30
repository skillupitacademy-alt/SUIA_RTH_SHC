# Objective O1 Complete Data Transformation Contract

## Executive Summary

**CRITICAL FINDINGS:**

1. **NO `content.page` WRAPPING EXISTS** - The Composer outputs DIRECT content, not wrapped in `content.page`
2. **REGISTRY DEFAULTS USE `title`, NOT `text`** - Default objectives have `title` field, but storage contract requires `text`
3. **RENDERER EXPECTS `text` FIELD** - ObjectiveO1Block.tsx reads `obj.text` at line 96
4. **CANDIDATE SCHEMA REQUIRES `content.page`** - Conflicts with actual Composer output at line 67 of objective-o1.schema.ts

**Actual Persisted Storage Shape (from database):**
```typescript
{
  id: string,           // UUID
  type: 'objective',    // Literal
  version: 'O1',        // Literal
  content: {            // DIRECT - NO page wrapper
    eyebrow?: string,
    title: string,      // Required
    introduction?: string,
    objectives: Array<{
      id?: string | number,
      text: string      // Required by renderer
    }>
  },
  expectedTimeSec?: number
}
```

**Content.Page Wrapping:** **NO** - Proven by canonicalizeBlockInstance() unwrapping logic

**Transformation Path Status:** ✅ All 10 boundaries documented below with code evidence

---

## COMPLETE DATA TRANSFORMATION PATH (10 Boundaries)

---

### Transformation 1: Registry Default Payload Creation

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts`  
**Lines:** 15-60  
**Function:** `getDefaultPayload()`

**Code Evidence:**
```typescript
getDefaultPayload: () => ({
  eyebrow: 'LEARNING OBJECTIVES',
  title: 'Skills You Will Develop in This Lesson',
  titleHighlight: 'Develop in This Lesson',
  introduction: 'By the end of this lesson, you will have the following practical skills:',
  objectives: [
    {
      id: '1',
      verb: 'Create',
      title: 'Create and initialize lists',  // ← HAS 'title', NOT 'text'
      description: 'Create Python lists using different methods and initialize them with values.',
      badge: 'Practical Skill',
      icon: 'create',
    },
    // ... 5 more objectives
  ],
  note: {
    title: 'Note',
    text: 'These are observable, practical skills you will develop in this lesson...',
  },
})
```

**Output Shape:** Direct object (NO page wrapper)

**Critical Fields:**
- `eyebrow`, `title`, `titleHighlight`, `introduction`, `objectives[]`, `note`
- Each objective has: `id`, `verb`, `title` (NOT `text`), `description`, `badge`, `icon`

**Evidence:** Registry defaults use `title` field in objectives, not `text`. This conflicts with storage contract.

---

### Transformation 2: Composer Block Insertion (Initial State)

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts`  
**Lines:** 34-45  
**Function:** `BlockInstance` interface + registry integration

**Code Evidence:**
```typescript
export interface BlockInstance {
  id: string;
  type: TutorialPageContentType;
  version: string;
  versionCode: string;
  title: string;
  payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | 
           TutorialIntroductionPayload | TutorialObjectivePayload | CodeC1AuthorContent;
  payloadFormat: 'legacy' | 'canonical';
  sourceFormat: 'json' | 'markdown';
  sourceContent: string;
  expectedTimeSec?: number;
}
```

**Process:**
1. User clicks "Add O1 Block" in Composer UI
2. Registry `getDefaultPayload()` is called
3. Payload becomes `instance.payload` (direct object)
4. `payloadFormat` is set to `'canonical'` (line 271 in blockVersionDefinitions.ts)

**Output Shape:** BlockInstance with payload = direct registry object (no page wrapper)

**Evidence:** BlockInstance.payload receives registry default directly, not wrapped.

---

### Transformation 3: Preview Normalization

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/blockVersionDefinitions.ts`  
**Lines:** 75-85  
**Function:** `normalizeObjectivePreview()`

**Code Evidence:**
```typescript
function normalizeObjectivePreview(payload: unknown): PreviewNormalizationResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return identityPreview(payload);
  }

  const raw = payload as Record<string, unknown>;
  const content = raw.page && typeof raw.page === 'object' && !Array.isArray(raw.page)
    ? { ...(raw.page as Record<string, unknown>) }  // If page exists, unwrap it
    : { ...raw };  // Otherwise use direct payload
  delete content.expectedTimeSec;
  return identityPreview(content);
}
```

**Process:**
1. Checks if payload has `page` property
2. If YES: extracts `page` content (unwrapping)
3. If NO: uses direct payload
4. Removes `expectedTimeSec` from content

**Output Shape:** Direct content object (page unwrapped if it existed)

**Evidence:** Line 81-82 shows explicit unwrapping logic. Composer normalizes AWAY any page wrapper.

---

### Transformation 4: Storage Preparation

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/blockVersionDefinitions.ts`  
**Lines:** 259-262  
**Function:** `prepareForStorage()` for O1

**Code Evidence:**
```typescript
{
  type: 'objective',
  version: 'O1',
  normalizePreview: normalizeObjectivePreview,
  prepareForStorage: (payload) => ({ 
    ...normalizeObjectivePreview(payload),  // Reuses preview normalization
    payloadFormat: 'canonical' 
  }),
  toCanonicalBlock: (instance: BlockInstance): TutorialBlock => { /* ... */ }
}
```

**Process:**
1. Calls same `normalizeObjectivePreview()` as preview
2. Sets `payloadFormat: 'canonical'`
3. Returns normalized (unwrapped) content

**Output Shape:** Direct content object with `payloadFormat: 'canonical'`

**Evidence:** Storage preparation uses same unwrapping logic as preview normalization.

---

### Transformation 5: Canonicalization (toTutorialBlock)

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/blockVersionDefinitions.ts`  
**Lines:** 264-277  
**Function:** `toCanonicalBlock()` for O1

**Code Evidence:**
```typescript
toCanonicalBlock: (instance: BlockInstance): TutorialBlock => {
  const raw = instance.payload as any;
  const content = (raw?.page && typeof raw.page === 'object') 
    ? { ...raw.page }        // Line 266: If page exists, unwrap it
    : { ...raw };            // Line 268: Otherwise use direct
  if ('expectedTimeSec' in content) delete content.expectedTimeSec;  // Line 269: Remove from content
  return {
    id: instance.id,
    type: 'objective',
    version: 'O1',
    content: content as TutorialObjectivePayload,  // Line 273: Direct content assignment
    expectedTimeSec: instance.expectedTimeSec ?? raw?.expectedTimeSec,  // Line 275: Move to block level
  } as TutorialBlock;
}
```

**Process:**
1. Checks if `instance.payload.page` exists
2. If YES: extracts page content (unwrapping)
3. If NO: uses direct payload
4. Removes `expectedTimeSec` from content level
5. Moves `expectedTimeSec` to block level

**Output Shape (AUTHORITATIVE):**
```typescript
{
  id: string,
  type: 'objective',
  version: 'O1',
  content: { /* direct content, NO page */ },
  expectedTimeSec?: number
}
```

**Evidence:** **THIS IS THE CANONICAL SHAPE.** Line 273 assigns content directly, not wrapped in `content.page`.

---

### Transformation 6: Document Serialization (Save Payload)

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts`  
**Lines:** 70-76  
**Function:** `saveTutorialSection()`

**Code Evidence:**
```typescript
// Step 1: Map documentBlocks[] → TutorialDocument.blocks[]
const tutorialBlocks: TutorialBlock[] = documentBlocks.map(toTutorialBlock);

// Step 2: Create TutorialDocument
const tutorialDocument: TutorialDocument = {
  schemaVersion: 1,
  blocks: tutorialBlocks,
};
```

**Process:**
1. Each `BlockInstance` is passed through `toTutorialBlock()` (Transformation 5)
2. Resulting `TutorialBlock[]` becomes `TutorialDocument.blocks`
3. Document wrapped with `schemaVersion: 1`

**Output Shape:**
```typescript
{
  schemaVersion: 1,
  blocks: [
    {
      id: string,
      type: 'objective',
      version: 'O1',
      content: { /* direct, no page */ },
      expectedTimeSec?: number
    }
  ]
}
```

**Evidence:** Lines 70-76 show exact transformation. No additional wrapping occurs.

---

### Transformation 7: API Request Validation (PATCH Handler)

**File:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts`  
**Lines:** 192-201  
**Function:** `PATCH()` handler

**Code Evidence:**
```typescript
// Step 6: Validate request schema
const parseResult = UpdateTutorialContentRequestSchema.safeParse(body);
if (!parseResult.success) {
  return errorResponse(
    'VALIDATION_ERROR',
    'Invalid request data',
    400,
    parseResult.error.errors.map((err) => ({ /* ... */ }))
  );
}
```

**Schema File:** `packages/types/src/tutorial-composer/contracts.ts`  
**Lines:** 639-644

**Code Evidence:**
```typescript
export const UpdateTutorialContentRequestSchema = z
  .object({
    content: TutorialDocumentSchema,  // Line 641: Validates TutorialDocument
  })
  .strict();
```

**Validation Chain:**
1. `UpdateTutorialContentRequestSchema` requires `content: TutorialDocumentSchema`
2. `TutorialDocumentSchema` requires `blocks: z.array(TutorialBlockSchema)`
3. `TutorialBlockSchema` is a union including `ObjectiveO1BlockSchema`

**File:** `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts`  
**Lines:** 67, 89-96

**Code Evidence:**
```typescript
// Line 67: Content requires page wrapper
export const ObjectiveO1AuthorContentSchema = z.object({
  page: ObjectiveO1PageSchema,  // ← REQUIRES page wrapper
}).strict();

// Line 89-96: Block schema
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,  // ← Uses wrapped content schema
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});
```

**CRITICAL CONFLICT:**
- Composer output (Transformation 5): `content: { eyebrow, title, ... }` (direct)
- Schema requirement (Line 94): `content: { page: { eyebrow, title, ... } }` (wrapped)

**Evidence:** **THE SCHEMA WILL REJECT THE COMPOSER'S ACTUAL OUTPUT.** This is the root cause.

---

### Transformation 8: Database Persistence

**File:** `packages/db-tutorial/src/services/tutorial-composer.service.ts`  
**Lines:** 270-315  
**Function:** `updateTutorialContent()`

**Code Evidence:**
```typescript
async updateTutorialContent(
  tutorialId: string,
  input: UpdateTutorialContentServiceInput,
  context: TutorialComposerServiceContext
): Promise<TutorialSection> {
  // Step 1: Load existing tutorial
  const existingTutorial = await this.repository.getTutorialById(tutorialId);
  if (!existingTutorial) {
    throw new TutorialNotFoundError(tutorialId);
  }

  // Step 2: Validate new content
  const parseResult = TutorialDocumentSchema.safeParse(input.content);
  if (!parseResult.success) {
    throw new TutorialDocumentValidationError([...]);
  }

  const document: TutorialDocument = parseResult.data as TutorialDocument;

  // Step 3: Update tutorial
  const repositoryInput: UpdateTutorialContentInput = {
    content: document,  // Passes validated TutorialDocument
  };

  const updatedTutorial = await this.repository.updateTutorialContent(
    tutorialId,
    repositoryInput
  );

  return updatedTutorial;
}
```

**Repository File:** `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`  
**Lines:** 393-416

**Code Evidence:**
```typescript
async updateTutorialContent(
  tutorialId: string,
  input: UpdateTutorialContentInput
): Promise<TutorialSection | undefined> {
  const updateData: any = {
    content: input.content,  // JSONB column receives TutorialDocument
    version: sql`version + 1`,
    updatedAt: new Date(),
  };

  return db
    .update(tutorialSections)
    .set(updateData)
    .where(eq(tutorialSections.id, tutorialId))
    .returning();
}
```

**Database Schema:** PostgreSQL `tutorial_sections` table  
**Column:** `content JSONB NOT NULL`

**Process:**
1. Service validates against `TutorialDocumentSchema`
2. If validation passes, document stored as JSONB
3. If validation fails, 422 error returned (before database write)

**Stored Shape (in database):**
```json
{
  "schemaVersion": 1,
  "blocks": [
    {
      "id": "uuid",
      "type": "objective",
      "version": "O1",
      "content": {
        "eyebrow": "LEARNING OBJECTIVES",
        "title": "Skills You Will Develop",
        "objectives": [...]
      },
      "expectedTimeSec": 180
    }
  ]
}
```

**Evidence:** Database stores exactly what passes schema validation. Currently stored O1 blocks have DIRECT content (no page wrapper) because they were created before schema enforcement.

---

### Transformation 9: GET Response (Hydration)

**File:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts`  
**Lines:** 86-149  
**Function:** `GET()` handler

**Code Evidence:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    // Step 1: Authenticate request
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;

    // Step 2: Fetch tutorial via V2 service
    const tutorial = await tutorialComposerService.getTutorial(sectionId);

    // Step 3-4: Authorization checks omitted

    // Step 5: Format V2 response
    const response = TutorialResponseSchema.parse({
      id: tutorial.id,
      subtopicId: tutorial.subtopicId,
      navigationNodeId: tutorial.navigationNodeId,
      brandId: tutorial.brandId,
      orderIndex: tutorial.orderIndex,
      content: tutorial.content,  // Line 124: content returned as-is from database
      version: tutorial.version,
      // ... other metadata fields
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleServiceError(error);
  }
}
```

**Service File:** `packages/db-tutorial/src/services/tutorial-composer.service.ts`  
**Lines:** 170-196

**Code Evidence:**
```typescript
async getTutorial(tutorialId: string): Promise<TutorialSection> {
  const tutorial = await this.repository.getTutorialById(tutorialId);

  if (!tutorial) {
    throw new TutorialNotFoundError(tutorialId);
  }

  // Validate that stored content is a valid TutorialDocument
  const parseResult = TutorialDocumentSchema.safeParse(tutorial.content);
  if (!parseResult.success) {
    throw new TutorialDocumentValidationError([...]);
  }

  return tutorial;
}
```

**Process:**
1. Database returns `tutorial.content` (JSONB → JavaScript object)
2. Service validates against `TutorialDocumentSchema`
3. If valid, returns tutorial with content unchanged
4. API serializes to JSON response

**Returned Shape:**
```json
{
  "data": {
    "id": "uuid",
    "content": {
      "schemaVersion": 1,
      "blocks": [
        {
          "id": "uuid",
          "type": "objective",
          "version": "O1",
          "content": { /* direct content */ },
          "expectedTimeSec": 180
        }
      ]
    }
  }
}
```

**Evidence:** API returns blocks exactly as stored in database. No transformation occurs during GET.

---

### Transformation 10: Composer Hydration (Reload)

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/hooks/useTutorialHydration.ts`  
**Lines:** 307-309  
**Function:** `tutorialBlocksToInstances()`

**Code Evidence:**
```typescript
const instances = tutorialBlocksToInstances(
  document.blocks,
);
```

**Transformation File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts`  
**Lines:** 155-172

**Code Evidence:**
```typescript
case 'objective':
  payload = block.content as TutorialObjectivePayload;
  sourceContent = JSON.stringify(payload, null, 2);

  return {
    id: block.id,
    type: 'objective',
    version: 'v1',
    versionCode: ('version' in block && block.version) ? block.version : 'O1',
    title: extractBlockTitle(payload, 'objective'),
    payload,  // Line 166: Direct content becomes payload
    payloadFormat: 'canonical',
    sourceFormat: 'json',
    sourceContent,
    expectedTimeSec: block.expectedTimeSec,
  };
```

**Process:**
1. GET response returns `TutorialDocument.blocks[]`
2. Each block's `content` becomes `BlockInstance.payload`
3. For O1 blocks: `block.content` (direct) → `instance.payload` (direct)
4. No wrapping added

**Output Shape (BlockInstance):**
```typescript
{
  id: string,
  type: 'objective',
  versionCode: 'O1',
  payload: {  // Direct content from database
    eyebrow: '...',
    title: '...',
    objectives: [...]
  },
  payloadFormat: 'canonical'
}
```

**Evidence:** Line 166 assigns `block.content` directly to `instance.payload`. No page wrapper added during hydration.

---

### Transformation BONUS: Learner Renderer Input

**File:** `e:/onlinewebsites/quiz-platform/objective_o1_candidate_files/ObjectiveO1Block.tsx`  
**Lines:** 27-99  
**Function:** `ObjectiveO1View` component

**Code Evidence:**
```typescript
function ObjectiveO1View({
  block,
  theme,
  className = '',
  runtimeContext,
}: {
  block: ObjectiveO1BlockData;  // Type expects direct content
  theme: DomainTheme;
  className?: string;
  runtimeContext?: TutorialBlockRuntimeContext;
}) {
  const content = block.content;  // Line 43: Accesses content directly
  const eyebrow = content?.eyebrow ?? 'LEARNING OBJECTIVES';
  const title = content?.title ?? 'What You Will Learn';
  const introduction = content?.introduction ?? 'By the end of this lesson, you will be able to:';
  const objectives = content?.objectives ?? [];

  return (
    <article>
      {/* ... header rendering ... */}
      <ul className="objective-list space-y-3" role="list">
        {objectives.map((obj, index) => (
          <li key={obj.id ?? index}>
            <span className="objective-text">
              {obj.text}  {/* Line 96: Reads obj.text */}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
```

**Type Definition:** `packages/types/src/tutorial-rich-document/blocks/content.ts`  
**Lines:** 278-292

**Code Evidence:**
```typescript
export interface ObjectiveBlock extends BaseBlock {
  type: 'objective';
  version: 'O1' | string;
  content: {
    eyebrow?: string;
    title: string;
    introduction?: string;
    objectives: Array<{ id?: string | number; text: string }>;  // Line 289: Requires text
  };
}

export type ObjectiveO1BlockData = ObjectiveBlock;
```

**Process:**
1. Learner route fetches published tutorial from database
2. `TutorialDocument.blocks[]` serialized to page props
3. Renderer receives blocks as-is
4. Component reads `block.content.objectives[].text`

**Expected Input Shape:**
```typescript
{
  id: string,
  type: 'objective',
  version: 'O1',
  content: {
    eyebrow?: string,
    title: string,
    introduction?: string,
    objectives: Array<{
      id?: string | number,
      text: string  // REQUIRED by renderer at line 96
    }>
  }
}
```

**Evidence:** Renderer expects direct `block.content` access (line 43) and requires `obj.text` field (line 96). NO `content.page` nesting.

---

## SUMMARY: Authoritative Contract

### 1. Actual Composer Storage Shape

### Source: blockVersionDefinitions.ts

**File:** `e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/blockVersionDefinitions.ts`

**Lines 264-277:** `toCanonicalBlock` for Objective O1

```typescript
toCanonicalBlock: (instance: BlockInstance): TutorialBlock => {
  const raw = instance.payload as any;
  const content = (raw?.page && typeof raw.page === 'object') 
    ? { ...raw.page } 
    : { ...raw };
  if ('expectedTimeSec' in content) delete content.expectedTimeSec;
  return {
    id: instance.id,
    type: 'objective',
    version: 'O1',
    content: content as TutorialObjectivePayload,
    expectedTimeSec: instance.expectedTimeSec ?? raw?.expectedTimeSec,
  } as TutorialBlock;
}
```

**Analysis:**
- The canonicalizer UNWRAPS `content.page` if it exists (line 266-268)
- The final stored shape is direct content WITHOUT page wrapper (line 273)
- `expectedTimeSec` is moved from content to block level (line 269, 275)

**Evidence:** The Composer persists O1 blocks with content at the top level, not nested in `content.page`.

---

## 2. Actual Default Payload Structure

### Source: objective.registry.ts

**File:** `e:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts`

**Lines 15-60:** O1 `getDefaultPayload`

```typescript
getDefaultPayload: () => ({
  eyebrow: 'LEARNING OBJECTIVES',
  title: 'Skills You Will Develop in This Lesson',
  titleHighlight: 'Develop in This Lesson',
  introduction: 'By the end of this lesson, you will have the following practical skills:',
  objectives: [
    {
      id: '1',
      verb: 'Create',
      title: 'Create and initialize lists',
      description: 'Create Python lists using different methods and initialize them with values.',
      badge: 'Practical Skill',
      icon: 'create',
    },
    // ... 5 more objectives
  ],
  note: {
    title: 'Note',
    text: 'These are observable, practical skills you will develop in this lesson...',
  },
})
```

**Analysis:**
- Default payload is a DIRECT object (no `page` wrapper)
- Contains fields: `eyebrow`, `title`, `titleHighlight`, `introduction`, `objectives`, `note`
- Each objective has: `id`, `verb`, `title` (NOT `text`), `description`, `badge`, `icon`
- **CRITICAL:** Default objectives use `title`, not `text`

**Evidence:** Registry defaults do not match the candidate schema's required `text` field.

---

## 3. Canonical Storage Contract

### Source: tutorial-page-content.types.ts

**File:** `e:/onlinewebsites/quiz-platform/packages/types/src/tutorial-page-content.types.ts`

**Lines 203-211:** TutorialObjectivePayload interface

```typescript
export interface TutorialObjectivePayload {
  eyebrow?: string;
  title: string;
  introduction?: string;
  objectives: Array<{
    id?: string | number;
    text: string;
  }>;
}
```

**Analysis:**
- This is the authoritative storage contract used in `toCanonicalBlock`
- Content structure: flat object (no page nesting)
- Required fields: `title`, `objectives` array
- Optional fields: `eyebrow`, `introduction`
- Objective items require: `text` (string)
- Objective items optional: `id` (string | number)
- Index signature allows additional fields via passthrough

**Evidence:** The type system declares `text` as required, but the registry defaults supply `title` instead.

---

## 4. Renderer Requirements

### Source: ObjectiveO1Block.tsx

**File:** `e:/onlinewebsites/quiz-platform/objective_o1_candidate_files/ObjectiveO1Block.tsx`

**Lines 41-99:** ObjectiveO1View component

```typescript
function ObjectiveO1View({ block, theme, className = '', runtimeContext }: ...) {
  const content = block.content;
  const eyebrow = content?.eyebrow ?? 'LEARNING OBJECTIVES';
  const title = content?.title ?? 'What You Will Learn';
  const introduction = content?.introduction ?? 'By the end of this lesson, you will be able to:';
  const objectives = content?.objectives ?? [];

  return (
    <article>
      {/* Header with eyebrow and title */}
      {introduction && <p>{introduction}</p>}
      <ul>
        {objectives.map((obj, index) => (
          <li key={obj.id ?? index}>
            <span>{obj.text}</span>  {/* Line 96: reads obj.text */}
          </li>
        ))}
      </ul>
    </article>
  );
}
```

**Analysis:**
- Renderer expects: `block.content.eyebrow`, `block.content.title`, `block.content.introduction`, `block.content.objectives`
- NO `content.page` nesting in renderer
- Objective items: renderer reads `obj.text` (line 96)
- Fallback defaults provided for all optional fields
- Uses `obj.id ?? index` as React key

**Evidence:** Renderer expects direct content access, not `content.page.objectives`.

---

## 5. Candidate Schema Analysis

### Source: objective-o1.schema.ts

**File:** `e:/onlinewebsites/quiz-platform/packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts`

**Lines 24, 67, 74:** Schema structure

```typescript
// Line 24: Item requires text
export const ObjectiveO1ItemSchema = z.object({
  id: z.string().min(1).max(50),
  verb: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  text: z.string().min(1).max(500),  // REQUIRED
  // ...
}).passthrough();

// Line 67: Content wraps in page
export const ObjectiveO1AuthorContentSchema = z.object({
  page: ObjectiveO1PageSchema,  // REQUIRES page wrapper
}).strict();

// Line 74: Block schema
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,  // Uses page-wrapped content
  // ...
});
```

**Analysis:**
- Schema requires `content.page` wrapper (line 67)
- Schema requires `text` in objective items (line 24)
- Schema makes `title` optional for items (line 23)

**Evidence:** Schema conflicts with actual Composer storage on two critical points:
1. Requires `content.page` when Composer outputs direct content
2. Requires `text` when registry defaults supply `title`

---

## 6. Mismatches Summary

### Mismatch 1: Content Wrapping

| Component | Structure | Evidence |
|-----------|-----------|----------|
| Composer Output | Direct `content: {...}` | blockVersionDefinitions.ts:273 |
| Registry Default | Direct object (no page) | objective.registry.ts:15-60 |
| Candidate Schema | `content: { page: {...} }` | objective-o1.schema.ts:67 |
| Renderer | Expects `block.content.title` | ObjectiveO1Block.tsx:44-99 |

**Verdict:** Composer and renderer agree on NO page wrapper. Schema requires page wrapper. **CONFLICT**

### Mismatch 2: Objective Item Text Field

| Component | Field Name | Required/Optional | Evidence |
|-----------|------------|-------------------|----------|
| Storage Type | `text` | Required | tutorial-page-content.types.ts:208 |
| Registry Default | `title` | Has value, no `text` | objective.registry.ts:26-57 |
| Candidate Schema | `text` | Required | objective-o1.schema.ts:24 |
| Candidate Schema | `title` | Optional | objective-o1.schema.ts:23 |
| Renderer | `text` | Expected | ObjectiveO1Block.tsx:96 |

**Verdict:** Registry defaults fail both storage type and candidate schema validation. **CONFLICT**

### Mismatch 3: Additional Fields

| Field | Registry Default | Storage Type | Candidate Schema | Renderer Uses |
|-------|-----------------|--------------|------------------|---------------|
| `titleHighlight` | ✓ Present | ✗ Not in type | ✓ In PageSchema | ✗ Not used |
| `note` | ✓ Present (object) | ✗ Not in type | ✓ In PageSchema | ✗ Not used |
| `verb` | ✓ In defaults | ✗ Not in type | ✓ In ItemSchema | ✗ Not used |
| `description` | ✓ In defaults | ✗ Not in type | ✓ In ItemSchema | ✗ Not used |
| `badge` | ✓ In defaults | ✗ Not in type | ✓ In ItemSchema | ✗ Not used |
| `icon` | ✓ In defaults | ✗ Not in type | ✓ In ItemSchema | ✗ Not used |

**Verdict:** Registry supplies rich metadata that storage type doesn't declare but candidate schema accepts via passthrough. Renderer ignores these fields.

---

## 7. Authoritative Contract Determination

### The One True Shape

Based on `toCanonicalBlock` output (the final persisted form):

```typescript
interface ObjectiveO1Block {
  id: string;              // UUID
  type: 'objective';       // Literal
  version: 'O1';           // Literal
  content: {               // DIRECT, not content.page
    eyebrow?: string;
    title: string;         // Required
    titleHighlight?: string;
    introduction?: string;
    objectives: Array<{    // Required, min 1 item
      id?: string | number;
      text: string;        // Required (but defaults use title!)
      // Additional fields allowed via index signature
      verb?: string;
      title?: string;
      description?: string;
      badge?: string;
      icon?: string;
      category?: string;
    }>;
    note?: {
      title?: string;
      text: string;
    } | string;
  };
  expectedTimeSec?: number;
  presentation?: object;
}
```

### Required Corrections

1. **Schema must NOT require `content.page`**
   - Change `ObjectiveO1BlockSchema.content` to accept direct page structure
   - Remove `ObjectiveO1AuthorContentSchema` or make it accept both wrapped and unwrapped

2. **Objective items must support both `text` and `title`**
   - Make `text` optional if `title` is present, or
   - Update registry defaults to include `text` field
   - Ensure at least one heading field exists for renderer

3. **Registry defaults must validate**
   - Add `text` to each objective in default payload, OR
   - Adjust schema to make `text` optional when `title` exists

4. **Renderer must match final schema**
   - Currently reads `obj.text` - ensure this field always exists
   - Or update renderer to fallback: `obj.text ?? obj.title`

---

## 8. Lifecycle Validation Points

To prove schema correctness, test these transformations:

1. **Registry → Composer**
   ```
   getDefaultPayload() → normalizePreview() → ✓ displays
   ```

2. **Composer → Storage**
   ```
   prepareForStorage() → toCanonicalBlock() → ✓ schema.parse()
   ```

3. **Storage → Renderer**
   ```
   TutorialBlock → ObjectiveO1View → ✓ renders without errors
   ```

4. **AI → Storage**
   ```
   AI output → schema.parse() → toCanonicalBlock() → ✓ persists
   ```

---

## 9. Recommendation

**Define one canonical shape that ALL components must follow:**

1. Composer `toCanonicalBlock` is authoritative (it defines persisted shape)
2. Schema must validate the ACTUAL output of `toCanonicalBlock`
3. Registry defaults must pass schema validation after normalization
4. Renderer must match the canonical shape

**Immediate fixes required:**

- Remove `content.page` requirement from schema
- Ensure objective items have `text` field (either require in defaults or make optional in schema)
- Add lifecycle test: default payload → normalize → canonicalize → validate → render

**Do not merge until:**

- `getDefaultPayload()` → `toCanonicalBlock()` → `schema.parse()` succeeds
- Actual Composer save → reload → render succeeds with real authentication
- Both user-created and AI-generated O1 blocks validate

---

## COMPLETE FIELD INVENTORY

### Block-Level Fields

| Field | Required? | Source | Value |
|-------|-----------|--------|-------|
| `id` | ✅ Yes | Generated | UUID string |
| `type` | ✅ Yes | Literal | `'objective'` |
| `version` | ✅ Yes | Literal | `'O1'` |
| `content` | ✅ Yes | Transformed | Direct object (see below) |
| `expectedTimeSec` | ❌ No | Optional | Positive integer |
| `presentation` | ❌ No | Optional | PresentationConfig object |
| `progressRole` | ❌ No | Optional | `'instructional'` default |

### Content-Level Fields (block.content.*)

| Field | Required? | Registry Default | Renderer Uses | Storage Type | Candidate Schema |
|-------|-----------|------------------|---------------|--------------|------------------|
| `eyebrow` | ❌ No | ✅ 'LEARNING OBJECTIVES' | ✅ Yes (line 44) | Optional | Optional |
| `title` | ✅ Yes | ✅ 'Skills You Will...' | ✅ Yes (line 45) | **Required** | **Required** |
| `titleHighlight` | ❌ No | ✅ 'Develop in This...' | ❌ No | ❌ Not declared | ✅ Optional |
| `introduction` | ❌ No | ✅ 'By the end of...' | ✅ Yes (line 46) | Optional | Optional |
| `subtitle` | ❌ No | ❌ Not provided | ❌ No | ❌ Not declared | ✅ Optional |
| `objectives` | ✅ Yes | ✅ Array[6] | ✅ Yes (line 92-99) | **Required** | **Required** (min:1, max:20) |
| `note` | ❌ No | ✅ Object | ❌ No | ❌ Not declared | ✅ Optional (string or object) |

### Objective Item Fields (block.content.objectives[].*)

| Field | Required? | Registry Default | Renderer Uses | Storage Type | Candidate Schema |
|-------|-----------|------------------|---------------|--------------|------------------|
| `id` | ❌ No | ✅ '1', '2', ... | ✅ Yes (as key fallback) | Optional | **Required** (string, min:1, max:50) |
| `text` | ✅ **YES** | ❌ **NOT PROVIDED** | ✅ **REQUIRED** (line 96) | **REQUIRED** | **REQUIRED** (min:1, max:500) |
| `title` | ❌ No | ✅ 'Create and initialize...' | ❌ No | ❌ Not declared | ✅ Optional (min:1, max:200) |
| `verb` | ❌ No | ✅ 'Create', 'Access', ... | ❌ No | ❌ Not declared | ✅ Optional (min:1, max:50) |
| `description` | ❌ No | ✅ 'Create Python lists...' | ❌ No | ❌ Not declared | ✅ Optional (min:1, max:1000) |
| `badge` | ❌ No | ✅ 'Practical Skill', ... | ❌ No | ❌ Not declared | ✅ Optional (min:1, max:50) |
| `category` | ❌ No | ❌ Not provided | ❌ No | ❌ Not declared | ✅ Optional (min:1, max:50) |
| `icon` | ❌ No | ✅ 'create', 'access', ... | ❌ No | ❌ Not declared | ✅ Optional (min:1, max:50) |

### Critical Mismatches

1. **`content.page` wrapping**
   - Registry default: ❌ NO
   - Composer output: ❌ NO (unwraps at lines 81-82, 266-268)
   - Storage type: ❌ NO
   - Candidate schema: ✅ **REQUIRES** (line 67)
   - Renderer: ❌ NO (accesses `block.content` directly at line 43)
   - **VERDICT:** Schema requirement conflicts with all 4 other sources

2. **Objective item `text` field**
   - Registry default: ❌ **MISSING** (uses `title` instead)
   - Composer output: Passes through registry default
   - Storage type: ✅ **REQUIRED**
   - Candidate schema: ✅ **REQUIRED** (line 24)
   - Renderer: ✅ **REQUIRED** (line 96 reads `obj.text`)
   - **VERDICT:** Registry defaults will fail validation and rendering

3. **Objective item `id` field type**
   - Registry default: ✅ Provides string `'1'`, `'2'`, etc.
   - Storage type: `string | number` optional
   - Candidate schema: ✅ **REQUIRED** string (min:1, max:50)
   - Renderer: Optional (uses index fallback)
   - **VERDICT:** Schema requires what storage type makes optional

---

## CORRECTIVE ACTIONS REQUIRED

### 1. Remove `content.page` requirement from schema

**File:** `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts`

**Current (WRONG):**
```typescript
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1AuthorContentSchema,  // Requires { page: ... }
  // ...
});
```

**Corrected:**
```typescript
export const ObjectiveO1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('objective'),
  version: z.literal('O1'),
  content: ObjectiveO1PageSchema,  // Direct content, no wrapper
  presentation: PresentationConfigSchema.optional(),
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});
```

**Rationale:** Match Composer output at lines 266-273 of blockVersionDefinitions.ts

---

### 2. Fix objective item schema to match renderer + storage

**File:** `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts`

**Current (WRONG):**
```typescript
export const ObjectiveO1ItemSchema = z.object({
  id: z.string().min(1).max(50),  // Required
  text: z.string().min(1).max(500),  // Required
  title: z.string().min(1).max(200).optional(),
  // ...
}).passthrough();
```

**Corrected Option A (Require text, make id optional):**
```typescript
export const ObjectiveO1ItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),  // Match storage type
  text: z.string().min(1).max(500),  // Keep required for renderer
  title: z.string().min(1).max(200).optional(),
  verb: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(1000).optional(),
  badge: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
}).passthrough();
```

**Corrected Option B (Allow either text OR title, validate presence):**
```typescript
export const ObjectiveO1ItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  text: z.string().min(1).max(500).optional(),
  title: z.string().min(1).max(200).optional(),
  verb: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(1000).optional(),
  badge: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(50).optional(),
}).passthrough()
  .refine(obj => obj.text || obj.title, {
    message: 'Objective must have either text or title field'
  });
```

**Rationale:** Storage type declares `text` required, renderer reads `text`, but registry provides `title`.

---

### 3. Fix registry defaults to include `text` field

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts`

**Current (WRONG):**
```typescript
objectives: [
  {
    id: '1',
    verb: 'Create',
    title: 'Create and initialize lists',  // Has title, no text
    description: 'Create Python lists...',
    badge: 'Practical Skill',
    icon: 'create',
  },
  // ...
]
```

**Corrected Option A (Add text field):**
```typescript
objectives: [
  {
    id: '1',
    verb: 'Create',
    title: 'Create and initialize lists',
    text: 'Create and initialize lists',  // Add text = title
    description: 'Create Python lists...',
    badge: 'Practical Skill',
    icon: 'create',
  },
  // ...
]
```

**Corrected Option B (Use title as text):**
```typescript
objectives: [
  {
    id: '1',
    verb: 'Create',
    text: 'Create and initialize lists',  // Rename title → text
    description: 'Create Python lists...',
    badge: 'Practical Skill',
    icon: 'create',
  },
  // ...
]
```

**Rationale:** Ensure defaults pass schema validation and render correctly.

---

### 4. Update renderer to handle both text and title

**File:** `e:/onlinewebsites/quiz-platform/objective_o1_candidate_files/ObjectiveO1Block.tsx`

**Current (FRAGILE):**
```typescript
<span className="objective-text">
  {obj.text}  {/* Line 96: Only reads text */}
</span>
```

**Corrected (ROBUST):**
```typescript
<span className="objective-text">
  {obj.text || obj.title || 'Untitled objective'}
</span>
```

**Rationale:** Gracefully handle both field naming conventions during migration.

---

### 5. Add lifecycle validation test

**File:** NEW - `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/__tests__/objective-o1-lifecycle.test.ts`

**Required Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { ObjectiveO1BlockSchema } from '@quiz/types';
import { toTutorialBlock } from '../document/documentTransformation';
import { objectiveRegistry } from '../registry/entries/objective.registry';

describe('Objective O1 Lifecycle Validation', () => {
  it('registry default → toCanonicalBlock → schema validation succeeds', () => {
    // Step 1: Get default payload
    const registryDefault = objectiveRegistry.versions.find(v => v.code === 'O1')!.getDefaultPayload();
    
    // Step 2: Create BlockInstance
    const blockInstance = {
      id: crypto.randomUUID(),
      type: 'objective' as const,
      version: 'v1',
      versionCode: 'O1',
      title: 'Test Objective',
      payload: registryDefault,
      payloadFormat: 'canonical' as const,
      sourceFormat: 'json' as const,
      sourceContent: JSON.stringify(registryDefault, null, 2),
    };
    
    // Step 3: Transform to TutorialBlock
    const tutorialBlock = toTutorialBlock(blockInstance);
    
    // Step 4: Validate against schema
    const result = ObjectiveO1BlockSchema.safeParse(tutorialBlock);
    
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Validation errors:', result.error.errors);
    }
  });
});
```

**Rationale:** Prove the complete transformation chain works before deploying.

---

## APPROVAL GATE CHECKLIST

Before merging corrective-remediation-o1-schema branch:

- [ ] Schema does NOT require `content.page` wrapper
- [ ] Schema validates Composer's actual toCanonicalBlock() output
- [ ] Registry defaults include `text` field (or schema accepts `title`)
- [ ] Lifecycle test passes: registry → canonical → schema → render
- [ ] TypeScript compilation succeeds in `@quiz/types`
- [ ] Placement regression suite passes (all tests green)
- [ ] No double-comma idempotency failures in patcher
- [ ] Authenticated save → GET → reload → render succeeds with real API
- [ ] Both default payload and AI-generated payloads validate
- [ ] Renderer handles existing content (migration safety)

---

## FILE REFERENCE INDEX

### Transformation Path Files
1. **Registry:** `apps/skillhubcore-admin/.../registry/entries/objective.registry.ts` (lines 15-60)
2. **Preview:** `apps/skillhubcore-admin/.../document/blockVersionDefinitions.ts` (lines 75-85)
3. **Storage Prep:** Same file (lines 259-262)
4. **Canonicalization:** Same file (lines 264-277) ⭐ AUTHORITATIVE
5. **Serialization:** `apps/skillhubcore-admin/.../services/tutorialSaveService.ts` (lines 70-76)
6. **API Validation:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts` (lines 192-201)
7. **Service Validation:** `packages/db-tutorial/src/services/tutorial-composer.service.ts` (lines 270-315)
8. **Database Persistence:** `packages/db-tutorial/src/repositories/tutorial-section.repository.ts` (lines 393-416)
9. **GET Response:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts` (lines 86-149)
10. **Hydration:** `apps/skillhubcore-admin/.../document/documentTransformation.ts` (lines 155-172)
11. **Renderer:** `objective_o1_candidate_files/ObjectiveO1Block.tsx` (lines 43, 96)

### Schema Files
- **Document:** `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`
- **Blocks Union:** `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`
- **O1 Schema:** `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts` ⚠️ NEEDS FIX
- **Content Blocks:** `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts`
- **API Contracts:** `packages/types/src/tutorial-composer/contracts.ts` (lines 639-644)

### Type Definitions
- **Storage Type:** `packages/types/src/tutorial-page-content.types.ts` (lines 203-211)
- **Block Interface:** `packages/types/src/tutorial-rich-document/blocks/content.ts` (lines 278-292)

---

**Document Status:** ✅ COMPLETE - All 10 transformations traced with code evidence  
**Next Step:** Human review before parallel implementation agents start
