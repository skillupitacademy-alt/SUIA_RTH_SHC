# UBRC Documentation

**Location:** `docs/ubrc/`  
**Purpose:** Universal Block Runtime Contract documentation and new block development guides  
**Last Updated:** 2026-09-13

---

## Document Inventory

### 1. UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md ⭐
**Status:** PRODUCTION-AUTHORITATIVE  
**Purpose:** Official guide for converting AI-generated prototypes into Tutorial Composer blocks  
**Use When:** Starting any new block development

**Key Sections:**
- 7 Core Principles (non-negotiable)
- Authoritative workflow (Phase 1-4)
- Repository path verification
- D1/C1 pattern extraction
- Integration verification checklist
- Common anti-patterns
- Quick reference card

**Start Here:** This is the primary document for all new block development.

---

### 2. TUTORIAL-BLOCK-CREATION-WORKFLOW.md
**Status:** Detailed implementation guide  
**Purpose:** Step-by-step instructions for each phase of block development  
**Use When:** Implementing a new block, need detailed code examples

**Key Sections:**
- Step 1: Generate prototype (Free AI)
- Step 2: Inspect D1/C1 (Project AI)
- Step 3: Convert prototype to production
- Step 4: Integration with Tutorial Composer
- Step 5: Verification procedures
- Files modified summary
- Critical clarifications (production corrections)

---

### 3. NEW-BLOCK-QUICK-START-CHECKLIST.md
**Status:** Fast-track reference  
**Purpose:** Quick checklist for experienced developers  
**Use When:** You've done this before, need a reminder

**Key Sections:**
- 5-minute overview
- Prerequisites checklist
- Implementation steps (2-4 hours)
- Copy-paste templates
- Common mistakes with fixes
- Quick reference card

---

### 4. CORRECTIONS-APPLIED.md
**Status:** Change log and verification  
**Purpose:** Documents production-readiness corrections  
**Use When:** Understanding why certain patterns are required

**Key Corrections:**
1. Path verification made mandatory
2. Canonical builder made conditional
3. Runtime behavior = contract-based participation
4. Completion NOT universal
5. LSNB relationship explicit

---

### 5. UBRC-IMPLEMENTATION-PHASE-0-REPO-AUDIT.md
**Status:** Original investigation report  
**Purpose:** Documents initial UBRC contract discovery  
**Use When:** Understanding UBRC contract origins

**Key Findings:**
- UBRC contract already implemented
- DOM identity requirements (3 data-attributes)
- Passive observation architecture
- ActiveBlockContext mechanism
- ILS integration patterns

---

## Recommended Reading Order

### First Time Block Developer
1. **Start:** `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` (Core Principles section)
2. **Then:** `TUTORIAL-BLOCK-CREATION-WORKFLOW.md` (Step-by-step)
3. **Reference:** `NEW-BLOCK-QUICK-START-CHECKLIST.md` (During implementation)

### Experienced Developer (Second Block)
1. **Quick Review:** `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` (Quick Reference Card)
2. **Implement:** `NEW-BLOCK-QUICK-START-CHECKLIST.md` (Follow checklist)
3. **Troubleshoot:** `TUTORIAL-BLOCK-CREATION-WORKFLOW.md` (If issues arise)

### Architectural Review
1. **Corrections:** `CORRECTIONS-APPLIED.md` (Why patterns required)
2. **Original:** `UBRC-IMPLEMENTATION-PHASE-0-REPO-AUDIT.md` (Contract origins)
3. **Guide:** `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` (Current rules)

---

## Quick Links to Common Sections

### Need to verify paths?
→ `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` → Phase 1: Repository Path Verification

### Need D1/C1 reference?
→ `TUTORIAL-BLOCK-CREATION-WORKFLOW.md` → Step 2: Inspect D1/C1 Reference Implementation

### Need type definition template?
→ `NEW-BLOCK-QUICK-START-CHECKLIST.md` → Step 1: Type Definition

### Need React component template?
→ `NEW-BLOCK-QUICK-START-CHECKLIST.md` → Step 3: Renderer Component

### Need to understand LSNB relationship?
→ `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` → Core Principle #5

### Need to verify completion behavior?
→ `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` → Core Principle #7

### Seeing "automatic" behavior claims?
→ `CORRECTIONS-APPLIED.md` → Section 3: Runtime Behavior Corrections

---

## Critical Rules (Always Apply)

1. **Verify Repository Paths First** - Don't assume documentation paths are current
2. **Follow D1/C1 Pattern Exactly** - No architectural innovation
3. **Test Every Integration Point** - Contract satisfaction ≠ automatic operation
4. **Don't Modify Shared Infrastructure** - Unless universal contract gap proven
5. **DOM Identity is Mandatory** - All 3 data-attributes on root element
6. **No Direct ILS/RSSB Calls** - Blocks are pure UI components
7. **Completion NOT Universal** - Verify D1/C1 behavior first

---

## Next Steps

### Before ANY Implementation

**Required:** Run repository audit to verify:
- [ ] Actual D1/C1 file paths
- [ ] Current TutorialBlock union location
- [ ] Current TutorialBlockRenderer registration mechanism
- [ ] Current Composer insertion flow
- [ ] Current UBRC enforcement approach
- [ ] Current telemetry/completion capabilities
- [ ] Any documentation/repository mismatches

**Deliverable:** Audit report documenting actual vs. documented architecture

**No implementation until audit complete.**

### After Audit Complete

1. Select simple pilot block (summary card, highlight panel, etc.)
2. Follow `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md` workflow
3. Verify at every step (don't assume)
4. Document lessons learned
5. Update guides with corrections
6. Scale to additional blocks

---

## Support and Questions

### If documentation conflicts with repository:
→ Repository is authoritative. Update documentation with actual patterns.

### If D1/C1 behavior differs from documentation:
→ D1/C1 are authoritative. Follow actual implementation, not documented assumptions.

### If integration point fails verification:
→ Debug and compare with D1/C1. Don't assume "automatic" operation.

### If architectural gap discovered:
→ Document with evidence. Propose universal enhancement, not block-specific workaround.

---

## Document Status

**Last Audit:** 2026-09-13  
**Production Ready:** Yes (with repository verification required)  
**All Corrections Applied:** Yes  
**Ready For:** Operational use

**Maintained By:** Tutorial Composer Team  
**Review Cycle:** After each pilot block implementation  
**Update Trigger:** Architecture evolution, pattern changes, path updates

---

## Version History

- **v1.0** (2026-09-13): Production-authoritative versions created
  - Authoritative guide consolidated
  - All 5 critical corrections applied
  - Repository verification mandatory
  - Completion behavior clarified
  - LSNB relationship explicit

---

**Start with:** `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`  
**Next action:** Repository audit before implementation
