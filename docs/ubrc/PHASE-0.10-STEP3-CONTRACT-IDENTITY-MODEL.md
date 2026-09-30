# Phase 0.10 Step 3: Contract Identity Model Design

**Created:** 2026-09-30  
**Status:** IN PROGRESS (Step 3 of Phase 0.10 methodology)  
**Authority:** Phase 0.10 governance design process  
**Purpose:** Design (not infer) how frozen governance contracts are uniquely identified across versions, ensuring unambiguous reference, dependency resolution, and historical preservation

---

## DESIGN PRINCIPLE

**Do NOT infer identity model from observed `-V1` filename convention.**

**Design Requirements:**
1. Unambiguous identification of any contract at any version
2. Support for historical preservation (Phase 0.9 requirement)
3. Support for dependency versioning (cross-contract references)
4. Support for migration (contract evolution without breaking existing references)
5. Human-readable and machine-parseable
6. Compatible with git, filesystem, and documentation tools
7. Distinguish contract identity from contract version

---

## OBSERVED CURRENT STATE (Not Design Inference)

### Current Filename Convention
```
PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md
PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md
PHASE-0.3-REPOSITORY-MODIFICATION-CONTRACT-V1.md
PHASE-0.4-RUNTIME-BOUNDARY-CONTRACT-V1.md
PHASE-0.5-HANDOFF-PROTOCOL-CONTRACT-V1.md
PHASE-0.6-EVIDENCE-AND-CERTIFICATION-CONTRACT-V1.md
PHASE-0.7-VALIDATION-AND-TESTING-CONTRACT-V1.md
PHASE-0.8-STOP-CONDITIONS-CONTRACT-V1.md
PHASE-0.9-ROLLBACK-AND-RECOVERY-CONTRACT-V1.md
```

**Pattern:**
```
PHASE-{phase-number}-{subject-in-caps}-CONTRACT-V{version-number}.md
```

**Observations:**
- `PHASE-{number}` appears to be contract identity prefix
- `-V{number}` appears to be version suffix
- Middle segment is contract subject (AI-ROLES, HUMAN-APPROVAL, etc.)
- `.md` is file extension (governance contracts are markdown documents)

**Question for Design:** Is `-V1` part of identity or version indicator?

### Current Internal Contract Headers

**Phase 0.1 Header:**
```markdown
# PHASE 0.1 — AI ROLES & RESPONSIBILITY CONTRACT V1

**Document Type:** Governance Contract  
**Status:** FROZEN  
**Date:** 2026-09-30  
**Version:** 1.0  
**Authority:** Foundational Contract for AI Tutorial Block Creation Lifecycle
```

**Phase 0.7 Header:**
```markdown
# Phase 0.7 — Validation & Testing Contract V1

**Status:** FROZEN  
**Created:** 2026-09-30  
**Frozen:** 2026-09-30  
**Authority:** Human Architecture Authority  
**Repository Revision:** fba6f2a3  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle
```

**Observations:**
- Title includes "V1" suffix
- Internal metadata includes `Version: 1.0` (Phase 0.1) or omits version field (Phase 0.7)
- Inconsistent metadata across contracts
- Some include `Repository Revision` (commit hash), some do not
- **Question:** Is "V1" in title the same as "Version: 1.0" in metadata?

### Current Dependency References

**Phase 0.2 Dependency Statement:**
```markdown
**Prerequisite:** Phase 0.1 — AI Roles & Responsibility Contract (FROZEN)
```

**Phase 0.5 Dependency Statement:**
```markdown
**This contract depends on:**
- Phase 0.1 — AI Roles & Responsibility Contract V1
- Phase 0.2 — Human Approval Contract V1 (Gate 1: Prototype Approval)
- Phase 0.3 — Repository Modification Contract V1
- Phase 0.4 — Runtime Boundary Contract V1
```

**Observations:**
- Sometimes includes "V1" suffix, sometimes omits it
- Sometimes includes "(FROZEN)" status qualifier
- Sometimes includes contextual note (e.g., "Gate 1: Prototype Approval")
- **Inconsistency:** No standard reference format

---

## IDENTITY MODEL DESIGN

### Identity Model Goals

1. **Stable Identity:** Contract identity does NOT change when version changes
2. **Unambiguous Reference:** Any reference uniquely identifies intended contract
3. **Version Independence:** Can refer to "the Human Approval contract" without specifying version when context is clear
4. **Version Specificity:** Can refer to "Phase 0.2 V1" or "Phase 0.2 V2" when version matters
5. **Historical Traceability:** Old references remain valid and resolvable
6. **Filesystem Compatibility:** Works with git, markdown, documentation tools
7. **Human Readability:** Developers can understand references without lookup tables

### Proposed Identity Components

**Contract identity consists of 3 orthogonal components:**

| Component | Purpose | Example | Mutability |
|-----------|---------|---------|-----------|
| **Contract Number** | Stable unique identifier within Phase 0 governance | `0.1`, `0.2`, `0.10` | IMMUTABLE |
| **Contract Subject** | Human-readable name | `AI Roles & Responsibility`, `Human Approval` | IMMUTABLE |
| **Contract Version** | Evolution tracking | `1`, `2`, `3` | MUTABLE (increments on change) |

**Full Contract Identity:**
```
Phase {number} ({subject}) Version {version}
```

**Examples:**
- Phase 0.1 (AI Roles & Responsibility) Version 1
- Phase 0.2 (Human Approval) Version 1
- Phase 0.10 (Contract Versioning & Evolution) Version 1

**Canonical Short Form:**
```
Phase {number} V{version}
```

**Examples:**
- Phase 0.1 V1
- Phase 0.2 V2
- Phase 0.10 V1

**Unversioned Reference (when version unambiguous from context):**
```
Phase {number}
```

**Examples:**
- Phase 0.1 (when all dependencies use V1)
- Phase 0.2 (when referring to contract in general, not specific version)

### Filename Model

**Proposed Filename Format:**
```
PHASE-{number}-{SUBJECT-KEBAB-CASE}-CONTRACT-V{version}.md
```

**Rationale:**
- `-V{version}` is part of filename to enable multiple versions to coexist in same directory
- Filename encodes both identity (number + subject) and version
- Git history preserves version evolution (V1 → V2 as separate files allows historical preservation)

**Examples:**
```
PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md
PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V2.md  (hypothetical future)
PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md
PHASE-0.10-CONTRACT-VERSIONING-EVOLUTION-CONTRACT-V1.md
```

**Alternative filename pattern (if V2 overwrites V1):**
```
PHASE-{number}-{SUBJECT-KEBAB-CASE}-CONTRACT.md
```

**Rejected because:**
- Loses historical preservation (V1 file deleted/overwritten)
- Violates Phase 0.9 "Historical Truth Is Immutable"
- Git history required to access V1 after V2 created

**Decision:** Filename MUST include version number to preserve historical versions as distinct files.

### Internal Contract Header Model

**Proposed Standard Metadata:**

```markdown
# Phase {number} — {Subject} Contract V{version}

**Contract Number:** {number}  
**Contract Subject:** {Subject}  
**Contract Version:** {version}  
**Status:** DRAFT | FROZEN | SUPERSEDED | DEPRECATED  
**Created:** {YYYY-MM-DD}  
**Frozen:** {YYYY-MM-DD} (if FROZEN or SUPERSEDED)  
**Superseded By:** Phase {number} V{next-version} (if SUPERSEDED)  
**Supersedes:** Phase {number} V{prev-version} (if version > 1)  
**Repository Revision (Freeze):** {commit-hash} (if FROZEN)  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  
```

**Example (Phase 0.1 V1):**
```markdown
# Phase 0.1 — AI Roles & Responsibility Contract V1

**Contract Number:** 0.1  
**Contract Subject:** AI Roles & Responsibility  
**Contract Version:** 1  
**Status:** FROZEN  
**Created:** 2026-09-30  
**Frozen:** 2026-09-30  
**Superseded By:** None (current version)  
**Supersedes:** None (initial version)  
**Repository Revision (Freeze):** (not recorded in original Phase 0.1)  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  
```

**Example (hypothetical Phase 0.2 V2):**
```markdown
# Phase 0.2 — Human Approval Contract V2

**Contract Number:** 0.2  
**Contract Subject:** Human Approval  
**Contract Version:** 2  
**Status:** FROZEN  
**Created:** 2027-03-15  
**Frozen:** 2027-03-20  
**Superseded By:** None (current version)  
**Supersedes:** Phase 0.2 V1  
**Repository Revision (Freeze):** abc123f  
**Authority:** Human Architecture Authority  
**Lifecycle Context:** AI Tutorial Block Creation, Integration & Certification Lifecycle  

---

## CHANGES FROM V1

**Summary:** Added Gate 2.5 for architecture pre-approval; clarified Gate 3 evidence requirements

**Impact:** Projects using V1 should review Gate 2.5 applicability

**Migration:** See Phase 0.10 migration guidance
```

### Dependency Reference Model

**Proposed Dependency Declaration Format:**

**Unversioned (when all dependencies use same version):**
```markdown
**This contract depends on:**
- Phase 0.1 (AI Roles & Responsibility)
- Phase 0.2 (Human Approval)
```

**Versioned (when version specificity required):**
```markdown
**This contract depends on:**
- Phase 0.1 V1 (AI Roles & Responsibility)
- Phase 0.2 V1 (Human Approval)
- Phase 0.3 V2 (Repository Modification) [Note: Requires V2 due to new checkpoint mechanism]
```

**Full Reference (maximum clarity):**
```markdown
**This contract depends on:**
- Phase 0.1 (AI Roles & Responsibility) Version 1 — Status: FROZEN
- Phase 0.2 (Human Approval) Version 1 — Status: FROZEN
```

**Recommendation:** Use versioned references when:
1. Multiple versions of dependency exist
2. Dependency version matters for compatibility
3. Contract explicitly requires specific version

Use unversioned references when:
1. Only one version exists
2. Contract works with any version (forward/backward compatible)
3. Version context is clear from contract creation date

---

## IDENTITY RESOLUTION RULES

### Rule 1: Contract Number Is Immutable

**Once assigned, contract number NEVER changes, even across versions.**

Example:
- Phase 0.2 V1 → Phase 0.2 V2 (number remains 0.2)
- Phase 0.10 V1 → Phase 0.10 V2 (number remains 0.10)

**Prohibited:**
- Phase 0.2 V1 → Phase 0.2a V1 (number cannot branch)
- Phase 0.2 V1 → Phase 0.3 V2 (number cannot change)

**Rationale:** Contract number is stable anchor for references

### Rule 2: Contract Subject Is Immutable

**Contract subject NEVER changes, even across versions.**

Example:
- Phase 0.2 (Human Approval) V1 → Phase 0.2 (Human Approval) V2 (subject unchanged)

**Prohibited:**
- Phase 0.2 (Human Approval) V1 → Phase 0.2 (Approval & Authorization) V2 (subject change not allowed)

**If subject must change:** Create new contract with new number (e.g., Phase 0.11) and deprecate old contract

**Rationale:** Subject stability ensures references remain meaningful

### Rule 3: Version Number Increments Sequentially

**Version numbers are positive integers starting at 1, incrementing by 1.**

- V1 → V2 → V3 → V4
- NOT: V1 → V1.1 → V1.2 (no sub-versions)
- NOT: V1 → V3 (no skipping)

**Rationale:** Simple, predictable, human-readable

### Rule 4: Filename Uniquely Identifies Version

**Filename encoding:**
```
PHASE-{number}-{SUBJECT}-CONTRACT-V{version}.md
```

**Rule:** Given filename, contract identity and version are fully determined.

**Example:**
- `PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md` → Phase 0.2 V1
- `PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V2.md` → Phase 0.2 V2

### Rule 5: Multiple Versions Coexist as Distinct Files

**Phase 0.2 evolution:**
```
docs/ubrc/
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md (FROZEN, SUPERSEDED)
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V2.md (FROZEN, current)
```

**Rationale:**
- Historical preservation (Phase 0.9 requirement)
- Audit trail (can compare V1 vs V2)
- Old projects can reference V1 explicitly
- Git history not required to access V1

### Rule 6: References Without Version Default to Latest Frozen

**When reference omits version:**
```markdown
**This contract depends on:**
- Phase 0.2 (Human Approval)
```

**Resolution rule:**
1. If only one version exists → use that version
2. If multiple versions exist → use latest FROZEN version
3. If no FROZEN version exists → ERROR (cannot depend on DRAFT)

**Explicit version overrides default:**
```markdown
**This contract depends on:**
- Phase 0.2 V1 (Human Approval) [Pinned to V1 for stability]
```

### Rule 7: Superseded Versions Remain Resolvable

**Phase 0.2 V1 marked SUPERSEDED does NOT become unresolvable.**

**Valid references after V2 created:**
- `Phase 0.2 V1` → resolves to V1 (SUPERSEDED status noted)
- `Phase 0.2` → resolves to V2 (latest frozen)
- `Phase 0.2 (current)` → resolves to V2
- `Phase 0.2 (as of 2026-09-30)` → resolves to V1 (temporal reference)

**Invalid references:**
- `Phase 0.2 V3` → ERROR (does not exist)
- `Phase 0.99` → ERROR (contract number does not exist)

---

## IDENTITY LIFECYCLE STATES

**Contract identity has lifecycle independent of content:**

| State | Meaning | Allowed Transitions |
|-------|---------|-------------------|
| **DRAFT** | Contract under development, not frozen | → FROZEN, → ABANDONED |
| **FROZEN** | Contract immutable, authoritative | → SUPERSEDED (when V2 frozen), → DEPRECATED |
| **SUPERSEDED** | Contract replaced by newer version, historical record | None (terminal for that version) |
| **DEPRECATED** | Contract no longer recommended, but not superseded | → ARCHIVED |
| **ARCHIVED** | Contract removed from active governance, historical only | None (terminal) |
| **ABANDONED** | Draft contract never frozen, discarded | None (terminal) |

**Examples:**

**Normal evolution:**
```
Phase 0.2 V1: DRAFT → FROZEN → SUPERSEDED (when V2 frozen)
Phase 0.2 V2: DRAFT → FROZEN (current)
```

**Contract retirement without replacement:**
```
Phase 0.X V1: DRAFT → FROZEN → DEPRECATED → ARCHIVED
```

**Failed contract:**
```
Phase 0.X V1: DRAFT → ABANDONED
```

---

## IDENTITY PERSISTENCE MODEL

### Git Persistence

**Each version is a distinct file:**
- Enables git blame, diff, history per version
- Enables parallel development (V2 drafted while V1 frozen)
- Enables rollback (restore V1 file if V2 proves problematic)

**Git commit messages for contract changes:**
```
[GOVERNANCE] Freeze Phase 0.10 V1 (Contract Versioning & Evolution)

- Contract Number: 0.10
- Contract Version: 1
- Status: DRAFT → FROZEN
- Freeze Date: 2026-09-30
- Repository Revision: abc123f
```

### Filesystem Organization

**Proposed directory structure:**

```
docs/ubrc/
├── PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md
├── PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md
├── PHASE-0.3-REPOSITORY-MODIFICATION-CONTRACT-V1.md
├── ...
├── PHASE-0.10-CONTRACT-VERSIONING-EVOLUTION-CONTRACT-V1.md
├── governance-contracts-index.md  (lists all contracts, versions, status)
├── governance-contracts-changelog.md  (evolution history)
```

**Alternative: Version subdirectories:**
```
docs/ubrc/
├── phase-0.1/
│   └── V1.md (or PHASE-0.1-V1.md)
├── phase-0.2/
│   ├── V1.md
│   └── V2.md
```

**Decision:** Flat structure with version in filename preferred for simplicity and grep-ability

### Index File

**Proposed `governance-contracts-index.md`:**

```markdown
# Phase 0 Governance Contracts Index

**Last Updated:** 2026-09-30

| Number | Subject | Version | Status | Frozen | Superseded By | File |
|--------|---------|---------|--------|--------|---------------|------|
| 0.1 | AI Roles & Responsibility | 1 | FROZEN | 2026-09-30 | — | PHASE-0.1-AI-ROLES-RESPONSIBILITY-CONTRACT-V1.md |
| 0.2 | Human Approval | 1 | FROZEN | 2026-09-30 | — | PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md |
| 0.3 | Repository Modification | 1 | FROZEN | 2026-09-30 | — | PHASE-0.3-REPOSITORY-MODIFICATION-CONTRACT-V1.md |
| ... | ... | ... | ... | ... | ... | ... |
| 0.10 | Contract Versioning & Evolution | 1 | DRAFT | — | — | PHASE-0.10-CONTRACT-VERSIONING-EVOLUTION-CONTRACT-V1.md |

## Active Contracts (FROZEN, not SUPERSEDED)

- Phase 0.1 V1: AI Roles & Responsibility
- Phase 0.2 V1: Human Approval
- Phase 0.3 V1: Repository Modification
- Phase 0.4 V1: Runtime Boundary
- Phase 0.5 V1: Handoff Protocol
- Phase 0.6 V1: Evidence & Certification
- Phase 0.7 V1: Validation & Testing
- Phase 0.8 V1: STOP Conditions
- Phase 0.9 V1: Rollback & Recovery
- Phase 0.10 V1: Contract Versioning & Evolution (DRAFT)

## Historical Contracts (SUPERSEDED or DEPRECATED)

(None yet)
```

---

## IDENTITY COLLISION PREVENTION

**Rules to prevent identity collisions:**

1. **Contract numbers assigned sequentially:** 0.1, 0.2, 0.3, ..., 0.9, 0.10, 0.11, ... (never reuse)
2. **Version numbers per contract sequential:** V1, V2, V3, ... (never reuse within same contract)
3. **Filename uniqueness enforced:** Cannot create `PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md` twice
4. **Subject uniqueness not required:** Two contracts may have similar subjects (but different numbers prevent collision)

**Example:**
- Phase 0.2 (Human Approval)
- Phase 0.11 (Human Approval Extensions) — allowed (different number)

---

## IDENTITY RESOLUTION ALGORITHM

**Given reference string, resolve to contract identity:**

**Input:** `"Phase 0.2"` or `"Phase 0.2 V1"` or `"0.2"` or `"Human Approval"` or `"PHASE-0.2-HUMAN-APPROVAL-CONTRACT-V1.md"`

**Algorithm:**

```
1. Parse reference format:
   - If filename → extract number + version
   - If "Phase {number} V{version}" → extract number + version
   - If "Phase {number}" → extract number, version = DEFAULT_TO_LATEST_FROZEN
   - If "{number}" → extract number, version = DEFAULT_TO_LATEST_FROZEN
   - If "{subject}" → lookup number by subject, version = DEFAULT_TO_LATEST_FROZEN

2. Validate contract number exists:
   - Check governance-contracts-index.md
   - If not found → ERROR: Unknown contract

3. Resolve version:
   - If version explicit → use that version
   - If version implicit → use latest FROZEN version
   - Validate version exists for contract number
   - If not found → ERROR: Version does not exist

4. Return identity:
   - Contract Number: {number}
   - Contract Version: {version}
   - Filename: PHASE-{number}-{SUBJECT}-CONTRACT-V{version}.md
   - Status: {FROZEN | SUPERSEDED | ...}
```

---

## IDENTITY IN DEPENDENCY GRAPHS

**Dependency graphs must distinguish contract identity from version:**

**Example dependency:**
```
Phase 0.10 V1
    depends on:
        Phase 0.1 V1
        Phase 0.2 V1
        Phase 0.6 V1
```

**If Phase 0.2 V2 created:**
```
Phase 0.2 V1 (SUPERSEDED)
    dependents:
        Phase 0.10 V1 (explicitly pinned to V1)

Phase 0.2 V2 (FROZEN, current)
    dependents:
        Phase 0.11 V1 (uses default latest)
```

**Implication:** Dependency version matters for compatibility analysis

---

## DESIGN DECISIONS SUMMARY

1. **Contract Number + Subject = Immutable Identity**
2. **Version Number = Mutable Evolution Tracking**
3. **Filename Includes Version** (preserves historical files)
4. **Sequential Integer Versioning** (V1, V2, V3, ... — no SemVer yet)
5. **Latest Frozen Default** (unversioned references resolve to latest)
6. **Historical Preservation Required** (V1 file remains when V2 created)
7. **Standardized Metadata Header** (consistent across all contracts)
8. **Governance Contracts Index** (central registry of all contracts)
9. **Flat Filesystem Structure** (all contracts in `docs/ubrc/` with version in filename)
10. **Identity Lifecycle States** (DRAFT, FROZEN, SUPERSEDED, DEPRECATED, ARCHIVED, ABANDONED)

---

## UNRESOLVED QUESTIONS FOR STEP 4 (VERSIONING MODEL)

1. **Compatibility:** When is Phase 0.2 V2 compatible with Phase 0.10 V1 that depends on Phase 0.2 V1?
2. **Breaking Changes:** What constitutes a breaking change requiring version increment?
3. **Migration:** How does project using Phase 0.2 V1 migrate to V2?
4. **Dependency Evolution:** Can Phase 0.10 V1 dependency on "Phase 0.2" automatically upgrade to V2?
5. **SemVer Adoption:** Should contracts use SemVer (1.0.0 → 1.1.0 → 2.0.0) instead of simple integers?
6. **Cross-Version Evidence:** Does evidence produced under V1 validation remain valid under V2 contracts?
7. **Certification History:** Block certified under V1 — is it still certified under V2?

**These questions are addressed in Step 4: Versioning Model Design.**

---

## PHASE 0.10 STEP 3 COMPLETION STATUS: ✅ COMPLETE

**Completed:**
1. ✅ Contract identity model designed (not inferred from -V1 suffix)
2. ✅ Identity components defined (Number + Subject + Version)
3. ✅ Filename model designed (version in filename for historical preservation)
4. ✅ Dependency reference model designed (versioned and unversioned formats)
5. ✅ Identity resolution rules defined (10 rules)
6. ✅ Identity lifecycle states defined (DRAFT → FROZEN → SUPERSEDED → ...)
7. ✅ Identity persistence model designed (git + filesystem + index)
8. ✅ Identity collision prevention rules defined
9. ✅ Identity resolution algorithm specified
10. ✅ Unresolved questions identified for Step 4

**Ready for Phase 0.10 Step 4:** Versioning Model Design (compatibility, breaking changes, migration)

---

**End of Phase 0.10 Step 3 — Contract Identity Model Design COMPLETE**
