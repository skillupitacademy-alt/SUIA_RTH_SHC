# Phase 0.10 Step 4: Versioning Model Design

**Created:** 2026-09-30  
**Status:** IN PROGRESS (Step 4 of Phase 0.10 methodology)  
**Authority:** Phase 0.10 governance design process  
**Purpose:** Design how frozen governance contracts evolve across versions, including compatibility semantics, breaking change definitions, migration procedures, and dependency management

---

## DESIGN FOUNDATION

**Step 3 Established:**
- Contract identity = Number + Subject (immutable)
- Version = Simple integer (V1, V2, V3...)
- Multiple versions coexist as files
- Historical versions preserved

**Step 4 Must Define:**
1. Version increment rules (when to create V2)
2. Breaking vs non-breaking changes
3. Compatibility semantics (backward, forward)
4. Migration procedures
5. Dependency version constraints
6. Cross-version evidence validity
7. SemVer evaluation

---

## VERSIONING CONTEXT: GOVERNANCE VS CODE

**Critical Distinction:**

```
Code Versioning (SemVer)
    Purpose: API stability, dependency management, automated upgrades
    Changes: Frequent (bug fixes, features, breaking changes)
    Consumers: Developers, package managers
    Examples: 1.0.0 → 1.0.1 (patch), 1.1.0 (minor), 2.0.0 (major)

Governance Contract Versioning
    Purpose: Rule stability, authority preservation, audit trail
    Changes: Infrequent (governance evolution only)
    Consumers: Humans, AI agents, audit systems
    Examples: Phase 0.1 V1 → V2 (rare governance evolution)
```

**Key Differences:**
- Governance contracts are **human-interpreted rules**, not machine-executable APIs
- Governance changes are **rare and deliberate**, not continuous iteration
- Governance compatibility is about **rule interpretation**, not API contracts
- Governance migration is **organizational change**, not code refactoring

**Implication:** Governance versioning model may differ from SemVer

---

## VERSION INCREMENT TRIGGERS

### When V2 Is Required

**A new contract version (V1 → V2) is REQUIRED when:**

#### Trigger 1: Rule Modification (Content Change)
- Add new requirement (e.g., Phase 0.2 adds Gate 4)
- Remove existing requirement (e.g., Phase 0.2 removes Gate 2)
- Change existing requirement (e.g., Phase 0.2 changes Gate 1 evidence requirements)
- Change responsibility boundaries (e.g., Phase 0.1 changes Project LLM authority)
- Change authority model (e.g., Phase 0.2 changes approval authority)

#### Trigger 2: Contract Incompatibility
- V1 rule contradicts newly discovered requirement
- V1 rule proven unworkable in practice
- V1 rule creates deadlock or infinite loop
- V1 rule violates higher-order governance principle

#### Trigger 3: Scope Expansion
- Add new coverage area (e.g., Phase 0.4 adds new runtime system)
- Add new actor (e.g., Phase 0.1 adds third AI actor)
- Add new lifecycle phase (e.g., Phase 0.2 adds Phase 20-25)

#### Trigger 4: Clarification That Changes Interpretation
- Clarification that narrows previously broad rule
- Clarification that removes ambiguity in way that changes behavior
- Clarification that invalidates prior implementation

**Note:** Pure clarification that does NOT change behavior is NOT a version increment (errata instead)

#### Trigger 5: Dependency Upgrade Forced
- Depends on Phase 0.X V2, cannot work with Phase 0.X V1
- Dependency incompatibility forces contract rewrite

### When V2 Is NOT Required

**The following do NOT require version increment:**

#### Non-Trigger 1: Typo Fix
- Spelling correction
- Grammar fix
- Formatting improvement
- Link correction

#### Non-Trigger 2: Clarification That Does NOT Change Interpretation
- Add example that illustrates existing rule
- Add note that makes implicit rule explicit without changing behavior
- Reword for clarity while preserving semantics

#### Non-Trigger 3: Metadata Update
- Update "Last Updated" date
- Add repository revision reference (if previously missing)
- Update cross-references to other contracts (if contract number changes but rule unchanged)

#### Non-Trigger 4: Documentation Addition
- Add appendix with examples
- Add glossary
- Add FAQ
- Add diagram

**These are handled via errata or in-place updates (with git commit record).**

---

## BREAKING CHANGE DEFINITION

**Breaking Change:** Change that requires dependents to modify behavior to remain compliant

### Examples of Breaking Changes

#### Breaking: Add Mandatory Requirement
**Phase 0.2 V1 → V2:**
- V1: Gates 1, 2, 3
- V2: Gates 1, 2, 2.5, 3 (Gate 2.5 added)
- **Impact:** Projects using V1 must add Gate 2.5 approval step
- **Breaking:** YES (new gate is mandatory)

#### Breaking: Remove Requirement
**Phase 0.3 V1 → V2:**
- V1: GATE-CONTROLLED zone includes TutorialBlockRenderer.tsx
- V2: TutorialBlockRenderer.tsx now UNRESTRICTED
- **Impact:** Projects no longer need Gate 2 approval for renderer changes
- **Breaking:** NO (relaxation of requirement — backward compatible)

**Wait, is removing a requirement breaking?**

**Nuance:** Depends on direction of compatibility:
- **Backward compatible:** V2-compliant projects can use V1 rules (more restrictive OK)
- **Forward compatible:** V1-compliant projects can use V2 rules (may not comply)

**In governance context:**
- Adding requirement: BREAKING (V1 projects don't comply with V2)
- Removing requirement: NON-BREAKING (V1 projects over-comply with V2)

#### Breaking: Change Authority
**Phase 0.1 V1 → V2:**
- V1: Human approves Gates 1, 2, 3
- V2: Human approves Gates 1, 3; Project LLM approves Gate 2
- **Impact:** Project processes must change (authority delegation)
- **Breaking:** YES (authority model changed)

#### Breaking: Change Evidence Requirements
**Phase 0.6 V1 → V2:**
- V1: UBRC evidence requires DOM inspection
- V2: UBRC evidence requires DOM inspection + automated runtime verification
- **Impact:** Projects must collect additional evidence
- **Breaking:** YES (new evidence class required)

#### Non-Breaking: Add Optional Requirement
**Phase 0.5 V1 → V2:**
- V1: Candidate package includes 11 required directories
- V2: Candidate package includes 11 required + 2 optional directories
- **Impact:** Projects may include optional directories for enhanced evidence
- **Breaking:** NO (optional addition — V1 packages still compliant)

#### Non-Breaking: Clarification
**Phase 0.7 V1 → V2:**
- V1: "E2E evidence required"
- V2: "E2E evidence required for all certified blocks; scope/depth conditional on block classification"
- **Impact:** Clarifies existing rule without changing requirement
- **Breaking:** NO (clarification of intent, not new requirement)

### Breaking Change Classification

| Change Type | Example | Breaking | Rationale |
|-------------|---------|----------|-----------|
| **Add mandatory requirement** | New gate, new evidence class | ✅ BREAKING | V1 projects don't comply |
| **Remove requirement** | Delete gate, relax evidence | ❌ NON-BREAKING | V1 projects over-comply (OK) |
| **Change requirement** | Modify evidence format | ✅ BREAKING | V1 evidence invalid under V2 |
| **Add optional requirement** | Optional evidence class | ❌ NON-BREAKING | V1 projects still compliant |
| **Change authority** | Delegate approval | ✅ BREAKING | Process changes required |
| **Add clarification** | Example, note | ❌ NON-BREAKING | No behavior change |
| **Expand scope** | Add new runtime system | ✅ BREAKING | New requirements introduced |
| **Fix contradiction** | Resolve conflicting rules | ⚠️ CONTEXT-DEPENDENT | May be breaking if resolution changes interpretation |

---

## COMPATIBILITY SEMANTICS

### Compatibility Dimensions

**Governance contract compatibility has 3 dimensions:**

1. **Content Compatibility:** Can V2 rules be followed by V1-compliant projects?
2. **Dependency Compatibility:** Can V2 depend on V1 dependencies?
3. **Evidence Compatibility:** Can V1 evidence satisfy V2 requirements?

### Backward Compatibility

**Definition:** Project compliant with V1 can be compliant with V2 without modification

**Example (Backward Compatible):**
- Phase 0.3 V1: Gate 2 required for renderer changes
- Phase 0.3 V2: Gate 2 NOT required for renderer changes
- **Result:** Project following V1 (seeks Gate 2) over-complies with V2 → still compliant
- **Backward compatible:** ✅ YES

**Example (NOT Backward Compatible):**
- Phase 0.2 V1: Gates 1, 2, 3
- Phase 0.2 V2: Gates 1, 2, 2.5, 3
- **Result:** Project following V1 (no Gate 2.5) does NOT comply with V2
- **Backward compatible:** ❌ NO

**Rule:** Backward compatibility = V2 is superset or relaxation of V1

### Forward Compatibility

**Definition:** Project compliant with V2 can be compliant with V1 without modification

**Example (Forward Compatible):**
- Phase 0.3 V1: Gate 2 required for renderer changes
- Phase 0.3 V2: Gate 2 NOT required for renderer changes
- **Result:** Project following V2 (no Gate 2) violates V1 → NOT compliant
- **Forward compatible:** ❌ NO

**Example (Forward Compatible):**
- Phase 0.2 V1: Gates 1, 2, 3
- Phase 0.2 V2: Gates 1, 2, 2.5, 3
- **Result:** Project following V2 (includes Gate 2.5) over-complies with V1 → still compliant
- **Forward compatible:** ✅ YES

**Rule:** Forward compatibility = V2 is subset or strengthening of V1

### Compatibility Matrix

| V1 → V2 Change | Backward Compatible | Forward Compatible | Notes |
|---------------|--------------------|--------------------|-------|
| **Add requirement** | ❌ NO | ✅ YES | V2 projects over-comply with V1 |
| **Remove requirement** | ✅ YES | ❌ NO | V1 projects over-comply with V2 |
| **Change requirement** | ❌ NO | ❌ NO | Incompatible change |
| **Add optional** | ✅ YES | ✅ YES | Compatible change |

### Practical Governance Compatibility

**In practice, governance evolution is typically:**
- Backward incompatible (new requirements added)
- Forward compatible (V2 projects can use V1 rules as superset)

**Example:**
- Phase 0.2 V2 adds Gate 2.5
- Projects using V2 governance (Gates 1, 2, 2.5, 3) can satisfy V1 requirements (Gates 1, 2, 3)
- Projects using V1 governance cannot satisfy V2 requirements without adding Gate 2.5

**Implication:** Governance evolution is typically one-way (projects must migrate forward, not backward)

---

## COMPATIBILITY DECLARATION

**Each contract version should declare compatibility:**

```markdown
## COMPATIBILITY

**Backward Compatible with V1:** NO  
**Forward Compatible with V1:** YES  
**Breaking Changes:** Gate 2.5 added (new mandatory approval gate)  
**Migration Required:** Projects must implement Gate 2.5 approval step  
```

**Example (Non-Breaking):**
```markdown
## COMPATIBILITY

**Backward Compatible with V1:** YES  
**Forward Compatible with V1:** NO  
**Breaking Changes:** None (renderer registration no longer requires Gate 2 — relaxation only)  
**Migration Required:** None (V1 projects remain compliant; may optionally simplify to V2)  
```

---

## SEMVER EVALUATION

**Should governance contracts adopt Semantic Versioning (SemVer)?**

### SemVer Model

**Format:** `MAJOR.MINOR.PATCH` (e.g., 1.0.0, 1.1.0, 2.0.0)

**Rules:**
- **MAJOR:** Incompatible API changes (breaking)
- **MINOR:** Add functionality (backward-compatible)
- **PATCH:** Bug fixes (backward-compatible)

**Example:**
- Phase 0.2 Version 1.0.0
- Add Gate 2.5 (breaking) → 2.0.0
- Add optional evidence (non-breaking) → 1.1.0
- Fix typo (patch) → 1.0.1

### SemVer Advantages for Governance

1. **Industry Standard:** Widely understood versioning model
2. **Semantic Meaning:** Version number conveys compatibility information
3. **Automated Tooling:** Package managers understand SemVer
4. **Dependency Constraints:** Can express "depends on >=1.0.0, <2.0.0"

### SemVer Disadvantages for Governance

1. **Complexity:** Three-number versioning more complex than needed
2. **Patch Ambiguity:** What is a governance "patch"? (errata already handle typos)
3. **Minor Ambiguity:** What is governance "minor"? (optional additions rare in governance)
4. **Human Interpretation:** Governance contracts are human-interpreted, not machine APIs
5. **Rare Changes:** Governance changes are rare; full SemVer granularity may be overkill

### Proposed Hybrid Model

**Use simple integer major versions + compatibility declaration:**

**Format:** `V{MAJOR}` (e.g., V1, V2, V3)

**Rationale:**
- Governance changes are rare and significant (MAJOR version increments)
- MINOR/PATCH granularity not needed (errata handles typos, clarifications rare)
- Compatibility explicitly declared in contract header (not inferred from version number alone)
- Simpler for humans to understand ("Phase 0.2 V2" vs "Phase 0.2 Version 2.0.0")

**Reserve SemVer for future if needed:**
- If governance evolution requires finer granularity (unlikely)
- If automated tooling requires SemVer (not current requirement)
- If cross-system integration demands SemVer (not current requirement)

**Decision:** Use simple integer versioning (V1, V2, V3) with explicit compatibility declaration

---

## DEPENDENCY VERSION CONSTRAINTS

**How should contracts express dependency version requirements?**

### Constraint Models

#### Model 1: Exact Version (Pinned)
```markdown
**Depends on:**
- Phase 0.1 V1 (exact)
```
**Meaning:** Only V1 accepted, V2 not compatible

#### Model 2: Minimum Version
```markdown
**Depends on:**
- Phase 0.1 V1 or later
```
**Meaning:** V1, V2, V3 all accepted (forward compatible)

#### Model 3: Range
```markdown
**Depends on:**
- Phase 0.1 V1-V2
```
**Meaning:** V1 and V2 accepted, V3 not (bounded compatibility)

#### Model 4: Unversioned (Latest)
```markdown
**Depends on:**
- Phase 0.1
```
**Meaning:** Use latest frozen version at time of interpretation

### Proposed Dependency Model

**Default:** Exact version at time of contract creation

**Rationale:**
- Governance contracts are frozen, not dynamically updated
- Exact version ensures stability (contract tested against specific dependency version)
- Prevents silent behavior change if dependency evolves

**Example:**
- Phase 0.10 V1 created 2026-09-30, depends on Phase 0.2 V1
- Phase 0.2 V2 created 2027-03-15
- Phase 0.10 V1 dependency does NOT automatically upgrade to Phase 0.2 V2

**Explicit upgrade:**
```markdown
**Depends on:**
- Phase 0.2 V1 or later (forward compatible tested)
```

**Or create Phase 0.10 V2:**
- Phase 0.10 V2 depends on Phase 0.2 V2

### Dependency Evolution Workflow

**When dependency evolves (Phase 0.2 V1 → V2):**

1. **Assess Impact:** Does Phase 0.10 V1 remain compatible with Phase 0.2 V2?
2. **If Compatible:** Update Phase 0.10 V1 dependency declaration to "V1 or later" (minor update, not V2)
3. **If Incompatible:** Create Phase 0.10 V2 that depends on Phase 0.2 V2
4. **Document Decision:** Record compatibility assessment in changelog

**Example:**
```markdown
## Phase 0.10 V1 Dependency Update (2027-03-20)

**Change:** Dependency on Phase 0.2 updated from "V1" to "V1 or later"  
**Reason:** Phase 0.2 V2 backward compatible (no breaking changes affecting Phase 0.10)  
**Impact:** None (Phase 0.10 V1 remains compliant with both Phase 0.2 V1 and V2)  
**Authority:** Human Architecture Authority  
**Commit:** def456  
```

---

## MIGRATION PROCEDURES

**How do projects migrate from V1 to V2?**

### Migration Phases

#### Phase 1: Impact Assessment
- Review V2 changes (read CHANGES FROM V1 section)
- Identify affected processes (gates, evidence, validation)
- Assess effort required (hours, days, weeks)
- Determine compatibility (can we run V1 and V2 in parallel?)

#### Phase 2: Migration Planning
- Create migration checklist (based on V2 breaking changes)
- Identify migration dependencies (e.g., must migrate Phase 0.2 before Phase 0.10)
- Allocate resources (human time, tooling updates)
- Schedule migration (immediate, phased, deferred)

#### Phase 3: Migration Execution
- Update processes to comply with V2
- Update tooling/automation (if any)
- Train team on V2 changes
- Update documentation references (change V1 → V2 in project docs)

#### Phase 4: Migration Verification
- Verify V2 compliance (e.g., Gate 2.5 approval process in place)
- Test changes (dry run with V2 rules)
- Document migration (record what changed, when, by whom)

#### Phase 5: Migration Completion
- Retire V1 processes (if fully replaced)
- Update project governance metadata (declare "using Phase 0.2 V2")
- Preserve V1 historical records (do not delete)

### Migration Strategies

#### Strategy 1: Big Bang Migration
- **Approach:** Migrate all dependencies simultaneously
- **When:** Few dependencies, small changes, tight coupling
- **Example:** Project uses Phase 0.1-0.9 V1; migrate all to V2 at once
- **Risk:** High coordination required, rollback difficult

#### Strategy 2: Phased Migration
- **Approach:** Migrate one contract at a time
- **When:** Many dependencies, large changes, independent contracts
- **Example:** Migrate Phase 0.2 V1→V2, then Phase 0.10 V1→V2 later
- **Risk:** Temporary mixed-version state (V1 + V2 coexisting)

#### Strategy 3: Parallel Adoption
- **Approach:** Run V1 and V2 processes in parallel temporarily
- **When:** High risk, need validation, gradual rollout
- **Example:** New projects use V2, existing projects use V1 until migration ready
- **Risk:** Dual process overhead

#### Strategy 4: Deferred Migration
- **Approach:** Continue using V1 indefinitely
- **When:** V2 changes not applicable, V1 remains compliant
- **Example:** Project completed under V1 governance, no need to retroactively migrate
- **Risk:** V1 may eventually be deprecated

### Migration Guidance in V2 Contract

**Each V2 contract should include migration guidance:**

```markdown
## MIGRATION FROM V1

**Summary:** Gate 2.5 added; projects must implement new approval step

**Required Changes:**
1. Add Gate 2.5 approval process between Gate 2 and Gate 3
2. Define Gate 2.5 approval authority (recommended: same as Gate 2)
3. Update lifecycle documentation to include Gate 2.5
4. Train team on Gate 2.5 evidence requirements

**Optional Changes:**
1. Automate Gate 2.5 evidence collection (if feasible)

**Verification:**
- Run through complete lifecycle with Gate 2.5 approval
- Confirm Gate 2.5 evidence collected and approved
- Update project governance declaration to V2

**Estimated Effort:** 4-8 hours (one-time setup)

**Compatibility Note:** Projects may continue using V1 temporarily if Gate 2.5 not immediately critical; however, V2 compliance required for future certification

**Rollback:** If Gate 2.5 proves problematic, projects may revert to V1 with Human Architecture Authority approval
```

---

## CROSS-VERSION EVIDENCE VALIDITY

**Does evidence produced under V1 remain valid under V2?**

### Evidence Validity Principles

#### Principle 1: Evidence Tied to Contract Version
**Evidence is produced under specific contract version at specific time.**

**Example:**
- Block certified 2026-10-15 under Phase 0.6 V1
- Phase 0.6 V2 created 2027-03-15 (adds new evidence class)
- **Question:** Is 2026-10-15 certification still valid?

#### Principle 2: Historical Evidence Immutable
**Evidence remains historically true regardless of contract evolution.**

**Example:**
- Evidence from 2026-10-15 proves "block complied with Phase 0.6 V1 on 2026-10-15"
- Phase 0.6 V2 does NOT invalidate historical fact
- However, evidence may NOT prove "block complies with Phase 0.6 V2"

#### Principle 3: Evidence Revalidation May Be Required
**If V2 adds requirements, V1 evidence insufficient for V2 certification.**

**Example:**
- Phase 0.6 V2 adds "UBRC runtime verification" evidence class
- Block certified under V1 without runtime verification
- **Result:** Block is NOT automatically V2-certified (new evidence required)
- **Action:** Collect new evidence + revalidate against V2 → V2 certification

### Evidence Validity Decision Matrix

| Scenario | V1 Evidence Valid for V2? | Action Required |
|----------|--------------------------|-----------------|
| **V2 adds evidence class** | ❌ INSUFFICIENT | Collect new evidence, revalidate |
| **V2 removes evidence class** | ✅ OVER-SUFFICIENT | None (V1 evidence exceeds V2 requirements) |
| **V2 changes evidence format** | ⚠️ PARTIAL | Convert/update evidence to V2 format |
| **V2 clarifies evidence requirement** | ✅ VALID (if compliant) | Verify V1 evidence meets clarified requirement |
| **V2 unrelated to evidence** | ✅ VALID | None |

### Evidence Validity Governance

**Each V2 contract should declare evidence validity:**

```markdown
## EVIDENCE VALIDITY

**V1 Evidence Status Under V2:**

- UBRC Evidence (V1): ✅ VALID (no changes to UBRC requirements)
- ILS Evidence (V1): ⚠️ PARTIAL (V2 adds active time verification; must supplement)
- E2E Evidence (V1): ✅ VALID (V2 clarifies scope but does not change requirement)
- Certification Evidence (V1): ❌ INSUFFICIENT (V2 adds new certification criteria)

**Revalidation Guidance:**
- Blocks certified under V1 must collect additional ILS active time evidence for V2 certification
- Blocks certified under V1 must undergo V2 certification review (does not require full re-execution)
```

---

## CERTIFICATION ACROSS VERSIONS

**Is block certified under V1 still certified under V2?**

### Certification Version Binding

**Certification is bound to contract version:**

**Example:**
- Block X certified 2026-10-15 under Phase 0.1-0.9 V1
- Certification statement: "Block X CERTIFIED under Phase 0.1-0.9 V1 governance as of 2026-10-15"
- Phase 0.6 V2 created 2027-03-15
- **Result:** Block X certification remains valid AS "V1 CERTIFIED" (historical record)
- **But:** Block X is NOT automatically "V2 CERTIFIED"

### Certification Status After Contract Evolution

| Certification Statement | After V2 Created | Interpretation |
|------------------------|------------------|----------------|
| **"Block X CERTIFIED 2026-10-15"** (no version) | ⚠️ AMBIGUOUS | Requires retroactive version qualification |
| **"Block X CERTIFIED under V1 governance"** | ✅ CLEAR | Historical V1 certification |
| **"Block X CERTIFIED (current)"** | ⚠️ STALE | "Current" changes when V2 becomes active |
| **"Block X V1-CERTIFIED, V2-PENDING"** | ✅ CLEAR | Explicit version status |

### Certification Migration Workflows

#### Workflow 1: Retroactive Certification (No Revalidation)
**When:** V2 changes unrelated to certified block

**Process:**
1. Review V2 changes
2. Assess impact on certified block (none)
3. Declare "Block X V1-CERTIFIED remains compliant with V2" (documentary upgrade)
4. Update certification metadata: "V1-CERTIFIED, V2-COMPLIANT"

**Example:**
- Block uses Phase 0.2 V1 (Gates 1, 2, 3)
- Phase 0.2 V2 adds Gate 2.5
- Gate 2.5 not applicable to this block type
- **Result:** Block retroactively V2-compliant without revalidation

#### Workflow 2: Recertification (Revalidation Required)
**When:** V2 adds requirements affecting certified block

**Process:**
1. Review V2 changes
2. Identify new requirements (e.g., new evidence class)
3. Collect new evidence
4. Perform V2 validation
5. Human approval (if required by Phase 0.2)
6. Issue V2 certification
7. Update certification metadata: "V1-CERTIFIED (2026-10-15), V2-CERTIFIED (2027-03-20)"

**Example:**
- Block certified under Phase 0.6 V1
- Phase 0.6 V2 adds runtime verification evidence class
- Block must collect runtime evidence + revalidate
- **Result:** Block has dual certification (V1 historical, V2 current)

#### Workflow 3: Certification Revocation
**When:** V2 reveals V1 certification invalid

**Process:**
1. Review V2 changes
2. Discover V1 certification did not detect non-compliance
3. STOP (Phase 0.8 Certification STOP)
4. Revoke V1 certification (mark SUPERSEDED_INVALID)
5. Repair block to meet V2
6. Revalidate and recertify under V2

**Example:**
- Block certified under Phase 0.6 V1
- Phase 0.6 V2 adds stricter evidence integrity requirements
- Discover V1 evidence was fabricated (missed in V1)
- **Result:** V1 certification revoked, block must be recertified under V2 with valid evidence

### Certification Metadata Model

**Proposed certification metadata:**

```json
{
  "blockId": "summary-block-v3",
  "certifications": [
    {
      "certificationId": "CERT-001",
      "governanceVersion": "Phase 0.1-0.9 V1",
      "certifiedDate": "2026-10-15",
      "certifiedBy": "Project LLM",
      "approvedBy": "Human (Gate 3)",
      "status": "SUPERSEDED",
      "supersededBy": "CERT-002",
      "evidenceLocation": "evidence/summary-block-v3-cert-001/",
      "notes": "Initial certification under V1 governance"
    },
    {
      "certificationId": "CERT-002",
      "governanceVersion": "Phase 0.1-0.9 V2",
      "certifiedDate": "2027-03-20",
      "certifiedBy": "Project LLM",
      "approvedBy": "Human (Gate 3)",
      "status": "ACTIVE",
      "supersedes": "CERT-001",
      "evidenceLocation": "evidence/summary-block-v3-cert-002/",
      "notes": "Recertified under V2 governance; added runtime verification evidence"
    }
  ]
}
```

---

## VERSION LIFECYCLE STATES (REVISITED)

**From Step 3, refined with versioning semantics:**

| State | Meaning | Version Behavior | Compatibility Status |
|-------|---------|-----------------|---------------------|
| **DRAFT** | Under development | Unstable, may change | N/A (not for use) |
| **FROZEN** | Immutable, authoritative | Stable, canonical | Active, current |
| **SUPERSEDED** | Replaced by newer version | Historical reference | Backward compatible or incompatible (declared) |
| **DEPRECATED** | Discouraged, not replaced | Still usable, not recommended | May have known issues |
| **ARCHIVED** | Removed from active use | Historical only | No longer supported |
| **ABANDONED** | Draft never completed | Not for use | N/A |

**Example:**
- Phase 0.2 V1: FROZEN (2026-09-30)
- Phase 0.2 V2: FROZEN (2027-03-15) → V1 becomes SUPERSEDED
- Phase 0.2 V1: SUPERSEDED (historical reference, backward incompatible with V2)

---

## UNRESOLVED QUESTIONS FOR STEP 5 (LIFECYCLE STATES)

1. **EFFECTIVE vs FROZEN:** Are these the same state or different? (Step 5 task)
2. **SUPERSEDED vs DEPRECATED:** When to use which?
3. **HISTORICAL state:** Is this separate from SUPERSEDED/ARCHIVED?
4. **Transition triggers:** What events cause state transitions?

**These questions are addressed in Step 5: Lifecycle State Design.**

---

## PHASE 0.10 STEP 4 COMPLETION STATUS: ✅ COMPLETE

**Completed:**
1. ✅ Version increment triggers defined (5 triggers requiring V2, 4 non-triggers)
2. ✅ Breaking change definition established (affects dependents' compliance)
3. ✅ Compatibility semantics defined (backward, forward, content, dependency, evidence)
4. ✅ Compatibility declaration format specified
5. ✅ SemVer evaluated and rejected for governance (simple integers preferred)
6. ✅ Dependency version constraints designed (exact version default)
7. ✅ Dependency evolution workflow defined
8. ✅ Migration procedures specified (5 phases, 4 strategies)
9. ✅ Cross-version evidence validity rules defined
10. ✅ Certification across versions governance designed (3 workflows)
11. ✅ Certification metadata model proposed
12. ✅ Unresolved questions identified for Step 5

**Key Decisions:**
- Simple integer versioning (V1, V2, V3) over SemVer
- Explicit compatibility declaration in each V2 contract
- Breaking changes require V2; non-breaking handled via errata or in-place updates
- Evidence tied to contract version; V2 may require revalidation
- Certification bound to governance version; dual certification possible

**Ready for Phase 0.10 Step 5:** Lifecycle State Design (EFFECTIVE, SUPERSEDED, HISTORICAL — distinguish from existing states)

---

**End of Phase 0.10 Step 4 — Versioning Model Design COMPLETE**
