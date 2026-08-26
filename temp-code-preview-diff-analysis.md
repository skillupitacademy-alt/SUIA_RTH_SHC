# FORENSIC COMPARISON 2: CODE PREVIEW RESTORATION

## File Analyzed
`apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/TutorialPageContentBuilderClient.tsx`

## Commits
- **Regression:** `6514b377` (Aug 23 2026 06:25)
- **Pre-regression:** `6514b377^` (parent commit)

## Summary
**STATUS:** 🚨 **CODE PREVIEW REGRESSED**

**What Changed:**
- ❌ Removed `TutorialCodeContent` import
- ❌ Removed `TutorialCodeContent` component usage (2 locations)
- ✅ Added `TutorialBlockRenderer` for Code blocks
- ✅ Added type cast changes for Definition blocks (as TutorialBlock)
- ✅ Removed 'as D1' type casts (hide version info)

**What Stayed:**
- ✅ `TutorialBlockRenderer` for Definition blocks
- ✅ `TutorialSummaryContent` for Summary blocks
- ✅ All other UI logic
- ✅ Form handling
- ✅ Block management

---

## DETAILED DIFF ANALYSIS

### CHANGE 1: Import Removal

**BEFORE (Pre-regression):**
```tsx
import { TutorialBlockRenderer } from '@quiz/ui';
import { TutorialCodeContent } from '@/share-branding/LearningExperience/components/TutorialCodeContent';
import { TutorialSummaryContent } from '@/share-branding/LearningExperience/components/TutorialSummaryContent';
```

**AFTER (Current):**
```tsx
import { TutorialBlockRenderer } from '@quiz/ui';
import { TutorialSummaryContent } from '@/share-branding/LearningExperience/components/TutorialSummaryContent';
```

**Analysis:** `TutorialCodeContent` import was removed

---

### CHANGE 2: Active Block Preview - Code Block

**BEFORE (Pre-regression) - Line ~1318:**
```tsx
{form.blockType === 'code' && (
  <TutorialCodeContent 
    payload={activeBlockPreview as TutorialCodePayload} 
    theme={themeForBrand(form.brandId)} 
  />
)}
```

**AFTER (Current) - Lines ~1323-1335:**
```tsx
{form.blockType === 'code' && (
  <TutorialBlockRenderer
    block={{
      id: 'preview',
      type: 'code',
      version: selectedVersion.code, // Use selected version without cast
      content: activeBlockPreview as CodeC1AuthorContent,
    } as TutorialBlock}
    theme={themeForBrand(form.brandId)}
    depth={0}
  />
)}
```

**Analysis:** 
- Replaced `TutorialCodeContent` with `TutorialBlockRenderer`
- Changed payload type from `TutorialCodePayload` to `CodeC1AuthorContent`
- Added `version` and `depth` props
- Wrapped in TutorialBlock type cast

---

### CHANGE 3: Document Preview - Code Block

**BEFORE (Pre-regression) - Line ~1369:**
```tsx
{instance.type === 'code' && (
  <div data-tutorial-block-type="code">
    <TutorialCodeContent 
      payload={instance.payload as TutorialCodePayload} 
      theme={themeForBrand(form.brandId)} 
    />
  </div>
)}
```

**AFTER (Current) - Lines ~1368-1382:**
```tsx
{instance.type === 'code' && (
  <div data-tutorial-block-type="code">
    <TutorialBlockRenderer
      block={{
        id: instance.id,
        type: 'code',
        version: instance.versionCode, // Use actual version without cast
        content: instance.payload as CodeC1AuthorContent,
      } as TutorialBlock}
      theme={themeForBrand(form.brandId)}
      depth={0}
    />
  </div>
)}
```

**Analysis:**
- Same pattern as Active Block Preview
- Replaced `TutorialCodeContent` with `TutorialBlockRenderer`
- Changed payload type

---

### CHANGE 4: Definition Block Type Casts (Related Change)

**BEFORE (Pre-regression):**
```tsx
version: selectedVersion.code as 'D1', // Use selected version from UI
content: activeBlockPreview as DefinitionD1AuthorContent,
}}
```

**AFTER (Current):**
```tsx
version: selectedVersion.code, // Use selected version without cast
content: activeBlockPreview as DefinitionD1AuthorContent,
} as TutorialBlock}
```

**Analysis:** 
- Removed 'as D1' type cast (hide version in UI)
- Added block-level 'as TutorialBlock' cast
- This is an improvement, NOT a regression
- Should be KEPT in restoration

---

## CRITICAL QUESTION: PAYLOAD TYPE COMPATIBILITY

### Before Restoration, Verify:

**Question:** Does `activeBlockPreview` still contain `TutorialCodePayload` shape?

**Current code shows:**
```tsx
content: activeBlockPreview as CodeC1AuthorContent
```

**Historical code expected:**
```tsx
payload={activeBlockPreview as TutorialCodePayload}
```

**MUST VERIFY:**
1. Is `activeBlockPreview` still compatible with `TutorialCodePayload`?
2. Or has the data structure changed to `CodeC1AuthorContent`?
3. Does `TutorialCodeContent` component still accept `TutorialCodePayload`?

Let me check the type definitions...

---

## RESTORATION STRATEGY

### Option A: Direct Restoration (If Types Compatible)

Simply revert the Code block changes:

```tsx
// RESTORE import:
import { TutorialCodeContent } from '@/share-branding/LearningExperience/components/TutorialCodeContent';

// RESTORE Active Block Preview:
{form.blockType === 'code' && (
  <TutorialCodeContent 
    payload={activeBlockPreview as TutorialCodePayload} 
    theme={themeForBrand(form.brandId)} 
  />
)}

// RESTORE Document Preview:
{instance.type === 'code' && (
  <div data-tutorial-block-type="code">
    <TutorialCodeContent 
      payload={instance.payload as TutorialCodePayload} 
      theme={themeForBrand(form.brandId)} 
    />
  </div>
)}
```

### Option B: Verify Converter Exists

If payload structure changed, check if there's a converter:
- `CodeC1AuthorContent` → `TutorialCodePayload`
- Or vice versa

**DO NOT INVENT A CONVERTER** - only use if it exists

---

## CHANGES TO KEEP (DO NOT REVERT)

### Definition Block Improvements
```tsx
// KEEP this improved type casting:
version: selectedVersion.code, // without 'as D1'
} as TutorialBlock}
```

**Rationale:** This is an improvement, not a regression

### Summary Block
```tsx
// KEEP Summary unchanged:
{form.blockType === 'summary' && (
  <TutorialSummaryContent 
    payload={activeBlockPreview as TutorialSummaryPayload} 
    theme={themeForBrand(form.brandId)} 
  />
)}
```

**Rationale:** Summary was not changed in regression, should not be touched

---

## FILES THAT WILL CHANGE

**Single file:**
```
apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/components/TutorialPageContentBuilderClient.tsx
```

**Changes:**
1. Add `TutorialCodeContent` import back
2. Replace Code block `TutorialBlockRenderer` with `TutorialCodeContent` (2 locations)
3. Keep Definition block changes (improved type casts)
4. Keep Summary block (unchanged)

---

## FILES THAT WILL NOT CHANGE

**Component Files:**
- ✅ `TutorialCodeContent.tsx` (already correct, verified unchanged since Aug 18)
- ✅ `TutorialDefinitionContent.tsx` (not involved)
- ✅ `TutorialSummaryContent.tsx` (not involved)
- ✅ `TutorialBlockRenderer` components (preserve canonical architecture)
- ✅ `CodeC1Block.tsx` (no redesign)
- ✅ `DefinitionBlock.tsx` (still used for Definition preview)

**Type Files:**
- ✅ `TutorialCodePayload` type definition
- ✅ `CodeC1AuthorContent` type definition
- ✅ `TutorialBlock` type definition

**Service/Logic Files:**
- ✅ C1 converter utilities
- ✅ Publishing logic
- ✅ Delivery logic
- ✅ Sidebar logic

---

## VALIDATION REQUIREMENTS

After restoration:

1. **Type Check:**
   ```bash
   npm run type-check --workspace=@quiz/skillhubcore-admin
   ```
   Expected: ✅ PASS (types must be compatible)

2. **Visual Test - Code Block:**
   - Open Composer
   - Create/edit Code block
   - Verify Preview shows:
     - ✅ SVG dots (macOS window chrome)
     - ✅ Syntax highlighting
     - ✅ Line numbers
     - ✅ Copy button
     - ✅ Explanation section
     - ✅ Output section
     - ✅ Memory/Model section
     - ✅ Key Takeaway section
     - ✅ Tip section

3. **Visual Test - Definition Block (No Regression):**
   - Open Composer
   - Create/edit Definition block
   - Verify Preview still shows D1 UI correctly
   - Verify no visual changes from current

4. **Visual Test - Summary Block (No Regression):**
   - Open Composer
   - Create/edit Summary block
   - Verify Preview still shows Summary UI correctly
   - Verify no visual changes from current

---

## RISK ASSESSMENT

**Type Compatibility Risk: MEDIUM**

The refactoring changed payload type from `TutorialCodePayload` to `CodeC1AuthorContent`.

**Scenarios:**

### Scenario 1: Types Are Compatible
- `activeBlockPreview` can be cast to both types
- `TutorialCodeContent` still works with current data
- **Risk:** LOW
- **Action:** Simple restoration works

### Scenario 2: Types Diverged
- Data structure changed incompatibly
- `TutorialCodeContent` expects old structure
- **Risk:** HIGH
- **Action:** STOP and report - do not invent converter

### Scenario 3: Converter Exists
- Refactoring included `toTutorialCodePayload()` helper
- Can convert `CodeC1AuthorContent` → `TutorialCodePayload`
- **Risk:** LOW
- **Action:** Use existing converter

---

## NEXT STEP: TYPE VERIFICATION

**BEFORE IMPLEMENTING RESTORATION:**

1. Check `TutorialCodePayload` type definition
2. Check `CodeC1AuthorContent` type definition
3. Check if they are compatible/convertible
4. Check if converter utility exists
5. Verify current `TutorialCodeContent` component signature

**ONLY THEN proceed with restoration.**

---

## CONCLUSION

**Regression Point:** Commit `6514b377` removed `TutorialCodeContent` from Composer Preview

**Affected Locations:** 2 render paths (Active Block + Document Preview)

**Restoration Required:** Re-introduce `TutorialCodeContent` for Code blocks only

**Preservation Required:** Keep Definition block improvements, keep Summary block

**Critical Dependency:** Verify type compatibility before implementation

**Risk if Done Wrong:** Type errors, runtime crashes, broken previews

**Risk if Done Right:** LOW - proven historical implementation
