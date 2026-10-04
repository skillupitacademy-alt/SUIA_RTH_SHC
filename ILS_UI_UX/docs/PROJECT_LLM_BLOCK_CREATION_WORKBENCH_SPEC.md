# Project LLM Block Creation Workbench Specification

**Document Type:** Product Specification & Implementation Contract  
**Status:** REVISION 2 — Contract Consistency Pass Complete, Ready for HAA Lock  
**Created:** 2026-10-04  
**Revised:** 2026-10-04 (12 corrections + 10 final contract corrections applied)  
**Technology:** Node.js + TypeScript + React (extending SkillHubCore Admin)

**Related Documents:**
- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md` (phased architecture)
- `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` (locked Phase 1B foundation)
- `PROJECT_LLM_GUI_FIRST_STRATEGY.md` (External AI workflow)

---

## Executive Summary

**Product:** Project LLM Block Creation Workbench — a repository-aware AI workbench for creating, reviewing, adapting, integrating, validating, and certifying Tutorial blocks.

**Purpose:** Assist humans in producing compliant Tutorial blocks by combining repository intelligence, reference patterns, creation briefs, external AI workflow, compliance review, correction loops, integration planning, validation, evidence generation, and certification gates.

**Key Principle:** Project LLM is NOT a general-purpose ChatGPT replacement. It is a **workflow-specific AI engineering control center** that understands THIS repository, THIS architecture, and THESE runtime contracts.

**Technology Stack:** Node.js + TypeScript + React (extends existing SkillHubCore Admin / Tutorial Composer)

**Phase 1 Scope:** Introduction block family pilot — I1 as existing reference, I2 as first new block created via complete workflow (requirement → creation brief → External AI → compliance → integration → validation → evidence → certification → production)

---

## 1. Product Vision

### 1.1 What Project LLM IS

```text
✓ Repository-aware AI workbench
✓ Block creation workflow orchestrator
✓ Creation brief generator
✓ External AI coordinator
✓ Architecture compliance reviewer
✓ Integration planner
✓ Evidence generator
✓ Certification gate enforcer
✓ Human approval boundary enforcer
```

### 1.2 What Project LLM IS NOT

```text
✗ Generic ChatGPT replacement
✗ Autonomous code generator
✗ AI that replaces Human Architecture Authority
✗ System that creates parallel UBRC/ILS/LSNB/RSSB
✗ Direct replacement for Tutorial Composer
✗ Automatic certification system without human approval
✗ System that modifies production architecture autonomously
```

### 1.3 Actor Model

```text
HUMAN ARCHITECTURE AUTHORITY
         │
         │ requirements, decisions, approvals
         ▼
   PROJECT LLM WORKBENCH
         │
         │ creation brief
         ▼
      HUMAN
         │
         │ copies brief
         ▼
   EXTERNAL AI (ChatGPT/Gemini/Claude)
         │
         │ HTML/CSS/JS/JSON prototype
         ▼
      HUMAN
         │
         │ GUI approval
         ▼
   EXTERNAL AI
         │
         │ React/TypeScript implementation
         ▼
      HUMAN
         │
         │ brings candidate back
         ▼
   PROJECT LLM WORKBENCH
         │
         │ audit, adapt, integrate, validate
         ▼
   CERTIFICATION_READY
         │
         │ evidence package
         ▼
   HUMAN ARCHITECTURE AUTHORITY
         │
         │ approval
         ▼
      CERTIFIED
```

**Critical Boundary:** External AI creates compliant candidate components. Project LLM verifies compliance and integrates. External AI does NOT modify UBRC/ILS/LSNB/RSSB/Composer/database architecture.

---

## 2. Workbench Information Architecture

### 2.1 Core Screens (12 Surfaces)

**Implementation Note:** Screens 2-11 are implemented as workflow tabs/panels within an integrated Block Request workspace, NOT as 12 independent pages. Dashboard (Screen 1) and Settings (Screen 12) remain separate global surfaces.

```text
PROJECT LLM WORKBENCH
│
├── 1. Dashboard (global surface)
│
├── Block Request Workspace (Screens 2-11 as tabs/panels)
│   ├── 2. New Block Request
│   ├── 3. Repository Context
│   ├── 4. Creation Brief Builder
│   ├── 5. External AI Handoff
│   ├── 6. Candidate Intake
│   ├── 7. Compliance Review
│   ├── 8. Correction Instructions
│   ├── 9. Integration Plan
│   ├── 10. Validation & Evidence
│   └── 11. Certification Review
│
└── 12. Settings (global surface)
```

### 2.2 Navigation Pattern

```text
┌───────────────────────────────────────────────────────────────┐
│ Project LLM Workbench                              ● Healthy │
├───────────────┬───────────────────────────────────────────────┤
│ Dashboard     │                                               │
│ New Request   │                                               │
│ Repository    │         [Main Content Area]                  │
│ Brief Builder │                                               │
│ External AI   │                                               │
│ Candidates    │                                               │
│ Compliance    │                                               │
│ Corrections   │                                               │
│ Integration   │                                               │
│ Validation    │                                               │
│ Evidence      │                                               │
│ Certification │                                               │
│               │                                               │
│ Settings      │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

**Design Language:**
- Enterprise SaaS aesthetic (not dark/gradient consumer AI)
- Light/white interface (existing SkillHubCore Admin style)
- React + TypeScript
- Tailwind CSS (existing project standard)
- Accessible (WCAG 2.1 AA minimum)

---

## 3. Detailed Screen Specifications

### Screen 1: Dashboard

**Purpose:** Project overview, active workflows, status summary

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Project LLM Dashboard                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Block Requests                               [3]    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Introduction I2                  Compliance Review      ││
│ │ Summary S3                        Brief Ready           ││
│ │ Definition D1                     Candidate Intake      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Certification Ready                                 [1]    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Introduction I3                  Evidence Complete      ││
│ │                                  [Review Certification] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Requires Attention                                  [2]    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Code C2                          Compliance Failed      ││
│ │ Visual V1                        Correction Needed      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Recently Certified                                  [5]    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Introduction I2                  Certified 2026-10-05   ││
│ │ Summary S2                        Certified 2026-10-03  ││
│ │ ...                                                     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [+ New Block Request]                                       │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `ProjectOverviewCard`
- `ActiveWorkflowList`
- `CertificationQueuePanel`
- `AttentionRequiredPanel`
- `RecentActivityTimeline`

**State:**
- `activeRequests: BlockRequest[]`
- `certificationReady: BlockRequest[]`
- `attentionRequired: BlockRequest[]`
- `recentCertified: CertifiedBlock[]`

**Actions:**
- Navigate to specific block request workflow
- Create new block request
- View certification details
- View attention required details

---

### Screen 2: New Block Request

**Purpose:** Human initiates new block creation

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ New Block Request                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Block Family *                                              │
│ [Introduction ▼]                                            │
│                                                             │
│ Block Version                                               │
│ ○ I1  ○ I2  ○ I3  ● New Version                            │
│                                                             │
│ Learning Objective *                                        │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Introduce learners to React hooks...                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Target Tutorial Context *                                   │
│ Domain:    [Web Development ▼]                              │
│ Subject:   [JavaScript      ▼]                              │
│ Topic:     [React           ▼]                              │
│ Subtopic:  [Hooks           ▼]                              │
│                                                             │
│ Brand Scope *                                               │
│ ☑ SkillUp   ☑ RealTutorialHub                              │
│                                                             │
│ Reference Block (optional)                                  │
│ [Browse Repository] [Upload Example]                        │
│                                                             │
│ Special Requirements                                        │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Must include interactive code editor...               │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [Cancel]                           [Create Request]         │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `BlockFamilySelector`
- `BlockVersionSelector`
- `LearningObjectiveInput`
- `TutorialContextSelector`
- `BrandScopeSelector`
- `ReferenceBlockPicker`
- `SpecialRequirementsInput`

**Validation:**
- Block family required
- Learning objective required (min 20 chars)
- Tutorial context required (domain → subject → topic → subtopic)
- At least one brand required
- Reference block optional but validated if provided

**Actions:**
- Create block request → triggers repository discovery phase
- Cancel → return to dashboard

**State Created:**
```typescript
interface BlockRequest {
  id: string;
  family: BlockFamily; // 'introduction' | 'summary' | 'definition' | ...
  version: string; // 'I1' | 'I2' | 'I3' | 'new'
  learningObjective: string;
  tutorialContext: TutorialPromptContext;
  brandScope: Brand[];
  referenceBlock?: ReferenceBlockRef;
  specialRequirements?: string;
  status: WorkflowStatus;
  createdAt: Date;
  createdBy: UserId;
}

type WorkflowStatus = 
  | 'DISCOVERY'
  | 'BRIEF_READY'
  | 'EXTERNAL_AI_HANDOFF'
  | 'CANDIDATE_AWAITING'
  | 'CANDIDATE_RECEIVED'
  | 'COMPLIANCE_REVIEW'
  | 'COMPLIANCE_PASSED'
  | 'COMPLIANCE_FAILED'
  | 'CORRECTION_REQUIRED'
  | 'INTEGRATION_PLANNING'
  | 'VALIDATION'
  | 'EVIDENCE_GENERATION'
  | 'CERTIFICATION_READY'
  | 'HUMAN_REVIEW'
  | 'CERTIFIED'
  | 'REJECTED'
  | 'STOPPED';
```

---

### Screen 3: Repository Context

**Purpose:** Show repository intelligence Project LLM discovered

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Repository Context — Introduction I2                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Repository Architecture                                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Tutorial Composer paths verified                    │  │
│ │ ✓ TutorialBlockRenderer located                       │  │
│ │ ✓ Introduction registry found                         │  │
│ │ ✓ IntroductionI1BlockSchema verified                  │  │
│ │ ✓ ILS runtime contracts verified                      │  │
│ │ ⚠ Introduction I2 not yet implemented                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Existing Introduction Blocks                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ I1 — Production (SkillUp + RTH)                       │  │
│ │   Component: IntroductionI1AuthorContent              │  │
│ │   Schema: IntroductionI1BlockSchema                   │  │
│ │   Renderer: ✓                                         │  │
│ │   ILS: ✓                                              │  │
│ │   [View Reference]                                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Runtime Contracts                                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ UBRC     Universal Block Runtime Contract             │  │
│ │ ILS      In-Lesson System (telemetry)                 │  │
│ │ LSNB     Page/navigation progress                     │  │
│ │ RSSB     LearningProgressSidebar metrics              │  │
│ │ Theme    Multi-brand theming required                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Required Files (will be created/modified)                   │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ packages/types/.../introduction-i2.schema.ts          │  │
│ │ packages/tutorial-rich-document/.../introduction/     │  │
│ │ apps/skillhubcore-admin/.../composer/registry/        │  │
│ │ apps/skillhubcore-admin/.../renderer/                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [Refresh Discovery] [Continue to Brief]                    │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `RepositoryArchitecturePanel`
- `ExistingBlocksList`
- `RuntimeContractsPanel`
- `RequiredFilesPanel`
- `DiscoveryStatusIndicator`

**Repository Intelligence Required:**
- Locate existing block implementations (with evidence)
- Locate schemas, types, validators (with file paths verified)
- Locate Composer registry entries (with actual imports verified)
- Locate TutorialBlockRenderer (with actual implementation verified)
- Locate ILS/LSNB/RSSB contracts (with runtime evidence)
- Verify UBRC compliance patterns (from actual code, not assumptions)
- Identify file paths for new block (from actual directory structure)
- Verify multi-brand support patterns (from actual theme implementation)

**Evidence-Based Discovery Principle:**
- Project LLM must verify every path/import/contract claim with repository evidence
- If repository evidence unavailable: mark UNKNOWN, do not assume
- UNKNOWN findings require STOP → Human review
- "Documentation says X" is NOT evidence that repository implements X
- Only actual verified file paths, imports, and contracts are evidence

**State:**
```typescript
interface RepositoryContext {
  blockRequest: BlockRequest;
  existingBlocks: ExistingBlock[];
  composerPaths: ComposerPaths;
  runtimeContracts: RuntimeContracts;
  requiredFiles: RequiredFile[];
  discoveryStatus: DiscoveryStatus;
  discoveredAt: Date;
}

interface ExistingBlock {
  family: BlockFamily;
  version: string;
  component: string;
  schema: string;
  rendererSupport: boolean;
  composerSupport: boolean;
  ilsSupport: boolean;
  brands: Brand[];
  referencePath: string;
}
```

---

### Screen 4: Creation Brief Builder

**Purpose:** Generate complete creation brief for External AI

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Creation Brief — Introduction I2                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Brief Status: READY                                         │
│                                                             │
│ [Preview Brief] [Regenerate] [Edit]                         │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ # External AI Block Creation Brief                    │  │
│ │                                                       │  │
│ │ ## Block Identity                                     │  │
│ │ Family: Introduction                                  │  │
│ │ Version: I2                                           │  │
│ │ Purpose: [learning objective]                         │  │
│ │                                                       │  │
│ │ ## Reference Implementation                           │  │
│ │ Existing: Introduction I1                             │  │
│ │ [architectural patterns from I1]                      │  │
│ │                                                       │  │
│ │ ## Data Contract                                      │  │
│ │ [JSON schema for block data]                          │  │
│ │                                                       │  │
│ │ ## UI/UX Requirements                                 │  │
│ │ [layout, typography, interaction patterns]            │  │
│ │                                                       │  │
│ │ ## React/TypeScript Requirements                      │  │
│ │ - Component interface: BlockComponentProps            │  │
│ │ - DOM identity attributes required                    │  │
│ │ - Theme support via theme prop                        │  │
│ │                                                       │  │
│ │ ## Platform Contracts                                 │  │
│ │ ### UBRC                                              │  │
│ │ [universal block runtime requirements]                │  │
│ │                                                       │  │
│ │ ### ILS (In-Lesson System)                            │  │
│ │ [telemetry participation requirements]                │  │
│ │                                                       │  │
│ │ ### LSNB                                              │  │
│ │ [page/navigation requirements]                        │  │
│ │                                                       │  │
│ │ ### RSSB                                              │  │
│ │ [metrics participation requirements]                  │  │
│ │                                                       │  │
│ │ ## Multi-Brand Requirements                           │  │
│ │ [SkillUp + RTH theme independence]                    │  │
│ │                                                       │  │
│ │ ## Forbidden Operations                               │  │
│ │ - Do NOT create ILS infrastructure                    │  │
│ │ - Do NOT create LSNB records                          │  │
│ │ - Do NOT create RSSB infrastructure                   │  │
│ │ - Do NOT modify Composer architecture                 │  │
│ │                                                       │  │
│ │ ## Deliverables                                       │  │
│ │ 1. HTML/CSS/JS/JSON prototype first                   │  │
│ │ 2. Human GUI approval required                        │  │
│ │ 3. Then React/TypeScript implementation               │  │
│ │ 4. Component + types + schema + tests                 │  │
│ │ 5. Implementation notes                               │  │
│ │                                                       │  │
│ │ ## Validation Requirements                            │  │
│ │ [expected test coverage]                              │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [Copy to Clipboard] [Download]    [Continue to Handoff]    │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `CreationBriefPreview`
- `BriefSectionEditor`
- `BriefRegenerateButton`
- `CopyToClipboardButton`

**Brief Generation Logic:**
1. Block identity from request
2. Repository context from discovery
3. Reference patterns from existing blocks
4. Data contract from schemas
5. UI/UX requirements from reference + special requirements
6. Platform contracts from UBRC/ILS/LSNB/RSSB discovery
7. Multi-brand requirements from brand scope
8. Forbidden operations (explicit boundaries)
9. Deliverables (workflow steps)
10. Validation requirements

**State:**
```typescript
interface CreationBrief {
  blockRequest: BlockRequest;
  repositoryContext: RepositoryContext;
  briefSections: BriefSection[];
  generatedAt: Date;
  briefVersion: number;
}

interface BriefSection {
  title: string;
  content: string;
  editable: boolean;
  verified: boolean;
}
```

---

### Screen 5: External AI Handoff

**Purpose:** Instructions for human to hand off to External AI

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ External AI Handoff — Introduction I2                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 1: Copy Creation Brief                                 │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Creation Brief ready                                │  │
│ │   [Copy to Clipboard]                                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Step 2: Open External AI                                    │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Recommended:                                          │  │
│ │ • ChatGPT (GPT-4)                                     │  │
│ │ • Claude (Opus/Sonnet)                                │  │
│ │ • Gemini Pro                                          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Step 3: Request HTML/CSS/JS/JSON Prototype                  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Paste the Creation Brief and say:                    │  │
│ │                                                       │  │
│ │ "Create an HTML/CSS/JS/JSON prototype of this        │  │
│ │  Tutorial block. I will visually review it before    │  │
│ │  we proceed to React/TypeScript."                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Step 4: Visual Review                                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Review the HTML/CSS/JS prototype visually.            │  │
│ │ Iterate with External AI until GUI is approved.       │  │
│ │ Do NOT proceed to React until GUI approved.           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Step 5: Request React/TypeScript Implementation             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ After GUI approval, say:                              │  │
│ │                                                       │  │
│ │ "Now convert this to React/TypeScript following      │  │
│ │  the component interface and requirements from       │  │
│ │  the Creation Brief."                                │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Step 6: Bring Implementation Back                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ When ready, return to Project LLM Workbench and      │  │
│ │ submit the candidate implementation.                  │  │
│ │ [Mark Handoff Complete]                               │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [Back to Brief] [Mark Handoff Complete]                     │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `HandoffStepPanel`
- `ExternalAIProviderList`
- `HandoffInstructions`
- `HandoffStatusTracker`

**State:**
```typescript
interface ExternalAIHandoff {
  blockRequest: BlockRequest;
  creationBrief: CreationBrief;
  handoffStatus: HandoffStatus;
  handoffAt?: Date;
  expectedReturnAt?: Date;
}

type HandoffStatus = 
  | 'BRIEF_COPIED'
  | 'EXTERNAL_AI_WORKING'
  | 'GUI_REVIEW'
  | 'REACT_CONVERSION'
  | 'READY_TO_RETURN';
```

**Critical Workflow Boundary:** This screen explicitly documents that GUI approval happens in External AI workflow BEFORE React/TypeScript conversion. Project LLM does not perform this GUI review—human does it with External AI.

---

### Screen 6: Candidate Intake

**Purpose:** Human uploads candidate implementation from External AI

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Candidate Intake — Introduction I2                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Upload Candidate Package                                    │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Drag & drop files here or click to browse            │  │
│ │                                                       │  │
│ │ Expected:                                             │  │
│ │ • React component (.tsx)                              │  │
│ │ • TypeScript types (.ts)                              │  │
│ │ • JSON schema                                         │  │
│ │ • Tests (.test.tsx)                                   │  │
│ │ • Assets (if any)                                     │  │
│ │ • Implementation notes (.md)                          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ or paste code directly:                                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Component Code                                        │  │
│ │ [text area]                                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Types                                                 │  │
│ │ [text area]                                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ JSON Schema                                           │  │
│ │ [text area]                                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Tests                                                 │  │
│ │ [text area]                                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Implementation Notes (optional)                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ External AI provider: ChatGPT GPT-4                   │  │
│ │ GUI iterations: 3                                     │  │
│ │ Known limitations: [...]                              │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [Cancel] [Submit Candidate for Review]                      │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `CandidateUploadPanel`
- `CodePasteArea`
- `FileUploadDragDrop`
- `ImplementationNotesInput`
- `CandidatePreview`

**Validation on Intake:**
- At least component code required
- TypeScript syntax validation
- JSON schema validation
- File naming conventions
- Size limits

**State:**
```typescript
interface CandidatePackage {
  blockRequest: BlockRequest;
  files: CandidateFile[];
  componentCode: string;
  types?: string;
  schema?: string;
  tests?: string;
  assets?: CandidateAsset[];
  implementationNotes?: string;
  externalAIProvider?: string;
  submittedAt: Date;
  submittedBy: UserId;
}

interface CandidateFile {
  name: string;
  content: string;
  type: 'component' | 'types' | 'schema' | 'tests' | 'asset' | 'notes';
}
```

---

### Screen 7: Compliance Review

**Purpose:** Project LLM reviews candidate against repository contracts

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Compliance Review — Introduction I2                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Review Status: IN PROGRESS                                  │
│                                                             │
│ Architecture Compliance                                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ TutorialBlock type contract                         │  │
│ │ ✓ BlockComponentProps interface                       │  │
│ │ ✗ Missing data-block-version attribute                │  │
│ │ ✓ TypeScript strict mode compatible                   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Composer Integration                                        │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Registry entry possible                             │  │
│ │ ✓ Canonical builder compatible                        │  │
│ │ ✓ Editor support possible                             │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Tutorial Page Integration                                   │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ TutorialBlockRenderer compatible                    │  │
│ │ ✓ TutorialPageShell compatible                        │  │
│ │ ✓ Theme prop support                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ UBRC (Universal Block Runtime Contract)                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Block identity attributes present                   │  │
│ │ ✗ Missing data-block-version (REQUIRED)               │  │
│ │ ✓ Rendering contract followed                         │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ILS (In-Lesson System)                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Block exposes identity attributes                   │  │
│ │ ✓ Does not create ILS infrastructure                  │  │
│ │ ✓ Passive telemetry participation                     │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ LSNB (Page/Navigation)                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Does not create LSNB records                        │  │
│ │ ✓ Page-level progress compatible                      │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ RSSB (LearningProgressSidebar)                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Participates via ILS (passive)                      │  │
│ │ ✓ Does not create parallel metrics                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Multi-Brand                                                 │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Theme-agnostic implementation                       │  │
│ │ ⚠ Brand-specific CSS detected (review required)       │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Tests                                                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Component tests present                             │  │
│ │ ✗ ILS telemetry test missing                          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Overall: COMPLIANCE FAILED (3 issues)                       │
│                                                             │
│ [View Detailed Findings] [Generate Corrections] [Override]  │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `ComplianceMatrix`
- `ComplianceCheckItem`
- `ComplianceStatusIndicator`
- `FindingsPanel`
- `ComplianceOverrideDialog` (Human Architecture Authority only — records override reason, authority, evidence, and adds to audit trail; does NOT bypass evidence requirements)

**Compliance Checks:**

1. **Architecture Compliance**
   - TutorialBlock type contract satisfied
   - BlockComponentProps interface used
   - DOM identity attributes present
   - TypeScript strict mode compatible
   - ESLint rules passed

2. **Composer Integration**
   - Registry entry possible
   - Canonical builder compatible
   - Editor support possible
   - Save/publish compatible

3. **Tutorial Page Integration**
   - TutorialBlockRenderer compatible
   - TutorialPageShell compatible
   - Theme prop support
   - Runtime context compatible

4. **UBRC**
   - `data-block-id` present
   - `data-block-type` present
   - `data-block-version` present (REQUIRED)
   - Rendering contract followed

5. **ILS**
   - Block exposes identity attributes
   - Does NOT create ILS infrastructure
   - Does NOT call ILS APIs directly
   - Passive telemetry participation only

6. **LSNB**
   - Does NOT create LSNB records
   - Does NOT modify navigation architecture
   - Page-level progress remains compatible

7. **RSSB**
   - Participates via ILS (passive)
   - Does NOT create parallel metrics API
   - LearningProgressSidebar compatible

8. **Multi-Brand**
   - Theme-agnostic implementation
   - No hard-coded brand references
   - Theme prop properly consumed
   - Works with SkillUp + RTH themes

9. **Tests**
   - Component render tests
   - Props validation tests
   - Accessibility tests
   - ILS telemetry tests
   - Multi-brand tests

**State:**
```typescript
interface ComplianceReview {
  candidatePackage: CandidatePackage;
  checks: ComplianceCheck[];
  overallStatus: ComplianceStatus;
  reviewedAt: Date;
  reviewedBy: 'PROJECT_LLM';
}

interface ComplianceCheck {
  category: ComplianceCategory;
  checkName: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';
  finding?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  correctionRequired: boolean;
}

type ComplianceCategory = 
  | 'ARCHITECTURE'
  | 'COMPOSER'
  | 'TUTORIAL_PAGE'
  | 'UBRC'
  | 'ILS'
  | 'LSNB'
  | 'RSSB'
  | 'MULTI_BRAND'
  | 'TESTS';

type ComplianceStatus = 
  | 'PASSED'
  | 'FAILED'
  | 'WARNINGS'
  | 'REVIEW_REQUIRED';
```

---

### Screen 8: Correction Instructions

**Purpose:** Generate precise correction instructions for External AI

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Correction Instructions — Introduction I2                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Compliance Review Failed: 3 issues                          │
│                                                             │
│ Issue 1: Missing data-block-version                         │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Severity: CRITICAL                                    │  │
│ │                                                       │  │
│ │ Finding:                                              │  │
│ │ The component does not include the required          │  │
│ │ data-block-version DOM attribute.                    │  │
│ │                                                       │  │
│ │ Why it matters:                                       │  │
│ │ UBRC requires this attribute for universal block     │  │
│ │ telemetry and runtime identification.                │  │
│ │                                                       │  │
│ │ Required correction:                                  │  │
│ │ Add data-block-version="I2" to the root element:     │  │
│ │                                                       │  │
│ │ <div                                                  │  │
│ │   data-block-id={block.id}                           │  │
│ │   data-block-type="introduction"                     │  │
│ │   data-block-version="I2"                            │  │
│ │ >                                                     │  │
│ │                                                       │  │
│ │ Reference: existing IntroductionI1AuthorContent      │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Issue 2: Missing ILS telemetry test                         │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Severity: HIGH                                        │  │
│ │                                                       │  │
│ │ Finding:                                              │  │
│ │ Tests do not verify ILS telemetry participation.     │  │
│ │                                                       │  │
│ │ Required correction:                                  │  │
│ │ Add test verifying block exposes identity attributes │  │
│ │ and does not create ILS infrastructure.              │  │
│ │                                                       │  │
│ │ Example test pattern:                                 │  │
│ │ [test code example]                                   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Issue 3: Brand-specific CSS detected                        │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Severity: MEDIUM                                      │  │
│ │                                                       │  │
│ │ Finding:                                              │  │
│ │ Hard-coded color values detected. Should use theme.  │  │
│ │                                                       │  │
│ │ Required correction:                                  │  │
│ │ Replace hard-coded colors with theme variables.      │  │
│ │                                                       │  │
│ │ Before: color: '#1a73e8'                              │  │
│ │ After: color: theme.colors.primary                   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Complete Correction Instructions                            │
│ [Copy to Clipboard] [Download]                              │
│                                                             │
│ [Back to Review] [Send to External AI]                      │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `CorrectionInstructionBuilder`
- `FindingPanel`
- `CorrectionCodeExample`
- `SeverityIndicator`

**Correction Instruction Format:**
```markdown
# Correction Instructions for [Block Family] [Version]

## Issue [N]: [Issue Title]

**Severity:** CRITICAL | HIGH | MEDIUM | LOW

**Finding:**
[What is wrong]

**Why it matters:**
[Impact on architecture/runtime/compliance]

**Required correction:**
[Exact change needed]

**Code example:**
```typescript
[before/after code]
```

**Reference:**
[Link to existing implementation or documentation]
```

**State:**
```typescript
interface CorrectionInstructions {
  complianceReview: ComplianceReview;
  issues: CorrectionIssue[];
  instructionsGenerated: boolean;
  generatedAt: Date;
}

interface CorrectionIssue {
  check: ComplianceCheck;
  finding: string;
  impact: string;
  requiredCorrection: string;
  codeExample?: CodeExample;
  reference?: string;
}
```

---

### Screen 9: Integration Plan

**Purpose:** Project LLM generates integration plan after compliance passes

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Integration Plan — Introduction I2                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Compliance Status: PASSED                                   │
│                                                             │
│ Files to Create                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ packages/types/src/tutorial-rich-document/         │  │
│ │     schemas/introduction-i2.schema.ts                 │  │
│ │                                                       │  │
│ │ ✓ packages/tutorial-rich-document/src/               │  │
│ │     author-content/introduction/                      │  │
│ │     IntroductionI2AuthorContent.tsx                   │  │
│ │                                                       │  │
│ │ ✓ packages/tutorial-rich-document/src/               │  │
│     author-content/introduction/index.ts              │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Files to Modify                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ packages/tutorial-rich-document/src/               │  │
│ │     registry/introduction-registry.ts                 │  │
│ │   + Register Introduction I2                          │  │
│ │                                                       │  │
│ │ ✓ apps/skillhubcore-admin/src/components/            │  │
│ │     tutorial-block-renderer/TutorialBlockRenderer.tsx│  │
│ │   + Add I2 rendering case                             │  │
│ │                                                       │  │
│ │ ✓ packages/types/src/tutorial-rich-document/         │  │
│ │     tutorial-block.ts                                 │  │
│ │   + Add IntroductionI2Block to union                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Composer Integration Steps                                  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 1. Register in Introduction family registry           │  │
│ │ 2. Add canonical builder support                      │  │
│ │ 3. Add editor support (reuse I1 editor pattern)       │  │
│ │ 4. Test save/publish workflow                         │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Tutorial Page Integration Steps                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 1. Verify TutorialBlockRenderer switch case           │  │
│ │ 2. Verify runtime context passing                     │  │
│ │ 3. Verify theme prop                                  │  │
│ │ 4. Test with TutorialPageShell                        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Runtime Verification                                        │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 1. Verify ILS telemetry (ActiveBlockProvider)         │  │
│ │ 2. Verify LSNB page progress (no modification)        │  │
│ │ 3. Verify RSSB metrics (LearningProgressSidebar)      │  │
│ │ 4. Verify multi-brand themes (SkillUp + RTH)          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Estimated Complexity: MEDIUM                                │
│ Estimated Files: 7 (3 new, 4 modified)                     │
│                                                             │
│ [View File Diffs] [Download Plan] [Continue to Validation] │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `IntegrationFilePlan`
- `FileCreatePanel`
- `FileModifyPanel`
- `IntegrationStepsPanel`
- `ComplexityEstimate`

**State:**
```typescript
interface IntegrationPlan {
  candidatePackage: CandidatePackage;
  complianceReview: ComplianceReview;
  filesToCreate: FileOperation[];
  filesToModify: FileOperation[];
  composerSteps: IntegrationStep[];
  tutorialPageSteps: IntegrationStep[];
  runtimeVerification: VerificationStep[];
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedFileCount: number;
  generatedAt: Date;
}

interface FileOperation {
  path: string;
  operation: 'CREATE' | 'MODIFY';
  description: string; // WHAT must change
  reason: string; // WHY it must change
  expectedDiff: string; // Expected changes (not full content)
  validationRequired: string[]; // Tests/checks required
  humanApprovalRequired: boolean;
  verified: boolean;
}

**Phase 1 Constraint:** Integration plan describes changes (WHAT/WHERE/WHY/EXPECTED DIFF), not executable repository modification. Controlled repository modification is a separate Phase 2+ capability requiring explicit governance.

**Phase 1 Repository Mutation Policy:**
- Project LLM does NOT autonomously create files
- Project LLM does NOT autonomously modify files
- Project LLM does NOT autonomously commit changes
- Project LLM does NOT autonomously push changes
- Project LLM GENERATES integration plan describing required changes
- HUMAN executes file creation/modification/commit/push
- OR: Future Phase 2+ controlled mutation capability (requires HAA approval)

interface IntegrationStep {
  description: string;
  automated: boolean;
  humanApprovalRequired: boolean;
}
```

---

### Screen 10: Validation & Evidence

**Purpose:** Run tests, collect evidence, verify runtime behavior

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Validation & Evidence — Introduction I2                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Validation Status: IN PROGRESS                              │
│                                                             │
│ TypeScript Compilation                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ No type errors                                      │  │
│ │ ✓ Strict mode passed                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Linting                                                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ ESLint passed                                       │  │
│ │ ✓ Prettier formatted                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Unit Tests                                                  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Component renders (3 tests)                         │  │
│ │ ✓ Props validation (2 tests)                          │  │
│ │ ✓ ILS telemetry (1 test)                              │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Integration Tests                                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ Composer save/publish (2 tests)                     │  │
│ │ ✓ Tutorial Page rendering (1 test)                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Runtime Verification (Manual)                               │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ⏳ Browser: SkillUp theme                             │  │
│ │    [Launch Test Page] [Upload Screenshot]             │  │
│ │                                                       │  │
│ │ ⏳ Browser: RTH theme                                  │  │
│ │    [Launch Test Page] [Upload Screenshot]             │  │
│ │                                                       │  │
│ │ ⏳ ILS telemetry verification                          │  │
│ │    [Verify ActiveBlock] [Upload Evidence]             │  │
│ │                                                       │  │
│ │ ⏳ LSNB page progress                                   │  │
│ │    [Verify Navigation] [Upload Evidence]              │  │
│ │                                                       │  │
│ │ ⏳ RSSB metrics                                         │  │
│ │    [Verify LearningProgressSidebar] [Upload Evidence] │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Evidence Collected                                          │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ TypeScript compilation log                          │  │
│ │ ✓ Lint output                                         │  │
│ │ ✓ Test results                                        │  │
│ │ ⏳ SkillUp screenshot                                  │  │
│ │ ⏳ RTH screenshot                                      │  │
│ │ ⏳ ILS telemetry proof                                 │  │
│ │ ⏳ LSNB proof                                          │  │
│ │ ⏳ RSSB proof                                          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [View Test Logs] [Continue to Certification]                │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `ValidationStatusPanel`
- `TestResultsPanel`
- `RuntimeVerificationPanel`
- `EvidenceUploadPanel`
- `EvidenceChecklist`

**Evidence Package Requirements:**
```typescript
interface EvidencePackage {
  id: string; // Unique evidence package ID
  blockRequest: BlockRequest;
  integrationPlan: IntegrationPlan;
  
  // Automated evidence
  typescriptCompilation: CompilationResult;
  lintResults: LintResult;
  unitTests: TestResult[];
  integrationTests: TestResult[];
  
  // Manual evidence
  skillUpScreenshot?: Screenshot;
  rthScreenshot?: Screenshot;
  ilsTelemetryProof?: TelemetryProof;
  lsnbProof?: NavigationProof;
  rssbProof?: MetricsProof;
  
  // Metadata
  evidenceCollectedAt: Date;
  evidenceCollectedBy: UserId;
  allEvidenceComplete: boolean;
  
  // Immutability & Audit
  version: number; // Evidence package version (increments on update)
  frozen: boolean; // True once CERTIFICATION_READY marked
  frozenAt?: Date; // Timestamp when frozen
  certificationId?: string; // FK to certification record once certified
}

**Evidence Immutability Policy:**
- Evidence package versioned (increments on update)
- Once Project LLM marks CERTIFICATION_READY: evidence frozen
- Frozen evidence cannot be modified (immutable)
- If evidence needs correction after freeze: new evidence package created (new version)
- HAA certification references specific frozen evidence package version
- Audit trail preserves all evidence package versions

interface Screenshot {
  url: string;
  brand: Brand;
  viewport: string;
  capturedAt: Date;
}

interface TelemetryProof {
  activeBlockId: string;
  visitObserved: boolean;
  activeTimeObserved: boolean;
  persistenceVerified: boolean;
  screenshot?: string;
}
```

**Critical Runtime Verification:**
- Project LLM cannot fully automate browser/runtime verification
- Human must manually verify visual rendering, ILS telemetry, LSNB progress, RSSB metrics
- Evidence must include screenshots + telemetry proof
- Multi-brand verification REQUIRED (both SkillUp + RTH)

---

### Screen 11: Certification Review

**Purpose:** Human Architecture Authority reviews evidence and certifies

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Certification Review — Introduction I2                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Project LLM Assessment: CERTIFICATION_READY                 │
│                                                             │
│ Summary                                                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Block: Introduction I2                                │  │
│ │ Purpose: [learning objective]                         │  │
│ │ Created: 2026-10-03                                   │  │
│ │ Candidate submitted: 2026-10-03                       │  │
│ │ Compliance: PASSED                                    │  │
│ │ Integration: COMPLETE                                 │  │
│ │ Validation: COMPLETE                                  │  │
│ │ Evidence: COMPLETE                                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Compliance Report                                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Architecture         ✓                                │  │
│ │ Composer             ✓                                │  │
│ │ Tutorial Page        ✓                                │  │
│ │ UBRC                 ✓                                │  │
│ │ ILS                  ✓                                │  │
│ │ LSNB                 ✓                                │  │
│ │ RSSB                 ✓                                │  │
│ │ Multi-brand          ✓                                │  │
│ │ Tests                ✓                                │  │
│ │                                                       │  │
│ │ [View Detailed Report]                                │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Evidence Package                                            │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ✓ TypeScript compilation                              │  │
│ │ ✓ Lint results                                        │  │
│ │ ✓ Unit tests (6 passed)                               │  │
│ │ ✓ Integration tests (3 passed)                        │  │
│ │ ✓ SkillUp runtime proof                               │  │
│ │ ✓ RTH runtime proof                                   │  │
│ │ ✓ ILS telemetry proof                                 │  │
│ │ ✓ LSNB proof                                          │  │
│ │ ✓ RSSB proof                                          │  │
│ │                                                       │  │
│ │ [Download Evidence Package]                           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Integration Impact                                          │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Files created: 3                                      │  │
│ │ Files modified: 4                                     │  │
│ │ Architecture changes: None                            │  │
│ │ Breaking changes: None                                │  │
│ │ Rollback plan: Available                              │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Human Architecture Authority Decision                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Review Notes (optional)                               │  │
│ │ [text area]                                           │  │
│ │                                                       │  │
│ │ [REJECT] [REQUEST CHANGES] [APPROVE & CERTIFY]        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `CertificationSummaryPanel`
- `ComplianceReportPanel`
- `EvidencePackagePanel`
- `IntegrationImpactPanel`
- `HumanApprovalPanel`

**Human Architecture Authority Actions:**
```typescript
type CertificationDecision = 
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUIRED';

interface CertificationReview {
  blockRequest: BlockRequest;
  evidencePackage: EvidencePackage;
  projectLLMAssessment: ProjectLLMAssessment;
  humanDecision: CertificationDecision;
  humanReviewNotes?: string;
  reviewedBy: UserId;
  reviewedAt: Date;
  certifiedAt?: Date;
}

interface ProjectLLMAssessment {
  status: 'CERTIFICATION_READY' | 'NOT_READY';
  compliancePassed: boolean;
  integrationComplete: boolean;
  validationComplete: boolean;
  evidenceComplete: boolean;
  recommendApproval: boolean;
  warnings?: string[];
}
```

**STOP Conditions:**
- Project LLM can mark `CERTIFICATION_READY`
- Project LLM CANNOT mark `CERTIFIED`
- Only Human Architecture Authority can APPROVE & CERTIFY
- Human can REJECT or REQUEST CHANGES at any point

---

### Screen 12: Settings

**Purpose:** Configure Project LLM providers, preferences

**Layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ LLM Provider (Server-Side Only)                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Phase 1: Server-side provider integration configured  │  │
│ │ internally. Provider selection UI not exposed.        │  │
│ │                                                       │  │
│ │ Phase 2+: Provider selection UI will allow human     │  │
│ │ configuration of provider choice (OpenAI/Anthropic/   │  │
│ │ Gemini). Credentials remain server-side only.         │  │
│ │                                                       │  │
│ │ Current Phase 1 status: One LLM provider operational │  │
│ │ for repository analysis, brief generation, compliance │  │
│ │ review, correction instructions, integration planning.│  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Repository Settings                                         │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Auto-discover repository changes                      │  │
│ │ ☑ Enabled                                             │  │
│ │                                                       │  │
│ │ Cache repository context                              │  │
│ │ ☑ Enabled (refresh every 1 hour)                     │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Workbench Preferences                                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Default block family: [Introduction ▼]                │  │
│ │                                                       │  │
│ │ Show detailed compliance findings                     │  │
│ │ ☑ Enabled                                             │  │
│ │                                                       │  │
│ │ Auto-generate correction instructions                 │  │
│ │ ☑ Enabled                                             │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Evidence Requirements                                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Require runtime screenshots                           │  │
│ │ ☑ Enabled                                             │  │
│ │                                                       │  │
│ │ Require ILS telemetry proof                           │  │
│ │ ☑ Enabled                                             │  │
│ │                                                       │  │
│ │ Require multi-brand proof                             │  │
│ │ ☑ Enabled                                             │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ [Reset to Defaults] [Save Settings]                         │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- `ProviderSettingsPanel`
- `RepositorySettingsPanel`
- `WorkbenchPreferencesPanel`
- `EvidenceRequirementsPanel`

**Important Note:** LLM provider selection deferred to Phase 2+. Phase 1 uses server-side LLM integration with provider abstraction.

---

## 4. Workflow State Machine

### 4.1 Complete State Diagram

```text
         START
           │
           ▼
    NEW_REQUEST
           │
           ▼
      DISCOVERY
           │
           ▼
     BRIEF_READY
           │
           ▼
  EXTERNAL_AI_HANDOFF
           │
           ▼
 CANDIDATE_AWAITING
           │
           ▼
 CANDIDATE_RECEIVED
           │
           ▼
 COMPLIANCE_REVIEW
           │
      ┌────┴────┐
      │         │
    FAIL      PASS
      │         │
      ▼         ▼
COMPLIANCE   COMPLIANCE_
_FAILED      PASSED
      │         │
      ▼         ▼
CORRECTION   INTEGRATION_
REQUIRED     PLANNING
      │         │
      │         ▼
      │    VALIDATION
      │         │
      │         ▼
      │    EVIDENCE_
      │    GENERATION
      │         │
      │         ▼
      │    CERTIFICATION_
      │    READY
      │         │
      │         ▼
      │    HUMAN_REVIEW
      │         │
      │    ┌────┴────┬────────┐
      │    │         │        │
      │  REJECT  CHANGES  APPROVE
      │    │      REQUIRED   │
      │    ▼         │        ▼
      │  REJECTED    │    CERTIFIED
      │              │
      └──────────────┘
```

### 4.2 State Definitions

```typescript
type WorkflowState = 
  | 'NEW_REQUEST'           // Human creating request
  | 'DISCOVERY'             // Project LLM discovering repository
  | 'BRIEF_READY'           // Creation brief generated
  | 'EXTERNAL_AI_HANDOFF'   // Instructions for External AI ready
  | 'CANDIDATE_AWAITING'    // Waiting for human to return with candidate
  | 'CANDIDATE_RECEIVED'    // Candidate uploaded
  | 'COMPLIANCE_REVIEW'     // Project LLM reviewing compliance
  | 'COMPLIANCE_PASSED'     // All compliance checks passed
  | 'COMPLIANCE_FAILED'     // Compliance checks failed
  | 'CORRECTION_REQUIRED'   // Correction instructions generated
  | 'INTEGRATION_PLANNING'  // Integration plan generated
  | 'VALIDATION'            // Running tests
  | 'EVIDENCE_GENERATION'   // Collecting evidence
  | 'CERTIFICATION_READY'   // Project LLM assessment complete
  | 'HUMAN_REVIEW'          // Human Architecture Authority reviewing
  | 'CERTIFIED'             // Human approved, block certified
  | 'REJECTED'              // Human rejected
  | 'STOPPED';              // STOP condition triggered
```

### 4.3 Transitions

```typescript
interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  trigger: TransitionTrigger;
  actor: 'HUMAN' | 'PROJECT_LLM';
  conditions?: string[];
}

type TransitionTrigger = 
  | 'CREATE_REQUEST'
  | 'DISCOVERY_COMPLETE'
  | 'BRIEF_GENERATED'
  | 'HANDOFF_MARKED_COMPLETE'
  | 'CANDIDATE_SUBMITTED'
  | 'COMPLIANCE_PASSED'
  | 'COMPLIANCE_FAILED'
  | 'CORRECTIONS_GENERATED'
  | 'INTEGRATION_PLAN_COMPLETE'
  | 'VALIDATION_COMPLETE'
  | 'EVIDENCE_COMPLETE'
  | 'PROJECT_LLM_ASSESSMENT_READY'
  | 'HUMAN_APPROVE'
  | 'HUMAN_REJECT'
  | 'HUMAN_REQUEST_CHANGES';
```

---

## 5. Technology Architecture

### 5.1 Technology Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                 PROJECT LLM WORKBENCH                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + TypeScript)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Next.js App Router                                   │   │
│  │ React 18                                             │   │
│  │ TypeScript (strict mode)                             │   │
│  │ Tailwind CSS                                         │   │
│  │ Zustand (state management)                           │   │
│  │ React Query (data fetching)                          │   │
│  │ Monaco Editor (code display)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Backend (Node.js + TypeScript)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Next.js API Routes                                   │   │
│  │ Node.js 20+                                          │   │
│  │ TypeScript                                           │   │
│  │ tRPC (type-safe APIs)                                │   │
│  │ Zod (validation)                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Project LLM Services                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ RepositoryIntelligenceService                        │   │
│  │ ReferenceIntelligenceService                         │   │
│  │ CreationBriefService                                 │   │
│  │ ComplianceReviewService                              │   │
│  │ CorrectionGeneratorService                           │   │
│  │ IntegrationPlannerService                            │   │
│  │ ValidationService                                    │   │
│  │ EvidenceCollectorService                             │   │
│  │ WorkflowOrchestrator                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  LLM Integration                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LLMProviderAbstraction (interface)                   │   │
│  │ │                                                    │   │
│  │ ├── Phase 1: One server-side provider integration   │   │
│  │ │   (selected by internal configuration)            │   │
│  │ │                                                    │   │
│  │ └── Phase 2+: Multi-provider selection UI           │   │
│  │     ├── OpenAIProvider                              │   │
│  │     ├── AnthropicProvider                           │   │
│  │     └── GeminiProvider                              │   │
│  │                                                    │   │
│  │ Server-side only (secrets protected)                 │   │
│  │ Provider credentials never exposed to browser        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Data Layer                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL (via existing Drizzle setup)              │   │
│  │ project_llm_requests                                 │   │
│  │ project_llm_repository_contexts                      │   │
│  │ project_llm_creation_briefs                          │   │
│  │ project_llm_candidates                               │   │
│  │ project_llm_compliance_reviews                       │   │
│  │ project_llm_integration_plans                        │   │
│  │ project_llm_evidence_packages                        │   │
│  │ project_llm_certifications                           │   │
│  │ (8 tables total)                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Integration with Existing Systems                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tutorial Composer API (existing)                     │   │
│  │ TutorialBlockRenderer (existing)                     │   │
│  │ ILS runtime (existing)                               │   │
│  │ LSNB (existing)                                      │   │
│  │ RSSB (existing)                                      │   │
│  │ Auth/authz (existing SkillHubCore)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Service Boundaries

**RepositoryIntelligenceService:**
- Discovers Tutorial Composer paths
- Locates existing block implementations
- Locates schemas, types, validators
- Locates TutorialBlockRenderer
- Identifies UBRC/ILS/LSNB/RSSB contracts
- Verifies file paths
- Caches repository context

**ReferenceIntelligenceService:**
- Reads reference block corpus
- Extracts patterns from existing blocks
- Compares block versions
- Identifies reusable components

**CreationBriefService:**
- Generates creation brief from request + repository context
- Combines learning objective + reference patterns + platform contracts
- Formats brief for External AI consumption
- Includes forbidden operations explicitly

**ComplianceReviewService:**
- Receives candidate package
- Runs compliance checks (Architecture, Composer, Tutorial Page, UBRC, ILS, LSNB, RSSB, Multi-brand, Tests)
- Generates compliance matrix
- Determines PASS/FAIL/WARNING status

**CorrectionGeneratorService:**
- Receives failed compliance review
- Generates precise correction instructions
- Includes code examples + references
- Formats for External AI consumption

**IntegrationPlannerService:**
- Generates file-level integration plan
- Identifies files to create/modify
- Plans Composer integration steps
- Plans Tutorial Page integration steps
- Estimates complexity

**ValidationService:**
- Runs TypeScript compilation
- Runs lint checks
- Runs unit tests
- Runs integration tests
- Coordinates manual runtime verification

**EvidenceCollectorService:**
- Collects automated evidence (compilation, lint, tests)
- Manages manual evidence uploads (screenshots, telemetry proof)
- Generates evidence package
- Determines evidence completeness

**WorkflowOrchestrator:**
- Manages workflow state transitions
- Coordinates service calls
- Enforces approval gates
- Triggers notifications
- Maintains audit trail

### 5.3 Database Schema

```typescript
// project_llm_requests
interface ProjectLLMRequest {
  id: string; // UUID
  family: BlockFamily;
  version: string;
  learningObjective: string;
  tutorialContext: TutorialPromptContext;
  brandScope: Brand[];
  referenceBlock?: string;
  specialRequirements?: string;
  status: WorkflowState;
  createdAt: Date;
  createdBy: string; // userId
  updatedAt: Date;
}

// project_llm_repository_contexts
interface ProjectLLMRepositoryContext {
  id: string;
  requestId: string; // FK to project_llm_requests
  existingBlocks: ExistingBlock[];
  composerPaths: ComposerPaths;
  runtimeContracts: RuntimeContracts;
  requiredFiles: RequiredFile[];
  discoveryStatus: DiscoveryStatus;
  discoveredAt: Date;
}

// project_llm_creation_briefs
interface ProjectLLMCreationBrief {
  id: string;
  requestId: string;
  briefSections: BriefSection[];
  generatedAt: Date;
  briefVersion: number;
}

// project_llm_candidates
interface ProjectLLMCandidate {
  id: string;
  requestId: string;
  files: CandidateFile[];
  componentCode: string;
  types?: string;
  schema?: string;
  tests?: string;
  implementationNotes?: string;
  externalAIProvider?: string;
  submittedAt: Date;
  submittedBy: string;
}

// project_llm_compliance_reviews
interface ProjectLLMComplianceReview {
  id: string;
  candidateId: string;
  checks: ComplianceCheck[];
  overallStatus: ComplianceStatus;
  reviewedAt: Date;
}

// project_llm_integration_plans
interface ProjectLLMIntegrationPlan {
  id: string;
  candidateId: string;
  filesToCreate: FileOperation[];
  filesToModify: FileOperation[];
  composerSteps: IntegrationStep[];
  tutorialPageSteps: IntegrationStep[];
  estimatedComplexity: string;
  generatedAt: Date;
}

// project_llm_evidence_packages
interface ProjectLLMEvidencePackage {
  id: string;
  requestId: string;
  typescriptCompilation: CompilationResult;
  lintResults: LintResult;
  unitTests: TestResult[];
  integrationTests: TestResult[];
  skillUpScreenshot?: string; // URL
  rthScreenshot?: string;
  ilsTelemetryProof?: TelemetryProof;
  lsnbProof?: NavigationProof;
  rssbProof?: MetricsProof;
  evidenceCollectedAt: Date;
  allEvidenceComplete: boolean;
}

// project_llm_certifications
interface ProjectLLMCertification {
  id: string;
  requestId: string;
  evidencePackageId: string;
  projectLLMAssessment: ProjectLLMAssessment;
  humanDecision: CertificationDecision;
  humanReviewNotes?: string;
  reviewedBy: string;
  reviewedAt: Date;
  certifiedAt?: Date;
}
```

---

## 6. Phase 1 Scope & Pilot

### 6.1 Phase 1 Objectives

**Primary Goal:** Prove the complete workflow with Introduction block family (I1 as reference, I2 as first new certified block)

**Success Criteria:**
1. Repository intelligence discovers existing Introduction I1 (with evidence)
2. Creation brief generated for Introduction I2 (based on I1 reference + requirements)
3. External AI workflow produces compliant candidate (GUI approval → React/TypeScript)
4. Compliance review passes all checks (or correction loop succeeds)
5. Integration plan identifies correct files (evidence-based, not assumed)
6. Validation passes (TypeScript, lint, tests)
7. Evidence package complete (including runtime proof for both brands)
8. Human Architecture Authority certifies Introduction I2
9. Introduction I2 deployed to production (SkillUp + RTH) **after HAA certification and explicit human deployment approval**
10. No new UBRC/ILS/LSNB/RSSB infrastructure created

**Phase 1 Pilot Scope Clarification:**
- I1 = Existing production reference block (NOT created by Project LLM)
- I2 = First new block created via complete Project LLM workflow
- I3+ = Out of scope for Phase 1 (deferred to Phase 2+)

**Production Deployment Policy:**
- Project LLM marks CERTIFICATION_READY (recommendation)
- Human Architecture Authority certifies (approval)
- Human executes production deployment (explicit action)
- Project LLM does NOT deploy to production autonomously
- Successful pilot outcome = I2 deployed to production by human after certification

### 6.2 Phase 1 Deliverables

**Workbench GUI:**
- 12 screens implemented
- React + TypeScript + Tailwind
- Integrated into SkillHubCore Admin
- Accessible, responsive

**Services:**
- RepositoryIntelligenceService (Introduction family)
- ReferenceIntelligenceService (Introduction I1 reference)
- CreationBriefService
- ComplianceReviewService (all checks)
- CorrectionGeneratorService
- IntegrationPlannerService
- ValidationService
- EvidenceCollectorService
- WorkflowOrchestrator

**Database:**
- 8 tables created
- Schema migrations
- Audit trail

**Documentation:**
- Project LLM Workbench user guide
- Architecture documentation
- API documentation
- Evidence requirements guide

**Pilot Block:**
- Introduction I2 created via workflow
- Certified by Human Architecture Authority
- Deployed to production

### 6.3 Phase 1 Out of Scope

```text
❌ Introduction I3+ (deferred to Phase 2+)
❌ Summary, Definition, Code, Objective, Visual families (deferred to Phase 2+)
❌ LLM provider selection UI (server-side only in Phase 1)
❌ Automated GUI approval (human + External AI in Phase 1)
❌ Automated certification (human approval required)
❌ Autonomous repository modification (human approval required)
❌ Python/FastAPI service (Node/TypeScript only in Phase 1)
❌ Semantic search / embeddings (Phase 2+)
❌ Large-scale corpus processing (Phase 2+)
❌ Advanced analytics / reporting (Phase 2+)
❌ Multi-candidate comparison (Phase 2+)
❌ Rollback automation (Phase 2+)
```

### 6.4 Phase 1 Technology Constraints

**APPROVED:**
- Node.js + TypeScript
- React + Tailwind
- Extends SkillHubCore Admin / Composer
- Uses existing auth/authz
- Uses existing database (PostgreSQL + Drizzle)
- Server-side LLM integration
- Provider abstraction (implementation deferred)

**NOT APPROVED for Phase 1:**
- Python/FastAPI
- Separate microservice architecture
- Client-side LLM provider configuration
- Vector databases
- Semantic search infrastructure

---

## 7. Success Metrics

### 7.1 Phase 1 Success Metrics

**Workflow Metrics:**
- Time from request to certified block: < 2 days (human time, not workflow time)
- Compliance review accuracy: > 95% (PASS/FAIL correctness)
- Correction instruction effectiveness: > 90% (corrected candidate passes)
- Evidence completeness: 100% (all required evidence collected)

**Quality Metrics:**
- Certified blocks pass all runtime tests: 100%
- Certified blocks work on both brands: 100%
- Certified blocks participate in ILS: 100%
- No new UBRC/ILS/LSNB/RSSB infrastructure: 100%

**Human Metrics:**
- Human Architecture Authority approval rate: measure baseline
- Human correction required after Project LLM assessment: < 10%
- Human rejects Project LLM CERTIFICATION_READY: < 5%

**Technical Metrics:**
- Repository discovery accuracy: > 95%
- Creation brief completeness: 100% (all required sections)
- Integration plan accuracy: > 95% (correct files identified)
- Test pass rate: 100% (certified blocks)

### 7.2 STOP Conditions

Project LLM must STOP and request Human Architecture Authority approval when:

1. **Architecture violation detected:**
   - Candidate modifies UBRC/ILS/LSNB/RSSB infrastructure
   - Candidate creates parallel telemetry system
   - Candidate requires database schema changes
   - Candidate requires new runtime contracts

2. **Compliance failure cannot be corrected:**
   - Correction instructions generated 3+ times without resolution
   - Candidate architecture fundamentally incompatible
   - External AI unable to satisfy platform contracts

3. **Integration risk high:**
   - Breaking changes required
   - >10 files require modification
   - Existing blocks affected
   - Rollback complexity high

4. **Evidence incomplete:**
   - Human unable to provide runtime proof
   - Multi-brand verification fails
   - ILS/LSNB/RSSB verification fails
   - Tests cannot be written

5. **Certification ambiguity:**
   - Evidence insufficient to support certification
   - Warnings present requiring human judgment
   - Edge cases unverified
   - Novel patterns detected requiring architecture review
   - Multiple compliance findings with unclear priority

**Evidence-Based STOP (NOT confidence-based):**
- STOP decisions based on evidence sufficiency, not LLM confidence scores
- LLM confidence displayed as advisory metadata only
- STOP triggers: Evidence gaps, contract violations, runtime proof missing, novel architecture, ambiguity requiring human judgment
- Never substitute confidence percentage for actual evidence

---

## 8. Approval Gates

### 8.1 Human Architecture Authority Approval Required

**Before Phase 1 Implementation Begins (Gate 1):**
- [ ] Approve this Workbench specification (this document)
- [ ] Approve 12-screen information architecture
- [ ] Approve workflow state machine
- [ ] Approve technology stack (Node/TypeScript confirmed)
- [ ] Approve database schema (8 tables)
- [ ] Approve service boundaries
- [ ] Approve Introduction pilot scope (I1 reference, I2 new)
- [ ] Approve evidence requirements
- [ ] Approve STOP conditions
- [ ] Approve Phase 1 implementation plan

**During Phase 1 Implementation — I2 Pilot Workflow (Gate 2):**
- [ ] Review Introduction I2 creation brief (verify completeness before External AI handoff)
- [ ] Review Introduction I2 candidate (if compliance issues unresolvable)
- [ ] Review Introduction I2 integration plan (if high-risk changes detected)
- [ ] **CERTIFY** Introduction I2 (final certification gate — REQUIRED)

**After Phase 1 Complete (Gate 3):**
- [ ] Approve Phase 2+ expansion plan
- [ ] Approve additional block families
- [ ] Approve technology additions (if Python/FastAPI justified)
- [ ] Approve multi-provider UI (if Phase 2 scope)

**Critical Distinction:**
- **Gate 1 (Pre-Implementation):** HAA approves architecture, specification, implementation plan. No code exists yet.
- **Gate 2 (During Pilot):** HAA reviews workflow artifacts, certifies I2. Project LLM operational.
- **Gate 3 (Post-Pilot):** HAA approves expansion beyond Phase 1 scope.

### 8.2 Project LLM Assessment Authority (Automated)

Project LLM can autonomously assess/evaluate/recommend:
- Repository discovery results → generates assessment (human verifies before using)
- Creation brief generation → generates brief (human copies, reviews if needed)
- Compliance review PASS/FAIL → generates assessment (human reviews evidence)
- Integration plan → generates plan (human approves before execution)
- Validation results → generates assessment (human reviews evidence)
- Evidence package completeness → determines completeness (human reviews content)
- CERTIFICATION_READY recommendation → makes recommendation (human makes final decision)

Project LLM CANNOT autonomously approve:
- Architecture changes (requires human approval)
- Database schema changes (requires human approval)
- New runtime contracts (requires human approval)
- CERTIFICATION_READY → CERTIFIED transition (requires Human Architecture Authority)
- Production deployment (requires human approval)

**Critical Distinction:**
- **Assessment/Evaluation/Recommendation:** Project LLM determines status and makes recommendation
- **Approval/Authority:** Human Architecture Authority makes binding decisions

---

## 9. Risk Mitigation

### 9.1 Technical Risks

**Risk:** Repository discovery incorrect  
**Mitigation:** Human reviews repository context screen before brief generation. Discovery results cached + versioned.

**Risk:** Compliance review false positive/negative  
**Mitigation:** Human Architecture Authority reviews evidence package, not just Project LLM assessment. Override available.

**Risk:** External AI produces non-compliant candidate  
**Mitigation:** Correction loop designed for iterative refinement. STOP condition after 3 failed correction attempts.

**Risk:** Integration breaks existing blocks  
**Mitigation:** Integration plan includes impact assessment. Regression tests required. Rollback plan documented.

**Risk:** Runtime verification incomplete  
**Mitigation:** Evidence completeness enforced. Human cannot mark certified without all evidence uploaded.

### 9.2 Process Risks

**Risk:** Human skips GUI approval step  
**Mitigation:** Workflow enforces External AI Handoff screen. Clear instructions that GUI approval required before React conversion.

**Risk:** Human uploads non-compliant candidate  
**Mitigation:** Compliance review catches violations. Correction loop activates. Human cannot bypass compliance review.

**Risk:** Human certifies without evidence  
**Mitigation:** Evidence package completeness enforced. CERTIFICATION_READY gate blocks without complete evidence.

**Risk:** Project LLM over-confident  
**Mitigation:** STOP conditions trigger on ambiguity. Human Architecture Authority always reviews before CERTIFIED.

### 9.3 Architecture Risks

**Risk:** Project LLM becomes autonomous architecture authority  
**Mitigation:** Explicit approval gates. STOP conditions. Human Architecture Authority required for CERTIFIED transition.

**Risk:** External AI modifies UBRC/ILS/LSNB/RSSB  
**Mitigation:** Creation brief explicitly forbids this. Compliance review detects violations. Correction loop enforces boundaries.

**Risk:** Scope creep beyond Phase 1  
**Mitigation:** Phase 1 scope explicitly documented. Out-of-scope items listed. Phase 2+ requires new approval.

**Risk:** Technology drift (Python introduced prematurely)  
**Mitigation:** Technology stack explicitly approved. Python requires concrete justification + Human Architecture Authority approval.

---

## 10. Next Steps

### 10.1 Immediate Actions (Awaiting Approval)

1. **Human Architecture Authority reviews this specification**
2. **Human approves/rejects/requests changes**
3. **If approved: Implementation planning begins**

### 10.2 Implementation Sequence (After Approval)

**Recommended: Vertical Slice Approach**

Build thin vertical slice early (usable Workbench while building Workbench):

```text
Phase 1A: Foundation
├── Database schema + migrations (8 tables)
├── Service interfaces + contracts
├── Workflow state machine
└── Basic API routes

Phase 1B: Minimal Workbench Shell
├── Dashboard skeleton
├── Request workspace shell
├── Navigation
└── State management

Phase 1C: Repository Intelligence
├── RepositoryIntelligenceService
├── Evidence-based discovery
├── Repository Context screen
└── Discovery verification UI

Phase 1D: Creation Brief
├── ReferenceIntelligenceService
├── CreationBriefService
├── Brief Builder screen
└── External AI Handoff screen

Phase 1E: Compliance Engine
├── Candidate Intake screen
├── ComplianceReviewService
├── CorrectionGeneratorService
├── Compliance Review screen
└── Correction Instructions screen

Phase 1F: Integration & Validation
├── IntegrationPlannerService
├── ValidationService
├── EvidenceCollectorService
├── Integration Plan screen
├── Validation & Evidence screen
└── Certification Review screen

Phase 1G: Introduction I2 Pilot
├── End-to-end workflow
├── I1 as reference
├── I2 creation brief
├── External AI workflow
├── Candidate compliance review
├── Integration + validation
├── Evidence collection
└── Human certification

Phase 1H: Production Deployment
├── Introduction I2 certified
├── Production deployment (SkillUp + RTH)
├── Runtime verification
└── Documentation & handoff
```

**UI Implementation Note:** Build workflow as integrated Block Request workspace (not 12 independent pages). Dashboard and Settings remain separate global surfaces. Screens 2-11 become workflow tabs/panels within Block Request workspace.

---

## 11. Appendices

### Appendix A: Glossary

**Project LLM:** The complete AI workbench product (GUI + services + workflow)  
**External AI:** ChatGPT/Claude/Gemini used by human for block creation  
**Creation Brief:** Complete specification generated by Project LLM for External AI  
**Candidate Package:** React/TypeScript implementation returned by External AI  
**Compliance Review:** Project LLM's architectural/contract verification  
**Evidence Package:** Complete proof of certification readiness  
**CERTIFICATION_READY:** Project LLM assessment that block meets all requirements  
**CERTIFIED:** Human Architecture Authority final approval  
**STOP Condition:** Workflow halt requiring human decision

**UBRC:** Universal Block Runtime Contract  
**ILS:** In-Lesson System (telemetry)  
**LSNB:** Lesson/Navigation Block (page/navigation progress)  
**RSSB:** Right-Side Status Block (LearningProgressSidebar metrics)

### Appendix B: Related Documents

- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_DECISION.md` — Phased architecture reconciliation
- `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` — Locked Phase 1B foundation contract
- `PROJECT_LLM_GUI_FIRST_STRATEGY.md` — External AI GUI-first workflow
- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md` — Architecture mismatch findings

### Appendix C: Technology Decision History

**2026-10-03:** Human Architecture Authority approved Option B (Node/TypeScript in Composer) over Python/FastAPI after forensic investigation found no Python generation service in Question Bank.

**2026-10-04:** Phased architecture reconciliation approved — Phase 1B = Foundation Layer (Node/TypeScript), Phase 2+ = full Integration & Certification Engine (technology TBD based on requirements).

**2026-10-04:** Workbench specification created — Node/TypeScript + React confirmed as Phase 1 technology. Python/FastAPI deferred pending concrete technical justification.

---

**Document Status:** REVISION 2 — Contract Consistency Pass Complete, Ready for HAA Lock  
**Approval Authority:** Human Architecture Authority  
**Approval Date:** (Pending)  
**Approval Decision:** (Pending)

---

**Once approved, this document becomes the implementation contract for Project LLM Block Creation Workbench Phase 1.**


---

## Revision History

### Revision 1 (2026-10-04) — 12 Corrections Applied

**Human Architecture Authority Feedback:** Architecture direction APPROVED IN PRINCIPLE. Specification requires corrections before final approval.

**Corrections Applied:**

1. **Pilot Scope Clarification:** Changed "I1/I2/I3 pilot" to "I1 as existing reference, I2 as first new block created via workflow". I1 is NOT created by Project LLM—it is the production reference. I3+ out of scope for Phase 1.

2. **Database Table Count Correction:** Changed "7 tables" to "8 tables" throughout document. Database schema section defines 8 tables (requests, repository_contexts, creation_briefs, candidates, compliance_reviews, integration_plans, evidence_packages, certifications).

3. **LLM Provider Architecture Clarification:** Phase 1 implements provider abstraction + one server-side provider integration (internal configuration). Multi-provider selection UI deferred to Phase 2+. Provider credentials never exposed to browser.

4. **AI Authority Terminology:** Changed "Project LLM can autonomously approve" to "Project LLM can autonomously assess/evaluate/recommend". Added explicit distinction between AI assessment and Human Architecture Authority approval. Project LLM evaluates/recommends; Human approves.

5. **Override Dialog Governance:** Renamed `OverrideDialog` to `ComplianceOverrideDialog`. Clarified that override records reason, authority, evidence, and adds to audit trail. Override does NOT bypass evidence requirements.

6. **Integration Plan Repository Modification Boundary:** Changed `FileOperation` interface from `content?: string` (unrestricted write) to descriptive fields (description, reason, expectedDiff, validationRequired, humanApprovalRequired). Phase 1 Integration Plan describes changes (WHAT/WHERE/WHY), not executable repository modification. Controlled repository modification is Phase 2+ capability requiring explicit governance.

7. **Evidence-Based Repository Discovery:** Added "Evidence-Based Discovery Principle" section. Project LLM must verify every path/import/contract claim with repository evidence. If evidence unavailable: mark UNKNOWN, trigger STOP. "Documentation says X" is NOT evidence that repository implements X. Only verified file paths, imports, contracts are evidence.

8. **Evidence-Based STOP Conditions:** Removed "Project LLM confidence < 80%" as STOP trigger. Changed to evidence-based STOP: evidence gaps, contract violations, runtime proof missing, novel architecture, ambiguity requiring human judgment. LLM confidence displayed as advisory metadata only, never substitutes for actual evidence.

9. **Phase 1 Success Criteria Clarification:** Added explicit pilot scope: I1 = existing reference (NOT created by Project LLM), I2 = first new block created via workflow, I3+ = out of scope Phase 1.

10. **Out-of-Scope Wording Correction:** Changed "I2-I6 block families" (confusing wording) to "Introduction I3+" and "Summary, Definition, Code, Objective, Visual families" (clear delineation). I2 is IN scope as the pilot; I3+ and other families are out of scope.

11. **Implementation Sequence Reordered:** Changed from "build all services first, then GUI" to "vertical slice approach" (usable Workbench while building Workbench). Build thin slice: Foundation → Minimal Shell → Repository Intelligence → Brief → Compliance → Integration → Pilot. Added UI implementation note: Build workflow as integrated Block Request workspace (not 12 independent pages).

12. **Deliverables Table Count Correction:** Changed "7 tables created" to "8 tables created" in Phase 1 deliverables summary.

**Assessment After Corrections:**

All 12 identified issues corrected. Specification now:
- ✅ Clarifies I1 reference vs. I2 pilot
- ✅ Corrects database table count
- ✅ Defines Phase 1 LLM provider architecture
- ✅ Distinguishes AI assessment from human approval
- ✅ Strengthens override governance
- ✅ Tightens integration plan boundaries
- ✅ Enforces evidence-based discovery
- ✅ Removes confidence-based STOP (evidence-based only)
- ✅ Clarifies Phase 1 scope (I2 pilot, not I1/I2/I3)
- ✅ Corrects out-of-scope wording
- ✅ Reorders implementation sequence (vertical slice)
- ✅ Corrects deliverables count

**Status:** REVISION 1 complete. Awaiting Human Architecture Authority final approval before implementation begins.

---

## Contract Consistency Pass (Final Review)

**REVISION 2 (2026-10-04) — 10 Final Contract Corrections Applied**

Human Architecture Authority feedback: REVISION 1 architecturally sound, requires final contract consistency pass before lock.

**All 10 Final Corrections Applied:**

1. **Status Consistency:** Appendix status changed from "DRAFT" to "REVISION 1 — Corrections Applied, Awaiting HAA Final Approval" (matches header).

2. **Settings/Provider Clarification:** Settings screen now explicitly states: "Phase 1: Server-side provider integration configured internally (one LLM provider operational for all Project LLM functions). Phase 2+: Provider selection UI."

3. **HAA Approval Gates Distinguished:** Separated Gate 1 (pre-implementation: approve specification), Gate 2 (during pilot: review artifacts, CERTIFY I2), Gate 3 (post-pilot: approve Phase 2+ expansion).

4. **NO Autonomous Repository Mutation:** Explicit Phase 1 policy added: Project LLM does NOT create/modify/commit/push files. HUMAN executes repository changes. Future Phase 2+ controlled mutation requires HAA approval.

5. **Production Deployment Gate:** Success criteria clarified: I2 deployed "after HAA certification and explicit human deployment approval." Production Deployment Policy added: Human executes deployment, Project LLM does NOT deploy autonomously.

6. **Evidence Immutability:** Evidence package now includes version, frozen flag, frozenAt timestamp, certificationId. Policy: Once CERTIFICATION_READY marked → evidence frozen (immutable). New evidence package created if corrections needed after freeze. Audit trail preserves all versions.

7. **Workflow State Transitions Fixed:** Diagram now includes COMPLIANCE_PASSED and COMPLIANCE_FAILED as explicit states (previously jumped directly from COMPLIANCE_REVIEW to CORRECTION_REQUIRED/INTEGRATION_PLANNING).

8. **Dashboard I1 Example Corrected:** "Recently Certified" section now shows "Introduction I2" and "Summary S2" (blocks created via Project LLM workflow), not "Introduction I1" (predates Project LLM, not certified by it).

9. **12 Screens vs Workspace Architecture:** Promoted to Section 2.1 (Information Architecture). Explicitly states: Screens 2-11 are tabs/panels within integrated Block Request workspace (NOT 12 independent pages). Dashboard and Settings remain separate global surfaces.

10. **Production Deployment Policy:** Already addressed in Correction 5. Verified explicit: successful pilot outcome = I2 deployed to production BY HUMAN after certification.

**Contract Consistency Assessment:**

All identified inconsistencies resolved. Specification now:
- ✅ Status consistent throughout document
- ✅ Phase 1 LLM provider architecture unambiguous (operational, server-side, internal config)
- ✅ HAA approval gates clearly distinguished (pre-implementation, during-pilot, post-pilot)
- ✅ NO autonomous repository mutation in Phase 1 (explicit policy)
- ✅ Production deployment requires HAA certification + explicit human action
- ✅ Evidence immutable after CERTIFICATION_READY (versioned, auditable)
- ✅ Workflow state diagram complete (includes COMPLIANCE_PASSED/FAILED)
- ✅ Dashboard examples do not imply I1 created by Project LLM
- ✅ UI architecture clarified early (workspace model, not 12 pages)
- ✅ Pilot outcome clear (human deploys I2 after certification)

**Status:** REVISION 2 complete. Contract consistency verified. Ready for Human Architecture Authority final approval/lock.

---

**Once approved, this document becomes the locked implementation contract for Project LLM Block Creation Workbench Phase 1.**
