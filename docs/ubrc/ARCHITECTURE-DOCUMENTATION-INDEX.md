# UBRC Architecture Documentation Index

**Last Updated:** 2026-09-13  
**Purpose:** Comprehensive index of all UBRC and Tutorial V2 block-based architecture documentation

---

## Quick Navigation

### 🎯 START HERE for New Block Development
- [NEW-BLOCK-DEVELOPMENT-READING-ORDER.md](#reading-order) — **AUTHORITATIVE 27-document reading order (START HERE)**

### Current Implementation Status
- [REPOSITORY-AUDIT-REPORT-2026-09-13.md](#repository-audit-report) — Current state audit (2 UBRC blocks, 15 components)
- [MULTI-BRAND-AUDIT-REPORT-2026-09-13.md](#multi-brand-audit-report) — Brand theme verification
- [PLANNED-UBRC-BLOCKS-INVENTORY.md](#planned-blocks-inventory) — Complete 18-block system (137 versions)

### Block Development Guides
- [UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md](#authoritative-guide) — How to create UBRC blocks
- [NEW-BLOCK-QUICK-START-CHECKLIST.md](#quick-start-checklist) — Development checklist
- [TUTORIAL-BLOCK-CREATION-WORKFLOW.md](#block-creation-workflow) — Step-by-step workflow

### Architecture References
- [definition-block-version-architecture.md](#definition-block-architecture) — Reference implementation (D1-D6)
- [TUTORIAL-PAGE-ENGINEERING-SOP.md](#engineering-sop) — Engineering standards
- [tutorialengine.md](#tutorial-engine) — Tutorial Engine architecture

### Multi-Brand & Theme
- [UBRC-MULTI-BRAND-THEME-CONTRACT.md](#multi-brand-contract) — Brand-theme separation contract
- [TutorialPageArchitectEngineTheme.md](#theme-architecture) — Theme engine architecture

### Technical Architecture
- [TutorialPageArchitectEngineContent.md](#content-architecture) — Content delivery architecture
- [TutorialPageArchitectEngineUI_UX.md](#ui-ux-architecture) — UI/UX architecture

### Verification & Testing
- [VERIFICATION-NEXT-STEPS.md](#verification-steps) — Pending verification checklist

---

## Document Summaries

### 🎯 Reading Order

**File:** `NEW-BLOCK-DEVELOPMENT-READING-ORDER.md`

**Purpose:** Definitive authoritative reading order for creating new UBRC blocks

**Key Contents:**
- Complete 27-document reading order in dependency sequence
- Critical principles: UBRC + Multi-brand contracts
- The intended flow: Composer → UBRC → Runtime theme → ILS → LSNB/RSSB
- The most important rule: Normal block pipeline only (no ILS/LSNB/RSSB implementation)
- Phase-by-phase reading structure (13 phases)
- Required vs prohibited implementations
- Quick reference: normal block pipeline
- Current status and pending work
- D1 qualification gate blocker

**Status:** FINAL — Multi-brand, theme-aware, Tutorial V2 block-based architecture

**Use For:**
- **PRIMARY ENTRY POINT for new block development**
- Understanding complete documentation hierarchy
- Avoiding architectural mistakes
- Ensuring multi-brand compliance
- Following established patterns
- Knowing what NOT to implement

**Critical Rules:**
- New block requires changes ONLY to normal pipeline (content type → union → builder → component → renderer → tests)
- New block must NOT implement: ILS, LSNB, RSSB, telemetry, database, brand detection, theme resolution
- New block must follow BOTH: UBRC contract + Multi-brand/theme contract
- One block implementation serves both brands (RTH + SUIA)
- D1 qualification gate is BLOCKER for all other UBRC blocks

---

### Repository Audit Report

**File:** `REPOSITORY-AUDIT-REPORT-2026-09-13.md`

**Purpose:** Comprehensive audit-only verification of all existing UBRC blocks

**Key Contents:**
- Complete inventory: 2 actual UBRC blocks (D1, C1), 15 supporting components
- Block-by-block evidence matrix
- UBRC identity attribute verification
- Brand-independent architecture verification
- Brand-specific theme rendering verification
- Code-level vs runtime verification distinction
- Legacy tutorial_sections architecture distinction

**Status:** Code-level verification complete, runtime verification pending

**Use For:**
- Understanding current implementation state
- Identifying actual UBRC blocks vs supporting components
- Reference for what has been verified
- Gap analysis for remaining verification work

---

### Multi-Brand Audit Report

**File:** `MULTI-BRAND-AUDIT-REPORT-2026-09-13.md`

**Purpose:** Verify D1/C1 blocks receive brand-specific themes for RealTutorialHub and SkillUp IT Academy

**Key Contents:**
- Theme resolution mechanism (getRuntimeBrandConfig)
- RTH theme: orange (#d03f00) / blue (#124fd6)
- SUIA theme: pink (#f54a8d) / navy (#133382)
- D1 theme usage: 20+ instances of theme.primary/secondary
- C1 theme usage: 30+ instances of theme.primary/secondary
- Database schema: brand_id at table level
- ILS API: X-Brand header mechanism

**Status:** Code-level partial verification (visual testing pending)

**Use For:**
- Understanding multi-brand theme architecture
- Verifying brand-theme separation
- Reference for theme propagation patterns
- Multi-brand new block development

---

### Planned Blocks Inventory

**File:** `PLANNED-UBRC-BLOCKS-INVENTORY.md`

**Purpose:** Complete inventory of the 18-block UBRC system with 137 total versions

**Key Contents:**
- **Implemented (2):** D1, C1
- **Planned (16):** IntroductionBlock (I1-I6), ObjectiveBlock (O1-O5), VisualBlock (V1-V10), ComparisonBlock (CP1-CP8), ExecutionBlock (E1-E8), MemoryBlock (M1-M8), MistakeBlock (MT1-MT8), BestPracticeBlock (BP1-BP7), SummaryBlock (S1-S6), QuestionBlock (Q1-Q8), ExerciseBlock (EX1-EX8), TaskBlock (T1-T8), InteractiveBlock (INT1-INT6), QuizBlock (QZ1-QZ8), InterviewBlock (IV1-IV7), ProjectBlock (P1-P8)
- Version naming conventions
- Implementation roadmap
- Architecture principles applying to all blocks

**Critical Constraint:** D1 must pass qualification gate before any other UBRC block work begins

**Use For:**
- Understanding the complete UBRC block vision
- Planning future block development
- Version nomenclature reference
- Total system scope awareness

---

### Authoritative Guide

**File:** `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`

**Purpose:** Complete guide for creating new UBRC blocks

**Key Contents:**
- What is a UBRC block vs supporting component
- Block identity requirements (id, type, version)
- Brand-independent content contract
- Theme propagation patterns
- Passive runtime behavior rules
- Composer integration requirements
- ILS/LSNB/RSSB integration patterns
- Type system and validation
- Renderer registration

**Use For:**
- Creating new UBRC blocks
- Understanding UBRC contracts
- Architectural decision reference
- Block development best practices

---

### Quick Start Checklist

**File:** `NEW-BLOCK-QUICK-START-CHECKLIST.md`

**Purpose:** Development checklist for new UBRC blocks

**Key Contents:**
- Pre-development checklist
- Type definition steps
- Component implementation steps
- Renderer registration steps
- Composer integration steps
- Validation schema steps
- Testing requirements
- Verification checklist

**Use For:**
- Step-by-step block development
- Ensuring complete implementation
- QA checklist
- Development progress tracking

---

### Block Creation Workflow

**File:** `TUTORIAL-BLOCK-CREATION-WORKFLOW.md`

**Purpose:** Phase-based workflow for creating UBRC blocks

**Key Contents:**
- Phase 1: AI generates HTML/CSS/JS prototype
- Phase 2: Convert to TypeScript/React UBRC block
- Phase 3: Integration and validation
- Free AI vs Project AI roles
- D1/C1 as reference implementations
- Brand-independent requirements
- UBRC identity attributes

**Use For:**
- Understanding block creation process
- AI-assisted block development
- Workflow phase transitions
- Quality gates

---

### Definition Block Architecture

**File:** `definition-block-version-architecture.md`

**Purpose:** Reference implementation architecture for Definition Block (D1-D6)

**Key Contents:**
- Complete 18-block system overview (137 versions)
- D1 implementation details
- Version-aware architecture pattern
- Three-layer model: Author Content → Canonical Document → Runtime Presentation
- System-controlled hierarchy (no hierarchy in block JSON)
- Brand independence principles
- Composer architecture (one composer per block type, not per version)
- Type safety and validation patterns
- Database JSONB document model

**Critical Principle:** "Definition Block serves as the locked reference pattern for all remaining blocks"

**Use For:**
- Understanding reference implementation
- Version-aware block design
- Architectural patterns for all 18 blocks
- D2-D6 planning (once D1 qualified)

---

### Engineering SOP

**File:** `TUTORIAL-PAGE-ENGINEERING-SOP.md`

**Purpose:** Engineering standards and rules for Tutorial V2 development

**Key Contents:**
- Identity architecture (navigationNodeId, subtopicId, blockId)
- Block versioning rules (permanent, never rename)
- Universal features vs block-specific features
- ILS/LSNB/RSSB separation of concerns
- Tutorial Composer usage rules
- Block identity requirements (id, type, version)
- DOM identity attributes (data-block-id, data-block-type, data-block-version)
- New block development SOP
- Testing requirements
- Migration safety rules

**Critical Rules:**
- Every block must have a block contract
- Block versioning is permanent
- Every block is an independent component
- Universal features live above individual blocks
- ILS observes, does not own Tutorial content

**Use For:**
- Engineering standards reference
- Architecture decision rules
- Separation of concerns
- Identity management
- Development SOPs

---

### Tutorial Engine

**File:** `tutorialengine.md`

**Purpose:** Tutorial Engine architecture and Composer design

**Key Contents:**
- 16-page Composer architecture
- Tutorial Document model
- TutorialBlock union type
- Database schema (tutorial_content with JSONB)
- Content analysis and block suggestions
- Presentation suggestions
- Human-in-the-loop workflow
- 14 implementation prompts
- Component hierarchy
- Legacy 6-block model vs new block architecture

**Use For:**
- Understanding Tutorial Engine design
- Composer architecture
- Content authoring workflow
- AI-assisted content generation
- System architecture overview

---

### Multi-Brand Contract

**File:** `UBRC-MULTI-BRAND-THEME-CONTRACT.md`

**Purpose:** Contract defining brand-theme separation for UBRC blocks

**Key Contents:**
- Brand data MUST NOT be in block JSON
- Theme resolved at runtime via brand context
- Blocks receive theme via props, not from content
- Theme usage: theme.primary, theme.secondary, theme.primaryDark
- Brand stored in tutorial_content.brand_id (table column)
- ILS/LSNB use X-Brand header or brand context
- Each brand deployment hardcodes brand identity
- RSSB filters by brand

**Critical Rules:**
- NO brandId in block content
- NO theme in block content
- NO hardcoded brand colors in blocks
- Single block implementation serves multiple brands

**Use For:**
- Multi-brand block development
- Theme propagation understanding
- Brand-independent content design
- Cross-brand verification

---

### Theme Architecture

**File:** `TutorialPageArchitectEngineTheme.md`

**Purpose:** Theme engine architecture and brand resolution

**Key Contents:**
- Runtime theme resolution
- Brand detection mechanisms
- Theme propagation chains
- Domain themes vs brand themes
- Tailwind configuration
- CSS variable usage
- Theme context providers

**Use For:**
- Understanding theme system
- Theme propagation debugging
- Brand detection flow
- Theme customization

---

### Content Architecture

**File:** `TutorialPageArchitectEngineContent.md`

**Purpose:** Content delivery and rendering architecture

**Key Contents:**
- TutorialDocument structure
- Block rendering pipeline
- Content storage (JSONB)
- Content versioning
- Delivery service patterns
- SSR vs CSR considerations
- Content caching strategies

**Use For:**
- Content delivery understanding
- Rendering pipeline
- Storage architecture
- Performance optimization

---

### UI/UX Architecture

**File:** `TutorialPageArchitectEngineUI_UX.md`

**Purpose:** UI/UX patterns and component architecture

**Key Contents:**
- Page layout structure
- Navigation patterns
- LSNB (Left Side Navigation Bar)
- RSSB (Right Side Status Bar)
- Tutorial content area
- Responsive design patterns
- Accessibility requirements

**Use For:**
- UI component design
- Layout patterns
- Navigation implementation
- Accessibility compliance

---

### Verification Steps

**File:** `VERIFICATION-NEXT-STEPS.md`

**Purpose:** Actionable verification checklist for runtime/integration testing

**Key Contents:**
- Visual rendering verification (browser testing)
- Cross-brand progress isolation test (E2E)
- Composer persistence flow verification
- Telemetry-to-ILS flow tracing
- Completion mechanism documentation
- RSSB brand filtering verification
- Effort estimates for each verification task

**Use For:**
- Runtime verification planning
- Testing task breakdown
- E2E test scenarios
- Integration verification

---

## Document Relationships

```
PLANNED-UBRC-BLOCKS-INVENTORY.md
         ↓
definition-block-version-architecture.md (D1 Reference)
         ↓
UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md
         ↓
NEW-BLOCK-QUICK-START-CHECKLIST.md
         ↓
TUTORIAL-BLOCK-CREATION-WORKFLOW.md
         ↓
REPOSITORY-AUDIT-REPORT-2026-09-13.md (Current State)
```

**Multi-Brand Flow:**
```
UBRC-MULTI-BRAND-THEME-CONTRACT.md
         ↓
TutorialPageArchitectEngineTheme.md
         ↓
MULTI-BRAND-AUDIT-REPORT-2026-09-13.md
```

**Engineering Standards:**
```
TUTORIAL-PAGE-ENGINEERING-SOP.md
         ↓
tutorialengine.md
         ↓
TutorialPageArchitectEngineContent.md
TutorialPageArchitectEngineUI_UX.md
```

---

## Current Status Summary

### Implemented
✅ **2 UBRC Blocks:** D1 (Definition), C1 (Code)  
✅ **15 Supporting Components:** Primitives for future composition  
✅ **Architecture Documentation:** Complete reference architecture  
✅ **Multi-Brand Theme:** Runtime resolution mechanism  
✅ **Tutorial V2 Engine:** Block-based JSONB architecture

### Pending
⏸️ **D1 Qualification Gate:** Must pass before additional blocks  
⏸️ **16 UBRC Block Types:** 135 versions remaining  
⏸️ **Runtime Verification:** Browser testing, E2E tests, integration  
⏸️ **Visual Verification:** RTH vs SUIA color confirmation  
⏸️ **Cross-Brand Isolation:** E2E progress isolation test

### Out of Scope
❌ **Legacy tutorial_sections:** Deprecated, scheduled for removal  
❌ **Section-based architecture:** Being replaced by block-based

---

## Reading Order Recommendations

### For New UBRC Block Development
1. **NEW-BLOCK-DEVELOPMENT-READING-ORDER.md (START HERE)**
2. ARCHITECTURE-DOCUMENTATION-INDEX.md (navigation reference)
3. TUTORIAL-PAGE-ENGINEERING-SOP.md (engineering standards)
4. UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md (implementation guide)
5. 02-Gate-2-Architecture-Definition.md (UBRC contract)
6. UBRC-MULTI-BRAND-THEME-CONTRACT.md (multi-brand contract)
7. TutorialPageArchitectEngineTheme.md (theme architecture)
8. Actual D1 implementation files (reference pattern)
9. Actual C1 implementation files (secondary reference)
10. TUTORIAL-BLOCK-CREATION-WORKFLOW.md (workflow phases)
11. NEW-BLOCK-QUICK-START-CHECKLIST.md (implementation checklist)

**See NEW-BLOCK-DEVELOPMENT-READING-ORDER.md for complete 27-document sequence.**

### For Multi-Brand Development
1. UBRC-MULTI-BRAND-THEME-CONTRACT.md (contract)
2. MULTI-BRAND-AUDIT-REPORT-2026-09-13.md (current verification)
3. TutorialPageArchitectEngineTheme.md (theme architecture)
4. REPOSITORY-AUDIT-REPORT-2026-09-13.md (D1/C1 theme patterns)

### For Architecture Understanding
1. tutorialengine.md (system overview)
2. TUTORIAL-PAGE-ENGINEERING-SOP.md (engineering rules)
3. definition-block-version-architecture.md (reference architecture)
4. TutorialPageArchitectEngineContent.md (content delivery)
5. TutorialPageArchitectEngineUI_UX.md (UI patterns)

### For Verification & Testing
1. VERIFICATION-NEXT-STEPS.md (pending tasks)
2. REPOSITORY-AUDIT-REPORT-2026-09-13.md (what's verified)
3. MULTI-BRAND-AUDIT-REPORT-2026-09-13.md (theme verification)
4. TUTORIAL-PAGE-ENGINEERING-SOP.md (testing requirements)

---

## File Provenance

**Copied from `docs/architecture/`:**
- definition-block-version-architecture.md
- TUTORIAL-PAGE-ENGINEERING-SOP.md
- tutorialengine.md
- TutorialPageArchitectEngineContent.md
- TutorialPageArchitectEngineTheme.md
- TutorialPageArchitectEngineUI_UX.md

**Created in `docs/ubrc/`:**
- REPOSITORY-AUDIT-REPORT-2026-09-13.md
- MULTI-BRAND-AUDIT-REPORT-2026-09-13.md
- PLANNED-UBRC-BLOCKS-INVENTORY.md
- UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md
- NEW-BLOCK-QUICK-START-CHECKLIST.md
- TUTORIAL-BLOCK-CREATION-WORKFLOW.md
- UBRC-MULTI-BRAND-THEME-CONTRACT.md
- VERIFICATION-NEXT-STEPS.md
- ARCHITECTURE-DOCUMENTATION-INDEX.md (this file)

**Other:**
- UBRC-IMPLEMENTATION-PHASE-0-REPO-AUDIT.md (earlier audit)
- CORRECTIONS-APPLIED.md (audit corrections)
- README.md (folder overview)

---

**Index Status:** Complete  
**Total Documents:** 24 files  
**Last Updated:** 2026-09-13  
**Primary Entry Point:** NEW-BLOCK-DEVELOPMENT-READING-ORDER.md  
**Maintainer:** Project AI
