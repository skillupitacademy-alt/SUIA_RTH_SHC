# PROJECT LLM — TECHNOLOGY & SERVICE BOUNDARY DECISION

**Document Type:** Architecture Decision Record  
**Phase:** Project LLM Phase 1B Step 2b  
**Date:** 2026-10-03  
**Status:** EVIDENCE GATHERED — AWAITING HUMAN ARCHITECTURE AUTHORITY DECISION  
**Production Code Changes:** NONE  
**Repository State:** UNCHANGED  

---

## EXECUTIVE SUMMARY

### Decision Context

Phase 1B Step 1 identified that the **technology and service boundary decision** was blocked pending investigation of the existing Question Bank LLM reference architecture.

**Question Bank LLM investigation is now complete** (see `QUESTION_BANK_LLM_REFERENCE_ARCHITECTURE.md`).

**Key Finding:** No Python/FastAPI LLM generation service exists. Question Factory uses manual TypeScript workflow identical to Tutorial I1.

### Decision Required

**Human Architecture Authority must approve:**

1. **Technology Stack:** Python/FastAPI OR Node/TypeScript
2. **Service Boundary:** Extend Composer, New Service, or Hybrid
3. **Integration Pattern:** Embedded, REST API, or Shared Infrastructure

### Recommendation Status

**Forensic Recommendation:** Option B (Node/TypeScript in Composer)

**Human Decision:** **PENDING**

---

## 1. DECISION CRITERIA

### 1.1 Must Address

| Criterion | Why It Matters |
|---|---|
| **Reusability** | Leverage existing patterns where possible |
| **Operational Complexity** | Minimize new infrastructure/deployment burden |
| **Team Knowledge** | Match team's existing skillset |
| **Scalability** | Support future growth (I2-I6, multi-block tutorials) |
| **Provider Flexibility** | Enable provider switching without service rewrite |
| **Time to Value** | Prove minimal vertical slice quickly |
| **Evolution Path** | Allow extraction/refactoring if needs change |

### 1.2 Out of Scope

- Provider selection (OpenAI, Anthropic, Gemini) — separate decision after technology locked
- Quality scoring mechanisms — Phase 2
- Hallucination detection — Phase 2
- Multi-block generation — Phase 2+

---

## 2. EVIDENCE FROM INVESTIGATIONS

### 2.1 Tutorial I1 Architecture (Phase 1B Step 1)

**Location:** `apps/skillhubcore-admin` (Composer)

**Technology:** Node/TypeScript (Next.js)

**Workflow:** Manual copy-paste
- Human copies prompt → External AI → Human pastes JSON
- Validation: IntroductionI1BlockSchema (Zod)
- Save: tutorial_sections.content (JSONB)
- Runtime: IntroductionI1View (React)

**Key Components:**
- ✅ TutorialPromptContext (hierarchy context)
- ✅ getIntroductionI1Prompt() (prompt generation)
- ✅ IntroductionI1BlockSchema (validation)
- ✅ tutorialSaveService (persistence)
- ❌ Provider integration (none)
- ❌ Automated generation (none)

### 2.2 Question Factory Architecture (Question Bank Investigation)

**Location:** `apps/skillhubcore-admin/src/lib/factory/` (Composer)

**Technology:** Node/TypeScript (Next.js)

**Workflow:** Manual copy-paste (identical to Tutorial I1)
- Human copies prompt → External AI → Human pastes JSON
- Validation: JsonValidator (custom TypeScript)
- Save: questions table

**Key Components:**
- ✅ PromptService.generateTechnicalPrompt() (prompt generation)
- ✅ JsonValidator.validateBatch() (validation + healing)
- ✅ GeneratedQuestion types (TypeScript)
- ❌ Provider integration (none)
- ❌ Automated generation (none)

**Pattern Match:** Same manual workflow, same prompt-generation approach, same JSON validation pattern

### 2.3 question-judge Architecture (Question Bank Investigation)

**Location:** `apps/question-judge/`

**Technology:** Python + FastAPI

**Purpose:** **Duplicate detection ONLY** (NOT generation)

**Workflow:** REST API (TypeScript → Python)
- TypeScript client calls Python service
- Cross-encoder model for similarity scoring
- Returns duplicate/not-duplicate verdict

**Integration Pattern:**
- Shared secret authentication (Bearer token)
- HTTP/JSON REST API
- Graceful degradation if unavailable
- Stateless, horizontally scalable

**Key Finding:** This is **NOT an LLM generation service**. It is a domain-specific duplicate detector.

### 2.4 What Does NOT Exist

❌ Python/FastAPI LLM generation service  
❌ Provider abstraction (any language)  
❌ LLM provider integration (OpenAI, Anthropic, Gemini)  
❌ Automated generation orchestration  
❌ Generation retry/error handling patterns  
❌ Provider cost tracking  
❌ Generation observability  
❌ LLM-specific secrets management  

**Conclusion:** Provider abstraction and LLM integration must be built **from scratch** regardless of technology choice.

---

## 3. OPTIONS ANALYSIS

### Option A: Extend Question Bank Python/FastAPI Service

**Status:** ❌ **NOT APPLICABLE**

**Reason:** Question Bank does NOT have a Python/FastAPI LLM generation service. Only `question-judge` exists, which is a duplicate detection service (different domain, different use case).

**Verdict:** Cannot extend what doesn't exist.

---

### Option B: Node/TypeScript in Composer

**Architecture:**
```
apps/skillhubcore-admin/
  └── src/lib/project-llm/
        ├── providers/
        │   ├── ProjectLLMProvider.ts (interface)
        │   ├── TestProvider.ts
        │   └── [RealProvider].ts (OpenAI/Anthropic/Gemini)
        ├── ProjectLLMService.ts
        └── types.ts
```

**Pros:**
- ✅ **Reuses existing Composer infrastructure** (auth, database, deployment)
- ✅ **Matches Tutorial I1 location** (where I1 generation will be triggered)
- ✅ **Question Factory precedent** (similar TypeScript pattern for prompts/validation)
- ✅ **No cross-service integration** (embedded in Composer)
- ✅ **Simpler operational model** (one fewer service to deploy/monitor)
- ✅ **Team knowledge** (TypeScript monorepo patterns already established)
- ✅ **Fast iteration** (no cross-service debugging)
- ✅ **Evolution path** (can extract to service in Phase 2 if justified)

**Cons:**
- ⚠️ **Provider integration from scratch** (no reference exists)
- ⚠️ **Provider abstraction from scratch** (no reference exists)
- ⚠️ **Couples Project LLM to Composer** (shared deployment lifecycle)
- ⚠️ **Cannot scale independently** (scales with Composer)
- ⚠️ **Limited ML/AI ecosystem** (Node.js vs Python)

**What Must Be Built:**
- ❌ ProjectLLMProvider interface (vendor-neutral)
- ❌ TestProvider implementation (mock for development)
- ❌ Real provider implementation (OpenAI/Anthropic/Gemini SDK)
- ❌ Generation orchestration (request → provider → response)
- ❌ Error handling (provider failures, timeouts, retries)
- ❌ Provenance tracking (generationJobId, aiModelUsed)

**What Can Be Reused:**
- ✅ Prompt generation pattern (similar to Question Factory PromptService)
- ✅ Hierarchy context (TutorialPromptContext already exists)
- ✅ Validation (IntroductionI1BlockSchema already exists)
- ✅ Save pipeline (tutorialSaveService, tutorial_sections)
- ✅ Authorization (TUTORIAL_AUTHOR_CREATE permission)
- ✅ Deployment (Next.js infrastructure)

**Risk Assessment:**
- **Low risk:** Provider abstraction — TypeScript has official SDKs from OpenAI, Anthropic
- **Low risk:** Deployment — embedded in existing service
- **Medium risk:** Scaling — if I1 generation becomes high-volume, coupled to Composer scaling
- **Medium risk:** ML ecosystem — if advanced features need Python libraries

---

### Option C: New Python/FastAPI Service

**Architecture:**
```
apps/project-llm/  (new Python service)
  └── app/
        ├── main.py (FastAPI)
        ├── providers/
        │   ├── provider_interface.py
        │   ├── test_provider.py
        │   └── [real_provider].py
        ├── services/
        │   └── generation_service.py
        ├── schemas.py (Pydantic)
        └── models.py
```

**Integration:**
```
Composer (TypeScript)
      ↓ HTTP/JSON
Python FastAPI Project LLM Service
```

**Pros:**
- ✅ **Separation of concerns** (bounded context)
- ✅ **Can scale independently** (horizontal scaling separate from Composer)
- ✅ **Python ML/AI ecosystem** (rich libraries for future enhancements)
- ✅ **question-judge deployment pattern** (can follow similar Docker/FastAPI structure)
- ✅ **Evolution path** (built for independence from start)

**Cons:**
- ⚠️ **New service deployment** (Docker, Cloud Run, monitoring, logs)
- ⚠️ **Cross-service integration** (TypeScript ↔ Python boundary)
- ⚠️ **Cross-service authentication** (shared secrets, token management)
- ⚠️ **Operational complexity** (two services instead of one)
- ⚠️ **Provider integration from scratch** (no reference exists in Python either)
- ⚠️ **Provider abstraction from scratch** (no reference exists in Python either)
- ⚠️ **Longer time to value** (new service setup overhead)

**What Must Be Built:**
- ❌ Entire Python/FastAPI service (new deployment)
- ❌ ProjectLLMProvider interface (vendor-neutral, Python version)
- ❌ TestProvider implementation (mock for development)
- ❌ Real provider implementation (Python SDK for OpenAI/Anthropic/Gemini)
- ❌ Generation orchestration (request → provider → response)
- ❌ Error handling (provider failures, timeouts, retries)
- ❌ Provenance tracking (generationJobId, aiModelUsed)
- ❌ TypeScript → Python integration (HTTP client, error handling)
- ❌ Deployment infrastructure (Dockerfile, Cloud Run config, monitoring)
- ❌ Cross-service secrets (shared secret or OAuth)

**What Can Be Reused:**
- ⚠️ **MAYBE** question-judge deployment pattern (but different domain)
- ⚠️ **MAYBE** FastAPI structure (but must be built for generation use case)
- ⚠️ **MAYBE** shared secret auth pattern (from question-judge)
- ❌ NO provider integration patterns (none exist in Question Bank)
- ❌ NO generation orchestration patterns (none exist anywhere)

**Risk Assessment:**
- **Medium risk:** Cross-service integration — adds latency, failure modes
- **Medium risk:** Operational complexity — new service to deploy/monitor
- **Low risk:** Provider abstraction — Python has official SDKs too
- **Low risk:** ML ecosystem — Python if advanced features needed later

---

### Option D: Shared LLM Infrastructure Layer

**Status:** ❌ **NOT APPLICABLE**

**Reason:** There is NO generic LLM infrastructure layer in the codebase. `question-judge` is domain-specific (duplicate detection). Question Factory is manual copy-paste. No shared provider abstraction exists.

**Verdict:** Cannot share what doesn't exist.

---

## 4. EVIDENCE-BASED COMPARISON

| Criterion | Option B (Node/TS Composer) | Option C (Python/FastAPI) |
|---|---|---|
| **Reuses existing LLM infra** | ❌ NONE EXISTS | ❌ NONE EXISTS |
| **Reuses deployment** | ✅ YES (Next.js) | ⚠️ PARTIAL (question-judge pattern) |
| **Reuses provider integration** | ❌ NONE EXISTS | ❌ NONE EXISTS |
| **Reuses prompt patterns** | ✅ YES (Question Factory) | ⚠️ INDIRECT (different language) |
| **Reuses validation** | ✅ YES (IntroductionI1BlockSchema) | ⚠️ INDIRECT (must rebuild in Python) |
| **Cross-service integration** | ✅ NOT NEEDED | ⚠️ REQUIRED |
| **Provider abstraction** | ❌ BUILD FROM SCRATCH | ❌ BUILD FROM SCRATCH |
| **LLM provider clients** | ❌ BUILD FROM SCRATCH | ❌ BUILD FROM SCRATCH |
| **Orchestration** | ❌ BUILD FROM SCRATCH | ❌ BUILD FROM SCRATCH |
| **Operational complexity** | ✅ LOW (embedded) | ⚠️ MEDIUM (new service) |
| **Scaling** | ⚠️ COUPLED | ✅ INDEPENDENT |
| **Team knowledge** | ✅ YES (TypeScript) | ⚠️ REQUIRES (Python) |
| **ML/AI ecosystem** | ⚠️ LIMITED | ✅ RICH |
| **Time to value** | ✅ FAST | ⚠️ SLOWER (setup overhead) |
| **Evolution path** | ✅ CAN EXTRACT LATER | ✅ INDEPENDENT FROM START |
| **Reference implementation** | ✅ Question Factory (TypeScript) | ⚠️ question-judge (wrong domain) |

---

## 5. WHAT IS REUSABLE

### 5.1 From Tutorial I1 (Existing)

| Component | Reusable? | Notes |
|---|---|---|
| TutorialPromptContext | ✅ DIRECT | Already exists, use as-is |
| getIntroductionI1Prompt() | ✅ DIRECT | Already exists, use as-is |
| IntroductionI1BlockSchema | ✅ DIRECT | Already exists for validation |
| tutorialSaveService | ⚠️ EXTEND | Add AI metadata population |
| tutorial_sections AI fields | ✅ DIRECT | Schema ready, just populate |
| Composer UI | ⚠️ EXTEND | Add "Generate with AI" button |

### 5.2 From Question Factory (TypeScript Precedent)

| Component | Reusable? | Notes |
|---|---|---|
| Prompt generation pattern | ✅ INDIRECT | Template string approach, adapt for I1 |
| JSON validation pattern | ✅ INDIRECT | Custom validation + healing concept |
| Hierarchy context | ✅ DIRECT | Same domain/subject/topic/subtopic |
| Manual workflow | ❌ NO | This is what we're automating |

### 5.3 From question-judge (Python Service Precedent)

| Component | Reusable? | Notes |
|---|---|---|
| FastAPI structure | ⚠️ MAYBE | Only if Option C chosen |
| Docker deployment | ⚠️ MAYBE | Only if Option C chosen |
| Shared secret auth | ⚠️ MAYBE | Only if Option C chosen |
| Duplicate detection logic | ❌ NO | Domain-specific to questions |

---

## 6. WHAT MUST BE NEWLY BUILT

**Regardless of Option B or C:**

| Component | Complexity | Notes |
|---|---|---|
| **Provider abstraction interface** | Medium | Vendor-neutral design required |
| **Test provider (mock)** | Low | Returns static fixture |
| **Real provider client** | Medium | SDK integration (OpenAI/Anthropic/Gemini) |
| **Generation orchestration** | Medium | Request → provider → validation → response |
| **Error handling** | Medium | Timeout, retry, fallback logic |
| **Provenance tracking** | Low | generationJobId, aiModelUsed metadata |
| **Secrets management** | Medium | Provider API keys, secure storage |

**Additional for Option C (Python/FastAPI):**

| Component | Complexity | Notes |
|---|---|---|
| **Python/FastAPI service** | High | Entire new service infrastructure |
| **TypeScript → Python client** | Medium | HTTP client, error handling |
| **Cross-service auth** | Medium | Shared secret or OAuth |
| **Deployment infrastructure** | High | Docker, Cloud Run, monitoring |
| **Python provider implementations** | Medium | Python SDKs instead of TypeScript |

---

## 7. RISKS & TRADE-OFFS

### 7.1 Option B Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Scaling coupled to Composer** | Medium | Medium | Monitor I1 generation volume; extract to service if becomes bottleneck |
| **Limited Python ML libraries** | Low | Low | Most LLM providers have TypeScript SDKs; advanced ML is Phase 2+ |
| **Tight coupling** | Medium | Low | Use clear module boundaries; extraction documented as evolution path |

### 7.2 Option C Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Cross-service latency** | Medium | Medium | Cache, async patterns, monitoring |
| **Cross-service failure modes** | Medium | High | Graceful degradation, fallback to manual workflow |
| **Operational complexity** | High | Medium | Shared deployment patterns, monitoring, runbooks |
| **Longer implementation** | High | Medium | Focus on minimal viable service first |

---

## 8. FORENSIC RECOMMENDATION

### Recommended Option: **B (Node/TypeScript in Composer)**

### Rationale

1. **No Python/FastAPI LLM generation reference exists**
   - question-judge is duplicate detection, not generation
   - No provider integration patterns to reuse in Python
   - Provider abstraction must be built from scratch either way

2. **Question Factory demonstrates viable TypeScript pattern**
   - Prompt generation: TypeScript template strings
   - JSON validation: TypeScript + schema healing
   - Same hierarchy context: domain/subject/topic/subtopic
   - Same manual workflow as Tutorial I1

3. **Minimal infrastructure change**
   - Extends existing Composer (where I1 lives)
   - Reuses auth, database, deployment
   - No cross-service integration
   - Simpler operational model

4. **Provider abstraction is new regardless**
   - Must be built from scratch in EITHER language
   - TypeScript has official LLM SDKs (OpenAI, Anthropic)
   - No reference implementation in Python to leverage

5. **Evolution path preserved**
   - Prove vertical slice first (minimal viable automation)
   - Extract to Python service in Phase 2 if scale/ML needs justify
   - Not a one-way door decision

6. **Time to value**
   - Faster iteration (no cross-service debugging)
   - Reuses existing Composer infrastructure
   - Focus effort on provider integration, not service setup

### When Option C Would Be Justified

**Strategic reasons:**
- Team composition shifting to Python-first
- Future roadmap requires heavy Python ML libraries
- Organization standardizing on Python for all LLM work
- Multi-tenant isolation requirements

**Technical reasons:**
- I1 generation volume exceeds Composer capacity
- Advanced features require Python-specific libraries
- Separation of concerns becomes critical for team structure

**None of these are true for Phase 1B minimal vertical slice.**

---

## 9. DECISION RECORD

### Decision Required

**Human Architecture Authority must approve:**

1. **Technology Stack:** Python/FastAPI OR Node/TypeScript
2. **Service Boundary:** Extend Composer, New Service, or Hybrid
3. **Integration Pattern:** Embedded, REST API, or Shared Infrastructure

### Forensic Recommendation

**Option B: Node/TypeScript in Composer**

### Human Decision

**STATUS: PENDING**

**Date:** _____________

**Approved By:** _____________

**Decision:**
- [ ] APPROVE Option B (Node/TypeScript in Composer)
- [ ] APPROVE Option C (New Python/FastAPI Service)
- [ ] MODIFY (specify changes): _______________
- [ ] REJECT (specify alternative): _______________

**Rationale:** _____________

---

## 10. NEXT ACTIONS

### If Option B Approved

**Next Document:** `PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md`

**Implementation sequence:**
1. Define ProjectLLMProvider interface (vendor-neutral)
2. Implement TestProvider (mock for development)
3. Implement ProjectLLMService orchestration
4. Add "Generate with AI" UI button
5. Wire generation flow (button → service → provider → validation)
6. Extend tutorialSaveService for AI metadata
7. Integration tests
8. Select and implement real provider (after separate provider decision)
9. E2E tests
10. Certification

### If Option C Approved

**Next Document:** `PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md`

**Implementation sequence:**
1. Create Python/FastAPI service structure
2. Define Python provider interface (vendor-neutral)
3. Implement Python TestProvider
4. Implement generation endpoints
5. Create TypeScript client for Project LLM service
6. Add "Generate with AI" UI button (calls Python service)
7. Wire generation flow (button → Python service → provider)
8. Cross-service integration tests
9. Select and implement real provider (after separate provider decision)
10. E2E tests
11. Deployment configuration
12. Certification

---

## DOCUMENT STATUS

**Evidence Gathering:** ✅ COMPLETE  
**Recommendation:** ✅ PROVIDED (Option B)  
**Human Decision:** ⏸️ **PENDING**  
**Production Code:** UNCHANGED  

**Blocked Items:**
- Phase 1B Step 3 (Implementation Contract) — blocked until technology/service boundary approved
- Provider selection — blocked until technology locked (separate decision after this)
- Implementation — blocked until contract approved

**Next Action:** Human Architecture Authority reviews evidence and approves technology/service boundary decision.

