# Tutorial Rich Document Fixture Repair

Fixture and test alignment for the tutorial-rich-document package, bringing 6 test files into compliance with current TypeScript contracts.

**Watch for:** One production-code consideration around the DefinitionD1Block replacement (confirmed). All other changes are straightforward contract alignment.

**Verdict**: APPROVED

## High-level view

The schemaVersion literal-type issue was resolved with `as const` assertions rather than widening the type contract. The introduction block import was corrected to point to the canonical `content-blocks` module. List fixtures were transformed from string arrays to the structured `ListItem` format with `{ text }` shape. Comparison features were restructured from parallel arrays into the integrated `ComparisonFeature` format. Table fixtures were updated to use `id` instead of `key` for columns and the structured cell format for rows. Card grid blocks gained required `id` fields and moved `columns` from content to presentation config. The definition block was replaced with a CalloutBlock because the canonical DefinitionD1Block requires a complex page structure with 10+ fields that the fixture didn't populate.

<details>
<summary>Issues (0)</summary>

No blocking issues. All changes align with canonical contracts without weakening the type system.

</details>

<details>
<summary>Details</summary>

## Literal type preservation via const assertions

The two inline test fixtures in `document.test.ts` originally wrote `schemaVersion: 1`, which TypeScript inferred as `number`. The canonical `TutorialDocument.schemaVersion` expects the literal type `1` (via `typeof CURRENT_SCHEMA_VERSION`). Adding `as const` to each fixture preserves the literal type without modifying any production contracts. This is the correct fix — the alternative would have been widening the production type to accept `number`, which would weaken type safety. (confirmed)

```typescript
const docWithCode = {
  schemaVersion: 1 as const,
  blocks: [ /* ... */ ]
};
```

## Introduction block import correction

Three fixtures in `introduction-i1.fixture.ts` imported from a non-existent `../../blocks/introduction` module using a non-existent type `IIntroductionBlock`. The canonical type is `IntroductionI1Block` exported from `../../blocks/content-blocks`. (confirmed)

## List item structure transformation

Four list blocks across `javascript-intro.ts` and `nested-layout.ts` used `items: string[]`, but the canonical `ListBlock.content.items` expects `ListItem[]` with shape `{ text: string, children?: ListItem[] }`. Each string was wrapped in an object:

```typescript
// Before
items: ['Client-Side', 'Server-Side']

// After
items: [
  { text: 'Client-Side' },
  { text: 'Server-Side' },
]
```

(confirmed)

## Comparison feature restructuring

The comparison block in `nested-layout.ts` used separate `features: string[]` and `rows: string[][]` fields. The canonical `ComparisonBlock.content.features` expects `ComparisonFeature[]` with shape `{ name: string, values: string[] }`, and the `rows` field doesn't exist in the canonical type. The fixture was restructured to merge feature names with their corresponding row values:

```typescript
// Before
features: ['Learning Curve', 'Performance', 'Ecosystem'],
rows: [
  ['Moderate-Steep', 'Easy-Moderate'],
  ['Excellent', 'Excellent'],
  ['Very Large', 'Growing'],
],

// After
features: [
  { name: 'Learning Curve', values: ['Moderate-Steep', 'Easy-Moderate'] },
  { name: 'Performance', values: ['Excellent', 'Excellent'] },
  { name: 'Ecosystem', values: ['Very Large', 'Growing'] },
],
```

(confirmed)

## Table column and row structure updates

Table fixtures in `table-tutorial.ts` used `key` for columns and a flat object structure for rows. The canonical types require `id` for `TableColumn` and a structured `{ id, cells: TableCell[] }` format for `TableRow`, where each cell contains `{ columnId, value }`:

```typescript
// Column: Before
{ key: 'type', label: 'Type', alignment: 'left' }

// Column: After
{ id: 'type', label: 'Type', alignment: 'left' }

// Row: Before
{
  type: 'String',
  description: 'Text data',
  example: '"Hello"',
}

// Row: After
{
  id: 'row_1',
  cells: [
    { columnId: 'type', value: 'String' },
    { columnId: 'description', value: 'Text data' },
    { columnId: 'example', value: '"Hello"' },
  ],
}
```

(confirmed)

## Card grid presentation config correction

The card grid block in `nested-layout.ts` had two issues: Card objects were missing the required `id` field, and the `columns` field was incorrectly placed in `content` instead of `presentation`. Both cards gained `id` fields, and `columns: 2` was moved from `content` to `presentation`. (confirmed)

## Definition block replacement

The fixture in `table-tutorial.ts` used an inline structure `{ term, definition, example }` that doesn't match any canonical block type. The canonical `DefinitionD1Block` requires a complex page structure with 10+ fields: `type`, `category`, `title`, `intro`, `definition`, `explanation` array, `example` object with `language` and `code`, `characteristics` array with icon/title/description, and `takeaway`. Rather than fabricating values for the missing required fields, the fixture was replaced with a semantically appropriate `CalloutBlock` with `variant: 'info'`, merging the term into `title` and the definition/example into `text`. (confirmed)

The trade-off: the fixture no longer tests DefinitionD1Block. If DefinitionD1Block needs fixture coverage, a separate fixture should be created with the full required structure.

## Example block field name

The code tutorial fixture in `code-tutorial.ts` used `output` instead of the canonical `expectedOutput` field name. (confirmed)

</details>

<details>
<summary>File map</summary>

**6 test files changed:**

- `packages/types/src/tutorial-rich-document/__tests__/document.test.ts` — added `as const` to two inline fixtures
- `packages/types/src/tutorial-rich-document/__tests__/fixtures/introduction-i1.fixture.ts` — corrected import path and type annotation
- `packages/types/src/tutorial-rich-document/__tests__/fixtures/code-tutorial.ts` — renamed `output` to `expectedOutput`
- `packages/types/src/tutorial-rich-document/__tests__/fixtures/javascript-intro.ts` — transformed list items to structured format
- `packages/types/src/tutorial-rich-document/__tests__/fixtures/nested-layout.ts` — transformed lists, comparison features, card IDs, and presentation config
- `packages/types/src/tutorial-rich-document/__tests__/fixtures/table-tutorial.ts` — renamed column `key` to `id`, restructured rows, replaced definition block

**0 production files changed.**

Full diff: `git diff ca615ce7~1 ca615ce7`

</details>
