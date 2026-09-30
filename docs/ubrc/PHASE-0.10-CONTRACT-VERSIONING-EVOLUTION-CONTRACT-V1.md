# Phase 0.10 — Contract Versioning & Evolution Contract V1

**Contract Number:** 0.10  
**Contract Subject:** Contract Versioning & Evolution  
**Contract Version:** 1  
**Status:** DRAFT  
**Status Category:** ACTIVE  
**Effective:** NO (not yet frozen)  
**Created:** 2026-09-30  
**Last Modified:** 2026-09-30 (Contract-level semantic corrections applied)  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle

---

## PURPOSE

This contract governs how governance contracts within the Phase 0 framework evolve over time, ensuring that changes to governance rules are managed through a formal versioning system that preserves historical truth, maintains compatibility, and provides clear migration paths.

### Problem Statement

Phase 0.1-0.9 contracts establish the foundational governance framework for AI tutorial block creation. As requirements evolve and governance matures, these contracts may need modification. Without a formal versioning and evolution mechanism, contract changes risk:

- **Historical Truth Erosion:** Overwriting previous governance rules eliminates audit trails
- **Dependency Confusion:** Dependent contracts unclear which version they reference
- **Compatibility Uncertainty:** Breaking changes undetected until runtime governance failure
- **Migration Ambiguity:** Projects using older governance lack clear upgrade paths

### Solution Approach

Phase 0.10 establishes:
1. **Contract Identity Model:** Stable identity across versions (Number + Subject + Version)
2. **Lifecycle State Model:** Formal states (DRAFT → FROZEN → SUPERSEDED/DEPRECATED/ARCHIVED)
3. **Versioning Semantics:** Simple integer versioning with explicit compatibility declarations
4. **Historical Preservation:** Immutable frozen contracts, supersession via governance registry
5. **Migration Governance:** Formal procedures for version transitions
6. **Cross-Contract Impact Management:** Rules for evidence, certification, validation, and rollback across versions

---

## DEPENDENCIES

This contract depends on and must remain compatible with:

- **Phase 0.1 V1** (AI Roles & Responsibility): Actor authority boundaries, human approval requirements
- **Phase 0.2 V1** (Human Approval): Approval gates for governance transitions
- **Phase 0.3 V1** (Repository Modification): File creation, modification, historical preservation
- **Phase 0.4 V1** (Runtime Boundary): Governance-layer vs runtime-layer separation
- **Phase 0.5 V1** (Handoff Protocol): Completeness thresholds (distinct from versioning)
- **Phase 0.6 V1** (Evidence & Certification): Evidence maturity, certification authority
- **Phase 0.7 V1** (Validation & Testing): Validation methodology, testing procedures
- **Phase 0.8 V1** (STOP Conditions): STOP taxonomy, escalation procedures
- **Phase 0.9 V1** (Rollback & Recovery): Historical truth preservation, rollback governance

**Dependency Type:** DEPENDS_ON (cannot interpret governance versioning without Phase 0.1-0.9)

**Compatibility Declaration:** Phase 0.10 V1 tested with Phase 0.1-0.9 V1 (exact versions)

---

## SCOPE

### In Scope

✅ **Governance Contract Versioning:**
- Identity model for governance contracts
- Lifecycle states and transitions
- Version increment procedures
- Compatibility and migration governance
- Historical preservation rules

✅ **Cross-Contract Interactions:**
- Evidence validity across contract versions
- Certification version binding
- Validation revalidation rules
- Rollback historical preservation
- STOP interaction with version conflicts

✅ **Metadata and Documentation:**
- Standardized contract headers
- Governance contracts index
- Version changelog
- Migration guides

### Out of Scope

❌ **Runtime System Versioning:**
- UBRC versioning (handled by runtime system)
- ILS/LSNB/RSSB versioning
- Database schema versioning
- API versioning

❌ **Project/Package Versioning:**
- Tutorial block versioning (distinct from governance versioning)
- Component library versioning
- Application versioning

❌ **Implementation Code:**
- Version management tooling (optional future enhancement)
- Automated dependency resolution
- Compatibility checking automation

---

## PART 1: CONTRACT IDENTITY MODEL

### 1.1 Identity Components

Every governance contract has a unique, stable identity composed of three elements:

**Contract Number** (immutable)
- Format: `{integer}.{integer}` (e.g., "0.10" for Phase 0 contract 10)
- Assigned sequentially within phase
- NEVER changes across versions

**Contract Subject** (immutable)
- Human-readable name (e.g., "Contract Versioning & Evolution")
- Describes governance domain
- NEVER changes across versions

**Contract Version** (mutable)
- Format: `V{integer}` (e.g., "V1", "V2", "V3")
- Increments with each new version
- Simple integer, not SemVer (1.0.0)

### 1.2 Full Contract Identity

**Format:** `Phase {number} — {Subject} Contract V{version}`

**Examples:**
- `Phase 0.10 — Contract Versioning & Evolution Contract V1`
- `Phase 0.2 — Human Approval Contract V2`

### 1.3 Filename Convention

**Format:** `PHASE-{number}-{SUBJECT-SLUG}-CONTRACT-V{version}.md`

**Rules:**
- Subject slug: UPPER-SNAKE-CASE, words separated by hyphens
- Version included in filename (not just metadata)
- Multiple versions coexist as distinct files

**Examples:**
```
docs/ubrc/PHASE-0.10-CONTRACT-VERSIONING-EVOLUTION-CONTRACT-V1.md
docs/ubrc/PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md
docs/ubrc/PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V2.md
```

### 1.4 Identity Stability

**Immutable Across Versions:**
- Contract Number (0.10 remains 0.10)
- Contract Subject (Human Approval remains Human Approval)

**Changes With Version:**
- Contract Version (V1 → V2 → V3)
- Filename (includes version)
- Content (governance rules may change)

**Rationale:** Stable identity enables cross-contract references while version tracking enables evolution.

---

## PART 2: LIFECYCLE STATE MODEL

### 2.1 Lifecycle States

Nine lifecycle states govern contract evolution from draft to historical preservation:

| State | Meaning | Authority | Terminal |
|-------|---------|-----------|----------|
| **DRAFT** | Under development, may change freely | Author | NO |
| **REVIEW** | Submitted for approval, under review | Author submits | NO |
| **APPROVED_FOR_FREEZE** | Approved, awaiting freeze action | HAA approves | NO |
| **FROZEN** | Immutable, authoritative, binding | HAA + freezer | NO |
| **SUPERSEDED** | Replaced by newer version, historical | Automatic | YES |
| **DEPRECATED** | Discouraged but not replaced yet | HAA | NO |
| **ARCHIVED** | Removed from active use, historical | HAA | YES |
| **ABANDONED** | Draft discarded, never frozen | Author/HAA | YES |
| **REVOKED** | Previously frozen, now invalidated | HAA | YES |

**HAA = Human Architecture Authority**

### 2.2 Derived Designation: EFFECTIVE

**Definition:** Current authoritative usable version of a contract

**Derivation Rule:**
```
EFFECTIVE ≡ (status = FROZEN) AND (supersededBy = null)
```

**Properties:**
- EFFECTIVE is NOT a lifecycle state
- EFFECTIVE is computed from governance registry
- Only one version per contract number can be EFFECTIVE
- **A contract number MAY temporarily have NO EFFECTIVE VERSION** if its latest frozen version has been DEPRECATED or REVOKED and no replacement version has become FROZEN

**Example:**
- Phase 0.2 V1: FROZEN, supersededBy=V2 → NOT EFFECTIVE (SUPERSEDED)
- Phase 0.2 V2: FROZEN, supersededBy=null → EFFECTIVE

**No-Effective-Version Condition:**
```
Phase 0.X V1: DEPRECATED, supersededBy=null
    ↓
NO VERSION IS EFFECTIVE
    ↓
Governance registry records: "Phase 0.X: NO EFFECTIVE VERSION (V1 DEPRECATED, V2 pending)"
    ↓
Projects using Phase 0.X V1 must:
- Plan migration to V2 (when available)
- Use V1 at own risk (per DEPRECATED guidance)
- Monitor for V2 availability
```

**Another No-Effective-Version Condition:**
```
Phase 0.X V1: REVOKED, supersededBy=null
    ↓
NO VERSION IS EFFECTIVE
    ↓
Governance registry records: "Phase 0.X: NO EFFECTIVE VERSION (V1 REVOKED, V2 urgent)"
    ↓
Projects using Phase 0.X V1 must:
- STOP using V1 immediately (per Phase 0.8)
- Await V2 emergency development
- Escalate to Human Architecture Authority
```

**Registry Representation:**

When NO EFFECTIVE VERSION exists, governance registry shows:
```markdown
| Number | Subject | Latest Version | Status | EFFECTIVE | Notes |
|--------|---------|----------------|--------|-----------|-------|
| 0.X | Example | V1 | DEPRECATED | NO | V2 in development |
```

or

```markdown
| Number | Subject | Latest Version | Status | EFFECTIVE | Notes |
|--------|---------|----------------|--------|-----------|-------|
| 0.X | Example | V1 | REVOKED | NO | V2 urgent, STOP using V1 |
```

### 2.3 Analytical Category: HISTORICAL

**Definition:** Category encompassing contracts no longer active

**Includes:**
- SUPERSEDED
- DEPRECATED
- ARCHIVED
- ABANDONED
- REVOKED

**Properties:**
- HISTORICAL is NOT a lifecycle state
- HISTORICAL is analytical convenience
- HISTORICAL contracts preserved per Phase 0.9

**State Categories:**
- **ACTIVE:** DRAFT, REVIEW, APPROVED_FOR_FREEZE, FROZEN
- **HISTORICAL:** SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED

### 2.4 State Transition Rules

| From | To | Trigger | Authority Required |
|------|----|---------|--------------------|
| DRAFT | REVIEW | Author submits | Author |
| DRAFT | ABANDONED | Development discarded | Author or HAA |
| REVIEW | APPROVED_FOR_FREEZE | Review approved | HAA |
| REVIEW | DRAFT | Changes required | HAA |
| REVIEW | ABANDONED | Rejected | HAA |
| APPROVED_FOR_FREEZE | FROZEN | Freeze executed | Freezer (post-approval) |
| FROZEN | SUPERSEDED | Next version frozen | Automatic (via registry) |
| FROZEN | DEPRECATED | Issues discovered | HAA |
| FROZEN | REVOKED | Critical defect | HAA |
| DEPRECATED | SUPERSEDED | Next version frozen | Automatic (via registry) |
| DEPRECATED | ARCHIVED | Replacement abandoned | HAA |
| SUPERSEDED | ARCHIVED | Very old, no references | HAA |

**Prohibited Transitions:**
- SUPERSEDED → FROZEN (cannot un-supersede)
- ARCHIVED → FROZEN (cannot unarchive)
- REVOKED → FROZEN (cannot unrevoke)
- FROZEN → DRAFT (cannot unfreeze)

---

## PART 3: FROZEN IMMUTABILITY & ERRATUM PROTOCOL

### 3.1 Substantive Immutability

**Rule:** FROZEN contracts are substantively immutable

**Definition:** 
- **Governance meaning** cannot change after freeze
- **Requirements, authority, procedures, and dependencies** cannot change after freeze
- **Substantive content** is immutable
- **Original frozen revision** remains historically recoverable

**Not Absolute File Immutability:** A frozen contract may be corrected via the Erratum Protocol (3.2-3.4) for non-substantive defects, provided the original frozen revision remains historically accessible via git and the correction is explicitly recorded.

### 3.2 Erratum Protocol

**Permitted Corrections (Non-Substantive Erratum Only):**
- Typographical corrections (e.g., "teh" → "the")
- Formatting corrections (e.g., broken markdown, table alignment)
- Broken internal link repair (e.g., `#secton` → `#section`)
- Cross-reference metadata updates (e.g., adding commit hash to reference)

**Critical Rule:** Erratum MUST be content-preserving. No change to governance meaning permitted.

**Prohibited (Requires New Version):**
- Substantive governance changes (requirements, authority, procedures)
- Changes to dependencies
- Changes to compliance rules
- Changes to scope or definitions that alter meaning

**Rationale:** Substantive governance changes require full version cycle (review, approval, freeze) per Phase 0.2.

### 3.3 Erratum Procedure

**Process:**
1. Identify non-substantive error in frozen contract
2. Determine if correction is content-preserving (no semantic change to governance)
3. If content-preserving: apply correction via git commit with explicit "ERRATUM:" prefix in commit message
4. Record correction in contract's STATE HISTORY section with:
   - Date
   - Git commit hash
   - Description of correction
   - Confirmation of semantic impact: NONE
5. **Historical Recoverability:** Original frozen revision remains accessible via git commit history
6. If correction would change governance meaning: DO NOT apply as erratum; create new version instead

**Example Permitted Erratum:**
```
Git Commit: ERRATUM: Fixed typo "Phase 0.2 V1" → "Phase 0.3 V1" in dependency reference
Commit Hash: abc123def
Date: 2026-10-25
Semantic Impact: None (corrected cross-reference error)
Historical Revision: Original frozen at commit xyz789abc
```

**Example Prohibited (Requires V2):**
```
Change: Modified handoff threshold from ≥95% to ≥90%
→ This is substantive governance change, NOT erratum
→ Requires Phase 0.5 V2
```

### 3.4 Enforcement

**Responsibility:** Project LLM and Human Architecture Authority jointly responsible for erratum protocol compliance

**Validation:** If uncertainty whether correction is substantive:
1. Assume substantive (requires V2)
2. Escalate to Human Architecture Authority for determination
3. Document decision rationale

**Historical Truth Preservation:** Erratum protocol preserves Phase 0.9 "Historical Truth Is Immutable" principle because original frozen revision remains recoverable via git commit history. The erratum itself becomes part of the historical record.

---

## PART 4: SUPERSESSION MODEL

### 4.1 Immutable Historical Record Approach

**Rule:** Substantive frozen content preserved immutably when V2 freezes

**Process When V2 Freezes:**
1. V2 contract created and frozen
2. V2 metadata includes `Supersedes: Phase {number} V1`
3. Governance contracts index updated to record:
   - V1 → SUPERSEDED BY V2
   - V2 → EFFECTIVE
4. V1 file substantive content remains unchanged (historical artifact)
5. Tooling derives SUPERSEDED status from governance registry

**Erratum Exception:** V1 may receive non-substantive errata per Part 3 Erratum Protocol even after supersession, provided original frozen revision remains historically recoverable. Such errata do not constitute "modification for supersession purposes."

**Supersession vs Erratum:**
- **Supersession:** Relationship between versions (V1 → SUPERSEDED BY V2), recorded in governance registry
- **Erratum:** Content-preserving correction to frozen artifact, recorded in STATE HISTORY, original revision recoverable via git

**Example:**
```
File System:
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md
│   Status: FROZEN (substantive content immutable)
│   Frozen: 2026-09-30
│   Frozen Revision: git commit xyz789abc
│   Errata: Typo corrected 2026-11-15 (git commit abc123def, semantic impact: none)
│
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V2.md
│   Status: FROZEN
│   Frozen: 2027-03-15
│   Supersedes: Phase 0.2 V1
│
Governance Index:
Phase 0.2 V1: SUPERSEDED (by V2, 2027-03-15)
Phase 0.2 V2: EFFECTIVE
```

### 4.2 Rationale

**Phase 0.9 Compliance:** "Historical Truth Is Immutable" principle requires V1 historical record preservation. Substantive governance content never changes; non-substantive corrections via erratum protocol with historical traceability.

**Audit Trail:** Historical contracts remain accessible in original frozen form via git commit history.

**Substantive Immutability:** Definition enforced (substantive governance content immutable after freeze; non-substantive corrections permitted per erratum protocol with full historical recoverability).

---

## PART 5: VERSIONING MODEL

### 5.1 Version Numbering

**Format:** Simple integer versioning (`V1`, `V2`, `V3`, ...)

**NOT SemVer:** Phase 0.10 does NOT use Semantic Versioning (1.0.0, 1.1.0, 2.0.0)

**Rationale:**
- Governance changes are rare and significant (MAJOR-only changes)
- MINOR/PATCH granularity unnecessary (erratum protocol handles typos)
- Simpler for human readability ("Phase 0.2 V2" clearer than "Phase 0.2 Version 2.0.0")

**Reserved:** Future adoption of SemVer if governance evolves to require finer granularity

### 5.2 Breaking vs Non-Breaking Changes

**Two Independent Dimensions:**

**Dimension 1: Breaking Impact**
- **BREAKING:** Requires dependent contracts to modify behavior to remain compliant
- **NON-BREAKING:** Dependent contracts remain compliant without modification

**Dimension 2: Substantive vs Non-Substantive**
- **SUBSTANTIVE:** Changes governance meaning, requirements, authority, or procedures
- **NON-SUBSTANTIVE:** Content-preserving correction (typo, formatting, broken link)

**Critical Rule:** These dimensions are INDEPENDENT

**Matrix:**

| Change Type | Breaking | Non-Breaking |
|-------------|----------|--------------|
| **SUBSTANTIVE** | Requires V2 (new mandatory requirement) | Requires V2 (governance meaning changes) |
| **NON-SUBSTANTIVE** | N/A (non-substantive cannot break dependents) | May use Erratum Protocol |

**Breaking Change Examples:**
- ✅ BREAKING + SUBSTANTIVE: Add mandatory approval gate (dependents must comply)
- ✅ BREAKING + SUBSTANTIVE: Add mandatory evidence class (dependents must produce new evidence)
- ✅ BREAKING + SUBSTANTIVE: Change authority model (dependents must follow new authority)

**Non-Breaking Change Examples:**
- ❌ NON-BREAKING + SUBSTANTIVE: Remove requirement (relaxation, dependents already compliant) → **Requires V2** (substantive governance change)
- ❌ NON-BREAKING + SUBSTANTIVE: Add optional requirement (dependents may ignore) → **Requires V2** (substantive governance change)
- ✅ NON-BREAKING + NON-SUBSTANTIVE: Fix typo → **May use Erratum** (content-preserving)

**Rule:** ALL substantive changes require new contract version (V1 → V2), regardless of whether breaking or non-breaking.

**Rule:** ONLY non-substantive changes qualify for Erratum Protocol.

**Common Mistake to Avoid:**
```
INCORRECT: "This change is non-breaking, so we can apply it via erratum."

CORRECT: "This change is non-breaking, but it changes governance meaning 
(substantive), therefore it requires V2."
```

### 5.3 Version Increment Triggers

**Create V2 When:**
1. Breaking change required (mandatory new behavior for dependents)
2. Non-breaking BUT substantive new governance requirements
3. Dependency changes (add, remove, or change dependency version)
4. Authority model changes
5. Compliance rule changes
6. Scope changes

**Do NOT Create V2 For:**
- Typographical corrections (use erratum)
- Formatting improvements (use erratum)
- Broken link repairs (use erratum)
- Cross-reference metadata updates (use erratum)

**Clarification Rule:** If a change alters governance meaning, it is substantive and requires V2, even if it would not break existing dependents.

### 5.4 Compatibility Declaration

**Every Contract Must Declare:**
- **Backward Compatible:** V2 works with systems designed for V1
- **Forward Compatible:** V1 works with systems designed for V2
- **Incompatible:** V1 and V2 mutually incompatible

**Default:** Assume incompatible unless explicitly tested and declared compatible

---

## PART 6: DEPENDENCY MANAGEMENT

### 6.1 Dependency Version Constraints

**Rule:** Dependencies default to exact version unless explicitly declared otherwise

**Syntax:**
```markdown
**Depends on:**
- Phase 0.2 V1 (exact)
- Phase 0.6 V1 or later (forward compatible, tested with V1, V2)
```

**Rationale:** Stability over convenience (prevent silent behavior changes)

### 6.2 Dependency Auto-Upgrade

**Rule:** Dependencies do NOT auto-upgrade to latest version

**Exception:** Contract may explicitly declare forward compatibility:
```markdown
**Depends on:**
- Phase 0.7 V1 or later (tested with V1, V2; compatible with V3+ unless breaking change)
```

**Implication:** Projects using Phase 0.10 V1 (depends on Phase 0.2 V1) must explicitly upgrade dependency reference when migrating to Phase 0.2 V2

### 6.3 Circular Dependency Prohibition

**Rule:** Circular dependencies PROHIBITED

**Examples:**
- ✅ ALLOWED: Phase 0.10 depends on Phase 0.1-0.9 (acyclic)
- ❌ PROHIBITED: Phase 0.X depends on Phase 0.Y, Phase 0.Y depends on Phase 0.X

**Detection:** Topological sort during contract review

**Resolution:** Redesign contracts to eliminate cycle OR merge contracts

### 6.4 Unversioned References

**Legacy Contracts:** Phase 0.1-0.9 V1 created before Phase 0.10

**Default Resolution:** Unversioned reference resolves to:
1. Latest EFFECTIVE version (if one exists)
2. Latest FROZEN version (if no EFFECTIVE)
3. DRAFT (if no FROZEN, development context only)

**Migration:** Update legacy contracts to explicit version references

---

## PART 7: MIGRATION MODEL

### 7.1 Migration Governance

**Authority:** Human Architecture Authority authorizes all governance contract migrations

**Trigger:**
- Breaking change in dependency (Phase 0.2 V1 → V2 breaks Phase 0.10)
- Deprecated version retirement (Phase 0.X V1 ARCHIVED)
- New requirement necessitates newer version

### 7.2 Migration Phases

**5-Phase Migration Procedure:**

1. **ASSESS:** Analyze impact of version upgrade
   - Identify breaking changes
   - Identify affected projects/components
   - Estimate effort required
   
2. **PLAN:** Develop migration strategy
   - Choose migration approach (cutover, parallel, phased, pilot)
   - Document migration steps
   - Identify risks and mitigations
   
3. **EXECUTE:** Perform migration
   - Update contract dependencies
   - Modify behavior to comply with new version
   - Update evidence/certification if required
   
4. **VERIFY:** Confirm migration success
   - Validate compliance with new version
   - Run validation tests (Phase 0.7)
   - Verify evidence validity
   
5. **COMPLETE:** Finalize migration
   - Document migration in changelog
   - Update governance registry
   - Archive migration plan

### 7.3 Migration Strategies

**Strategy 1: Cutover (All-at-Once)**
- Switch from V1 to V2 immediately across all affected components
- Requires coordinated transition
- Suitable when: Small scope, urgent requirement, single transition event acceptable

**Strategy 2: Phased (Incremental)**
- Migrate components/projects sequentially over time
- Allows validation at each phase before proceeding
- Suitable when: Large scope, can sequence migration, gradual rollout preferred

**Strategy 3: Parallel Adoption**
- Run V1 and V2 processes in parallel temporarily
- Enables comparison and validation before full transition
- Suitable when: Need operational validation, gradual adoption, tolerance for temporary dual-process overhead

**Strategy 4: Pilot**
- Test V2 on limited subset before broader migration
- Provides opportunity to validate assumptions and refine migration approach
- Suitable when: Uncertain impact, benefit from proof of concept before full commitment

**Note:** Strategy descriptions use operational language (coordination, sequencing, validation) rather than formal risk classifications. Project-specific risk assessment should follow established project risk management frameworks, if applicable.

### 7.4 Migration Documentation Requirements

**Every V2 Contract Must Include:**

1. **CHANGES FROM V1** section (summary)
2. **BREAKING CHANGES** section (specific breaking changes)
3. **MIGRATION GUIDE** section (step-by-step instructions)
4. **COMPATIBILITY DECLARATION** (backward/forward compatible?)
5. **ESTIMATED EFFORT** (time/resources required)
6. **ROLLBACK PROCEDURE** (how to revert if migration fails)

---

## PART 8: CROSS-CONTRACT IMPACT GOVERNANCE

### 8.1 Evidence Validity Across Versions (Phase 0.6 Interaction)

**Rule:** Evidence tied to governance version used during evidence production

**If Phase 0.6 V2 Changes Evidence Requirements:**
- Evidence produced under Phase 0.6 V1 may not satisfy Phase 0.6 V2
- Projects must produce evidence delta (new evidence for V2)
- Dual evidence possible: "V1-COMPLIANT" and "V2-COMPLIANT"

**Governance Registry Records:**
```json
{
  "evidenceHistory": [
    {"governanceVersion": "Phase 0.6 V1", "status": "SUPERSEDED"},
    {"governanceVersion": "Phase 0.6 V2", "status": "ACTIVE"}
  ]
}
```

### 8.2 Certification Version Binding (Phase 0.6 Interaction)

**Rule:** Certification bound to governance version used during certification

**Example:**
- Block certified 2026-10-15 under Phase 0.6 V1 → "V1-CERTIFIED"
- Phase 0.6 V2 created 2027-03-15 with stricter criteria
- Block NOT automatically "V2-CERTIFIED"
- May require recertification under V2

**Dual Certification Allowed:**
```json
{
  "certifications": [
    {"governanceVersion": "Phase 0.1-0.9 V1", "certifiedDate": "2026-10-15", "status": "SUPERSEDED"},
    {"governanceVersion": "Phase 0.1-0.9 V2", "certifiedDate": "2027-04-01", "status": "ACTIVE"}
  ]
}
```

### 8.3 Validation Revalidation (Phase 0.7 Interaction)

**Rule:** Validation level changes may require revalidation

**If Phase 0.7 V2 Adds Validation Level:**
- Blocks validated under V1 (L0-L8) lack L9 validation
- V2 projects require L9 validation
- V1 projects may continue with L0-L8 OR upgrade to V2 (with L9)

**If Phase 0.7 V2 Changes Acceptance Criteria:**
- Previous validation may no longer meet criteria
- Revalidation required for V2 compliance

### 8.4 Rollback Historical Preservation (Phase 0.9 Interaction)

**Rule:** Rollback events tied to governance version used during rollback

**If Phase 0.9 V2 Changes Rollback Procedures:**
- V1 rollback events remain valid historical records (Phase 0.9 historical truth)
- V1 rollback procedures grandfathered for historical rollbacks
- V2 procedures apply prospectively (future rollbacks only)

**Example:**
```markdown
Rollback Event: 2026-11-15
Governance Version: Phase 0.9 V1
Rollback Procedure: V1 3-phase rollback
Status: COMPLETED
Historical Record: PRESERVED (immutable)

Future Rollback: 2027-05-20
Governance Version: Phase 0.9 V2
Rollback Procedure: V2 5-phase rollback
```

### 8.5 STOP Interaction (Phase 0.8 Interaction)

**Rule:** Contract version conflicts trigger STOP conditions

**Examples:**
- Phase 0.10 V1 depends on Phase 0.2 V1, but Phase 0.2 V1 REVOKED → STOP
- Phase 0.10 V1 depends on Phase 0.2 V1, but only Phase 0.2 V3 available and incompatible → STOP
- Circular dependency detected → STOP

**STOP Category:** ARCHITECTURAL_DEFECT (governance contract conflict)

**Resolution:** Phase 0.8 escalation to Human Architecture Authority

---

## PART 9: GOVERNANCE CONTRACTS INDEX

### 9.1 Purpose

**Index File:** `docs/ubrc/governance-contracts-index.md`

**Status:** Defined by this contract; created and adopted after Phase 0.10 V1 freeze

**Contents (Once Established):**
- Registry of all governance contracts
- Current version for each contract
- Status (EFFECTIVE, SUPERSEDED, DEPRECATED, ARCHIVED, etc.)
- Version relationships (supersession chains)
- Cross-references

**Authority:** Once created and adopted, the governance contracts index is the authoritative source of contract version relationships and EFFECTIVE version determination.

### 9.2 Index Structure

```markdown
# Governance Contracts Index

Last Updated: {date}
Status: This index is the authoritative source of contract version relationships once established and adopted.

## Phase 0 Governance Framework

| Number | Subject | Latest Version | Status | Supersedes | Superseded By | EFFECTIVE |
|--------|---------|----------------|--------|------------|---------------|-----------|
| 0.1 | AI Roles & Responsibility | V1 | FROZEN | — | — | YES |
| 0.2 | Human Approval | V2 | FROZEN | V1 | — | YES |
| 0.2 | Human Approval | V1 | SUPERSEDED | — | V2 | NO |
| 0.3 | Repository Modification | V1 | FROZEN | — | — | YES |
| ... | ... | ... | ... | ... | ... | ... |

## Phase 0.10 Example (Illustrative Post-Freeze State)

After Phase 0.10 V1 is approved and frozen:

| Number | Subject | Latest Version | Status | Supersedes | Superseded By | EFFECTIVE |
|--------|---------|----------------|--------|------------|---------------|-----------|
| 0.10 | Contract Versioning & Evolution | V1 | FROZEN | — | — | YES |

Current Phase 0.10 V1 state (pre-freeze):

| Number | Subject | Latest Version | Status | Supersedes | Superseded By | EFFECTIVE |
|--------|---------|----------------|--------|------------|---------------|-----------|
| 0.10 | Contract Versioning & Evolution | V1 | DRAFT | — | — | NO |

## Version History

### Phase 0.2 (Human Approval)
- V1: Frozen 2026-09-30, Superseded 2027-03-15
- V2: Frozen 2027-03-15, EFFECTIVE

### Phase 0.10 (Contract Versioning & Evolution)
- V1: Created 2026-09-30 (DRAFT), Frozen {future-date} (when approved), EFFECTIVE
```

### 9.3 Index Maintenance

**Update Triggers:**
- New contract frozen
- Contract superseded
- Contract deprecated
- Contract archived
- Contract revoked

**Authority:** Project LLM maintains index; Human Architecture Authority approves changes

---

## PART 10: VERSION CREATION PROCEDURE

### 10.1 Creating a New Version (V2)

**Prerequisites:**
1. V1 frozen and in use
2. Need for breaking change or substantial governance update identified
3. Human Architecture Authority approval obtained

**Procedure:**

**Step 1: Draft V2**
- Create new file: `PHASE-{number}-{SUBJECT}-CONTRACT-V2.md`
- Copy V1 structure
- Apply governance changes
- Add sections: CHANGES FROM V1, BREAKING CHANGES, MIGRATION GUIDE
- Set status: DRAFT

**Step 2: Document Changes**
- List all changes from V1 (comprehensive)
- Identify breaking vs non-breaking changes
- Document compatibility (backward/forward)
- Provide migration guidance with estimated effort

**Step 3: Dependency Update**
- Review V2 dependencies (same as V1, or updated?)
- Declare version constraints for each dependency
- Resolve any circular dependencies

**Step 4: Cross-Contract Impact Analysis**
- Analyze evidence validity impact (Phase 0.6)
- Analyze certification impact (Phase 0.6)
- Analyze validation impact (Phase 0.7)
- Analyze rollback impact (Phase 0.9)
- Analyze STOP interaction (Phase 0.8)

**Step 5: Submit for Review**
- Change status: DRAFT → REVIEW
- Submit to Human Architecture Authority

**Step 6: Approval**
- Human Architecture Authority reviews V2
- Decision: APPROVE | RETURN TO DRAFT | REJECT
- If approved: status → APPROVED_FOR_FREEZE

**Step 7: Freeze V2**
- Change status: APPROVED_FOR_FREEZE → FROZEN
- Record freeze date and git commit hash
- Update V2 metadata: `Supersedes: Phase {number} V1`

**Step 8: Update Governance Registry**
- Update governance contracts index:
  - V1 → SUPERSEDED BY V2
  - V2 → EFFECTIVE
- Update version changelog
- Create V1 → V2 migration record

**Step 9: Communicate**
- Notify stakeholders of V2 availability
- Provide migration guidance
- Document V1 support timeline (if V1 remains available)

### 10.2 DEPRECATED State

**Use When:**
- V1 has known issues
- V2 not ready yet
- Projects should plan migration but V2 under development

**Procedure:**
1. Human Architecture Authority declares V1 DEPRECATED
2. Document deprecation reason
3. Communicate to stakeholders
4. Accelerate V2 development

### 10.3 REVOKED State

**Use When (Rare):**
- V1 has critical defect (contradiction, impossibility, security vulnerability)
- Cannot wait for V2
- Projects must STOP using V1 immediately

**Procedure:**
1. Critical defect discovered in frozen V1
2. Human Architecture Authority declares V1 REVOKED
3. Document revocation reason
4. Trigger Phase 0.8 STOP escalation
5. Fast-track V2 development
6. Projects must cease V1 use immediately

---

## PART 11: AUTHORITY MODEL

### 11.1 Human Architecture Authority

**Responsibilities:**
- Approve contract transitions (REVIEW → APPROVED_FOR_FREEZE)
- Authorize DEPRECATED, REVOKED, ARCHIVED state transitions
- Approve migration strategies
- Resolve version conflicts
- Determine erratum vs V2 boundary cases

**Cannot:**
- Bypass Phase 0.1-0.9 governance rules
- Modify frozen contracts substantively (only erratum or V2)

### 11.2 Project LLM / External AI

**Responsibilities:**
- Draft new contracts (DRAFT state)
- Maintain governance contracts index
- Perform contract audits
- Recommend version transitions
- Document migration procedures

**Cannot:**
- Approve contracts for freeze (requires HAA)
- Declare DEPRECATED, REVOKED, ARCHIVED (requires HAA)
- Modify frozen contracts (except non-substantive erratum per protocol)

### 11.3 Author

**Responsibilities:**
- Create DRAFT contracts
- Submit for REVIEW
- Apply erratum corrections (per protocol)
- Execute freeze action (post-approval)

**Cannot:**
- Approve contracts (requires HAA)
- Bypass review process

---

## PART 12: COMPLIANCE AND ENFORCEMENT

### 12.1 Contract Compliance

**Projects Using Governance Contracts Must:**
1. Declare which contract versions in use
2. Follow declared versions (no selective compliance)
3. Document deviations (if any, with HAA approval)
4. Migrate when dependencies require (or document reason for delay)

### 12.2 Version Compliance

**When Using Phase 0.X V1:**
- Follow V1 rules exactly
- Do not cherry-pick V2 rules
- If need V2 feature: migrate to V2 (or request V1 update via governance)

### 12.3 Enforcement

**Phase 0.8 STOP Conditions Apply:**
- Contract version conflict → STOP
- Circular dependency → STOP
- Revoked contract use → STOP
- Missing required dependency → STOP

**Resolution:** Phase 0.8 escalation procedures

---

## PART 13: MACHINE-READABLE METADATA

### 13.1 Standard Contract Header

Every contract MUST include:

```markdown
# Phase {number} — {Subject} Contract V{version}

**Contract Number:** {number}
**Contract Subject:** {Subject}
**Contract Version:** {version}
**Status:** {DRAFT | REVIEW | APPROVED_FOR_FREEZE | FROZEN | SUPERSEDED | DEPRECATED | ARCHIVED | ABANDONED | REVOKED}
**Status Category:** {ACTIVE | HISTORICAL}
**Effective:** {YES | NO}
**Created:** {YYYY-MM-DD}
**Last Modified:** {YYYY-MM-DD}
**Frozen:** {YYYY-MM-DD} (if FROZEN or later)
**Supersedes:** {Phase {number} V{prev-version}} (if version > 1)
**Superseded By:** {Phase {number} V{next-version}} (if SUPERSEDED)
**Repository Revision (Freeze):** {git-commit-hash} (if FROZEN)
**Authority:** Human Architecture Authority
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle

**Depends on:**
- Phase {number} V{version} ({constraint})
- ...
```

### 13.2 VERSION HISTORY Section

Every contract V2+ MUST include:

```markdown
## VERSION HISTORY

| Version | Frozen | Superseded | Status | Summary |
|---------|--------|------------|--------|---------|
| V2 | 2027-03-15 | — | EFFECTIVE | Added X, changed Y |
| V1 | 2026-09-30 | 2027-03-15 | SUPERSEDED | Initial version |
```

### 13.3 STATE HISTORY Section

Every contract MUST include (updated with each state transition):

```markdown
## STATE HISTORY

| Date | From | To | Authority | Commit | Notes |
|------|------|----|-----------| -------|-------|
| 2026-09-30 | — | DRAFT | Author | abc123 | Initial draft |
| 2026-10-15 | DRAFT | REVIEW | Author | def456 | Submitted |
| 2026-10-20 | REVIEW | APPROVED_FOR_FREEZE | HAA | ghi789 | Approved |
| 2026-10-21 | APPROVED_FOR_FREEZE | FROZEN | Freezer | jkl012 | Frozen |
```

---

## PART 14: APPENDICES

### APPENDIX A: Quick Reference

**Lifecycle States:** 9 states (DRAFT, REVIEW, APPROVED_FOR_FREEZE, FROZEN, SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED)

**Derived Designation:** EFFECTIVE (FROZEN AND not SUPERSEDED)

**Historical Category:** SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED, REVOKED

**Versioning:** Simple integers (V1, V2, V3), not SemVer

**Immutability:** Substantive governance content immutable after freeze (erratum protocol permits non-substantive corrections with historical recoverability)

**Supersession:** Via governance registry (substantive content preserved; version relationship recorded in index)

**Dependencies:** Pinned by default (explicit forward-compatible declaration required)

**Authority:** Human Architecture Authority approves version transitions

### APPENDIX B: Common Scenarios

**Scenario 1: Typo in Frozen Contract**
- Solution: Apply erratum (if truly non-substantive)
- Process: Git commit with "ERRATUM:" prefix, record in STATE HISTORY

**Scenario 2: Need Breaking Change**
- Solution: Create V2
- Process: Follow version creation procedure (Part 10)

**Scenario 3: V1 Has Known Issue, V2 Not Ready**
- Solution: DEPRECATE V1
- Process: HAA declares V1 DEPRECATED, communicate to stakeholders, fast-track V2

**Scenario 4: V1 Has Critical Defect**
- Solution: REVOKE V1
- Process: HAA declares V1 REVOKED, trigger STOP escalation, emergency V2 development

**Scenario 5: Project Using V1, V2 Available**
- Solution: Assess migration need
- Process: If breaking changes affect project → migrate; if not → may continue V1 or upgrade

### APPENDIX C: Glossary

**Breaking Change:** Requires dependent contracts to modify behavior

**Erratum:** Non-substantive correction to frozen contract (content-preserving)

**EFFECTIVE:** Current authoritative version (derived designation)

**FROZEN:** Immutable, authoritative contract (lifecycle state)

**HISTORICAL:** Category of non-active contracts (analytical convenience)

**Supersession:** V1 replaced by V2 (relationship recorded in governance registry)

**Version:** Integer identifier (V1, V2, V3) tracking contract evolution

---

## STATUS

**Current Status:** DRAFT  
**Created:** 2026-09-30  
**Authority:** Human Architecture Authority  
**Awaiting:** Review and approval for freeze

---

## VERSION HISTORY

| Version | Status | Date | Summary |
|---------|--------|------|---------|
| V1 | DRAFT | 2026-09-30 | Initial version synthesizing Phase 0.10 design work |

---

## STATE HISTORY

| Date | From | To | Authority | Notes |
|------|------|----|-----------| ------|
| 2026-09-30 | — | DRAFT | Kiro (Project LLM) | Contract synthesis from Phase 0.10 design documents |
| 2026-09-30 | DRAFT | DRAFT | Kiro (Project LLM) | Contract-level semantic corrections (immutability, EFFECTIVE, registry, non-breaking, migration, index) |

---

**End of Phase 0.10 — Contract Versioning & Evolution Contract V1**

