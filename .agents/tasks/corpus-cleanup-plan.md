# Corpus/Runtime Consistency Cleanup Implementation Plan

**Task:** Reconcile remaining stale references (132→133, 15 planned→14 planned, S status)  
**Date:** 2025-01-20  
**Status:** READY FOR IMPLEMENTATION

---

## Context

The repository runtime contracts are correct:
- ✅ `packages/types/src/project-llm/corpus.ts` — `CORPUS_VERSIONS_TOTAL = 133`
- ✅ `packages/types/src/project-llm/runtime.ts` — `RUNTIME_PLANNED_FAMILIES_COUNT = 14`

However, stale references remain in comments, documentation, and UI text that contradict these authoritative values. This cleanup fixes the inconsistencies **without changing any architecture, logic, or visual design**.

---

## Implementation Steps

### Step 1: Fix TypeScript Comment in projectLlmBlockCorpus.ts

**File:** `apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts`

**Line 9 — Change stale comment:**
```typescript
// FROM:
 * Invariant: 18 families, 132 total versions

// TO:
 * Invariant: 18 families, 133 total versions
```

**Files Modified:**
- `apps/skillhubcore-admin/src/lib/project-llm/projectLlmBlockCorpus.ts` (line 9)

**Verification:**
```bash
npm run type-check
```
**Expected:** Type-check passes, no errors.

---

### Step 2: Fix TypeScript Comment in projectLlmRepositoryIntelligence.ts

**File:** `apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts`

**Line 55 — Change stale comment:**
```typescript
// FROM:
// Planned families (15 families not yet implemented)

// TO:
// Planned families (14 families not yet implemented)
```

**Files Modified:**
- `apps/skillhubcore-admin/src/lib/project-llm/projectLlmRepositoryIntelligence.ts` (line 55)

**Verification:**
```bash
npm run type-check
```
**Expected:** Type-check passes, runtime invariant validation succeeds (no console errors).

---

### Step 3: Fix UI Text in Project LLM Dashboard (page.tsx)

**File:** `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx`

**IMPORTANT:** Only change the string values inside the `items` array. Do **NOT** touch gradients, colors, class names, backdrop-blur, shadows, animations, or any other styling.

**Location 1 — Line 52, agentLanes array, repo-intel object:**

```typescript
// FROM:
items: ['18 families, 132 versions', '3 verified, 1 incomplete, 15 planned', 'Reference patterns: I1, C1, D1'],

// TO:
items: ['18 families, 133 versions', '3 verified, 1 incomplete, 14 planned', 'Reference patterns: I1, C1, D1'],
```

**Files Modified:**
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/page.tsx` (line 52, agentLanes `repo-intel` items array)

**Verification:**
```bash
npm run type-check
```
**Expected:** Type-check passes. When the dashboard loads, the "Repository Intelligence" lane displays:
- "18 families, 133 versions"
- "3 verified, 1 incomplete, 14 planned"
- "Reference patterns: I1, C1, D1"

**Visual verification:** Open `http://localhost:3000/tools/project-llm` (or appropriate port) and confirm the updated text appears in the Repository Intelligence card with **no visual design changes**.

---

### Step 4: Fix Markdown Documentation in PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md

**File:** `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md`

**Change 1 — Line ~15, Executive Summary:**
```markdown
# FROM:
- **15 families planned** but not yet implemented

# TO:
- **14 families planned** but not yet implemented
```

**Change 2 — Line ~57, Registry Table footer row:**
```markdown
# FROM:
| | **TOTAL** | | **133** | | **3 VERIFIED, 15 PLANNED** | |

# TO:
| | **TOTAL** | | **133** | | **3 VERIFIED, 14 PLANNED, 1 INCOMPLETE** | |
```

**Change 3 — Line ~209, Row 11 (SummaryBlock) Status column:**
```markdown
# FROM:
| 11 | SummaryBlock | S | 6 | S1-S6 | PLANNED | Concept revision/summary |

# TO:
| 11 | SummaryBlock | S | 6 | S1-S6 | INCOMPLETE (S1 partial) | Concept revision/summary |
```

**IMPORTANT:** Do **NOT** change:
- The "133 versions documented" line (already correct)
- The "S1-S6" version count (6 versions, correct)
- The arithmetic verification row (already correct: `6 + 5 + 6 + ... = 133`)

**Files Modified:**
- `ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` (lines ~15, ~57, ~209)

**Verification:**
```bash
grep -n "14 planned" "ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md"
grep -n "14 PLANNED" "ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md"
grep -n "INCOMPLETE (S1 partial)" "ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md"
```
**Expected:** All three patterns found in the updated lines.

---

### Step 5: Update Roadmap Metadata (Optional)

**File:** `ILS_UI_UX/docs/PROJECT_LLM_WORKFLOW_AGENT_ROADMAP.md`

**Line 6 — Update latest checked commit:**
```markdown
# FROM:
**Latest Checked Commit:** `7fa4267a` — `refactor: Migrate investigation/reconciliation reports to canonical docs location`

# TO:
**Latest Checked Commit:** `a9b5d443` — `docs: Project LLM Phase 1 - Agent C+D complete with corpus integrity fix`
```

**Files Modified:**
- `ILS_UI_UX/docs/PROJECT_LLM_WORKFLOW_AGENT_ROADMAP.md` (line 6)

**Verification:**
```bash
grep -n "a9b5d443" "ILS_UI_UX/docs/PROJECT_LLM_WORKFLOW_AGENT_ROADMAP.md"
```
**Expected:** Line 6 contains the updated commit hash.

---

### Step 6: Search for Remaining Stale References

**After all edits are complete**, search the repository (excluding `.analysis/` and `.agents/tasks/`) for any remaining stale references to:
- "132 versions" or "132 total" in Project LLM context
- "15 planned families" or "15 families" in Project LLM context

**Search commands:**
```bash
# Exclude .analysis, .agents/tasks, and node_modules
grep -r "132" --include="*.ts" --include="*.tsx" --include="*.md" --exclude-dir=node_modules --exclude-dir=.analysis --exclude-dir=.agents e:\onlinewebsites\quiz-platform | grep -i "project\|llm\|corpus\|families\|versions"

grep -r "15 planned\|15 families" --include="*.ts" --include="*.tsx" --include="*.md" --exclude-dir=node_modules --exclude-dir=.analysis --exclude-dir=.agents e:\onlinewebsites\quiz-platform | grep -i "project\|llm\|corpus"
```

**Expected:** No results that reference Project LLM corpus/runtime data. Any matches should be in historical analysis reports (`.agents/tasks/` already excluded) or unrelated numeric coincidences.

**If stale references are found:**
- Document them in a comment in this plan file
- Fix them following the same pattern (update numeric values only, preserve context)

**Files Modified:**
- None expected (search step only)

**Verification:**
The search commands above produce no results that require further changes.

---

### Step 7: Run Final Type-Check Validation

**Command:**
```bash
npm run type-check
```

**Expected:**
- ✅ TypeScript compilation succeeds
- ✅ No "invariant violation" errors in console
- ✅ Runtime validation in `projectLlmRepositoryIntelligence.ts` passes:
  - `VERIFIED_IMPLEMENTATIONS.length === 3`
  - `INCOMPLETE_IMPLEMENTATIONS.length === 1`
  - `PLANNED_FAMILY_IDS.length === 14`
  - `IMPLEMENTATION_PRIMITIVES.length === 15`

**Files Modified:**
- None (verification step only)

---

## Summary of Changes

| File | Lines Changed | Change Type |
|------|---------------|-------------|
| `projectLlmBlockCorpus.ts` | 1 | Comment: 132→133 |
| `projectLlmRepositoryIntelligence.ts` | 1 | Comment: 15→14 |
| `page.tsx` | 1 | UI text: 132→133, 15→14 |
| `PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md` | 3 | Docs: 15→14, S status |
| `PROJECT_LLM_WORKFLOW_AGENT_ROADMAP.md` | 1 | Metadata: commit hash |
| **TOTAL** | **7 lines** | **Data reconciliation only** |

---

## What Is NOT Changed

- ❌ No architectural changes
- ❌ No logic changes
- ❌ No test file changes
- ❌ No visual design changes (UI styling, colors, gradients, shadows, animations)
- ❌ No database migrations
- ❌ No API changes
- ❌ No component behavior changes
- ❌ No type interface changes (runtime contracts already correct)

---

## Exit Criteria

- ✅ All 5 files updated with correct numeric values
- ✅ `npm run type-check` passes without errors
- ✅ No "invariant violation" console errors when loading Project LLM dashboard
- ✅ Repository Intelligence lane displays "133 versions" and "14 planned"
- ✅ Repository search finds no remaining stale "132 total versions" or "15 planned families" references in Project LLM context
- ✅ Canonical registry document reflects S1 as INCOMPLETE rather than PLANNED

---

## Notes

This is a **data consistency fix**, not an architectural change. The runtime contracts (`corpus.ts`, `runtime.ts`) are already correct and authoritative. This plan brings comments, documentation, and UI text into alignment with those contracts.

The user explicitly stated:
> **UI DESIGN / UX → FROZEN**  
> **DATA SHOWN BY UI → Must remain authoritative**

This plan respects that boundary: no visual design changes, only factual data corrections.
