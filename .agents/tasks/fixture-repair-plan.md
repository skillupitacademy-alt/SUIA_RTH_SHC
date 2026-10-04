# Tutorial Rich Document Fixture Repair Plan

**Task**: Restore TypeScript compilation for tutorial-rich-document test/fixture suite by aligning fixtures with current canonical type contracts.

**Scope**: TEST/FIXTURE COMPATIBILITY ONLY — do NOT change production type definitions unless a genuine internal inconsistency is discovered.

---

## Project Build & Test Commands

**Type Check Command** (discovered):
```bash
cd packages/types
npx tsc --noEmit
```

**Test Command**:
```bash
cd packages/types
npm run test
```

**Status**: Tests pass (vitest runtime), but TypeScript compilation fails with 29 errors.

---

## Canonical Type Definitions

All canonical types are located in:
- `packages/types/src/tutorial-rich-document/blocks/content.ts`
- `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
- `packages/types/src/tutorial-rich-document/document.ts`
- `packages/types/src/tutorial-rich-document/constants.ts`

### 1. TutorialDocument.schemaVersion

**Canonical Definition** (`document.ts`):
```typescript
import type { CURRENT_SCHEMA_VERSION } from './constants';

export interface TutorialDocument {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION; // ← LITERAL TYPE, not number
  blocks: TutorialBlock[];
  metadata?: TutorialDocumentMetadata;
}
```

**Constants** (`constants.ts`):
```typescript
export const CURRENT_SCHEMA_VERSION = 1;
```

**Contract**: `schemaVersion` must be the **literal type `1`**, not `number`.

---

### 2. CodeC1AuthorContent (Code Block C1)

**Canonical Definition** (`blocks/content-blocks.ts` lines 167-193):
```typescript
export interface CodeC1Page {
  type: 'code';
  title: string;
  introduction: string;
  language: string;
  code: string;
  filename?: string;
  explanation: Array<{
    focus: string;
    description: string;
  }>;
  output?: {           // ← output is OBJECT, not direct field
    value: string;
    description?: string;
  };
  takeaway: string;
  practiceHint?: string;
  memoryModel?: CodeC1MemoryModel;
}

export interface CodeC1AuthorContent {
  page: CodeC1Page;   // ← Content wrapped in .page
}
```

**Fields NOT accepted**:
- ❌ `output: string` (direct field on content)
- ❌ `term: string` (does not exist in CodeC1)

**Correct structure**:
- Content must be: `content: { page: CodeC1Page }`
- Output must be: `content.page.output = { value: string, description?: string }`

---

### 3. IntroductionBlock Import Path

**PROBLEM**: Fixture imports from `../../blocks/introduction` which **does not exist**.

**Canonical Path**:
```typescript
// CORRECT:
import type { IntroductionBlock, IntroductionI1Block } from '../../blocks/content-blocks';
// OR:
import type { IntroductionBlock } from '../../blocks';
```

**File does NOT exist**: `packages/types/src/tutorial-rich-document/blocks/introduction.ts`

**Type alias `IIntroductionBlock` does NOT exist** in canonical types. The correct type is:
- `IntroductionI1Block` (specific version)
- `IntroductionBlock` (version union, currently same as I1)

---

### 4. ListItem Structure

**Canonical Definition** (`blocks/content.ts` lines 73-76):
```typescript
export interface ListItem {
  text: string;
  children?: ListItem[];  // ← nested list support
}
```

**ListBlock.content.items** expects `ListItem[]`, NOT `string[]`.

**Migration**:
```typescript
// OLD (fixture):
items: ['Client-Side', 'Server-Side']

// NEW (correct):
items: [
  { text: 'Client-Side' },
  { text: 'Server-Side' }
]
```

---

### 5. ComparisonFeature Structure

**Canonical Definition** (`blocks/content.ts` lines 166-169):
```typescript
export interface ComparisonFeature {
  name: string;
  values: string[];  // One value per entity
}
```

**ComparisonBlock.content.features** expects `ComparisonFeature[]`, NOT `string[]`.

**Also**: ComparisonBlock structure is:
```typescript
export interface ComparisonBlock {
  type: 'comparison';
  content: {
    title?: string;
    entities: string[];        // e.g., ["React", "Vue"]
    features: ComparisonFeature[];  // NOT rows!
    recommendation?: string;
    notes?: string;
  };
}
```

**Migration**:
```typescript
// OLD (fixture):
content: {
  features: ['Learning Curve', 'Performance', 'Ecosystem'],
  rows: [
    ['Moderate-Steep', 'Easy-Moderate'],
    ['Excellent', 'Excellent'],
    ['Very Large', 'Growing'],
  ]
}

// NEW (correct):
content: {
  entities: ['React', 'Vue'],
  features: [
    { name: 'Learning Curve', values: ['Moderate-Steep', 'Easy-Moderate'] },
    { name: 'Performance', values: ['Excellent', 'Excellent'] },
    { name: 'Ecosystem', values: ['Very Large', 'Growing'] }
  ]
}
```

---

### 6. TableColumn Structure

**Canonical Definition** (`blocks/content.ts` lines 88-92):
```typescript
export interface TableColumn {
  id: string;          // ← id, NOT key
  label: string;
  alignment?: 'left' | 'center' | 'right';
}
```

**Field NOT accepted**: ❌ `key`

**Migration**:
```typescript
// OLD:
{ key: 'type', label: 'Type', alignment: 'left' }

// NEW:
{ id: 'type', label: 'Type', alignment: 'left' }
```

---

### 7. TableRow Structure

**Canonical Definition** (`blocks/content.ts` lines 94-97):
```typescript
export interface TableRow {
  id: string;
  cells: TableCell[];
}

export interface TableCell {
  columnId: string;
  value: string;
}
```

**Structure**: Rows are NOT `Record<string, string>`. They must be `{ id, cells: TableCell[] }`.

**Migration**:
```typescript
// OLD:
columns: [
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' }
],
rows: [
  { type: 'String', description: 'Text data' },
  { type: 'Number', description: 'Numeric data' }
]

// NEW:
columns: [
  { id: 'type', label: 'Type' },
  { id: 'description', label: 'Description' }
],
rows: [
  {
    id: 'row_1',
    cells: [
      { columnId: 'type', value: 'String' },
      { columnId: 'description', value: 'Text data' }
    ]
  },
  {
    id: 'row_2',
    cells: [
      { columnId: 'type', value: 'Number' },
      { columnId: 'description', value: 'Numeric data' }
    ]
  }
]
```

---

### 8. DefinitionBlock vs Definition-like Content

**PROBLEM**: Fixture uses inline `{ term, definition, example }` in content.

**Canonical DefinitionD1Block** (`blocks/content.ts` lines 135-157):
```typescript
export interface DefinitionD1Block extends BaseBlock {
  type: 'definition';
  version: 'D1';
  content: DefinitionD1AuthorContent;
}

export interface DefinitionD1AuthorContent {
  page: DefinitionD1Page;
}

export interface DefinitionD1Page {
  type: 'definition';
  category: string;
  title: string;
  intro: string;
  definition: string;
  explanation: string[];
  example: {
    language: string;
    code: string;
  };
  characteristics: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  takeaway: string;
}
```

**Fields `term`, `definition`, `example` as direct content fields do NOT exist** in any canonical block type.

---

## Error-by-Error Repair Plan

### Error Group 1: schemaVersion Inference Issue

**Files**: 
- `__tests__/document.test.ts` (lines 88, 113)

**Root Cause**: TypeScript infers `schemaVersion: 1` as `number`, not literal `1`.

**Fix**: Add explicit type assertion `as const` or use the imported constant.

```typescript
// OPTION A: as const
const docWithCode = {
  schemaVersion: 1 as const,  // ← Forces literal type
  blocks: [...]
};

// OPTION B: Use constant
import { CURRENT_SCHEMA_VERSION } from '../constants';
const docWithCode = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  blocks: [...]
};
```

**Verification**: `npx tsc --noEmit` in packages/types should clear these 2 errors.

---

### Error Group 2: CodeC1 Fixture Stale Fields

**File**: `__tests__/fixtures/code-tutorial.ts` (line 52)

**Root Cause**: Fixture attempts to add `output` as direct field on content, but CodeC1 uses `content.page.output`.

**Current fixture structure** (WRONG):
```typescript
{
  id: 'example1',
  type: 'example',
  content: {
    title: 'Counter Example',
    explanation: '...',
    code: '...',
    output: '1',  // ← This is ExampleBlock, NOT CodeC1Block
    notes: '...',
  },
}
```

**Analysis**: This block is actually type `'example'`, which IS a valid content block type. The error suggests TypeScript cannot narrow the union.

**Fix**: Add explicit type annotation to help TypeScript:
```typescript
{
  id: 'example1',
  type: 'example' as const,  // ← Helps type narrowing
  content: {
    title: 'Counter Example',
    explanation: 'Here is a simple counter that demonstrates variable reassignment:',
    code: 'let count = 0;\ncount = count + 1;\nconsole.log(count);',
    expectedOutput: '1',  // ← ExampleBlock uses expectedOutput, not output
    notes: 'The let keyword allows us to change the value of count.',
  },
}
```

**Check**: Confirm ExampleBlock.content fields in `blocks/content.ts` line 160-168:
```typescript
export interface ExampleBlock extends BaseBlock {
  type: 'example';
  content: {
    title?: string;
    explanation: string;
    code?: string;
    codeLanguage?: CodeLanguage;
    expectedOutput?: string;  // ← Correct field name
    notes?: string;
  };
}
```

**Verification**: `npx tsc --noEmit` should clear error on line 52.

---

### Error Group 3: Introduction Block Import Path

**File**: `__tests__/fixtures/introduction-i1.fixture.ts` (line 6)

**Root Cause**: Import path `../../blocks/introduction` does not exist.

**Fix**: Update import to canonical path:
```typescript
// OLD:
import type { IIntroductionBlock } from '../../blocks/introduction';

// NEW:
import type { IntroductionI1Block } from '../../blocks/content-blocks';

// Update fixture type annotations:
export const introductionI1Fixture: IntroductionI1Block = { ... };
export const introductionI1MinimalFixture: IntroductionI1Block = { ... };
export const introductionI1MaximalFixture: IntroductionI1Block = { ... };
```

**Verification**: Import resolves; `npx tsc --noEmit` clears error on line 6.

---

### Error Group 4: ListItem String → Object

**Files**:
- `__tests__/fixtures/javascript-intro.ts` (lines 47, 61-64)
- `__tests__/fixtures/nested-layout.ts` (lines 52, 65)

**Root Cause**: Fixtures use `items: string[]`, but canonical type expects `items: ListItem[]`.

**Fix for `javascript-intro.ts`**:
```typescript
// Line 47 (block_list_where):
items: [
  { text: 'Client-Side' },
  { text: 'Server-Side' },
]

// Lines 61-64 (block_list_characteristics):
items: [
  { text: 'High-level' },
  { text: 'Dynamically Typed' },
  { text: 'Event-Driven' },
]
```

**Fix for `nested-layout.ts`**:
```typescript
// Line 52 (list-react-pros):
items: [
  { text: 'Large ecosystem' },
  { text: 'Strong community' },
  { text: 'Flexible' },
]

// Line 65 (list-react-cons):
items: [
  { text: 'Steep learning curve' },
  { text: 'JSX syntax' },
]
```

**Verification**: All list items compile; 8 errors cleared.

---

### Error Group 5: ComparisonFeature String → Object

**File**: `__tests__/fixtures/nested-layout.ts` (line 112)

**Root Cause**: Fixture uses `features: string[]` and separate `rows`, but canonical type expects `features: ComparisonFeature[]`.

**Current structure** (WRONG):
```typescript
{
  id: 'comparison-1',
  type: 'comparison',
  content: {
    title: 'Feature Comparison',
    entities: ['React', 'Vue'],
    features: ['Learning Curve', 'Performance', 'Ecosystem'],  // ← string[]
    rows: [
      ['Moderate-Steep', 'Easy-Moderate'],
      ['Excellent', 'Excellent'],
      ['Very Large', 'Growing'],
    ],
  },
}
```

**Fix**:
```typescript
{
  id: 'comparison-1',
  type: 'comparison',
  content: {
    title: 'Feature Comparison',
    entities: ['React', 'Vue'],
    features: [
      { name: 'Learning Curve', values: ['Moderate-Steep', 'Easy-Moderate'] },
      { name: 'Performance', values: ['Excellent', 'Excellent'] },
      { name: 'Ecosystem', values: ['Very Large', 'Growing'] },
    ],
    // rows field removed — it doesn't exist in canonical type
  },
}
```

**Verification**: 3 errors cleared (line 112).

---

### Error Group 6: TableColumn key → id

**File**: `__tests__/fixtures/table-tutorial.ts` (lines 30-32)

**Root Cause**: Fixture uses `key` field, but canonical type uses `id`.

**Fix**:
```typescript
columns: [
  { id: 'type', label: 'Type', alignment: 'left' },
  { id: 'description', label: 'Description', alignment: 'left' },
  { id: 'example', label: 'Example', alignment: 'center' },
]
```

**Verification**: 3 errors cleared.

---

### Error Group 7: TableRow Structure Transformation

**File**: `__tests__/fixtures/table-tutorial.ts` (lines 36, 41, 46, 51, 56)

**Root Cause**: Fixture uses `Record<string, string>` rows, but canonical type uses `{ id, cells: TableCell[] }`.

**Fix**: Transform each row from flat object to structured cells:
```typescript
rows: [
  {
    id: 'row_1',
    cells: [
      { columnId: 'type', value: 'String' },
      { columnId: 'description', value: 'Text data' },
      { columnId: 'example', value: '"Hello"' },
    ],
  },
  {
    id: 'row_2',
    cells: [
      { columnId: 'type', value: 'Number' },
      { columnId: 'description', value: 'Numeric data' },
      { columnId: 'example', value: '42' },
    ],
  },
  {
    id: 'row_3',
    cells: [
      { columnId: 'type', value: 'Boolean' },
      { columnId: 'description', value: 'True or false' },
      { columnId: 'example', value: 'true' },
    ],
  },
  {
    id: 'row_4',
    cells: [
      { columnId: 'type', value: 'Undefined' },
      { columnId: 'description', value: 'Variable declared but not assigned' },
      { columnId: 'example', value: 'undefined' },
    ],
  },
  {
    id: 'row_5',
    cells: [
      { columnId: 'type', value: 'Null' },
      { columnId: 'description', value: 'Intentional absence of value' },
      { columnId: 'example', value: 'null' },
    ],
  },
]
```

**Verification**: 5 errors cleared.

---

### Error Group 8: Invalid Definition Block

**File**: `__tests__/fixtures/table-tutorial.ts` (line 68)

**Root Cause**: Fixture uses inline `{ term, definition, example }` structure that doesn't match any canonical block type.

**Current structure** (WRONG):
```typescript
{
  id: 'definition1',
  type: 'definition',
  content: {
    term: 'Primitive Type',
    definition: 'A data type that is not an object and has no methods.',
    example: 'Numbers, strings, and booleans are primitive types.',
  },
}
```

**Analysis**: The canonical DefinitionD1Block has a much richer structure with `content.page.*` wrapping.

**Fix Option A**: Replace with CalloutBlock (semantically closer for inline definitions):
```typescript
{
  id: 'definition1',
  type: 'callout',
  content: {
    variant: 'info',
    title: 'Primitive Type',
    text: 'A data type that is not an object and has no methods. Numbers, strings, and booleans are primitive types.',
  },
}
```

**Fix Option B**: Use proper DefinitionD1Block structure (complex):
```typescript
{
  id: 'definition1',
  type: 'definition',
  version: 'D1',
  content: {
    page: {
      type: 'definition',
      category: 'JavaScript Concepts',
      title: 'Primitive Type',
      intro: 'Understanding fundamental data types',
      definition: 'A data type that is not an object and has no methods.',
      explanation: [
        'Primitive types are immutable',
        'They are passed by value, not reference',
      ],
      example: {
        language: 'javascript',
        code: 'const num = 42;\nconst str = "hello";\nconst bool = true;',
      },
      characteristics: [
        {
          icon: 'box',
          title: 'Immutable',
          description: 'Cannot be changed after creation',
        },
      ],
      takeaway: 'Numbers, strings, and booleans are primitive types.',
    },
  },
}
```

**Recommendation**: Use Option A (CalloutBlock) as it's semantically appropriate for inline definitions in a tutorial.

**Verification**: Error on line 68 cleared.

---

### Error Group 9: Implicit any in Test File

**File**: `__tests__/introduction-i1.fixture.test.ts` (lines 56, 60, 64)

**Root Cause**: Once the fixture import is fixed (Error Group 3), TypeScript will properly infer types.

**Current code**:
```typescript
page.whereFit.flowCards.forEach(card => {  // ← card: any
  expect(validIcons).toContain(card.icon);
});

page.whereUsed.useCases.forEach(useCase => {  // ← useCase: any
  expect(validIcons).toContain(useCase.icon);
});

page.whyMatters.benefits.forEach(benefit => {  // ← benefit: any
  expect(validIcons).toContain(benefit.icon);
});
```

**Fix**: These will auto-resolve once the fixture has correct types from Error Group 3. If still needed, add explicit annotations:
```typescript
page.whereFit.flowCards.forEach((card: { icon: IntroductionIconKey; title: string; subtitle: string; highlight?: boolean }) => {
  expect(validIcons).toContain(card.icon);
});
```

**However**, after fixing the import in Error Group 3, these should infer correctly.

**Verification**: Errors on lines 56, 60, 64 cleared after fixture type is correct.

---

## Summary of Changes

| Error Group | Files | Root Cause | Change Type |
|-------------|-------|------------|-------------|
| 1 | document.test.ts | schemaVersion inference | Add `as const` or use constant |
| 2 | code-tutorial.ts | ExampleBlock field name | `output` → `expectedOutput` |
| 3 | introduction-i1.fixture.ts | Stale import path | Update import to `../../blocks/content-blocks` |
| 4 | javascript-intro.ts, nested-layout.ts | ListItem structure | `string[]` → `ListItem[]` |
| 5 | nested-layout.ts | ComparisonFeature structure | Transform features + rows |
| 6 | table-tutorial.ts | TableColumn field | `key` → `id` |
| 7 | table-tutorial.ts | TableRow structure | Flat object → structured cells |
| 8 | table-tutorial.ts | Invalid definition block | Replace with CalloutBlock |
| 9 | introduction-i1.fixture.test.ts | Implicit any | Auto-resolves from #3 |

**Total Errors**: 29
**Files to Modify**: 5 fixture files + 1 test file
**Production Files Modified**: 0 (TEST/FIXTURE ONLY)

---

## Implementation Order

1. **Fix imports** (Error Group 3) — unblocks type inference
2. **Fix schemaVersion** (Error Group 1) — simple type assertions
3. **Fix ListItem** (Error Group 4) — straightforward string → object
4. **Fix ComparisonFeature** (Error Group 5) — requires restructuring
5. **Fix TableColumn** (Error Group 6) — field rename
6. **Fix TableRow** (Error Group 7) — significant restructuring
7. **Fix ExampleBlock** (Error Group 2) — field rename
8. **Fix invalid definition** (Error Group 8) — block replacement
9. **Verify test inference** (Error Group 9) — should auto-resolve

---

## Verification Commands

After each fix group:
```bash
cd e:\onlinewebsites\quiz-platform\packages\types
npx tsc --noEmit
```

**Success criterion**: Zero TypeScript errors.

After all fixes:
```bash
npm run test
```

**Success criterion**: All tests pass (currently 220 passing).

---

## Critical Rule

**DO NOT MODIFY PRODUCTION TYPE FILES** unless investigation reveals an internal inconsistency in the canonical types themselves.

This is a **TEST/FIXTURE ALIGNMENT** task. The canonical types in `blocks/content.ts`, `blocks/content-blocks.ts`, and `document.ts` are CORRECT. The fixtures are STALE.

---

## Files to Modify

1. `packages/types/src/tutorial-rich-document/__tests__/document.test.ts`
2. `packages/types/src/tutorial-rich-document/__tests__/fixtures/code-tutorial.ts`
3. `packages/types/src/tutorial-rich-document/__tests__/fixtures/introduction-i1.fixture.ts`
4. `packages/types/src/tutorial-rich-document/__tests__/fixtures/javascript-intro.ts`
5. `packages/types/src/tutorial-rich-document/__tests__/fixtures/nested-layout.ts`
6. `packages/types/src/tutorial-rich-document/__tests__/fixtures/table-tutorial.ts`

**Production files to modify**: **NONE** (unless internal inconsistency discovered during implementation).
