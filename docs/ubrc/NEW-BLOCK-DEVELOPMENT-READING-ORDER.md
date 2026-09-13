# New UBRC Block Development - Authoritative Reading Order

**Last Updated:** 2026-09-13  
**Purpose:** Definitive reading order for creating new UBRC blocks  
**Status:** FINAL — Multi-brand, theme-aware, Tutorial V2 block-based architecture

---

## Critical Principles

### The New Block Must Follow BOTH Contracts

```text
UBRC Contract
    +
Multi-Brand/Theme Contract
```

### The Intended Flow

```text
Brand-independent block content
              ↓
       Tutorial Composer
              ↓
             UBRC
              ↓
   Runtime theme injection
              ↓
      ILS Runtime telemetry
              ↓
        LSNB / RSSB
```

### The Most Important Rule

**The new block should require changes ONLY to the normal block pipeline:**

```text
Content type/schema
      ↓
TutorialBlock union
      ↓
Canonical builder
      ↓
React block component
      ↓
TutorialBlockRenderer
      ↓
Tests
```

**It should NOT require new implementations of:**

```text
❌ ILS Runtime
❌ LSNB
❌ RSSB
❌ Telemetry
❌ Database persistence
❌ Active-time tracking
❌ Page aggregation
❌ Brand detection
❌ Theme resolution
```

> If adding a normal block requires modifying those systems, STOP and report the reason instead of making changes automatically.

---

## Authoritative Reading Order (25 Documents)

### Phase 1: Foundation & Entry Point

#### 1. `docs/ubrc/ARCHITECTURE-DOCUMENTATION-INDEX.md`
**Purpose:** Navigate the complete documentation set  
**Read for:**
- Overview of all 23+ UBRC documents
- Document relationships
- Quick navigation by topic
- Current implementation status

#### 2. `docs/ubrc/TUTORIAL-PAGE-ENGINEERING-SOP.md`
**Purpose:** Engineering standards and rules for Tutorial V2  
**Read for:**
- Identity architecture (navigationNodeId, subtopicId, blockId)
- Block versioning rules (permanent, never rename)
- Universal features vs block-specific features
- ILS/LSNB/RSSB separation of concerns
- DOM identity attributes (data-block-id, data-block-type, data-block-version)
- New block development SOP
- Testing requirements

**Critical Rules:**
- Every block must have a block contract
- Block versioning is permanent
- Every block is an independent component
- Universal features live above individual blocks
- ILS observes, does not own Tutorial content

---

### Phase 2: Primary Authority

#### 3. `docs/ubrc/UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`
**Purpose:** Main entry point for every new block  
**Read for:**
- Prototype-to-production workflow
- D1/C1 reference-pattern usage
- Required TypeScript/React conversion
- Existing `TutorialBlock` union usage
- Existing `TutorialBlockRenderer` registration
- DOM identity requirements
- Prohibition on block-specific ILS, RSSB, LSNB, telemetry, API, or database logic
- Required validation and testing

**This is your PRIMARY IMPLEMENTATION GUIDE.**

---

### Phase 3: UBRC Contract Authority

#### 4. `ILS_UI_UX/docs/02-Gate-2-Architecture-Definition.md`
**Purpose:** Primary UBRC architecture specification  
**Read for:**
- What UBRC means
- Required block identity
- Passive DOM-observer architecture
- Runtime boundary
- Why blocks must not own lifecycle or telemetry logic
- The standard contract expected by the runtime

**This is the AUTHORITATIVE UBRC SPECIFICATION.**

---

### Phase 4: Multi-Brand & Theme Contracts (MANDATORY)

#### 5. `docs/ubrc/UBRC-MULTI-BRAND-THEME-CONTRACT.md`
**Purpose:** Main contract for brand-independent blocks  
**Read for:**
- NO `brandId` inside block JSON
- NO theme object inside block JSON
- NO hardcoded RTH or SkillUp colors
- Theme resolved at runtime
- Theme passed through existing runtime/component props
- One block implementation serves both brands
- Brand identity remains at document/database/runtime level

**MANDATORY — Every new block must be brand-independent.**

#### 6. `docs/ubrc/TutorialPageArchitectEngineTheme.md`
**Purpose:** Actual theme implementation architecture  
**Read for:**
- Brand detection
- Runtime theme resolution
- Theme providers/context
- Theme propagation
- Domain themes vs brand themes
- CSS variables
- Tailwind integration
- How to consume `theme.primary`, `theme.secondary`, etc.

**Follow the existing D1/C1 theme-consumption pattern.**

#### 7. `docs/ubrc/TutorialPageArchitectEngineContent.md`
**Purpose:** Content delivery and rendering architecture  
**Read for:**
- TutorialDocument structure
- Block rendering pipeline
- Content storage (JSONB)
- Content versioning
- Delivery service patterns
- SSR vs CSR considerations

#### 8. `docs/ubrc/TutorialPageArchitectEngineUI_UX.md`
**Purpose:** UI/UX patterns and component architecture  
**Read for:**
- Page layout structure
- Navigation patterns
- LSNB (Left Side Navigation Bar)
- RSSB (Right Side Status Bar)
- Tutorial content area
- Responsive design patterns
- Accessibility requirements

---

### Phase 5: Reference Implementations

#### 9. Actual D1 Definition Block Implementation
**Files to inspect:**
- `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- Type definitions
- Content schema
- Props structure
- Component implementation
- Theme usage (20+ instances of theme.primary/secondary)
- DOM identity attributes
- Test files

**D1 is the REFERENCE PATTERN for all blocks.**

#### 10. Actual C1 Code Block Implementation
**Files to inspect:**
- `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
- Type definitions
- Content schema
- Props structure
- Component implementation
- Theme usage (30+ instances of theme.primary/secondary)
- DOM identity attributes
- Test files

**C1 is the SECONDARY REFERENCE PATTERN.**

> **Important:** Verify actual repository paths before using. Copy proven patterns for type definitions, content schema, props, component structure, canonical builder integration, renderer dispatch, and test structure.

#### 11. `docs/ubrc/definition-block-version-architecture.md`
**Purpose:** Reference implementation architecture for Definition Block  
**Read for:**
- Complete 18-block system overview (137 versions)
- D1 implementation details
- Version-aware architecture pattern
- Three-layer model: Author Content → Canonical Document → Runtime Presentation
- System-controlled hierarchy
- Brand independence principles
- Composer architecture (one composer per block type, not per version)
- Type safety and validation patterns

**Critical Principle:** "Definition Block serves as the locked reference pattern for all remaining blocks"

---

### Phase 6: Detailed Implementation Workflow

#### 12. `docs/ubrc/TUTORIAL-BLOCK-CREATION-WORKFLOW.md`
**Purpose:** Complete execution sequence  
**Read for:**
1. Inspecting the prototype
2. Inspecting D1 and C1
3. Defining the new content type
4. Adding schema validation
5. Extending the existing `TutorialBlock` union
6. Updating the canonical builder
7. Creating the React component
8. Adding the renderer dispatch case
9. Adding tests
10. Verifying Composer rendering

#### 13. `docs/ubrc/NEW-BLOCK-QUICK-START-CHECKLIST.md`
**Purpose:** Short operational checklist  
**Read for:**
- Pre-development checklist
- Type definition steps
- Component implementation steps
- Renderer registration steps
- Composer integration steps
- Validation schema steps
- Testing requirements
- Verification checklist

#### 14. `docs/ubrc/CORRECTIONS-APPLIED.md`
**Purpose:** Known corrections and architectural mistakes to avoid  
**Read for:**
- Previously identified errors
- Corrected audit findings
- Architectural clarifications

---

### Phase 7: Composer Integration

#### 15. `docs/ubrc/COMPOSER-UBRC-INTEGRATION-GATE-PHASE-0-BASELINE.md`
**Purpose:** Understand Composer/UBRC integration baseline  
**Read for:**
- Where Composer is located
- How the existing document structure is assembled
- Which runtime/provider boundaries already exist
- The verified baseline before adding a block

#### 16. `docs/ubrc/UBRC-PHASE-1-COMPLIANCE-AUDIT-REPORT.md`
**Purpose:** Verify UBRC compliance requirements  
**Read for:**
- Existing UBRC compliance requirements
- What the new block must satisfy
- Compliance verification procedures

#### 17. Latest Composer → UBRC Integration Gate Closure Document
**Purpose:** Current integration status  
**Read for:**
- Current Composer → UBRC integration status
- Schema-validated production scope
- Remaining certification gaps

**Note:** Composer → UBRC integration is closed within the audited, schema-validated production scope. It is not yet certified as universally compliant for every future block. A new block must still pass the existing contract and runtime tests.

---

### Phase 8: ILS Runtime & Telemetry

#### 18. `ILS_UI_UX/docs/06-Gate-3C1-Universal-Block-Telemetry-Audit.md`
**Purpose:** Required universal telemetry participation  
**Read for:**
- Universal telemetry requirements
- Block telemetry contract
- What telemetry the block must expose

#### 19. `ILS_UI_UX/docs/07-Gate-3C1-Execution-Prompt.md`
**Purpose:** Exact audit and verification procedure  
**Read for:**
- Audit execution steps
- Verification requirements
- Testing procedures

#### 20. `ILS_UI_UX/docs/08-Gate-3C1-Audit-Report.md`
**Purpose:** What was already verified  
**Read for:**
- Current verification status
- Conditional gaps
- Remaining verification work

#### 21. `ILS_UI_UX/docs/13-Gate-3C1R-Phase-C-Verification.md`
**Purpose:** Universal block-level read path  
**Read for:**
- Universal block-level read path verification
- Runtime behavior expectations
- Phase C verification status

**Critical:** The new block should NOT implement ILS logic. Its responsibility is only to expose canonical block identity and render correctly. The runtime and ILS layer observe and consume standard state.

---

### Phase 9: LSNB Integration

#### 22. Latest LSNB Architecture and Progress Documents
**Purpose:** Understand LSNB integration  
**Read for:**
- `ActiveBlockContext`
- Navigation state
- Block/page progress
- Completion state
- R/Y/G status (red/yellow/green)

**Critical:** The new block should NOT implement LSNB logic. It should expose canonical block identity. The runtime and LSNB layer observe and consume standard state.

**Current Caution:** LSNB navigation and progress are substantially established, but the red/yellow/green status contract is not yet fully frozen. Thresholds and aggregation semantics still require explicit contract clarification. Do not invent new R/Y/G behavior inside the new block.

---

### Phase 10: RSSB Integration

#### 23. `docs/ubrc/01-RSSB-UI-UX-Audit-Report.md`
**Purpose:** RSSB prototype audit  
**Read for:**
- RSSB prototype audit findings
- Passive-observer design
- RSSB UI architecture

#### 24. Latest RSSB Architecture and Integration Documents
**Purpose:** Current RSSB integration  
**Read for:**
- RSSB UI
- Revision metrics
- ILS data consumption
- Page/block aggregation
- Learner-state presentation

**Critical:** The new block must NOT directly call RSSB or calculate revision metrics. It should provide standard block identity and participate in the universal runtime path:

```text
New Block
   ↓
Tutorial Composer
   ↓
UBRC / DOM identity
   ↓
ActiveBlockContext
   ↓
ILS Runtime
   ↓
LSNB + RSSB
```

**RSSB is a universal consumer of runtime state, not a component embedded into every block.**

---

### Phase 11: Multi-Brand Verification

#### 25. `docs/ubrc/MULTI-BRAND-AUDIT-REPORT-2026-09-13.md`
**Purpose:** Verify multi-brand theme implementation  
**Read for:**
- RealTutorialHub theme rendering (orange #d03f00 / blue #124fd6)
- SkillUp IT Academy theme rendering (pink #f54a8d / navy #133382)
- D1/C1 theme usage patterns
- `brand_id` storage
- ILS `X-Brand` propagation
- Remaining visual and cross-brand verification gaps

**Status:** Code-level partial verification (visual testing pending)

---

### Phase 12: Current Implementation Status

#### 26. `docs/ubrc/REPOSITORY-AUDIT-REPORT-2026-09-13.md`
**Purpose:** Current implementation audit  
**Read for:**
- 2 actual UBRC blocks (D1, C1)
- 15 supporting components (not UBRC blocks)
- Block-by-block evidence matrix
- UBRC identity attribute verification
- Brand-independent architecture verification
- Brand-specific theme rendering verification
- Code-level vs runtime verification distinction
- Legacy tutorial_sections architecture distinction

**Status:** Code-level verification complete, runtime verification pending

---

### Phase 13: Future Planning

#### 27. `docs/ubrc/PLANNED-UBRC-BLOCKS-INVENTORY.md`
**Purpose:** Complete 18-block system inventory  
**Read for:**
- Implemented (2): D1, C1
- Planned (16): IntroductionBlock (I1-I6), ObjectiveBlock (O1-O5), VisualBlock (V1-V10), etc.
- Total: 18 block types, 137 versions
- Version naming conventions
- Implementation roadmap
- Architecture principles

**Critical Constraint:** D1 must pass qualification gate before any other UBRC block work begins.

**Important:** Do NOT interpret the inventory as proof that all listed blocks are implemented. Current scope: D1 and C1 only. Remaining blocks are planned.

---

## Summary: What the New Block Must Do

### ✅ Required

1. **Follow D1/C1 reference pattern**
2. **Extend existing `TutorialBlock` union**
3. **Register in existing `TutorialBlockRenderer`**
4. **Include DOM identity attributes:**
   - `data-block-id`
   - `data-block-type`
   - `data-block-version`
5. **Consume theme via props:**
   - `theme.primary`
   - `theme.secondary`
   - `theme.primaryDark`
6. **NO brand data in block JSON**
7. **NO theme data in block JSON**
8. **NO hardcoded brand colors**
9. **One implementation serves both brands**
10. **Add schema validation**
11. **Update canonical builder**
12. **Add tests**

### ❌ Prohibited

1. **NO ILS runtime implementation**
2. **NO LSNB implementation**
3. **NO RSSB implementation**
4. **NO telemetry APIs**
5. **NO database access**
6. **NO brand detection logic**
7. **NO theme resolution logic**
8. **NO progress persistence**
9. **NO active-time tracking**
10. **NO page aggregation**

---

## Quick Reference: The Normal Block Pipeline

```text
1. Define content type/schema
2. Extend TutorialBlock union
3. Update canonical builder
4. Create React component (follow D1/C1 pattern)
5. Register in TutorialBlockRenderer
6. Add tests
```

**That's it. Nothing else should be required.**

---

## One Final Documentation Task Remains

Create and approve:

```text
docs/ubrc/UBRC-CONTRACT-SCOPE-SPECIFICATION.md
```

This document should explicitly define:
- In-scope UBRC behavior
- Out-of-scope UBRC behavior
- Discovery rules
- Fallback behavior
- Nested-block semantics
- Error-monitoring expectations

**Before claiming universal certification.**

---

## Current Status

### Implemented
✅ 2 UBRC blocks: D1 (Definition), C1 (Code)  
✅ 15 supporting components (primitives for future composition)  
✅ Multi-brand theme architecture  
✅ Tutorial V2 block-based engine  
✅ Comprehensive documentation (27+ files)

### Pending
⏸️ D1 qualification gate (BLOCKER for all other blocks)  
⏸️ 16 UBRC block types (135 versions remaining)  
⏸️ Runtime verification (browser, E2E, integration)  
⏸️ Visual verification (RTH vs SUIA colors)  
⏸️ Cross-brand isolation (E2E test)  
⏸️ UBRC-CONTRACT-SCOPE-SPECIFICATION.md

### Out of Scope
❌ Legacy tutorial_sections (deprecated, scheduled for removal)  
❌ Section-based architecture (replaced by block-based)

---

**Document Status:** FINAL  
**Reading Order Status:** AUTHORITATIVE  
**Multi-Brand Status:** MANDATORY  
**Last Updated:** 2026-09-13  
**Maintainer:** Project AI
