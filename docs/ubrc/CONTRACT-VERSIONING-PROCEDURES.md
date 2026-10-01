# Contract Versioning Procedures

**Purpose:** Step-by-step guide for creating new versions of governance contracts.

**Authority:** Phase 0.10 V1 - Contract Versioning & Evolution

**Audience:** Human Architecture Authority, governance document authors

**Last Updated:** 2026-10-01

---

## When to Create a New Version

Create a new contract version (V2, V3, etc.) when:

1. **Substantive changes required** to governance content, definitions, requirements, or procedures
2. **Incompatibilities identified** with other frozen contracts requiring resolution
3. **New requirements** emerge from project evolution
4. **Clarifications needed** that alter meaning or interpretation (not just typos/formatting)

**Do NOT create new version for:**
- Typos, grammar, formatting fixes
- Broken link corrections
- Clarifications that do not alter substantive meaning
- → Use Phase 0.8 Erratum Protocol instead

---

## Pre-Creation Checklist

Before starting V2 creation:

- [ ] **Verify substantive change needed** (not correctable via erratum)
- [ ] **Identify V1 limitations** requiring revision
- [ ] **Review dependency map** (Phase 0.10 Step 2 methodology)
- [ ] **Assess compatibility impact** on Phase 0.1-0.10 contracts
- [ ] **Check for circular dependencies** (Phase 0.7)
- [ ] **Determine breaking vs non-breaking** classification
- [ ] **Identify affected contracts** requiring coordinated updates

---

## V2 Creation Process

### Step 1: Create V2 Draft Document

1. **Copy V1 frozen file:**
   ```powershell
   Copy-Item docs/ubrc/PHASE-0.X-SUBJECT-CONTRACT-V1.md docs/ubrc/PHASE-0.X-SUBJECT-CONTRACT-V2.md
   ```

2. **Update V2 header metadata:**
   ```markdown
   Contract: Phase 0.X - Subject
   Version: 2
   Status: DRAFT
   Effective: NO
   Frozen: [blank]
   Repository Revision (Freeze): [blank]
   Supersedes: Phase 0.X V1
   ```

3. **Clear STATE HISTORY and VERSION HISTORY:**
   - Remove V1 state transitions (will document V2 lifecycle separately)
   - Start fresh VERSION HISTORY for V2

4. **Add CHANGES FROM V1 section:**
   ```markdown
   ## Changes from V1
   
   ### Substantive Changes
   - [List each substantive change with rationale]
   
   ### Non-Breaking Changes
   - [List changes that preserve V1 compatibility]
   
   ### Breaking Changes
   - [List changes that invalidate V1 assumptions]
   
   ### Compatibility Impact
   - Phase 0.X: [describe impact]
   - Phase 0.Y: [describe impact]
   ```

### Step 2: Apply Substantive Revisions

1. **Make required changes** to governance content
2. **Document rationale** for each substantive change
3. **Preserve V1 context** where helpful (e.g., "V1 required X; V2 relaxes to Y because...")
4. **Update examples** to reflect V2 model
5. **Revise cross-references** to other contracts if needed

### Step 3: Compatibility Analysis

1. **Review Phase 0.1-0.10 dependencies** (use Phase 0.10 Step 2 map)
2. **Test V2 assumptions** against dependent contracts
3. **Identify breaking changes** that require coordinated updates
4. **Document migration path** from V1 to V2 behavioral model
5. **Create compatibility matrix** (Phase 0.10 Section 13 format)

### Step 4: Impact Assessment

1. **Classify changes:**
   - Breaking vs Non-Breaking
   - Substantive vs Non-Substantive (all in V2 are substantive by definition)

2. **Assess operational impact:**
   - Does V2 require code changes?
   - Does V2 require database migrations?
   - Does V2 affect frozen behavior contracts?

3. **Determine coordination needs:**
   - Can V2 freeze independently?
   - Do other contracts need updates first?
   - What is the freeze sequencing?

### Step 5: Human Architecture Authority Review

1. **Submit V2 DRAFT** for review with:
   - V2 document
   - Compatibility analysis
   - Impact assessment
   - Migration recommendations

2. **Address feedback:**
   - RETURN TO DRAFT: apply corrections, repeat Step 5
   - APPROVE FOR FREEZE: proceed to Step 6

### Step 6: Freeze Execution

1. **Update V2 header:**
   ```markdown
   Status: FROZEN
   Effective: YES
   Frozen: YYYY-MM-DD
   Repository Revision (Freeze): [commit SHA]
   ```

2. **Update V2 STATE HISTORY:**
   ```markdown
   | Date | From | To | Authority | Reason |
   | YYYY-MM-DD | DRAFT | FROZEN | Human Architecture Authority | [freeze decision reason] |
   ```

3. **Update V2 VERSION HISTORY:**
   ```markdown
   | Version | Status | Frozen | Supersedes | Notes |
   | V2 | FROZEN, EFFECTIVE | YYYY-MM-DD | V1 | [summary of V2 changes] |
   ```

4. **Update governance-contracts-index.md:**
   - Update Phase 0.X entry: add V2, mark V1 superseded
   ```markdown
   | Phase 0.X | Subject | V2 | FROZEN, EFFECTIVE | YYYY-MM-DD | [commit] | null |
   | Phase 0.X | Subject | V1 | FROZEN, SUPERSEDED | original-date | [commit] | V2 |
   ```

5. **Update governance-contracts-changelog.md:**
   - Add V2 entry
   - Update V1 entry: `Superseded By: V2`

6. **Commit freeze changes:**
   ```powershell
   git add docs/ubrc/PHASE-0.X-SUBJECT-CONTRACT-V2.md
   git add docs/ubrc/governance-contracts-index.md
   git add docs/ubrc/governance-contracts-changelog.md
   git commit -m "chore(governance): freeze Phase 0.X V2 - [brief description]"
   ```

7. **Verify freeze:**
   - [ ] V2 status = FROZEN, Effective = YES
   - [ ] V1 supersededBy = V2 in changelog
   - [ ] Index shows V1 SUPERSEDED, V2 EFFECTIVE
   - [ ] Commit SHA recorded in V2 header
   - [ ] Working tree clean

---

## V1 Preservation

**DO NOT modify V1 file after V2 freeze:**
- V1 substantive content remains unchanged
- V1 status remains FROZEN (not rewritten to SUPERSEDED)
- V1 historical record preserved for auditability (Phase 0.9)
- Supersession relationship recorded in governance registry (index/changelog)

**SUPERSEDED designation is derived:**
- Index/changelog show V1 supersededBy = V2
- Tools/readers determine V1 is SUPERSEDED by checking registry
- V1 file header does NOT change

**Exception: Non-substantive erratum**
- V1 may receive typo/formatting fixes via Phase 0.8 protocol
- Original frozen revision must remain recoverable via git
- Erratum does NOT create V1.1 (version number unchanged)

---

## Multi-Contract Coordination

When V2 requires coordinated updates to other contracts:

1. **Identify coordination set:**
   - Which contracts reference Phase 0.X?
   - Which contracts are referenced by Phase 0.X?
   - What is the dependency order?

2. **Determine freeze sequence:**
   - Bottom-up: freeze dependencies first (Phase 0.7 pattern)
   - Parallel: if no circular dependencies, freeze simultaneously
   - Staged: if complex interactions, freeze in phases

3. **Create coordination plan:**
   - Document freeze order
   - Define validation checkpoints
   - Identify rollback triggers

4. **Execute coordinated freeze:**
   - Follow sequence strictly
   - Validate compatibility after each freeze
   - Update cross-references as contracts freeze

---

## Migration from V1 to V2

**For behavioral contracts:**
1. Review V2 "Changes from V1" section
2. Identify code/database impact
3. Plan implementation changes
4. Test V2 compliance before marking complete
5. Document V2 adoption in implementation records

**For governance contracts:**
1. Review V2 compatibility analysis
2. Assess impact on dependent contracts
3. Determine if dependent contracts need V2 versions
4. Execute coordinated updates if required
5. Update cross-references to cite correct version

---

## Troubleshooting

**Q: Can I modify V1 after V2 freezes?**
A: Only non-substantive erratum via Phase 0.8 protocol. Substantive changes require V3.

**Q: What if V2 has errors after freeze?**
A: Non-substantive errors → erratum protocol. Substantive errors → create V3 or REVOKE V2.

**Q: Can V1 and V2 both be EFFECTIVE?**
A: No. When V2 freezes, V1 automatically becomes SUPERSEDED (not EFFECTIVE). Only latest non-superseded frozen version is EFFECTIVE.

**Q: What if I need to DEPRECATE V2 before V3 is ready?**
A: Mark V2 DEPRECATED with `supersededBy: null`. This creates legitimate "NO EFFECTIVE VERSION" state until V3 freezes.

**Q: How do I know if change is substantive?**
A: Ask: "Does this change alter the meaning, requirements, or interpretation of the governance rule?" If yes → substantive → V2. If no → non-substantive → erratum.

---

## Version History

| Date | Change | Description |
|------|--------|-------------|
| 2026-10-01 | Created | Initial procedures document created during Phase 0.10 V1 freeze execution |

---

## References

- **Phase 0.10 V1:** Contract Versioning & Evolution (authoritative governance)
- **Phase 0.8 V1:** Erratum protocol for non-substantive corrections
- **Phase 0.7 V1:** Dependency management and freeze sequencing
- **Phase 0.9 V1:** Historical preservation requirements
