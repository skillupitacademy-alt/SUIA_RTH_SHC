# QUESTION BANK LLM REFERENCE ARCHITECTURE INVESTIGATION

**Document Type:** READ-ONLY Forensic Investigation  
**Phase:** Project LLM Phase 1B — Technology/Service Boundary Decision  
**Date:** 2026-10-03  
**Status:** INVESTIGATION COMPLETE  
**Production Code Changes:** NONE  
**Repository State:** UNCHANGED  

---

## EXECUTIVE SUMMARY

### Critical Finding

**The "Question Bank LLM" system does NOT exist as a Python/FastAPI generation service.**

**Current State:**
- Question Factory uses **IDENTICAL manual copy-paste workflow** as Tutorial I1
- Human copies prompt → External AI (ChatGPT/Claude) → Human pastes JSON → Validation
- **NO automated LLM provider integration**
- **NO Python/FastAPI generation service**

**Only Python Service Found:**
- `apps/question-judge` — Duplicate detection service (cross-encoder, NOT generation)
- Uses FastAPI, but for **duplicate judgment**, not question generation

### Impact on Project LLM Technology Decision

**Original Assumption (Phase 1B Step 1 reconciliation):**
> "There exists a production Python/FastAPI Question Bank LLM that could serve as reference architecture"

**Actual Reality:**
> Question Bank uses the SAME manual workflow as Tutorial I1. No automated generation exists.

**Conclusion:**
- **NO Python/FastAPI LLM generation reference** to compare against
- **NO existing provider integration patterns** to reuse
- **NO deployment infrastructure** for LLM generation service
- Phase 1B Step 1's dismissal of Python/FastAPI was **correct** (no reference exists)
- But recommendation of Node/TypeScript in Composer should be re-evaluated on its own merits

---

## 1. INVESTIGATION SCOPE

**Original Question:**
> Does the existing Question Bank LLM provide a sufficiently reusable LLM infrastructure foundation for Project LLM?

**Finding:**
> There is NO Question Bank LLM infrastructure. The Question Factory is a manual prompt/copy-paste system identical to Tutorial I1.

---

## 2. QUESTION FACTORY LOCATION & STRUCTURE

### 2.1 Location

**Primary Implementation:** `apps/skillhubcore-admin/src/lib/factory/`

**Key Files:**
| File | Purpose |
|---|---|
| `prompt-service.ts` | Generates prompts for external AI (copy-paste workflow) |
| `json-validator.ts` | Validates JSON pasted back by human |
| `apps/skillhubcore-admin/src/types/factory.ts` | TypeScript types for GeneratedQuestion |
| `apps/realtutorialhub-admin/src/lib/factory/prompt-service.ts` | Duplicate implementation (different admin app) |

### 2.2 Architecture Discovery

**Workflow:**
```
QUESTION FACTORY (Current State)
  ↓
1. Human selects taxonomy context (Domain/Subject/Topic/Subtopic)
  ↓
2. Human specifies difficulty distribution (simple/intermediate/expert)
  ↓
3. Human optionally provides source code/material
  ↓
4. PromptService.generateTechnicalPrompt() → formatted prompt string
  ↓
5. Prompt displayed in UI (collapsible panel)
  ↓
6. **HUMAN COPIES PROMPT** → ChatGPT/Claude/Gemini (manually)
  ↓
7. **EXTERNAL AI RETURNS JSON** (outside system)
  ↓
8. **HUMAN PASTES JSON** back into Factory UI
  ↓
9. JsonValidator.validateBatch() → validation + schema healing
  ↓
10. POST /api/factory/save → persists questions to database
```

**This is IDENTICAL to Tutorial I1 manual workflow.**

---

## 3. TECHNOLOGY STACK ANALYSIS

### 3.1 Question Factory Stack

**Technology:** Node/TypeScript (Next.js application)

**Components:**
- ✅ Prompt generation: TypeScript functions
- ✅ JSON validation: TypeScript + Zod-like validation
- ✅ Schema healing: TypeScript repair logic
- ❌ LLM provider integration: **NONE**
- ❌ Automated generation: **NONE**
- ❌ Provider abstraction: **NONE**

### 3.2 question-judge Stack

**Location:** `apps/question-judge/`

**Technology:** Python + FastAPI

**Purpose:** **Duplicate detection ONLY** (NOT generation)

**Components:**
- `app/main.py` — FastAPI application
- `app/judge.py` — Duplicate judgment logic
- `app/model.py` — Cross-encoder model (ms-marco-MiniLM-L-6-v2)
- `app/preprocessing.py` — Text normalization
- `app/schemas.py` — Pydantic request/response models

**Key Finding:** This service does **NOT generate questions**. It only judges whether two questions are duplicates.

---

## 4. PROVIDER INTEGRATION ARCHITECTURE

**Finding:** **NONE EXISTS**

**Question Factory does NOT integrate with:**
- ❌ OpenAI API
- ❌ Anthropic API
- ❌ Google Gemini API
- ❌ Any LLM provider

**Integration Pattern:** Human acts as integration layer (manual copy-paste)

---

## 5. REQUEST/RESPONSE FLOW

### 5.1 Question Factory Flow

```typescript
// Prompt generation (TypeScript)
const prompt = PromptService.generateTechnicalPrompt({
  sourceCode: "...",
  counts: { simple: 3, intermediate: 5, expert: 2 },
  context: { domainName, subjectName, topicName, subtopicName },
  knownSkills: ["skill1", "skill2"],
  strictMode: true
});

// Prompt displayed in UI
// → Human copies → External AI → Human pastes JSON

// Validation (TypeScript)
const result = JsonValidator.validateBatch(pastedJsonString);
// → { isValid, errors, questions, healingReport }
```

**No provider calls. No async generation. No automation.**

### 5.2 question-judge Flow (Duplicate Detection Only)

```typescript
// POST /judge/question
{
  "existing": { text, type, concept_key, objective_key, code },
  "candidate": { text, type, concept_key, objective_key, code }
}

// Response
{
  "duplicate": boolean,
  "confidence": number,
  "reason": string,
  "signals": { ... }
}
```

**This is NOT a generation service.**

---

## 6. TYPESCRIPT ↔ PYTHON INTEGRATION

### 6.1 question-judge Integration

**Pattern:** REST API (TypeScript → Python FastAPI)

**Client:** `apps/api-server/src/modules/intelligence/question-judge.client.ts`

```typescript
export async function judgeQuestion(payload: JudgmentRequest): Promise<JudgmentResponse> {
  const response = await fetch(`${QUESTION_JUDGE_URL}/judge/question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SHARED_SECRET}`
    },
    body: JSON.stringify(payload)
  });
  
  return response.json();
}
```

**Pattern:** Standard HTTP/JSON REST API

**Authentication:** Shared secret token (Bearer auth)

**Degradation:** Falls back gracefully if service unavailable

### 6.2 Question Factory Integration

**Finding:** **NO TypeScript ↔ Python integration** (no Python generation service exists)

---

## 7. PROMPT MANAGEMENT

### 7.1 Question Factory Prompts

**Structure:** Template strings with interpolation

**File:** `apps/skillhubcore-admin/src/lib/factory/prompt-service.ts`

**Key Functions:**
- `generateTechnicalPrompt(blueprint)` — MCQ question generation
- `generateAssignmentPrompt(blueprint)` — Practice assignment generation
- `generateContentPrompt(blueprint)` — Tutorial content generation

**Prompt Components:**
1. **Role Assignment** - "ACT AS A SENIOR TECHNICAL EXAMINER"
2. **Context** - Domain/Subject/Topic/Subtopic hierarchy
3. **Requirements** - Difficulty distribution, metadata rules
4. **Schema** - JSON structure specification
5. **Source Material** - Optional code/content to use
6. **Quality Rules** - Escaping, syntax, formatting constraints

**Template System:** Manual TypeScript template strings (no framework)

### 7.2 Prompt Similarities with Tutorial I1

**Both systems share:**
- ✅ Hierarchy context (domain/subject/topic/subtopic)
- ✅ Template string generation
- ✅ Detailed schema requirements
- ✅ JSON output contract
- ✅ Quality/formatting rules
- ✅ Manual copy-paste workflow

**Difference:**
- Question Factory has **multiple prompt types** (technical, assignment, content)
- Tutorial I1 has **single prompt type** (Introduction I1)

---

## 8. VALIDATION PIPELINE

### 8.1 Question Factory Validation

**File:** `apps/skillhubcore-admin/src/lib/factory/json-validator.ts`

**Validation Stages:**

```typescript
validateBatch(jsonString: string): ValidationResult {
  // 1. JSON.parse (syntax validation)
  const parsed = JSON.parse(jsonString);
  
  // 2. Schema validation
  //    - Check required fields
  //    - Validate types
  //    - Check array lengths
  
  // 3. Schema healing (auto-repair)
  //    - Fix common AI output errors
  //    - Add missing default values
  //    - Normalize field formats
  
  // 4. Business validation
  //    - Difficulty must be valid enum
  //    - Depth level 1-10
  //    - Options must have correct answer
  
  return { isValid, errors, questions, healingReport };
}
```

**Healing Capabilities:**
- Auto-fixes common JSON issues
- Adds missing metadata with defaults
- Normalizes field formats
- Reports what was fixed

**Similarity to Tutorial I1:**
- Both use TypeScript validation
- Both validate JSON structure
- Tutorial I1 uses Zod, Question Factory uses custom validation

---

## 9. ERROR HANDLING & RESILIENCE

### 9.1 Question Factory Error Handling

**Validation Errors:**
- Returns detailed error messages
- Shows which fields failed
- Provides healing suggestions

**No Provider Errors:** (no provider integration exists)

### 9.2 question-judge Error Handling

**Resilience Patterns:**
- Model loading fallback (token overlap if model unavailable)
- Graceful degradation (returns "unavailable" flag)
- Request timeouts
- Error logging

**Main API Integration:**
```typescript
if (!verdict.available) {
  // Judge unavailable → send to REVIEW (never auto-accept)
}
```

---

## 10. OBSERVABILITY & MONITORING

### 10.1 Question Factory Observability

**Current State:** Minimal

**Logging:**
- Validation errors logged
- Schema healing reported to UI

**Missing:**
- No generation metrics (no generation exists)
- No provider latency tracking (no provider exists)
- No success/failure rates (manual workflow)

### 10.2 question-judge Observability

**Logging:**
- Request/response logging
- Model inference timing
- Signal values for debugging
- Error stack traces

**Recommended Metrics (from README):**
- `judge.request.count`
- `judge.request.latency`
- `judge.duplicate.rate`
- `judge.error.rate`

---

## 11. DEPLOYMENT INFRASTRUCTURE

### 11.1 Question Factory Deployment

**Deployment:** Part of Next.js admin applications
- `apps/skillhubcore-admin` (main Composer)
- `apps/realtutorialhub-admin` (secondary admin)

**Infrastructure:** Same as existing Next.js apps

**No separate service** — embedded in admin UI

### 11.2 question-judge Deployment

**Deployment:** Docker container (Python/FastAPI)

**Files:**
- `Dockerfile` — Python 3.11+ base image
- `docker-compose.yml` — Local development
- `requirements.txt` — Python dependencies

**Environment Variables:**
```bash
QUESTION_JUDGE_SHARED_SECRET=...
PORT=8000
ENV=production
```

**Scaling:** Stateless, horizontally scalable

**Performance:**
- Latency: <200ms average
- Throughput: ~50 requests/second (single core)
- Memory: ~500MB with model loaded

---

## 12. AUTHENTICATION & AUTHORIZATION

### 12.1 Question Factory Authentication

**Pattern:** Inherits from Next.js admin application

**Auth:** JWT session authentication (existing admin auth)

**Permissions:** Admin-level permissions required

### 12.2 question-judge Authentication

**Pattern:** Shared secret token (Bearer auth)

**Header:**
```http
Authorization: Bearer {QUESTION_JUDGE_SHARED_SECRET}
```

**Degradation:** If auth fails, service returns 401, main API handles gracefully

---

## 13. CONFIGURATION & SECRETS MANAGEMENT

### 13.1 Question Factory Configuration

**Configuration:** None required (no provider integration)

**Secrets:** None required (no API keys needed)

### 13.2 question-judge Configuration

**Environment Variables:**
- `QUESTION_JUDGE_SHARED_SECRET` — Service authentication
- `PORT` — Service port (default: 8000)
- `ENV` — Environment (development/production)

**Model:** Downloaded automatically on first run (Hugging Face)

---

## 14. REUSABILITY ANALYSIS

### 14.1 Question Factory Components

| Component | Reusable for Project LLM? | Notes |
|---|---|---|
| **Prompt generation pattern** | ✅ YES | Template string approach works |
| **Hierarchy context** | ✅ YES | Same domain/subject/topic/subtopic pattern |
| **JSON validation** | ⚠️ PARTIAL | Schema-specific, but pattern reusable |
| **Schema healing** | ⚠️ PARTIAL | Question-specific logic, but concept reusable |
| **Manual copy-paste workflow** | ❌ NO | This is what Project LLM aims to automate |
| **Provider integration** | ❌ NO | Does not exist |
| **Deployment infrastructure** | ❌ NO | No separate service |

### 14.2 question-judge Components

| Component | Reusable for Project LLM? | Notes |
|---|---|---|
| **FastAPI application structure** | ⚠️ MAYBE | Only if Python chosen for Project LLM |
| **Duplicate detection logic** | ❌ NO | Domain-specific to questions |
| **Cross-encoder model** | ❌ NO | For similarity, not generation |
| **Docker deployment** | ⚠️ MAYBE | Generic pattern, but not LLM-specific |
| **Shared secret auth** | ⚠️ MAYBE | Simple pattern, could be used |

### 14.3 Classification

```
GENERIC (Reusable Across Domains)
├── Prompt template pattern
├── Hierarchy context structure
├── JSON validation approach
├── Schema healing concept
├── REST API pattern (TypeScript → Python)
└── Shared secret authentication

QUESTION-BANK-SPECIFIC
├── Question validation rules
├── Difficulty distribution logic
├── Skill name mapping
├── Concept/objective key generation
├── Duplicate detection (question-judge)
└── Cross-encoder model usage

PROJECT-LLM-SPECIFIC (Will Need to Build)
├── TutorialPromptContext integration
├── Introduction I1 prompt generation (already exists)
├── IntroductionI1BlockSchema validation (already exists)
├── Candidate transient model
├── Provider abstraction (DOES NOT EXIST ANYWHERE)
├── LLM provider integration (DOES NOT EXIST ANYWHERE)
├── Generation orchestration (DOES NOT EXIST ANYWHERE)
└── Composer integration for AI generation

NOT FOUND IN QUESTION BANK
❌ Python/FastAPI LLM generation service
❌ Provider abstraction interface
❌ OpenAI/Anthropic/Gemini client
❌ Async generation orchestration
❌ LLM provider secrets management (generation-specific)
❌ Generation retry/error handling
❌ Provider cost tracking
❌ Generation observability
```

---

## 15. INTEGRATION PATTERN OPTIONS

**Original Options to Evaluate:**

### Option A: Extend Question Bank Python/FastAPI

**Status:** ❌ **NOT APPLICABLE**

**Reason:** Question Bank does NOT have Python/FastAPI generation service. Only question-judge exists, which is duplicate detection, not generation.

**Verdict:** Cannot extend what doesn't exist.

---

### Option B: Node/TypeScript in Composer

**Status:** ✅ **VIABLE** (Original Phase 1B Step 1 recommendation)

**Pros:**
- ✅ Matches existing Composer (where Tutorial I1 lives)
- ✅ No cross-service integration
- ✅ Reuses existing auth/database patterns
- ✅ Same deployment infrastructure
- ✅ Question Factory precedent (also TypeScript, manual workflow)

**Cons:**
- ⚠️ Must implement provider integration from scratch (no reference)
- ⚠️ Must implement provider abstraction from scratch (no reference)
- ⚠️ Must implement LLM orchestration from scratch (no reference)
- ⚠️ Couples Project LLM to Composer app
- ⚠️ Cannot scale independently

**Reusability from Question Bank:**
- ✅ Prompt template pattern (similar to PromptService)
- ✅ Hierarchy context structure (same pattern)
- ✅ JSON validation approach (similar to JsonValidator)
- ❌ NO provider integration to reuse
- ❌ NO deployment infrastructure to reuse

---

### Option C: New Python/FastAPI Service

**Status:** ⚠️ **VIABLE BUT NO REFERENCE**

**Pros:**
- ✅ Could follow question-judge deployment pattern
- ✅ Python ML/AI ecosystem for future enhancements
- ✅ Separation of concerns
- ✅ Can scale independently

**Cons:**
- ⚠️ NEW service (no generation reference exists)
- ⚠️ New deployment infrastructure (question-judge is duplicate detection, different use case)
- ⚠️ Cross-service integration required (TypeScript Composer → Python Project LLM)
- ⚠️ Must implement provider integration from scratch (no reference)
- ⚠️ Must implement provider abstraction from scratch (no reference)
- ⚠️ Operational complexity

**Reusability from Question Bank:**
- ⚠️ MAYBE FastAPI structure (from question-judge, but different domain)
- ⚠️ MAYBE Docker deployment pattern (from question-judge)
- ⚠️ MAYBE shared secret auth (from question-judge)
- ❌ NO provider integration to reuse
- ❌ NO generation orchestration to reuse

---

### Option D: Shared LLM Infrastructure Layer

**Status:** ❌ **NOT APPLICABLE**

**Reason:** There is NO generic LLM infrastructure layer. Question-judge is domain-specific (duplicate detection). Question Factory is manual copy-paste.

**Verdict:** Cannot share what doesn't exist.

---

## 16. TECHNOLOGY DECISION MATRIX (EVIDENCE-BASED)

| Criterion | Option B (Node/TS in Composer) | Option C (New Python/FastAPI) |
|---|---|---|
| **Reuses existing LLM infra** | ❌ NONE EXISTS | ❌ NONE EXISTS |
| **Reuses deployment patterns** | ✅ YES (Next.js) | ⚠️ PARTIAL (question-judge pattern) |
| **Reuses provider integration** | ❌ NONE EXISTS | ❌ NONE EXISTS |
| **Reuses prompt patterns** | ✅ YES (Question Factory) | ⚠️ INDIRECT (same patterns, different lang) |
| **Reuses validation patterns** | ✅ YES (JsonValidator) | ⚠️ INDIRECT (same concept, different impl) |
| **Cross-service integration** | ✅ NOT NEEDED | ⚠️ REQUIRED (like question-judge) |
| **Provider abstraction** | ❌ BUILD FROM SCRATCH | ❌ BUILD FROM SCRATCH |
| **LLM provider clients** | ❌ BUILD FROM SCRATCH | ❌ BUILD FROM SCRATCH |
| **Generation orchestration** | ❌ BUILD FROM SCRATCH | ❌ BUILD FROM SCRATCH |
| **Operational complexity** | ✅ LOW (embedded in Composer) | ⚠️ MEDIUM (new service) |
| **Scaling** | ⚠️ COUPLED (Composer scales) | ✅ INDEPENDENT |
| **Team knowledge** | ✅ YES (TypeScript) | ⚠️ REQUIRES (Python for LLM work) |
| **ML/AI ecosystem** | ⚠️ LIMITED (Node) | ✅ RICH (Python) |
| **Reference implementation** | ✅ Question Factory (manual) | ⚠️ question-judge (different domain) |

---

## 17. RECOMMENDATION WITH RATIONALE

### 17.1 Key Finding

**There is NO Python/FastAPI LLM generation reference architecture in this repository.**

**What exists:**
- Question Factory: TypeScript manual copy-paste (same as Tutorial I1)
- question-judge: Python/FastAPI duplicate detection (NOT generation)

**What does NOT exist:**
- Python/FastAPI LLM generation service
- Provider abstraction (any language)
- LLM provider integration (any language)
- Automated generation orchestration (any language)

### 17.2 Recommendation

**RECOMMENDED: Option B (Node/TypeScript in Composer)**

**Rationale:**

1. **NO existing Python/FastAPI LLM to extend**
   - question-judge is duplicate detection, not generation
   - No provider integration reference exists in ANY language

2. **Question Factory precedent supports TypeScript**
   - Already uses TypeScript for prompt generation
   - Already uses TypeScript for JSON validation
   - Same manual workflow as Tutorial I1
   - Proven pattern in this codebase

3. **Minimal infrastructure change**
   - Extends existing Composer where Tutorial I1 lives
   - Reuses existing auth/database/deployment
   - No cross-service integration required
   - Simpler operational model

4. **Provider abstraction is new regardless**
   - Must be built from scratch in EITHER language
   - No reference implementation exists
   - TypeScript has viable LLM SDKs (OpenAI, Anthropic official SDKs)

5. **Can evolve to separate service later**
   - Prove the vertical slice first
   - Extract to Python service in Phase 2 if justified by scale/ML needs
   - Not a one-way door decision

**Why NOT Python/FastAPI:**
- No generation reference to extend (only duplicate detection)
- Would add operational complexity (new service deployment)
- Would require cross-service integration (TypeScript ↔ Python)
- Would require learning/maintaining Python codebase for LLM work
- No provider integration patterns to reuse anyway

**Exception:**
If Human Architecture Authority has strategic reasons to invest in Python LLM infrastructure (future ML needs, team composition, etc.), Option C remains viable. But from a **"reuse existing patterns" perspective**, there is **NO Python/FastAPI LLM reference** to leverage.

---

## 18. FILES INSPECTED

### Question Factory (TypeScript)

- `apps/skillhubcore-admin/src/lib/factory/prompt-service.ts`
- `apps/skillhubcore-admin/src/lib/factory/json-validator.ts`
- `apps/skillhubcore-admin/src/types/factory.ts`
- `apps/realtutorialhub-admin/src/lib/factory/prompt-service.ts`
- `apps/realtutorialhub-admin/src/lib/factory/json-validator.ts`
- `apps/realtutorialhub-admin/src/types/factory.ts`
- `apps/api-server/src/app/api/factory/save/route.ts`
- `packages/api-client/src/modules/admin/content-admin-client.ts`

### question-judge (Python/FastAPI - Duplicate Detection)

- `apps/question-judge/README.md`
- `apps/question-judge/app/main.py`
- `apps/question-judge/app/judge.py`
- `apps/question-judge/app/model.py`
- `apps/question-judge/app/preprocessing.py`
- `apps/question-judge/app/schemas.py`
- `apps/question-judge/Dockerfile`
- `apps/question-judge/requirements.txt`

### Integration

- `apps/api-server/src/modules/intelligence/question-judge.client.ts`

---

## 19. CONCLUSION

### Investigation Complete

**Primary Question:**
> Does the existing Question Bank LLM provide a sufficiently reusable LLM infrastructure foundation for Project LLM?

**Answer:**
> **NO** — There is NO Question Bank LLM generation infrastructure. The Question Factory uses manual copy-paste workflow identical to Tutorial I1.

### Technology Decision Unblocked

**The Question Bank investigation removes the previously identified blocking concern and provides evidence supporting Option B (Node/TypeScript in Composer):**
- ✅ Question Factory precedent demonstrates viable TypeScript pattern for prompt generation and validation
- ✅ No Python/FastAPI generation reference exists to provide competing architecture
- ✅ Minimal infrastructure change relative to existing Composer
- ✅ Can evolve to separate service later if scale/ML needs justify it

**This investigation finding does NOT constitute Human Architecture Authority approval.** It provides evidence for the decision, which remains pending Human review.

**Option A (Extend Question Bank Python/FastAPI):** ❌ NOT APPLICABLE (doesn't exist)

**Option C (New Python/FastAPI Service):** ⚠️ VIABLE but no reference advantage

**Option D (Shared LLM Infrastructure):** ❌ NOT APPLICABLE (doesn't exist)

### Recommendation

**Proceed with Option B (Node/TypeScript in Composer) as the evidence-based recommendation for Phase 1B minimal vertical slice.**

**Rationale:** No Python/FastAPI LLM generation reference exists. Question Factory precedent demonstrates viable TypeScript pattern. Provider abstraction must be built from scratch regardless of language choice.

**Status:** FORENSIC RECOMMENDATION (Human Architecture Authority approval pending)

---

## DOCUMENT STATUS

**Investigation:** ✅ COMPLETE  
**Question Bank LLM Search:** ✅ COMPLETE (None found)  
**Technology Decision:** ✅ EVIDENCE GATHERED (Human approval pending)  
**Production Code:** UNCHANGED  

**Next Action:** Create Technology/Service Boundary Decision document synthesizing findings, proceed to Human Architecture Authority review.

