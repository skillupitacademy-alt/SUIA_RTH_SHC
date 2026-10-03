# PROJECT LLM PHASE 1B — CONTRACT APPROVAL REQUEST

**Document Type:** Approval Request for Human Architecture Authority  
**Phase:** Project LLM Phase 1B Step 3 (Final)  
**Date:** 2026-10-03  
**Status:** READY FOR HUMAN REVIEW  
**Production Code Changes:** NONE  
**Repository State:** UNCHANGED  

---

## EXECUTIVE SUMMARY

### Request

**I request Human Architecture Authority approval for the Project LLM Phase 1B Implementation Contract.**

**Contract Document:** `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md`

**Status:** ✅ All 8 forensic corrections applied, ready for lock

### Contract Scope

**Phase 1B delivers:**
- Introduction I1 automation ONLY (single block type)
- Node/TypeScript service embedded in Composer (Option B - approved 2026-10-03)
- Provider-neutral abstraction (TestProvider + RealProvider placeholder)
- Transient candidate model (no persistent storage until approval)
- Human approval required (existing Composer workflow)
- AI metadata population (generatedByAi, aiModelUsed, generationJobId)
- Server-side API route with authentication/authorization
- Complete test coverage (unit, integration, E2E)

**Phase 1B does NOT deliver:**
- I2-I6 block implementations (deferred to Phase 2+)
- Real LLM provider integration (separate approval gate AFTER contract lock)
- Quality scoring, hallucination detection (Phase 2+)
- Automatic publication, multi-block generation (Phase 2+)

---

## CONTRACT REVIEW HISTORY

### Forensic Contract Review (2026-10-03)

**Review Document:** `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT_REVIEW.md`

**Findings:** 8 corrections required before lock

**Severity:**
- 🔴 **CRITICAL:** 2 items
- 🟡 **IMPORTANT:** 4 items
- 🟢 **MINOR:** 2 items

### All Corrections Applied ✅

| # | Severity | Issue | Correction | Status |
|---|---|---|---|---|
| **1** | 🔴 CRITICAL | Client/server boundary incorrect | Added API route `/api/project-llm/generate-i1`; client calls API, not service directly | ✅ APPLIED |
| **2** | 🔴 CRITICAL | Provider secrets not secured | Added environment variable specification; explicit security requirements | ✅ APPLIED |
| **3** | 🟡 IMPORTANT | aiModelUsed naming misleading | Store model identifier (not provider name); value = `provenance.model ?? null` | ✅ APPLIED |
| **4** | 🟡 IMPORTANT | Authorization enforcement ambiguous | Clarified server-side enforcement in API route | ✅ APPLIED |
| **5** | 🟡 IMPORTANT | Missing rejection test | Added rejection path E2E test (verify NO database write) | ✅ APPLIED |
| **6** | 🟡 IMPORTANT | Security criteria too vague | Added explicit security acceptance criteria | ✅ APPLIED |
| **7** | 🟢 MINOR | ILS terminology undefined | Added ILS = In-Lesson System definition | ✅ APPLIED |
| **8** | 🟢 MINOR | Provider decision timing unclear | Clarified: separate gate AFTER contract, BEFORE production | ✅ APPLIED |

**Architecture Diagram:** Updated to show correct client/server boundary with security boundaries

---

## KEY CONTRACT DECISIONS

### 1. Service Boundary (Locked)

**Decision:** Node/TypeScript in Composer (Option B)

**Human Architecture Authority Approval:** 2026-10-03

**Rationale:**
- No Python/FastAPI generation service exists in Question Bank (forensic evidence)
- Reuse existing Question Factory TypeScript infrastructure
- Single deployment unit (reduced operational complexity)
- Consistent technology stack

**Service Location:** `apps/skillhubcore-admin/src/lib/project-llm/`

### 2. Provider Abstraction (Locked)

**Interface:** Vendor-neutral `ProjectLLMProvider`

**Implementations:**
- `TestProvider` — Mock provider for development/testing (functional)
- `RealProvider` — Placeholder for actual LLM provider (separate approval)

**Security:**
- API keys server-side only (environment variables)
- Never exposed to client bundles
- Secrets read at runtime, not build-time

**Provider Selection:** Separate approval gate AFTER contract lock, BEFORE production deployment

### 3. Candidate Lifecycle (Locked)

**Model:** Transient (no persistent storage)

**Characteristics:**
- ❌ NO `candidate_blocks` table
- ✅ Candidate exists only in UI state during review
- ✅ Approval → TutorialBlock in `tutorial_sections`
- ✅ Rejection → Discard (no database write)

**E2E Verification:** Both approval AND rejection paths tested

### 4. Client/Server Boundary (Locked)

**Architecture:**

```
Client Component (Browser)
      ↓ fetch()
API Route (Server-Only)
  ├─ authenticateRequest()
  ├─ requireTutorialAuthorCreatePermission()
  └─ Call ProjectLLMService (server-only)
      ↓
Service Layer (Server-Only)
  └─ Provider.generate() (API keys server-side)
```

**API Route:** `POST /api/project-llm/generate-i1`

**Security:**
- JWT authentication enforced server-side
- TUTORIAL_AUTHOR_CREATE permission enforced server-side
- Provider secrets never exposed to client
- Input validation server-side

### 5. AI Metadata (Locked)

**Fields (existing `tutorial_sections` schema):**

| Field | Value | Semantics |
|---|---|---|
| `generatedByAi` | `true` | Block was AI-generated |
| `aiModelUsed` | `provenance.model ?? null` | Model identifier (e.g., "gpt-4-turbo", "test-mock-model") |
| `generationJobId` | `provenance.requestId` | Request UUID for correlation (NOT job record FK) |

**Write Location:** `tutorialSaveService` (extended for AI metadata)

### 6. Validation (Locked)

**Reuse existing:**
- ✅ `validateIntroductionI1AIOutput()` — JSON validation
- ✅ `IntroductionI1AuthorContentSchema` — Zod schema
- ✅ `IntroductionI1BlockSchema` — Block structure
- ✅ `TutorialDocumentSchema` — Document structure

**No new validation schemas required.**

### 7. Authorization (Locked)

**Permission:** Reuse existing `TUTORIAL_AUTHOR_CREATE`

**Rationale:** Human initiates generation = same security boundary as manual authoring

**Enforcement:** Server-side in API route (authoritative)

**Roles:** `admin`, `super_admin`

### 8. Human Approval (Locked)

**UI:** Existing Composer JSON editor

**Workflow:**
1. Candidate pre-fills editor
2. Human reviews/edits
3. Human clicks "Add to Document" (existing)
4. Existing save pipeline

**No new approval UI required.**

---

## ACCEPTANCE CRITERIA

### Functional Requirements

| Requirement | Acceptance Criteria |
|---|---|
| **Provider Abstraction** | TestProvider returns valid I1 fixture; RealProvider placeholder exists |
| **Generation Service** | generateI1() parses JSON, validates schema, returns candidate + provenance |
| **API Route** | POST /api/project-llm/generate-i1 enforces auth/authz, calls service, returns result |
| **UI Integration** | "Generate with AI" button triggers API call, displays candidate in editor |
| **Human Approval** | Existing Composer review workflow works with AI-generated candidates |
| **Metadata Population** | generatedByAi, aiModelUsed, generationJobId written on save |
| **Error Handling** | Provider errors, JSON parse errors, validation errors handled gracefully |
| **Transient Candidate** | Approved candidate persists; rejected candidate leaves no database trace |

### Non-Functional Requirements

| Requirement | Acceptance Criteria |
|---|---|
| **Performance** | Generation completes in <30 seconds (TestProvider: <2 seconds) |
| **Resilience** | Provider timeout handled gracefully, fallback to manual workflow |
| **Security - Authorization** | TUTORIAL_AUTHOR_CREATE enforced server-side; client cannot bypass |
| **Security - Secrets** | Provider API keys remain server-side; bundle analysis confirms no secrets |
| **Security - Authentication** | JWT authentication enforced at API route; unauthenticated requests rejected |
| **Security - Input Validation** | Prompt and context validated; malicious input rejected |
| **Observability** | All generation events logged with requestId correlation |
| **Testability** | >80% code coverage for Project LLM module |

### Evidence Requirements

| Evidence | Required Artifacts |
|---|---|
| **Unit Tests** | Test suite passes, coverage >80% |
| **Integration Tests** | Generation flow end-to-end passes |
| **E2E Test** | Complete user journey passes (approval AND rejection paths) |
| **Manual Verification** | Screenshots of each UI state, database state verification |
| **Log Correlation** | requestId traceable through logs |
| **Security Verification** | Bundle analysis (no secrets); authorization test (API rejects unauthorized) |

---

## IMPLEMENTATION STRATEGY

### Phase 1: Foundation (Week 1)
1. Provider abstraction interface
2. TestProvider implementation
3. Mock I1 fixture
4. Unit tests

### Phase 2: Service Layer (Week 2)
5. ProjectLLMService implementation
6. Service initialization
7. Integration tests

### Phase 3: API & UI Integration (Week 2-3)
8. API route `/api/project-llm/generate-i1`
9. "Generate with AI" button
10. Loading/error states
11. Candidate display

### Phase 4: Metadata & Persistence (Week 3)
12. Extend tutorialSaveService
13. AI metadata population
14. Integration tests

### Phase 5: E2E & Verification (Week 3-4)
15. E2E test (approval path)
16. E2E test (rejection path)
17. Manual verification
18. Evidence collection

### Phase 6: Documentation & Handoff (Week 4)
19. User documentation
20. Developer documentation
21. Certification evidence

**Estimated Duration:** 4 weeks

**Gate Reviews:** Each phase ends with evidence collection

---

## RISKS & MITIGATIONS

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TestProvider insufficient for validation | Low | Medium | Multiple test fixtures covering edge cases |
| JSON parsing brittle | Medium | High | Robust error handling, show raw response on failure |
| Validation too strict | Medium | Medium | Schema healing (Phase 2), manual edit in Composer |
| UI state management complex | Low | Medium | Established React patterns, integration tests |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Provider unavailable (Phase 2) | Medium | Medium | Graceful degradation to manual workflow |
| Generation too slow | Low | Medium | 30-second timeout, async patterns (Phase 2) |
| Metadata not populated | Low | High | Integration tests verify database writes |

---

## OUT OF SCOPE

### Separate Approval Gate (AFTER Contract Lock)
- Real LLM provider selection (OpenAI, Anthropic, Gemini, or other)
- Real LLM provider SDK integration
- Provider API key configuration

**Note:** TestProvider is functional for Phase 1B vertical slice proof.

### Deferred to Phase 2+
- I2-I6 block implementations
- Quality scoring, hallucination detection
- Automatic publication, multi-block generation
- Schema healing, regeneration UI
- Version history, A/B testing
- Async generation, rate limiting, cost tracking
- Internationalization

---

## DEPENDENCIES

### Existing Components (Reuse) ✅
- TutorialPromptContext
- getIntroductionI1Prompt()
- validateIntroductionI1AIOutput()
- IntroductionI1AuthorContentSchema
- IntroductionI1BlockSchema
- TutorialDocumentSchema
- tutorialSaveService
- tutorial_sections schema (AI metadata fields)
- Composer UI

### New Dependencies
- ⚠️ None for Phase 1B TestProvider
- ⚠️ Real provider SDK (separate approval, Phase 2)

---

## APPROVAL CHECKLIST

**Contract Review:**

- [x] Architecture boundary correct (Node/TypeScript in Composer)
- [x] Provider abstraction vendor-neutral
- [x] Candidate lifecycle transient (no persistence)
- [x] generationJobId semantics correct (provenance ID, not job FK)
- [x] Validation reuses existing schemas
- [x] Authorization reuses existing permissions
- [x] Human approval workflow reuses existing Composer
- [x] Client/server boundary correct (API route + server-side enforcement)
- [x] Provider secrets secured (environment variables, server-only)
- [x] aiModelUsed stores model identifier (not provider name)
- [x] Security acceptance criteria explicit
- [x] E2E tests cover approval AND rejection paths
- [x] Scope limited to I1 only
- [x] Out-of-scope items clearly deferred
- [x] Acceptance criteria clear and testable
- [x] Risks identified and mitigated
- [x] Implementation sequence realistic

**Forensic Review:**

- [x] All 8 corrections applied
- [x] Architecture diagram updated
- [x] Document status READY FOR APPROVAL

**Ready for Human Architecture Authority approval?**

---

## APPROVAL SIGNATURE

**Human Architecture Authority Decision:**

- [ ] **APPROVED** — Lock contract, begin implementation
- [ ] **APPROVED WITH CHANGES** — Specify changes required
- [ ] **NOT APPROVED** — Return to architecture reconciliation

**Approved By:** _____________

**Date:** _____________

**Comments:**

---

## POST-APPROVAL ACTIONS

**After approval:**

1. ✅ **Lock contract** — No further specification changes without Architecture Authority review
2. ✅ **Begin implementation** — Phase 1: Foundation
3. ✅ **Daily stand-ups** — Track progress against implementation sequence
4. ✅ **Weekly evidence collection** — Gate reviews at each phase completion
5. ✅ **Final certification** — Phase 6 completion before production deployment

**Before production deployment:**

- ⏸️ All acceptance criteria met
- ⏸️ All tests passing (unit, integration, E2E)
- ⏸️ Evidence artifacts collected
- ⏸️ Manual verification complete
- ⏸️ Security verification complete
- ⏸️ Human Architecture Authority final deployment review
- ⏸️ Provider selection approval (if moving to production with real provider)

---

## DOCUMENT REFERENCES

**Primary Documents:**

1. **Implementation Contract:** `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` (THIS CONTRACT)
2. **Forensic Review:** `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT_REVIEW.md`
3. **Technology Decision:** `.analysis/stage-5/PROJECT_LLM_TECHNOLOGY_SERVICE_BOUNDARY_DECISION.md`
4. **Question Bank Investigation:** `.analysis/stage-5/QUESTION_BANK_LLM_REFERENCE_ARCHITECTURE.md`
5. **Architecture Reconciliation:** `.analysis/stage-5/PROJECT_LLM_PHASE_1B_ARCHITECTURE_RECONCILIATION.md` (historical)

**Commit History:**

- 2026-10-03: Phase 1B Step 3 corrections applied (commit 157385d4)
- 2026-10-03: Implementation contract review complete (forensic)
- 2026-10-03: Implementation contract draft created
- 2026-10-03: Technology decision (Option B) approved by Human
- 2026-10-03: Question Bank investigation complete
- 2026-10-03: Phase 1B architecture reconciliation frozen

---

## DOCUMENT STATUS

**Request Status:** 🟢 READY FOR HUMAN ARCHITECTURE AUTHORITY REVIEW  
**Contract Status:** ✅ ALL CORRECTIONS APPLIED  
**Implementation:** ⏸️ BLOCKED until approval  
**Production Code:** UNCHANGED  

**Next Action:** Human Architecture Authority decision.
