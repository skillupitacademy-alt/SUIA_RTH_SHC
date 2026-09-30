# Phase 0.10 Step 5: Contract Lifecycle State Design

**Created:** 2026-09-30  
**Status:** IN PROGRESS (Step 5 of Phase 0.10 methodology)  
**Authority:** Phase 0.10 governance design process  
**Purpose:** Design complete lifecycle state model for frozen governance contracts, distinguishing active, superseded, and historical states with precise transition rules and governance semantics

---

## DESIGN FOUNDATION

**Step 3 Established:**
- Identity model with 6 lifecycle states (DRAFT, FROZEN, SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED)

**Step 4 Established:**
- Version increment triggers
- Breaking vs non-breaking changes
- Compatibility semantics
- Migration procedures

**Step 5 Must Define:**
1. Complete lifecycle state taxonomy
2. State transition triggers and rules
3. Relationship between states and versioning
4. EFFECTIVE vs FROZEN distinction (if any)
5. SUPERSEDED vs HISTORICAL distinction (if any)
6. State governance (who can transition states)

---

## OBSERVED STATE TERMINOLOGY

**User Instruction:** Treat EFFECTIVE, SUPERSEDED, HISTORICAL as **design candidates**, not existing repository facts.

**From Step 2 Dependency Map (observed in Phase 0.1-0.9):**

### Phase 0.5 Handoff States
- ACCEPTED
- REJECTED
- ARCHITECTURE_STOP
- ACCEPTED_WITH_WARNINGS

### Phase 0.6 Certification States
- DECLARED
- DOCUMENTED
- OBSERVED
- VERIFIED
- VALIDATED
- CERTIFIED
- APPROVED

### Phase 0.7 Validation Levels
- L0 (Requirement) through L8 (Certification Readiness)

### Phase 0.8 STOP States
- DETECTED, DECLARED, CONTAINED, CLASSIFIED, ESCALATED, DECISION, CORRECTIVE ACTION, EVIDENCE, REVALIDATION, RESOLVED, RESUMED

### Phase 0.9 Rollback States
- REQUESTED, ASSESSED, AUTHORIZATION_REQUIRED, AUTHORIZED, CONTAINED, EVIDENCE_PRESERVED, PRECHECK, READY, IN_PROGRESS, VERIFICATION_REQUIRED, VERIFIED, REVALIDATION_REQUIRED, REVALIDATED, RECOVERED, RESUMED, FAILED, STOPPED, REJECTED, CANCELLED, CLOSED

### Step 3 Proposed Contract Lifecycle States
- DRAFT
- FROZEN
- SUPERSEDED
- DEPRECATED
- ARCHIVED
- ABANDONED

**Observation:** Multiple state systems exist for different purposes (handoff, certification, validation, STOP, rollback, contract lifecycle)

**Question:** Are EFFECTIVE, SUPERSEDED, HISTORICAL contract lifecycle states or something else?

---

## LIFECYCLE STATE DESIGN GOALS

1. **Unambiguous Interpretation:** Each state has precise, non-overlapping meaning
2. **Transition Clarity:** Rules for when/how to transition between states
3. **Authority Clarity:** Who can transition states
4. **Versioning Integration:** States interact predictably with versions
5. **Historical Preservation:** Historical states remain accessible (Phase 0.9 requirement)
6. **Audit Trail:** State transitions recorded immutably
7. **Tooling Support:** States are machine-parseable for governance automation

---

## PROPOSED COMPREHENSIVE LIFECYCLE STATE MODEL

### Lifecycle State Taxonomy

**9 Lifecycle States:**

| State | Meaning | Authority Required | Terminal State |
|-------|---------|-------------------|----------------|
| **DRAFT** | Under development, not frozen, may change | None (author) | NO |
| **REVIEW** | Draft submitted for review, awaiting approval | Author | NO |
| **APPROVED_FOR_FREEZE** | Review complete, ready to freeze | Human Architecture Authority | NO |
| **FROZEN** | Immutable, authoritative, current version | Human Architecture Authority | NO |
| **SUPERSEDED** | Replaced by newer version, historical reference | Automatic (when next version FROZEN) | YES |
| **DEPRECATED** | Discouraged but not replaced, use at own risk | Human Architecture Authority | NO |
| **ARCHIVED** | Removed from active use, historical only | Human Architecture Authority | YES |
| **ABANDONED** | Draft never frozen, discarded | Author or Human Architecture Authority | YES |
| **REVOKED** | Previously frozen, now invalid (rare, serious defect) | Human Architecture Authority | YES |

**Derived Designation (not a state):**

| Designation | Meaning | Derivation Rule |
|-------------|---------|-----------------|
| **EFFECTIVE** | Current authoritative version | `EFFECTIVE ≡ (status = FROZEN) AND (supersededBy = null)` |

**Historical Category (not a state):**

Encompasses contracts no longer active:
- SUPERSEDED
- DEPRECATED
- ARCHIVED
- ABANDONED
- REVOKED

**State Categories:**

**Active States (contract in use):**
- DRAFT (pre-freeze development)
- REVIEW (pre-freeze approval process)
- APPROVED_FOR_FREEZE (pre-freeze, awaiting freeze action)
- FROZEN / EFFECTIVE (authoritative version)

**Historical States (contract superseded or retired):**
- SUPERSEDED (replaced by V2)
- DEPRECATED (discouraged, no replacement yet)
- ARCHIVED (removed from active governance)
- ABANDONED (draft never completed)
- REVOKED (invalidated due to serious defect)

---

## STATE DEFINITIONS (DETAILED)

### DRAFT

**Definition:** Contract under development, not yet frozen, may change at any time.

**Properties:**
- Mutable (can be edited freely)
- Not authoritative (not binding)
- Not referenceable by frozen contracts (frozen contracts cannot depend on DRAFT)
- Versioned (e.g., Phase 0.10 V1 DRAFT)

**Who Can Create:** Author (External AI, Project LLM, Human)

**Who Can Edit:** Author

**Who Can Transition:** Author (to REVIEW), Human Architecture Authority (to ABANDONED)

**Use Cases:**
- Initial contract development
- Iterative refinement before freeze
- Experimental governance proposals

**Example:** Phase 0.10 V1 DRAFT (current state during Step 1-18 of methodology)

---

### REVIEW

**Definition:** Draft submitted for formal review, awaiting approval decision.

**Properties:**
- Should not change during review (informal freeze)
- Under review by Human Architecture Authority
- Not yet authoritative
- May be returned to DRAFT if changes required

**Who Can Transition From DRAFT:** Author

**Who Can Approve:** Human Architecture Authority

**Approval Outcomes:**
- APPROVED_FOR_FREEZE → proceed to FROZEN
- RETURN_TO_DRAFT → back to DRAFT with feedback
- REJECTED → ABANDONED

**Use Cases:**
- Pre-freeze quality gate
- Stakeholder review period
- Final approval checkpoint

**Example:** Phase 0.10 V1 REVIEW (Step 19 decision gate)

---

### APPROVED_FOR_FREEZE

**Definition:** Review complete and approved, contract ready to freeze but not yet frozen.

**Properties:**
- No further changes without returning to REVIEW
- Awaiting freeze action (mechanical step)
- Essentially frozen but not yet marked FROZEN

**Who Can Transition From REVIEW:** Human Architecture Authority

**Who Can Freeze:** Author or designated freezer (mechanical action following approval)

**Transition Trigger:** Approval decision made, awaiting freeze execution

**Use Cases:**
- Separation of approval decision from freeze action
- Allows freeze preparation (commit message, metadata update)
- Optional state (can go directly REVIEW → FROZEN)

**Example:** Phase 0.10 V1 APPROVED_FOR_FREEZE (if Step 19 approves but freeze action delayed)

---

### FROZEN

**Definition:** Immutable, authoritative version of contract, binding on all parties.

**Properties:**
- **Substantively Immutable:** Governance meaning and requirements cannot change
- **Authoritative:** Binding governance rules
- **Referenceable:** Other contracts may depend on FROZEN contracts
- **Versioned:** Each version frozen separately
- **Timestamped:** Freeze date recorded
- **Revision-Stamped:** Git commit hash recorded

**Who Can Transition From APPROVED_FOR_FREEZE:** Author or freezer

**Who Can Modify:** NONE for substantive content. Limited corrections permitted per Erratum Protocol (see below).

### Frozen Contract Modification Rules

**PROHIBITED (requires new version):**
- Substantive governance changes (requirements, authority, procedures)
- Changes to dependencies
- Changes to compliance rules
- Changes to scope or definitions that alter meaning

**PERMITTED (non-substantive erratum only):**
- Typographical corrections (e.g., "teh" → "the")
- Formatting corrections (e.g., broken markdown, table alignment)
- Broken internal link repair (e.g., `#secton` → `#section`)
- Cross-reference metadata updates (e.g., adding commit hash to historical reference)

**ERRATUM PROTOCOL:**
1. Erratum must be content-preserving (no semantic change to governance meaning)
2. Erratum committed to git with explicit "ERRATUM:" commit message documenting correction
3. Erratum recorded in contract's STATE HISTORY section
4. If correction changes governance meaning, it is NOT an erratum — requires new contract version

**Example — PERMITTED Erratum:**
```
ERRATUM: Fixed typo "Phase 0.2 V1" → "Phase 0.3 V1" in dependency reference
Git Commit: abc123def
Date: 2026-10-25
Semantic Impact: None (corrected cross-reference error)
```

**Example — PROHIBITED (requires V2):**
```
"Change: Modified handoff threshold from ≥95% to ≥90%"
→ This is substantive governance change, NOT erratum
→ Requires Phase 0.5 V2
```

**Who Can Transition Away:** Automatic (to SUPERSEDED when next version FROZEN) or Human Architecture Authority (to DEPRECATED, REVOKED)

**Use Cases:**
- Active governance contracts
- Reference contracts for dependencies
- Audit trail anchor points

**Example:** Phase 0.1 V1 FROZEN (current state)

---

### EFFECTIVE (Design Decision)

**Question:** Is EFFECTIVE a distinct state or synonym for FROZEN?

**Design Option A:** EFFECTIVE = FROZEN (synonym)
- **Rationale:** "Effective" means "in effect" = "authoritative" = FROZEN
- **Implication:** No separate state needed; FROZEN suffices
- **Usage:** Can say "Phase 0.2 V2 is EFFECTIVE (FROZEN)" for emphasis

**Design Option B:** EFFECTIVE is when FROZEN + actively used
- **Rationale:** Contract can be FROZEN but not yet "effective" if future-dated or pending adoption
- **Implication:** EFFECTIVE = FROZEN + effectiveDate ≤ currentDate
- **Usage:** Phase 0.2 V2 FROZEN 2027-03-15, EFFECTIVE 2027-04-01 (grace period)

**Design Option C:** EFFECTIVE is latest non-SUPERSEDED FROZEN version
- **Rationale:** "Effective" means "current authoritative version"
- **Implication:** When V2 frozen, V1 no longer EFFECTIVE (becomes SUPERSEDED)
- **Usage:** Phase 0.2 V2 is EFFECTIVE (current); Phase 0.2 V1 is SUPERSEDED (historical)

**Recommended Decision:** **Option C — EFFECTIVE = latest FROZEN version per contract number**

**Justification:**
- Aligns with User's proposed terminology (EFFECTIVE as current active state)
- Provides semantic clarity: "Which Phase 0.2 is in effect?" → "Phase 0.2 V2" (not V1)
- Avoids ambiguity when multiple versions exist
- Machine-parseable: status = FROZEN + supersededBy = null → EFFECTIVE

**Formal Definition:**
```
EFFECTIVE ≡ (status = FROZEN) AND (supersededBy = null)
```

**Examples:**
- Phase 0.2 V1 FROZEN, supersededBy = V2 → NOT EFFECTIVE (SUPERSEDED)
- Phase 0.2 V2 FROZEN, supersededBy = null → EFFECTIVE
- Phase 0.2 V3 DRAFT → NOT EFFECTIVE (not frozen yet)

**Metadata Encoding:**
```markdown
**Status:** FROZEN (EFFECTIVE)
```
or
```markdown
**Status:** FROZEN
**Superseded By:** None (EFFECTIVE version)
```

---

### SUPERSEDED

**Definition:** Previously FROZEN version, replaced by newer FROZEN version, retained as immutable historical reference.

**Properties:**
- **Immutable:** Historical content never modified
- **Historical:** No longer current, but remains valid historical record
- **Referenceable:** Projects may continue using SUPERSEDED version (with awareness)
- **Navigable:** Links to superseding version recorded in governance index
- **Timestamped:** Superseded date recorded in governance index (= next version freeze date)

**Who Can Transition From FROZEN:** Derived from governance state registry (when next version FROZEN)

**SUPERSESSION MODEL:**

Phase 0.10 uses **immutable historical record + derived status** model, not file mutation.

**What DOES NOT happen when V2 freezes:**
- ❌ V1 file is NOT edited to change `Status: FROZEN` → `Status: SUPERSEDED`
- ❌ V1 historical content is NOT modified
- ❌ V1 file headers are NOT rewritten

**What DOES happen when V2 freezes:**
- ✅ V2 file created with `Status: FROZEN`, `Supersedes: V1`
- ✅ Governance index/registry records: V1 → SUPERSEDED BY V2, V2 → EFFECTIVE
- ✅ V1 remains immutable historical artifact
- ✅ Tooling derives: V1 = SUPERSEDED (from registry), V2 = EFFECTIVE (from registry)

**Rationale:**
- Preserves historical truth (Phase 0.9 requirement)
- Frozen = immutable means file never changes after freeze
- Supersession is relationship between versions, not property of V1 alone
- Governance registry is authoritative source of version relationships

**Example:**
```
docs/ubrc/
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md
│   Status: FROZEN (remains unchanged forever)
│   Frozen: 2026-09-30
│
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V2.md
│   Status: FROZEN
│   Frozen: 2027-03-15
│   Supersedes: Phase 0.2 V1
│
└── governance-contracts-index.md
    Phase 0.2 V1: SUPERSEDED (by V2, 2027-03-15)
    Phase 0.2 V2: EFFECTIVE
```

**Who Can Transition Away:** NONE (terminal state for that version)

**Use Cases:**
- Historical governance record
- Projects using older governance version
- Audit trail for governance evolution
- Comparison baseline (V1 vs V2 diff)

**Example:** Phase 0.2 V1 FROZEN (2026-09-30), SUPERSEDED 2027-03-15 (when V2 FROZEN)

**Metadata Encoding:**
```markdown
**Status:** SUPERSEDED
**Superseded By:** Phase 0.2 V2
**Superseded Date:** 2027-03-15
**Frozen Date:** 2026-09-30 (original freeze)
**Historical Record:** Preserved per Phase 0.9
```

---

### DEPRECATED

**Definition:** FROZEN contract discouraged from use due to known issues, but not yet replaced by newer version.

**Properties:**
- **Immutable:** Content cannot change (still FROZEN)
- **Discouraged:** Use at own risk
- **Current (technically):** No replacement version exists yet
- **Replacement Pending:** May eventually be SUPERSEDED or ARCHIVED

**Who Can Transition From FROZEN:** Human Architecture Authority

**Who Can Transition Away:** Automatic to SUPERSEDED (when V2 FROZEN), or Human to ARCHIVED

**Use Cases:**
- Contract has known defect but V2 not ready
- Contract no longer recommended but some projects still use it
- Contract approach found suboptimal but no alternative yet

**Example:** Phase 0.X V1 FROZEN (2026-01-01), DEPRECATED 2026-06-15 (security concern discovered), V2 in development

**Metadata Encoding:**
```markdown
**Status:** DEPRECATED
**Deprecated Date:** 2026-06-15
**Deprecated Reason:** Known security concern (XYZ); V2 in development
**Replacement:** Phase 0.X V2 (DRAFT)
**Use at Own Risk:** Projects should plan migration to V2
```

---

### ARCHIVED

**Definition:** Contract removed from active governance, retained for historical reference only, no longer supported.

**Properties:**
- **Immutable:** Content cannot change
- **Unsupported:** No longer maintained
- **Historical Only:** Reference for historical projects
- **Not Recommended:** Do not use for new projects

**Who Can Transition From DEPRECATED:** Human Architecture Authority

**Who Can Transition From SUPERSEDED:** Human Architecture Authority (if very old and no longer referenced)

**Who Can Transition Away:** NONE (terminal state)

**Use Cases:**
- Very old governance versions (e.g., Phase 0.X V1 from 2020, now 2030)
- Governance approach abandoned entirely
- Historical preservation without active support

**Example:** Phase 0.X V1 FROZEN (2020), DEPRECATED (2025), ARCHIVED (2030)

**Metadata Encoding:**
```markdown
**Status:** ARCHIVED
**Archived Date:** 2030-01-01
**Original Freeze:** 2020-01-01
**Archived Reason:** Governance model superseded by Phase 0.Y; retained for historical reference only
**Active Support:** NONE
```

---

### ABANDONED

**Definition:** Draft contract never frozen, development discarded, will not become authoritative.

**Properties:**
- **No Authority:** Never was binding
- **Discarded:** Development stopped
- **May Preserve:** Draft retained for lessons learned

**Who Can Transition From DRAFT:** Author or Human Architecture Authority

**Who Can Transition Away:** NONE (terminal state)

**Use Cases:**
- Experimental governance proposal rejected
- Contract development started but never completed
- Requirements changed, contract no longer needed

**Example:** Phase 0.X V1 DRAFT (2026-05-01), ABANDONED (2026-06-15) — approach proven unworkable

**Metadata Encoding:**
```markdown
**Status:** ABANDONED
**Abandoned Date:** 2026-06-15
**Abandoned Reason:** Experimental approach proven unworkable; lessons learned documented in [link]
```

---

### REVOKED

**Definition:** Previously FROZEN contract invalidated due to serious defect, no longer authoritative, extremely rare.

**Properties:**
- **Invalidated:** No longer binding
- **Serious Defect:** Major flaw discovered (contradiction, impossibility, security)
- **Immediate Effect:** Projects must stop using immediately
- **Historical Record:** Preserved to show what was revoked
- **Rare:** Should almost never happen (freezing process should catch defects)

**Who Can Transition From FROZEN:** Human Architecture Authority only

**Who Can Transition Away:** NONE (terminal state, but may be replaced by V2)

**Use Cases:**
- Contract has fundamental contradiction discovered post-freeze
- Contract creates impossible situation (deadlock, infinite loop)
- Contract violates higher-order governance principle
- Security-critical defect that cannot wait for V2

**Example:** Phase 0.X V1 FROZEN (2026-01-01), REVOKED (2026-01-15) — discovered contradiction with Phase 0.1

**Metadata Encoding:**
```markdown
**Status:** REVOKED
**Revoked Date:** 2026-01-15
**Frozen Date:** 2026-01-01
**Revoked Reason:** CRITICAL CONTRADICTION with Phase 0.1 detected; creates governance deadlock
**Replacement:** Phase 0.X V2 (DRAFT, urgent development)
**Impact:** All projects using Phase 0.X V1 must STOP immediately and await V2
```

---

## HISTORICAL STATE (Design Decision)

**Question:** Is HISTORICAL a distinct state or category?

**Design Option A:** HISTORICAL is a state
- **Properties:** Contract no longer active, preserved for history
- **Problem:** Overlaps with SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED

**Design Option B:** HISTORICAL is a state category, not single state
- **Properties:** Category encompassing SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED
- **Usage:** "Historical states" = any state where contract no longer active

**Recommended Decision:** **Option B — HISTORICAL is category, not distinct state**

**Justification:**
- SUPERSEDED, ARCHIVED, ABANDONED already cover "historical" semantics
- Adding HISTORICAL state creates redundancy
- Better to categorize states as ACTIVE vs HISTORICAL

**State Categorization:**

| Category | States |
|----------|--------|
| **ACTIVE** | DRAFT, REVIEW, APPROVED_FOR_FREEZE, FROZEN/EFFECTIVE |
| **HISTORICAL** | SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED |

**Usage:**
- "Phase 0.2 V1 is in HISTORICAL state (specifically SUPERSEDED)"
- "Phase 0.2 V2 is in ACTIVE state (specifically FROZEN/EFFECTIVE)"

---

## STATE TRANSITION MODEL

### State Transition Diagram

```
            DRAFT
              ↓
            REVIEW
              ↓
    APPROVED_FOR_FREEZE
              ↓
            FROZEN (EFFECTIVE)
              ↓
     ┌────────┼────────┐
     ↓        ↓        ↓
SUPERSEDED  DEPRECATED  REVOKED
     ↓        ↓
  ARCHIVED  ARCHIVED
```

**Alternative paths:**
- DRAFT → ABANDONED (if discarded)
- FROZEN → DEPRECATED (if issues discovered, no replacement yet)
- DEPRECATED → SUPERSEDED (when V2 frozen)
- DEPRECATED → ARCHIVED (if replacement abandoned)

### State Transition Rules

| From State | To State | Trigger | Authority |
|-----------|----------|---------|-----------|
| **DRAFT** | REVIEW | Author submits for review | Author |
| **DRAFT** | ABANDONED | Development discarded | Author or Human |
| **REVIEW** | APPROVED_FOR_FREEZE | Review approved | Human Architecture Authority |
| **REVIEW** | DRAFT | Changes required | Human Architecture Authority |
| **REVIEW** | ABANDONED | Rejected | Human Architecture Authority |
| **APPROVED_FOR_FREEZE** | FROZEN | Freeze executed | Author or freezer |
| **FROZEN** | SUPERSEDED | Next version FROZEN | Automatic |
| **FROZEN** | DEPRECATED | Issues discovered, no V2 yet | Human Architecture Authority |
| **FROZEN** | REVOKED | Critical defect | Human Architecture Authority |
| **DEPRECATED** | SUPERSEDED | Next version FROZEN | Automatic |
| **DEPRECATED** | ARCHIVED | Replacement abandoned, retire | Human Architecture Authority |
| **SUPERSEDED** | ARCHIVED | Very old, no longer referenced | Human Architecture Authority |

**Prohibited Transitions:**
- SUPERSEDED → FROZEN (cannot un-supersede)
- ARCHIVED → FROZEN (cannot unarchive)
- REVOKED → FROZEN (cannot unrevoke)
- FROZEN → DRAFT (cannot unfreeze)

---

## STATE METADATA MODEL

**Proposed standard metadata for all states:**

```markdown
# Phase {number} — {Subject} Contract V{version}

**Contract Number:** {number}  
**Contract Subject:** {Subject}  
**Contract Version:** {version}  
**Status:** {DRAFT | REVIEW | APPROVED_FOR_FREEZE | FROZEN | SUPERSEDED | DEPRECATED | ARCHIVED | ABANDONED | REVOKED}  
**Status Category:** {ACTIVE | HISTORICAL}  
**Effective:** {YES | NO} (FROZEN + not SUPERSEDED)  
**Created:** {YYYY-MM-DD}  
**Last Modified:** {YYYY-MM-DD} (for DRAFT)  
**Submitted for Review:** {YYYY-MM-DD} (if REVIEW)  
**Approved for Freeze:** {YYYY-MM-DD} (if APPROVED_FOR_FREEZE)  
**Frozen:** {YYYY-MM-DD} (if FROZEN/SUPERSEDED/DEPRECATED)  
**Superseded By:** {Phase {number} V{next-version}} (if SUPERSEDED)  
**Superseded Date:** {YYYY-MM-DD} (if SUPERSEDED)  
**Supersedes:** {Phase {number} V{prev-version}} (if version > 1)  
**Deprecated Date:** {YYYY-MM-DD} (if DEPRECATED)  
**Deprecated Reason:** {text} (if DEPRECATED)  
**Archived Date:** {YYYY-MM-DD} (if ARCHIVED)  
**Archived Reason:** {text} (if ARCHIVED)  
**Abandoned Date:** {YYYY-MM-DD} (if ABANDONED)  
**Abandoned Reason:** {text} (if ABANDONED)  
**Revoked Date:** {YYYY-MM-DD} (if REVOKED)  
**Revoked Reason:** {text} (if REVOKED)  
**Repository Revision (Freeze):** {commit-hash} (if FROZEN)  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  
```

---

## STATE AUTHORITY MODEL

**Who can transition contract states:**

| Transition | Authority |
|-----------|-----------|
| **DRAFT → REVIEW** | Author |
| **DRAFT → ABANDONED** | Author or Human Architecture Authority |
| **REVIEW → APPROVED_FOR_FREEZE** | Human Architecture Authority |
| **REVIEW → DRAFT** | Human Architecture Authority |
| **REVIEW → ABANDONED** | Human Architecture Authority |
| **APPROVED_FOR_FREEZE → FROZEN** | Author or designated freezer (mechanical) |
| **FROZEN → SUPERSEDED** | Automatic (when V{n+1} FROZEN) |
| **FROZEN → DEPRECATED** | Human Architecture Authority |
| **FROZEN → REVOKED** | Human Architecture Authority |
| **DEPRECATED → SUPERSEDED** | Automatic (when V{n+1} FROZEN) |
| **DEPRECATED → ARCHIVED** | Human Architecture Authority |
| **SUPERSEDED → ARCHIVED** | Human Architecture Authority |

**Human Architecture Authority approval required for:**
- Review approval
- Deprecation
- Revocation
- Archival
- Abandonment (if author unavailable)

**Automatic transitions:**
- FROZEN → SUPERSEDED (when next version frozen)
- DEPRECATED → SUPERSEDED (when next version frozen)

---

## STATE VISIBILITY AND USAGE RULES

**Contract usage rules by state:**

| State | Can Reference as Dependency | Can Use for New Projects | Can Use for Existing Projects | Binding Authority |
|-------|---------------------------|------------------------|------------------------------|------------------|
| **DRAFT** | ❌ NO | ❌ NO | ❌ NO | ❌ NOT BINDING |
| **REVIEW** | ❌ NO | ❌ NO | ❌ NO | ❌ NOT BINDING |
| **APPROVED_FOR_FREEZE** | ❌ NO | ❌ NO | ❌ NO | ❌ NOT BINDING |
| **FROZEN (EFFECTIVE)** | ✅ YES | ✅ YES | ✅ YES | ✅ BINDING |
| **SUPERSEDED** | ✅ YES (explicit version) | ⚠️ NOT RECOMMENDED | ✅ YES (if already using) | ✅ BINDING (historical) |
| **DEPRECATED** | ⚠️ DISCOURAGED | ❌ NO | ⚠️ USE AT OWN RISK | ✅ BINDING (but flawed) |
| **ARCHIVED** | ⚠️ HISTORICAL ONLY | ❌ NO | ❌ MIGRATE AWAY | ❌ NOT SUPPORTED |
| **ABANDONED** | ❌ NO | ❌ NO | ❌ NO | ❌ NOT BINDING |
| **REVOKED** | ❌ NO | ❌ NO | ❌ NO | ❌ NO LONGER BINDING |

---

## STATE AUDIT TRAIL

**All state transitions must be recorded:**

```markdown
## STATE HISTORY

| Date | From State | To State | Authority | Commit | Notes |
|------|-----------|----------|-----------|--------|-------|
| 2026-09-30 | — | DRAFT | Author | abc123 | Initial draft |
| 2026-10-15 | DRAFT | REVIEW | Author | def456 | Submitted for review |
| 2026-10-20 | REVIEW | APPROVED_FOR_FREEZE | Human | ghi789 | Approved by HAA |
| 2026-10-21 | APPROVED_FOR_FREEZE | FROZEN | Author | jkl012 | Freeze executed |
| 2027-03-15 | FROZEN | SUPERSEDED | Automatic | mno345 | Phase 0.2 V2 frozen |
```

---

## UNRESOLVED QUESTIONS FOR STEP 6 (COMPATIBILITY)

1. **Cross-version dependency compatibility:** Can Phase 0.10 V1 (depends on Phase 0.2 V1) use Phase 0.2 V2?
2. **Dependency auto-upgrade:** Should dependencies auto-upgrade to latest EFFECTIVE version?
3. **Circular dependency detection:** How to detect and prevent dependency cycles across versions?

**These questions are addressed in Step 6: Compatibility Model Design.**

---

## PHASE 0.10 STEP 5 COMPLETION STATUS: ✅ COMPLETE

**Completed:**
1. ✅ Complete lifecycle state taxonomy designed (9 states + 1 derived designation: DRAFT, REVIEW, APPROVED_FOR_FREEZE, FROZEN, SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED; EFFECTIVE is derived designation)
2. ✅ State definitions detailed (properties, authority, use cases, examples, metadata)
3. ✅ EFFECTIVE vs FROZEN distinction resolved (EFFECTIVE = FROZEN + not SUPERSEDED)
4. ✅ HISTORICAL category defined (not distinct state, category of SUPERSEDED/DEPRECATED/ARCHIVED/ABANDONED/REVOKED)
5. ✅ State transition model designed (diagram, rules, authorities)
6. ✅ State metadata model specified
7. ✅ State authority model defined (who can transition states)
8. ✅ State visibility and usage rules defined
9. ✅ State audit trail format specified
10. ✅ Unresolved questions identified for Step 6

**Key Decisions:**
- EFFECTIVE = latest FROZEN version per contract number (derived designation, not separate state)
- HISTORICAL = state category (SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED), not distinct state
- 9 distinct lifecycle states covering full contract evolution
- 1 derived designation (EFFECTIVE)
- 1 historical category classification
- Automatic SUPERSEDED transition when next version FROZEN
- Human Architecture Authority approval for DEPRECATED, REVOKED, ARCHIVED

**Ready for Phase 0.10 Step 6:** Compatibility Model Design (cross-version dependencies, dependency constraints, circular dependency detection)

---

**End of Phase 0.10 Step 5 — Lifecycle State Design COMPLETE**
