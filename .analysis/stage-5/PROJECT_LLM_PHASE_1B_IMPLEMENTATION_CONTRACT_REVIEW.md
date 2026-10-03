# PROJECT LLM PHASE 1B — IMPLEMENTATION CONTRACT REVIEW

**Document Type:** Forensic Contract Review  
**Phase:** Project LLM Phase 1B Step 3 Review  
**Date:** 2026-10-03  
**Status:** REVIEW COMPLETE — CORRECTIONS IDENTIFIED  
**Production Code Changes:** NONE  
**Repository State:** UNCHANGED  

---

## EXECUTIVE SUMMARY

### Review Purpose

The Implementation Contract (`PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md`) contains the locked specification for Project LLM Phase 1B. Before Human Architecture Authority approval, this review identifies architectural ambiguities that must be corrected to ensure the contract is genuinely **lockable**.

### Review Scope

**Forensic analysis of:**
1. Client/server boundary correctness
2. Provider secrets security
3. AI metadata naming precision
4. Authorization enforcement points
5. Security acceptance criteria
6. Transient candidate guarantees

**NOT a new investigation** — forensic review only.

### Review Outcome

**Status:** ✅ REVIEW COMPLETE

**Findings:** 8 corrections required before contract lock

**Severity:**
- 🔴 **CRITICAL:** 2 items (client/server boundary, provider secrets)
- 🟡 **IMPORTANT:** 4 items (metadata naming, authorization, E2E criteria, security criteria)
- 🟢 **MINOR:** 2 items (terminology consistency, out-of-scope clarification)

---

## 1. CLIENT/SERVER BOUNDARY (🔴 CRITICAL)

### 1.1 Current Contract Statement

**Section 9.1 (UI Integration):**

```typescript
async function handleGenerateWithAI() {
  // ...
  
  // 2. Call Project LLM service
  const result = await projectLLMService.generateI1({
    prompt,
    context: { ... },
  });
  
  // ...
}
```

### 1.2 Problem

**This implies direct client-side call to ProjectLLMService.**

**Issues:**
- ❌ Exposes server-side logic to browser
- ❌ Provider credentials would be client-accessible
- ❌ No server-side authorization enforcement
- ❌ Violates Next.js security model

### 1.3 Evidence from Existing Architecture

**Composer follows Next.js App Router server/client pattern:**

**Client Component:** `AiInstructionContainer.tsx`
- Marked `'use client'`
- Runs in browser
- NO server-side logic

**Server API Route:** `/api/tutorial-composer/sections/route.ts`
- Runs on server only
- Enforces authentication (`authenticateRequest`)
- Enforces authorization (`requireSubtopicAccess`, `requireBrandAccess`)
- Access to database and secrets

**Correct Pattern:**
```
Client Component (browser)
      ↓ fetch()
Server API Route
      ↓
Service Layer (server-only)
```

### 1.4 Required Correction

**Contract must specify:**

1. **New API Route:** `POST /api/project-llm/generate-i1`
   - Server-side authentication
   - Server-side authorization
   - Calls `ProjectLLMService` (server-only)
   - Returns candidate JSON

2. **Client Component:** `AiInstructionContainer.tsx`
   - Calls API route via `fetch()`
   - NO direct service access

3. **Service Layer:** `ProjectLLMService`
   - Server-only module (not imported by client)
   - Provider credentials server-only
   - Secrets in environment variables

**Updated Architecture:**

```typescript
// CLIENT COMPONENT (browser)
async function handleGenerateWithAI() {
  const response = await fetch('/api/project-llm/generate-i1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      context: { domainName, subjectName, ... },
    }),
  });
  
  const result = await response.json();
  // Handle result
}

// SERVER API ROUTE (server-only)
export async function POST(request: NextRequest) {
  // 1. Authenticate
  const authResult = await authenticateRequest(request);
  if ('type' in authResult) {
    return createAuthErrorResponse(authResult);
  }
  
  // 2. Authorize (TUTORIAL_AUTHOR_CREATE)
  const authError = requireTutorialAuthorCreatePermission(authResult.user);
  if (authError) {
    return createAuthErrorResponse(authError);
  }
  
  // 3. Parse request
  const { prompt, context } = await request.json();
  
  // 4. Call service (server-only)
  const result = await projectLLMService.generateI1({ prompt, context });
  
  // 5. Return result
  return NextResponse.json(result);
}
```

**Contract Section to Add:**

```markdown
### 9.X API Route Specification

**File:** `apps/skillhubcore-admin/src/app/api/project-llm/generate-i1/route.ts`

**Method:** POST

**Authentication:** Required (JWT session)

**Authorization:** TUTORIAL_AUTHOR_CREATE permission

**Request Body:**
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

**Response (Success 200):**
{
  "success": true,
  "candidate": { ... IntroductionI1AuthorContent },
  "provenance": {
    "provider": "string",
    "model": "string | null",
    "timestamp": "ISO-8601 date",
    "requestId": "uuid",
    "usage": { ... } | null
  }
}

**Response (Error 400/401/403/422/500):**
{
  "success": false,
  "error": "string",
  "provenance": {
    "provider": "string",
    "timestamp": "ISO-8601 date",
    "requestId": "uuid"
  }
}

**Security:**
- Server-side authentication enforcement
- Server-side authorization enforcement
- Provider credentials never exposed to client
- Service layer server-only (not imported by client components)
```

---

## 2. PROVIDER SECRETS SECURITY (🔴 CRITICAL)

### 2.1 Current Contract Statement

**Section 3.2 (Service Initialization):**

```typescript
export function createProjectLLMService(): ProjectLLMService {
  const useTestProvider = process.env.NODE_ENV === 'development' 
    || process.env.PROJECT_LLM_USE_TEST_PROVIDER === 'true';
  
  const provider = useTestProvider 
    ? new TestProvider()
    : new RealProvider();
  
  return new ProjectLLMService(provider);
}
```

### 2.2 Problem

**No explicit security requirement for provider credentials.**

**Missing:**
- Where are provider API keys stored?
- How are they accessed?
- Are they server-only?
- How is RealProvider configured?

### 2.3 Required Correction

**Contract must specify:**

**Section 2.4 (Real Provider Configuration):**

```typescript
/**
 * Real LLM provider implementation
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
 * Provider selection decision deferred to separate approval.
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
    // Provider-specific SDK call using this.apiKey
    throw new Error('RealProvider not yet implemented - provider selection pending');
  }
}
```

**Security Acceptance Criteria (Section 14.2):**

Add explicit criterion:

```markdown
| **Provider Secrets** | API keys remain server-side, never exposed to client, verified by bundle analysis |
```

---

## 3. AI METADATA NAMING (🟡 IMPORTANT)

### 3.1 Current Contract Statement

**Section 7.2 (AI Metadata Population):**

```typescript
{
  generatedByAi: true,
  aiModelUsed: 'test-mock',  // Provider name (vendor-neutral)
  generationJobId: '<uuid>',
  // ...
}
```

And Section 7.3:

```typescript
if (blockWasGeneratedByAI) {
  metadata = {
    generatedByAi: true,
    aiModelUsed: provenance.provider,  // ← PROBLEM
    generationJobId: provenance.requestId,
  };
}
```

### 3.2 Problem

**Field naming is misleading:**

- `aiModelUsed` should contain model identifier (e.g., "gpt-4", "claude-3-opus")
- Contract assigns `provenance.provider` (e.g., "test-mock", "production-provider-a")
- Provider name ≠ Model identifier

**Correct semantics:**
- **Provider:** Service/abstraction layer ("test-mock", "openai-provider")
- **Model:** Actual LLM model ("gpt-4-turbo", "claude-3-5-sonnet")

### 3.3 Evidence from Existing Schema

**File:** `packages/db-tutorial/src/schema/tutorial-sections.ts`

```typescript
aiModelUsed: text('ai_model_used'),  // "ai_model_used" not "ai_provider_used"
```

**Field is named `aiModelUsed`**, implying model identifier, not provider name.

### 3.4 Required Correction

**Update Section 7.2:**

```typescript
// tutorial_sections table
{
  generatedByAi: true,
  aiModelUsed: 'claude-3-5-sonnet',      // ⭐ Model identifier (from provenance.model)
  generationJobId: '<uuid>',              // Request ID (provenance.requestId)
  // ...
}
```

**Update Section 7.3:**

```typescript
if (blockWasGeneratedByAI) {
  metadata = {
    generatedByAi: true,
    aiModelUsed: provenance.model || provenance.provider,  // Model if available, else provider
    generationJobId: provenance.requestId,
  };
}
```

**Update Section 3.1 (GenerationProvenance):**

```typescript
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
```

**Clarification:**
- **TestProvider** returns `model: "test-mock-model"`
- **RealProvider** returns actual model (e.g., `model: "gpt-4-turbo"`)
- **aiModelUsed** field stores model, not provider

---

## 4. AUTHORIZATION ENFORCEMENT (🟡 IMPORTANT)

### 4.1 Current Contract Statement

**Section 8.1 (Permission Reuse):**

```typescript
// Existing check at Composer UI level
requireTutorialAuthorCreatePermission(user);
```

### 4.2 Problem

**"UI level" is ambiguous.**

**Issues:**
- Where exactly is this check enforced?
- Is it server-side or client-side?
- Can client bypass check?

### 4.3 Evidence from Existing Architecture

**Server API Route enforces authorization:**

**File:** `/api/tutorial-composer/sections/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Step 1: Authenticate
  const authResult = await authenticateRequest(request);
  if ('type' in authResult) {
    return createAuthErrorResponse(authResult);
  }
  
  // Step 4: Authorize subtopic access (server-side)
  const subtopicAuthError = requireSubtopicAccess(user, requestData.subtopicId);
  if (subtopicAuthError) {
    return createAuthErrorResponse(subtopicAuthError);
  }
  
  // ...
}
```

**Authorization is SERVER-SIDE**, not UI-level.

### 4.4 Required Correction

**Update Section 8.1:**

```markdown
### 8.1 Permission Enforcement

**Decision:** Reuse existing `TUTORIAL_AUTHOR_CREATE` permission

**Rationale:**
- Human initiates generation = same security boundary as manual authoring
- Same permission scope
- No new permission needed for Phase 1B

**Enforcement Point:** SERVER-SIDE in API route

**File:** `apps/skillhubcore-admin/src/app/api/project-llm/generate-i1/route.ts`

**Implementation:**

\`\`\`typescript
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
\`\`\`

**Client-Side UI:** May optionally hide "Generate with AI" button if user lacks permission, but SERVER-SIDE enforcement is authoritative.

**Roles Granted:** `admin`, `super_admin`
```

---

## 5. E2E ACCEPTANCE CRITERIA (🟡 IMPORTANT)

### 5.1 Current Contract Statement

**Section 10.3 (E2E Tests):**

```markdown
**Complete User Journey:**
1. User selects hierarchy
2. User clicks "Generate with AI"
3. Candidate appears in editor
4. User reviews candidate
5. User adds to document
6. User saves
7. Verify AI metadata in database
8. Verify runtime renders correctly
```

### 5.2 Problem

**Missing critical rejection test:**

The transient candidate model (Section 4) states:
> "Rejection discards candidate (no database write)"

**E2E must prove this guarantee.**

### 5.3 Required Correction

**Add to Section 10.3:**

```markdown
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
\`\`\`
tests/e2e/project-llm-introduction-i1-generation.spec.ts
  ├─ test: complete flow with approval
  ├─ test: complete flow with rejection (NO database write)
  └─ test: complete flow with error handling
\`\`\`
```

**Add to Section 14.1 (Acceptance Criteria):**

```markdown
| **Transient Candidate** | Approved candidate persists; rejected candidate leaves no database trace |
```

---

## 6. SECURITY ACCEPTANCE CRITERIA (🟡 IMPORTANT)

### 6.1 Current Contract Statement

**Section 14.2 (Non-Functional Requirements):**

```markdown
| **Security** | Reuses existing TUTORIAL_AUTHOR_CREATE permission |
```

### 6.2 Problem

**Too vague. Missing explicit security criteria:**

- Provider secrets security
- Server-side enforcement
- Client bundle verification

### 6.3 Required Correction

**Update Section 14.2:**

```markdown
| Requirement | Acceptance Criteria |
|---|---|
| **Security - Authorization** | TUTORIAL_AUTHOR_CREATE enforced server-side in API route; client cannot bypass |
| **Security - Secrets** | Provider API keys remain server-side; bundle analysis confirms no secrets in client code |
| **Security - Authentication** | JWT authentication enforced at API route; unauthenticated requests rejected |
| **Security - Input Validation** | Prompt and context validated; malicious input rejected |
```

**Add to Section 14.3 (Evidence Requirements):**

```markdown
| Evidence | Required Artifacts |
|---|---|
| **Security Verification** | Bundle analysis report (no secrets in client); authorization test (API rejects unauthorized) |
```

---

## 7. TERMINOLOGY CONSISTENCY (🟢 MINOR)

### 7.1 Current Contract Statement

**Section 1.1 references:**

- "UBRC" (Unique Block Runtime Contract)
- "LSNB" (Lesson-Scoped Navigation Boundary)
- "RSSB" (Runtime State Synchronization Boundary)
- "ILS" (not expanded)

### 7.2 Problem

**ILS not defined in Implementation Contract.**

From earlier documents:
- **ILS** = In-Lesson System (progress tracking and state management)

### 7.3 Required Correction

**Add to Section 1.1 (after table):**

```markdown
**Terminology:**
- **UBRC** = Unique Block Runtime Contract
- **LSNB** = Lesson-Scoped Navigation Boundary
- **RSSB** = Runtime State Synchronization Boundary
- **ILS** = In-Lesson System (progress tracking and state management)
```

---

## 8. OUT-OF-SCOPE CLARIFICATION (🟢 MINOR)

### 8.1 Current Contract Statement

**Section 16 (Out of Scope):**

```markdown
- ❌ Real LLM provider integration (separate decision)
```

### 8.2 Problem

**Ambiguous phrasing could be misinterpreted:**

Does "separate decision" mean:
- Phase 2+? (deferred indefinitely)
- OR after this contract? (immediate next step)

### 8.3 Required Correction

**Update Section 16:**

```markdown
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
```

---

## 9. SUMMARY OF REQUIRED CORRECTIONS

### 9.1 Critical Corrections (Must Fix Before Lock)

| # | Section | Issue | Correction |
|---|---|---|---|
| **1** | 9.1 (UI Integration) | Client/server boundary incorrect | Add API route specification; client calls API, not service directly |
| **2** | 2.4, 3.2 (Provider) | Provider secrets not secured | Add environment variable specification; explicit security requirements |

### 9.2 Important Corrections (Should Fix Before Lock)

| # | Section | Issue | Correction |
|---|---|---|---|
| **3** | 7.2, 7.3 (Metadata) | aiModelUsed naming misleading | Store model identifier, not provider name |
| **4** | 8.1 (Authorization) | Enforcement point ambiguous | Clarify server-side API route enforcement |
| **5** | 10.3 (E2E) | Missing rejection test | Add rejection path: verify NO database write |
| **6** | 14.2, 14.3 (Security) | Security criteria too vague | Add explicit security acceptance criteria |

### 9.3 Minor Corrections (Good to Fix)

| # | Section | Issue | Correction |
|---|---|---|---|
| **7** | 1.1 (Terminology) | ILS not defined | Add ILS = In-Lesson System definition |
| **8** | 16 (Out of Scope) | Provider decision timing unclear | Clarify: provider selection separate gate AFTER contract |

---

## 10. CORRECTED ARCHITECTURE DIAGRAM

**Update Section 1.2 with correct client/server boundary:**

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT COMPONENT (Browser)                                  │
│                                                             │
│ AiInstructionContainer.tsx                                 │
│   ├─ User clicks "Generate with AI"                        │
│   ├─ Calls fetch('/api/project-llm/generate-i1')          │
│   └─ Displays candidate in JSON editor                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ SERVER API ROUTE (Server Only)                             │
│                                                             │
│ /api/project-llm/generate-i1/route.ts                      │
│   ├─ authenticateRequest() ← JWT validation               │
│   ├─ requireTutorialAuthorCreatePermission()              │
│   ├─ Parse request (prompt, context)                       │
│   ├─ Call ProjectLLMService.generateI1()                  │
│   └─ Return { success, candidate, provenance }             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ SERVICE LAYER (Server Only)                                │
│                                                             │
│ ProjectLLMService                                          │
│   ├─ Provider abstraction (TestProvider | RealProvider)   │
│   ├─ Provider.generate(prompt)                            │
│   ├─ JSON.parse(response.text)                            │
│   ├─ validateIntroductionI1AIOutput()                     │
│   └─ Return candidate + provenance                         │
│                                                             │
│ Provider Secrets (Server Only)                             │
│   └─ process.env.PROJECT_LLM_API_KEY (never exposed)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        ↓
Candidate returned to client
        ↓
Human review in Composer
        ↓
Existing save pipeline (REUSE)
```

---

## 11. IMPLEMENTATION CONTRACT CORRECTION CHECKLIST

**Before Human Architecture Authority approval:**

- [ ] **Critical #1:** Add API route specification (Section 9.X)
- [ ] **Critical #1:** Update UI Integration to call API route (Section 9.1)
- [ ] **Critical #2:** Add provider secrets specification (Section 2.4)
- [ ] **Critical #2:** Add security acceptance criterion for secrets (Section 14.2)
- [ ] **Important #3:** Correct aiModelUsed to store model, not provider (Sections 7.2, 7.3)
- [ ] **Important #3:** Update provenance interface clarification (Section 3.1)
- [ ] **Important #4:** Clarify server-side authorization enforcement (Section 8.1)
- [ ] **Important #5:** Add rejection path E2E test (Section 10.3)
- [ ] **Important #5:** Add transient candidate acceptance criterion (Section 14.1)
- [ ] **Important #6:** Add explicit security acceptance criteria (Section 14.2)
- [ ] **Important #6:** Add security evidence requirement (Section 14.3)
- [ ] **Minor #7:** Add ILS terminology definition (Section 1.1)
- [ ] **Minor #8:** Clarify provider decision timing (Section 16)
- [ ] **Update:** Architecture diagram with correct client/server boundary (Section 1.2)

---

## DOCUMENT STATUS

**Review Status:** ✅ COMPLETE  
**Corrections Required:** 8 items (2 critical, 4 important, 2 minor)  
**Implementation Contract:** ⏸️ BLOCKED until corrections applied  
**Production Code:** UNCHANGED  

**Next Action:** Apply corrections to `PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md`, then submit for Human Architecture Authority final approval.

