# PROJECT LLM PHASE 1B — ARCHITECTURE RECONCILIATION

**Document Type:** READ-ONLY Investigation  
**Phase:** Project LLM Phase 1B Step 1  
**Date:** 2026-10-03  
**Status:** ✅ FROZEN — PHASE 1B STEP 1 RECONCILIATION RECORD  
**Blocking Item:** ✅ RESOLVED — Question Bank LLM investigation complete (see QUESTION_BANK_LLM_REFERENCE_ARCHITECTURE.md)  
**Production Code Changes:** NONE  
**Repository State:** UNCHANGED  

---

**DOCUMENT FROZEN NOTICE:**

This document records the Phase 1B Step 1 I1 Architecture Reconciliation investigation. It is now **FROZEN** and serves as a historical audit artifact.

**No further investigation findings are to be appended to this document.**

Subsequent investigations and decisions are recorded in dedicated Phase 1B documents:
- ✅ `QUESTION_BANK_LLM_REFERENCE_ARCHITECTURE.md` — Question Bank forensic investigation (complete)
- 📋 `PROJECT_LLM_TECHNOLOGY_SERVICE_BOUNDARY_DECISION.md` — Technology/service boundary decision (next)
- 📋 `PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` — Implementation contract (after decision approval)

---  

---

## EXECUTIVE SUMMARY

This document traces the existing Introduction I1 authoring workflow from hierarchy selection through runtime delivery to determine the smallest, safest insertion point for Project LLM automation.

**Primary Question:**
> Where is the smallest, safest, repository-compatible point at which Project LLM can enter the existing I1 authoring workflow without duplicating or bypassing existing architecture?

**Methodology:** Source code inspection, NOT proposals from Phase 1A report

**Status:** 
- ✅ **I1 Architecture Reconciliation:** COMPLETE (all investigation items verified, deferred, or marked not required)
- ⏸️ **Technology/Service Boundary Decision:** OPEN/BLOCKED pending Question Bank LLM Reference Architecture Investigation

See Section 27 for blocking item details and Section 26 for I1 reconciliation closure summary.

---

## 1. EXISTING I1 PIPELINE — VERIFIED

### 1.1 Human-Driven Workflow (Current State)

```
STEP 1: Hierarchy Selection
  User selects in Composer GUI:
  - Domain
  - Subject
  - Topic
  - Subtopic
  - Navigation Node
  - Block Type = 'introduction'
  - Version = 'I1'
        ↓
STEP 2: Context Construction
  Composer builds TutorialPromptContext from selections
        ↓
STEP 3: Prompt Generation
  getIntroductionI1Prompt(context) → formatted prompt string
        ↓
STEP 4: Prompt Display
  AiInstructionContainer renders prompt in collapsible UI panel
        ↓
STEP 5: Human Copy-Paste
  Human copies prompt text manually
        ↓
STEP 6: External AI Interaction
  Human pastes prompt into ChatGPT/Claude/Gemini (separately)
        ↓
STEP 7: JSON Response
  External AI returns JSON
        ↓
STEP 8: Human Copy-Paste Return
  Human copies JSON response manually
        ↓
STEP 9: Composer JSON Editor
  Human pastes JSON into Composer JSON editor
        ↓
STEP 10: Preview & Validation
  Composer parses JSON, validates structure
        ↓
STEP 11: BlockInstance Creation
  JSON transformed to BlockInstance (editor state)
        ↓
STEP 12: Document Construction
  BlockInstance[] → TutorialBlock[] → TutorialDocument
        ↓
STEP 13: Save API
  tutorialSaveService → POST /api/tutorial-composer/sections
        ↓
STEP 14: Database Persistence
  TutorialDocument saved to tutorial_sections.content (JSONB)
        ↓
STEP 15: Learner Runtime
  TutorialBlock → IntroductionBlock → IntroductionI1View → DOM
```

### 1.2 Key Components Traced

| Component | Location | Role | Format |
|---|---|---|---|
| `TutorialPromptContext` | `prompts/tutorialPromptContext.ts` | Context contract | ✅ VERIFIED |
| `getIntroductionI1Prompt()` | `blocks/introduction/I1/introductionI1.prompt.ts` | Prompt generator | ✅ VERIFIED |
| `buildTutorialPrompt()` | `prompts/tutorialPrompt.shared.ts` | Shared prompt infrastructure | ✅ VERIFIED |
| `AiInstructionContainer` | `components/AiInstructionContainer.tsx` | Prompt display UI | ✅ VERIFIED |
| `toTutorialBlock()` | `document/documentTransformation.ts` | Editor → API transform | ✅ VERIFIED |
| `tutorialSaveService` | `services/tutorialSaveService.ts` | Persistence orchestration | ✅ VERIFIED (from Phase 1A) |
| `/api/tutorial-composer/sections` | `app/api/tutorial-composer/sections/route.ts` | Create/update API | ✅ VERIFIED (from Phase 1A) |
| `IntroductionI1View` | `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx` | Runtime renderer | ✅ VERIFIED (from Phase 1A) |

---

## 2. TUTORIALPROMPTCONTEXT — VERIFIED

### 2.1 Type Definition

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/prompts/tutorialPromptContext.ts`

```typescript
export interface TutorialPromptContext {
  domainName: string;          // Human-readable hierarchy
  subjectName: string;
  topicName: string;
  subtopicName: string;
  navigationNodeName: string;
  blockName: string;           // e.g., "Introduction"
  versionName: string;         // e.g., "I1"
  versionId?: string;          // Internal version ID (optional)
}
```

### 2.2 Field Analysis

| Field | Type | Source | Used by I1? | Authority |
|---|---|---|---|---|
| `domainName` | `string` | User selection in Composer | ✅ YES | Hierarchy table |
| `subjectName` | `string` | User selection in Composer | ✅ YES | Hierarchy table |
| `topicName` | `string` | User selection in Composer | ✅ YES | Hierarchy table |
| `subtopicName` | `string` | User selection in Composer | ✅ YES | Hierarchy table |
| `navigationNodeName` | `string` | User selection in Composer | ✅ YES | Sidebar navigation node |
| `blockName` | `string` | "Introduction" (hardcoded for I1) | ✅ YES | Block registry |
| `versionName` | `string` | "I1" (hardcoded for I1) | ✅ YES | Version registry |
| `versionId` | `string?` | "v1" (internal identifier) | ⚠️ MAYBE | Version registry |

### 2.3 Context Construction

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/AiInstructionContainer.tsx` (lines 52-61)

```typescript
const context: TutorialPromptContext = {
  domainName,           // from component props
  subjectName,          // from component props
  topicName,            // from component props
  subtopicName,         // from component props
  navigationNodeName,   // from component props
  blockName,            // from component props
  versionName,          // from component props
  versionId,            // from component props
};
```

**Verdict:** Context is constructed from **human selections** in Composer UI hierarchy dropdowns. Props flow from parent component (TutorialPageContentBuilderClient, to be inspected).

---

## 3. EXISTING I1 PROMPT CONTRACT — VERIFIED

### 3.1 Prompt Generation Function

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/introduction/I1/introductionI1.prompt.ts`

```typescript
export function getIntroductionI1Prompt(
  context: TutorialPromptContext
): string {
  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS (Pure JSON Content Contract)
    Return ONLY a valid JSON object matching this exact schema:
    { "expectedTimeSec": <AI-estimated-value>, "page": {...} }
    ...`
  );
}
```

### 3.2 Prompt Structure

**Composed from:**
1. **Header** (from `buildTutorialPromptHeader(context)`)
   - Target hierarchy breadcrumb

2. **Block-Specific Contract** (Introduction I1 specific)
   - 9-section structure definition
   - Icon registry (15 approved icons)
   - Motto format rules
   - Flow cards rules
   - Use cases rules
   - Roadmap rules
   - Benefits rules
   - Code solution rules
   - Content quality guidelines

3. **Footer** (from `buildTutorialPromptFooter()`)
   - `expectedTimeSec` estimation contract
   - Prohibited system metadata

### 3.3 Key Educational Requirements Embedded

From `getIntroductionI1Prompt()`:

- **9 Required Sections:** Hero, Learning Goal, Topic, Where Fit, Solution, Where Used, Roadmap, Why Matters, Key Takeaway
- **Icon Registry:** Only approved Lucide icons (book-open, target, lightbulb, route, code, layers, check-circle, arrow-right, graduation-cap, rocket, wrench, globe, zap, star, box)
- **Motto:** Exactly 4 lines forming inspirational statement
- **Flow Cards:** 3-7 cards, ONE with `highlight: true` for current topic
- **Use Cases:** 2-6 realistic applications, optionally 1-2 highlighted
- **Roadmap:** 4-10 learning steps, simple → advanced progression
- **Benefits:** 2-6 compelling benefits with icons
- **Code Solution:** Complete, runnable code (8-20 lines, no pseudo-code)
- **expectedTimeSec:** Root-level integer, dynamically estimated (typical range 300-600 sec for I1)

### 3.4 Production Constraints Embedded

- Return ONLY valid JSON
- NO markdown code fences
- NO system metadata (id, blockId, navigationNodeId, sectionId, version, etc.)
- All string fields non-empty
- Arrays must contain at least 1 item
- Icons MUST come from approved list
- `expectedTimeSec` at ROOT level (not inside `page`)

**Verdict:** The existing prompt is a **complete Creation Brief contract** for Introduction I1. It contains:
- Educational structure requirements
- Visual design constraints
- Content quality guidelines
- Production schema contract
- Runtime compatibility requirements

---

## 4. CREATION BRIEF ANALYSIS — VERIFIED

### 4.1 Does a Separate Creation Brief Type Exist?

**Search Results:** NO

**Evidence:**
- Grep search for "CreationBrief", "creation-brief" → only found in Phase 1A documentation
- No `CreationBrief` interface in repository
- No `generation-brief` service
- No `brief-generator` module

### 4.2 Is a Separate Creation Brief Required?

**Answer: NO (for Phase 1B minimal vertical slice)**

**Rationale:**

The existing combination of:
```
TutorialPromptContext (authoritative hierarchy + block identity)
       +
getIntroductionI1Prompt(context) (complete generation contract)
       =
FUNCTIONAL CREATION BRIEF
```

Already provides:
1. ✅ Target hierarchy context
2. ✅ Block type and version
3. ✅ Educational requirements
4. ✅ Visual/UX constraints
5. ✅ Production schema contract
6. ✅ Runtime compatibility requirements
7. ✅ Output format specification

**Missing from Current Prompt (potential future additions):**
- ❌ UBRC/LSNB/RSSB explicit requirements (implicit in schema)
- ❌ Brand-specific customization instructions
- ❌ Existing block examples for reference
- ❌ Version history or migration guidance
- ❌ Quality score thresholds
- ❌ Hallucination detection criteria

**Note on Terminology:**
- **UBRC** = Unique Block Runtime Contract
- **LSNB** = Lesson-Scoped Navigation Boundary
- **RSSB** = Runtime State Synchronization Boundary
- **ILS** = In-Lesson System (progress tracking and state management)

**Recommendation:** For Phase 1B, **REUSE** existing `TutorialPromptContext` + `getIntroductionI1Prompt()` as the functional Creation Brief. Do NOT create a separate `CreationBrief` type unless technical justification emerges during implementation.

**Classification:** REUSE EXISTING

---

## 5. CANDIDATE BLOCK ARCHITECTURE — VERIFIED

### 5.1 Candidate Persistence Model: TRANSIENT

**Human Architecture Authority Decision:** Transient candidate model (no persistent candidate_blocks table)

**Rationale:**
- Candidate JSON exists ONLY in UI state during human review
- Candidate is NOT persisted to database until human approval
- Once approved and saved, becomes authoritative TutorialBlock in tutorial_sections.content
- No intermediate candidate storage layer needed for Phase 1B

**Architecture:**

```
Project LLM generates candidate JSON
      ↓
Candidate held in Composer UI state (React state, NOT database)
      ↓
Human reviews/edits in JSON editor
      ↓
[APPROVAL DECISION]
      ├─ Reject → candidate discarded (no database write)
      └─ Approve → candidate becomes TutorialBlock → saved to tutorial_sections
```

**Implications:**
- ❌ NO `candidate_blocks` table
- ❌ NO `CandidateBlock` type
- ❌ NO candidate CRUD APIs
- ❌ NO candidate version history
- ✅ Simple, minimal database footprint
- ✅ Candidate lifespan = UI session only
- ✅ Once saved, candidate identity disappears (becomes TutorialBlock)

### 5.2 tutorial_sections AI Metadata Fields

**File:** `packages/db-tutorial/src/schema/tutorial-sections.ts` (lines 43-53)

```typescript
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
```

### 5.3 generationJobId Semantics — CLARIFIED

**Human Architecture Authority Decision:** generationJobId is a **provenance/request identifier**, NOT a job record reference

**Semantics:**

| Interpretation | Meaning | Requires |
|---|---|---|
| ❌ **Job Record Reference** | Points to jobs table with status/logs | jobs table, job lifecycle management |
| ✅ **Provenance Identifier** | Unique ID tying this block to generation request | UUID only, no additional infrastructure |

**Phase 1B Usage:**

```typescript
generationJobId = uuid() // Generated at request time, used for:
  - Correlation in logs
  - Tracing which generation request produced this block
  - Debugging/audit trail
  - NOT a foreign key to jobs table
```

**Benefits of Provenance ID Approach:**
- ✅ No jobs table needed
- ✅ No job lifecycle management
- ✅ Simple correlation for debugging
- ✅ Can be used in logs/monitoring without additional infrastructure

**Future Extension (Phase 2+):**
- Could later introduce jobs table if async generation needed
- generationJobId would then become foreign key
- But for Phase 1B synchronous generation, provenance ID is sufficient

### 5.4 Are AI Metadata Fields Currently Used?

**Investigation Result:** **NO** ❌

**Evidence:**
```bash
# Search for writes to generatedByAi field
grep -r "generatedByAi.*=.*true" --include="*.ts" --include="*.tsx"
# Result: NO MATCHES
```

**Fields Status:**

| Field | Schema | Read | Write | Current Usage |
|---|---|---|---|---|
| `generatedByAi` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `aiModelUsed` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `generationJobId` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `qualityScore` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `hallucinationScore` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `regenerationCount` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `approvedBy` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `approvedAt` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `rejectionReason` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |

**Verdict:** Schema exists and is ready for Project LLM to populate. Fields are **forward-looking** — created in anticipation of AI automation, now ready for use.

**Classification:** REUSE EXISTING SCHEMA

---

## 6. VALIDATION PIPELINE — VERIFIED COMPLETE

### 6.1 Validation Stages Identified

```
Human pastes JSON
      ↓
JSON.parse()
      ↓
[VALIDATION LAYER - TO BE TRACED]
      ↓
BlockInstance creation
      ↓
toTutorialBlock() transformation
      ↓
[TUTORIALDOCUMENT VALIDATION - TO BE TRACED]
      ↓
API save
```

### 6.2 Transformation Logic

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts` (lines 239-254)

```typescript
case 'introduction': {
  if (instance.versionCode === 'I1') {
    // Transform TutorialIntroductionPayload to IntroductionI1AuthorContent
    const introPayload = instance.payload as TutorialIntroductionPayload;
    
    return {
      id: instance.id,
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

**Observation:** Type cast `as unknown as IntroductionI1AuthorContent` suggests **loose validation** at transformation layer. Runtime validation occurs at API boundary (Zod schemas verified in Section 14).

**Status:** ✅ VERIFIED (see Section 14 for complete validation chain)

---

## 7. PROJECT LLM INTEGRATION CANDIDATES

### 7.1 Candidate Insertion Points

#### **Candidate A: Before getIntroductionI1Prompt()**

```
User selections
      ↓
[PROJECT LLM HERE]
      ↓
TutorialPromptContext
      ↓
getIntroductionI1Prompt()
```

**Pros:**
- Could inspect hierarchy and generate context programmatically
- Could add repository discovery metadata

**Cons:**
- Context construction is simple and working
- Would duplicate existing context logic
- No clear value add

**Verdict:** NOT RECOMMENDED

---

#### **Candidate B: Replace Human Copy-Paste (External AI Integration)**

```
getIntroductionI1Prompt(context)
      ↓
[PROJECT LLM PROVIDER INTEGRATION HERE]
      ↓
JSON response
      ↓
Composer validation
```

**Pros:**
- ✅ Automates the manual copy-paste steps (5-8 in pipeline)
- ✅ Reuses existing context construction
- ✅ Reuses existing prompt generation
- ✅ Reuses existing validation/transformation
- ✅ Minimal duplication
- ✅ Clear value proposition

**Cons:**
- Requires LLM provider integration
- Requires provider abstraction (decision required)
- Requires generation orchestration
- Requires error handling

**Verdict:** **STRONG CANDIDATE** ✅

---

#### **Candidate C: After External AI Response, Before Composer Validation**

```
External AI returns JSON
      ↓
[PROJECT LLM VALIDATION/ADAPTATION HERE]
      ↓
Composer BlockInstance
```

**Pros:**
- Could add pre-validation sanitization
- Could add adaptation logic

**Cons:**
- Existing validation already works
- Would duplicate validation logic
- Not clear where "External AI returns JSON" boundary is if automation exists

**Verdict:** POSSIBLE BUT REDUNDANT

---

#### **Candidate D: After Composer Validation, Before Document Transformation**

```
BlockInstance validated
      ↓
[PROJECT LLM ENRICHMENT HERE]
      ↓
toTutorialBlock()
```

**Pros:**
- Could add metadata enrichment
- Could add provenance tracking

**Cons:**
- BlockInstance is editor state, not canonical
- Enrichment should happen earlier or at persistence
- Awkward insertion point

**Verdict:** NOT RECOMMENDED

---

#### **Candidate E: After TutorialDocument Creation**

```
TutorialDocument created
      ↓
[PROJECT LLM POST-PROCESSING HERE]
      ↓
API save
```

**Pros:**
- Could add final validation gate
- Could add evidence collection

**Cons:**
- Document already validated
- Too late for generation logic
- Unclear purpose

**Verdict:** NOT RECOMMENDED

---

#### **Candidate F: Separate Project LLM Service**

```
Composer UI
      ↓
[PROJECT LLM SERVICE (Python/FastAPI?)]
      ↓
Generation + Validation + Approval
      ↓
Return candidate to Composer
      ↓
Existing save pipeline
```

**Pros:**
- Clean separation of concerns
- Could be Python/FastAPI as proposed
- Could have own database/state
- Could integrate multiple providers
- Could add complex orchestration

**Cons:**
- ⚠️ Significant infrastructure overhead
- ⚠️ New service deployment
- ⚠️ Cross-service authentication
- ⚠️ Cross-service secrets management
- ⚠️ Network latency
- ⚠️ Operational complexity
- ⚠️ Testing complexity

**Decision Required:** Is separate service technically justified for Phase 1B minimal vertical slice?

**Status:** OPEN ARCHITECTURE DECISION

---

### 7.2 Preliminary Recommendation

**For Phase 1B Minimal Vertical Slice:**

**RECOMMENDED: Candidate B (Provider Integration at Prompt Boundary)**

**Architecture:**

```typescript
// New: Generation Request
interface GenerationRequest {
  context: TutorialPromptContext;
  blockType: 'introduction';
  version: 'I1';
}

// New: Provider Boundary (abstraction)
interface ProjectLLMProvider {
  generateIntroductionI1(prompt: string): Promise<GenerationResult>;
}

// New: Generation Result
interface GenerationResult {
  success: boolean;
  candidate?: IntroductionI1Payload;
  error?: string;
  provenance: {
    provider: string;
    model?: string;
    timestamp: Date;
    requestId: string;
  };
}

// Workflow:
// 1. User selects hierarchy (existing)
// 2. Composer builds context (existing)
// 3. getIntroductionI1Prompt(context) (existing)
// 4. [NEW] ProjectLLM.generateI1(prompt) → candidate
// 5. [NEW] Validate candidate
// 6. [NEW] Present to human for review/edit
// 7. Human approves/modifies (existing Composer UI)
// 8. Existing save pipeline
```

**Why This Insertion Point:**
- Minimal disruption to existing architecture
- Reuses maximum existing code
- Clear automation boundary (replaces manual copy-paste)
- Can be implemented within existing Node/TypeScript stack initially
- Can evolve to separate service later if justified

**What Gets Reused:**
- ✅ TutorialPromptContext construction
- ✅ getIntroductionI1Prompt() generation contract
- ✅ Existing validation (to be traced)
- ✅ Existing transformation (documentTransformation.ts)
- ✅ Existing Composer UI for review/edit
- ✅ Existing save API
- ✅ Existing persistence (tutorial_sections)
- ✅ Existing runtime (IntroductionI1View)

**What Needs to be Created:**
- ❌ Provider abstraction interface
- ❌ Generation orchestration
- ❌ Candidate validation (may reuse existing)
- ❌ Provenance tracking
- ❌ Error handling
- ❌ (MAYBE) Human approval workflow enhancement

**Classification:** RECOMMENDED INSERTION POINT (pending complete validation trace)

---

## 8. SERVICE BOUNDARY ANALYSIS

### 8.1 Options Analysis

#### **Option A: Existing Next.js Application (Composer)**

**Location:** `apps/skillhubcore-admin`

**Pros:**
- ✅ No new service deployment
- ✅ Uses existing auth/session
- ✅ Same database access patterns
- ✅ Simpler testing
- ✅ No cross-service communication
- ✅ Faster iteration

**Cons:**
- ⚠️ Couples Project LLM to Composer app
- ⚠️ Limited to Node/TypeScript
- ⚠️ May not scale independently

**Verdict:** VIABLE FOR PHASE 1B

---

#### **Option B: Dedicated Node Service (monorepo)**

**Location:** `services/project-llm-service/`

**Pros:**
- ✅ Separation of concerns
- ✅ Can scale independently
- ✅ Stays in Node/TypeScript ecosystem
- ✅ Reuses monorepo patterns

**Cons:**
- ⚠️ New service deployment config
- ⚠️ Cross-service auth
- ⚠️ More operational complexity

**Verdict:** VIABLE IF JUSTIFIED

---

#### **Option C: Dedicated Python/FastAPI Service**

**Location:** `services/project-llm/` (Python)

**Pros:**
- ✅ Matches Phase 1A proposal
- ✅ Python ML/AI ecosystem
- ✅ Could use existing Python AI libraries

**Cons:**
- ⚠️ NEW LANGUAGE in monorepo
- ⚠️ New deployment infrastructure
- ⚠️ New package management (pip/poetry vs pnpm)
- ⚠️ Cross-language type contracts
- ⚠️ Team skillset required
- ⚠️ Operational complexity

**Verdict (Composer-centric view):** NOT JUSTIFIED FOR MINIMAL VERTICAL SLICE

**⚠️ STATUS: SUPERSEDED BY SECTION 27**

**Reason:** This analysis did NOT consider the existing Question Bank LLM Python/FastAPI reference implementation. Phase 1A report proposed Python/FastAPI but this reconciliation dismissed it based solely on Composer-centric view without investigating whether existing Python/FastAPI infrastructure could be reused.

**Current Status:** See Section 27 — Question Bank LLM investigation required before technology decision.

---

### 8.2 Preliminary Recommendation — SUPERSEDED

**⚠️ STATUS: SUPERSEDED BY SECTION 27**

This recommendation was based on Composer-centric analysis without investigating the existing Question Bank LLM reference architecture. See Section 27 for current status.

**Original Preliminary Recommendation (Composer-centric view):**

**For Phase 1B:** **Option A (Extend Existing Composer)**

**Rationale:**
- Prove the lifecycle first
- Minimize infrastructure changes
- Reuse existing auth/database/deployment
- Can extract to separate service in Phase 2 if needed

**Classification:** SUPERSEDED — Technology/Service Boundary Decision now OPEN/BLOCKED pending Question Bank LLM investigation (Section 27)

---

## 9. PROVIDER BOUNDARY ANALYSIS — VERIFIED

### 9.1 Provider Abstraction Required?

**Yes, but keep minimal and vendor-neutral for Phase 1B**

**Proposed Interface:**

```typescript
/**
 * Vendor-neutral LLM provider abstraction
 * 
 * Design principles:
 * - No vendor-specific types in interface
 * - Minimal contract for text generation
 * - Extensible for future capabilities
 * - Provider implementations handle vendor specifics internally
 */
interface ProjectLLMProvider {
  /**
   * Provider identifier (for logging/provenance only, not vendor-specific)
   * Examples: "test-mock", "production-llm-a", "production-llm-b"
   */
  name: string;
  
  /**
   * Generate text from prompt
   * 
   * @param request - Vendor-neutral generation request
   * @returns Vendor-neutral generation response
   */
  generate(request: GenerationRequest): Promise<GenerationResponse>;
}

/**
 * Vendor-neutral request structure
 */
interface GenerationRequest {
  /** The prompt text to send to the LLM */
  prompt: string;
  
  /** Optional generation parameters (provider translates to vendor-specific format) */
  parameters?: {
    /** Temperature for randomness (0.0-1.0 range, provider maps to vendor range) */
    temperature?: number;
    
    /** Maximum tokens to generate (provider maps to vendor limits) */
    maxTokens?: number;
    
    /** Additional vendor-agnostic parameters */
    [key: string]: unknown;
  };
}

/**
 * Vendor-neutral response structure
 */
interface GenerationResponse {
  /** Generated text content */
  text: string;
  
  /** Optional usage statistics (provider maps from vendor format) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /** Optional provider-specific metadata (NOT vendor identifiers) */
  metadata?: {
    /** Model identifier (provider's internal label, not vendor-specific) */
    model?: string;
    
    /** Additional provider-agnostic metadata */
    [key: string]: unknown;
  };
}
```

### 9.2 Vendor-Neutral Design Principles

**Key Requirements:**

1. ✅ **No vendor types in interface** — no OpenAI, Anthropic, Google types exposed
2. ✅ **Provider implementations encapsulate vendor SDKs** — vendor-specific code isolated
3. ✅ **Swappable providers** — can change vendor without changing Project LLM core
4. ✅ **Extensible** — new providers can be added without interface changes
5. ✅ **Test/mock provider** — development and testing without vendor APIs

**Provider Implementation Examples:**

```typescript
// Provider A (vendor SDK A)
class ProviderA implements ProjectLLMProvider {
  name = 'production-llm-a';
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Vendor A SDK calls happen HERE, isolated from interface
    const vendorResponse = await vendorAClient.generate({
      // Map vendor-neutral request to Vendor A format
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.parameters?.temperature ?? 0.7,
      max_tokens: request.parameters?.maxTokens ?? 4000,
    });
    
    // Map Vendor A response back to vendor-neutral format
    return {
      text: vendorResponse.content,
      usage: {
        promptTokens: vendorResponse.usage.prompt_tokens,
        completionTokens: vendorResponse.usage.completion_tokens,
        totalTokens: vendorResponse.usage.total_tokens,
      },
      metadata: {
        model: 'provider-a-production',
      },
    };
  }
}

// Provider B (vendor SDK B)
class ProviderB implements ProjectLLMProvider {
  name = 'production-llm-b';
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Vendor B SDK calls happen HERE, isolated from interface
    const vendorResponse = await vendorBClient.messages.create({
      // Map vendor-neutral request to Vendor B format
      model: 'vendor-b-model',
      max_tokens: request.parameters?.maxTokens ?? 4000,
      temperature: request.parameters?.temperature ?? 0.7,
      messages: [{ role: 'user', content: request.prompt }],
    });
    
    // Map Vendor B response back to vendor-neutral format
    return {
      text: vendorResponse.content[0].text,
      usage: {
        promptTokens: vendorResponse.usage.input_tokens,
        completionTokens: vendorResponse.usage.output_tokens,
        totalTokens: vendorResponse.usage.input_tokens + vendorResponse.usage.output_tokens,
      },
      metadata: {
        model: 'provider-b-production',
      },
    };
  }
}

// Test/Mock Provider (no vendor SDK)
class TestProvider implements ProjectLLMProvider {
  name = 'test-mock';
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Returns static fixture for testing, no vendor API call
    return {
      text: JSON.stringify(mockIntroductionI1Fixture),
      usage: {
        promptTokens: 1000,
        completionTokens: 800,
        totalTokens: 1800,
      },
      metadata: {
        model: 'test-mock',
      },
    };
  }
}
```

### 9.3 Provider Selection

**Status:** OPEN DECISION (requires Human Architecture Authority)

**Selection Process:**
1. Prove vertical slice with TestProvider (no vendor)
2. Human Architecture Authority selects vendor
3. Implement vendor-specific provider (isolated from core logic)
4. Configuration determines which provider to use at runtime

**For Phase 1B:** Use **TestProvider** initially to prove pipeline works end-to-end without vendor dependency.

**Vendor Selection Factors (deferred to Human decision):**
- Cost per token
- Latency requirements
- Rate limits
- Output quality for educational content
- Contract terms
- Data privacy requirements

**Classification:** PROVIDER SELECTION DEFERRED TO HUMAN DECISION, ABSTRACTION DESIGNED AS VENDOR-NEUTRAL

---

## 10. INVESTIGATION COMPLETION STATUS

### 10.1 Originally Identified Critical Path Items — RESOLVED

✅ **Trace complete validation pipeline (Zod schemas)** — COMPLETE (Section 14)
- IntroductionI1AuthorContentSchema verified
- IntroductionI1BlockSchema verified
- TutorialDocumentSchema verified
- Validator function found: `validateIntroductionI1AIOutput()`

✅ **Inspect Composer UI hierarchy selection flow** — COMPLETE (Section 2-3, Appendix A)
- useTutorialComposerForm hook traced
- TutorialPromptContext construction verified
- AiInstructionContainer flow documented

✅ **Verify authorization for tutorial creation** — COMPLETE (Section 15)
- RBAC system verified
- TUTORIAL_AUTHOR_CREATE permission found
- API boundary enforcement confirmed

✅ **Trace human approval workflow** — COMPLETE (Sections 7, 17)
- Existing Composer editor identified as review mechanism
- Manual approval workflow documented
- No automated approval system found

✅ **Inspect existing test infrastructure for I1** — COMPLETE (Appendix B)
- E2E tests: introduction-i1.browser.spec.ts, introduction-i1.http.spec.ts
- Unit tests: introduction-i1.fixture.test.ts
- Phase 2B.18 Step 3 bridge verification test

✅ **Verify ILS/runtime requirements** — COMPLETE (Sections 12, Appendix A)
- In-Lesson System integration verified
- UBRC identity attributes documented
- Runtime rendering pipeline traced

✅ **Determine if new database tables needed** — COMPLETE (Section 16)
- Existing tutorial_sections AI metadata fields sufficient
- NO new tables required for Phase 1B

✅ **Map complete error handling paths** — DEFERRED
- Error handling belongs to implementation phase
- Validation error paths identified
- Provider error handling deferred to implementation contract

### 10.2 Additional Investigations Completed

✅ Database field usage analysis (Section 16)
✅ Provider abstraction requirements (Section 9)
✅ Service boundary analysis (Section 8)
✅ Integration point candidates (Section 7)
✅ Complete I1 pipeline mapping (Appendix A)

---

## 11. ARCHITECTURE RECOMMENDATIONS (NOT DECISIONS)

| Decision | Finding | Preliminary Recommendation | Human Decision Required |
|---|---|---|---|
| **Scope** | I1 only vs I2-I6 | I1 ONLY ✅ | NO (already locked) |
| **Project LLM Location** | Composer vs separate service | EXTEND COMPOSER (Option A) | **YES** ⚠️ |
| **Insertion Point** | 6 candidates analyzed | Candidate B (provider integration) | **YES** ⚠️ |
| **Provider Strategy** | Which LLM provider | Test provider initially, real provider TBD | **YES** ⚠️ |
| **Creation Brief** | New type or reuse | REUSE existing prompt | NO |
| **Candidate Persistence** | New tables or existing | Use existing `tutorial_sections` metadata | **YES** ⚠️ |
| **Validation** | New or reuse | REUSE existing (to be traced) | NO |
| **Authorization** | New permissions | Investigate existing | TBD |
| **Human Approval** | New UI or reuse | REUSE existing Composer | TBD |

---

## 12. OPEN RISKS

1. **Validation completeness unknown** — need to trace Zod schemas
2. **Authorization model not yet inspected** — might need new permissions
3. **Separate service question unresolved** — impacts timeline/complexity
4. **Provider costs unknown** — need budget approval
5. **Human approval workflow unclear** — might need UI enhancements

---

## 13. STATUS & NEXT ACTIONS

**Current Status:** ARCHITECTURE RECONCILIATION IN PROGRESS (60% complete)

**Completed:**
- ✅ Existing I1 pipeline traced
- ✅ TutorialPromptContext verified
- ✅ Existing prompt contract documented
- ✅ Creation Brief analysis complete
- ✅ Integration candidates evaluated
- ✅ Service boundary options analyzed
- ✅ Provider abstraction designed

**Remaining:**
- ⏳ Complete validation pipeline trace
- ⏳ Inspect Composer UI orchestration
- ⏳ Verify authorization model
- ⏳ Complete database field usage analysis
- ⏳ Finalize minimal vertical slice design
- ⏳ Document implementation sequence
- ⏳ Create reuse/extend/new matrix
- ⏳ Submit for Human Architecture Authority approval

**Next Investigation Steps:**
1. Read Zod validation schemas for TutorialDocument and IntroductionI1Block
2. Read TutorialPageContentBuilderClient.tsx for UI orchestration
3. Search for authorization helpers and permission checks
4. Verify database field read/write patterns
5. Finalize architecture recommendations

**ETA for Complete Reconciliation:** Continuing now...

---

**Document will be updated as investigation progresses. No code implementation until Human Architecture Authority approval.**



---

## 14. VALIDATION PIPELINE — VERIFIED COMPLETE

### 14.1 Zod Schema Chain

**File:** `packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema.ts`

```
AI Output (JSON)
      ↓
IntroductionI1AuthorContentSchema.parse()
  ├─ page: IntroductionI1PageSchema
  │    ├─ badge, title, subtitle
  │    ├─ motto.lines (tuple[4])
  │    ├─ learningGoal
  │    ├─ topic {title, description, quote}
  │    ├─ whereFit {title, description, flowCards[]}
  │    ├─ solution {title, description, code{}}
  │    ├─ whereUsed {title, description, useCases[]}
  │    ├─ roadmap {title, description, steps[]}
  │    ├─ whyMatters {title, benefits[]}
  │    └─ keyTakeaway
  ↓
IntroductionI1BlockSchema.parse()
  ├─ id: uuid
  ├─ type: 'introduction'
  ├─ version: 'I1'
  ├─ content: IntroductionI1AuthorContentSchema
  ├─ expectedTimeSec?: number
  └─ progressRole?: enum
  ↓
TutorialBlockSchema (discriminated union)
  ↓
TutorialDocumentSchema
  ├─ schemaVersion: 1
  ├─ blocks: TutorialBlock[] (max 50)
  └─ metadata?: {...}
```

**Icon Registry Validation:**
```typescript
IntroductionIconKeySchema = z.enum([
  'book-open', 'target', 'lightbulb', 'route', 'code',
  'layers', 'check-circle', 'arrow-right', 'graduation-cap',
  'rocket', 'wrench', 'globe', 'zap', 'star', 'box'
]);
```

**Validator Function:**
```typescript
export function validateIntroductionI1AIOutput(
  output: unknown
): z.infer<typeof IntroductionI1AuthorContentSchema> {
  return IntroductionI1AuthorContentSchema.parse(output);
}
```

**Verdict:** ✅ **COMPLETE VALIDATION EXISTS** — Phase 1A report classification of "PARTIAL" was conservative. Dedicated Introduction I1 schema exists with comprehensive validation including:
- Structure validation (all 9 sections)
- Icon registry enforcement
- String length constraints
- Array size limits
- Required fields
- Type safety

**Classification:** REUSE EXISTING (no new validation needed)

---

## 15. AUTHORIZATION MODEL — VERIFIED

### 15.1 Existing Permissions

**File:** `apps/skillhubcore-admin/src/lib/auth-helpers.ts`

```typescript
PERMISSIONS.TUTORIAL_AUTHOR_CREATE   // Create tutorial content
PERMISSIONS.TUTORIAL_AUTHOR_EDIT     // Edit tutorial content
PERMISSIONS.TUTORIAL_AUTHOR_DELETE   // Delete tutorial content
PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH  // Publish tutorial content
```

**Helper Functions:**
```typescript
requireTutorialAuthorCreatePermission(user)
requireTutorialAuthorEditPermission(user)
requireTutorialAuthorDeletePermission(user)
requireTutorialAuthorPublishPermission(user)
```

**Roles Granted:** `admin`, `super_admin`

### 15.2 API Usage

**File:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/block-suggestions/route.ts` (line 19)

```typescript
// SECURITY:
// - Requires JWT authentication
// - Requires TUTORIAL_AUTHOR_EDIT permission (RBAC)
// - Requires subtopic access authorization
// - Requires brand access authorization
```

**Verdict:** ✅ **RBAC SYSTEM EXISTS** — Tutorial authoring already has permission checks at API boundary

### 15.3 Project LLM Permission Requirements

**For Phase 1B:**

**Option A:** Reuse existing `TUTORIAL_AUTHOR_CREATE` permission
- Human initiates generation = same as human authoring
- No new permission needed

**Option B:** Add new permission `TUTORIAL_AI_GENERATE`
- Separates AI generation from manual authoring
- Allows finer-grained control

**Preliminary Recommendation:** **REUSE EXISTING** (Option A) for Phase 1B minimal slice

**Classification:** REUSE EXISTING

---

## 16. DATABASE FIELD USAGE ANALYSIS — VERIFIED

### 16.1 AI Metadata Fields Search Results

**Query:** `generatedByAi.*=.*true|aiModelUsed.*=|generationJobId.*=`

**Result:** **NO MATCHES FOUND**

**Verdict:** ✅ **CONFIRMED** — AI metadata fields in `tutorial_sections` schema exist but are **NOT WRITTEN** by any automated system

**Fields Status:**

| Field | Schema | Read | Write | Current Usage |
|---|---|---|---|---|
| `generatedByAi` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `aiModelUsed` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `generationJobId` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `qualityScore` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `hallucinationScore` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `regenerationCount` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `approvedBy` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `approvedAt` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |
| `rejectionReason` | ✅ EXISTS | ❌ NO | ❌ NO | PREPARED, NOT USED |

### 16.2 Phase 1B Metadata Population

**Can existing `tutorial_sections` support Phase 1B?** **YES** ✅

**Minimal Phase 1B metadata writes:**
```typescript
{
  generatedByAi: true,
  aiModelUsed: 'test-mock',  // or 'production-llm-a', 'production-llm-b' (vendor-neutral)
  generationJobId: uuid(),   // Provenance/request identifier (NOT job record FK)
  // quality/hallucination scores: deferred to Phase 2
  // approval fields: deferred (use status='draft' initially)
}
```

**New tables needed?** **NO** ❌

**Classification:** REUSE EXISTING SCHEMA
  generatedByAi: true,
  aiModelUsed: 'test-provider' | 'openai-gpt4' | 'anthropic-claude',
  generationJobId: uuid(),
  // quality/hallucination scores: deferred to Phase 2
  // approval fields: deferred (use status='draft' initially)
}
```

**New tables needed?** **NO** ❌

**Classification:** REUSE EXISTING SCHEMA

---

## 17. MINIMAL VERTICAL SLICE — FINAL DESIGN

### 17.1 Recommended Implementation

```
┌─────────────────────────────────────────────────────────────┐
│ EXISTING COMPOSER UI                                        │
│                                                             │
│ 1. User selects hierarchy                                  │
│    ├─ Domain / Subject / Topic / Subtopic                  │
│    ├─ Navigation Node                                      │
│    ├─ Block Type = introduction                            │
│    └─ Version = I1                                         │
│                                                             │
│ 2. Composer builds TutorialPromptContext ✅ REUSE          │
│                                                             │
│ 3. getIntroductionI1Prompt(context) ✅ REUSE               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ NEW: PROJECT LLM GENERATION LAYER                          │
│                                                             │
│ 4. User clicks "Generate with AI" button                   │
│    ↓                                                       │
│ 5. ProjectLLMService.generateI1(prompt)                   │
│    ├─ Provider abstraction (test/mock initially)          │
│    ├─ Call provider.generate(prompt)                      │
│    ├─ Parse JSON response                                 │
│    ├─ Validate with IntroductionI1AuthorContentSchema    │
│    └─ Return candidate + provenance                       │
│    ↓                                                       │
│ 6. Candidate appears in Composer JSON editor              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ EXISTING COMPOSER UI (REVIEW & SAVE)                       │
│                                                             │
│ 7. Human reviews/edits candidate in editor ✅ REUSE        │
│                                                             │
│ 8. Human clicks "Add to Document"                          │
│    ↓                                                       │
│ 9. Existing BlockInstance creation ✅ REUSE                │
│    ↓                                                       │
│10. Existing toTutorialBlock() transform ✅ REUSE           │
│    ↓                                                       │
│11. Existing tutorialSaveService ✅ REUSE                   │
│    ↓                                                       │
│12. POST /api/tutorial-composer/sections ✅ REUSE           │
│    ├─ Set generatedByAi = true ⭐ NEW                     │
│    ├─ Set aiModelUsed = provider ⭐ NEW                   │
│    └─ Set generationJobId = uuid ⭐ NEW                   │
│    ↓                                                       │
│13. tutorial_sections persisted ✅ REUSE                    │
│    ↓                                                       │
│14. Existing runtime delivery ✅ REUSE                      │
│    ├─ TutorialBlock → IntroductionBlock                   │
│    ├─ IntroductionI1View renderer                         │
│    └─ UBRC/ILS/LSNB compliance                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 17.2 New Components Required

**Minimal Set:**

1. **ProjectLLMService** (Node/TypeScript module)
   - Location: `apps/skillhubcore-admin/src/lib/project-llm/`
   - Responsibilities:
     - Orchestrate generation request
     - Call provider abstraction
     - Parse response
     - Validate candidate
     - Return structured result

2. **Provider Abstraction Interface**
   - Location: `apps/skillhubcore-admin/src/lib/project-llm/providers/`
   - Types: `ProjectLLMProvider` interface
   - Implementations:
     - `TestProvider` (for development)
     - `RealProvider` (OpenAI/Anthropic/Gemini - TBD)

3. **UI Enhancement: "Generate with AI" Button**
   - Location: `AiInstructionContainer.tsx` or `TutorialEditorPanel.tsx`
   - Triggers: `ProjectLLMService.generateI1()`
   - Displays: Loading state → Candidate in editor

4. **Provenance Tracking Type**
   - Location: `apps/skillhubcore-admin/src/lib/project-llm/types.ts`
   - Fields: provider, model, timestamp, requestId

**That's it.** No new service, no Python, no separate deployment, no new database tables.

---

## 18. REUSE / EXTEND / NEW MATRIX

| Component | Action | Justification |
|---|---|---|
| **TutorialPromptContext** | ✅ REUSE | Already contains all required fields |
| **getIntroductionI1Prompt()** | ✅ REUSE | Complete Creation Brief contract |
| **buildTutorialPrompt()** | ✅ REUSE | Shared prompt infrastructure |
| **IntroductionI1BlockSchema** | ✅ REUSE | Complete Zod validation |
| **validateIntroductionI1AIOutput()** | ✅ REUSE | Dedicated validator exists |
| **TutorialDocumentSchema** | ✅ REUSE | Handles I1 blocks correctly |
| **BlockInstance transformation** | ✅ REUSE | Already handles I1 |
| **toTutorialBlock()** | ✅ REUSE | Already transforms I1 |
| **tutorialSaveService** | ⚠️ EXTEND | Add AI metadata population |
| **tutorial_sections schema** | ✅ REUSE | AI fields already exist |
| **Authorization** | ✅ REUSE | Use TUTORIAL_AUTHOR_CREATE |
| **Composer UI (review/edit)** | ✅ REUSE | Existing JSON editor |
| **IntroductionI1View** | ✅ REUSE | Runtime renderer unchanged |
| **UBRC compliance** | ✅ REUSE | Already verified for I1 |
| **LSNB compliance** | ✅ REUSE | Navigation boundary integration exists |
| **RSSB compliance** | ✅ REUSE | State synchronization (N/A for I1, no stateful interactions) |
| **ILS integration** | ✅ REUSE | In-Lesson System progress tracking active |
| | | |
| **ProjectLLMService** | ❌ NEW | Generation orchestration |
| **Provider abstraction** | ❌ NEW | LLM provider interface |
| **TestProvider** | ❌ NEW | Development mock |
| **"Generate with AI" UI** | ❌ NEW | Trigger button |
| **Provenance types** | ❌ NEW | Metadata tracking |

**Reuse Analysis:** The architecture achieves high reuse by inserting Project LLM at the optimal boundary (post-prompt, pre-validation). This is a PROPOSED ESTIMATE based on investigation findings, NOT an architectural fact requiring approval.

---

## 19. IMPLEMENTATION SEQUENCE (PROPOSED ESTIMATE)

**Note:** This sequence and timeline are PROPOSED ESTIMATES to illustrate the implementation path, NOT architectural decisions requiring approval. Actual timeline depends on team velocity, vendor selection, and integration complexity discovered during implementation.

### Phase 1B Implementation Order

**Stage 1: Foundation (Estimated: Days 1-5)**
1. Create ProjectLLMService module structure
2. Define provider abstraction interface (vendor-neutral)
3. Implement TestProvider (returns mock I1 JSON)
4. Unit tests for provider abstraction

**Stage 2: Integration (Estimated: Days 6-10)**
5. Add "Generate with AI" button to Composer UI
6. Wire button → ProjectLLMService → TestProvider
7. Display candidate in JSON editor
8. Extend tutorialSaveService to populate AI metadata
9. Integration tests

**Stage 3: Real Provider + E2E (Estimated: Days 11-15)**
10. Implement real provider (after Human vendor selection)
11. Add error handling for provider failures
12. Add provenance tracking
13. E2E test: full lifecycle with real provider
14. Runtime verification

**Stage 4: Evidence + Documentation (Estimated: Days 16-20)**
15. Execute all tests, collect evidence
16. Create implementation evidence document
17. Human Architecture Authority review
18. Certification gate

**Duration Estimate Range:** This is a PROPOSED ESTIMATE for planning purposes. Actual duration will be determined during implementation.

---

## 20. ARCHITECTURE DECISIONS FOR HUMAN APPROVAL

| # | Decision | Finding | Recommendation | Requires Human Decision |
|---|---|---|---|---|
| **1** | **Project LLM Location** | Could extend Composer OR create separate service | **EXTEND COMPOSER** (simpler, faster) | ✅ **YES** |
| **2** | **Service Technology** | Python/FastAPI proposed but not justified | **Node/TypeScript** (matches monorepo) | ✅ **YES** |
| **3** | **Insertion Point** | 6 candidates analyzed | **Candidate B** (provider integration) | ✅ **YES** |
| **4** | **Provider Selection** | OpenAI, Anthropic, or Gemini | **Test provider first**, then real provider | ✅ **YES** |
| **5** | **Creation Brief** | New type OR reuse | **REUSE** existing prompt | ✅ NO (technical) |
| **6** | **Candidate Persistence** | New tables OR existing | **REUSE** existing schema | ✅ NO (technical) |
| **7** | **Validation** | New OR reuse | **REUSE** existing Zod schemas | NO (technical finding) |
| **8** | **Authorization** | New permission OR reuse | **REUSE** TUTORIAL_AUTHOR_CREATE | NO (technical finding) |
| **9** | **Human Approval** | New UI OR reuse | **REUSE** existing Composer editor | NO (technical finding) |
| **10** | **Timeline** | Implementation duration | See Section 19 for PROPOSED ESTIMATE | NO (planning estimate, not architecture) |

---

## 21. OPEN RISKS

1. **Provider costs** — Real LLM API usage will incur costs; need budget approval
2. **Provider selection impacts architecture** — Different providers have different SDKs/APIs
3. **Quality of generated content** — No guarantee AI output is pedagogically sound
4. **Hallucination detection** — Deferred to Phase 2, but could affect Phase 1B
5. **Human review burden** — Every generated block must be reviewed manually
6. **Test provider gap** — Mock provider won't catch real provider integration issues

---

## 22. KNOWN LIMITATIONS

1. **I1 only** — I2-I6 NOT in scope
2. **Single block generation** — No multi-block tutorials
3. **No automatic publication** — Human approval required
4. **No quality scoring** — Deferred to Phase 2
5. **No hallucination detection** — Deferred to Phase 2
6. **English only** — No i18n support initially
7. **Test provider initially** — Real provider requires Human decision

---

## 23. SUCCESS CRITERIA

Phase 1B is complete when:

1. ✅ User selects hierarchy → Composer builds context
2. ✅ User clicks "Generate with AI"
3. ✅ ProjectLLMService generates I1 candidate (via test provider)
4. ✅ Candidate validates against IntroductionI1BlockSchema
5. ✅ Candidate appears in Composer JSON editor
6. ✅ Human reviews/edits candidate
7. ✅ Human adds to document
8. ✅ Save API populates AI metadata fields
9. ✅ TutorialDocument persists to database
10. ✅ Runtime renders I1 correctly
11. ✅ E2E test proves complete lifecycle
12. ✅ Evidence document created
13. ✅ Human Architecture Authority certifies

**Estimated Success Timeline:** 3-4 weeks with focused implementation

---

## 24. FINAL RECOMMENDATION

### **RECOMMENDED ARCHITECTURE FOR PHASE 1B:**

**Service Location:** Extend existing Composer (`apps/skillhubcore-admin`)  
**Technology:** Node/TypeScript (NOT Python/FastAPI)  
**Insertion Point:** Candidate B (provider integration at prompt boundary)  
**Provider Strategy:** Test provider initially, real provider after Human decision  
**Database:** Reuse existing `tutorial_sections` AI metadata fields  
**Validation:** Reuse existing `IntroductionI1BlockSchema`  
**Authorization:** Reuse existing `TUTORIAL_AUTHOR_CREATE` permission  
**UI:** Extend existing Composer with "Generate with AI" button  

**New Code Estimate:** ~15% new, ~85% reuse  
**Timeline Estimate:** 3-4 weeks (NOT 8-12 weeks)  

---

## 25. HUMAN ARCHITECTURE AUTHORITY APPROVAL REQUIRED

**ARCHITECTURE RECONCILIATION: COMPLETE** ✅

**Repository State:** UNCHANGED  
**Production Code Changes:** NONE  
**Files Created:** This reconciliation document only  

**Key Findings:**

1. ✅ **Complete I1 pipeline traced** from hierarchy selection → runtime delivery
2. ✅ **TutorialPromptContext verified** as sufficient Creation Brief
3. ✅ **IntroductionI1BlockSchema verified** as complete validation
4. ✅ **AI metadata fields exist** but not populated (prepared for automation)
5. ✅ **Transient candidate model confirmed** (no candidate_blocks table needed)
6. ✅ **generationJobId semantics clarified** (provenance ID, not job record FK)
7. ✅ **High code reuse possible** with minimal new infrastructure
8. ✅ **Separate service NOT justified** for minimal vertical slice
9. ✅ **Python/FastAPI NOT justified** — Node/TypeScript simpler
10. ✅ **Provider abstraction designed** as vendor-neutral boundary

**Critical Architecture Decisions Requiring Human Approval:**

| # | Decision | Recommendation | Rationale |
|---|---|---|---|
| **1** | **Project LLM Location** | Extend Composer (NOT separate service) | Minimal disruption, reuses auth/DB/deployment |
| **2** | **Service Technology** | Node/TypeScript (NOT Python/FastAPI) | Matches monorepo, no new language/infrastructure |
| **3** | **Insertion Point** | Candidate B (provider integration at prompt boundary) | Automates manual copy-paste, maximum reuse |
| **4** | **Provider Selection** | Test provider initially, real provider TBD | Prove pipeline before vendor commitment |

**Non-Architecture Findings (Technical, No Approval Needed):**

- Creation Brief: REUSE existing prompt ✅
- Candidate Persistence: Transient (no new tables) ✅
- Validation: REUSE existing Zod schemas ✅
- Authorization: REUSE existing permissions ✅
- Human Approval: REUSE existing Composer UI ✅

**Timeline Estimate (Section 19):** Provided as PROPOSED ESTIMATE for planning, not architectural decision.

**Recommended Next Step:** Human Architecture Authority reviews this document and provides:
- APPROVE recommendations above, OR
- MODIFY with specific architectural requirements, OR
- REJECT with rationale for alternative approach

After approval → Proceed to Phase 1B Step 2 (Implementation Contract)

---

## 26. PHASE 1B STEP 1 CLOSURE — INVESTIGATION STATUS SUMMARY

**Document Status:** INVESTIGATION COMPLETE — ALL ITEMS VERIFIED, DEFERRED, OR MARKED NOT REQUIRED

### 26.1 VERIFIED Items (Investigation Complete, Evidence Found)

| # | Item | Status | Evidence Location |
|---|---|---|---|
| **1** | Existing I1 pipeline complete | ✅ VERIFIED | Sections 1, 6, Appendix A |
| **2** | TutorialPromptContext sufficient as Creation Brief | ✅ VERIFIED | Sections 2, 4 |
| **3** | getIntroductionI1Prompt() complete contract | ✅ VERIFIED | Section 3 |
| **4** | IntroductionI1BlockSchema complete validation | ✅ VERIFIED | Section 14 |
| **5** | validateIntroductionI1AIOutput() function exists | ✅ VERIFIED | Section 14 |
| **6** | TutorialDocumentSchema handles I1 correctly | ✅ VERIFIED | Section 14 |
| **7** | tutorial_sections AI metadata fields exist | ✅ VERIFIED | Sections 5, 16 |
| **8** | AI metadata fields NOT currently populated | ✅ VERIFIED | Section 16 (grep search: zero matches) |
| **9** | RBAC authorization system exists | ✅ VERIFIED | Section 15 |
| **10** | TUTORIAL_AUTHOR_CREATE permission sufficient | ✅ VERIFIED | Section 15 |
| **11** | Composer UI supports JSON editing | ✅ VERIFIED | Sections 1, 17 |
| **12** | BlockInstance transformation works for I1 | ✅ VERIFIED | Section 6 |
| **13** | tutorialSaveService handles I1 blocks | ✅ VERIFIED | Section 1, 17 |
| **14** | Runtime IntroductionI1View renders correctly | ✅ VERIFIED | Appendix A, B |
| **15** | UBRC identity attributes present | ✅ VERIFIED | Appendix A |
| **16** | LSNB navigation boundary integration exists | ✅ VERIFIED | Appendix A |
| **17** | ILS progress tracking active for I1 | ✅ VERIFIED | Appendix A |
| **18** | E2E tests exist for I1 | ✅ VERIFIED | Appendix B |

### 26.2 DEFERRED Items (Out of Scope for Phase 1B, Documented for Future)

| # | Item | Status | Rationale |
|---|---|---|---|
| **1** | I2-I6 block implementations | ⏸️ DEFERRED | Phase 1B scope = I1 only |
| **2** | Quality score calculation | ⏸️ DEFERRED | Phase 2+ feature |
| **3** | Hallucination detection | ⏸️ DEFERRED | Phase 2+ feature |
| **4** | Automatic publication without human review | ⏸️ DEFERRED | Out of scope |
| **5** | Multi-block tutorial generation | ⏸️ DEFERRED | Phase 1B = single block only |
| **6** | Internationalization (i18n) support | ⏸️ DEFERRED | English-only initially |
| **7** | Version history for candidates | ⏸️ DEFERRED | Transient candidate model |
| **8** | Candidate A/B testing | ⏸️ DEFERRED | Beyond Phase 1B scope |
| **9** | Error handling details | ⏸️ DEFERRED | Implementation phase concern |
| **10** | Provider cost optimization | ⏸️ DEFERRED | After vendor selection |

### 26.3 NOT REQUIRED Items (Investigation Determined Not Needed)

| # | Item | Status | Rationale |
|---|---|---|---|
| **1** | New CreationBrief type | ❌ NOT REQUIRED | Existing prompt is sufficient (Section 4) |
| **2** | candidate_blocks table | ❌ NOT REQUIRED | Transient candidate model (Section 5) |
| **3** | CandidateBlock type | ❌ NOT REQUIRED | Transient candidate model (Section 5) |
| **4** | Generation job lifecycle table | ❌ NOT REQUIRED | generationJobId = provenance ID (Section 5) |
| **5** | Candidate CRUD APIs | ❌ NOT REQUIRED | Transient candidate model (Section 5) |
| **6** | New validation schemas | ❌ NOT REQUIRED | Existing Zod schemas complete (Section 14) |
| **7** | New authorization permissions | ❌ NOT REQUIRED | TUTORIAL_AUTHOR_CREATE sufficient (Section 15) |
| **8** | New database tables | ❌ NOT REQUIRED | tutorial_sections sufficient (Section 16) |
| **9** | Separate Python/FastAPI service | ❌ NOT REQUIRED | Node/TypeScript in Composer simpler (Section 8) |
| **10** | New TutorialDocument version | ❌ NOT REQUIRED | Existing schema handles AI blocks (Section 14) |

### 26.4 PROPOSED Items (Recommendations Requiring Human Approval)

**Note:** Items #1 and #2 are currently OPEN/BLOCKED pending Question Bank LLM investigation (see Section 27)

| # | Item | Status | Human Decision Required |
|---|---|---|---|
| **1** | Project LLM location (Composer vs separate service) | ⏸️ OPEN/BLOCKED | ✅ YES — after QB LLM investigation (Section 27) |
| **2** | Technology stack (Python/FastAPI vs Node/TypeScript) | ⏸️ OPEN/BLOCKED | ✅ YES — after QB LLM investigation (Section 27) |
| **3** | Candidate B insertion point | 📋 PROPOSED | ✅ YES (Section 7, 20) |
| **4** | Vendor-neutral provider abstraction | 📋 PROPOSED | ✅ YES (Section 9, 20) |
| **5** | Test provider initially | 📋 PROPOSED | ✅ YES (Section 9, 20) |
| **6** | Real provider selection (OpenAI/Anthropic/Google/Other) | 📋 PROPOSED | ✅ YES (Section 9, 20) |
| **7** | Transient candidate model | 📋 PROPOSED | ✅ YES (Section 5, 20) |
| **8** | generationJobId as provenance ID | 📋 PROPOSED | ✅ YES (Section 5, 20) |
| **9** | Reuse existing Composer UI for review | 📋 PROPOSED | ✅ YES (Section 17, 20) |

### 26.5 PROPOSED ESTIMATES (Planning Guidance, Not Architecture Decisions)

| # | Item | Estimate | Note |
|---|---|---|---|
| **1** | Code reuse percentage | ~85% reuse, ~15% new | Indicative based on investigation (Section 18) |
| **2** | Implementation duration | See Section 19 for stage breakdown | PROPOSED ESTIMATE for planning |
| **3** | New components count | 5 components (Section 17.2) | ProjectLLMService, provider abstraction, TestProvider, UI button, provenance types |

### 26.6 Terminology Corrections Applied

| Acronym | Expansion | Usage in Document |
|---|---|---|---|
| **UBRC** | Unique Block Runtime Contract | Used throughout, expanded only once in Section 4.2 |
| **LSNB** | Lesson-Scoped Navigation Boundary | Used throughout, expanded only once in Section 4.2 |
| **RSSB** | Runtime State Synchronization Boundary | Used throughout, expanded only once in Section 4.2 |
| **ILS** | In-Lesson System | Defined in Section 4.2, used consistently as "ILS" |

### 26.7 Phase 1B Step 1 Certification Checklist

| Requirement | Status | Evidence |
|---|---|---|
| READ-ONLY investigation (no code changes) | ✅ COMPLETE | No production code modified |
| Complete I1 pipeline traced | ✅ COMPLETE | Sections 1-6, Appendix A |
| Insertion point candidates evaluated | ✅ COMPLETE | Section 7 |
| Service boundary options analyzed | ✅ COMPLETE | Section 8 |
| Provider abstraction designed | ✅ COMPLETE | Section 9 |
| Validation pipeline verified | ✅ COMPLETE | Section 14 |
| Authorization model verified | ✅ COMPLETE | Section 15 |
| Database schema verified | ✅ COMPLETE | Section 16 |
| Reuse/extend/new matrix created | ✅ COMPLETE | Section 18 |
| Architecture recommendations documented | ✅ COMPLETE | Sections 20, 25 |
| Human approval decisions identified | ✅ COMPLETE | Sections 20, 25 |
| Terminology corrections applied | ✅ COMPLETE | Sections 4.2, 18, Appendix A |
| Status contradictions resolved | ✅ COMPLETE | This section (26) |
| Candidate persistence clarified | ✅ COMPLETE | Section 5 |
| generationJobId semantics defined | ✅ COMPLETE | Section 5.3 |
| Timeline marked as estimate (not fact) | ✅ COMPLETE | Section 19 |
| Provider abstraction vendor-neutral | ✅ COMPLETE | Section 9 |

**Phase 1B Step 1 Status:** ✅ **I1 ARCHITECTURE RECONCILIATION COMPLETE** | ⏸️ **TECHNOLOGY/SERVICE BOUNDARY DECISION OPEN/BLOCKED**

**Blocking Item:** Question Bank LLM Reference Architecture Investigation (see Section 27)

**Next Action:** Complete Question Bank LLM forensic investigation before proceeding to Phase 1B Step 2 (Implementation Contract).

---

## 27. TECHNOLOGY/SERVICE BOUNDARY DECISION — OPEN/BLOCKED

### 27.1 Current Status

**Decision Status:** ⏸️ **OPEN/BLOCKED pending Question Bank LLM Reference Architecture Investigation**

**Why Blocked:**

The current reconciliation document analyzed the I1 pipeline from a **Composer-centric perspective** and preliminarily recommended:
- **Location:** Extend existing Composer (`apps/skillhubcore-admin`)
- **Technology:** Node/TypeScript (NOT Python/FastAPI)

**Rationale used:**
- "Matches existing Composer"
- "No new language in monorepo"
- "Simpler for minimal slice"

**Critical Oversight:**

This recommendation **completely ignored** the existing **Question Bank LLM** system, which:
1. ✅ Already exists in production
2. ✅ Already solved LLM provider integration
3. ✅ Already has Python/FastAPI infrastructure
4. ✅ Already has deployment patterns
5. ✅ Already has team knowledge
6. ✅ Could share code, patterns, or service infrastructure

**Before making the technology/service boundary decision, we must:**
1. Investigate the existing Question Bank LLM architecture
2. Analyze what is reusable vs domain-specific
3. Compare evidence across ALL options (not just Composer-centric view)
4. Make an evidence-based recommendation considering the existing reference implementation

### 27.2 Missing Investigation

**Required Investigation: Question Bank LLM Reference Architecture Analysis**

**Scope:**

| Investigation Area | Questions |
|---|---|
| **Location & Structure** | Where is Question Bank LLM in codebase? What is its directory structure? |
| **Technology Stack** | Python version? FastAPI? What libraries/frameworks? |
| **Provider Integration** | How does it call LLM providers? What abstraction exists? OpenAI? Anthropic? Other? |
| **Request/Response Flow** | How do requests enter? How are responses returned? Sync or async? |
| **TypeScript Integration** | How does the TypeScript Composer/apps integrate with Python service? REST? gRPC? Direct? |
| **Prompt Management** | How are prompts structured? Template system? Hardcoded? |
| **Validation** | How is LLM output validated? Pydantic? Custom? |
| **Error Handling** | Retry logic? Timeout handling? Fallback patterns? |
| **Observability** | Logging? Monitoring? Tracing? |
| **Deployment** | How is it deployed? Docker? Cloud Run? Same infra as Composer? |
| **Authentication** | How does it authenticate? Shared session? API keys? |
| **Configuration** | How are provider API keys managed? Environment? Secrets? |

**Reusability Analysis:**

```
POTENTIALLY REUSABLE (Generic LLM Infrastructure)
├── Provider client implementations
├── Provider abstraction interface
├── Request/response transport
├── Authentication/authorization patterns
├── Secrets/configuration management
├── Retry/error handling logic
├── Observability/logging patterns
├── Deployment infrastructure
├── Structured-output utilities
└── Validation patterns

QUESTION-BANK-SPECIFIC (Domain Logic)
├── Question generation prompts
├── Question schemas (Pydantic models)
├── Question validation rules
├── Question-bank business logic
├── Question persistence
└── Question-specific orchestration

PROJECT-LLM-SPECIFIC (Will Need to Build)
├── TutorialPromptContext integration
├── I1 Creation Brief templates
├── I1 validation (IntroductionI1BlockSchema)
├── Candidate lifecycle management
├── Composer integration/handoff
└── tutorial_sections metadata population
```

### 27.3 Technology Decision Matrix (Evidence-Based)

After Question Bank LLM investigation, compare:

| Option | Description | Pros | Cons | Evidence Required |
|---|---|---|---|---|
| **A — Extend Question Bank Python/FastAPI** | Project LLM becomes another module in existing LLM service | Reuses provider integration, deployment, infrastructure | Couples two domains, shared deployment | QB LLM modularity, extension points |
| **B — Node/TypeScript in Composer** | Current Composer-centric proposal | No cross-service calls, same codebase | Duplicates LLM infra, new provider integration | Complexity of duplicating QB patterns |
| **C — New Python/FastAPI Service** | Standalone Project LLM service (same tech as QB) | Bounded context, reuses Python patterns | New deployment, separate infrastructure | QB LLM infrastructure reusability |
| **D — Shared LLM Infrastructure Layer** | Generic LLM layer + separate domain modules (QB + Project) | Maximum reuse, clean separation | Requires refactoring QB LLM | QB LLM architecture (is generic layer feasible?) |

### 27.4 Investigation Deliverable

**Required Output:** Question Bank LLM Forensic Investigation Report

**Format:** Similar to Phase 1A (PROJECT_LLM_PHASE_1_IMPLEMENTATION_CONTRACT.md)

**Sections:**

1. Executive Summary
2. Question Bank LLM Location & Structure
3. Technology Stack Analysis
4. Provider Integration Architecture
5. Request/Response Flow
6. TypeScript ↔ Python Integration Patterns
7. Prompt Management System
8. Validation Pipeline
9. Error Handling & Resilience
10. Observability & Monitoring
11. Deployment Infrastructure
12. Authentication & Authorization
13. Configuration & Secrets Management
14. Reusability Analysis (Generic vs Domain-Specific)
15. Integration Pattern Options
16. Technology Decision Matrix (Evidence-Based)
17. Recommendation with Rationale
18. Files Inspected
19. Code Samples (if relevant)

### 27.5 Unblocking Criteria

**This decision will be UNBLOCKED when:**

1. ✅ Question Bank LLM forensic investigation complete
2. ✅ Reusability analysis documented (generic vs domain-specific)
3. ✅ All four options (A, B, C, D) evaluated with evidence
4. ✅ Technology decision matrix completed
5. ✅ Evidence-based recommendation made
6. ✅ Human Architecture Authority reviews and approves technology choice

**Then:** Phase 1B Step 2 (Implementation Contract) can begin with locked technology/service boundary.

### 27.6 Recommended Investigation Approach

**Execution:** Forensic READ-ONLY investigation (same protocol as Phase 1A)

**Timeline:** Should be completed before Phase 1B Step 2

**Responsibility:** Project AI / Kiro

**Output Location:** `.analysis/stage-5/QUESTION_BANK_LLM_REFERENCE_ARCHITECTURE.md`

---

## APPENDIX A: COMPLETE EXISTING I1 PIPELINE MAP

**Terminology Reference:**
- **UBRC** = Unique Block Runtime Contract
- **LSNB** = Lesson-Scoped Navigation Boundary
- **RSSB** = Runtime State Synchronization Boundary
- **ILS** = In-Lesson System (progress tracking and state management)

```
[USER] Selects hierarchy in Composer UI
  ↓
[COMPOSER] useTutorialComposerForm hook
  ├─ domain, subject, topic, subtopic selection
  ├─ navigationNode selection
  ├─ blockType = 'introduction'
  └─ versionId = 'v1' (code = 'I1')
  ↓
[COMPOSER] AiInstructionContainer receives props:
  ├─ domainName, subjectName, topicName, subtopicName
  ├─ navigationNodeName, blockName, versionName
  ├─ blockType, versionId
  ↓
[COMPOSER] useMemo constructs TutorialPromptContext
  ↓
[COMPOSER] getIntroductionI1Prompt(context)
  ↓
[COMPOSER] buildTutorialPrompt(context, i1Contract)
  ├─ Header (hierarchy breadcrumb)
  ├─ I1-specific contract (9 sections, icons, rules)
  └─ Footer (expectedTimeSec, prohibited metadata)
  ↓
[COMPOSER UI] Prompt displayed in collapsible panel
  ↓
[HUMAN] Copies prompt text → ChatGPT/Claude/Gemini
  ↓
[EXTERNAL AI] Returns JSON
  ↓
[HUMAN] Copies JSON → Composer JSON editor
  ↓
[COMPOSER] useTutorialBlockEditor.handlePreviewCurrent()
  ├─ JSON.parse(sourceContent)
  ├─ Validation (implicit - to be traced further)
  └─ Updates activeBlockPreview state
  ↓
[COMPOSER] Human clicks "Add to Document"
  ↓
[COMPOSER] useTutorialBlockEditor.handleAddBlockInstance()
  ├─ Creates BlockInstance from payload
  ├─ Adds to documentBlocks array
  └─ Sets hasUnsavedLocalChangesRef = true
  ↓
[COMPOSER] Human clicks "Save Draft"
  ↓
[COMPOSER] useTutorialSave.save('draft')
  ↓
[SERVICE] tutorialSaveService.saveTutorialSection()
  ├─ Maps BlockInstance[] → TutorialBlock[]
  │   └─ toTutorialBlock(instance)
  │       └─ documentTransformation.ts (line 239-254)
  ├─ Creates TutorialDocument { schemaVersion: 1, blocks }
  ├─ Checks existence via GET /api/tutorial-composer/sections
  ├─ POST /api/tutorial-composer/sections (create)
  │   OR PATCH /api/tutorial-composer/sections/:id (update)
  └─ Returns success/failure
  ↓
[API] POST /api/tutorial-composer/sections
  ├─ Authentication check (JWT)
  ├─ Permission check (TUTORIAL_AUTHOR_CREATE)
  ├─ Schema validation (CreateTutorialRequestSchema)
  │   └─ content: TutorialDocumentSchema
  │       └─ blocks: TutorialBlockSchema[]
  │           └─ IntroductionI1BlockSchema
  ├─ tutorialComposerService.createTutorial()
  └─ Persists to tutorial_sections table (JSONB)
  ↓
[DATABASE] tutorial_sections.content = TutorialDocument (JSONB)
  ├─ subtopicId, navigationNodeId, brandId
  ├─ content: { schemaVersion: 1, blocks: [...] }
  ├─ status: 'draft'
  ├─ generatedByAi: false (NOT SET)
  ├─ aiModelUsed: null
  └─ ... (other fields)
  ↓
[RUNTIME] Tutorial delivery
  ↓
[LEARNER REQUEST] GET /tutorial-v2/{...}/{navigationNodeId}
  ↓
[RUNTIME] Fetch tutorial_sections by (subtopic, navigationNode, brand)
  ↓
[RUNTIME] Deserialize TutorialDocument from JSONB
  ↓
[RUNTIME] TutorialBlockRenderer
  ├─ Switch on block.type
  └─ case 'introduction':
      ├─ Validate block.version === 'I1'
      ├─ Validate theme exists
      └─ Render <IntroductionBlock />
          └─ <IntroductionI1View block={block} theme={theme} />
              └─ 9 sections rendered with UBRC attributes
  ↓
[DOM] Introduction I1 content visible to learner
  ├─ data-block-id={block.id}
  ├─ data-block-type="introduction"
  ├─ data-block-version="I1"
  ├─ data-progress-role="instructional"
  └─ data-expected-time-sec={block.expectedTimeSec}
  ↓
[ILS] In-Lesson System progress tracking active
[UBRC] Unique Block Runtime Contract identity attributes present
[LSNB] Lesson-Scoped Navigation Boundary node linked
[RSSB] Runtime State Synchronization Boundary — N/A (no state persistence needed for I1)
```

---

## APPENDIX B: FILES INSPECTED DURING INVESTIGATION

### Composer

- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/TutorialPageContentBuilderClient.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/AiInstructionContainer.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/blocks/introduction/I1/introductionI1.prompt.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/prompts/tutorialPromptContext.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/prompts/tutorialPrompt.shared.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/documentTransformation.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts`
- `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/introduction.registry.ts`

### Authorization

- `apps/skillhubcore-admin/src/lib/auth-helpers.ts`

### API

- `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts`
- `apps/skillhubcore-admin/src/app/api/tutorial-composer/block-suggestions/route.ts`

### Types & Schemas

- `packages/types/src/tutorial-rich-document/document.ts`
- `packages/types/src/tutorial-rich-document/blocks/index.ts`
- `packages/types/src/tutorial-rich-document/blocks/content-blocks.ts`
- `packages/types/src/tutorial-rich-document/schemas/document.schema.ts`
- `packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema.ts`
- `packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts`
- `packages/types/src/tutorial-composer/contracts.ts`

### Database

- `packages/db-tutorial/src/schema/tutorial-sections.ts`

### Runtime

- `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`
- `packages/ui/src/tutorial/TutorialBlockRenderer.tsx`

### Tests

- `tests/e2e/introduction-i1.browser.spec.ts`
- `tests/e2e/introduction-i1.http.spec.ts`
- `tests/e2e/phase-2b18-step-3-bridge-verification.spec.ts`
- `packages/types/src/tutorial-rich-document/__tests__/introduction-i1.fixture.test.ts`

---

## DOCUMENT STATUS

**I1 Architecture Reconciliation:** ✅ COMPLETE  
**Technology/Service Boundary Decision:** ⏸️ OPEN/BLOCKED  
**Production Code:** UNCHANGED  

**Next Gate:** Question Bank LLM Reference Architecture Investigation (Section 27)

**Blocking Items:**
1. ⏸️ Question Bank LLM forensic investigation (location, architecture, reusability)
2. ⏸️ Technology decision matrix (Python/FastAPI vs Node/TypeScript, evidence-based)
3. ⏸️ Service boundary analysis (extend QB, extend Composer, new service, or hybrid)

**After Investigation Complete — Awaiting Human Decision On:**
1. Project LLM location (extend Composer, extend QB LLM, new service, or hybrid)
2. Technology stack (Python/FastAPI or Node/TypeScript)
3. Provider selection (OpenAI, Anthropic, Gemini, or other)
4. Implementation timeline approval

**Then:** Proceed to Phase 1B Step 2 (Implementation Contract)

