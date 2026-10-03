# PROJECT LLM PHASE 1 IMPLEMENTATION CONTRACT

**Document Type:** Forensic Discovery Report  
**Phase:** Project LLM Phase 1A-1T (Introduction Block Vertical Slice)  
**Date:** 2026-10-03  
**Status:** READ-ONLY INVESTIGATION COMPLETE — AWAITING HUMAN APPROVAL FOR IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

This document represents a **complete forensic investigation** of the repository to establish the **exact existing architecture** and **exact missing implementation** required for Project LLM Phase 1: Introduction Block (I1-I6) vertical slice.

**Investigation Scope:** Introduction block family lifecycle from External AI → Project LLM → Composer → Runtime

**Key Finding:** The repository contains a **COMPLETE Introduction I1 implementation** but **NO Project LLM automation layer**. All block generation, validation, and integration workflows are **HUMAN-DRIVEN** through Composer GUI tools.

---

## SECTION 1: EXISTING PROJECT LLM ARTIFACTS

### 1A. Project LLM Documentation

**VERIFIED — Documentation exists:**

```
docs/ubrc/PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1.md
docs/ubrc/PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1-TARGETED-RE-AUDIT.md
docs/ubrc/PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1-FINAL-SEMANTIC-AUDIT.md
docs/ubrc/PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1-CORRECTION-AUDIT.md
ILS_UI_UX/docs/Project LLM.ipynb
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/General.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/Introduction.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/STAGE5_PRODUCTION_EVIDENCE.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/ARCHITECTURE_AUDIT.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/FAMILY_VERSION_MATRIX.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/COMPOSITION_MATRIX.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/PATTERN_CATALOG.md
ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/stage-5/07_COMPOSER_AND_CREATION_PIPELINE.md
```

**Status:** DECLARED — Architecture documentation exists  
**Classification:** Reference architecture, governance framework, educational corpus  
**Authority Level:** Governance (Phase 0.1-0.10 frozen), Architecture (Phase 1A in progress)

**Key Architectural Principles Documented:**

1. **Three Actors:** External AI (Block Factory), Project LLM (Integration Engine), Human (Approval Authority)
2. **Two Handovers:** 
   - Handover A: Project LLM → Human → External AI (Creation Brief)
   - Handover B: External AI → Project LLM (Candidate Package)
3. **Layer Separation:**
   - Layer 1: Generic lifecycle architecture (actor boundaries, governance)
   - Layer 2: Dynamic repository discovery (Project LLM inspects actual implementation)
   - Layer 3: Block-specific Creation Brief (generated per-block)

**Critical Gap:** Documentation describes **intended architecture**, not **implemented system**.

---

### 1B. Project LLM Implementation Services

**NOT FOUND:**

No Python/FastAPI Project LLM service discovered in repository.

**Search Results:**
- No `services/project-llm/` directory
- No `project-llm-service/` package
- No FastAPI applications for Project LLM orchestration
- No LLM provider clients (OpenAI, Anthropic, Gemini) for automated generation
- No candidate block validation services
- No External AI integration endpoints
- No repository discovery automation
- No Creation Brief generation engines

**Status:** NOT_IMPLEMENTED  
**Evidence:** File search, grep across services/, no matches for project-llm service infrastructure

---

### 1C. Creation Brief Implementation

**NOT FOUND:**

No automated Creation Brief generation system discovered.

**What EXISTS:**
- **Manual AI Prompt Templates:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/introduction/I1/introductionI1.prompt.ts`
- Human-readable prompt construction: `getIntroductionI1Prompt(context)` returns formatted string
- Displayed in Composer GUI for **human copy-paste to External AI**

**What DOES NOT EXIST:**
- Automated repository discovery to populate Creation Brief
- External AI API integration to deliver briefs programmatically
- Block-specific brief generation based on runtime inspection
- Dynamic constraint discovery from UBRC/ILS/LSNB/RSSB

**Status:** PARTIAL — Manual prompts exist, automation missing  
**Classification:** Human-driven workflow, not Project LLM automation

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/introduction/I1/introductionI1.prompt.ts`

```typescript
export function getIntroductionI1Prompt(context: TutorialPromptContext): string {
  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS (Pure JSON Content Contract)
    Return ONLY a valid JSON object matching this exact schema:
    { "expectedTimeSec": <AI-estimated-value>, "page": {...} }
    ...`
  );
}
```

**Usage Pattern:**
1. Human selects hierarchy (domain/subject/topic/subtopic/navigationNode) in Composer
2. Composer displays prompt text in read-only text area
3. Human copies prompt manually
4. Human pastes prompt into External AI (ChatGPT, Claude, etc.) separately
5. External AI returns JSON
6. Human copies JSON back into Composer JSON editor
7. Human validates and saves

**Gap:** No automated External AI → Project LLM → Platform pipeline

---

### 1D. Candidate Block Implementation

**NOT FOUND:**

No candidate block submission, validation, or handoff system discovered.

**Search Results:**
- No `/api/project-llm/` endpoints
- No candidate block ingestion workflow
- No External AI → Project LLM handoff mechanism
- No candidate package validation services
- No architecture audit automation
- No adaptation engine

**Status:** NOT_IMPLEMENTED  
**Evidence:** API route inspection, grep for "candidate block" endpoints, no automation discovered

**From Investigation 07 (Composer):**
> Production Evidence: No External AI → candidate block workflow or Project LLM verification/adapter boundary was found in the inspected Composer/creation-pipeline surface.

---

## SECTION 2: INTRODUCTION BLOCK FAMILY — PRODUCTION IMPLEMENTATION

### 2A. Introduction I1 Block — VERIFIED COMPLETE

**Status:** ✅ VERIFIED — Full production implementation exists

**Type System:**

```typescript
// packages/types/src/tutorial-rich-document/blocks/content-blocks.ts

export interface IntroductionI1Page {
  badge: string;
  title: string;
  subtitle: string;
  motto: { lines: [string, string, string, string] };
  learningGoal: string;
  topic: { title: string; description: string; quote: string };
  whereFit: { title: string; description: string; flowCards: Array<{...}> };
  solution: { title: string; description: string; code: {...} };
  whereUsed: { title: string; description: string; useCases: Array<{...}> };
  roadmap: { title: string; description: string; steps: Array<{...}> };
  whyMatters: { title: string; benefits: Array<{...}> };
  keyTakeaway: string;
}

export interface IntroductionI1AuthorContent {
  page: IntroductionI1Page;
}

export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
  content: IntroductionI1AuthorContent;
}

export type IntroductionBlock = IntroductionI1Block;
// Future versions:
// | IntroductionI2Block
// | IntroductionI3Block
// ...
```

**Icon Registry:** Controlled vocabulary of 15 approved Lucide icons
- File: `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
- Type: `IntroductionIconKey`
- Icons: 'book-open', 'target', 'lightbulb', 'route', 'code', 'layers', 'check-circle', 'arrow-right', 'graduation-cap', 'rocket', 'wrench', 'globe', 'zap', 'star', 'box'

---

### 2B. Introduction I2-I6 Blocks — NOT IMPLEMENTED

**Status:** ❌ NOT_IMPLEMENTED

**Evidence:**
1. Type definitions show comment placeholders only:
   ```typescript
   export type IntroductionBlock = IntroductionI1Block;
   // Future versions:
   // | IntroductionI2Block
   // | IntroductionI3Block
   // ...
   ```

2. Renderer explicitly rejects I2+:
   ```typescript
   // packages/ui/src/tutorial/TutorialBlockRenderer.tsx
   case 'introduction': {
     // Introduction I1 is the only supported version
     if (!('version' in block) || block.version !== 'I1') {
       throw new Error(
         `Unsupported Introduction version. I1 is required. Received: ...`
       );
     }
   }
   ```

3. Test explicitly verifies rejection:
   ```typescript
   // packages/ui/src/tutorial/__tests__/TutorialRendererRouting.test.tsx
   it('TEST I3 — rejects unsupported introduction versions (I2+)', () => {
     const i2Block: any = { id: 'i2-block', type: 'introduction', version: 'I2', ... };
     expect(() => TutorialBlockRenderer(...)).toThrow('Unsupported Introduction version');
   });
   ```

4. Registry contains only I1:
   ```typescript
   // apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/introduction.registry.ts
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
     ],
   };
   ```

**Classification:** NOT_IMPLEMENTED  
**Implication:** Introduction family currently consists of **1 version only (I1)**. I2-I6 exist in educational reference documentation but not in production code.

---

### 2C. Introduction Block Educational Reference

**VERIFIED — Educational documentation exists:**

File: `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/Introduction.md`

Contains descriptions of Introduction block family structure, pedagogical purpose, and version progression **as educational reference**, not production specification.

**Status:** DECLARED — Educational corpus  
**Classification:** Reference material for External AI understanding, not runtime specification

**Critical Note:** Educational documentation describes **intended block family evolution**, not **current production implementation**.

---

## SECTION 3: PRODUCTION TUTORIAL DOCUMENT ARCHITECTURE

### 3A. TutorialDocument Structure — VERIFIED

**File:** `packages/types/src/tutorial-rich-document/document.ts`

```typescript
export interface TutorialDocument {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION; // number
  blocks: TutorialBlock[];
  metadata?: TutorialDocumentMetadata;
}
```

**TutorialBlock Union:** `packages/types/src/tutorial-rich-document/blocks/index.ts`

```typescript
export type TutorialBlock = ContentBlockExtended | ContainerBlock;
```

**ContentBlockExtended includes:**
- `DefinitionBlock` (DefinitionD1Block)
- `CodeBlockVersioned` (CodeC1Block)
- `IntroductionBlock` (IntroductionI1Block) ✅
- `SummaryBlock` (SummaryS1Block)
- `HeadingBlock`, `ParagraphBlock`, `ListBlock`, `CodeBlock` (legacy), `TableBlock`, `ImageBlock`, `CalloutBlock`, `ExampleBlock`, `QuoteBlock`

**ContainerBlock includes:**
- `TwoColumnBlock`, `ThreeColumnBlock`, `CardGridBlock`, `TimelineBlock`

**Status:** ✅ VERIFIED — Introduction I1 integrated into TutorialBlock discriminated union

---

### 3B. Database Persistence — VERIFIED

**File:** `packages/db-tutorial/src/schema/tutorial-sections.ts`

```typescript
export const tutorialSections = pgTable('tutorial_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Hierarchy Reference
  subtopicId: uuid('subtopic_id').notNull()
    .references(() => tutorialSubtopics.id, { onDelete: 'cascade' }),
  
  // Phase 1: Sidebar Navigation Identity (REQUIRED)
  navigationNodeId: text('navigation_node_id').notNull(),
  
  // Content Storage (JSONB for flexibility)
  content: jsonb('content').$type<TutorialDocument>().notNull(),
  
  // Versioning
  version: integer('version').notNull().default(1),
  language: text('language').notNull().default('en'),
  
  // Lifecycle Status
  status: sectionStatusEnum('status').notNull().default('draft'),
  
  // AI Generation Metadata
  generatedByAi: boolean('generated_by_ai').notNull().default(false),
  aiModelUsed: text('ai_model_used'),
  generationJobId: uuid('generation_job_id'),
  qualityScore: integer('quality_score'),
  hallucinationScore: integer('hallucination_score'),
  regenerationCount: integer('regeneration_count').notNull().default(0),
  
  // Approval Workflow
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  rejectionReason: text('rejection_reason'),
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  // Phase 1 Identity Constraint
  uqTutorialV2IdentityActive: uniqueIndex('uq_tutorial_v2_identity_active')
    .on(table.subtopicId, table.navigationNodeId, table.brandId)
    .where(sql`${table.deletedAt} IS NULL`),
}));
```

**Status:** ✅ VERIFIED — Database schema supports:
- TutorialDocument JSONB storage
- AI generation metadata (prepared but not automated)
- Approval workflow (prepared but not automated)
- Brand partitioning
- Unique constraint: (subtopicId, navigationNodeId, brandId) per active tutorial

**Gap:** AI generation metadata fields exist but are **NOT POPULATED** by automated Project LLM system

---

## SECTION 4: COMPOSER INTEGRATION

### 4A. Block Registry — VERIFIED

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts`

```typescript
export function getBlockTypes(): BlockRegistryEntry[] {
  return [
    definitionRegistry,
    codeRegistry,
    summaryRegistry,
    introductionRegistry, // ✅ Introduction registered
  ];
}
```

**Introduction Registry:** `registry/entries/introduction.registry.ts`

```typescript
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
  ],
};
```

**Status:** ✅ VERIFIED — Introduction I1 registered in Composer block type dropdown

---

### 4B. AI Prompt Display — VERIFIED

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/AiInstructionContainer.tsx`

```typescript
if (blockType === 'introduction') {
  return getIntroductionI1Prompt(context);
}
```

**Status:** ✅ VERIFIED — Composer displays I1 generation prompt for human copy-paste

**Workflow:**
1. Human selects hierarchy context in Composer
2. Composer builds `TutorialPromptContext` object
3. `getIntroductionI1Prompt(context)` generates formatted prompt string
4. Prompt displayed in collapsible "AI Generation Instructions" panel
5. Human copies prompt text
6. Human uses External AI separately (ChatGPT, Claude, Gemini)
7. Human copies JSON response back into Composer

**Gap:** No automated External AI API integration

---

### 4C. Document Transformation — VERIFIED

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts`

```typescript
case 'introduction': {
  if (instance.versionCode === 'I1') {
    // Transform TutorialIntroductionPayload to IntroductionI1AuthorContent
    const introPayload = instance.payload as TutorialIntroductionPayload;
    
    return {
      type: 'introduction',
      version: 'I1',
      content: introPayload as unknown as IntroductionI1AuthorContent,
      expectedTimeSec: instance.expectedTimeSec,
    };
  }
  
  throw new Error(
    `Unsupported introduction version: ${instance.versionCode}. Only I1 is currently supported.`
  );
}
```

**Status:** ✅ VERIFIED — Composer transforms authored Introduction I1 content into TutorialBlock format

---

### 4D. Save Service — VERIFIED

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts`

```typescript
export async function saveTutorialSection(
  params: TutorialSaveParams,
  _status: 'draft' | 'published'
): Promise<TutorialSaveResult> {
  // Step 1: Map documentBlocks[] → TutorialDocument.blocks[]
  const tutorialBlocks: TutorialBlock[] = documentBlocks.map(toTutorialBlock);
  
  // Step 2: Create TutorialDocument
  const tutorialDocument: TutorialDocument = {
    schemaVersion: 1,
    blocks: tutorialBlocks,
  };
  
  // Step 3: Check existence via API
  // Step 4: CREATE or UPDATE via /api/tutorial-composer/sections
}
```

**Status:** ✅ VERIFIED — Composer saves TutorialDocument to database via API

---

## SECTION 5: API LAYER

### 5A. Tutorial Composer APIs — VERIFIED

**Base Path:** `/api/tutorial-composer/`

**Endpoints Discovered:**

1. **POST /api/tutorial-composer/sections** — Create tutorial
   - File: `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts`
   - Request: `{ subtopicId, navigationNodeId, brandId, content: TutorialDocument, orderIndex }`
   - Response: `{ data: TutorialSection }`

2. **GET /api/tutorial-composer/sections** — List tutorials
   - Query: `?subtopicId=...&navigationNodeId=...&brandId=...&limit=...`
   - Response: `{ data: TutorialSection[] }`

3. **PATCH /api/tutorial-composer/sections/:sectionId** — Update tutorial
   - Request: `{ content: TutorialDocument }`
   - Response: `{ data: TutorialSection }`

4. **POST /api/tutorial-composer/sections/:sectionId/publish** — Publish tutorial
   - Response: `{ data: TutorialSection }`

5. **POST /api/tutorial-composer/block-suggestions** — Generate block suggestions
   - File: `apps/skillhubcore-admin/src/app/api/tutorial-composer/block-suggestions/route.ts`
   - Request: `{ document: TutorialDocument, hierarchy: {...}, analysis: {...} }`
   - Response: `{ suggestions: BlockSuggestion[] }`
   - **Note:** This is a **suggestion analysis service**, NOT automated block generation

6. **POST /api/tutorial-composer/sections/:sectionId/suggestions/apply** — Apply suggestion
   - File: `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/suggestions/apply/route.ts`
   - Applies server-regenerated block suggestion to tutorial section

**Status:** ✅ VERIFIED — API layer exists for Composer CRUD operations

**Gap:** No `/api/project-llm/` endpoints for External AI integration, Creation Brief generation, or candidate block submission

---

## SECTION 6: RUNTIME RENDERER — VERIFIED

### 6A. Introduction I1 Renderer — VERIFIED

**File:** `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`

```typescript
export function IntroductionBlock({ block, theme, className }: IntroductionBlockProps) {
  switch (block.version) {
    case 'I1':
      return <IntroductionI1View block={block} theme={theme!} className={className} />;
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = block;
      throw new Error(`Unsupported introduction version: ${JSON.stringify(_exhaustive)}`);
  }
}

/**
 * Introduction I1 View - CANONICAL LOCKED UI
 * 
 * This is the single authoritative Introduction I1 renderer for ALL brands.
 * Layout, typography, spacing, icons, sections, and responsive behavior are FIXED.
 * Only theme.primary and theme.secondary vary by brand.
 */
function IntroductionI1View({ block, theme, className }: IntroductionI1ViewProps) {
  // 9-section rendering: Hero, Learning Goal, Topic, Where Fit, Solution,
  // Where Used, Roadmap, Why Matters, Key Takeaway
}
```

**Status:** ✅ VERIFIED — Complete I1 renderer implementation

**UI Structure:**
1. Hero Section (badge, title, subtitle, mountain illustration with motto)
2. Learning Goal
3. The Topic (description + quote)
4. Where Does It Fit? (flow cards with icons)
5. The Solution (code example)
6. Where Is It Used? (use case cards)
7. What Will You Learn? (roadmap steps)
8. Why This Matters (benefit cards)
9. Key Takeaway

**Theme Integration:** Uses `theme.primary` and `theme.secondary` for brand-specific colors

---

### 6B. Router Integration — VERIFIED

**File:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

```typescript
case 'introduction': {
  // Introduction I1 is the only supported version
  if (!('version' in block) || block.version !== 'I1') {
    throw new Error(
      `Unsupported Introduction version. I1 is required. Received: ${('version' in block) ? (block as any).version : 'no version'}`
    );
  }
  
  if (!theme?.primary || !theme?.secondary) {
    throw new Error(
      `Missing required brand theme for Introduction I1 block ${block.id}`
    );
  }
  
  return <IntroductionBlock block={block} theme={theme} className={className} runtimeContext={runtimeContext} />;
}
```

**Status:** ✅ VERIFIED — Router validates version and theme requirements before rendering

---

## SECTION 7: VALIDATION LAYER

### 7A. Zod Schema Validation — PARTIAL

**Search Result:** No dedicated `IntroductionI1BlockSchema` found in:
- `packages/types/src/tutorial-rich-document/schemas/`
- TutorialDocumentSchema uses discriminated union but individual block schemas not individually inspected in this investigation

**Status:** PARTIAL — Validation exists at TutorialDocument level, individual I1 schema not verified in this pass

**Gap:** Detailed I1 content validation (motto.lines array length, icon registry enforcement, required fields) not confirmed

---

## SECTION 8: AUTHORIZATION & PERMISSIONS

### 8A. Permission System — VERIFIED

**File:** `apps/skillhubcore-admin/src/lib/auth-helpers.ts`

```typescript
/**
 * Verify user has permission to create tutorial content
 */
export function requireTutorialAuthorCreatePermission(user: AuthUser) {
  return requirePermission(
    user,
    PERMISSIONS.TUTORIAL_AUTHOR_CREATE,
    'create tutorial content'
  );
}

/**
 * Verify user has permission to publish tutorial content
 */
export function requireTutorialAuthorPublishPermission(user: AuthUser) {
  return requirePermission(
    user,
    PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH,
    'publish tutorial content'
  );
}
```

**Status:** ✅ VERIFIED — RBAC permission system exists for tutorial authoring

**Gap:** No Project LLM-specific permissions (e.g., APPROVE_CANDIDATE_BLOCK, REJECT_AI_GENERATION, OVERRIDE_QUALITY_SCORE)

---

## SECTION 9: ILS PROGRESS TRACKING — VERIFIED

### 9A. Introduction I1 Progress Participation — VERIFIED

**Evidence from Phase 2B.18 Step 3 Bridge Test:**

Test File: `tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts`

**Result:** ✅ PASSED (2026-10-03)
- Duration: 53.0s
- All 5 evidence points verified
- Cache/evaluation correlation: 64s = 64s

**Introduction I1 Block Identity:**
```typescript
const BLOCKS = {
  I1: { 
    id: 'f8bb01a7-a6f1-496a-b9fa-f9b7c8dc82be', 
    version: 'I1', 
    type: 'introduction' 
  },
  D1: { ... },
  C1: { ... },
};
```

**Status:** ✅ VERIFIED — Introduction I1 participates in ILS progress tracking as instructional block

**BlockProgressRole:** `'instructional'` (default for versioned blocks)

---

## SECTION 10: LSNB RELATIONSHIP — VERIFIED

**Evidence:** Introduction I1 appears in tutorial page left sidebar navigation

**Navigation Structure:**
- Domain → Subject → Topic → Subtopic → **Navigation Node**
- Each navigation node maps to `navigationNodeId` in `tutorial_sections` table
- Introduction I1 blocks render when navigating to corresponding URL

**URL Pattern:**
```
/tutorial-v2/{domainSlug}/{subjectSlug}/{topicSlug}/{subtopicSlug}/{navigationNodeId}
```

**Status:** ✅ VERIFIED — Introduction I1 integrates with LSNB via navigationNodeId identity

---

## SECTION 11: RSSB COMPATIBILITY — VERIFIED

**Introduction Block Classification:** Instructional (informational)

**RSSB Applicability:** Introduction blocks do NOT require state persistence across sessions (no interactive components, no user input, no progress checkpoints within block)

**Status:** ✅ VERIFIED — Introduction I1 correctly excluded from RSSB (no state to persist)

---

## SECTION 12: UBRC COMPLIANCE — VERIFIED

**Evidence from E2E Tests:**

Files:
- `tests/e2e/introduction-i1.http.spec.ts` — HTTP contract validation
- `tests/e2e/introduction-i1.browser.spec.ts` — Browser runtime validation
- `tests/e2e/introduction-i1.login-diagnostic.spec.ts` — Login flow diagnostic
- `tests/e2e/introduction-i1.diagnostic-console.spec.ts` — Console/network diagnostic

**UBRC Identity Attributes:**
```html
<div data-block-id="f8bb01a7-a6f1-496a-b9fa-f9b7c8dc82be"
     data-block-type="introduction"
     data-block-version="I1"
     data-progress-role="instructional"
     data-expected-time-sec="240">
  <!-- Introduction I1 content -->
</div>
```

**Status:** ✅ VERIFIED — Introduction I1 renders with required UBRC data attributes

---

## SECTION 13: EXISTING TESTS

### 13A. Introduction I1 Test Coverage — VERIFIED

**E2E Tests (Playwright):**

1. **introduction-i1.http.spec.ts**
   - HTTP 200 status
   - Content-Type headers
   - Page title presence
   - Tutorial content delivery

2. **introduction-i1.browser.spec.ts**
   - Block rendering (9 sections)
   - Icon rendering (Lucide icons from registry)
   - Theme integration (brand colors)
   - Responsive viewports
   - Accessibility landmarks
   - Interactive elements

3. **introduction-i1.login-diagnostic.spec.ts**
   - Authentication flow
   - Session management
   - Redirect behavior

4. **introduction-i1.diagnostic-console.spec.ts**
   - Console error detection
   - Network request tracing
   - Performance monitoring

**Unit Tests:**

5. **TutorialRendererRouting.test.tsx**
   - Routes `introduction/I1` to IntroductionI1View
   - Rejects introduction without version field
   - Rejects unsupported versions (I2+)

6. **introduction-authoring.test.ts**
   - Composer dropdown registration
   - Payload validation

7. **expectedTimeSec-ai-contract.integration.test.ts**
   - AI prompt includes expectedTimeSec contract
   - Generated blocks validate with Zod schemas

**Status:** ✅ VERIFIED — Comprehensive test coverage exists for Introduction I1

---

### 13B. Project LLM Test Coverage — NOT FOUND

**No tests discovered for:**
- External AI integration
- Creation Brief generation
- Candidate block submission
- Architecture audit automation
- Repository discovery
- Adaptation engine
- Evidence production workflows
- Approval gate automation

**Status:** NOT_IMPLEMENTED

---

## SECTION 14: MISSING IMPLEMENTATION — COMPREHENSIVE GAP ANALYSIS

### 14A. Project LLM Service Infrastructure

**MISSING:**

1. **Python/FastAPI Service:**
   - No `services/project-llm/` directory
   - No FastAPI application for Project LLM orchestration
   - No service containerization (Dockerfile, docker-compose entry)
   - No deployment configuration

2. **LLM Provider Integration:**
   - No OpenAI client
   - No Anthropic client
   - No Google Gemini client
   - No LLM provider abstraction layer
   - No prompt engineering service
   - No response parsing service

3. **Repository Discovery Engine:**
   - No automated codebase inspection
   - No runtime capability detection (UBRC, ILS, LSNB, RSSB)
   - No type system parser
   - No schema extractor
   - No constraint harvester

4. **Creation Brief Generation:**
   - No automated brief builder
   - No block-specific brief templates (beyond manual prompts)
   - No dynamic constraint injection
   - No versioning/snapshot management

5. **External AI Integration:**
   - No External AI API clients
   - No candidate package submission endpoint
   - No bidirectional communication protocol
   - No handoff validation

6. **Candidate Block Pipeline:**
   - No submission endpoint (`POST /api/project-llm/candidate-blocks`)
   - No validation service
   - No architecture audit automation
   - No adaptation engine
   - No integration sequencer

7. **Evidence Production:**
   - No automated test execution for candidates
   - No evidence collection service
   - No certification workflow automation
   - No quality score computation

8. **Approval Workflow:**
   - No human approval gate UI (beyond manual Composer approval)
   - No Gate 1 (prototype approval) automation
   - No Gate 2 (final approval) automation
   - No evidence presentation dashboard

---

### 14B. Introduction I2-I6 Implementation

**MISSING:**

1. **Type Definitions:**
   - No `IntroductionI2Page`, `IntroductionI2AuthorContent`, `IntroductionI2Block`
   - No I3, I4, I5, I6 type definitions

2. **Composer Integration:**
   - No I2-I6 registry entries
   - No I2-I6 default payload examples
   - No I2-I6 AI prompts

3. **Renderer Implementation:**
   - No `IntroductionI2View`, `IntroductionI3View`, etc.
   - Router explicitly rejects I2+

4. **Tests:**
   - No I2-I6 E2E tests
   - No I2-I6 unit tests

**Status:** NOT_IMPLEMENTED

**Educational Reference Exists:** `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/Introduction.md` describes I1-I6 pedagogically but not as implementation spec

---

## SECTION 15: ARCHITECTURE GAPS & CONTRADICTIONS

### 15A. Documentation vs. Implementation Gap

**CONTRADICTION:**

**Documentation Claims:**
- External AI → Project LLM → Platform lifecycle
- Automated Creation Brief generation
- Candidate block submission and validation
- Architecture audit automation
- Evidence-based certification

**Implementation Reality:**
- Human-driven Composer workflow only
- Manual copy-paste of prompts to External AI
- Manual copy-paste of JSON responses back
- No Project LLM service exists
- No External AI integration exists

**Classification:** DECLARED vs. NOT_IMPLEMENTED

---

### 15B. Database Metadata vs. Population Gap

**CONTRADICTION:**

**Schema Declares:**
```typescript
generatedByAi: boolean('generated_by_ai').notNull().default(false),
aiModelUsed: text('ai_model_used'),
generationJobId: uuid('generation_job_id'),
qualityScore: integer('quality_score'),
hallucinationScore: integer('hallucination_score'),
regenerationCount: integer('regeneration_count').notNull().default(0),
approvedBy: uuid('approved_by'),
approvedAt: timestamp('approved_at', { mode: 'date' }),
rejectionReason: text('rejection_reason'),
```

**Implementation Reality:**
- Fields exist but are **NOT POPULATED** by automated system
- No service sets `generatedByAi = true`
- No service records `aiModelUsed`
- No service assigns `generationJobId`
- No automated quality/hallucination scoring

**Classification:** PREPARED vs. NOT_AUTOMATED

---

### 15C. Introduction Family Definition Gap

**CONTRADICTION:**

**Educational Docs:** Introduction family consists of I1-I6 versions with distinct pedagogical purposes

**Production Code:** Introduction family consists of **I1 only**

**Mapping:**
```
Educational Reference          Production Implementation
I1 (Comprehensive Overview) → IntroductionI1Block ✅
I2 (...)                    → NOT_IMPLEMENTED ❌
I3 (...)                    → NOT_IMPLEMENTED ❌
I4 (...)                    → NOT_IMPLEMENTED ❌
I5 (...)                    → NOT_IMPLEMENTED ❌
I6 (...)                    → NOT_IMPLEMENTED ❌
```

**Classification:** DECLARED (educational) vs. NOT_IMPLEMENTED (production)

---

## SECTION 16: PROPOSED IMPLEMENTATION ARCHITECTURE

**⚠️ CLASSIFICATION: PROPOSED — NOT IMPLEMENTED**

Based on forensic findings, Phase 1 implementation would require:

### 16A. Service Layer (NEW)

```
services/project-llm/
├── src/
│   ├── main.py                    # FastAPI application entry
│   ├── routers/
│   │   ├── creation_brief.py      # POST /creation-brief/generate
│   │   ├── candidate_blocks.py    # POST /candidate-blocks/submit
│   │   ├── validation.py          # POST /validate
│   │   └── evidence.py            # GET /evidence/:jobId
│   ├── services/
│   │   ├── repository_discovery.py
│   │   ├── brief_generator.py
│   │   ├── external_ai_client.py
│   │   ├── candidate_validator.py
│   │   ├── architecture_auditor.py
│   │   ├── adaptation_engine.py
│   │   └── evidence_collector.py
│   ├── llm/
│   │   ├── provider_factory.py
│   │   ├── openai_client.py
│   │   ├── anthropic_client.py
│   │   └── gemini_client.py
│   └── models/
│       ├── creation_brief.py
│       ├── candidate_package.py
│       └── evidence_report.py
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

**Status:** PROPOSED

---

### 16B. Introduction I2-I6 (NEW)

**Required Files to Create:**

1. Type Definitions:
   - Extend `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
   - Add `IntroductionI2Block`, `IntroductionI3Block`, etc.

2. Registry Entries:
   - Extend `apps/skillhubcore-admin/.../registry/entries/introduction.registry.ts`
   - Add I2-I6 versions with default payloads

3. AI Prompts:
   - Create `blocks/introduction/I2/introductionI2.prompt.ts`
   - Create I3-I6 prompt files

4. Renderers:
   - Extend `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
   - Implement `IntroductionI2View`, `IntroductionI3View`, etc.

5. Examples:
   - Create `blocks/introduction/I2/introductionI2.examples.ts`
   - Create I3-I6 example files

6. Tests:
   - Create `tests/e2e/introduction-i2.browser.spec.ts`
   - Create I3-I6 test suites

**Status:** PROPOSED

---

## SECTION 17: FILES TO MODIFY

**⚠️ CLASSIFICATION: PROPOSED**

**IF Introduction I2-I6 were implemented:**

1. **packages/types/src/tutorial-rich-document/blocks/content-blocks.ts**
   - Add I2-I6 type definitions
   - Update `IntroductionBlock` union type

2. **packages/ui/src/tutorial/blocks/IntroductionBlock.tsx**
   - Add cases for I2-I6 in switch statement
   - Implement I2-I6 renderers

3. **packages/ui/src/tutorial/TutorialBlockRenderer.tsx**
   - Update version validation to accept I2-I6

4. **apps/skillhubcore-admin/.../registry/entries/introduction.registry.ts**
   - Add I2-I6 to versions array

5. **apps/skillhubcore-admin/.../components/AiInstructionContainer.tsx**
   - Add version-specific prompt routing

6. **apps/skillhubcore-admin/.../document/documentTransformation.ts**
   - Add I2-I6 transformation cases

**Status:** PROPOSED

---

## SECTION 18: FILES TO CREATE

**⚠️ CLASSIFICATION: PROPOSED**

**IF Project LLM service were implemented:**

1. **services/project-llm/** — Entire new service directory
2. **apps/skillhubcore-admin/src/app/api/project-llm/** — API proxy routes
3. **packages/project-llm-types/** — Shared TypeScript types for Project LLM contracts
4. **infra/hostinger/compose/project-llm-service.yml** — Deployment config
5. **tests/e2e/project-llm-lifecycle.spec.ts** — End-to-end lifecycle tests

**IF Introduction I2-I6 were implemented:**

6. **apps/skillhubcore-admin/.../blocks/introduction/I2/** — I2 implementation directory
7. **apps/skillhubcore-admin/.../blocks/introduction/I3-I6/** — I3-I6 directories
8. **tests/e2e/introduction-i2.browser.spec.ts** — I2 E2E tests
9. **tests/e2e/introduction-i3-i6.browser.spec.ts** — I3-I6 E2E tests

**Status:** PROPOSED

---

## SECTION 19: RISKS

### 19A. Implementation Risks

1. **LLM Provider Costs:**
   - Automated block generation at scale = significant API costs
   - Need rate limiting, cost tracking, budget controls

2. **Quality Control:**
   - Automated generation may produce low-quality content
   - Hallucination detection required
   - Human review gate essential

3. **Repository Discovery Complexity:**
   - Codebase inspection across TypeScript, React, database schemas
   - AST parsing, type resolution, runtime behavior inference
   - High maintenance burden as codebase evolves

4. **External AI Integration:**
   - API rate limits (OpenAI, Anthropic, Gemini)
   - Provider outages
   - Response format variations
   - Prompt engineering fragility

5. **Evidence Production:**
   - Automated test execution in isolated environments
   - Test flakiness
   - Evidence storage and retrieval
   - Certification reproducibility

6. **Approval Workflow:**
   - Human approval latency
   - Review burden on subject matter experts
   - Rejection handling and iteration loops

---

### 19B. Architectural Risks

1. **Scope Creep:**
   - "Just add one more block type" → unbounded work
   - Need clear boundaries on automation scope

2. **Over-Automation:**
   - Removing human judgment entirely = quality risk
   - Balance automation with human oversight

3. **Technical Debt:**
   - Tight coupling between Project LLM and repository structure
   - Refactoring repository breaks discovery logic
   - Need versioned contracts

4. **Divergence:**
   - Documentation describes ideal, code implements subset
   - Documentation becomes stale as implementation evolves
   - Single source of truth unclear

---

## SECTION 20: OPEN ARCHITECTURE DECISIONS

### 20A. Decisions Requiring Human Approval

1. **Project LLM Technology Stack:**
   - **Proposed:** Python + FastAPI
   - **Alternative:** Node.js + Express (matches existing stack)
   - **Decision Needed:** Confirm Python/FastAPI choice

2. **LLM Provider Strategy:**
   - **Option A:** Single provider (e.g., OpenAI only)
   - **Option B:** Multi-provider with fallback
   - **Option C:** Provider abstraction layer (future-proof)
   - **Decision Needed:** Choose provider strategy

3. **Creation Brief Delivery:**
   - **Option A:** Project LLM → External AI API directly
   - **Option B:** Project LLM → Human review → Manual delivery
   - **Option C:** Hybrid (automated with human override)
   - **Decision Needed:** Choose delivery mechanism

4. **Candidate Block Submission:**
   - **Option A:** API endpoint (POST /api/project-llm/candidate-blocks)
   - **Option B:** File upload (JSON package)
   - **Option C:** GitHub PR workflow
   - **Decision Needed:** Choose submission mechanism

5. **Evidence Storage:**
   - **Option A:** Database table (evidence_reports)
   - **Option B:** Object storage (S3-compatible)
   - **Option C:** File system (.analysis/ directory)
   - **Decision Needed:** Choose storage strategy

6. **Introduction I2-I6 Implementation Order:**
   - **Question:** Should I2-I6 be implemented in Phase 1?
   - **Alternative:** Focus on I1 automation first, defer I2-I6 to Phase 2
   - **Decision Needed:** Define Phase 1 scope

---

### 20B. Clarifications Needed

1. **Educational Documentation Authority:**
   - Are Introduction I2-I6 descriptions in `Introduction.md` frozen?
   - Or are they examples subject to revision?

2. **Version Naming Convention:**
   - I1, I2, I3... = incremental versions of same block type?
   - Or I1 = "Comprehensive", I2 = "Quick Start" = distinct templates?

3. **Backward Compatibility:**
   - If I2 introduced, must I1 remain supported indefinitely?
   - Or can I2 replace I1 after migration?

4. **AI Generation Mandate:**
   - Must ALL future Introduction blocks be AI-generated?
   - Or is manual authoring still permitted?

5. **Approval Authority:**
   - Who approves Creation Briefs? (Human subject matter expert?)
   - Who approves candidate blocks? (Same person or different role?)

---

## SECTION 21: IMPLEMENTATION CONTRACT

### 21A. Phase 1 Deliverables (PROPOSED)

**IF Phase 1 proceeds, these deliverables are required:**

1. **Project LLM Service (Python + FastAPI):**
   - Repository discovery engine
   - Creation Brief generator
   - LLM provider integration (OpenAI, Anthropic, or Gemini)
   - Candidate block validator
   - Architecture auditor
   - Adaptation engine
   - Evidence collector

2. **API Endpoints:**
   - POST /api/project-llm/creation-brief/generate
   - POST /api/project-llm/candidate-blocks/submit
   - POST /api/project-llm/candidate-blocks/:id/validate
   - GET /api/project-llm/evidence/:jobId

3. **Composer Integration:**
   - External AI integration UI (replace manual copy-paste)
   - Candidate block review UI
   - Evidence display panel
   - Approval workflow UI

4. **Database Extensions:**
   - `project_llm_jobs` table
   - `project_llm_evidence` table
   - `candidate_blocks` table

5. **Tests:**
   - Project LLM service unit tests
   - Project LLM integration tests
   - End-to-end lifecycle tests
   - Introduction I1 automation tests

6. **Documentation:**
   - Project LLM API specification
   - Deployment guide
   - Operator manual
   - Troubleshooting guide

---

### 21B. Success Criteria (PROPOSED)

**Phase 1 is complete when:**

1. ✅ Creation Brief for Introduction I1 can be generated automatically
2. ✅ Creation Brief can be delivered to External AI programmatically
3. ✅ External AI can submit candidate Introduction I1 block via API
4. ✅ Candidate block is validated against schema automatically
5. ✅ Architecture audit runs automatically
6. ✅ Evidence is produced automatically
7. ✅ Human can review evidence and approve/reject via Composer UI
8. ✅ Approved block integrates into TutorialDocument automatically
9. ✅ End-to-end test covers full lifecycle
10. ✅ One real Introduction I1 block generated through pipeline

---

### 21C. Exclusions (PROPOSED)

**Phase 1 does NOT include:**

1. ❌ Introduction I2-I6 implementation (defer to Phase 2)
2. ❌ Other block families (Definition, Code, Summary, etc.)
3. ❌ Multi-block tutorial generation
4. ❌ Quality score ML models (use rule-based initially)
5. ❌ Hallucination detection ML (use heuristics initially)
6. ❌ Advanced prompt optimization
7. ❌ Cost optimization
8. ❌ Multi-language support (English only initially)

---

## SECTION 22: IMPLEMENTATION READINESS CHECKLIST

### 22A. Prerequisites for Phase 1B Implementation

**Before implementation begins:**

- [ ] Human approval of forensic findings in this document
- [ ] Confirmation of Python/FastAPI technology choice
- [ ] Selection of LLM provider strategy
- [ ] Definition of Phase 1 scope (I1 only vs. I1-I6)
- [ ] Approval of proposed architecture
- [ ] Assignment of implementation team
- [ ] Budget approval for LLM API costs
- [ ] Infrastructure provisioning (servers, databases, object storage)
- [ ] Access credentials for LLM providers (API keys)
- [ ] Test environment setup
- [ ] Staging environment setup

### 22B. Repository State Verification

**Current state confirmed:**

- [x] Introduction I1 type definitions exist
- [x] Introduction I1 renderer exists
- [x] Introduction I1 Composer integration exists
- [x] Introduction I1 E2E tests passing
- [x] TutorialDocument schema supports I1
- [x] Database schema supports AI metadata
- [x] Tutorial Composer APIs functional
- [x] UBRC compliance verified
- [x] ILS participation verified
- [x] LSNB integration verified

**Gaps confirmed:**

- [x] No Project LLM service exists
- [x] No External AI integration exists
- [x] No automated Creation Brief generation exists
- [x] No candidate block submission exists
- [x] Introduction I2-I6 not implemented

---

## SECTION 23: EXPLICIT STOP — AWAITING HUMAN APPROVAL

**⚠️ FORENSIC INVESTIGATION COMPLETE**

This document represents a **complete read-only investigation** of the repository for Project LLM Phase 1 (Introduction block vertical slice).

**NO IMPLEMENTATION HAS OCCURRED.**

**Key Findings:**

1. **Introduction I1:** ✅ FULLY IMPLEMENTED (types, renderer, Composer, tests, runtime)
2. **Introduction I2-I6:** ❌ NOT IMPLEMENTED
3. **Project LLM Service:** ❌ NOT IMPLEMENTED
4. **External AI Integration:** ❌ NOT IMPLEMENTED
5. **Creation Brief Automation:** ❌ NOT IMPLEMENTED (manual prompts only)
6. **Candidate Block Pipeline:** ❌ NOT IMPLEMENTED

**Current Architecture:** Human-driven Composer workflow with manual External AI interaction

**Proposed Architecture:** Automated Project LLM service with External AI API integration

**Decision Required:** Should Phase 1B proceed with implementation as proposed?

---

### Next Steps (Human Decision Required)

**Option A: Proceed with Phase 1B Implementation**
- Implement Project LLM service (Python + FastAPI)
- Implement External AI integration
- Automate Creation Brief generation
- Implement candidate block pipeline
- **Estimated Effort:** 8-12 weeks, 2-3 engineers

**Option B: Defer Project LLM, Continue Manual Workflow**
- Keep current human-driven Composer workflow
- Implement Introduction I2-I6 manually (without automation)
- Revisit Project LLM automation in future phase
- **Estimated Effort:** 2-4 weeks for I2-I6 manual implementation

**Option C: Hybrid Approach**
- Implement Introduction I2-I6 manually first (validate educational design)
- Then implement Project LLM automation in Phase 2
- Retrofit automation to existing I1-I6 implementations
- **Estimated Effort:** 2-4 weeks (I2-I6), then 8-12 weeks (Project LLM)

---

## APPENDIX A: INVESTIGATION METHODOLOGY

**Forensic Discovery Methods Used:**

1. **File Search:** Located all files matching "llm", "introduction", "project-llm"
2. **Grep Search:** Full-text search across repository for key terms
3. **Code Reading:** Inspected type definitions, implementations, tests
4. **API Inspection:** Reviewed Next.js API routes and service endpoints
5. **Database Schema Review:** Examined Drizzle ORM schema definitions
6. **Test Analysis:** Reviewed E2E and unit test coverage
7. **Documentation Review:** Read architecture docs, educational corpus
8. **Cross-Reference Validation:** Verified claims against multiple sources

**Evidence Classification:**

- **VERIFIED:** Confirmed through code inspection and/or test execution
- **NOT_IMPLEMENTED:** Searched for but not found in repository
- **DECLARED:** Documented but not verified as implemented
- **PARTIAL:** Partially implemented or prepared but not automated
- **PROPOSED:** Suggested implementation, not yet built

---

## APPENDIX B: REPOSITORY EVIDENCE MANIFEST

**Key Evidence Files:**

1. Documentation:
   - `docs/ubrc/PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1.md`
   - `ILS_UI_UX/docs/Project LLM.ipynb`
   - `ILS_UI_UX/docs/blocksmdfiles/OneAIModelForProjectLLM/Introduction.md`

2. Type Definitions:
   - `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
   - `packages/types/src/tutorial-rich-document/document.ts`

3. Renderer:
   - `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
   - `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

4. Composer:
   - `apps/skillhubcore-admin/.../registry/entries/introduction.registry.ts`
   - `apps/skillhubcore-admin/.../blocks/introduction/I1/introductionI1.prompt.ts`
   - `apps/skillhubcore-admin/.../services/tutorialSaveService.ts`

5. Database:
   - `packages/db-tutorial/src/schema/tutorial-sections.ts`

6. Tests:
   - `tests/e2e/introduction-i1.browser.spec.ts`
   - `tests/e2e/introduction-i1.http.spec.ts`
   - `tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts`

---

## APPENDIX C: GLOSSARY

**Key Terms:**

- **Project LLM:** Proposed Python/FastAPI service for automating block creation lifecycle
- **External AI:** Third-party LLM services (OpenAI, Anthropic, Gemini) used to generate block content
- **Creation Brief:** Context document delivered to External AI with platform constraints
- **Candidate Block:** AI-generated block awaiting validation and approval
- **UBRC:** Universal Block Runtime Contract (DOM identity attributes)
- **ILS:** Instructional Lifecycle System (progress tracking)
- **LSNB:** Left Sidebar Navigation Bar (tutorial navigation)
- **RSSB:** Runtime State Synchronization Boundary (cross-session state persistence)
- **Composer:** Admin tool for authoring tutorial content (`skillhubcore-admin`)
- **TutorialDocument:** JSONB structure stored in `tutorial_sections.content`
- **TutorialBlock:** Discriminated union of all block types
- **Introduction I1:** First version of Introduction block family (comprehensive roadmap)

---

**END OF FORENSIC REPORT**

**Status:** AWAITING HUMAN APPROVAL TO PROCEED WITH IMPLEMENTATION

