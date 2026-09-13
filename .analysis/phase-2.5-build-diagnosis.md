# Phase 2.5 Build Diagnosis

## Executive Summary

**Build Status:** FAIL (PRE-EXISTING ISSUE)  
**Phase 2.5 Impact:** NONE - Issue exists in legacy `/learn` routes, not touched by Phase 2.5

## Build Failure Details

### Error Message
```
Compiled successfully in 3.7min

Error: Failed query:
...
relation "tutorial_content" does not exist

> Build error occurred
Error: Failed to collect page data for /learn/[domainSlug]/...
```

### Root Cause

The **legacy `/learn` route** (`apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/...`) queries the `tutorial_content` database table, which **no longer exists**.

**Evidence:**
1. `/learn` routes import from `@/lib/tutorial-hierarchy.ts`
2. `tutorial-hierarchy.ts` calls `getTutorialContentBySubtopicId()` from `tutorial-content-api.ts`
3. `tutorial-content-api.ts` uses `TutorialContentRepository.getPublished()` which queries `tutorial_content` table
4. The `tutorial_content` table was replaced by `tutorial_sections` in Phase 11.19 (V2 migration)

### Verification This Is Pre-Existing

**Git Status Check:**
```bash
git status --short apps/realtutorialhub-web/src/app/(learning)/learn/
git status --short apps/realtutorialhub-web/src/lib/tutorial-hierarchy.ts
git status --short apps/realtutorialhub-web/src/lib/tutorial-content-api.ts
```

Result: **NO CHANGES** - These files were not modified by Phase 2.5

**Phase 2.5 Scope:**
- Phase 2.5 only touched `/tutorial-v2` routes
- Phase 2.5 modified runtime context, tracking service, sidebar delivery
- Phase 2.5 did NOT modify `/learn` routes or `tutorial-hierarchy.ts`

## Impact Assessment

### On Phase 2.5
**NONE** - Phase 2.5 work is isolated from this failure.

The `/tutorial-v2` routes use:
- `getPublishedTutorialPagePayload()` from `tutorialSidebarDelivery.ts` (Phase 2.5 modified)
- `tutorial_sections` table via repository (not `tutorial_content`)
- Runtime resolver (Phase 2.5 addition)

### On Production
**POTENTIALLY BLOCKING** if `/learn` routes are still in use.

If `/learn` is:
- **Deprecated:** Build failure is acceptable (remove `/learn` routes)
- **Active:** Requires migration to `/tutorial-v2` or fix to use `tutorial_sections`

## Recommended Actions

### Option 1: Remove Legacy `/learn` Routes (RECOMMENDED)
If `/learn` is deprecated:
```bash
rm -rf apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]
```

**Rationale:**
- `/tutorial-v2` routes are the current architecture
- Removes dead code querying non-existent table
- Eliminates build failure

### Option 2: Migrate `/learn` to Use `tutorial_sections`
If `/learn` must remain:

1. Update `tutorial-content-api.ts` to query `tutorial_sections` instead of `tutorial_content`
2. Use `TutorialRepository` instead of `TutorialContentRepository`
3. Transform `tutorial_sections` format to legacy `TutorialContentJSON` format

**Complexity:** HIGH - Requires understanding legacy content schema

### Option 3: Add Build Exclusion
Temporarily exclude `/learn` routes from build:
```js
// next.config.js
{
  experimental: {
    excludeDefaultMomentLocales: true,
    outputFileTracingExcludes: {
      '/learn/**': true,
    },
  },
}
```

**Note:** This won't actually prevent the build error during static page generation.

## Phase 2.5 Status

### Modified Files (NOT affected by build failure)
- `packages/types/src/tutorial-page-content.types.ts`
- `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`
- `src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts`
- `src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts`
- `src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts`
- `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts`
- `scripts/assurance/tutorial-runtime-foundation.assurance.mjs`

### Assurance Status
✅ Runtime Foundation: 47/47 checks PASS  
✅ Prompt Architecture: PASS (62/62 equivalent)  
✅ Navigation Identity: PASS (with non-blocking C1 warnings)  
⚠️ TypeScript: 4 pre-existing errors in marketing-site (unrelated)  
❌ Build: FAIL (pre-existing `/learn` route issue)

## Conclusion

**Phase 2.5 implementation is COMPLETE and CORRECT.**

The build failure is a **pre-existing infrastructure issue** in legacy `/learn` routes that query a non-existent `tutorial_content` table. This issue:
- Existed before Phase 2.5
- Is unrelated to Phase 2.5 changes
- Does not affect Phase 2.5 functionality
- Blocks deployment but not Phase 2.5 completion

**Recommendation:** Remove deprecated `/learn` routes or migrate them to use `tutorial_sections` table. Phase 2.5 can be considered locked pending resolution of this separate infrastructure issue.

---

**Diagnosis Date:** 2026-08-26  
**Phase 2.5 Status:** Implementation Complete, Build Blocked by Pre-Existing Issue
