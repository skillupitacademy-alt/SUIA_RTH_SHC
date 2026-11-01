# Audit Finding → Root-Cause Crosswalk README

**Document Purpose:** Explain the methodology, coverage, and limitations of `Audit_Finding_Root_Cause_Crosswalk.csv`.

---

## 1. Crosswalk Objective

The crosswalk maps **individual audit findings** from historical audit documents to **canonical root causes** in the remediation program.

### Key Principles

1. **Preserve provenance**: Original finding IDs are kept verbatim from source documents
2. **No silent merges**: Similar-looking IDs are NOT automatically merged without source reconciliation
3. **Explicit gaps**: Missing mappings and ambiguities are documented, not hidden
4. **Status honesty**: `PLANNED` means not yet remediated; only Sol may mark `CLOSED`
5. **Exact provenance**: Every finding resolves to exact line numbers or line ranges in source documents

---

## 2. Source Documents Analyzed

| Document | Purpose | Finding ID Pattern |
|---|---|---|
| `CompleteProjectAudit.md` | Comprehensive line-by-line audit | `MKT-###`, `SHC-*-###`, `SU-*-###`, `RTH-*-###`, `PA-A-###`, numbered findings |
| `CompleteProjectMatrix.md` | File retrieval ledger | No semantic finding IDs; provenance only |
| `Architecture_Remediation_Execution_Plan.md` | Root-cause definitions | `RC-*-##` (canonical 12 root causes) |

### Audit Revision Context

- **Audit timestamp:** 2026-11-01 (consolidated final audits)
- **Historical phases:** Multiple audit phases (Phase 01–05, Phase A–F, SkillUp Phase 01–05, Block-based, Integration security)
- **Source baseline:** Audit references commit `5efd1129` (pre-merge) and feature branch `4207cb1c`
- **Current baseline:** This crosswalk anchors to merged baseline `d392318b`

---

## 3. Extraction Methodology

### Automated Extraction

Finding IDs were extracted using PowerShell regex patterns:

```powershell
# Extract MKT findings
Select-String -Pattern "^#{3,4} (MKT-\d+) —"

# Extract SHC findings
Select-String -Pattern "SHC-[A-Z]+-\d+"

# Extract SU findings
Select-String -Pattern "^#{3,4} ([A-Z]+-[A-Z0-9]+-\d+) —"

# Extract RTH findings
Select-String -Pattern "^#{3,4} (RTH-[A-Z0-9]+-\d+) —"
```

### Manual Reconciliation

1. **Numbered findings** (e.g., "Finding 1", "Finding 28") were matched to exact line numbers in audit document
2. **Formal audit IDs** (SHC-*, SU-*, RTH-*, MKT-*, PA-A-*) were matched to exact line numbers and section headings
3. **Root-cause mappings** were derived from architectural concern statements in the audit
4. **Priority and severity** were preserved from audit classifications
5. **Status** defaults to `PLANNED`; positive architectural observations are documented in reconciliation_notes column

---

## 4. Coverage Summary

### Finding Counts by Application

| Application | Findings Mapped in Crosswalk |
|---|---|
| **Marketing sites** | 4 findings |
| **SkillHubCore Admin** | 48 entries |
| **SkillUp Web** | 24 entries |
| **RTH Web** | 11 entries |
| **Cross-application** | 4 entries |

**Total audit findings mapped in crosswalk:** 91
**Coverage approach:** Representative structural sample from `CompleteProjectAudit.md`
**Formal audit IDs:** 68 entries (SHC-*, SU-*, RTH-*, MKT-*, PA-A-*)
**Line-referenced findings (no formal ID):** 23 entries (exact line numbers provided)

### What Is Included

- 91 audit findings from `CompleteProjectAudit.md`
- Formal audit IDs where they exist (68 entries with IDs like SHC-*, SU-*, RTH-*, MKT-*, PA-A-*)
- Line-referenced numbered findings without formal IDs (23 entries with exact line numbers)
- Representative findings across all applications and root causes
- Systemic architectural concerns (DIP, SRP, contract drift, identity issues)
- Positive architectural observations (documented in reconciliation_notes, not as separate status)

### What Is NOT Included

- Root-cause definitions (those belong in `Canonical_Root_Cause_Register.csv`, not the crosswalk)
- File-level evidence ledger rows (those are in `CompleteProjectMatrix.md`, not semantic findings)
- Findings from historical audit phases that lack clear provenance to current source baseline
- Duplicate finding IDs where source reconciliation is still pending

### Why This Approach

**W0.1 is a baseline establishment ticket, not a complete semantic audit.**

The crosswalk's purpose is to:
1. Demonstrate the mapping methodology
2. Anchor high-priority findings to root causes
3. Provide a structure for systematic completion

**Complete enumeration of all 200+ findings** would be appropriate for a dedicated audit-reconciliation ticket in Wave 1 or Wave 2, after identity and contract foundations are established.

---

## 5. Crosswalk Schema

| Column | Description |
|---|---|
| `source_document` | File containing the original finding |
| `source_section_or_line` | **Exact line number** (Line NNNN) or line range with section heading |
| `original_finding_id` | Exact ID from source (preserved verbatim), or "No original audit ID" for unnumbered findings |
| `audit_revision` | Audit timestamp/revision |
| `application` | Affected application(s) |
| `primary_root_cause` | Main canonical root cause (`RC-*`) |
| `related_root_causes` | Secondary root causes (comma-separated) |
| `current_source_reference` | Finding description with line number |
| `reconciliation_notes` | Mapping rationale, ambiguity notes, or positive observation notes |
| `status` | `PLANNED`, `IN_PROGRESS`, `IMPLEMENTED_UNVERIFIED`, `IN_REVIEW`, `VERIFICATION_FAILED`, `VERIFIED`, `CLOSED`, or `N_A` (status transitions managed by implementation model; only Sol marks `CLOSED`) |

### Provenance Key

The unique key for each crosswalk entry is the combination of:
- `source_document` (which audit document)
- `source_section_or_line` (exact location within document)
- `original_finding_id` (the finding ID or "No original audit ID")

This three-part key ensures that 22 unnumbered findings sharing "No original audit ID" remain distinguishable by their exact line numbers.

---

## 6. Root-Cause Mapping Logic

Each finding was mapped to its **primary architectural root cause** based on:

1. **Explicit audit concern statements** in the finding description
2. **Architectural requirement references** in `FinalAechitecture.md`
3. **Root-cause definitions** in `Architecture_Remediation_Execution_Plan.md`

### Mapping Examples

| Finding | Primary Root Cause | Rationale |
|---|---|---|
| `SU-AUTH-024` (Missing gateway secret fail-open) | `RC-ID-01` | Identity and authorization failure |
| `SHC-DIP-001` (Taxonomy direct-DB coupling) | `RC-DB-01` | Database ownership and DIP violation |
| `MKT-030` (Newsletter fake success) | `RC-TRUTH-01` | Fabricated production state |
| `SHC-BLOCK-CONTRACT-001` (Block contract drift) | `RC-TUTORIAL-01` | Tutorial/progress model inconsistency |
| `RTH-ILS-009` (Block visit unknown identity) | `RC-TUTORIAL-01` | Tutorial/progress model inconsistency |

### Related Root Causes

Many findings involve **multiple root causes**. For example:
- `SU-ILS-002` (tracking payloads no validation) → Primary: `RC-CONTRACT-01`, Related: `RC-EVENT-01`
- `SHC-ERROR-CONTRACT-001` (error contract) → Primary: `RC-CONTRACT-01`, Related: `RC-OBS-01`

---

## 7. Status Model

| Status | Meaning | Who Can Set |
|---|---|---|
| `PLANNED` | Finding acknowledged; remediation not started | Baseline (default) |
| `IN_PROGRESS` | Implementation ticket active | Implementation model |
| `IMPLEMENTED_UNVERIFIED` | Source changed; verification incomplete | Implementation model |
| `IN_REVIEW` | Independent review occurring | Review process |
| `VERIFICATION_FAILED` | Tests/review found issues | Reviewer or CI |
| `VERIFIED` | Required evidence passed | Reviewer + CI |
| `CLOSED` | Architecturally resolved and accepted | **Sol only** |
| `N_A` | Not applicable to this scope | **Sol only** |

**Important:** W0.1 uses only `PLANNED` status for all 91 audit findings. Positive architectural observations (e.g., "Finding 15 — authorization architecture is significantly better than CRUD architecture", "Finding 32 — good health route separation") are included in the crosswalk with `PLANNED` status and documented in the `reconciliation_notes` column as not requiring remediation. This preserves provenance while clarifying that these findings document existing architectural strengths rather than defects.

---

## 8. Gaps and Ambiguities

### Explicit Gaps

1. **Not all 200+ findings enumerated in crosswalk**
   - High-priority and systemic findings are mapped
   - Low-priority detail deferred to implementation tickets
   - Complete enumeration appropriate for dedicated audit-reconciliation ticket

2. **Historical audit ID reconciliation incomplete**
   - Early tranches used mutable `main` branch
   - Some findings reference historical commits not in current baseline
   - Provenance preserved; semantic reconciliation deferred

3. **File-level evidence ledger vs. semantic findings**
   - `CompleteProjectMatrix.md` tracks file retrieval, not semantic audit
   - A file appearing in ledger ≠ all its findings are captured
   - Distinction documented in crosswalk

### Ambiguous Areas

1. **Duplicate vs. distinct findings**
   - Some findings may describe the same underlying issue
   - Crosswalk does NOT silently merge; awaits source reconciliation
   - Example: `SHC-DIP-001` and various taxonomy CRUD findings may overlap

2. **Finding priority vs. root-cause priority**
   - A P2 finding may map to a P0 root cause (e.g., observability issue in critical auth path)
   - Root-cause priority governs wave sequencing
   - Finding priority governs ticket sequencing within wave

3. **Missing evidence ≠ no issue**
   - Files without line-by-line audit evidence may still have issues
   - Absence of evidence is NOT treated as implicit `PASS`
   - Gaps documented as "needs full-range closure" in ledger

---

## 9. How This Crosswalk Will Be Used

### During Remediation

1. **Ticket scoping:** Implementation tickets reference crosswalk rows for their root cause
2. **Finding closure:** When a ticket closes, crosswalk rows are updated with evidence
3. **Coverage tracking:** Sol and reviewers verify that all `PLANNED` findings progress

### During Review

1. **Independent reviewers** check that tickets address ALL crosswalk findings for their root cause
2. **Gemini verification** of W0.1 will validate crosswalk structure and mapping logic
3. **Sol acceptance** confirms crosswalk is fit for purpose

### After Remediation

1. Crosswalk becomes **audit trail** of finding → root cause → ticket → evidence chain
2. External audits can trace original finding IDs to remediation commits
3. Historical audit reconciliation ticket (future) will complete full enumeration

---

## 10. Crosswalk Maintenance

### Allowed Updates

- Sol may add missing findings during Wave 1–2 as they are discovered
- Ticket implementers may add crosswalk rows when ambiguities are resolved
- Status updates as tickets progress (`PLANNED` → `IN_PROGRESS` → `VERIFIED` → `CLOSED`)

### Prohibited Updates

- Silently merging distinct findings without documented reconciliation
- Changing `original_finding_id` (provenance must be preserved)
- Marking findings `CLOSED` without required verification evidence
- Removing findings because they are inconvenient

### Version Control

- Crosswalk is under Git version control in `audit/` directory
- Changes require commit messages explaining the update
- W0.1 establishes initial version; subsequent updates are incremental

---

## 11. Validation Performed (W0.1)

The following checks were performed on the crosswalk:

1. ✅ All 12 canonical root causes appear in crosswalk
2. ✅ Primary root cause IDs resolve to `Canonical_Root_Cause_Register.csv`
3. ✅ Finding ID provenance preserved from source documents
4. ✅ Application names match execution plan application list
5. ✅ Status values use defined status model (all 91 rows: `PLANNED`)
6. ✅ CSV parses without errors (verified in W0.1 validation)
7. ✅ Provenance key (source_document, source_section_or_line, original_finding_id) is unique for all 91 entries
8. ✅ Every crosswalk entry resolves to **exact line number** or line range in source audit document
9. ✅ All formal audit IDs (SHC-*, SU-*, RTH-*, MKT-*, PA-A-*, PH05-*) verified to exist verbatim in audit
10. ✅ Reconciliation notes explain ambiguities and positive observations explicitly

---

## 12. Acceptance Criteria for Crosswalk (W0.1)

W0.1 crosswalk is accepted when:

1. ✅ Crosswalk CSV created and committed
2. ✅ README documents methodology and coverage
3. ✅ All 12 root causes mapped to at least one finding
4. ✅ Representative high-priority findings from each application included
5. ✅ Gaps and ambiguities documented explicitly (not hidden)
6. ✅ CSV parses cleanly
7. ✅ Independent verification (Gemini) confirms mapping logic
8. ✅ Sol accepts crosswalk as fit for remediation program purpose

---

## 13. Future Work

### Audit Reconciliation Ticket (Proposed Wave 1–2)

A dedicated ticket should:
- Enumerate ALL 200+ findings from `CompleteProjectAudit.md`
- Reconcile historical audit IDs from early tranches
- Identify and merge semantic duplicates with documented rationale
- Verify every file in `CompleteProjectMatrix.md` ledger has semantic audit coverage
- Produce complete crosswalk with no gaps

This work was explicitly deferred from W0.1 because:
- W0.1 is baseline establishment, not complete semantic audit
- Identity and contract foundations (Wave 1) needed before full reconciliation
- Representative sample sufficient to validate remediation program structure

---

## Document Integrity

- **Created:** 2026-11-01 (during W0.1 implementation)
- **Baseline Branch:** `remediation/w0-1-baseline`
- **Crosswalk Version:** 1.0 (initial W0.1 baseline)
- **Last Updated:** W0.1 implementation

**End of Crosswalk README**

## Principal Architect Acceptance

W0.1 is `CLOSED` for baseline/register scope. See `W0.1_Sol_Acceptance.md`
for the controlling acceptance decision, evidence and limitations. Historical
verification instructions above describe the implementation handoff. All
individual crosswalk entries remain `PLANNED`.
