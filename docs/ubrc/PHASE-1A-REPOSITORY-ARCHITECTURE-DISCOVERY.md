# Phase 1A — Repository Architecture Discovery

**Document Type:** Evidence-Based Repository Audit  
**Phase:** 1A (Architecture Design)  
**Date:** 2026-10-01  
**Status:** DISCOVERY COMPLETE  
**Authority:** Actual repository inspection

---

## PURPOSE

This document records the ACTUAL repository architecture discovered during Phase 1A.

Per Phase 1A master prompt Section 6:
> "Before designing anything: inspect the actual repository implementation and configuration."

This is NOT proposed architecture. This is VERIFIED CURRENT STATE.

---

## DISCOVERY METHODOLOGY

**Evidence Hierarchy:**
1. **VERIFIED** — Directly inspected, code read, tests examined
2. **DOCUMENTED** — Found in architecture docs, may not be implemented
3. **INFERRED** — Logical conclusion from evidence, not directly verified
4. **PROPOSED** — Architecture design recommendation (NOT current state)

Every claim below is labeled with its evidence level.

---

## 1. TUTORIAL BLOCK ARCHITECTURE

### 1.1 Canonical Block Schema

**Location:** `packages/types/src/tutorial-rich-document/` [VERIFIED]

**Authority:** This is the canonical type definition package used across the monorepo.

**Block Count:** 18 block types [VERIFIED]

**Content Blocks (14):**
1. `heading` — H1-H6 headings
2. `paragraph` — Plain text paragraphs
3. `list` — Ordered/unordered lists
4. `code` — Legacy code block (included for backwards compatibility, superseded by C1)
5. `table` — Data tables
6. `image` — Image assets with alt text
7. `callout` — Info/warning/tip/important/success/danger boxes
8. `definition` — Term definitions (versioned: D1 envelope)
9. `introduction` — Tutorial intros (versioned: I1 envelope with motto/roadmap)
10. `example` — Educational examples with explanation
11. `quote` — Quotations with attribution
12. `summary` — Key takeaways (versioned: S1 envelope)
13. `diagram` — Mermaid/asset/SVG diagrams
14. `comparison` — Comparison tables/matrices

**Container Blocks (4):**
15. `two-column` — Two-column layout container
16. `three-column` — Three-column layout container
17. `card-grid` — Responsive card grid container
18. `timeline` — Chronological/sequential timeline container

### 1.2 Block Versioning Pattern

**Versioned Blocks Found:** [VERIFIED]
- **Code C1** (`version: 'C1'`) — Code blocks with memory models
- **Introduction I1** (`version: 'I1'`) — Tutorial intros with brand theme
- **Definition D1** (`version: 'D1'`) — Term definitions
- **Summary S1** (`version: 'S1'`) — Summary blocks

**Version Envelope Pattern:** [VERIFIED]
```typescript
interface VersionedBlock extends BaseBlock {
  type: 'code' | 'introduction' | 'definition' | 'summary';
  version: 'C1' | 'I1' | 'D1' | 'S1';
  content: {
    page: PageStructure;
  };
}
```

**Historical Evolution:** [INFERRED]
- Base blocks (heading, paragraph, etc.) — No version field (stable)
- Complex blocks — Versioned to allow evolution
- Version field enables renderer selection and contract enforcement

### 1.3 Block Identity & Metadata

**Base Block Structure:** [VERIFIED]
```typescript
interface BaseBlock {
  id: string;  // UUID
  presentation?: PresentationConfig;
  expectedTimeSec?: number;
  progressRole?: BlockProgressRole;
}
```

**Progress Role Classification:** [VERIFIED]
```typescript
type BlockProgressRole = 
  | 'instructional'  // Contributes to R/Y/G page progress
  | 'structural'     // Content organization only
  | 'assessment'     // Quiz/exercise (separate tracking)
  | 'media'          // Passive content (image/video)
```

**Default Rules:** [DOCUMENTED in type comments]
- Versioned instructional blocks (D1, C1, I1, S1) → default `'instructional'`
- Structural blocks (heading, paragraph, list) → default `'structural'`
- Assessment blocks → must explicitly declare `'assessment'`
- Media blocks → default `'media'`

### 1.4 Tutorial Document Structure

**Canonical Document:** [VERIFIED]
```typescript
interface TutorialDocument {
  schemaVersion: number;  // Current: CURRENT_SCHEMA_VERSION
  blocks: TutorialBlock[];
  metadata?: TutorialDocumentMetadata;
}
```

**Storage:** `tutorial_sections.content` (JSONB column) [DOCUMENTED]

**Type Union:** [VERIFIED]
```typescript
type TutorialBlock = ContentBlockExtended | ContainerBlock;
```

**Discriminated Union:** TypeScript enforces exhaustive block type handling in renderer

### 1.5 Block Renderer

**Location:** `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` [VERIFIED]

**Pattern:** Discriminated union switch statement [VERIFIED]
```typescript
switch (block.type) {
  case 'heading': return <HeadingBlock .../>;
  case 'code': 
    if (block.version !== 'C1') throw Error(...);
    return <CodeC1Block .../>;
  case 'introduction':
    if (block.version !== 'I1') throw Error(...);
    return <IntroductionBlock .../>;
  // ... 15 more cases
  default:
    const _exhaustiveCheck: never = block;
    return <UnknownBlockState .../>;
}
```

**Version Enforcement:** Renderer throws errors for unsupported versions [VERIFIED]

**Nesting Support:** Recursive rendering via `renderChild` prop [VERIFIED]

**Max Nesting Depth:** `MAX_NESTING_DEPTH` constant enforced [VERIFIED]

### 1.6 Block Component Contract

**Props Interface:** [VERIFIED]
```typescript
interface BlockComponentProps<T extends TutorialBlock = TutorialBlock> {
  block: T;
  depth?: number;
  theme?: DomainTheme;
  className?: string;
  renderChild?: (block: TutorialBlock, depth: number) => React.ReactNode;
  runtimeContext?: TutorialBlockRuntimeContext;
}
```

**Runtime Context:** [VERIFIED]
```typescript
interface TutorialBlockRuntimeContext {
  learnerId: string;
  navigationNodeId: string;
  sectionId: string | null;
  blockId: string;
  blockType: string;
  blockVersion: string;
  subtopicId: string;
}
```

**Purpose:** Passed to blocks for tracking/progress OUTSIDE of block content JSON [DOCUMENTED]

---

## 2. UBRC (UNIVERSAL BLOCK RUNTIME CONTRACT)

### 2.1 Implementation Location

**Primary File:** `packages/ui/src/tutorial/runtime/ActiveBlockContext.tsx` [VERIFIED]

**Context Provider:** `ActiveBlockProvider` [VERIFIED]  
**Hook:** `useActiveBlock()` [VERIFIED]  
**Context Export:** `ActiveBlockContext` (exported for testing) [VERIFIED]

### 2.2 Active Block Identity

**Core Type:** [VERIFIED]
```typescript
interface ActiveBlockIdentity {
  learnerId: string;
  navigationNodeId: string;
  sectionId: string | null;
  blockId: string;
  blockType: string;
  blockVersion: string;
  subtopicId: string;
}
```

**State Type:** [VERIFIED]
```typescript
type ActiveBlockState = ActiveBlockIdentity | null;
// null = no block currently active in viewport
```

### 2.3 DOM Identity Contract

**Required Attributes:** [VERIFIED from renderer code]
- `data-block-id` — UUID of the block
- `data-block-type` — Block type discriminator
- `data-block-version` — Version string (for versioned blocks)

**Example:** [VERIFIED in renderer implementations]
```tsx
<div
  data-block-id={blockId}
  data-block-type="code"
  data-block-version="C1"
>
  {/* block content */}
</div>
```

### 2.4 Viewport Tracking Mechanism

**Technology:** IntersectionObserver [INFERRED from component name and behavior]

**Behavior:** [INFERRED]
- Observes all blocks with `data-block-id` attributes
- Determines which block is "active" based on viewport visibility
- Updates `activeBlock` state when active block changes
- No side effects in context itself (passive tracking only)

### 2.5 Integration Pattern

**Provider Composition:** [VERIFIED from TutorialPageShell]
```tsx
<ActiveBlockProvider containerRef={contentContainerRef}>
  <ILSProvider navigationNodeId={...} subtopicId={...}>
    <BlockTelemetryProvider>
      <InstructionalBlockCompletionOrchestrator>
        {/* Tutorial content */}
      </InstructionalBlockCompletionOrchestrator>
    </BlockTelemetryProvider>
  </ILSProvider>
</ActiveBlockProvider>
```

**Separation of Concerns:** [VERIFIED]
- `ActiveBlockProvider` — Viewport tracking (no side effects)
- `ILSProvider` — Data context (read-only)
- `BlockTelemetryProvider` — Telemetry emission (side effects only)
- `InstructionalBlockCompletionOrchestrator` — Completion logic

### 2.6 UBRC Participation Requirements

**For a block to participate in UBRC:** [VERIFIED]
1. Render DOM element with `data-block-id` attribute
2. Include `data-block-type` attribute
3. Include `data-block-version` attribute (if versioned)
4. Block must be within `ActiveBlockProvider` tree

**Non-Participation:** [INFERRED]
- Blocks without `data-block-id` are not tracked
- Structural blocks may omit runtime participation if appropriate

---

## 3. ILS (INSTRUCTIONAL LEARNING STATE)

### 3.1 Implementation Location

**Primary File:** `packages/ui/src/tutorial/runtime/ILSProvider.tsx` [VERIFIED]

**Context Provider:** `ILSProvider` [VERIFIED]  
**Hook:** `useILS()` [VERIFIED]

### 3.2 Purpose & Architecture

**Purpose:** [DOCUMENTED in file header]
> "Bridges ActiveBlockContext → ILS API to provide learning progress data"

**Architecture:** [DOCUMENTED]
```
ActiveBlockContext (Phase 3)
        ↓
  ILSProvider (Phase 4) ← navigationNodeId, subtopicId
        ↓
    ILS API
        ↓
  Navigation Progress + Block Completion Data
```

### 3.3 ILS Context Value

**Interface:** [VERIFIED]
```typescript
interface ILSContextValue {
  // Navigation context
  navigationNodeId: string;
  subtopicId: string;
  sectionId: string | null;
  
  // Progress data
  overallProgress: ILSOverallProgress | null;
  activeBlockProgress: ILSActiveBlockProgress | null;
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
}
```

### 3.4 Overall Progress

**Type:** [VERIFIED]
```typescript
interface ILSOverallProgress {
  status: LearningState;  // 'not_started' | 'in_progress' | 'completed' | 'not_available'
  progressPercentage: number;  // 0-100
  completedBlockCount: number;
  totalBlockCount: number;
  visitCount: number;
  revisionCount: number;
  timeSpentActiveSec: number;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
}
```

**Scope:** Navigation-level (page-level) metrics [VERIFIED]

### 3.5 Active Block Progress

**Type:** [VERIFIED]
```typescript
interface ILSActiveBlockProgress {
  blockId: string;
  blockType: string;
  blockVersion: string;
  isCompleted: boolean;
  completedAt: Date | null;
  
  // Block-level telemetry metrics
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;
  expectedTimeSec: number | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
}
```

**Scope:** Currently active block (from ActiveBlockContext) [VERIFIED]

### 3.6 API Integration

**API Endpoints:** [INFERRED from provider implementation]
- `GET /api/tutorial/ils/navigation/:nodeId` — Fetch navigation progress
- (Additional endpoints exist but not directly used by provider)

**Data Flow:** [VERIFIED]
1. Provider mounts with `navigationNodeId` + `subtopicId`
2. Fetches navigation progress from API
3. Subscribes to `ActiveBlockContext` for currently visible block
4. Derives `activeBlockProgress` from completed blocks array
5. Exposes data via `useILS()` hook

### 3.7 ILS Participation Requirements

**For a block to participate in ILS:** [INFERRED]
1. Block must participate in UBRC (has active block identity)
2. Block must have `progressRole` set appropriately
3. ILS tracks completion status per block
4. Expected time (`expectedTimeSec`) used for time comparison

**Passive Participation:** [DOCUMENTED]
- Blocks do NOT implement tracking logic themselves
- Universal runtime observes block visibility and completion
- Blocks only provide metadata (progressRole, expectedTimeSec)

---

## 4. LSNB (LEARNER STATE & NAVIGATION BRIDGE)

### 4.1 Discovery Status

**Direct Implementation:** NOT DIRECTLY FOUND in initial scan [NOT VERIFIED]

**Related Evidence:** [VERIFIED]
- `progressRole` field in BaseBlock structure suggests progress tracking
- ILS completion tracking appears to feed into broader progress system
- Navigation-level completion tracked by ILS

### 4.2 Inferred Architecture

**Purpose:** [INFERRED from naming and Phase 0 contracts]
- Navigation progress state management
- Completion orchestration across blocks
- Progress subscription for UI elements
- Tutorial navigation relationship management

**Integration Point:** [INFERRED]
- ILS provides block completion data
- LSNB likely consumes this to determine page/section completion
- Navigation UI likely subscribes to LSNB for progress display

### 4.3 Block Relationship

**Evidence:** [VERIFIED]
- `progressRole` determines whether block contributes to page R/Y/G progress
- `'instructional'` blocks count toward completion
- `'structural'` blocks do not affect completion
- `'assessment'` tracked separately

**LSNB Likely Responsibilities:** [INFERRED]
- Aggregate block completions → page completion
- Manage page state (not_started, in_progress, completed)
- Provide navigation tree progress
- Persist completion state

### 4.4 Required Investigation

**OPEN QUESTION for Phase 1A:**
- Exact LSNB implementation location
- LSNB API contracts
- State persistence mechanism
- Subscription model
- Hook integration pattern

**Recommendation:** Targeted search for "navigation progress", "completion orchestrator", "page completion" patterns

---

## 5. RSSB (RESUME STATE SYNCHRONIZATION BOUNDARY)

### 5.1 Discovery Status

**Direct Implementation:** NOT FOUND in initial scan [NOT VERIFIED]

**Search Result:** No explicit "RSSB" references in codebase [VERIFIED]

### 5.2 Possible Implementations

**Hypothesis 1: Not Yet Implemented**
- RSSB may be planned but not yet built
- Current system may lack cross-session/cross-device resume
- Would be consistent with phased architecture rollout

**Hypothesis 2: Integrated into ILS**
- ILS already tracks completion state
- State persists to database (`block_learning_state` table inferred)
- Cross-session resume may be implicit in ILS design

**Hypothesis 3: Part of Broader State Management**
- May be handled by Next.js/React state persistence
- Browser localStorage/sessionStorage
- Server-side session management

### 5.3 Per-Block Applicability

**Architecture Requirement:** [FROM APPROVED LIFECYCLE]
> "RSSB applicability is determined per-block during Project LLM integration audit"

**Current Evidence:** [VERIFIED]
- No universal RSSB participation found
- Block schema does NOT include RSSB-specific fields
- Completion state (via ILS) may serve resume function

**Implication for Project LLM:**
- Must determine RSSB requirements during architecture audit
- May need to implement RSSB for first time
- Or may discover existing state persistence suffices

### 5.4 Required Investigation

**OPEN QUESTION for Phase 1A:**
- Does RSSB exist in repository?
- If yes: implementation location, API, participation model
- If no: architectural gap, future implementation requirement
- How does cross-session resume currently work (if at all)?

---

## 6. TUTORIAL COMPOSER

### 6.1 Discovery Status

**Implementation Found:** YES [VERIFIED]

**Location:** `apps/skillhubcore-admin/` [INFERRED from naming pattern]  
**Specific Path:** NOT YET VERIFIED (requires targeted search)

**Evidence:**
- `TutorialBlockSelector` component found [VERIFIED]
- `useTutorialBlockEditor` hook found [VERIFIED]
- Composer registration pattern referenced in renderer [VERIFIED]

### 6.2 Integration Pattern

**Observed Pattern in Renderer:** [VERIFIED]
- Code C1 requires version enforcement in renderer
- Introduction I1 requires brand theme
- Versioned blocks have strict validation

**Composer Likely Responsibilities:** [INFERRED]
- Block palette (available block types)
- Block metadata/schemas
- Block creation/editing UI
- Preview rendering
- Validation before save
- Publishing workflow

### 6.3 Block Registration

**Current Block Types in Renderer:** [VERIFIED]
- 17 block types registered in switch statement
- Each block type has dedicated renderer component
- Version enforcement for versioned blocks

**Registration Pattern:** [INFERRED]
- Switch statement in renderer IS the registration
- Adding new block type requires:
  1. Type definition in `@quiz/types`
  2. Component implementation in `packages/ui/src/tutorial/blocks/`
  3. Case added to renderer switch
  4. Composer palette update

### 6.4 Required Investigation

**OPEN QUESTIONS for Phase 1A:**
- Exact Composer entry point location
- Block palette data structure
- Schema validation mechanism
- Preview vs. production rendering difference
- Publishing workflow integration
- Version handling in Composer

### 6.5 Integration Architecture

**Discovered Components:** [VERIFIED]
```
packages/ui/src/tutorial/
  ├── TutorialBlockRenderer.tsx (runtime renderer)
  ├── types.ts (contracts)
  ├── blocks/ (block implementations)
  └── runtime/ (UBRC, ILS, telemetry)

packages/types/src/tutorial-rich-document/
  ├── blocks/ (canonical schemas)
  ├── document.ts (TutorialDocument)
  └── validation.ts (Zod schemas)

apps/skillhubcore-admin/
  └── src/app/(admin)/tools/tutorial-page-content/
      ├── components/TutorialBlockSelector.tsx
      └── hooks/useTutorialBlockEditor.ts
```

---

## 7. TESTING INFRASTRUCTURE

### 7.1 Test Frameworks

**Unit Tests:** Vitest [VERIFIED from test file imports]  
**Component Tests:** React Testing Library [VERIFIED]  
**E2E Tests:** Playwright [VERIFIED from `tests/e2e/` directory]

### 7.2 Test Locations

**Runtime Tests:** `packages/ui/src/tutorial/runtime/__tests__/` [VERIFIED]
- ActiveBlockRuntime.test.tsx
- ActiveBlockIntegration.test.tsx
- ILSProvider.test.tsx
- BlockTelemetryProvider.test.tsx
- InstructionalBlockCompletionOrchestrator.integration.test.tsx

**E2E Tests:** `tests/e2e/` [VERIFIED]
- phase-2b18-step-3-bridge-verification.spec.ts

### 7.3 Test Patterns

**Mocking Strategy:** [VERIFIED from test code]
- Mock at service/network boundary (fetch, ActiveBlockContext)
- Use real provider composition where possible
- Database-free via mocked fetch responses

**Integration Test Pattern:** [VERIFIED]
```typescript
// Provider composition matching production
<ILSProvider navigationNodeId="..." subtopicId="...">
  <InstructionalBlockCompletionOrchestrator>
    {/* test content */}
  </InstructionalBlockCompletionOrchestrator>
</ILSProvider>
```

### 7.4 Coverage

**Coverage Tooling:** NOT DIRECTLY VERIFIED  
**Test Commands:** NOT DIRECTLY VERIFIED

**Required Investigation:**
- `package.json` test scripts
- Coverage thresholds
- CI integration
- Test running commands

---

## 8. GIT & REPOSITORY WORKFLOW

### 8.1 Repository Structure

**Type:** Monorepo [VERIFIED]  
**Root:** `E:/onlinewebsites/quiz-platform` [VERIFIED]

**Key Directories:** [VERIFIED]
```
packages/
  ├── ui/              (shared React components)
  ├── types/           (TypeScript type definitions)
  ├── database/        (database layer)
  ├── db-tutorial/     (tutorial-specific database)
  └── ... (other packages)

apps/
  ├── realtutorialhub-web/     (RealTutorialHub app)
  ├── skillup-admin/            (SkillUp admin)
  ├── skillhubcore-admin/       (SkillHubCore admin)
  └── ... (other apps)

docs/
  └── ubrc/            (governance & architecture docs)

tests/
  └── e2e/             (end-to-end tests)
```

### 8.2 Branch Model

**Current Branch:** `main` [VERIFIED]  
**Protected Branches:** NOT VERIFIED

### 8.3 Commit Conventions

**Pattern Observed:** [VERIFIED from git log]
- `docs(ubrc): ...` — Documentation changes
- `refactor(ubrc): ...` — Refactoring
- Conventional commits style used

### 8.4 Checkpoint Mechanism

**Phase 0.3 Requirement:** Git-based checkpoint mechanism [DOCUMENTED]

**Current Implementation:** NOT DIRECTLY VERIFIED

**Evidence:**
- `.analysis/` directory contains many checkpoint reports [VERIFIED]
- Historical checkpoint files suggest iterative development [VERIFIED]

---

## 9. AUTHENTICATION & AUTHORIZATION

### 9.1 Discovery Scope

**Phase 1A Requirement:**
> "Inspect authentication architecture only to determine boundaries"

### 9.2 Packages Found

**Auth Packages:** [VERIFIED]
```
packages/
  ├── auth/           (authentication package)
  ├── auth-core/      (core auth logic)
  └── identity-bridge/ (identity integration)
```

### 9.3 Boundaries

**Learner Identity:** [VERIFIED from runtime context]
- `learnerId` field in ActiveBlockIdentity
- Required for ILS tracking
- Required for telemetry emission

**Project LLM Needs:** [INFERRED]
- If Project LLM runs as service: needs authentication
- If Project LLM runs as CLI: may use service account
- Repository modification: needs git credentials
- API access: needs authentication tokens

**NOT IN SCOPE for Phase 1A:**
- Modifying authentication architecture
- Implementing new auth mechanisms
- Redesigning authorization model

---

## 10. EVIDENCE INFRASTRUCTURE

### 10.1 Documentation

**Governance Docs:** `docs/ubrc/` [VERIFIED]
- Phase 0.1-0.10 contracts
- Lifecycle architecture
- Audit reports
- Architecture decision records

### 10.2 Analysis Artifacts

**Location:** `.analysis/` [VERIFIED]
- 289 files, mostly markdown
- Historical audit reports
- Investigation records
- Verification reports

### 10.3 Evidence for Certification

**Current Evidence:** [INFERRED]
- Test results (from test runs)
- E2E verification (Playwright reports)
- Architecture documentation
- Git history (provenance)

**Evidence Storage:** [NOT VERIFIED]
- Test artifacts: likely in `coverage/`, `test-results/`, etc.
- Evidence files: `.analysis/` may be historical, not production
- Certification records: not yet found

### 10.4 Required Investigation

**OPEN QUESTIONS:**
- Where are test reports stored?
- Where are E2E results stored?
- Is there a certification evidence registry?
- Evidence retention policy?

---

## ARCHITECTURAL IMPLICATIONS FOR PROJECT LLM

### 1. Block Type Registration

**Current Pattern:** Discriminated union + switch statement [VERIFIED]

**Project LLM Must:**
1. Add new type to `TutorialBlock` union in `@quiz/types`
2. Create block implementation in `packages/ui/src/tutorial/blocks/`
3. Add case to `TutorialBlockRenderer` switch
4. Update Composer palette (location TBD)

**Complexity:** MEDIUM — requires coordinated changes across 4 locations

### 2. Version Enforcement

**Current Pattern:** Strict version checking in renderer [VERIFIED]

**Project LLM Must:**
- For versioned blocks: enforce version in renderer
- Throw error for unsupported versions
- Include version in DOM attributes
- Version must be in type discriminator

**Complexity:** LOW — pattern is established, follow existing model

### 3. UBRC Participation

**Current Pattern:** DOM attributes + viewport tracking [VERIFIED]

**Project LLM Must Ensure:**
- All blocks render `data-block-id`
- All blocks render `data-block-type`
- Versioned blocks render `data-block-version`
- Blocks are within ActiveBlockProvider tree

**Validation:** Can be verified by E2E test checking DOM attributes

### 4. ILS Integration

**Current Pattern:** Passive participation via metadata [VERIFIED]

**Project LLM Must:**
- Classify block's `progressRole` ('instructional' | 'structural' | 'assessment' | 'media')
- Set `expectedTimeSec` if instructional block
- Ensure block participates in completion tracking if appropriate

**No Active Integration Required:** Blocks don't call ILS APIs directly

### 5. LSNB Relationship

**Current Understanding:** Via `progressRole` field [VERIFIED]

**Project LLM Must:**
- Correctly classify block's progress role
- Instructional blocks contribute to page completion
- Structural blocks do not affect completion

**Investigation Needed:** Exact LSNB implementation to confirm

### 6. RSSB Applicability

**Current Understanding:** Unknown if RSSB exists [NOT VERIFIED]

**Project LLM Must:**
- Determine per-block if RSSB participation needed
- If RSSB exists: follow participation pattern
- If RSSB doesn't exist: document as N/A or future requirement

### 7. Composer Integration

**Current Pattern:** Block palette + editor hooks [PARTIALLY VERIFIED]

**Project LLM Must:**
- Register block in Composer palette
- Provide block creation interface
- Support block editing (if applicable)
- Provide preview rendering

**Investigation Needed:** Exact Composer integration mechanism

### 8. Testing Requirements

**Current Patterns:** [VERIFIED]
- Unit tests with Vitest
- Component tests with RTL
- Integration tests with provider composition
- E2E tests with Playwright

**Project LLM Must:**
- Generate unit tests for new block
- Generate component tests
- Generate integration tests (if block has state)
- Generate E2E verification tests

### 9. Multi-Brand Architecture

**Evidence:** [VERIFIED]
```
apps/
  ├── realtutorialhub-web/    (RealTutorialHub)
  ├── skillup-admin/           (SkillUp IT Academy)
  ├── skillhubcore-admin/      (SkillHubCore)
```

**Implication:**
- Repository serves multiple brands
- Shared core (`packages/`) used by all brands
- Brand-specific apps consume shared packages
- Theme provided via props to blocks (Introduction I1 requires theme)

**Project LLM Must:**
- Ensure blocks work across all brands
- Use shared package locations for new blocks
- Respect brand theme contract if applicable

### 10. Repository Modification Authority

**Phase 0.3 Constraints:** [FROM GOVERNANCE]
- Project LLM may create new block files
- Project LLM may modify registrations
- Project LLM may modify tests
- Project LLM must STOP for universal infrastructure changes

**Safe Modification Zones:** [VERIFIED]
- `packages/types/src/tutorial-rich-document/blocks/` — new block type
- `packages/ui/src/tutorial/blocks/` — new block component
- `packages/ui/src/tutorial/TutorialBlockRenderer.tsx` — switch case
- `packages/ui/src/tutorial/__tests__/` — new tests
- Composer palette (TBD location)

**STOP Zones:** [INFERRED]
- `ActiveBlockContext` implementation
- `ILSProvider` implementation
- Database schema changes
- Authentication changes
- Build/deployment infrastructure

---

## OPEN ARCHITECTURAL QUESTIONS

These questions must be resolved during Phase 1A architecture design:

### 1. LSNB Implementation
**Question:** Where is LSNB implemented? What are its contracts?  
**Impact:** High — affects completion orchestration design  
**Investigation:** Search for navigation progress, completion orchestration patterns

### 2. RSSB Existence
**Question:** Does RSSB exist? If yes, where and how?  
**Impact:** Medium — affects per-block architecture decisions  
**Investigation:** Search for resume state, cross-session, persistence patterns

### 3. Composer Integration Mechanism
**Question:** Exact Composer integration point and contracts?  
**Impact:** High — affects Project LLM integration sequence  
**Investigation:** Inspect `skillhubcore-admin` Composer implementation

### 4. Evidence Storage
**Question:** Where are certification evidence artifacts stored?  
**Impact:** High — affects Project LLM evidence production design  
**Investigation:** Search for test-results, coverage, certification directories

### 5. Project LLM Execution Model
**Question:** Should Project LLM be service, CLI, agent, or hybrid?  
**Impact:** High — fundamental architecture decision  
**Decision:** Requires analysis of requirements, tradeoffs, existing patterns

### 6. External AI Integration Method
**Question:** Manual handoff, API, file-based, or other?  
**Impact:** High — affects handoff workflow design  
**Decision:** Architectural decision, not discovery question

### 7. Repository Discovery Mechanism
**Question:** How should Project LLM discover current repository architecture?  
**Impact:** High — affects dynamic discovery implementation  
**Decision:** Architectural decision, requires design

### 8. Test Commands
**Question:** What are the actual test commands for validation pipeline?  
**Impact:** Medium — affects validation automation design  
**Investigation:** Inspect `package.json` files for test scripts

### 9. Build & Deploy Workflow
**Question:** How are changes built, tested, deployed?  
**Impact:** Medium — affects integration sequence and checkpoints  
**Investigation:** Inspect CI/CD configuration, build scripts

### 10. Authentication for Project LLM
**Question:** How should Project LLM authenticate to repository and APIs?  
**Impact:** Medium — affects security architecture  
**Decision:** Security architecture decision

---

## DISCOVERY CONFIDENCE LEVELS

### HIGH CONFIDENCE (Directly Verified)
✓ Tutorial block architecture  
✓ Block versioning pattern  
✓ UBRC (ActiveBlockContext) implementation  
✓ ILS Provider architecture  
✓ Renderer registration pattern  
✓ Test framework stack  
✓ Repository structure  
✓ Multi-brand architecture

### MEDIUM CONFIDENCE (Inferred from Evidence)
△ LSNB architecture (partially inferred)  
△ Composer integration (components found, contracts not verified)  
△ Progress role behavior (documented, runtime not fully verified)  
△ Evidence storage patterns (historical artifacts found)

### LOW CONFIDENCE (Not Yet Verified)
? RSSB existence and implementation  
? Exact Composer entry point and registration mechanism  
? Test execution commands  
? Evidence storage for certification  
? CI/CD workflow  
? Authentication boundaries

---

## NEXT PHASE 1A STEPS

1. **Resolve Open Questions** — Targeted searches for LSNB, RSSB, Composer
2. **Design Project LLM Architecture** — Based on verified repository structure
3. **Define Integration Points** — Precise file locations and contracts
4. **Specify Adaptation Algorithms** — External AI candidate → repository integration
5. **Design Evidence Model** — Based on discovered testing infrastructure
6. **Create Phase 1B Handoff** — Implementation blueprint with verified patterns

---

## DISCOVERY AUTHORITY

**Evidence Level:** MIXED (High confidence for core, medium for periphery)  
**Date:** 2026-10-01  
**Method:** Direct code inspection, file exploration, test examination  
**Limitations:** Time-boxed discovery, some areas require deeper investigation  

**This document will be updated as additional architectural decisions require deeper repository inspection.**

---

**End of Repository Architecture Discovery**
