# Project LLM Lifecycle Architecture V1 — Targeted Correction Audit

**Document:** PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1.md  
**Audit Date:** 2026-10-01  
**Audit Type:** Targeted correction for evidence accuracy and implementation status  
**Status:** CORRECTION IN PROGRESS

---

## CORRECTION MANDATE

RETURN TO DRAFT — TARGETED REFERENCE ARCHITECTURE CORRECTION

**Core architecture ACCEPTED:**
- External AI = Block Factory
- Project LLM = Integration & Certification Engine
- Human = Approval & Architecture Authority
- Two distinct handovers preserved
- UBRC/ILS/LSNB/RSSB boundaries correct
- CERTIFICATION_READY ≠ CERTIFIED preserved

**Corrections REQUIRED:**
1. Remove invented repository paths (mark as illustrative)
2. Mark hypothetical evidence as illustrative examples
3. Correct "implemented" language to "architecture aligns with"
4. Apply generic architecture principle (lifecycle independent of implementation)
5. Clarify RSSB applicability determination
6. Preserve Phase 1A decision space

---

## CORRECTION CATEGORY 1: ILLUSTRATIVE REPOSITORY PATHS

### Issues Found

**Step 2: Project LLM Inspects Repository** section contains specific repository structure that appears as verified fact:

```text
Current Block Architecture:
- TutorialBlock union type
- BlockType discriminator
- Canonical schema model
...

Current UBRC Model:
- data-block-id (required)
...

Current ILS Model:
- Universal ILS runtime
...
```

**Later sections contain:**
- `packages/tutorial-engine/src/types/blocks.ts`
- `packages/tutorial-engine/src/schemas/`
- `packages/tutorial-engine/src/builders/`
- `packages/tutorial-engine/src/renderers/registry.ts`
- `apps/realtutorialhub-web/src/features/tutorial-composer/`
- `packages/tutorial-engine/src/runtime/ubrc/`
- `packages/tutorial-engine/src/runtime/ils/`
- `packages/tutorial-engine/src/runtime/lsnb/`
- `packages/tutorial-engine/src/blocks/__tests__/`

### Correction Required

Replace specific repository structure with **generic architectural requirements** that Project LLM must discover dynamically.

**New Approach:**

```markdown
### Step 2: Project LLM Discovers Current Repository Implementation

**ARCHITECTURE PRINCIPLE:**
The Project LLM must inspect the ACTUAL repository at the time
a block is created to discover current implementation details.

The lifecycle architecture defines WHAT must be discovered,
not HOW the current repository implements it.

**Required Discoveries:**

1. **Current Canonical Block Model**
   - Block type definitions
   - Schema patterns
   - Type system

2. **Current UBRC Requirements**
   - Required block identity attributes
   - Runtime observation mechanisms
   - ActiveBlock context participation

3. **Current ILS Integration**
   - Passive vs active participation model
   - Telemetry boundaries
   - Completion evaluation approach

4. **Current LSNB Relationship**
   - Progress role classification system
   - Completion → navigation progression model
   - Block-level vs universal control

5. **Current RSSB Applicability**
   - Which block types require RSSB
   - Synchronization boundaries
   - State ownership model

6. **Current Tutorial Composer Architecture**
   - Block registration patterns
   - Palette integration
   - Document serialization

7. **Current Renderer Architecture**
   - Renderer registry pattern
   - Block-to-component mapping
   - Runtime rendering approach

8. **Current Testing & Validation Framework**
   - Test organization
   - Validation layers
   - Evidence requirements

**These discoveries are then incorporated into the
block-specific External AI Creation Brief.**
```

### Rationale

- **Repository implementation can evolve** without rewriting this architecture
- **Project LLM discovers current truth** dynamically
- **Lifecycle remains reusable** across all future blocks
- **Prevents stale documentation** (paths don't become outdated)

---

## CORRECTION CATEGORY 2: HYPOTHETICAL EVIDENCE

### Issues Found

Summary Block example contains results presented as if they are actual evidence:

- `UBRC VERIFICATION: PASS`
- `ILS VERIFICATION: PASS`
- `LSNB VERIFICATION: PASS`
- `evidence file: ubrc-runtime-test-summary-block.log`
- Database records created
- `95% coverage`
- `<100ms performance`
- `WCAG 2.1 AA: ✓`
- `Security PASS`
- `E2E PASSED`
- `CERTIFICATION_READY`
- `feature/summary-block` branch
- `abc123...` commit
- `Git commit: abc123...`

### Correction Required

**Add prominent disclaimer before Summary Block example:**

```markdown
## WORKED EXAMPLE: SUMMARY BLOCK

> **⚠️ ILLUSTRATIVE EXAMPLE ONLY — NOT ACTUAL EVIDENCE**
>
> The following worked example demonstrates the **intended lifecycle flow**
> for creating a Summary Block through the External AI → Project LLM → Platform
> integration process.
>
> **THIS IS NOT EVIDENCE that:**
> - Summary Block has been implemented
> - Summary Block has been certified
> - The runtime verification results are real
> - The test coverage values are actual
> - The performance metrics are measured
> - The Git commits/branches exist
> - The evidence files exist
>
> All validation results, evidence filenames, database records, Git commits,
> coverage percentages, performance values, and certification statuses in
> this example are **hypothetical** to illustrate what Project LLM would
> produce during an actual block integration.
>
> **Actual Summary Block integration** (if performed in the future) would
> produce real evidence through the Project LLM validation pipeline,
> independently verified against the running repository and platform runtimes.

### Step 1: Human Defines Requirement

...
```

**Additional correction for every evidence claim:**

Prefix with `[EXAMPLE]` or similar marker:

```text
[EXAMPLE] UBRC VERIFICATION: PASS
[EXAMPLE] Evidence: ubrc-runtime-test-summary-block.log
[EXAMPLE] Database: ils_block_activity table screenshot
[EXAMPLE] Coverage: 95%
[EXAMPLE] Performance: <100ms
[EXAMPLE] Git Branch: feature/summary-block
[EXAMPLE] Commit: abc123...
```

Or group them in clearly marked sections:

```markdown
### Step 16: Project LLM Verifies UBRC Runtime

**[ILLUSTRATIVE EXAMPLE]**

In an actual Summary Block integration, Project LLM would:

1. Render the block in actual Tutorial Page
2. Inspect DOM for required identity attributes
3. Verify ActiveBlockContext recognition
4. Verify universal runtime observation
5. Verify identity propagation to ILS
6. Produce evidence package

Example output (hypothetical):
```text
UBRC RUNTIME VERIFICATION
Status: PASS
Evidence: ubrc-runtime-test-summary-block.log
...
```
**[END EXAMPLE]**
```

### Rationale

- **Prevents future confusion** about whether Summary Block exists
- **Clearly distinguishes** architecture from implementation evidence
- **Preserves example value** without creating false evidence trail

---

## CORRECTION CATEGORY 3: "IMPLEMENTED" LANGUAGE

### Issues Found

**Audit Findings section** states:

> "Phase 0.2: Gate 1 and Gate 2 approval gates implemented"
> "Phase 0.5: Handoff protocol implemented"
> "Phase 0.6: Evidence and certification model implemented"
> "Phase 0.7: Validation pipeline implemented"
> "Phase 0.8: STOP conditions and escalation implemented"
> "Phase 0.9: Rollback and checkpoint model implemented"

But the document also says:

> "Architecture defined, GUI not yet built"
> "Phase 1A: Project LLM Architecture Design" (future work)
> "Phase 1B: Project LLM Engine Implementation" (future work)

**This is contradictory.**

### Correction Required

Replace "implemented" with evidence-accurate language:

```markdown
### Compliance with Phase 0 Governance ✓

This architecture aligns with Phase 0.1-0.10:

- **Phase 0.1:** Actor boundaries (External AI/Project LLM/Human) are architecturally defined and separated
- **Phase 0.2:** Gate 1 and Gate 2 approval gates are incorporated into the lifecycle architecture
- **Phase 0.3:** Repository modification boundaries are represented in the STOP conditions and Project LLM responsibility model
- **Phase 0.4:** Runtime boundaries are incorporated into the platform integration requirements
- **Phase 0.5:** Handoff protocol is architecturally defined with two distinct handovers
- **Phase 0.6:** Evidence and certification model distinguishes candidate evidence from production certification
- **Phase 0.7:** Validation pipeline architecture incorporates L1-L8 validation layers
- **Phase 0.8:** STOP conditions and escalation are architecturally defined as mandatory
- **Phase 0.9:** Rollback and checkpoint model is architecturally represented
- **Phase 0.10:** Versioning model is acknowledged (V2 of this document would follow Phase 0.10 procedures)

**Implementation Status:**
- Architecture: DEFINED
- Project LLM Engine: NOT YET IMPLEMENTED (Phase 1B)
- Control Plane GUI: NOT YET IMPLEMENTED (Phase 1E)
- First Block Integration: NOT YET PERFORMED (Phase 1F)

**Phase 1A-1F remain future implementation work.**
```

### Rationale

- **Accurate status representation** (architecture ≠ implementation)
- **Preserves Phase 1 decision space** (implementation details not pre-decided)
- **Honest about current state** (documented but not built)

---

## CORRECTION CATEGORY 4: GENERIC ARCHITECTURE PRINCIPLE

### Current Problem

The document mixes:
- Generic lifecycle architecture
- Specific repository implementation examples
- Block-specific integration details

This violates the separation:

```text
Lifecycle Architecture (generic, reusable)
    ≠
Repository Implementation (dynamic, discovered)
    ≠
Block-Specific Brief (current, targeted)
```

### Correction Required

**Add new section after PURPOSE AND SCOPE:**

```markdown
---

## ARCHITECTURE PRINCIPLE: GENERIC LIFECYCLE, DYNAMIC REPOSITORY DISCOVERY

**Core Principle:**

This document defines the **generic, reusable lifecycle architecture**
for creating ANY tutorial block through the External AI → Human → Project LLM
→ Platform flow.

**It does NOT define current repository implementation details.**

Even though platform features (UBRC, ILS, LSNB, RSSB, Tutorial Composer,
Renderer, etc.) already exist in the repository, this document intentionally
remains **implementation-independent**.

### Three-Layer Separation

**Layer 1: Lifecycle Architecture (This Document)**
- Defines WHAT must happen
- Defines WHO is responsible
- Defines WHEN decisions occur
- Defines WHERE boundaries exist

**Does NOT define:**
- Current repository file paths
- Current implementation mechanisms
- Current runtime internal details
- Current database schemas
- Specific API endpoints

**Layer 2: Project LLM Repository Discovery (Dynamic)**

When a block is created, Project LLM:
1. Inspects the ACTUAL current repository
2. Discovers current implementation of required capabilities
3. Generates block-specific External AI Creation Brief
4. Adapts candidate to current platform conventions
5. Verifies integration against current runtime implementation

**Layer 3: Block-Specific Creation Brief (Generated)**

For each block (e.g., Summary, Introduction, Quiz):
- Contains current platform compatibility requirements
- Generated against specific repository revision
- Includes discovered implementation constraints
- Updated if platform evolves

### Why This Separation Matters

**Benefit 1: Future-Proof Architecture**

Repository implementation can evolve without rewriting this document.

Example: If UBRC moves from one file structure to another, the lifecycle
architecture remains valid. Only Project LLM discovery logic updates.

**Benefit 2: Reusable Process**

The same lifecycle architecture works for:
- Summary Block (instructional, ILS participation)
- Quiz Block (interactive, RSSB participation)
- Code Block (practice, ILS + RSSB)
- Introduction Block (structural, different LSNB role)
- Future blocks not yet conceived

**Benefit 3: Accurate Status**

Architecture document does not claim implementation details it hasn't verified.

**Benefit 4: Preserves Phase 1A Decision Space**

Phase 1A (Project LLM Architecture Design) remains responsible for:
- Repository discovery mechanism
- Architecture audit framework
- Adaptation engine design
- Integration sequencing
- Evidence storage architecture

This document does not pre-decide those implementation details.

### Application to Summary Block Example

The Summary Block worked example demonstrates the **lifecycle flow**,
not the **current repository implementation**.

Specific repository paths, component names, file locations, database
tables, and runtime mechanisms in that example are **illustrative**
to show what Project LLM would discover and work with.

They are NOT verified claims about the current repository state.

---
```

### Rationale

- **Establishes clear boundary** between architecture and implementation
- **Prevents misinterpretation** of examples as repository documentation
- **Preserves reusability** across future blocks and platform evolution
- **Protects Phase 1A decision space**

---

## CORRECTION CATEGORY 5: RSSB APPLICABILITY

### Issue Found

Summary Block example states:

> `RSSB Participation: NOT APPLICABLE`

Reasoning given: "Summary is informational/instructional"

### Problem

This makes a universal applicability decision based on one example.

Different block types may have different RSSB requirements:
- Summary: possibly N/A
- Quiz: possibly required (resume quiz state)
- Code Editor: possibly required (resume code state)
- Video Player: possibly required (resume playback position)

### Correction Required

Replace specific RSSB decision with:

```markdown
### Step 19: Project LLM Determines RSSB Applicability

**RSSB applicability is determined by Project LLM during the
architecture audit based on:**

1. Block classification (instructional/interactive/media/practice)
2. State persistence requirements
3. Cross-session resume requirements
4. Current platform RSSB model

**For the Summary Block example:**

Project LLM audit determines:
- Block type: Instructional (informational)
- State persistence: None required
- Cross-session resume: Not applicable
- RSSB participation: N/A

**Result:** RSSB verification skipped for this block type.

**Note:** Different block types may have different RSSB requirements.
Quiz blocks, code editors, video players, or practice exercises may
require RSSB participation for state synchronization.

**RSSB applicability is NOT universally determined by this architecture;
it is determined per-block during Project LLM integration audit.**
```

### Rationale

- **Avoids universal assumptions** from single example
- **Preserves per-block determination** by Project LLM
- **Acknowledges different block types** have different requirements
- **Does not constrain** future block RSSB participation

---

## CORRECTION CATEGORY 6: PRESERVE PHASE 1A DECISION SPACE

### Issue

Some sections appear to pre-decide implementation details that Phase 1A
should determine.

### Correction Required

**Add to Phase 1 Next Steps section:**

```markdown
## PHASE 1 NEXT STEPS

**IMPORTANT: This reference architecture defines the lifecycle model
and actor responsibilities. Phase 1A-1F remain responsible for actual
implementation decisions.**

**This document does NOT pre-decide:**

- Project LLM internal architecture (Phase 1A)
- Repository discovery mechanism implementation (Phase 1A)
- Architecture audit framework implementation (Phase 1A)
- Adaptation engine algorithms (Phase 1A)
- Integration sequencing logic (Phase 1A)
- Evidence storage architecture (Phase 1C)
- External AI API integration method (Phase 1D)
- Control plane database schema (Phase 1D)
- skillhubcore-admin UI/UX design (Phase 1E)
- Candidate package file format details (Phase 1B)
- Validation pipeline implementation (Phase 1C)

**Phase 1A must independently design those systems based on:**
- This lifecycle architecture (guidance)
- Phase 0.1-0.10 governance (constraints)
- Actual repository capabilities (current state)
- Engineering requirements (performance, scalability, maintainability)

### Phase 1A: Project LLM Architecture Design
...
```

### Rationale

- **Protects future design space**
- **Clarifies architecture role** (guidance, not implementation specification)
- **Prevents premature implementation decisions**

---

## FINAL CORRECTION SUMMARY

### Changes Required

1. **Add generic architecture principle section** (after PURPOSE AND SCOPE)
2. **Add illustrative example disclaimer** (before Summary Block worked example)
3. **Mark all hypothetical evidence** as [EXAMPLE] or similar
4. **Replace specific repository paths** with generic discovery requirements
5. **Correct "implemented" language** to "architecture aligns with" in audit section
6. **Replace RSSB N/A decision** with dynamic applicability determination
7. **Add Phase 1A decision space preservation** note

### What NOT to Change

- Three actor model
- Two handovers
- Responsibility matrix
- UBRC/ILS/LSNB/RSSB boundaries
- CERTIFICATION_READY ≠ CERTIFIED
- STOP boundaries
- Evidence model
- Checkpoint/rollback model
- Composer integration boundary
- Control plane future architecture
- Phase 1 roadmap structure

### Document Status After Correction

- **Document Type:** Reference Architecture (unchanged)
- **Status:** DRAFT (unchanged)
- **Authority:** Derived from Phase 0.1-0.10 (unchanged)
- **Purpose:** Generic lifecycle architecture (clarified)
- **Implementation Status:** Architecture defined, implementation future work (clarified)
- **Human Review:** REQUIRED (unchanged)

---

## AUDIT RESULT

**Corrections:** 6 categories identified  
**Severity:** MEDIUM (architectural intent correct, evidence accuracy needs correction)  
**Recommendation:** Apply targeted corrections, create new commit, submit for Human Architecture Authority review

**Core architecture APPROVED for direction.**  
**Evidence accuracy corrections REQUIRED before final approval.**

---

## NEXT STEPS

1. Apply corrections to PROJECT-LLM-EXTERNAL-AI-BLOCK-LIFECYCLE-V1.md
2. Perform targeted re-audit (verify corrections applied)
3. Create new git commit (correction commit, not amend)
4. Submit corrected document for Human Architecture Authority review
5. Await Human decision: APPROVE REFERENCE ARCHITECTURE or RETURN TO DRAFT

**Do NOT:**
- Freeze as Phase 0.11 governance
- Begin Phase 1 implementation
- Modify Phase 0.1-0.10 contracts
- Treat as final approved architecture

---

## CORRECTION AUTHORITY

**Human Architecture Authority feedback:** 2026-10-01  
**Correction Audit:** 2026-10-01  
**Status:** Ready for correction application
