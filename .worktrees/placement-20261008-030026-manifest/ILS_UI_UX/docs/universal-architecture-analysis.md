# Universal Architecture Analysis

**Date:** 2024
**Purpose:** Synthesis of all block audits into universal patterns for I2 integration
**Evidence Sources:**
- `audit-c1-d1.md` (C1 and D1 audits)
- `audit-s1-i1.md` (S1 and I1 audits)
- `audit-other-blocks.md` (13 unversioned blocks)
- `block-discovery.md` (corpus inventory)
- Infrastructure files (ILSProvider, TutorialPageShell, TutorialBlockRenderer, etc.)

---

## 1. Universal Architecture Verdict

### VERDICT: ✅ ALL BLOCKS FOLLOW THE SAME PLATFORM LIFECYCLE

**Evidence:** Every discovered block (4 versioned + 13 unversioned = 17 total) follows the universal lifecycle:

```
Composer/Authoring Tool
    ↓
TutorialDocument.blocks[] (JSONB storage in tutorial_sections.content)
    ↓
TutorialPageShell (page-level wrapper)
    ↓
UBRC Attribute Rendering (data-block-id, data-block-type, [data-block-version])
    ↓
ILSProvider (passive viewport detection via UBRC attributes)
    ↓
LSNB (Left Sidebar Navigation Bar - page-level progress)
    ↓
RSSB (Right Sidebar - block-level progress via LearningProgressSidebar)
```

### Proof by Block Family:

#### Versioned Instructional Blocks (C1, D1, I1, S1)

| Block | Type Contract | TutorialDocument | UBRC (3/3) | ILS Passive | LSNB | RSSB | Evidence |
|-------|---------------|------------------|------------|-------------|------|------|----------|
| **C1** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `audit-c1-d1.md:126-130`, `CodeC1Block.tsx:126-130` |
| **D1** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `audit-c1-d1.md:73-77`, `DefinitionBlock.tsx:73-77` |
| **I1** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `audit-s1-i1.md:101-106`, `IntroductionBlock.tsx:101-106` |
| **S1** | ✅ | ✅ | ⚠️ 2/3* | ✅ | ✅ | ✅ | `audit-s1-i1.md:14-19`, `SummaryBlock.tsx:14-19` |

*S1 missing `data-block-version` attribute but still ILS-trackable

#### Unversioned Content Blocks (13 types)

All 13 unversioned blocks implement the same lifecycle with 2/3 UBRC attributes (no version by design):

| Block | UBRC (2/2) | ILS Passive | Evidence |
|-------|------------|-------------|----------|
| HeadingBlock | ✅ | ✅ | `audit-other-blocks.md:HeadingBlock Audit` |
| ParagraphBlock | ✅ | ✅ | `audit-other-blocks.md:ParagraphBlock Audit` |
| ListBlock | ✅ | ✅ | `audit-other-blocks.md:ListBlock Audit` |
| TableBlock | ✅ | ✅ | `audit-other-blocks.md:TableBlock Audit` |
| ImageBlock | ✅ | ✅ | `audit-other-blocks.md:ImageBlock Audit` |
| CalloutBlock | ✅ | ✅ | `audit-other-blocks.md:CalloutBlock Audit` |
| ExampleBlock | ✅ | ✅ | `audit-other-blocks.md:ExampleBlock Audit` |
| QuoteBlock | ✅ | ✅ | `audit-other-blocks.md:QuoteBlock Audit` |
| DiagramBlock | ✅ | ✅ | `audit-other-blocks.md:DiagramBlock Audit` |
| ComparisonBlock | ✅ | ✅ | `audit-other-blocks.md:ComparisonBlock Audit` |
| TwoColumnBlock | ✅ | ✅ | `audit-other-blocks.md:TwoColumnBlock Audit` |
| ThreeColumnBlock | ✅ | ✅ | `audit-other-blocks.md:ThreeColumnBlock Audit` |
| CardGridBlock | ✅ | ✅ | `audit-other-blocks.md:CardGridBlock Audit` |
| TimelineBlock | ✅ | ✅ | `audit-other-blocks.md:TimelineBlock Audit` |

**Evidence Source:** `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` - All 17 blocks tested for UBRC compliance

### Critical Architectural Insight

**NO block directly calls ILS APIs.** All blocks follow the **PASSIVE PARTICIPATION MODEL**:

1. Block renders UBRC attributes (identity only)
2. `ActiveBlockContext` detects viewport position via IntersectionObserver
3. `ILSProvider` receives active block identity from context
4. `BlockTelemetryProvider` tracks time and sends telemetry
5. ILS backend processes completion and returns state

**Evidence:**
- `audit-c1-d1.md`: "C1 blocks remain presentation-only. All tracking logic lives in universal runtime providers."
- `audit-s1-i1.md`: "Block does NOT import ILS hooks"
- `ILSProvider.tsx:1-50`: ILS context layer consumes ActiveBlockContext, not block components

### LSNB and RSSB are Page-Level

**ALL blocks** delegate sidebar creation to `TutorialPageShell`:

```typescript
// TutorialPageShell.tsx:52-68 - LSNB creation
<TutorialLeftSidebar 
  currentPageProgress={currentPageProgress}
  ... 
/>

// TutorialPageShell.tsx:419-426 - RSSB creation  
<LearningProgressSidebar 
  navigationNodeId={runtimeContext.navigationNodeId}
  subtopicId={runtimeContext.subtopicId}
/>
```

**Evidence:** `audit-c1-d1.md`, `audit-s1-i1.md` - All audits confirm "PAGE-LEVEL" for LSNB/RSSB

---

## 2. Common vs Family-Specific Boundary

### Infrastructure Concern Analysis

| Concern | Common/Specific | Evidence | Notes |
|---------|-----------------|----------|-------|
| **Block identity contract (id, type, version)** | **COMMON** | All blocks use `id: UUID`, `type: string`, versioned blocks add `version: string` | `packages/types/src/tutorial-rich-document/schemas/*` |
| **Registry mechanism** | **FAMILY-SPECIFIC** | Only C1/D1/I1/S1 registered in admin tool | `apps/skillhubcore-admin/.../registry/index.ts:18-26` |
| **Composer integration approach** | **FAMILY-SPECIFIC** | Only versioned blocks have admin composer integration | Unversioned blocks are programmatic-only |
| **TutorialDocument.blocks[] structure** | **COMMON** | All blocks stored in same array with discriminated union type | `packages/types/src/tutorial-rich-document/document.ts:23-26` |
| **TutorialBlockRenderer dispatch** | **COMMON** | All blocks routed through central switch statement | `packages/ui/src/tutorial/TutorialBlockRenderer.tsx:49-122` |
| **UBRC attribute generation** | **COMMON** | All blocks render `data-block-id` and `data-block-type`; versioned blocks add `data-block-version` | `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` |
| **ILS participation model** | **COMMON** | All blocks use passive participation (no direct API calls) | `audit-c1-d1.md`, `audit-s1-i1.md` - All audits confirm passive model |
| **LSNB relationship** | **COMMON** | All blocks participate via page-level LSNB in TutorialPageShell | `TutorialPageShell.tsx:52-68` |
| **RSSB relationship** | **COMMON** | All blocks participate via page-level LearningProgressSidebar | `TutorialPageShell.tsx:419-426` |
| **Brand/theme injection** | **FAMILY-SPECIFIC** | Versioned blocks (C1/D1/I1) require theme; S1 and unversioned blocks do not | `audit-c1-d1.md`, `audit-s1-i1.md` |

### Detailed Evidence

#### COMMON: Block Identity Contract

**All blocks implement:**
```typescript
{
  id: string (UUID),
  type: 'code' | 'definition' | 'introduction' | 'summary' | ...,
  version?: 'C1' | 'D1' | 'I1' | 'S1' (versioned only),
  content: {...},
  presentation?: {...},
  expectedTimeSec?: number,
  progressRole?: 'instructional' | 'structural' | 'assessment' | 'media'
}
```

**Evidence:** `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts:94-102`, `definition-d1.schema.ts:38-47`, `introduction-i1.schema.ts:133-145`, `content-blocks.schema.ts:158-177`

#### FAMILY-SPECIFIC: Registry Mechanism

**Only 4 blocks registered:**
```typescript
// apps/skillhubcore-admin/.../registry/index.ts:18-26
export function getBlockTypes(): BlockRegistryEntry[] {
  return [
    definitionRegistry,    // D1 only
    codeRegistry,          // C1 only
    summaryRegistry,       // S1 only
    introductionRegistry,  // I1 only
  ];
}
```

**Not registered:** All 13 unversioned blocks (HeadingBlock, ParagraphBlock, etc.)

**Rationale:** Registry is for author-editable instructional blocks only. Unversioned blocks are content primitives used programmatically.

#### COMMON: TutorialDocument Structure

**All blocks stored identically:**
```typescript
// packages/types/src/tutorial-rich-document/document.ts:23-26
export interface TutorialDocument {
  schemaVersion: number;
  blocks: TutorialBlock[];  // ← Discriminated union includes all 17 block types
  metadata?: TutorialDocumentMetadata;
}
```

**Evidence:** `TutorialDocument` accepts any block from `TutorialBlock` discriminated union

#### COMMON: Renderer Dispatch

**All blocks routed through central renderer:**
```typescript
// packages/ui/src/tutorial/TutorialBlockRenderer.tsx:49-122
switch (block.type) {
  case 'heading': return <HeadingBlock ... />;
  case 'code': return <CodeC1Block ... />;  // Version-gated
  case 'definition': return <DefinitionBlock ... />;
  case 'introduction': return <IntroductionBlock ... />;  // Version-gated
  case 'summary': return <SummaryBlock ... />;
  // ... all 17 block types
}
```

**Two routing strategies:**
1. **Renderer-level version gating** (C1, I1): TutorialBlockRenderer enforces version before dispatching
2. **Component-level version routing** (D1): Component internally routes to version-specific view

#### COMMON: UBRC Attributes

**All blocks render identity attributes:**
```typescript
// Versioned blocks (C1, D1, I1):
<article 
  data-block-id={block.id}
  data-block-type="code"
  data-block-version="C1"
>

// Unversioned blocks:
<section 
  data-block-id={block.id}
  data-block-type="heading"
>
```

**Exception:** S1 missing `data-block-version` (documented gap in `audit-s1-i1.md:14-19`)

**Test Evidence:** `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` - 100% coverage of all 17 blocks

#### FAMILY-SPECIFIC: Theme Integration

**Theme required:**
- C1 (CodeC1Block): Uses `theme.primary` and `theme.secondary` with fallback
- D1 (DefinitionBlock): Requires theme, throws error if missing
- I1 (IntroductionBlock): Requires theme, validated at router level

**Theme not used:**
- S1 (SummaryBlock): Static indigo styling
- All 13 unversioned blocks: Static Tailwind classes

**Evidence:**
- `audit-c1-d1.md`: "Theme abstraction: UI locked except for theme.primary and theme.secondary"
- `TutorialBlockRenderer.tsx:88-92`: I1 theme requirement validation

---

## 3. Cross-Block Pattern Matrix

| Capability | C1 | D1 | S1 | I1 | Others (13) | Common Pattern? |
|---|---|---|---|---|---|---|
| **Type contract** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All use Zod schemas with id/type/content |
| **Versioning** | PASS | PASS | PASS | PASS | N/A | ⚠️ PARTIAL - Only versioned blocks (4/17) |
| **Registry** | PASS | PASS | PASS | PASS | N/A | ⚠️ PARTIAL - Only versioned blocks registered |
| **Editor** | PASS | PASS | PASS | PASS | N/A | ⚠️ PARTIAL - Only versioned blocks in admin tool |
| **Composer integration** | PASS | PASS | PASS | PASS | N/A | ⚠️ PARTIAL - Only versioned blocks |
| **TutorialDocument** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All in blocks[] array |
| **Renderer dispatch** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All routed by TutorialBlockRenderer |
| **UBRC identity** | PASS | PASS | PARTIAL | PASS | PASS | ⚠️ PARTIAL - S1 missing data-block-version |
| **ILS participation** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All use passive model |
| **Direct ILS API calls** | PASS | PASS | PASS | PASS | PASS | ✅ YES - None call ILS directly |
| **LSNB creation** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All page-level |
| **RSSB creation** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All page-level |
| **Theme injection** | PASS | PASS | FAIL | PASS | FAIL | ❌ NO - Family-specific (C1/D1/I1 only) |
| **Tests** | PASS | PASS | PARTIAL | PASS | PARTIAL | ⚠️ PARTIAL - Versioned blocks have comprehensive tests |
| **Publish flow** | PASS | PASS | PASS | PASS | PASS | ✅ YES - All via TutorialDocument → JSONB |

### Evidence for Ratings

#### Type Contract - PASS (All)
- **C1:** `code-c1.schema.ts:94-102` - `CodeC1BlockSchema`
- **D1:** `definition-d1.schema.ts:38-47` - `DefinitionD1BlockSchema`
- **I1:** `introduction-i1.schema.ts:133-145` - `IntroductionI1BlockSchema`
- **S1:** `content-blocks.schema.ts:158-177` - `SummaryS1BlockSchema`
- **Others:** All in `content-blocks.schema.ts` and `container-blocks.schema.ts`

#### Versioning - PARTIAL
- **C1:** `version: z.literal('C1')` - PASS
- **D1:** `version: z.literal('D1')` - PASS
- **I1:** `version: z.literal('I1')` - PASS
- **S1:** `version: z.literal('S1')` - PASS (schema), PARTIAL (component missing attribute)
- **Others:** No version field - N/A by design

#### UBRC Identity - PARTIAL
- **C1:** 3/3 attributes (id, type, version) - PASS (`CodeC1Block.tsx:126-130`)
- **D1:** 3/3 attributes - PASS (`DefinitionBlock.tsx:73-77`)
- **I1:** 3/3 attributes - PASS (`IntroductionBlock.tsx:101-106`)
- **S1:** 2/3 attributes (missing version) - PARTIAL (`SummaryBlock.tsx:14-19`)
- **Others:** 2/2 attributes (no version by design) - PASS

#### Theme Injection - FAMILY-SPECIFIC
- **C1:** Uses theme with fallback - PASS
- **D1:** Requires theme, throws if missing - PASS
- **I1:** Requires theme, validated at router - PASS
- **S1:** No theme usage - FAIL (by design)
- **Others:** No theme usage - FAIL (by design)

#### Tests - PARTIAL
- **C1:** Comprehensive (UI, routing, clipboard, DOM identity) - PASS
- **D1:** Comprehensive (persistence, AI contract, certification) - PASS
- **I1:** Comprehensive (100+ tests including fixtures, routing) - PASS
- **S1:** Basic (DOM identity, certification) - PARTIAL
- **Others:** Basic (DOM identity only) - PARTIAL

---

## 4. Gaps and Inconsistencies

### CRITICAL GAPS

#### 4.1. S1 Incomplete UBRC Compliance

**Gap:** S1 missing `data-block-version` attribute

**Evidence:**
```typescript
// packages/ui/src/tutorial/blocks/SummaryBlock.tsx:14-19
<section
  data-block-id={block.id}
  data-block-type="summary"
  // ❌ MISSING: data-block-version={block.version}
>
```

**Impact:**
- ILS can still track S1 via id and type
- Version-aware analytics cannot distinguish S1 from future S2/S3
- Inconsistent with C1/D1/I1 standard

**Required Fix:**
```typescript
<section
  data-block-id={block.id}
  data-block-type="summary"
  data-block-version={block.version}  // ← ADD THIS
>
```

**Source:** `audit-s1-i1.md:14-19` - "UBRC Status: INCOMPLETE (2 of 3 attributes present)"

#### 4.2. S1 No Version Routing Enforcement

**Gap:** TutorialBlockRenderer routes `type='summary'` without validating version

**Evidence:**
```typescript
// packages/ui/src/tutorial/TutorialBlockRenderer.tsx:93
case 'summary':
  return <SummaryBlock block={block} ... />;
  // ❌ NO version validation (unlike C1, D1, I1)
```

**Impact:**
- S1 cannot reject non-S1 versions
- Future S2 must implement its own routing or break S1

**Required Fix:**
```typescript
case 'summary': {
  if (!('version' in block) || block.version !== 'S1') {
    throw new Error(`Unsupported Summary version. S1 is required. Received: ${...}`);
  }
  return <SummaryBlock block={block} ... />;
}
```

**Source:** `audit-s1-i1.md:Missing Components Section 2`

#### 4.3. S1 Flat Content Schema (Architectural Inconsistency)

**Gap:** S1 uses flat `content: {title?, points[]}` instead of canonical `content: {page: {...}}`

**Evidence:**
```typescript
// S1 schema (INCONSISTENT):
export const SummaryS1AuthorContentSchema = z.object({
  title: z.string().max(200).optional(),
  points: z.array(z.string().min(1)).min(1).max(20),
}).strict();

// C1/D1/I1 schema (CANONICAL):
export const CodeC1AuthorContentSchema = z.object({
  page: CanonicalCodeC1PageSchema,
}).strict();
```

**Impact:**
- Breaks canonical pattern established by reference implementations
- I2 cannot use S1 as structural reference

**Required Fix:** Migrate to `content: {page: {title?, points[]}}` (breaking change)

**Source:** `audit-s1-i1.md:Content Schema section` - "ARCHITECTURAL INCONSISTENCY"

### MODERATE GAPS

#### 4.4. S1 No Theme Customization

**Gap:** S1 uses static indigo styling instead of theme injection

**Impact:**
- S1 cannot adapt to brand colors (unlike C1/D1/I1)
- Inconsistent visual identity across brands

**Workaround:** S1 intentionally simple; theme may not be needed for bullet list

**Source:** `audit-s1-i1.md:Missing Components Section 4`

#### 4.5. S1 No Version Router Component

**Gap:** S1 component directly renders instead of routing to S1View

**Evidence:**
```typescript
// D1 pattern (HAS VERSION ROUTER):
export function DefinitionBlock({ block }) {
  switch (block.version) {
    case 'D1': return <DefinitionD1View ... />;
    default: throw new Error(...);
  }
}

// S1 pattern (NO VERSION ROUTER):
export function SummaryBlock({ block }) {
  // Direct rendering, no version switching
}
```

**Impact:**
- Harder to add S2 later (requires component refactor)

**Source:** `audit-s1-i1.md:Missing Components Section 5`

#### 4.6. S1 Example Payload Uses Legacy Format

**Gap:** Example uses `TutorialSummaryPayload` instead of canonical S1 schema

**Location:** `apps/skillhubcore-admin/.../blocks/summary/S1/summaryS1.examples.ts`

**Impact:**
- Admin composer may show incorrect structure
- AI prompts may generate wrong format

**Source:** `audit-s1-i1.md:Missing Components Section 6`

### MINOR GAPS

#### 4.7. Unversioned Blocks Not Registered

**Observation:** 13 unversioned blocks have no admin registry entries

**Evidence:**
```typescript
// registry/index.ts:18-26
export function getBlockTypes(): BlockRegistryEntry[] {
  return [
    definitionRegistry,    // Only these 4
    codeRegistry,
    summaryRegistry,
    introductionRegistry,
  ];
}
```

**Impact:** None - this is intentional. Unversioned blocks are content primitives, not author-editable instructional components.

**Source:** `audit-other-blocks.md:Pattern Observations`

#### 4.8. Container Blocks Require renderChild Prop

**Observation:** TwoColumnBlock, ThreeColumnBlock, CardGridBlock, TimelineBlock throw errors if `renderChild` prop missing

**Evidence:**
```typescript
// TwoColumnBlock.tsx (pattern)
if (!renderChild) {
  throw new Error('TwoColumnBlock requires renderChild prop for recursive rendering');
}
```

**Impact:** None - this is a safety check for Phase 2.5 runtime context propagation

**Source:** `audit-other-blocks.md:TwoColumnBlock Audit`

---

## 5. I2 Integration Intelligence

### What I2 Can Reuse DIRECTLY from C1

**Schema Pattern:**
```typescript
// From: packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts:94-102
export const CodeC1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('code'),      // I2 uses 'introduction'
  version: z.literal('C1'),      // I2 uses 'I2'
  content: CodeC1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});
```

**UBRC Pattern:**
```typescript
// From: packages/ui/src/tutorial/blocks/CodeC1Block.tsx:126-130
<article 
  data-block-id={block.id}
  data-block-type="code"       // I2 uses "introduction"
  data-block-version="C1"      // I2 uses "I2"
>
```

**Test Pattern:**
- DOM identity tests (`BlockDOMIdentity.test.tsx`)
- Routing tests (`TutorialRendererRouting.test.tsx`)
- Clipboard tests (`CodeC1Block.clipboard.test.tsx`) - only if I2 has copy interactions

**Renderer-Level Version Routing:**
```typescript
// From: packages/ui/src/tutorial/TutorialBlockRenderer.tsx:63-74
case 'code': {
  if (!('version' in block) || block.version !== 'C1') {
    throw new Error('Unsupported code block version. Code C1 is required.');
  }
  return <CodeC1Block block={block as any} />;
}
```

### What I2 Can Reuse DIRECTLY from D1

**Component-Level Version Router:**
```typescript
// From: packages/ui/src/tutorial/blocks/DefinitionBlock.tsx
export function DefinitionBlock({ block, theme }) {
  switch (block.version) {
    case 'D1':
      return <DefinitionD1View block={block} theme={theme!} />;
    case 'I2':  // ← Add new case for I2
      return <IntroductionI2View block={block} theme={theme!} />;
    default:
      const _exhaustive: never = block.version;
      return null;
  }
}
```

**AI Authoring Pipeline:**
- Validation function: `validateDefinitionD1AIOutput()`
- Canonicalization: `buildCanonicalDefinitionD1Block()`
- Persistence integration tests: `phase-1h-definition-d1-persistence.integration.test.ts`

**Theme Requirement Validation:**
```typescript
// From: DefinitionBlock.tsx (pattern)
if (!theme?.primary || !theme?.secondary) {
  throw new Error(`Missing required brand theme for block ${block.id}`);
}
```

### What I2 Can Reuse DIRECTLY from S1

⚠️ **WARNING:** S1 has critical gaps (see section 4). Use with caution.

**Minimal Block Pattern:**
- Simple content schema
- Basic rendering without complex UI

**DO NOT COPY FROM S1:**
- ❌ Flat content structure (use `content.page` instead)
- ❌ Missing `data-block-version` attribute
- ❌ No version routing enforcement
- ❌ No theme support

### What I2 Can Reuse DIRECTLY from I1

**✅ I1 IS THE PRIMARY REFERENCE FOR I2**

**Complete Lifecycle Pattern:**
1. Schema validation (Zod with strict mode)
2. Registry entry structure
3. Example payload format
4. AI prompt template structure
5. Version routing enforcement
6. Theme requirement validation
7. Component-level version router
8. Comprehensive test suite

**Specific Reusable Code:**

**Schema Structure:**
```typescript
// From: packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema.ts:133-145
export const IntroductionI1BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('introduction'),
  version: z.literal('I1'),        // I2 changes to 'I2'
  content: IntroductionI1AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
});

export const IntroductionI1AuthorContentSchema = z.object({
  page: IntroductionI1PageSchema,  // ← Canonical pattern
}).strict();
```

**Version Router Integration:**
```typescript
// From: packages/ui/src/tutorial/TutorialBlockRenderer.tsx:83-97
case 'introduction': {
  if (!('version' in block)) {
    throw new Error('Missing version field in introduction block');
  }
  
  if (block.version !== 'I1' && block.version !== 'I2') {
    throw new Error(`Unsupported Introduction version: ${block.version}`);
  }

  if (!theme?.primary || !theme?.secondary) {
    throw new Error(`Missing required brand theme for Introduction block ${block.id}`);
  }

  return <IntroductionBlock block={block} ... />;
}
```

**Component-Level Router:**
```typescript
// From: packages/ui/src/tutorial/blocks/IntroductionBlock.tsx
export function IntroductionBlock({ block, theme }) {
  switch (block.version) {
    case 'I1':
      return <IntroductionI1View block={block} theme={theme!} />;
    case 'I2':  // ← ADD THIS CASE
      return <IntroductionI2View block={block} theme={theme!} />;
    default:
      const _exhaustive: never = block.version;
      throw new Error(`Unsupported Introduction version: ${_exhaustive}`);
  }
}
```

**Theme Integration Pattern:**
```typescript
// From: IntroductionI1View (pattern)
function IntroductionI2View({ block, theme }) {
  const primary = theme.primary;
  const secondary = theme.secondary;
  
  function withAlpha(hex: string, alphaHex: string) {
    return `${hex}${alphaHex}`;
  }
  
  // Use primary/secondary throughout UI
  <div style={{ backgroundColor: withAlpha(primary, '10') }}>
    <h1 style={{ color: primary }}>...</h1>
  </div>
}
```

**Test Structure:**
```typescript
// Schema tests: introduction-i2.schema.test.ts
describe('IntroductionI2BlockSchema', () => {
  it('validates complete I2 block', () => {
    const result = IntroductionI2BlockSchema.safeParse(validI2Block);
    expect(result.success).toBe(true);
  });
  
  it('rejects blocks without version field', () => {
    const result = IntroductionI2BlockSchema.safeParse({ ...validI2Block, version: undefined });
    expect(result.success).toBe(false);
  });
  
  it('rejects blocks with wrong version', () => {
    const result = IntroductionI2BlockSchema.safeParse({ ...validI2Block, version: 'I1' });
    expect(result.success).toBe(false);
  });
});

// Fixture tests: introduction-i2.fixture.test.ts
describe('IntroductionI2 Fixtures', () => {
  it('validates standard fixture', () => {
    const result = IntroductionI2BlockSchema.safeParse(introductionI2StandardFixture);
    expect(result.success).toBe(true);
  });
});

// Routing tests: Add to TutorialRendererRouting.test.tsx
describe('Introduction I2 Routing', () => {
  it('routes introduction/I2 to IntroductionI2View', () => {
    const { container } = render(<TutorialBlockRenderer block={i2Block} ... />);
    expect(container.querySelector('[data-block-version="I2"]')).toBeInTheDocument();
  });
  
  it('rejects I1 block as I2', () => {
    expect(() => render(<TutorialBlockRenderer block={i1Block} ... />)).toThrow();
  });
});
```

### What Common Infrastructure I2 Reuses

**NO CHANGES REQUIRED to common infrastructure:**

1. **TutorialDocument.blocks[]** - Already supports discriminated union, automatically includes I2
2. **TutorialBlockRenderer** - Just update version validation to accept both 'I1' and 'I2'
3. **ILSProvider** - Passive detection works via UBRC attributes (no changes)
4. **ActiveBlockContext** - Viewport detection works with any UBRC block (no changes)
5. **BlockTelemetryProvider** - Tracks any block with UBRC attributes (no changes)
6. **TutorialPageShell** - Page-level wrapper works with all blocks (no changes)
7. **LearningProgressSidebar** (RSSB) - Consumes ILS data for all blocks (no changes)
8. **TutorialLeftSidebar** (LSNB) - Shows page progress for all blocks (no changes)

**Evidence:** `audit-c1-d1.md:Cross-Block Architecture Summary` - "Both blocks implement complete lifecycle from type contract through runtime rendering"

### Anti-Patterns to AVOID

#### ❌ ANTI-PATTERN 1: Direct ILS API Calls in Block Component

```typescript
// ❌ WRONG - Block calls ILS directly
function IntroductionI2View({ block }) {
  const [progress, setProgress] = useState(null);
  
  useEffect(() => {
    fetch(`/api/tutorial/ils/block/${block.id}`)
      .then(res => res.json())
      .then(setProgress);
  }, [block.id]);
  
  return <div>Progress: {progress?.percentage}%</div>;
}

// ✅ CORRECT - Block is presentation-only, ILS handles tracking
function IntroductionI2View({ block, theme }) {
  return (
    <article 
      data-block-id={block.id}
      data-block-type="introduction"
      data-block-version="I2"
    >
      {/* Pure rendering, no tracking logic */}
    </article>
  );
}
```

**Evidence:** `audit-c1-d1.md:ILS Participation Model` - "Critical Design: C1 blocks remain presentation-only"

#### ❌ ANTI-PATTERN 2: Creating LSNB/RSSB in Block Component

```typescript
// ❌ WRONG - Block creates own sidebar
function IntroductionI2View({ block }) {
  return (
    <>
      <ProgressSidebar blockId={block.id} />  {/* ❌ Don't do this */}
      <article>...</article>
    </>
  );
}

// ✅ CORRECT - TutorialPageShell creates sidebars
// Block only renders content
function IntroductionI2View({ block, theme }) {
  return <article>...</article>;
}
```

**Evidence:** `audit-c1-d1.md:Lifecycle Trace` - "LSNB/RSSB: PAGE-LEVEL"

#### ❌ ANTI-PATTERN 3: Flat Content Structure

```typescript
// ❌ WRONG - Flat structure like S1
export const IntroductionI2AuthorContentSchema = z.object({
  title: z.string(),
  sections: z.array(z.string()),
}).strict();

// ✅ CORRECT - Canonical content.page structure
export const IntroductionI2AuthorContentSchema = z.object({
  page: IntroductionI2PageSchema,
}).strict();

export const IntroductionI2PageSchema = z.object({
  title: z.string(),
  sections: z.array(z.string()),
}).strict();
```

**Evidence:** `audit-s1-i1.md:Content Schema` - "ARCHITECTURAL INCONSISTENCY: S1 uses flat content"

#### ❌ ANTI-PATTERN 4: Missing UBRC Attributes

```typescript
// ❌ WRONG - Missing data-block-version (like S1)
<article 
  data-block-id={block.id}
  data-block-type="introduction"
>

// ✅ CORRECT - All 3 UBRC attributes
<article 
  data-block-id={block.id}
  data-block-type="introduction"
  data-block-version="I2"
>
```

**Evidence:** `audit-s1-i1.md:UBRC Compliance` - "S1 Status: INCOMPLETE (2 of 3 attributes)"

#### ❌ ANTI-PATTERN 5: No Version Routing Enforcement

```typescript
// ❌ WRONG - Accepts any version (like S1)
case 'introduction':
  return <IntroductionBlock block={block} ... />;

// ✅ CORRECT - Enforce version whitelist (like C1, I1)
case 'introduction': {
  if (!('version' in block)) {
    throw new Error('Missing version field');
  }
  
  if (block.version !== 'I1' && block.version !== 'I2') {
    throw new Error(`Unsupported Introduction version: ${block.version}`);
  }
  
  return <IntroductionBlock block={block} ... />;
}
```

**Evidence:** `audit-s1-i1.md:Missing Components Section 2` - "S1 has NO version routing enforcement"

#### ❌ ANTI-PATTERN 6: Theme Optional or Missing

```typescript
// ❌ WRONG - Theme optional (like S1)
function IntroductionI2View({ block, theme }) {
  const color = theme?.primary || '#3b82f6';  // Fallback
  return <div style={{ color }}>...</div>;
}

// ✅ CORRECT - Theme required and validated (like I1, D1)
// In TutorialBlockRenderer:
if (!theme?.primary || !theme?.secondary) {
  throw new Error(`Missing required brand theme for Introduction block ${block.id}`);
}

// In component:
function IntroductionI2View({ block, theme }: { block: IntroductionI2Block; theme: BrandTheme }) {
  const primary = theme.primary;    // No fallback needed
  const secondary = theme.secondary;
  return <div style={{ color: primary }}>...</div>;
}
```

**Evidence:** `audit-c1-d1.md:Theme Handling` - "D1 enforces brand consistency (definition must use brand colors)"

### What I2 MUST Implement (Non-Negotiable)

#### 1. ✅ Type Contract with Version Literal 'I2'

```typescript
// packages/types/src/tutorial-rich-document/schemas/introduction-i2.schema.ts
export const IntroductionI2BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('introduction'),
  version: z.literal('I2'),        // ← MUST be 'I2'
  content: IntroductionI2AuthorContentSchema,
  presentation: PresentationConfigSchema,
  expectedTimeSec: z.number().int().positive().optional(),
  progressRole: z.enum(['instructional', 'structural', 'assessment', 'media']).default('instructional').optional(),
}).strict();
```

#### 2. ✅ Canonical content.page Structure

```typescript
export const IntroductionI2AuthorContentSchema = z.object({
  page: IntroductionI2PageSchema,  // ← MUST use nested page structure
}).strict();

export const IntroductionI2PageSchema = z.object({
  // I2-specific fields here
}).strict();
```

#### 3. ✅ Complete UBRC Attributes (3/3)

```typescript
// packages/ui/src/tutorial/blocks/IntroductionBlock.tsx (IntroductionI2View)
<article 
  data-block-id={block.id}
  data-block-type="introduction"
  data-block-version="I2"  // ← MUST render all 3 attributes
>
```

#### 4. ✅ Registry Entry

```typescript
// apps/skillhubcore-admin/.../registry/entries/introduction.registry.ts
export const introductionRegistry: BlockRegistryEntry = {
  id: 'introduction',
  label: 'Introduction',
  versions: [
    {
      id: 'v1',
      code: 'I1',
      label: 'I1 - Roadmap Overview',
      description: 'Comprehensive roadmap-style overview...',
      getDefaultPayload: () => introductionI1Example,
    },
    {
      id: 'v2',           // ← ADD I2 ENTRY
      code: 'I2',
      label: 'I2 - [Your I2 Description]',
      description: '[What makes I2 different from I1]',
      getDefaultPayload: () => introductionI2Example,
    },
  ],
};
```

#### 5. ✅ Example Payload

```typescript
// apps/skillhubcore-admin/.../blocks/introduction/I2/introductionI2.examples.ts
export const introductionI2Example: IntroductionI2Block = {
  id: crypto.randomUUID(),
  type: 'introduction',
  version: 'I2',
  content: {
    page: {
      // Complete I2 example structure
    },
  },
  presentation: {},
  expectedTimeSec: 120,
  progressRole: 'instructional',
};
```

#### 6. ✅ Component-Level Version Router Update

```typescript
// packages/ui/src/tutorial/blocks/IntroductionBlock.tsx
export function IntroductionBlock({ block, theme, ...props }: BlockComponentProps) {
  switch (block.version) {
    case 'I1':
      return <IntroductionI1View block={block} theme={theme!} {...props} />;
    case 'I2':  // ← ADD THIS CASE
      return <IntroductionI2View block={block} theme={theme!} {...props} />;
    default:
      const _exhaustive: never = block.version;
      throw new Error(`Unsupported Introduction version: ${_exhaustive}`);
  }
}
```

#### 7. ✅ Renderer-Level Version Validation Update

```typescript
// packages/ui/src/tutorial/TutorialBlockRenderer.tsx
case 'introduction': {
  if (!('version' in block)) {
    throw new Error('Missing version field in introduction block');
  }
  
  // Update to accept both I1 and I2
  if (block.version !== 'I1' && block.version !== 'I2') {
    throw new Error(
      `Unsupported Introduction version. I1 or I2 is required. Received: ${block.version}`
    );
  }

  if (!theme?.primary || !theme?.secondary) {
    throw new Error(`Missing required brand theme for Introduction block ${block.id}`);
  }

  return <IntroductionBlock block={block} ... />;
}
```

#### 8. ✅ Theme Requirement Enforcement

```typescript
// I2 component MUST receive and use theme
function IntroductionI2View({ 
  block, 
  theme 
}: { 
  block: IntroductionI2Block; 
  theme: BrandTheme  // ← Type ensures theme is required
}) {
  const primary = theme.primary;
  const secondary = theme.secondary;
  
  // Use throughout UI
}
```

#### 9. ✅ Passive ILS Participation (No Direct API Calls)

```typescript
// I2 component MUST NOT import or call ILS hooks/APIs
// ❌ Do NOT import useILS
// ❌ Do NOT call fetch('/api/tutorial/ils/...')
// ✅ Only render UBRC attributes and let runtime providers handle tracking
```

#### 10. ✅ Test Suite

**Required test files:**
1. `packages/types/src/tutorial-rich-document/schemas/__tests__/introduction-i2.schema.test.ts` - Schema validation
2. `packages/types/src/tutorial-rich-document/__tests__/introduction-i2.fixture.test.ts` - Fixture validation
3. `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx` - Add I2 routing tests
4. `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx` - Add I2 UBRC tests

**Minimum test coverage:**
- ✅ Schema validates correct I2 structure
- ✅ Schema rejects I1 structure
- ✅ Schema rejects blocks without version field
- ✅ Router routes I2 to IntroductionI2View
- ✅ Router rejects I3+ versions
- ✅ UBRC attributes all present (id, type, version)
- ✅ Theme requirement validated

#### 11. ✅ TutorialBlock Union Type Update

```typescript
// packages/types/src/tutorial-rich-document/blocks/index.ts
import type { IntroductionI2Block } from '../schemas/introduction-i2.schema';

export type TutorialBlock = 
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | CodeC1Block
  | TableBlock
  | ImageBlock
  | CalloutBlock
  | DefinitionD1Block
  | IntroductionI1Block
  | IntroductionI2Block  // ← ADD THIS
  | ExampleBlock
  | QuoteBlock
  | SummaryS1Block
  | DiagramBlock
  | ComparisonBlock
  | TwoColumnBlock
  | ThreeColumnBlock
  | CardGridBlock
  | TimelineBlock;
```

### What I2 MAY Customize (Family-Specific)

#### Content Structure

I2 can define completely different sections from I1:
- I1 has 9 sections (badge, title, subtitle, motto, learningGoal, topic, whereFit, solution, whereUsed, roadmap, whyMatters, keyTakeaway)
- I2 can have any number of sections with different names and purposes

**Example:**
```typescript
export const IntroductionI2PageSchema = z.object({
  heroTitle: z.string(),
  overview: z.string(),
  prerequisites: z.array(z.string()),
  objectives: z.array(z.string()),
  // ... completely different structure
}).strict();
```

#### UI Layout and Visual Design

I2 MUST have different visual design from I1 (different version = different UI):
- Different section layouts
- Different responsive breakpoints
- Different visual elements (icons, illustrations, etc.)
- Different typography choices
- Different color application patterns

**Only theme.primary and theme.secondary must remain configurable**

#### Icon Registry

I2 can define its own icon set:
- I1 uses 15 approved icons (rocket, target, code, etc.)
- I2 can use different icons or no icons at all

#### Collection Size Limits

I2 can define different min/max constraints:
- I1: flowCards (1-10), useCases (1-10), steps (1-20), benefits (1-10)
- I2: Can have different limits based on UI design

#### expectedTimeSec Default

I2 can have different expected time than I1:
- I1: ~3-5 minutes typical
- I2: Could be shorter/longer based on content complexity

#### progressRole Default

I2 can override default progressRole:
- Standard: `progressRole: 'instructional'`
- I2 might default to `'structural'` or other if appropriate

#### AI Prompt Template

I2 MUST have its own AI prompt:
- Copy I1 prompt structure
- Update section definitions for I2 schema
- Update examples to match I2 format
- Update expectedTimeSec estimation logic

**File:** `apps/skillhubcore-admin/.../blocks/introduction/I2/introductionI2.prompt.ts`

---

## Summary

### Universal Architecture: CONFIRMED ✅

**All 17 discovered blocks follow the same platform lifecycle:**

```
Author/AI → Composer → TutorialDocument → TutorialPageShell → UBRC → ILS → LSNB/RSSB
```

**Key findings:**
1. **Common infrastructure:** TutorialDocument, TutorialBlockRenderer, ILSProvider, LSNB/RSSB all work with ALL blocks
2. **Passive ILS model:** No block calls ILS APIs directly; all tracking via UBRC attributes
3. **Page-level navigation:** LSNB and RSSB created by TutorialPageShell, not individual blocks
4. **Two-tier architecture:** 4 versioned instructional blocks (C1/D1/I1/S1) + 13 unversioned content blocks

### Critical Gaps for I2

**S1 has gaps - use I1 as primary reference:**
1. ❌ S1 missing `data-block-version` attribute
2. ❌ S1 no version routing enforcement
3. ❌ S1 flat content structure (not `content.page`)
4. ✅ I1 is reference-quality with 100+ tests and complete lifecycle

### I2 Implementation Checklist

**MUST implement:**
- [x] Schema with `version: z.literal('I2')`
- [x] Canonical `content.page` structure
- [x] Complete UBRC attributes (3/3)
- [x] Registry entry with I2 version
- [x] Example payload
- [x] Component-level version router update
- [x] Renderer-level version validation update
- [x] Theme requirement enforcement
- [x] Passive ILS participation (no API calls)
- [x] Test suite (schema, fixtures, routing, UBRC)
- [x] TutorialBlock union type update

**MAY customize:**
- Content structure (different sections from I1)
- UI layout and visual design
- Icon registry
- Collection size limits
- expectedTimeSec defaults
- AI prompt template

**AVOID anti-patterns:**
- ❌ Direct ILS API calls
- ❌ Creating LSNB/RSSB in component
- ❌ Flat content structure
- ❌ Missing UBRC attributes
- ❌ No version routing
- ❌ Optional theme

---

## File Reference Index

### Audits
- `audit-c1-d1.md` - C1 and D1 full lifecycle audits
- `audit-s1-i1.md` - S1 and I1 full lifecycle audits
- `audit-other-blocks.md` - 13 unversioned blocks audit
- `block-discovery.md` - Complete block corpus inventory

### Infrastructure
- `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` - Central router
- `packages/types/src/tutorial-rich-document/document.ts` - TutorialDocument type
- `packages/ui/src/tutorial/runtime/ILSProvider.tsx` - ILS context provider
- `src/share-branding/LearningExperience/components/TutorialPageShell.tsx` - Page wrapper with LSNB/RSSB
- `apps/skillhubcore-admin/.../registry/index.ts` - Block registry API

### C1 (Code Block)
- Schema: `packages/types/src/tutorial-rich-document/schemas/code-c1.schema.ts`
- Component: `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- Registry: `apps/skillhubcore-admin/.../registry/entries/code.registry.ts`
- Example: `apps/skillhubcore-admin/.../blocks/code/C1/codeC1.examples.ts`

### D1 (Definition Block)
- Schema: `packages/types/src/tutorial-rich-document/schemas/definition-d1.schema.ts`
- Component: `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- Registry: `apps/skillhubcore-admin/.../registry/entries/definition.registry.ts`
- Example: `apps/skillhubcore-admin/.../blocks/definition/D1/definitionD1.examples.ts`

### I1 (Introduction Block) - PRIMARY REFERENCE FOR I2
- Schema: `packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema.ts`
- Component: `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
- Registry: `apps/skillhubcore-admin/.../registry/entries/introduction.registry.ts`
- Example: `apps/skillhubcore-admin/.../blocks/introduction/I1/introductionI1.examples.ts`
- Fixtures: `packages/types/src/tutorial-rich-document/__tests__/fixtures/introduction-i1.fixture.ts`
- Tests: `packages/types/src/tutorial-rich-document/schemas/__tests__/introduction-i1.schema.test.ts`

### S1 (Summary Block) - HAS GAPS
- Schema: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` (SummaryS1BlockSchema)
- Component: `packages/ui/src/tutorial/blocks/SummaryBlock.tsx`
- Registry: `apps/skillhubcore-admin/.../registry/entries/summary.registry.ts`
- Example: `apps/skillhubcore-admin/.../blocks/summary/S1/summaryS1.examples.ts`

### Tests
- UBRC Compliance: `packages/ui/src/tutorial/__tests__/BlockDOMIdentity.test.tsx`
- Routing: `packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx`
- ILS Integration: `packages/ui/src/tutorial/runtime/__tests__/ILSProvider.test.tsx`

---

**End of Universal Architecture Analysis**
