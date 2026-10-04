# Project LLM Block Creation Workbench Specification

**Document Type:** Product Specification & Implementation Contract  
**Status:** DRAFT — Awaiting Human Architecture Authority Approval  
**Created:** 2026-10-04  
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

**Phase 1 Scope:** Introduction block family pilot (I1/I2/I3) proving complete workflow from requirement → certified block

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

```text
PROJECT LLM WORKBENCH
│
├── 1. Dashboard
├── 2. New Block Request
├── 3. Repository Context
├── 4. Creation Brief Builder
├── 5. External AI Handoff
├── 6. Candidate Intake
├── 7. Compliance Review
├── 8. Correction Instructions
├── 9. Integration Plan
├── 10. Validation & Evidence
├── 11. Certification Review
└── 12. Settings
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
│ │ Introduction I1                  Certified 2026-10-02   ││
│ │ Summary S1                        Certified 2026-09-28  ││
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
- Locate existing block implementations
- Locate schemas, types, validators
- Locate Composer registry entries
- Locate TutorialBlockRenderer
- Locate ILS/LSNB/RSSB contracts
- Verify UBRC compliance patterns
- Identify file paths for new block
- Verify multi-brand support patterns

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
- `OverrideDialog` (Human Architecture Authority only)

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
  content?: string;
  changes?: string[];
  verified: boolean;
}

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
}

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
│ LLM Provider (Future Phase)                                 │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Provider: [Not yet implemented]                       │  │
│ │                                                       │  │
│ │ Note: Phase 1 uses server-side LLM integration.      │  │
│ │ Provider selection will be available in Phase 2+.     │  │
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
│  │ LLMProviderAbstraction                               │   │
│  │ │                                                    │   │
│  │ ├── OpenAIProvider (Phase 2+)                       │   │
│  │ ├── AnthropicProvider (Phase 2+)                    │   │
│  │ └── GeminiProvider (Phase 2+)                       │   │
│  │                                                    │   │
│  │ Server-side only (secrets protected)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Data Layer                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL (via existing Drizzle setup)              │   │
│  │ project_llm_requests                                 │   │
│  │ project_llm_candidates                               │   │
│  │ project_llm_reviews                                  │   │
│  │ project_llm_evidence                                 │   │
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

**Primary Goal:** Prove the complete workflow with Introduction block family

**Success Criteria:**
1. Repository intelligence discovers existing Introduction I1
2. Creation brief generated for Introduction I2
3. External AI workflow produces compliant candidate
4. Compliance review passes all checks
5. Integration plan identifies correct files
6. Validation passes (TypeScript, lint, tests)
7. Evidence package complete (including runtime proof)
8. Human Architecture Authority certifies Introduction I2
9. Introduction I2 deployed to production (SkillUp + RTH)
10. No new UBRC/ILS/LSNB/RSSB infrastructure created

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
- 7 tables created
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
❌ I2-I6 block families (deferred to Phase 2+)
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
   - Project LLM confidence < 80%
   - Warnings present
   - Edge cases unverified
   - Novel patterns detected

---

## 8. Approval Gates

### 8.1 Human Architecture Authority Approval Required

**Before Phase 1 Implementation:**
- [ ] Approve this Workbench specification
- [ ] Approve 12-screen information architecture
- [ ] Approve workflow state machine
- [ ] Approve technology stack (Node/TypeScript confirmed)
- [ ] Approve database schema
- [ ] Approve service boundaries
- [ ] Approve Introduction pilot scope

**During Phase 1 Implementation:**
- [ ] Approve Introduction I2 creation brief (first pilot)
- [ ] Approve Introduction I2 candidate (after External AI)
- [ ] Approve Introduction I2 integration plan
- [ ] Approve Introduction I2 certification (final gate)

**After Phase 1 Complete:**
- [ ] Approve Phase 2+ expansion plan
- [ ] Approve additional block families
- [ ] Approve technology additions (if Python/FastAPI justified)

### 8.2 Project LLM Approval Authority (Automated)

Project LLM can autonomously approve:
- Repository discovery results (subject to verification)
- Creation brief generation (human copies, doesn't re-approve)
- Compliance review PASS (human reviews evidence, not compliance matrix)
- Integration plan (human reviews before execution)
- Validation results (human reviews evidence, not test output)
- Evidence package completeness (human reviews content, not completeness check)

Project LLM CANNOT autonomously approve:
- Architecture changes
- Database schema changes
- New runtime contracts
- CERTIFICATION_READY → CERTIFIED transition
- Production deployment

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

```text
Phase 1A: Foundation
├── Database schema + migrations
├── Service skeletons
├── Workflow orchestrator
└── Basic repository intelligence

Phase 1B: Core Services
├── RepositoryIntelligenceService (Introduction family)
├── ReferenceIntelligenceService (Introduction I1)
├── CreationBriefService
├── ComplianceReviewService
└── CorrectionGeneratorService

Phase 1C: Integration Services
├── IntegrationPlannerService
├── ValidationService
├── EvidenceCollectorService
└── End-to-end workflow tested

Phase 1D: Workbench GUI
├── Screens 1-6 (Dashboard → Candidate Intake)
├── Screens 7-9 (Compliance → Integration)
├── Screens 10-12 (Validation → Settings)
└── Integration with SkillHubCore Admin

Phase 1E: Pilot
├── Introduction I2 creation brief
├── External AI workflow
├── Candidate intake + compliance review
├── Integration + validation
├── Evidence collection
├── Human Architecture Authority certification
└── Production deployment (SkillUp + RTH)

Phase 1F: Documentation & Handoff
├── User guide
├── Architecture docs
├── API docs
├── Evidence requirements guide
└── Phase 2+ planning
```

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

**Document Status:** DRAFT — Awaiting Human Architecture Authority Approval  
**Approval Authority:** Human Architecture Authority  
**Approval Date:** (Pending)  
**Approval Decision:** (Pending)

---

**Once approved, this document becomes the implementation contract for Project LLM Block Creation Workbench Phase 1.**
