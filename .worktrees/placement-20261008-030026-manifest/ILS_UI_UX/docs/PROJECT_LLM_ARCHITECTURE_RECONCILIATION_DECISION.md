# Project LLM Architecture Reconciliation Decision

**Document Type:** Architecture Reconciliation Gate  
**Status:** DRAFT — Awaiting Human Architecture Authority Approval  
**Created:** 2026-10-04  
**Context:** Phase 1B Implementation Contract (commit a433d837) is APPROVED & LOCKED, but describes narrow AI generation service. Documented Project LLM lifecycle describes broad Integration & Certification Engine. This document reconciles the 15 identified mismatches.

**Related Documents:**
- `PROJECT_LLM_ARCHITECTURE_RECONCILIATION_REQUIRED.md` (finding document, 15 areas identified)
- `PROJECT_LLM_GUI_FIRST_STRATEGY.md` (recommended GUI-first workflow)
- `.analysis/stage-5/PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` (locked contract)

---

## Executive Summary

**Finding:** The approved Phase 1B Implementation Contract describes a **tactical AI generation service** (Introduction I1 automation only), while the documented Project LLM lifecycle describes a **strategic Integration & Certification Engine** (candidate generation, human review loops, quality gates, certification, publishing across 6 block types).

**Reconciliation Strategy:** **PHASED ARCHITECTURE** — Phase 1B implements the narrow contract as **Foundation Layer**, future phases extend to full Integration & Certification Engine.

**Decision Required:** Human Architecture Authority must approve reconciliation strategy and phasing plan before GUI specification begins.

---

## Reconciliation Approach: Three Options

### Option 1: Contract Scope Wins (Narrow Interpretation)
- **Position:** The locked Phase 1B contract is correct; the lifecycle documents are aspirational/out-of-scope
- **Action:** Implement Phase 1B as pure I1 generation service, defer all lifecycle features indefinitely
- **Risk:** Project LLM becomes disconnected from documented vision, future phases lack foundation

### Option 2: Lifecycle Scope Wins (Broad Interpretation)
- **Position:** The lifecycle documents are correct; the Phase 1B contract is incomplete
- **Action:** Expand Phase 1B to implement full Integration & Certification Engine (all 6 block types, GUI surfaces, workflows)
- **Risk:** Massive scope expansion, violates locked contract, timeline explosion

### Option 3: Phased Architecture (Recommended)
- **Position:** Both are correct at different phases; Phase 1B is **Foundation Layer** for future Integration & Certification Engine
- **Action:** Implement Phase 1B contract as-is (I1 generation service), design architecture to support future lifecycle phases
- **Benefit:** Honors locked contract, preserves evolution path, GUI-first strategy fits naturally

---

## Recommended Strategy: PHASED ARCHITECTURE

**Phase 1B (Foundation Layer):** Implement locked contract
- Introduction I1 generation service ONLY
- Provider abstraction, TestProvider, RealProvider with safe-by-default initialization
- API route POST /api/project-llm/generate-i1
- ProjectLLMService with generateIntroductionI1()
- Server-side auth/authz (tutorial author + resource access)
- AI metadata fields in tutorial_sections (generatedByAi, aiModelUsed, generationJobId)
- Manual human approval via existing Composer editor
- **Scope:** 1 block type, 1 API endpoint, 1 generation method

**Phase 2+ (Integration & Certification Engine):** Extend foundation
- Add I2, I3, I4, I5, I6 generation services
- Add candidate workflow (transient candidates, approval/rejection loops)
- Add GUI surfaces (Dashboard, Candidate Review, Quality Reports, Settings)
- Add quality gates (validation, hallucination detection, certification)
- Add publishing workflow (certified candidates → production blocks)
- **Scope:** 6 block types, 12+ GUI surfaces, full lifecycle

**Architectural Continuity:**
- Phase 1B designs interfaces to support Phase 2+ extensions
- Provider abstraction supports multiple block types
- API route pattern supports /generate-{i1|i2|i3|i4|i5|i6}
- ProjectLLMService supports method-per-block-type pattern
- Database schema supports future quality metrics (qualityScore, hallucinationScore, regenerationCount)

---

## 15-Area Reconciliation Matrix

| # | Area | Contract (Narrow) | Lifecycle (Broad) | Reconciliation Decision |
|---|------|-------------------|-------------------|-------------------------|
| 1 | **Scope** | I1 automation only | 6 block types (I1-I6) | Phase 1B = I1 only. Phase 2+ adds I2-I6. Architecture supports extension. |
| 2 | **Service Purpose** | AI generation service | Integration & Certification Engine | Phase 1B = generation foundation. Phase 2+ adds certification, quality gates. |
| 3 | **Candidate Workflow** | No candidate_blocks table (transient) | Implies candidate review/approval | Phase 1B = transient (no DB table). Phase 2+ adds candidate workflow if needed. |
| 4 | **Human Approval** | Reuse Composer editor | Implies dedicated review UI | Phase 1B = reuse Composer. Phase 2+ adds dedicated review UI (GUI-02). |
| 5 | **Quality Gates** | Basic Zod validation | Hallucination detection, certification | Phase 1B = validation only. Phase 2+ adds quality metrics, hallucination detection. |
| 6 | **Publishing** | Manual (Composer publish button) | Implies automated publishing pipeline | Phase 1B = manual. Phase 2+ adds publishing automation if needed. |
| 7 | **GUI Surfaces** | None (API only) | 12 GUI surfaces documented | Phase 1B = API only. Phase 2+ adds GUI surfaces sequentially (GUI-first strategy). |
| 8 | **Provider Strategy** | Abstract interface, selection deferred | No provider discussion | Phase 1B = abstraction + TestProvider + RealProvider. Phase 2+ decides provider selection strategy. |
| 9 | **Multi-Block Support** | Single block type (I1) | 6 block types | Phase 1B = I1 service. Phase 2+ extends pattern to I2-I6. |
| 10 | **Workflow Orchestration** | Single generate-validate-return | Complex candidate lifecycle | Phase 1B = simple generate. Phase 2+ adds workflow orchestration. |
| 11 | **Actor Model** | Implicit (human author, AI provider) | Explicit (Project AI, External AI, Human) | Phase 1B = implicit. Phase 2+ documents actor model explicitly (see GUI-first strategy). |
| 12 | **Quality Metrics** | Database fields defined, not computed | Active quality scoring | Phase 1B = fields exist (null values). Phase 2+ computes quality metrics. |
| 13 | **Regeneration** | Not supported | Regeneration loops | Phase 1B = no regeneration. Phase 2+ adds regeneration workflow. |
| 14 | **Certification** | Not mentioned | Certification before publish | Phase 1B = no certification. Phase 2+ adds certification gates. |
| 15 | **Integration Vision** | Component-level (I1 generation) | System-level (end-to-end lifecycle) | Phase 1B = component foundation. Phase 2+ integrates into system lifecycle. |

---

## Architectural Design Decisions for Phase 1B Foundation

To support future phases, Phase 1B implementation must design for extensibility:

### 1. Service Layer Pattern
```typescript
// Phase 1B: Single method
class ProjectLLMService {
  async generateIntroductionI1(request: GenerationRequest): Promise<GenerationResponse> { }
}

// Phase 2+ ready: Method-per-block-type pattern supports extension
class ProjectLLMService {
  async generateIntroductionI1(request: GenerationRequest): Promise<GenerationResponse> { }
  async generateIntroductionI2(request: GenerationRequest): Promise<GenerationResponse> { }
  async generateIntroductionI3(request: GenerationRequest): Promise<GenerationResponse> { }
  // ... I4, I5, I6
}
```

### 2. API Route Pattern
```typescript
// Phase 1B: Single endpoint
POST /api/project-llm/generate-i1

// Phase 2+ ready: Endpoint-per-block-type pattern
POST /api/project-llm/generate-i1
POST /api/project-llm/generate-i2
POST /api/project-llm/generate-i3
// ... i4, i5, i6
```

### 3. Provider Abstraction
```typescript
// Phase 1B: Interface supports any block type
interface ProjectLLMProvider {
  generateIntroduction(prompt: string): Promise<GeneratedContent>
}

// Phase 2+ ready: Same interface serves all block types
// No provider interface changes needed for I2-I6
```

### 4. Database Schema
```sql
-- Phase 1B: All fields defined
tutorial_sections:
  generatedByAi boolean
  aiModelUsed text
  generationJobId uuid
  qualityScore numeric    -- NULL in Phase 1B
  hallucinationScore numeric  -- NULL in Phase 1B
  regenerationCount integer   -- NULL in Phase 1B

-- Phase 2+: Populate quality fields
-- No schema migration needed
```

### 5. Authorization Pattern
```typescript
// Phase 1B: Resource-level auth established
await requireTutorialAuthorCreatePermission(session)
await requireSubtopicAccess(subtopicId, session.userId)
await requireBrandAccess(brandId, session.userId)

// Phase 2+ ready: Same pattern applies to all block types
// No authorization changes needed for I2-I6
```

---

## Phase Boundary Definitions

### Phase 1B Scope (Foundation Layer)
**Locked Contract Deliverables:**
1. ProjectLLMService with generateIntroductionI1()
2. TestProvider (fixture-based, no external API)
3. RealProvider (OpenAI/Anthropic abstraction, safe-by-default init)
4. Provider abstraction interface
5. API route POST /api/project-llm/generate-i1
6. Server-side auth/authz (tutorial author + resource access)
7. AI metadata storage (tutorial_sections fields)
8. Zod validation (IntroductionI1AuthorContentSchema)
9. E2E test with TestProvider
10. Manual approval via Composer editor

**Out of Scope:**
- I2, I3, I4, I5, I6 generation
- candidate_blocks table
- Dedicated review UI
- Quality scoring computation
- Hallucination detection
- Certification gates
- Automated publishing
- Regeneration workflows
- GUI surfaces (Dashboard, Settings, Reports)

### Phase 2+ Scope (Integration & Certification Engine)
**Future Extensions:**
1. I2-I6 generation services (5 additional block types)
2. GUI-01: Dashboard (Project AI activity overview)
3. GUI-02: Candidate Review UI (approval/rejection interface)
4. GUI-03: Quality Reports (metrics, hallucination analysis)
5. GUI-04: Settings Panel (provider config, model selection)
6. GUI-05 through GUI-12: Additional surfaces per GUI-first strategy
7. Candidate workflow (if transient model proves insufficient)
8. Quality scoring engine (qualityScore, hallucinationScore computation)
9. Hallucination detection service
10. Certification gates (quality thresholds before publish)
11. Publishing automation (certified candidates → production)
12. Regeneration workflow (rejection → regenerate loop)
13. Actor model documentation (Project AI, External AI, Human responsibilities)
14. Workflow orchestration (multi-step lifecycle coordination)

---

## GUI-First Strategy Integration

The GUI-first strategy (documented in `PROJECT_LLM_GUI_FIRST_STRATEGY.md`) fits naturally into the phased architecture:

**Phase 1B:** No GUI surfaces (API-only foundation)
- Composer editor reused for human approval
- No Project AI GUI components

**Phase 2 (GUI Specification):** Sequential GUI approval
1. GUI-01: Dashboard specification → approval
2. GUI-02: Candidate Review → approval
3. GUI-03: Quality Reports → approval
4. ... (GUI-04 through GUI-12)

**Phase 3 (GUI Implementation):** After all 12 GUI surfaces approved
- Implement GUI surfaces against Phase 1B foundation
- Extend ProjectLLMService for GUI data endpoints
- Add GUI-specific API routes

**Architecture Alignment:**
- Phase 1B service layer designed to support GUI data needs
- API route pattern extensible to GUI data endpoints
- Authorization pattern reusable for GUI access control

---

## Reconciliation Impact Assessment

### Changes Required to Phase 1B Implementation
**None.** The locked contract remains valid as Phase 1B Foundation Layer.

### Documentation Updates Required
1. Update `PROJECT_LLM_PHASE_1B_IMPLEMENTATION_CONTRACT.md` header to clarify:
   - "Phase 1B: Foundation Layer for Integration & Certification Engine"
   - Add forward reference to this reconciliation document
2. Update `PROJECT_LLM_GUI_FIRST_STRATEGY.md` to reference phased architecture
3. Create Phase 2+ planning documents (after Phase 1B complete)

### No Changes Required
- Phase 1B locked contract (commit a433d837) remains APPROVED & LOCKED
- No code implementation changes
- No timeline changes
- No scope expansion

---

## Risk Analysis

### Risk: Phase 1B Foundation Insufficient for Phase 2+ Extensions
**Mitigation:** Architectural design decisions (section above) ensure extensibility
**Validation:** Review provider abstraction, API route pattern, service layer pattern before Phase 1B implementation

### Risk: GUI-First Strategy Reveals Phase 1B Gaps
**Mitigation:** GUI specification phase (Phase 2) happens BEFORE GUI implementation
**Validation:** Each GUI specification reviewed against Phase 1B foundation capabilities

### Risk: Transient Candidate Model Insufficient
**Mitigation:** Phase 1B implements transient model (locked contract), Phase 2+ can add candidate_blocks table if needed
**Validation:** Phase 1B user testing reveals whether candidate persistence needed

### Risk: Quality Metrics Missing from Foundation
**Mitigation:** Database fields already defined (qualityScore, hallucinationScore, regenerationCount), Phase 2+ populates them
**Validation:** No schema migration needed for Phase 2+ quality scoring

---

## Decision Request

**Human Architecture Authority Approval Required:**

1. **Accept Phased Architecture Strategy?** (Option 3 from reconciliation approach)
   - [ ] APPROVED — Phase 1B is Foundation Layer, Phase 2+ extends to Integration & Certification Engine
   - [ ] REJECTED — Provide alternative reconciliation strategy

2. **Accept 15-Area Reconciliation Matrix?**
   - [ ] APPROVED — All 15 areas reconciled as documented
   - [ ] REJECTED — Identify areas requiring revision

3. **Accept Phase Boundary Definitions?**
   - [ ] APPROVED — Phase 1B scope clear, Phase 2+ scope deferred
   - [ ] REJECTED — Adjust phase boundaries

4. **Accept Architectural Design Decisions?**
   - [ ] APPROVED — Service layer, API routes, provider abstraction, database schema, authorization pattern support Phase 2+ extensions
   - [ ] REJECTED — Identify design gaps

5. **Proceed with Phase 1B Foundation Implementation?**
   - [ ] APPROVED — Begin Phase 1B implementation per locked contract
   - [ ] REJECTED — Additional reconciliation required

6. **Proceed with GUI-First Strategy (Phase 2)?**
   - [ ] APPROVED — After Phase 1B complete, begin GUI-01 specification
   - [ ] REJECTED — Alternative strategy required

---

## Next Steps (Pending Approval)

### If Approved
1. Update Phase 1B contract header with reconciliation reference
2. Begin Phase 1B Foundation implementation per locked contract
3. After Phase 1B complete: Begin GUI-01 (Dashboard) specification
4. Sequential GUI approval: GUI-01 → GUI-02 → ... → GUI-12
5. After all GUI approved: Begin Phase 3 (GUI implementation)

### If Rejected
1. Human Architecture Authority provides feedback
2. Revise reconciliation document
3. Re-submit for approval

---

## Appendix: Terminology Alignment

**Project LLM:**
- Phase 1B = "AI Generation Service" (tactical, narrow)
- Phase 2+ = "Integration & Certification Engine" (strategic, broad)

**Lifecycle Stages:**
- Phase 1B = Generation + Manual Approval
- Phase 2+ = Generation + Candidate Review + Quality Gates + Certification + Publishing

**Actor Model:**
- Phase 1B = Implicit (human author requests AI generation, approves via Composer)
- Phase 2+ = Explicit (Project AI generates, External AI provides models, Human certifies)

**Quality Assurance:**
- Phase 1B = Validation (Zod schema, structural correctness)
- Phase 2+ = Certification (validation + quality scoring + hallucination detection + human certification)

---

**Document Status:** DRAFT — Awaiting Human Architecture Authority Approval  
**Approval Authority:** Human Architecture Authority  
**Approval Date:** (Pending)  
**Approval Decision:** (Pending)
