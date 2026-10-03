# PROJECT LLM PHASE 1B — IMPLEMENTATION CONTRACT

**Document Type:** Locked Implementation Specification  
**Phase:** Project LLM Phase 1B Step 3  
**Date:** 2026-10-03  
**Status:** READY FOR APPROVAL — All corrections applied  
**Architecture Decision:** ✅ APPROVED (Option B - Node/TypeScript in Composer)  
**Production Code Changes:** NONE (specification phase)  
**Repository State:** UNCHANGED  

---

## EXECUTIVE SUMMARY

### Contract Purpose

This document defines the **locked implementation specification** for Project LLM Phase 1B: automating Introduction I1 block generation within the existing Tutorial Composer.

**This contract must be approved before any production code is written.**

### Architecture Decision (Locked)

**Approved Technology/Service Boundary:** Option B (Node/TypeScript in Composer)

**Human Architecture Authority Decision:** 2026-10-03

**Service Location:** `apps/skillhubcore-admin/src/lib/project-llm/`

**Integration:** Embedded within existing Tutorial Composer application

### Scope (Locked)

**Phase 1B delivers:**
- ✅ Introduction I1 automation ONLY (I2-I6 out of scope)
- ✅ Single-block generation (no multi-block tutorials)
- ✅ Provider abstraction (vendor-neutral)
- ✅ Test provider (mock for development)
- ✅ Transient candidate model (no persistent candidate_blocks table)
- ✅ Human approval required (no automatic publication)
- ✅ AI metadata population (generatedByAi, aiModelUsed, generationJobId)
- ✅ Provenance tracking (request ID, not job record)

**Phase 1B does NOT deliver:**
- ❌ I2-I6 block implementations
- ❌ Real LLM provider integration (separate decision after contract)
- ❌ Quality scoring mechanisms
- ❌ Hallucination detection
- ❌ Automatic publication
- ❌ Multi-block generation
- ❌ Version history for candidates
- ❌ Internationalization

---

## 1. PROJECT LLM SERVICE BOUNDARY

### 1.1 Responsibility Boundary

**Project LLM is responsible for:**

| Responsibility | Scope |
|---|---|
| **Generation Request** | Accept TutorialPromptContext + block type/version |
| **Creation Brief Construction** | Use existing getIntroductionI1Prompt() |
| **Provider Orchestration** | Call LLM provider through abstraction |
| **Response Parsing** | Parse JSON from provider response |
| **Candidate Validation** | Validate against IntroductionI1BlockSchema |
| **Candidate Return** | Return validated candidate to Composer UI |
| **Provenance Tracking** | Record provider, model, timestamp, requestId |

**Project LLM is NOT responsible for:**

| Responsibility | Owner |
|---|---|
| **Runtime Rendering** | IntroductionI1View (existing) |
| **UBRC Enforcement** | Runtime renderer (existing) |
| **LSNB Integration** | Tutorial runtime (existing) |
| **ILS Progress Tracking** | In-Lesson System (existing) |
| **RSSB State Management** | Runtime (N/A for I1, stateless) |
| **TutorialDocument Structure** | Existing schema (reuse) |
| **Block Transformation** | documentTransformation.ts (existing) |
| **Persistence** | tutorialSaveService (extend for metadata) |
| **Human Approval UI** | Existing Composer JSON editor |

**Terminology:**
- **UBRC** = Unique Block Runtime Contract
- **LSNB** = Lesson-Scoped Navigation Boundary
- **RSSB** = Runtime State Synchronization Boundary
- **ILS** = In-Lesson System (progress tracking and state management)

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT COMPONENT (Browser)                                  │
│                                                             │
│ 1. User selects hierarchy (Domain/Subject/Topic/Subtopic)  │
│ 2. User selects block type = 'introduction', version = 'I1'│
│ 3. Composer builds TutorialPromptContext ✅ REUSE          │
│ 4. getIntroductionI1Prompt(context) ✅ REUSE               │
│                                                             │
│ 5. User clicks "Generate with AI" button ⭐ NEW           │
│    ↓                                                       │
│ 6. Client calls fetch('/api/project-llm/generate-i1')     │
│    with { prompt, context }                                │
│    ↓                                                       │
├─────────────────────────────────────────────────────────────┤
│ SERVER API ROUTE (Server Only)                             │
│                                                             │
│ /api/project-llm/generate-i1/route.ts                      │
│    ├─ authenticateRequest() ← JWT validation               │
│    ├─ requireTutorialAuthorCreatePermission()              │
│    ├─ Parse request (prompt, context)                      │
│    ├─ Call ProjectLLMService.generateI1() (server-only)   │
│    └─ Return { success, candidate, provenance }            │
│    ↓                                                       │
├─────────────────────────────────────────────────────────────┤
│ SERVICE LAYER (Server Only)                                │
│                                                             │
│ ProjectLLMService                                          │
│    ├─ Provider abstraction (TestProvider | RealProvider)   │
│    ├─ Provider.generate(prompt)                            │
│    ├─ JSON.parse(response.text)                            │
│    ├─ validateIntroductionI1AIOutput()                     │
│    └─ Return candidate + provenance                        │
│    ↓                                                       │
│ Provider Secrets (Server Only)                             │
│    └─ process.env.PROJECT_LLM_API_KEY (never exposed)      │
│    ↓                                                       │
├─────────────────────────────────────────────────────────────┤
│ CLIENT COMPONENT (Browser) — REVIEW & SAVE                 │
│                                                             │
│ 7. Candidate JSON returned to client ⭐ NEW               │
│ 8. Candidate appears in Composer JSON editor ⭐ NEW       │
│                                                             │
│ 9. Human reviews/edits candidate ✅ REUSE                  │
│10. Human clicks "Add to Document" ✅ REUSE                 │
│11. BlockInstance creation ✅ REUSE                         │
│12. toTutorialBlock() transformation ✅ REUSE               │
│13. tutorialSaveService ⚠️ EXTEND (AI metadata)            │
│    ├─ generatedByAi = true ⭐ NEW                         │
│    ├─ aiModelUsed = provenance.model ?? null ⭐ NEW       │
│    └─ generationJobId = provenance.requestId ⭐ NEW       │
│14. POST /api/tutorial-composer/sections ✅ REUSE           │
│15. tutorial_sections persisted ✅ REUSE                    │
│16. Runtime delivery ✅ REUSE                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Boundaries:**
- Client (browser) → Server API Route: JWT authentication + authorization
- Server API Route → Service Layer: Server-only, provider secrets protected
- Service Layer → Provider: Server-only, API keys from environment variables

---

## 2. PROVIDER ABSTRACTION (VENDOR-NEUTRAL)

### 2.1 Design Principles

**Requirements:**
1. ✅ No vendor-specific types in interface
2. ✅ Provider implementations encapsulate vendor SDKs
3. ✅ Swappable providers without Project LLM core changes
4. ✅ Extensible for new providers
5. ✅ Test/mock provider for development

### 2.2 Interface Definition

**File:** `apps/skillhubcore-admin/src/lib/project-llm/providers/ProjectLLMProvider.ts`

```typescript
/**
 * Vendor-neutral LLM provider abstraction for Project LLM
 * 
 * Design principles:
 * - No vendor-specific types exposed
 * - Minimal contract for text generation
 * - Extensible for future capabilities
 * - Provider implementations handle vendor specifics internally
 */
export interface ProjectLLMProvider {
  /**
   * Provider identifier (for logging/provenance, not vendor-specific)
   * Examples: "test-mock", "production-provider-a"
   */
  readonly name: string;
  
  /**
   * Generate text from prompt
   * 
   * @param request - Vendor-neutral generation request
   * @returns Vendor-neutral generation response
   * @throws ProviderError on provider failures
   */
  generate(request: GenerationRequest): Promise<GenerationResponse>;
}

/**
 * Vendor-neutral request structure
 */
export interface GenerationRequest {
  /** The prompt text to send to the LLM */
  prompt: string;
  
  /** Optional generation parameters (provider translates to vendor format) */
  parameters?: {
    /** Temperature for randomness (0.0-1.0, provider maps to vendor range) */
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
export interface GenerationResponse {
  /** Generated text content */
  text: string;
  
  /** Optional usage statistics (provider maps from vendor format) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /** Optional provider metadata (NOT vendor identifiers) */
  metadata?: {
    /** Model identifier (provider's internal label) */
    model?: string;
    
    /** Additional provider-agnostic metadata */
    [key: string]: unknown;
  };
}

/**
 * Provider error (vendor-neutral)
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: ProviderErrorCode,
    public readonly retryable: boolean,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export enum ProviderErrorCode {
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION = 'AUTHENTICATION',
  INVALID_REQUEST = 'INVALID_REQUEST',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}
```

### 2.3 Test Provider Implementation

**File:** `apps/skillhubcore-admin/src/lib/project-llm/providers/TestProvider.ts`

```typescript
import { ProjectLLMProvider, GenerationRequest, GenerationResponse } from './ProjectLLMProvider';
import { mockIntroductionI1Fixture } from '../fixtures/introduction-i1.fixture';

/**
 * Test provider that returns static Introduction I1 fixture
 * 
 * Purpose:
 * - Development without vendor API calls
 * - Unit/integration testing
 * - Proving vertical slice without provider selection
 */
export class TestProvider implements ProjectLLMProvider {
  readonly name = 'test-mock';
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Simulate realistic latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      text: JSON.stringify(mockIntroductionI1Fixture),
      usage: {
        promptTokens: 1000,
        completionTokens: 800,
        totalTokens: 1800,
      },
      metadata: {
        model: 'test-mock-model',
      },
    };
  }
}
```

### 2.4 Real Provider (Placeholder)

**File:** `apps/skillhubcore-admin/src/lib/project-llm/providers/RealProvider.ts`

```typescript
/**
 * Real LLM provider implementation
 * 
 * THIS IS A PLACEHOLDER.
 * 
 * Actual provider selection (OpenAI, Anthropic, Gemini) is a separate
 * decision to be made after this implementation contract is approved.
 * 
 * Configuration via environment variables (server-only):
 * - PROJECT_LLM_PROVIDER_NAME: 'openai' | 'anthropic' | 'gemini' | ...
 * - PROJECT_LLM_API_KEY: Provider API key (REQUIRED, server-only)
 * - PROJECT_LLM_MODEL: Model identifier (optional, provider-specific)
 * 
 * SECURITY:
 * - API keys MUST remain server-side
 * - NEVER expose in client bundles
 * - NEVER log API keys
 * - Read from process.env at runtime (not build-time)
 * 
 * Implementation will:
 * 1. Import vendor SDK (e.g., OpenAI, Anthropic)
 * 2. Map GenerationRequest to vendor format
 * 3. Call vendor API using server-side API key
 * 4. Map vendor response to GenerationResponse
 * 5. Handle vendor-specific errors → ProviderError
 */
export class RealProvider implements ProjectLLMProvider {
  readonly name: string;
  private readonly apiKey: string;
  private readonly model?: string;
  
  constructor() {
    // Server-side environment variables
    this.name = process.env.PROJECT_LLM_PROVIDER_NAME || 'unknown';
    this.apiKey = process.env.PROJECT_LLM_API_KEY || '';
    this.model = process.env.PROJECT_LLM_MODEL;
    
    if (!this.apiKey) {
      throw new Error('PROJECT_LLM_API_KEY environment variable required');
    }
  }
  
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Provider-specific SDK call using this.apiKey (server-side only)
    throw new Error('RealProvider not yet implemented - provider selection pending');
  }
}
```

---

## 3. PROJECT LLM SERVICE

### 3.1 Service Interface

**File:** `apps/skillhubcore-admin/src/lib/project-llm/ProjectLLMService.ts`

```typescript
import { ProjectLLMProvider } from './providers/ProjectLLMProvider';
import { validateIntroductionI1AIOutput } from '@/packages/types/src/tutorial-rich-document/schemas/introduction-i1.schema';
import type { IntroductionI1AuthorContent } from '@/packages/types/src/tutorial-rich-document/blocks/introduction-i1';

export interface GenerateI1Request {
  /** The complete I1 generation prompt */
  prompt: string;
  
  /** Context for provenance tracking */
  context: {
    domainName: string;
    subjectName: string;
    topicName: string;
    subtopicName: string;
    navigationNodeName: string;
  };
}

export interface GenerateI1Result {
  /** Whether generation succeeded */
  success: boolean;
  
  /** Validated I1 candidate (if success = true) */
  candidate?: IntroductionI1AuthorContent;
  
  /** Error message (if success = false) */
  error?: string;
  
  /** Provenance metadata */
  provenance: GenerationProvenance;
}

export interface GenerationProvenance {
  /** Provider name (vendor-neutral, e.g., "test-mock", "openai-provider") */
  provider: string;
  
  /** Model identifier (e.g., "gpt-4-turbo", "claude-3-5-sonnet", "test-mock-model") */
  model: string | null;
  
  /** Generation timestamp */
  timestamp: Date;
  
  /** Request ID for correlation (written to generationJobId) */
  requestId: string;
  
  /** Token usage (if available) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ProjectLLMService {
  constructor(private readonly provider: ProjectLLMProvider) {}
  
  /**
   * Generate Introduction I1 block
   * 
   * Workflow:
   * 1. Call provider.generate(prompt)
   * 2. Parse JSON response
   * 3. Validate against IntroductionI1AuthorContentSchema
   * 4. Return success + candidate + provenance, OR error
   */
  async generateI1(request: GenerateI1Request): Promise<GenerateI1Result> {
    const requestId = crypto.randomUUID();
    const timestamp = new Date();
    
    try {
      // 1. Call provider
      const response = await this.provider.generate({
        prompt: request.prompt,
        parameters: {
          temperature: 0.7,
          maxTokens: 4000,
        },
      });
      
      // 2. Parse JSON
      const parsed = JSON.parse(response.text);
      
      // 3. Validate schema
      const validated = validateIntroductionI1AIOutput(parsed);
      
      // 4. Success
      return {
        success: true,
        candidate: validated,
        provenance: {
          provider: this.provider.name,
          model: response.metadata?.model,
          timestamp,
          requestId,
          usage: response.usage,
        },
      };
    } catch (error) {
      // Error handling
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provenance: {
          provider: this.provider.name,
          timestamp,
          requestId,
        },
      };
    }
  }
}
```

### 3.2 Service Initialization

**File:** `apps/skillhubcore-admin/src/lib/project-llm/index.ts`

```typescript
import { ProjectLLMService } from './ProjectLLMService';
import { TestProvider } from './providers/TestProvider';
import { RealProvider } from './providers/RealProvider';

/**
 * Initialize Project LLM service with appropriate provider
 * 
 * Strategy:
 * - Development/test: Use TestProvider
 * - Production: Use RealProvider (after provider selection)
 */
export function createProjectLLMService(): ProjectLLMService {
  const useTestProvider = process.env.NODE_ENV === 'development' 
    || process.env.PROJECT_LLM_USE_TEST_PROVIDER === 'true';
  
  const provider = useTestProvider 
    ? new TestProvider()
    : new RealProvider();
  
  return new ProjectLLMService(provider);
}

// Singleton instance
export const projectLLMService = createProjectLLMService();
```

---

## 4. CANDIDATE LIFECYCLE (TRANSIENT)

### 4.1 Candidate Model

**Decision (Locked):** Transient candidate model

**Characteristics:**
- ❌ NO `candidate_blocks` table
- ❌ NO persistent candidate storage
- ✅ Candidate exists ONLY in UI state during review
- ✅ Once approved → becomes TutorialBlock in tutorial_sections
- ✅ Rejection discards candidate (no database write)

### 4.2 Lifecycle States

```
[GENERATION]
      ↓
  Candidate JSON (in-memory)
      ↓
[UI REVIEW STATE]
      ↓
  Human reviews in Composer JSON editor
      ↓
[DECISION]
      ├─ APPROVE → Save → TutorialBlock in tutorial_sections
      └─ REJECT → Discard (no persistence)
```

### 4.3 State Management

**Location:** React state in Composer UI

**No server-side candidate storage:**
- Candidate held in `useState` or similar
- Candidate never written to database until approval
- Rejection = state reset, no API call

---

## 5. VALIDATION PIPELINE

### 5.1 Validation Chain

```
Provider returns JSON string
      ↓
JSON.parse() → syntax validation
      ↓
validateIntroductionI1AIOutput()
      ├─ IntroductionI1AuthorContentSchema.parse()
      ├─ Icon registry validation
      ├─ Structure validation (9 sections)
      ├─ Field constraints (string lengths, array sizes)
      └─ Required fields check
      ↓
Validated IntroductionI1AuthorContent
      ↓
Display in Composer for human review
      ↓
Human approval
      ↓
Existing BlockInstance creation ✅ REUSE
      ↓
Existing toTutorialBlock() transformation ✅ REUSE
      ↓
Existing TutorialDocumentSchema validation ✅ REUSE
      ↓
Persist to tutorial_sections
```

### 5.2 Validation Reuse

**Reuse existing:**
- ✅ `validateIntroductionI1AIOutput()` (packages/types)
- ✅ `IntroductionI1AuthorContentSchema` (Zod schema)
- ✅ `IntroductionI1BlockSchema` (block-level validation)
- ✅ `TutorialDocumentSchema` (document-level validation)

**No new validation schemas needed.**

---

## 6. HUMAN APPROVAL WORKFLOW

### 6.1 Approval Mechanism

**UI:** Existing Composer JSON editor

**Workflow:**
1. Candidate appears in JSON editor (pre-filled)
2. Human reviews content
3. Human edits if needed (manual JSON editing)
4. Human clicks "Add to Document" (existing button)
5. Existing save pipeline

**No new approval UI needed** — reuse existing Composer review flow

### 6.2 Approval States

| State | UI | Database | Notes |
|---|---|---|---|
| **Generated** | JSON in editor | Not persisted | Candidate held in UI state |
| **Under Review** | Human editing | Not persisted | Composer allows JSON editing |
| **Approved** | Added to document | Persisted | Becomes TutorialBlock in tutorial_sections |
| **Rejected** | Cleared | Not persisted | Human discards, no save |

---

## 7. PROVENANCE TRACKING

### 7.1 generationJobId Semantics (Locked)

**Decision:** generationJobId is a **provenance/request identifier**, NOT a job record reference

**Type:** UUID v4

**Semantics:**
- Generated at request time
- Used for correlation in logs
- Traces which generation request produced this block
- Debugging/audit trail
- NOT a foreign key to jobs table

**No jobs table required.**

### 7.2 AI Metadata Population

**Fields (existing schema):**

```typescript
// tutorial_sections table
{
  generatedByAi: true,                    // ⭐ NEW: Set to true
  aiModelUsed: 'test-mock-model',         // ⭐ NEW: Model identifier (NOT provider name)
  generationJobId: '<uuid>',              // ⭐ NEW: Request ID (provenance)
  qualityScore: null,                     // Phase 2
  hallucinationScore: null,               // Phase 2
  regenerationCount: 0,                   // Default (manual regeneration Phase 2)
  approvedBy: '<userId>',                 // Existing (human who approved)
  approvedAt: '<timestamp>',              // Existing (approval time)
  rejectionReason: null,                  // Not used (rejection = no save)
}
```

**aiModelUsed semantics:**
- Stores MODEL identifier, not provider name
- TestProvider returns `model: "test-mock-model"`
- RealProvider returns actual model (e.g., `model: "gpt-4-turbo"`, `model: "claude-3-5-sonnet"`)
- Value = `provenance.model ?? null`

### 7.3 Metadata Write Location

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/services/tutorialSaveService.ts`

**Modification:** Extend save function to populate AI metadata when block was generated

```typescript
// Before save:
if (blockWasGeneratedByAI) {
  metadata = {
    generatedByAi: true,
    aiModelUsed: provenance.model ?? null,    // Model identifier, NOT provider name
    generationJobId: provenance.requestId,
  };
}
```

---

## 8. AUTHORIZATION

### 8.1 Permission Enforcement

**Decision:** Reuse existing `TUTORIAL_AUTHOR_CREATE` permission

**Rationale:**
- Human initiates generation = same security boundary as manual authoring
- Same permission scope
- No new permission needed for Phase 1B

**Enforcement Point:** SERVER-SIDE in API route

**File:** `apps/skillhubcore-admin/src/app/api/project-llm/generate-i1/route.ts`

**Implementation:**

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate request (server-side)
  const authResult = await authenticateRequest(request);
  if ('type' in authResult) {
    return createAuthErrorResponse(authResult);
  }
  const { user } = authResult;
  
  // 2. Authorize TUTORIAL_AUTHOR_CREATE (server-side)
  const authError = requireTutorialAuthorCreatePermission(user);
  if (authError) {
    return createAuthErrorResponse(authError);
  }
  
  // 3. Proceed with generation
  // ...
}
```

**Client-Side UI:** May optionally hide "Generate with AI" button if user lacks permission, but SERVER-SIDE enforcement is authoritative.

**Roles Granted:** `admin`, `super_admin`

---

## 9. UI INTEGRATION & API ROUTE

### 9.1 API Route Specification (Server-Side)

**File:** `apps/skillhubcore-admin/src/app/api/project-llm/generate-i1/route.ts`

**Method:** POST

**Authentication:** Required (JWT session)

**Authorization:** TUTORIAL_AUTHOR_CREATE permission (server-side enforcement)

**Request Body:**
```json
{
  "prompt": "string (complete I1 generation prompt)",
  "context": {
    "domainName": "string",
    "subjectName": "string",
    "topicName": "string",
    "subtopicName": "string",
    "navigationNodeName": "string"
  }
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "candidate": { 
    ...IntroductionI1AuthorContent 
  },
  "provenance": {
    "provider": "string",
    "model": "string | null",
    "timestamp": "ISO-8601 date",
    "requestId": "uuid",
    "usage": {
      "promptTokens": 1000,
      "completionTokens": 800,
      "totalTokens": 1800
    } | null
  }
}
```

**Response (Error 400/401/403/422/500):**
```json
{
  "success": false,
  "error": "string (error message)",
  "provenance": {
    "provider": "string",
    "timestamp": "ISO-8601 date",
    "requestId": "uuid"
  }
}
```

**Security:**
- Server-side authentication enforcement (`authenticateRequest`)
- Server-side authorization enforcement (`requireTutorialAuthorCreatePermission`)
- Provider credentials never exposed to client
- Service layer server-only (not imported by client components)

**Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAuthErrorResponse,
  requireTutorialAuthorCreatePermission,
} from '@/lib/auth-helpers';
import { projectLLMService } from '@/lib/project-llm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate request (server-side)
    const authResult = await authenticateRequest(request);
    if ('type' in authResult) {
      return createAuthErrorResponse(authResult);
    }
    const { user } = authResult;

    // Step 2: Authorize TUTORIAL_AUTHOR_CREATE (server-side)
    const authError = requireTutorialAuthorCreatePermission(user);
    if (authError) {
      return createAuthErrorResponse(authError);
    }

    // Step 3: Parse request body
    const body = await request.json();
    const { prompt, context } = body;

    // Step 4: Validate input
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid prompt',
          provenance: {
            provider: 'unknown',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          }
        },
        { status: 400 }
      );
    }

    // Step 5: Call service (server-only, has access to secrets)
    const result = await projectLLMService.generateI1({
      prompt,
      context,
    });

    // Step 6: Return result
    return NextResponse.json(result, { 
      status: result.success ? 200 : 422 
    });
    
  } catch (error) {
    console.error('[Project LLM API] Generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provenance: {
          provider: 'unknown',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
```

### 9.2 "Generate with AI" Button (Client Component)

**Location:** `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/AiInstructionContainer.tsx`

**Implementation:**

```typescript
// Add button next to existing prompt display
<Button onClick={handleGenerateWithAI}>
  Generate with AI
</Button>

async function handleGenerateWithAI() {
  setLoading(true);
  
  try {
    // 1. Get prompt from existing getIntroductionI1Prompt()
    const prompt = getIntroductionI1Prompt(context);
    
    // 2. Call API route (server-side, NOT direct service call)
    const response = await fetch('/api/project-llm/generate-i1', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        context: {
          domainName,
          subjectName,
          topicName,
          subtopicName,
          navigationNodeName,
        },
      }),
    });
    
    const result = await response.json();
    
    // 3. Handle result
    if (result.success) {
      // Populate JSON editor with candidate
      setJsonEditorContent(JSON.stringify(result.candidate, null, 2));
      setProvenance(result.provenance);
    } else {
      // Show error
      showError(result.error);
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Network error');
  } finally {
    setLoading(false);
  }
}
```

### 9.3 Loading State

- Show spinner while generating
- Disable button during generation
- Timeout after 30 seconds

### 9.3 Error Handling

- Display provider errors to user
- Allow retry
- Fallback to manual copy-paste workflow

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests

**Provider Abstraction:**
- Test TestProvider returns valid fixture
- Test provider error handling
- Test ProviderError types

**ProjectLLMService:**
- Test successful generation flow
- Test JSON parsing errors
- Test validation failures
- Test provenance tracking

**Test Files:**
```
apps/skillhubcore-admin/src/lib/project-llm/__tests__/
  ├─ TestProvider.test.ts
  ├─ ProjectLLMService.test.ts
  └─ provenance.test.ts
```

### 10.2 Integration Tests

**Generation Flow:**
- Test full flow: prompt → provider → validation → candidate
- Test error paths (provider failure, invalid JSON, schema violation)
- Test timeout handling

**Metadata Population:**
- Test tutorialSaveService populates AI metadata
- Test generationJobId correlation

**Test Files:**
```
apps/skillhubcore-admin/src/lib/project-llm/__tests__/integration/
  └─ generation-flow.test.ts
```

### 10.3 E2E Tests

**Complete User Journey (Approval Path):**
1. User selects hierarchy
2. User clicks "Generate with AI"
3. Candidate appears in editor
4. User reviews candidate
5. User adds to document
6. User saves
7. Verify AI metadata in database
8. Verify runtime renders correctly

**Complete User Journey (Rejection Path):**
1. User selects hierarchy
2. User clicks "Generate with AI"
3. Candidate appears in editor
4. User reviews candidate
5. User rejects/discards candidate (clears editor or navigates away)
6. **Verify NO database write occurred**
7. **Verify NO tutorial_sections record created**
8. **Verify generationJobId not persisted**

**Test File:**
```
tests/e2e/project-llm-introduction-i1-generation.spec.ts
  ├─ test: complete flow with approval
  ├─ test: complete flow with rejection (NO database write)
  └─ test: complete flow with error handling
```

---

## 11. ERROR HANDLING & RESILIENCE

### 11.1 Provider Errors

| Error Type | Handling |
|---|---|
| **Timeout** | Display error, allow retry, suggest manual workflow |
| **Rate Limit** | Display error with retry-after time, queue support (Phase 2) |
| **Authentication** | Log error, alert admin, block generation until fixed |
| **Invalid Request** | Display error, log for debugging |
| **Network Error** | Display error, allow retry |

### 11.2 Validation Errors

| Error Type | Handling |
|---|---|
| **JSON Parse Error** | Display error, show raw response (truncated), allow manual fix |
| **Schema Violation** | Display specific field errors, allow manual fix in editor |
| **Icon Not in Registry** | Display error, list approved icons, allow manual fix |

### 11.3 Graceful Degradation

**If Project LLM unavailable:**
- Fall back to existing manual copy-paste workflow
- Show message: "AI generation temporarily unavailable, use manual workflow"
- Do NOT block Composer functionality

---

## 12. OBSERVABILITY & MONITORING

### 12.1 Logging

**Log Events:**
- Generation request initiated
- Provider call started
- Provider response received
- Validation result
- Candidate presented to user
- Human approval/rejection
- Metadata persisted

**Log Format:**
```typescript
{
  event: 'project-llm.generation.request',
  requestId: '<uuid>',
  provider: 'test-mock',
  context: { domain, subject, topic, subtopic, navigationNode },
  timestamp: '<iso-date>',
}
```

### 12.2 Metrics (Phase 2)

**Recommended metrics:**
- `project_llm.generation.count` — Total generations
- `project_llm.generation.latency` — Time to generate
- `project_llm.generation.success_rate` — Success vs errors
- `project_llm.validation.failure_rate` — Schema violations
- `project_llm.approval.rate` — Human approval vs rejection
- `project_llm.provider.errors` — Provider-specific errors

---

## 13. IMPLEMENTATION SEQUENCE

### Phase 1: Foundation (Week 1)

1. ✅ Create directory structure
   - `apps/skillhubcore-admin/src/lib/project-llm/`
   - `providers/`, `__tests__/`, `fixtures/`

2. ✅ Define provider abstraction interface
   - `ProjectLLMProvider.ts`
   - `GenerationRequest`, `GenerationResponse`
   - `ProviderError`, `ProviderErrorCode`

3. ✅ Implement TestProvider
   - Returns mock Introduction I1 fixture
   - Simulates realistic latency

4. ✅ Create mock fixture
   - `fixtures/introduction-i1.fixture.ts`
   - Valid Introduction I1 JSON

5. ✅ Unit tests for provider abstraction
   - TestProvider tests
   - ProviderError tests

### Phase 2: Service Layer (Week 2)

6. ✅ Implement ProjectLLMService
   - `generateI1()` method
   - JSON parsing
   - Validation integration
   - Provenance tracking

7. ✅ Service initialization
   - `createProjectLLMService()`
   - Environment-based provider selection

8. ✅ Unit tests for service
   - Successful generation
   - Error handling
   - Provenance correctness

9. ✅ Integration tests
   - Full generation flow
   - Error paths

### Phase 3: UI Integration (Week 2-3)

10. ✅ Add "Generate with AI" button
    - Modify `AiInstructionContainer.tsx`
    - Wire to ProjectLLMService

11. ✅ Loading state UI
    - Spinner, disabled button, timeout

12. ✅ Error display UI
    - User-friendly error messages
    - Retry mechanism

13. ✅ Candidate display
    - Populate JSON editor
    - Preserve provenance in state

### Phase 4: Metadata & Persistence (Week 3)

14. ✅ Extend tutorialSaveService
    - Detect AI-generated blocks
    - Populate AI metadata fields
    - Include provenance

15. ✅ Integration tests for metadata
    - Verify database writes
    - Verify generationJobId correlation

### Phase 5: E2E & Verification (Week 3-4)

16. ✅ E2E test for complete flow
    - User journey from selection to save
    - Verify runtime delivery

17. ✅ Manual verification
    - Test with real Composer
    - Verify all UI states
    - Verify database state

18. ✅ Evidence collection
    - Screenshots of each step
    - Database state verification
    - Log correlation

### Phase 6: Documentation & Handoff (Week 4)

19. ✅ Implementation documentation
    - How to use "Generate with AI"
    - Troubleshooting guide
    - Known limitations

20. ✅ Developer documentation
    - Provider abstraction guide
    - How to add new providers
    - Testing guide

21. ✅ Certification evidence
    - Test results
    - Coverage metrics
    - Manual verification report

---

## 14. ACCEPTANCE CRITERIA

### 14.1 Functional Requirements

| Requirement | Acceptance Criteria |
|---|---|
| **Provider Abstraction** | TestProvider returns valid I1 fixture; RealProvider placeholder exists |
| **Generation Service** | generateI1() parses JSON, validates schema, returns candidate + provenance |
| **UI Integration** | "Generate with AI" button triggers generation, displays candidate in editor |
| **Human Approval** | Existing Composer review workflow works with AI-generated candidates |
| **Metadata Population** | generatedByAi, aiModelUsed, generationJobId written on save |
| **Error Handling** | Provider errors, JSON parse errors, validation errors handled gracefully |
| **Transient Candidate** | Approved candidate persists; rejected candidate leaves no database trace |

### 14.2 Non-Functional Requirements

| Requirement | Acceptance Criteria |
|---|---|
| **Performance** | Generation completes in <30 seconds (TestProvider: <2 seconds) |
| **Resilience** | Provider timeout handled gracefully, fallback to manual workflow |
| **Security - Authorization** | TUTORIAL_AUTHOR_CREATE enforced server-side in API route; client cannot bypass |
| **Security - Secrets** | Provider API keys remain server-side; bundle analysis confirms no secrets in client code |
| **Security - Authentication** | JWT authentication enforced at API route; unauthenticated requests rejected |
| **Security - Input Validation** | Prompt and context validated; malicious input rejected |
| **Observability** | All generation events logged with requestId correlation |
| **Testability** | >80% code coverage for Project LLM module |

### 14.3 Evidence Requirements

| Evidence | Required Artifacts |
|---|---|
| **Unit Tests** | Test suite passes, coverage >80% |
| **Integration Tests** | Generation flow end-to-end passes |
| **E2E Test** | Complete user journey passes (approval AND rejection paths) |
| **Manual Verification** | Screenshots of each UI state, database state verification |
| **Log Correlation** | requestId traceable through logs |
| **Security Verification** | Bundle analysis report (no secrets in client); authorization test (API rejects unauthorized) |

---

## 15. RISKS & MITIGATIONS

### 15.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **TestProvider insufficient for validation** | Low | Medium | Create multiple test fixtures covering edge cases |
| **JSON parsing brittle** | Medium | High | Robust error handling, show raw response on failure |
| **Validation too strict** | Medium | Medium | Schema healing (Phase 2), manual edit in Composer |
| **UI state management complex** | Low | Medium | Use established React patterns, integration tests |

### 15.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Provider unavailable** | Medium (Phase 2) | Medium | Graceful degradation to manual workflow |
| **Generation too slow** | Low | Medium | 30-second timeout, async patterns (Phase 2) |
| **Metadata not populated** | Low | High | Integration tests verify database writes |

---

## 16. OUT OF SCOPE (PHASE 2+)

**Explicitly deferred to separate decision AFTER contract approval:**

- ❌ Real LLM provider selection (OpenAI, Anthropic, Gemini, or other)
- ❌ Real LLM provider SDK integration
- ❌ Provider API key configuration

**Note:** RealProvider implementation is a placeholder during Phase 1B. TestProvider is the functional provider for proving the vertical slice. Real provider selection and integration is a separate approval gate AFTER implementation contract is locked and BEFORE production deployment.

**Explicitly deferred to Phase 2+:**

- ❌ I2-I6 block implementations
- ❌ Quality scoring mechanisms
- ❌ Hallucination detection
- ❌ Automatic publication
- ❌ Multi-block generation
- ❌ Schema healing (auto-fix JSON errors)
- ❌ Regeneration UI (retry with modifications)
- ❌ Version history for candidates
- ❌ A/B testing for candidates
- ❌ Async generation (job queue)
- ❌ Rate limiting
- ❌ Cost tracking
- ❌ Internationalization

---

## 17. DEPENDENCIES

### 17.1 Existing Components (Reuse)

- ✅ `TutorialPromptContext` (apps/skillhubcore-admin)
- ✅ `getIntroductionI1Prompt()` (apps/skillhubcore-admin)
- ✅ `validateIntroductionI1AIOutput()` (packages/types)
- ✅ `IntroductionI1AuthorContentSchema` (packages/types)
- ✅ `IntroductionI1BlockSchema` (packages/types)
- ✅ `TutorialDocumentSchema` (packages/types)
- ✅ `tutorialSaveService` (apps/skillhubcore-admin)
- ✅ `tutorial_sections` schema (packages/db-tutorial)
- ✅ Composer UI (apps/skillhubcore-admin)

### 17.2 New Dependencies

- ⚠️ None for Phase 1B (TestProvider has no external deps)
- ⚠️ Real provider SDK (Phase 2, after provider selection)

---

## 18. APPROVAL & SIGN-OFF

### 18.1 Contract Approval

**This implementation contract must be approved before any production code is written.**

**Approval Checklist:**

- [ ] Architecture boundary correct (Node/TypeScript in Composer)
- [ ] Provider abstraction vendor-neutral
- [ ] Candidate lifecycle transient (no persistence)
- [ ] generationJobId semantics correct (provenance ID)
- [ ] Validation reuses existing schemas
- [ ] Authorization reuses existing permissions
- [ ] Human approval workflow reuses existing Composer
- [ ] Scope limited to I1 only
- [ ] Out-of-scope items deferred to Phase 2
- [ ] Acceptance criteria clear
- [ ] Risks identified and mitigated
- [ ] Implementation sequence realistic

**Approved By:** _____________

**Date:** _____________

### 18.2 Post-Approval Actions

**After approval:**
1. Begin implementation (Phase 1: Foundation)
2. Daily stand-ups to track progress
3. Weekly evidence collection
4. Gate reviews at each phase
5. Final certification at Phase 6 completion

**Before production deployment:**
- All acceptance criteria met
- All tests passing
- Evidence artifacts collected
- Manual verification complete
- Human Architecture Authority final review

---

## DOCUMENT STATUS

**Contract Status:** 🟢 READY FOR APPROVAL — CORRECTIONS APPLIED  
**Architecture Decision:** ✅ APPROVED (Option B)  
**Implementation:** ⏸️ BLOCKED until Human Architecture Authority approval  
**Production Code:** UNCHANGED  

**Next Action:** Submit for Human Architecture Authority final approval.

---

## CORRECTIONS APPLIED

**All 8 corrections from forensic review have been applied:**

✅ **Critical #1:** Added API route specification (Section 9.1); client calls API, not service directly  
✅ **Critical #2:** Added provider secrets specification (Section 2.4); environment variables, server-only  
✅ **Important #3:** Corrected aiModelUsed to store model identifier (Sections 3.1, 7.2, 7.3)  
✅ **Important #4:** Clarified server-side authorization enforcement (Section 8.1)  
✅ **Important #5:** Added rejection path E2E test (Section 10.3, 14.1)  
✅ **Important #6:** Added explicit security acceptance criteria (Sections 14.2, 14.3)  
✅ **Minor #7:** Added ILS terminology definition (Section 1.1)  
✅ **Minor #8:** Clarified provider decision timing (Section 16)  
✅ **Updated:** Architecture diagram with correct client/server boundary (Section 1.2)

