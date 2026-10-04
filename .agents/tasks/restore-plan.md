# Surgical Restoration Plan: Project LLM Page UI

## Executive Summary

**Status:** GO - Safe to execute

**Finding:** Commit `47fd128f` is confirmed as a mixed commit containing:
- ✅ **INTENDED (PRESERVE):** Agent C domain contracts in `packages/types/src/project-llm/*`
- ✅ **INTENDED (PRESERVE):** Agent D repository intelligence in `apps/skillhubcore-admin/src/lib/project-llm/*`
- ✅ **INTENDED (PRESERVE):** New "Project LLM Intelligence" stats panel in `page.tsx` using Agent D data
- ❌ **UNINTENDED (RESTORE):** Visual/styling regression in `page.tsx` removing gradients, backdrop-blur, and hover effects

---

## Agent C Files (CONFIRMED PRESENT - DO NOT TOUCH)

Located in `packages/types/src/project-llm/`:
- `compliance.ts`
- `corpus.ts`
- `index.ts`
- `lifecycle.ts`
- `repository-intelligence.ts`
- `request.ts`
- `runtime.ts`

**Action:** Keep all files unchanged.

---

## Agent D Files (CONFIRMED PRESENT - DO NOT TOUCH)

Located in `apps/skillhubcore-admin/src/lib/project-llm/`:
- `index.ts`
- `projectLlmBlockCorpus.ts`
- `projectLlmReferencePatterns.ts`
- `projectLlmRepositoryIntelligence.ts`

**Action:** Keep all files unchanged.

---

## Non-Visual Changes in page.tsx (PRESERVE)

The following functional changes from `47fd128f` must be preserved:

1. **Import statement (line 17):**
   ```typescript
   import { PROJECT_LLM_REPOSITORY_INTELLIGENCE } from '@/lib/project-llm';
   ```

2. **Component destructuring (line 117-118):**
   ```typescript
   const { corpus, runtime } = PROJECT_LLM_REPOSITORY_INTELLIGENCE;
   ```

3. **Entire "Project LLM Intelligence" stats panel section (lines 169-227):**
   - The 4-card grid displaying:
     - Corpus Families: `{corpus.status.families}`
     - Documented Versions: `{corpus.status.documentedVersions}`
     - Verified Runtime: `{runtime.status.verifiedImplementations}`
     - Planned Families: `{runtime.status.plannedFamilies}`
   - This is NEW FUNCTIONAL CONTENT from Agent D, not styling.

4. **Updated agentLanes items for 'repo-intel' (line 52):**
   ```typescript
   items: ['18 families, 132 versions', '3 verified, 1 incomplete, 15 planned', 'Reference patterns: I1, C1, D1'],
   ```
   - Changed from generic labels to actual corpus intelligence data.

---

## Visual Changes to RESTORE (Baseline from dfcec84d)

All changes below are **purely visual** and should be restored to the baseline:

### 1. Top Header Card Section (line 122)
**Current (47fd128f):**
```
bg-white
```
**Restore to (dfcec84d):**
```
bg-white/90 backdrop-blur-sm
```

### 2. Open Block Composer Link Button (line 145)
**Current (47fd128f):**
```
bg-pink-600
```
**Restore to (dfcec84d):**
```
bg-gradient-to-r from-pink-500 to-orange-500
```

### 3. Guardrails Pills (line 159)
**Current (47fd128f):**
```
bg-white
```
**Restore to (dfcec84d):**
```
bg-white/90 backdrop-blur-sm
```

### 4. Workflow Stages Cards (line 240)
**Current (47fd128f):**
```
bg-white
```
**Restore to (dfcec84d):**
```
bg-white/90 backdrop-blur-sm
```

### 5. Workflow Stage Number Badges (lines 246-249)
**Current (47fd128f):**
```typescript
index % 2 === 0
  ? 'bg-pink-600 shadow-pink-500/25'
  : 'bg-orange-600 shadow-orange-500/25'
```
**Restore to (dfcec84d):**
```typescript
index % 2 === 0
  ? 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/25'
  : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/25'
```

### 6. Agent Lanes Cards (line 287)
**Current (47fd128f):**
```
bg-white
```
**Restore to (dfcec84d):**
```
bg-white/90 backdrop-blur-sm
```

### 7. Agent Lane Icon Backgrounds (lines 49, 59, 69, 79, 89, 99)

**repo-intel (line 49):**
- Current: `bg-indigo-600 text-white shadow-indigo-500/25`
- Restore: `bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/25`

**creation-brief (line 59):**
- Current: `bg-pink-600 text-white shadow-pink-500/25`
- Restore: `bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/25`

**candidate-intake (line 69):**
- Current: `bg-orange-600 text-white shadow-orange-500/25`
- Restore: `bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/25`

**compliance-review (line 79):**
- Current: `bg-purple-600 text-white shadow-purple-500/25`
- Restore: `bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-purple-500/25`

**validation-evidence (line 89):**
- Current: `bg-teal-600 text-white shadow-teal-500/25`
- Restore: `bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-500/25`

**certification (line 99):**
- Current: `bg-amber-600 text-white shadow-amber-500/25`
- Restore: `bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25`

### 8. Phase 1 Pilot Card (line 339)
**Current (47fd128f):**
```
bg-white
```
**Restore to (dfcec84d):**
```
bg-white/90 backdrop-blur-sm
```

### 9. Phase 1 Pilot Icon Background (line 342)
**Current (47fd128f):**
```
bg-pink-600
```
**Restore to (dfcec84d):**
```
bg-gradient-to-br from-pink-500 to-orange-500
```

### 10. Phase 1 Pilot List Items (line 360)
**Current (47fd128f):**
```
bg-slate-50/80
```
**Restore to (dfcec84d):**
```
bg-slate-50/80 backdrop-blur-sm
```

### 11. Architecture Banner Section (line 373)
**Current (47fd128f):**
```
bg-indigo-50
```
**Restore to (dfcec84d):**
```
bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/50
```

### 12. Architecture Banner Pills (lines 386, 390, 394)
**Current (47fd128f):**
```
bg-white
```
**Restore to (dfcec84d):**
```
bg-white/90 backdrop-blur-sm
```

### 13. Architecture Banner Button (line 405)
**Current (47fd128f):**
```
bg-pink-600
```
**Restore to (dfcec84d):**
```
bg-gradient-to-r from-pink-500 to-orange-500
```

---

## Summary of Visual Changes

**Total visual-only changes:** 13 locations covering:
- ✅ 8 instances of removed `backdrop-blur-sm` (restore all)
- ✅ 7 instances of removed `bg-white/90` → `bg-white` (restore opacity)
- ✅ 8 instances of gradient classes removed from icon backgrounds (restore all)
- ✅ 2 instances of gradient button backgrounds simplified (restore both)
- ✅ 1 instance of complex gradient background simplified (Architecture Banner)

**Pattern:**
- All visual changes removed glassmorphism effects (`backdrop-blur-sm`, opacity values)
- All gradient classes were flattened to solid colors
- No structural, logical, or data-binding changes were made in these areas

---

## Verification Steps

After restoration:

1. **Type-check:**
   ```bash
   npm run typecheck
   ```
   Expected: No errors (import and data usage are correct)

2. **Build:**
   ```bash
   npm run build
   ```
   Expected: Clean build

3. **Visual inspection:**
   - Navigate to `/tools/project-llm`
   - Confirm gradients are visible on:
     - Icon backgrounds in agent lanes
     - "Open Block Composer" button
     - Workflow stage number badges
     - Architecture banner background
   - Confirm glassmorphism effects (slight transparency + blur) on card backgrounds

4. **Functional verification:**
   - Confirm "Project LLM Intelligence" panel displays 4 stats
   - Confirm stats show actual numbers (18, 132, 3, 15)
   - Confirm no console errors

---

## Recommendation

**GO for execution.**

This is a clean surgical restoration:
- Zero functional impact (all Agent C/D work preserved)
- Zero structural impact (new stats panel preserved)
- Pure visual restoration (gradients and glassmorphism)
- Low risk: reverting to previously-approved baseline

The restoration can be done with confidence using string replacements in a single file (`page.tsx`).
