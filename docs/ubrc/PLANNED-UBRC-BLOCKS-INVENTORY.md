# Planned UBRC Blocks - Complete Inventory

**Date:** 2026-09-13  
**Source:** `docs/architecture/definition-block-version-architecture.md`  
**Status:** Architecture Documented, Implementation Pending

---

## Executive Summary

**Current Implementation Status:**
- ✅ **2 UBRC Blocks Implemented:** D1 (Definition), C1 (Code)
- ⏸️ **16 UBRC Block Types Planned:** Documented in architecture, awaiting implementation
- 📋 **137 Total Presentation Versions** across all 18 block types

**Architecture Principle:**
> "Definition Block serves as the **locked reference implementation** for the remaining 17 blocks."

**Implementation Constraint:**
> "Do NOT start Introduction or Objective blocks. Do NOT expand to D2-D6, C2-C10, S2-S6. Do NOT start CodeBlock, VisualBlock, or other blocks until Definition Block D1 passes the qualification gate. **D1 must become the proven reference pattern first.**"

---

## Complete 18-Block System

### Actual UBRC Blocks (2 Implemented)

| # | Block Type | Versions | Range | Status | Purpose |
|---|------------|----------|-------|--------|---------|
| 3 | **DefinitionBlock** | 6 | **D1-D6** | ✅ **D1 IMPLEMENTED** | Concept explanation |
| 4 | **CodeBlock** | 10 | **C1-C10** | ✅ **C1 IMPLEMENTED** | Code teaching |

**Note:** D1 and C1 are the ONLY currently implemented UBRC blocks. D2-D6 and C2-C10 are planned future versions.

---

### Planned UBRC Blocks (16 Block Types, 135 Versions Remaining)

| # | Block Type | Versions | Range | Status | Purpose |
|---|------------|----------|-------|--------|---------|
| 1 | **IntroductionBlock** | 6 | **I1-I6** | ⏸️ **PLANNED** | Context & orientation |
| 2 | **ObjectiveBlock** | 5 | **O1-O5** | ⏸️ **PLANNED** | Learning goals |
| 5 | **VisualBlock** | 10 | **V1-V10** | ⏸️ **PLANNED** | Visual learning |
| 6 | **ComparisonBlock** | 8 | **CP1-CP8** | ⏸️ **PLANNED** | Compare/decide |
| 7 | **ExecutionBlock** | 8 | **E1-E8** | ⏸️ **PLANNED** | Runtime behavior |
| 8 | **MemoryBlock** | 8 | **M1-M8** | ⏸️ **PLANNED** | Memory/internal model |
| 9 | **MistakeBlock** | 8 | **MT1-MT8** | ⏸️ **PLANNED** | Errors/debugging |
| 10 | **BestPracticeBlock** | 7 | **BP1-BP7** | ⏸️ **PLANNED** | Coding practices |
| 11 | **SummaryBlock** | 6 | **S1-S6** | ⏸️ **PLANNED** | Revision |
| 12 | **QuestionBlock** | 8 | **Q1-Q8** | ⏸️ **PLANNED** | Concept checking |
| 13 | **ExerciseBlock** | 8 | **EX1-EX8** | ⏸️ **PLANNED** | Guided practice |
| 14 | **TaskBlock** | 8 | **T1-T8** | ⏸️ **PLANNED** | Practical application |
| 15 | **InteractiveBlock** | 6 | **INT1-INT6** | ⏸️ **PLANNED** | Hands-on learning |
| 16 | **QuizBlock** | 8 | **QZ1-QZ8** | ⏸️ **PLANNED** | Assessment |
| 17 | **InterviewBlock** | 7 | **IV1-IV7** | ⏸️ **PLANNED** | Interview preparation |
| 18 | **ProjectBlock** | 8 | **P1-P8** | ⏸️ **PLANNED** | Real-world application |

---

## UBRC Block Characteristics

### What Defines an Actual UBRC Block

✅ **Complete instructional unit** with pedagogical design  
✅ **Version identifier** (D1, C1, I1, etc.)  
✅ **Brand-aware theme consumption** (uses theme.primary/secondary)  
✅ **UBRC identity attributes** (data-block-id, data-block-type, data-block-version)  
✅ **Composer-authorable** with AI generation support  
✅ **ILS-trackable** with completion semantics  
✅ **Multiple presentation versions** (e.g., D1-D6 for Definition)

### Supporting UI Components (NOT UBRC Blocks)

The current 15 supporting components (heading, paragraph, list, table, etc.) are **primitives that MAY be composed into future UBRC blocks**, but are not independently certified UBRC blocks themselves.

---

## Version Breakdown by Block Type

### IntroductionBlock (I1-I6) — 6 versions

**Purpose:** Context & orientation

**Planned Versions:**
- I1: [To be designed]
- I2: [To be designed]
- I3: [To be designed]
- I4: [To be designed]
- I5: [To be designed]
- I6: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### ObjectiveBlock (O1-O5) — 5 versions

**Purpose:** Learning goals

**Planned Versions:**
- O1: [To be designed]
- O2: [To be designed]
- O3: [To be designed]
- O4: [To be designed]
- O5: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### DefinitionBlock (D1-D6) — 6 versions

**Purpose:** Concept explanation

**Implemented Versions:**
- ✅ **D1: Simple Orientation** — Basic concept introduction with fundamental elements
  - Elements: title, intro, definition, explanation, example, characteristics, takeaway
  - Required: title, intro, definition, explanation, takeaway

**Planned Versions:**
- ⏸️ D2: Motivation through Problem/Need
- ⏸️ D3: What → Why → Where
- ⏸️ D4: Context → Roadmap
- ⏸️ D5: Real-world Situation → Requirement → Concept
- ⏸️ D6: Complete Lesson Orientation

**Status:** D1 implemented and serving as reference pattern. D2-D6 awaiting D1 qualification.

---

### CodeBlock (C1-C10) — 10 versions

**Purpose:** Code teaching

**Implemented Versions:**
- ✅ **C1: [Current Implementation]** — Code example with explanation, output, memory model
  - Elements: title, introduction, language, code, filename, explanation, output, takeaway, practiceHint, memoryModel
  - Theme-aware: Uses theme.primary/secondary for brand styling

**Planned Versions:**
- ⏸️ C2: [To be designed]
- ⏸️ C3: [To be designed]
- ⏸️ C4: [To be designed]
- ⏸️ C5: [To be designed]
- ⏸️ C6: [To be designed]
- ⏸️ C7: [To be designed]
- ⏸️ C8: [To be designed]
- ⏸️ C9: [To be designed]
- ⏸️ C10: [To be designed]

**Status:** C1 implemented. C2-C10 awaiting D1 qualification and C1 pattern review.

---

### VisualBlock (V1-V10) — 10 versions

**Purpose:** Visual learning representations

**Planned Versions:**
- V1: Simple Diagram [Planned]
- V2-V10: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

**Architecture Reference:**
```typescript
VISUAL_VERSION_REGISTRY = {
  V1: { label: "Simple Diagram", ... },
  // V2-V10 to be defined
}
```

---

### ComparisonBlock (CP1-CP8) — 8 versions

**Purpose:** Compare/decide

**Planned Versions:**
- CP1-CP8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### ExecutionBlock (E1-E8) — 8 versions

**Purpose:** Runtime behavior

**Planned Versions:**
- E1-E8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### MemoryBlock (M1-M8) — 8 versions

**Purpose:** Memory/internal model

**Planned Versions:**
- M1-M8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

**Note:** C1 currently includes `memoryModel` field. This may inform MemoryBlock design.

---

### MistakeBlock (MT1-MT8) — 8 versions

**Purpose:** Errors/debugging

**Planned Versions:**
- MT1-MT8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### BestPracticeBlock (BP1-BP7) — 7 versions

**Purpose:** Coding practices

**Planned Versions:**
- BP1-BP7: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### SummaryBlock (S1-S6) — 6 versions

**Purpose:** Revision

**Planned Versions:**
- S1-S6: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

**Note:** There is a supporting component called `SummaryBlock` (primitive) which is different from the planned UBRC SummaryBlock (S1-S6).

---

### QuestionBlock (Q1-Q8) — 8 versions

**Purpose:** Concept checking

**Planned Versions:**
- Q1-Q8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### ExerciseBlock (EX1-EX8) — 8 versions

**Purpose:** Guided practice

**Planned Versions:**
- EX1-EX8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

**Note:** There is a supporting component called `ExampleBlock` (primitive) which is different from ExerciseBlock.

---

### TaskBlock (T1-T8) — 8 versions

**Purpose:** Practical application

**Planned Versions:**
- T1-T8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### InteractiveBlock (INT1-INT6) — 6 versions

**Purpose:** Hands-on learning

**Planned Versions:**
- INT1-INT6: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### QuizBlock (QZ1-QZ8) — 8 versions

**Purpose:** Assessment

**Planned Versions:**
- QZ1-QZ8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### InterviewBlock (IV1-IV7) — 7 versions

**Purpose:** Interview preparation

**Planned Versions:**
- IV1-IV7: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

### ProjectBlock (P1-P8) — 8 versions

**Purpose:** Real-world application

**Planned Versions:**
- P1-P8: [To be designed]

**Status:** ⏸️ Awaiting D1 qualification gate

---

## Implementation Roadmap

### Phase 0: Foundation (Current)

✅ D1 (Definition Block v1) — Reference implementation  
✅ C1 (Code Block v1) — Second UBRC block  
✅ Supporting components (15 primitives)  
✅ UBRC architecture documentation

### Phase 1: D1 Qualification Gate

**Blocker:** D1 must pass qualification before ANY other UBRC blocks begin

**Required:**
- D1 production integration complete
- D1 runtime verification (browser testing)
- D1 cross-brand verification (RTH + SkillUp)
- D1 ILS/telemetry/completion verified
- D1 Composer tested and stable
- D1 serving as proven reference pattern

### Phase 2: Next UBRC Blocks (Priority Order TBD)

**Possible Order:**
1. IntroductionBlock (I1) — Logical page start
2. ObjectiveBlock (O1) — Learning goals
3. SummaryBlock (S1) — Revision/closure
4. [Other blocks following pedagogical sequence]

**Constraint:** Each block follows D1 reference pattern:
- Version-aware architecture
- Brand-independent JSON
- Theme propagation via props
- UBRC identity attributes
- Passive runtime behavior
- Composer integration

### Phase 3: Additional Versions

**After initial versions stable:**
- D2-D6 (Definition variations)
- C2-C10 (Code variations)
- I2-I6, O2-O5, S2-S6, etc.

**Note:** Version expansion happens AFTER initial version (e.g., I1) is stable and proven.

---

## Version Naming Convention

**Pattern:** `[BlockLetter][VersionNumber]`

**Examples:**
- Definition Block: D1, D2, D3, D4, D5, D6
- Code Block: C1, C2, C3, ..., C10
- Introduction Block: I1, I2, I3, I4, I5, I6
- Objective Block: O1, O2, O3, O4, O5
- Visual Block: V1, V2, V3, ..., V10
- Comparison Block: CP1, CP2, ..., CP8
- Execution Block: E1, E2, ..., E8
- Memory Block: M1, M2, ..., M8
- Mistake Block: MT1, MT2, ..., MT8
- BestPractice Block: BP1, BP2, ..., BP7
- Summary Block: S1, S2, S3, S4, S5, S6
- Question Block: Q1, Q2, ..., Q8
- Exercise Block: EX1, EX2, ..., EX8
- Task Block: T1, T2, ..., T8
- Interactive Block: INT1, INT2, ..., INT6
- Quiz Block: QZ1, QZ2, ..., QZ8
- Interview Block: IV1, IV2, ..., IV7
- Project Block: P1, P2, ..., P8

**Rationale:** Each block type has its own version namespace to eliminate ambiguity.

---

## Architecture Principles (Apply to All 18 Blocks)

### 1. One Composer per Block Type (Not per Version)

```typescript
// ✅ CORRECT
<DefinitionBlockComposer version="D1" />

// ❌ WRONG
<DefinitionD1Composer />
<DefinitionD2Composer />
<DefinitionD3Composer />
```

### 2. System-Controlled Hierarchy

**Block JSON contains:**
- ✅ Content (author-written)
- ❌ NO hierarchy metadata (domain, subject, topic, subtopic names)
- ❌ NO brand data
- ❌ NO theme data

**TutorialDocument contains:**
- ✅ Hierarchy IDs (domainId, subjectId, topicId, subtopicId)
- ✅ Schema version
- ✅ Created/updated timestamps

### 3. Version at Block Level (Not Nested)

```typescript
// ✅ CORRECT
{
  id: "block-uuid",
  type: "definition",
  version: "D1",  // ← Version here
  content: {
    title: "...",
    intro: "...",
    // NO version field here
  }
}

// ❌ WRONG
{
  id: "block-uuid",
  type: "definition",
  content: {
    version: "D1",  // ← Wrong location
    title: "...",
  }
}
```

### 4. Brand Independence

**Runtime flow:**
```
URL → Brand Detection → Theme Resolution → Page Shell → Blocks
```

**Blocks receive:**
- ✅ Content (from JSONB)
- ✅ Theme prop (runtime, brand-specific)
- ❌ NO brand identifier in JSON

### 5. Unknown Version = Error (Not Silent Fallback)

```typescript
// ✅ CORRECT
switch (version) {
  case "D1": return <D1View />;
  case "D2": return <D2View />;
  default:
    throw new BlockVersionError(`Unknown version: ${version}`);
}

// ❌ WRONG
switch (version) {
  case "D1": return <D1View />;
  case "D2": return <D2View />;
  default:
    return <D1View />;  // ← Silent fallback hides errors
}
```

---

## Total Version Count: 137

**Breakdown:**
- IntroductionBlock: 6 versions
- ObjectiveBlock: 5 versions
- DefinitionBlock: 6 versions (1 implemented)
- CodeBlock: 10 versions (1 implemented)
- VisualBlock: 10 versions
- ComparisonBlock: 8 versions
- ExecutionBlock: 8 versions
- MemoryBlock: 8 versions
- MistakeBlock: 8 versions
- BestPracticeBlock: 7 versions
- SummaryBlock: 6 versions
- QuestionBlock: 8 versions
- ExerciseBlock: 8 versions
- TaskBlock: 8 versions
- InteractiveBlock: 6 versions
- QuizBlock: 8 versions
- InterviewBlock: 7 versions
- ProjectBlock: 8 versions

**TOTAL:** 137 presentation versions

**Implemented:** 2 versions (D1, C1)  
**Remaining:** 135 versions

---

## Key Constraints

### Do NOT Start Before D1 Qualification

❌ **DO NOT:**
- Start Introduction or Objective blocks
- Expand to D2-D6 versions
- Expand to C2-C10 versions
- Generate S2-S6 variations
- Create any other new UBRC block types
- Generate AI contracts manually for unimplemented blocks

✅ **DO:**
- Wait for D1 qualification gate
- Use D1 as reference pattern
- Follow locked architecture
- Implement one version at a time per block type
- Test thoroughly before expanding to additional versions

### Implementation Order

1. ✅ D1 implemented (reference pattern)
2. ✅ C1 implemented (second pattern)
3. ⏸️ Await D1 qualification
4. ⏸️ Use D1 pattern for next blocks
5. ⏸️ Implement I1, O1, S1, etc. (one at a time)
6. ⏸️ Expand to additional versions AFTER initial version stable

---

## References

**Architecture Document:**
- `docs/architecture/definition-block-version-architecture.md`

**Current Implementation:**
- D1: `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
- C1: `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`

**Audit Documents:**
- `docs/audits/definition-code-summary-reference-qualification-audit.md`
- `ILS_UI_UX/docs/06-Gate-3C1-Universal-Block-Telemetry-Audit.md`

**UBRC Documentation:**
- `docs/ubrc/REPOSITORY-AUDIT-REPORT-2026-09-13.md`
- `docs/ubrc/UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`

---

**Document Status:** Inventory Complete  
**Last Updated:** 2026-09-13  
**Next Action:** Await D1 qualification gate before implementing additional UBRC blocks
