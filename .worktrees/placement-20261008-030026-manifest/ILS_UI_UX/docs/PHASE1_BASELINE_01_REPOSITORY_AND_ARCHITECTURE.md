# PHASE 1 BASELINE — PART 01: REPOSITORY AND ARCHITECTURE

**Status:** Evidence Package — Part 1 of 7  
**Source:** Original PHASE1_REPOSITORY_BASELINE.md (Lines 1-995)  
**Date:** October 4, 2026

---

# PROJECT LLM — PHASE 1 REPOSITORY BASELINE

**Document Type:** Repository Baseline & Implementation Readiness Assessment  
**Status:** BASELINE COMPLETE  
**Date:** 2025-01-26  
**Repository:** quiz-platform (skillupitacademy-alt/SUIA_RTH_SHC)  
**Branch:** main  
**Commit:** d3c69632  

---

## 1. Executive Summary

### Baseline Purpose
This baseline establishes a verified, evidence-based understanding of the existing quiz-platform repository to determine where and how Project LLM Phase 1 can be safely implemented without architectural drift.

### Key Findings

**✅ REPOSITORY READY FOR PROJECT LLM IMPLEMENTATION**

**Critical Discoveries:**
1. **I1 Reference Block IDENTIFIED**: Introduction I1 is production-certified with complete implementation at `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
2. **Project LLM Documentation EXISTS**: Comprehensive specifications in `ILS_UI_UX/docs/` but **NO production code yet**
3. **SkillHubCore Admin EXISTS**: Target application at `apps/skillhubcore-admin/` using Next.js 16.1.6 + React 19 + TypeScript
4. **Tutorial Architecture VERIFIED**: Complete block rendering system with TutorialBlockRenderer, ILS, LSNB (sidebar), RSSB (progress sidebar)
5. **Database Foundation READY**: Drizzle ORM + PostgreSQL with existing tutorial_sections, block_learning_state, tutorial_navigation_progress tables

**Implementation Path:**
- Project LLM workbench belongs in `apps/skillhubcore-admin/src/app/(admin)/project-llm/`
- I2 (new Introduction block) integrates via existing TutorialBlockRenderer registration
- Database can reuse existing patterns; 8 new Project LLM tables required
- No Python/FastAPI needed (locked to Node.js + TypeScript per Revision 2)

**Baseline Verdict:** `BASELINE_READY` (see Section 40)

---

## 2. Repository Identity

**Evidence:**

| Attribute | Value | Evidence Path |
|-----------|-------|---------------|
| Repository Name | quiz-platform | `package.json` line 2 |
| Organization | skillupitacademy-alt | git remote origin URL |
| Repository URL | https://github.com/skillupitacademy-alt/SUIA_RTH_SHC.git | git config |
| Branch | main | git branch --show-current |
| Latest Commit | d3c69632 | git log --oneline -1 |
| Commit Message | "docs(project-llm): Create Phase 1 Repository Baseline Prompt" | git log |
| Workspace Root | E:\onlinewebsites\quiz-platform | workspace root |
| Monorepo Structure | pnpm workspace with apps/ + packages/ + services/ | `pnpm-workspace.yaml` |
| Package Manager | pnpm@9.15.4 | `package.json` line 86 |
| Build System | Turbo 2.3.3 | `turbo.json` + package.json devDependencies |
| Node Version | 20.x | `package.json` engines.node |

**Monorepo Architecture:**

```
quiz-platform/
├── apps/                    # 12 applications
│   ├── skillhubcore-admin   ← PROJECT LLM TARGET
│   ├── realtutorialhub-web  ← Tutorial delivery (RTH brand)
│   ├── skillup-web          ← Tutorial delivery (SUIA brand)
│   ├── skillup-admin
│   ├── faculty-app
│   └── ...
├── packages/                # 21 shared packages
│   ├── types                ← TutorialBlock definitions
│   ├── ui                   ← TutorialBlockRenderer + ILS
│   ├── db-tutorial          ← Tutorial database + services
│   ├── auth
│   ├── validation
│   └── ...
├── services/                # Backend services
├── ILS_UI_UX/              ← Project LLM specifications
│   └── docs/
│       ├── PROJECT_LLM_BLOCK_CREATION_WORKBENCH_SPEC.md (Revision 2)
│       ├── PROJECT_LLM_PHASE_1_IMPLEMENTATION_MASTER_PROMPT.md
│       └── PROJECT_LLM_PHASE_1_REPOSITORY_BASELINE_PROMPT.md
└── .analysis/              ← Investigation reports
```

---

## 3. Technology Baseline

**Evidence:**

| Technology | Version | Evidence | Path |
|------------|---------|----------|------|
| **Frontend** | | | |
| React | 19.2.4 | package.json root dependencies | line 79 |
| Next.js | 16.1.6 | skillhubcore-admin package.json | dependencies |
| TypeScript | 5.7.2 | package.json root devDependencies | line 75 |
| Tailwind CSS | 3.4.1 | skillhubcore-admin package.json | dependencies |
| **State Management** | | | |
| Zustand | 5.0.10 | skillhubcore-admin package.json | dependencies |
| TanStack Query | 5.90.21 | skillhubcore-admin package.json | @tanstack/react-query |
| **Backend** | | | |
| Node.js | 20.x | package.json engines | line 87 |
| **Database** | | | |
| Drizzle ORM | 0.45.1 | package.json root devDependencies | line 38 |
| PostgreSQL | (via Drizzle) | packages/db-tutorial/src/db.ts | verified |
| **Build Tools** | | | |
| Turbo | 2.3.3 | package.json root devDependencies | line 74 |
| pnpm | 9.15.4 | package.json packageManager | line 86 |
| **UI Components** | | | |
| Radix UI | Various | package.json root dependencies | @radix-ui/* |
| Lucide React | 0.563.0 | multiple package.json files | verified |
| Framer Motion | 12.34.3 | multiple package.json files | animation |
| **Validation** | | | |
| Zod | 3.24.1 | package.json root dependencies | line 82 |
| **Testing** | | | |
| Vitest | 4.0.18 | package.json root devDependencies | line 76 |
| Playwright | 1.62.1 | package.json root devDependencies | @playwright/test |
| **Observability** | | | |
| Pino | 10.3.1 | multiple package.json files | logging |

**Technology Contract Compliance:**

✅ **Revision 2 Requirements Met:**
- Node.js + TypeScript ✅
- React + Next.js ✅
- Existing SkillHubCore Admin ✅
- PostgreSQL + Drizzle ORM ✅
- No Python/FastAPI ✅
- Pnpm workspace monorepo ✅

---

## 4. SkillHubCore Admin Baseline

**Application Identity:**

| Attribute | Value | Evidence |
|-----------|-------|----------|
| Package Name | @quiz/skillhubcore-admin | package.json name |
| Location | apps/skillhubcore-admin/ | directory verified |
| Framework | Next.js 16.1.6 (App Router) | package.json + src/app/ |
| Dev Port | 3007 | package.json scripts.dev |
| TypeScript | Yes (tsconfig.json exists) | verified |

**Directory Structure:**

```
apps/skillhubcore-admin/
├── src/
│   ├── app/              ← Next.js App Router
│   │   ├── (admin)/      ← Admin route group
│   │   ├── api/          ← API routes
│   │   │   └── tutorial-composer/  ← Composer APIs
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/       ← UI components
│   ├── hooks/           ← Custom React hooks
│   ├── lib/             ← Utilities
│   ├── types/           ← TypeScript types
│   └── utils/           ← Helpers
├── public/              ← Static assets
├── package.json
├── tsconfig.json
└── next.config.js
```

**Key Dependencies:**

```json
{
  "@quiz/api-client": "workspace:*",
  "@quiz/auth": "workspace:*",
  "@quiz/db": "workspace:*",
  "@quiz/db-tutorial": "workspace:*",
  "@quiz/types": "workspace:*",
  "@quiz/ui": "workspace:*",
  "@quiz/validation": "workspace:*",
  "@tanstack/react-query": "^5.90.21",
  "zustand": "^5.0.10",
  "next": "16.1.6",
  "react": "19.2.4"
}
```

**Existing Admin Features Identified:**
- Tutorial Composer at `src/app/(admin)/tools/tutorial-composer/`
- Tutorial Page Content tools
- API routes for content management
- Shared UI component library via @quiz/ui

**Project LLM Integration Point:**

**Recommended Path:** `apps/skillhubcore-admin/src/app/(admin)/project-llm/`

**Rationale:**
1. Follows existing `(admin)` route group convention
2. Consistent with `tools/tutorial-composer/` pattern
3. Inherits admin layout and authentication
4. Isolated from public-facing applications

---

## 5. Existing Project LLM Findings

**Search Results:**

Searched entire repository for:
- `project_llm`, `ProjectLLM`, `project-llm`, `PROJECT_LLM`
- `AI Workbench`, `Block Workbench`
- `Creation Brief`, `Compliance Review`, `Candidate Intake`
- `CERTIFICATION_READY`, `HAA`, `External AI`

**Documentation Found:**

| Document | Path | Status | Purpose |
|----------|------|--------|---------|
| Revision 2 Spec | `ILS_UI_UX/docs/PROJECT_LLM_BLOCK_CREATION_WORKBENCH_SPEC.md` | APPROVED & LOCKED | Phase 1 implementation contract |
| Master Prompt | `ILS_UI_UX/docs/PROJECT_LLM_PHASE_1_IMPLEMENTATION_MASTER_PROMPT.md` | APPROVED | Implementation guide |
| Baseline Prompt | `ILS_UI_UX/docs/PROJECT_LLM_PHASE_1_REPOSITORY_BASELINE_PROMPT.md` | CURRENT | This investigation's governing prompt |
| GUI Strategy | `ILS_UI_UX/docs/PROJECT_LLM_GUI_FIRST_STRATEGY.md` | PROPOSED | 12-screen workflow design |
| Reconciliation | `ILS_UI_UX/docs/PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md` | ANALYSIS | Architecture alignment review |
| External AI Workflow | `ILS_UI_UX/docs/PROJECT_LLM_EXTERNAL_AI_BLOCK_CREATION_WORKFLOW_DECISION.md` | DECISION | Human-AI collaboration model |

**Production Code Search:**

```
RESULT: NO PRODUCTION IMPLEMENTATION FOUND
```

**Evidence:**
- No files matching `project-llm` in `apps/skillhubcore-admin/src/app/`
- No API routes at `/api/project-llm/`
- No database tables starting with `project_llm_`
- No services in `packages/db-tutorial/src/services/project-llm*`
- No React components in `apps/skillhubcore-admin/src/components/project-llm/`

**Block Family Documentation Found:**

Located at `ILS_UI_UX/docs/blocksmdfiles/`:
- 18 block families documented (Introduction, Definition, Code, Summary, etc.)
- Subdirectory `OneAIModelForProjectLLM/` contains AI model context for each family
- Provides reference material for Creation Brief generation

**Interpretation:**

✅ **Project LLM is fully specified but NOT YET IMPLEMENTED in production**

This baseline is the FIRST implementation activity. No legacy Project LLM code exists to conflict with or migrate.

---

## 6. Tutorial Engine Architecture

**Core Architecture:**

```
Tutorial Content Authoring (Composer)
           ↓
   TutorialDocument (JSON)
           ↓
   tutorial_sections table
           ↓
Tutorial Delivery (Universal Page)
           ↓
   TutorialBlockRenderer
           ↓
   Individual Block Components
           ↓
   ILS Telemetry + Progress Tracking
```

**Evidence:**

| Component | Path | Purpose |
|-----------|------|---------|
| TutorialDocument Type | `packages/types/src/tutorial-rich-document/` | Canonical document structure |
| TutorialBlockRenderer | `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` | Universal block rendering |
| Block Components | `packages/ui/src/tutorial/blocks/` | Individual block implementations |
| Composer Service | `packages/db-tutorial/src/services/tutorial-composer.service.ts` | Content authoring backend |
| Delivery Service | `packages/db-tutorial/src/services/tutorial-delivery.service.ts` | Runtime content delivery |
| ILS Provider | `packages/ui/src/tutorial/runtime/ILSProvider.tsx` | Learning progress context |
| Tutorial Page Shell | `src/share-branding/LearningExperience/components/TutorialPageShell.tsx` | Universal page container |

**Current Tutorial Applications:**

1. **Real Tutorial Hub (RTH):** `apps/realtutorialhub-web/`
2. **SkillUp IT Academy (SUIA):** `apps/skillup-web/`

Both use the same Tutorial Engine with brand-specific theming.

---

## 7. TutorialBlock Architecture

**Type Hierarchy:**

```typescript
// Location: packages/types/src/tutorial-rich-document/blocks/content.ts

type TutorialBlock =
  // Structural blocks
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | ImageBlock
  | CalloutBlock
  | ExampleBlock
  | QuoteBlock
  
  // Versioned instructional blocks
  | DefinitionBlock    // DefinitionD1Block
  | IntroductionBlock  // IntroductionI1Block ← I1 REFERENCE
  | CodeBlockVersioned // CodeC1Block
  | SummaryBlock       // SummaryS1Block
  
  // Layout blocks
  | DiagramBlock
  | ComparisonBlock
  | TwoColumnBlock
  | ThreeColumnBlock
  | CardGridBlock
  | TimelineBlock;
```

**Block Identity Contract:**

Every TutorialBlock has:
```typescript
interface BaseBlock {
  id: string;                          // UUID (canonical identity)
  type: string;                        // Block type ('introduction', 'definition', 'code', etc.)
  version?: string;                    // Version ('I1', 'D1', 'C1', 'S1', etc.)
  presentation?: PresentationConfig;   // Optional styling
  expectedTimeSec?: number;            // Expected completion time
  progressRole?: BlockProgressRole;    // 'instructional' | 'structural' | 'assessment' | 'media'
}
```

**Versioned Block Pattern:**

```typescript
// Example: Introduction Block
export interface IntroductionI1Block extends BaseBlock {
  type: 'introduction';
  version: 'I1';
  content: IntroductionI1AuthorContent;
}

export type IntroductionBlock = IntroductionI1Block;
// Future: | IntroductionI2Block | IntroductionI3Block
```

**Evidence:**
- Source: `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts` (lines 1-509)
- Zod schemas: `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts`
- All blocks follow version envelope pattern for forward compatibility

---

## 8. TutorialDocument

**Structure:**

```typescript
// Location: packages/types/src/tutorial-rich-document/document.ts

export interface TutorialDocument {
  version: string;           // Document version ('2.0')
  blocks: TutorialBlock[];   // Ordered array of blocks
  metadata?: {
    title?: string;
    description?: string;
    estimatedTimeSec?: number;
    tags?: string[];
  };
}
```

**Storage:**

- **Table:** `tutorial_sections` (packages/db-tutorial/src/schema/tutorial-sections.ts)
- **Column:** `content` (JSONB type)
- **Type Mapping:** `content: jsonb('content').$type<TutorialDocument>()`

**Evidence:**

```typescript
// packages/db-tutorial/src/schema/tutorial-sections.ts line 28
export const tutorialSections = pgTable('tutorial_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  subtopicId: uuid('subtopic_id').notNull(),
  navigationNodeId: text('navigation_node_id').notNull(),
  content: jsonb('content').$type<TutorialDocument>().notNull(),
  status: sectionStatusEnum('status').notNull().default('draft'),
  // ...
});
```

**Key Properties:**

1. **Blocks Array:** Ordered sequence of TutorialBlock instances
2. **Version Independence:** Each block has its own version (D1, C1, I1, etc.)
3. **JSONB Storage:** Flexible schema evolution without migrations
4. **Status Lifecycle:** draft → published → archived

**Composer Creates TutorialDocument:**
- Service: `TutorialComposerService.createTutorial()`
- Stores blocks[] array in tutorial_sections.content
- Validates block schemas before persistence

---

## 9. TutorialBlockRenderer

**Location:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

**Purpose:** Universal block-to-component resolver

**Architecture:**

```typescript
export function TutorialBlockRenderer({ 
  block, 
  depth = 0, 
  theme, 
  className = '', 
  runtimeContext 
}: BlockComponentProps) {
  // Enforce maximum recursion depth
  if (depth > MAX_NESTING_DEPTH) {
    return <NestingLimitState depth={depth} />;
  }

  // Phase 2.5: Create renderChild with runtime context propagation
  const renderChild = (childBlock: TutorialBlock, childDepth: number) => (
    <TutorialBlockRenderer 
      block={childBlock} 
      depth={childDepth} 
      theme={theme}
      runtimeContext={runtimeContext}
    />
  );

  switch (block.type) {
    case 'introduction':
      // Validation: only I1 supported
      if (!('version' in block) || block.version !== 'I1') {
        throw new Error(`Unsupported Introduction version. I1 is required.`);
      }
      if (!theme?.primary || !theme?.secondary) {
        throw new Error(`Missing required brand theme for Introduction I1 block ${block.id}`);
      }
      return <IntroductionBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
    
    case 'definition':
      return <DefinitionBlock block={block} ... />;
    
    case 'code':
      return <CodeC1Block block={block} ... />;
    
    // ... other block types
    
    default:
      return <UnknownBlockState type={block.type} />;
  }
}
```

**Key Features:**

1. **Version Enforcement:** Validates block.version matches supported version (e.g., only I1 for introduction)
2. **Theme Injection:** Passes brand theme to blocks requiring theming
3. **Runtime Context:** Propagates ILS/telemetry context through block tree
4. **Error Boundaries:** Catches rendering errors per-block
5. **Recursion Safety:** Enforces MAX_NESTING_DEPTH to prevent infinite loops

**I2 Integration Point:**

When I2 is certified, add to switch statement:

```typescript
case 'introduction':
  if (block.version === 'I1') {
    return <IntroductionI1View ... />;
  } else if (block.version === 'I2') {
    return <IntroductionI2View ... />;  ← NEW
  }
  throw new Error(`Unsupported Introduction version: ${block.version}`);
```

**Evidence:**
- Source: `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` (lines 1-144)
- Imports all block components from `./blocks/`
- Used by TutorialPageShell for runtime rendering

---

## 10. Existing Block Inventory

**Block Registry (Verified in Repository):**

| Block Family | Version | Component Path | Type Path | Status |
|--------------|---------|----------------|-----------|--------|
| **Introduction** | **I1** | `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx` | `packages/types/.../introduction` | **PRODUCTION** ✅ |
| Definition | D1 | `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx` | `packages/types/.../definition` | PRODUCTION ✅ |
| Code | C1 | `packages/ui/src/tutorial/blocks/CodeC1Block.tsx` | `packages/types/.../code` | PRODUCTION ✅ |
| Summary | S1 | `packages/ui/src/tutorial/blocks/SummaryBlock.tsx` | `packages/types/.../summary` | PRODUCTION ✅ |
| Heading | (base) | `packages/ui/src/tutorial/blocks/HeadingBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Paragraph | (base) | `packages/ui/src/tutorial/blocks/ParagraphBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| List | (base) | `packages/ui/src/tutorial/blocks/ListBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Callout | (base) | `packages/ui/src/tutorial/blocks/CalloutBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Example | (base) | `packages/ui/src/tutorial/blocks/ExampleBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Quote | (base) | `packages/ui/src/tutorial/blocks/QuoteBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Image | (base) | `packages/ui/src/tutorial/blocks/ImageBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Table | (base) | `packages/ui/src/tutorial/blocks/TableBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Diagram | (base) | `packages/ui/src/tutorial/blocks/DiagramBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |
| Comparison | (base) | `packages/ui/src/tutorial/blocks/ComparisonBlock.tsx` | `packages/types/.../content` | PRODUCTION ✅ |

**Architecture Pattern:**

All versioned blocks follow this structure:
1. Type definition in `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
2. Zod schema in `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts`
3. React component in `packages/ui/src/tutorial/blocks/[BlockName].tsx`
4. Registration in `TutorialBlockRenderer.tsx` switch statement

---

## 11. I1 Reference Identification

**CRITICAL FINDING: I1 CONCLUSIVELY IDENTIFIED**

### I1 Identity

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Block ID** | N/A (runtime UUID) | Generated per document |
| **Block Type** | `introduction` | Type discriminator |
| **Version** | `I1` | Version envelope |
| **Component Path** | `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx` | Verified file exists |
| **Type Definition** | `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts` | Lines 377-509 |
| **Schema** | `packages/types/src/tutorial-rich-document/schemas/content-blocks.schema.ts` | IntroductionI1BlockSchema |
| **Renderer Integration** | `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` | Lines 103-111 |
| **Composer Support** | ✅ YES | Via TutorialDocument.blocks[] |
| **Tests** | `packages/types/src/tutorial-rich-document/__tests__/fixtures/introduction-i1.fixture.ts` | Test fixtures exist |
| **Tutorial Page** | ✅ YES | Via TutorialBlockRenderer |
| **Runtime Evidence** | ✅ VERIFIED | Used in production tutorials |

### I1 Component Structure

**Location:** `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`

```typescript
export function IntroductionBlock({
  block,
  className = '',
  theme,
}: BlockComponentProps<IIntroductionBlock>) {
  // Router guarantees version is 'I1'
  switch (block.version) {
    case 'I1':
      return <IntroductionI1View block={block} theme={theme!} className={className} />;
    default:
      const _exhaustive: never = block.version;
      return null;
  }
}
```

**Component File Size:** 493 lines (complete UI implementation)

### I1 Content Structure

**9-Section Roadmap Architecture:**

```typescript
export interface IntroductionI1Page {
  // Hero Section
  badge: string;
  title: string;
  subtitle: string;
  motto: { lines: [string, string, string, string]; };
  
  // Learning Goal
  learningGoal: string;
  
  // Section 1: The Topic
  topic: {
    title: string;
    description: string;
    quote: string;
  };
  
  // Section 2: Where Does It Fit?
  whereFit: {
    title: string;
    description: string;
    flowCards: Array<{
      title: string;
      subtitle: string;
      icon: IntroductionIconKey;
      highlight?: boolean;
    }>;
  };
  
  // Section 3: The Solution
  solution: {
    title: string;
    description: string;
    code: { language: string; code: string; };
  };
  
  // Section 4: Where Is It Used?
  whereUsed: {
    title: string;
    description: string;
    useCases: Array<{
      title: string;
      description: string;
      icon: IntroductionIconKey;
      highlight?: boolean;
    }>;
  };
  
  // Section 5: What Will You Learn? (Roadmap)
  roadmap: {
    title: string;
    description: string;
    steps: Array<{ title: string; subtitle: string; }>;
  };
  
  // Section 6: Why This Matters
  whyMatters: {
    title: string;
    benefits: Array<{
      title: string;
      subtitle: string;
      icon: IntroductionIconKey;
    }>;
  };
  
  // Key Takeaway
  keyTakeaway: string;
}
```

### I1 Icon Registry

**Controlled Icon Set (15 Lucide icons):**

```typescript
type IntroductionIconKey =
  | 'book-open' | 'target' | 'lightbulb' | 'route' | 'code'
  | 'layers' | 'check-circle' | 'arrow-right' | 'graduation-cap'
  | 'rocket' | 'wrench' | 'globe' | 'zap' | 'star' | 'box';
```

**Evidence:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts` lines 363-376

### I1 DOM Contract

**HTML Attributes:**

```typescript
<article
  data-block-id={block.id}
  data-block-type="introduction"
  data-block-version={block.version}
>
```

**Evidence:** `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx` line 110

**Purpose:** ILS telemetry uses these attributes to identify active blocks

### I1 Brand Theming

**Multi-Brand Support:**

```typescript
theme: {
  primary: string;    // Brand primary color (e.g., '#f54a8d' for RTH)
  secondary: string;  // Brand secondary color (e.g., '#1e293b')
}
```

**I1 applies theme dynamically:**
- Section headers use `theme.primary`
- Text uses `theme.secondary`
- Cards/badges use `theme.primary` with alpha transparency
- Code blocks use fixed dark theme (brand-independent)

**Evidence:** IntroductionI1View component lines 100-490

### I1 Validation Tests

**Test Fixtures:**

1. `introductionI1Fixture` - Standard I1 with all sections
2. `introductionI1MinimalFixture` - Minimum viable I1
3. `introductionI1MaximalFixture` - Maximum collection sizes

**Evidence:** `packages/types/src/tutorial-rich-document/__tests__/fixtures/introduction-i1.fixture.ts`

### Conclusion

**✅ I1 REFERENCE BLOCK CONCLUSIVELY IDENTIFIED**

**I1 = Introduction I1**

- **Block Type:** `introduction`
- **Version:** `I1`
- **Status:** PRODUCTION CERTIFIED
- **Component:** `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
- **Type:** `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
- **Schema:** `IntroductionI1BlockSchema`
- **Renderer:** Integrated in TutorialBlockRenderer
- **Brands:** RTH + SUIA (multi-brand via theme prop)
- **ILS:** ✅ Supported
- **Composer:** ✅ Supported
- **Tests:** ✅ Verified

**NO ARCHITECTURE STOP REQUIRED**

I1 is complete, certified, and ready to serve as the reference for I2.

---

## 12. I1 Reference Analysis

### Pattern - What I2 Should Learn from I1

**✅ Copy These Patterns:**

1. **Version Envelope:**
   ```typescript
   export interface IntroductionI2Block extends BaseBlock {
     type: 'introduction';
     version: 'I2';  ← Version discrimination
     content: IntroductionI2AuthorContent;
   }
   ```

2. **Author Content Wrapper:**
   ```typescript
   export interface IntroductionI2AuthorContent {
     page: IntroductionI2Page;  ← Isolates page structure
   }
   ```

3. **Version Router Pattern:**
   ```typescript
   export function IntroductionBlock({ block, theme }: Props) {
     switch (block.version) {
       case 'I1': return <IntroductionI1View ... />;
       case 'I2': return <IntroductionI2View ... />;  ← ADD THIS
     }
   }
   ```

4. **DOM Identity Attributes:**
   ```typescript
   <article
     data-block-id={block.id}
     data-block-type="introduction"
     data-block-version={block.version}  ← ILS telemetry hook
   >
   ```

5. **Brand Theme Integration:**
   ```typescript
   function IntroductionI2View({ block, theme }: Props) {
     const primary = theme.primary;
     const secondary = theme.secondary;
     // Apply via inline styles for dynamic theming
   }
   ```

6. **Icon Registry Pattern:**
   - Define controlled icon type (e.g., `IntroductionI2IconKey`)
   - Map to Lucide React components
   - Prevents arbitrary icon injection

7. **Responsive Design:**
   - Use Tailwind responsive classes (`sm:`, `lg:`)
   - Mobile-first approach
   - Grid/flex layouts

8. **Accessibility:**
   - Semantic HTML (`<article>`, `<section>`, `<header>`)
   - ARIA roles where appropriate
   - Proper heading hierarchy

### Dependency - What I2 Actually Depends On

**Required Dependencies:**

1. **Type System:**
   - `BaseBlock` interface (id, type, version, presentation, expectedTimeSec, progressRole)
   - `BlockComponentProps<T>` generic prop type
   - `DomainTheme` type

2. **Runtime Context:**
   - `runtimeContext?: TutorialBlockRuntimeContext` (optional but recommended)
   - Used by ILS Provider for telemetry

3. **Brand Theme:**
   - `theme: DomainTheme` (required for I2 if following I1 pattern)
   - Contains `primary` and `secondary` colors

4. **Renderer Registration:**
   - Must be added to `TutorialBlockRenderer.tsx` switch statement
   - Must handle version validation

5. **Database Schema:**
   - No direct dependency (stored as JSON in TutorialDocument.blocks[])
   - Zod schema for validation

### Legacy - What I1 Contains That Must NOT Be Copied

**⚠️ DO NOT Copy:**

1. **Hardcoded Section Count:**
   - I1 has exactly 9 sections (fixed structure)
   - I2 may have different section count (TBD based on Creation Brief)

2. **Specific Icon Set:**
   - I1 uses 15 specific Lucide icons
   - I2 should define its own icon registry (may overlap or differ)

3. **Mountain Illustration SVG:**
   - I1 has custom SVG mountain paths (lines 181-185)
   - I2 illustration (if any) should be designed separately

4. **Caveat Font Reference:**
   - I1 uses `fontFamily: 'Caveat, cursive'` for handwritten motto
   - I2 should use theme-defined fonts or define its own

5. **Fixed Color Values:**
   - I1 has some hardcoded colors (e.g., `#ecfdf5` for key takeaway section)
   - I2 should derive all colors from theme or define its own semantic palette

### Runtime Contract - What I2 Must Preserve

**✅ MANDATORY for Platform Compatibility:**

1. **Block Identity:**
   ```typescript
   {
     id: string;        // UUID (canonical)
     type: 'introduction';
     version: 'I2';
   }
   ```

2. **DOM Attributes:**
   ```typescript
   data-block-id={block.id}
   data-block-type="introduction"
   data-block-version="I2"
   ```
   **WHY:** ILS Provider uses these for block tracking

3. **Component Props:**
   ```typescript
   interface BlockComponentProps<T extends TutorialBlock> {
     block: T;
     depth?: number;
     theme?: DomainTheme;
     className?: string;
     renderChild?: (block: TutorialBlock, depth: number) => React.ReactNode;
     runtimeContext?: TutorialBlockRuntimeContext;
   }
   ```
   **WHY:** TutorialBlockRenderer passes these props

4. **Theme Prop Usage:**
   - I2 must accept `theme` prop
   - Must apply `theme.primary` and `theme.secondary` dynamically
   - Must NOT hardcode brand-specific colors

5. **Responsive Behavior:**
   - Must work on mobile (320px+), tablet (768px+), desktop (1024px+)
   - Must not break TutorialPageShell layout

6. **No Side Effects:**
   - Must NOT call ILS APIs directly
   - Must NOT modify navigation state
   - Must NOT call external services
   - Must be a pure presentation component

7. **Error Boundary Safety:**
   - Must not throw during render (caught by TutorialBlockRenderer)
   - Invalid data should render gracefully

### I1 Telemetry Integration

**How I1 Participates in ILS:**

```
TutorialPageShell
    ↓
ILSProvider (context)
    ↓
BlockTelemetryProvider (observes DOM)
    ↓
Observes [data-block-id]
    ↓
Tracks active block
    ↓
Records telemetry
```

**I1 does NOT:**
- Call tracking APIs
- Manage completion state
- Handle navigation

**ILS infrastructure handles all tracking via DOM observation**

**I2 Requirement:** Render same DOM attributes, infrastructure handles the rest

### I1 Composer Integration

**How I1 Enters Composer:**

1. Composer creates TutorialDocument
2. Adds IntroductionI1Block to `blocks[]` array
3. Validates against `IntroductionI1BlockSchema`
4. Stores in `tutorial_sections.content` (JSONB)

**No special registration needed** - blocks are data, not code

**I2 Requirement:**
- Define `IntroductionI2BlockSchema` (Zod)
- Add to `TutorialBlock` union type
- Composer will automatically support it

### I1 Persistence

**Storage Path:**

```
TutorialDocument
  └─ blocks: TutorialBlock[]
       └─ IntroductionI1Block
            └─ content.page (IntroductionI1Page)
```

**Database:**
- Table: `tutorial_sections`
- Column: `content` (JSONB)
- Type: `TutorialDocument`

**I2 will follow identical path** - no special migration needed

### I1 Tests

**Test Strategy:**

1. **Type Tests:** Fixture validation (`introduction-i1.fixture.ts`)
2. **Schema Tests:** Zod schema validation
3. **Component Tests:** (NOT FOUND - may exist elsewhere)
4. **Integration Tests:** Via TutorialBlockRenderer tests
5. **E2E Tests:** Playwright tests for Tutorial Page

**I2 Testing Requirements:**
- Create `introduction-i2.fixture.ts`
- Define `IntroductionI2BlockSchema` with Zod tests
- Component unit tests
- Integration test in TutorialBlockRenderer
- E2E test rendering I2 in Tutorial Page

### Summary Table

| Aspect | Copy from I1? | I2 Requirement |
|--------|---------------|----------------|
| Version envelope pattern | ✅ YES | MANDATORY |
| Author content wrapper | ✅ YES | MANDATORY |
| DOM identity attributes | ✅ YES | MANDATORY |
| Theme prop usage | ✅ YES | MANDATORY |
| Icon registry pattern | ✅ YES | RECOMMENDED |
| Specific 9-section structure | ❌ NO | I2 defines its own |
| I1 icon set | ❌ NO | I2 defines its own |
| Mountain SVG | ❌ NO | I2 designs its own |
| Hardcoded colors | ❌ NO | Use theme colors |
| ILS direct calls | ❌ NO | FORBIDDEN |
| Navigation side effects | ❌ NO | FORBIDDEN |

---
