# PHASE 2.6 — UNIVERSAL LEARNER DELIVERY IDENTITY HARDENING
## Implementation Status

**Date:** 2026-08-27  
**Phase:** 2.6 Identity Hardening (Foundation Gate for 18-Block Expansion)  
**Status:** PARTIAL - Core identity fixes complete, testing and deployment verification remaining

---

## ✅ COMPLETED CHANGES

### 1. Created TutorialPageIdentity.ts
**File:** `src/share-branding/LearningExperience/runtime/TutorialPageIdentity.ts`

- Canonical identity contract for all learner delivery
- Explicit cross-database mapping types
- Failure reason taxonomy for diagnostics
- Documents the invariant: `tutorial_subtopics.external_id === curriculumSubtopicId`

**Key Types:**
- `TutorialPageIdentity` - The universal identity object
- `TutorialPageIdentityResult` - Success/failure result type
- `TutorialPageIdentityFailureReason` - Specific failure classification

### 2. Fixed resolveHierarchy()
**File:** `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts`

**Changes:**
- Now queries TutorialDB for canonical slug after curriculum resolution
- Preserves `'what-is-java-12efacf1'` instead of regenerating `'whatisjava'`
- Verifies identity invariant (`external_id === curriculum ID`)
- Added database error handling (distinguishes outage from 404)
- Returns `tutorialId` and `canonicalSlug` in hierarchy object

**Before:**
```typescript
subtopic: {
  id: subtopic.id,
  name: subtopic.name,
  slug: canonicalSubtopicSlug(subtopic.name) // ❌ Regenerated "whatisjava"
}
```

**After:**
```typescript
subtopic: {
  id: subtopic.id,
  name: subtopic.name,
  slug: tutorialSubtopicRecord.slug, // ✅ Preserved "what-is-java-12efacf1"
  tutorialId: tutorialSubtopicRecord.id,
  canonicalSlug: tutorialSubtopicRecord.slug,
}
```

### 3. Fixed URL Generation (withTutorialV2Url)
**File:** `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts`

**Before:**
```typescript
url: `/tutorial-v2/${...}/${canonicalSubtopicSlug(item.slug || item.name)}/${item.id}`
// Generated URLs with regenerated slugs
```

**After:**
```typescript
url: `/tutorial-v2/${...}/${hierarchy.subtopic.slug}/${item.id}`
// Uses TutorialDB canonical slug directly
```

### 4. Created audit-page-identity.mjs
**File:** `scripts/tutorial/phase-26/audit-page-identity.mjs`

**Tests:**
- Complete identity chain verification
- Curriculum → Tutorial external_id mapping
- Tutorial subtopic → section mapping
- Navigation node → section mapping
- Publication state verification
- Block count verification

### 5. Updated TypeScript Interfaces
**File:** `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts`

- `TutorialSidebarDeliveryPayload.hierarchy.subtopic` now includes optional `tutorialId` and `canonicalSlug`
- Type-check passes ✅

---

## ⏳ REMAINING PHASE 2.6 TASKS

### CRITICAL (Must complete before I1/O1):

#### 1. Add Canonical URL Redirect in page.tsx
**File:** `apps/skillup-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx`

**Required Logic:**
```typescript
const canonicalPath = `/tutorial-v2/${hierarchy.domain.slug}/${hierarchy.subject.slug}/${hierarchy.topic.slug}/${hierarchy.subtopic.canonicalSlug}/${navigationNodeId}`;
const requestedPath = `/tutorial-v2/${domainSlug}/${subjectSlug}/${topicSlug}/${subtopicSlug}/${navigationNodeId}`;

if (requestedPath !== canonicalPath) {
  redirect(canonicalPath);
}
```

**Effect:**
- Legacy URL `whatisjava/whatisjava` → redirects to `what-is-java-12efacf1/whatisjava`
- Prevents duplicate page identities
- Single canonical URL for SEO/analytics

#### 2. Fix Publish Response Schema
**File:** `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/publish/route.ts`

**Issue:** Logs show ZodError with `navigationNodeId` missing from response

**Fix Required:**
```typescript
const response = TutorialResponseSchema.parse({
  ...otherFields,
  navigationNodeId: tutorial.navigationNodeId ?? null, // ← Add this
  ...
});
```

#### 3. Isolate Cache Invalidation Failures
**Files:** Cache invalidation calls in publish/update routes

**Issue:** Logs show `[Cache Invalidation] Failed to delete cache key error: fetch failed`

**Fix Required:**
```typescript
try {
  await invalidateTutorialDeliveryCache(...);
} catch (error) {
  console.error('[CACHE_INVALIDATION_FAILED]', {
    sectionId,
    error: error instanceof Error ? error.message : String(error),
  });
  // Don't fail the publish operation
}
```

**Rule:** Database success + cache failure = publish succeeds (with warning)

#### 4. Create Remaining Test Scripts

**Need to create:**
- `scripts/tutorial/phase-26/test-page-identity-resolution.mjs`
- `scripts/tutorial/phase-26/test-learner-delivery.mjs`
- `scripts/assurance/tutorial-phase26-universal-block-delivery.assurance.mjs`
- `scripts/tutorial/phase-26/phase26-master-audit.mjs`

#### 5. Add Package.json Scripts

**Add to root package.json:**
```json
{
  "scripts": {
    "tutorial:phase26:identity": "node scripts/tutorial/phase-26/audit-page-identity.mjs",
    "tutorial:phase26:resolution": "node scripts/tutorial/phase-26/test-page-identity-resolution.mjs",
    "tutorial:phase26:http": "node scripts/tutorial/phase-26/test-learner-delivery.mjs",
    "tutorial:phase26:blocks": "node scripts/assurance/tutorial-phase26-universal-block-delivery.assurance.mjs",
    "tutorial:phase26:audit": "node scripts/tutorial/phase-26/phase26-master-audit.mjs"
  }
}
```

#### 6. Run Complete Audit Suite

**Execute:**
```bash
npm run tutorial:phase26:audit
```

#### 7. Test Both URLs in Production

**Test Matrix:**
- ✅ Canonical: `what-is-java-12efacf1/whatisjava` → 200 OK with content
- ✅ Legacy: `whatisjava/whatisjava` → 307 redirect to canonical
- ✅ Invalid node: `what-is-java-12efacf1/invalid` → 404
- ✅ Invalid subtopic: `does-not-exist/whatisjava` → 404

#### 8. Verify Build and Deployment

**Steps:**
1. Clear Next.js cache: `Remove-Item -Recurse -Force apps/skillup-web/.next`
2. Build: `npm run build`
3. Deploy to production
4. Verify deployed code matches local changes
5. Test live URLs

---

## 🔧 KEY ARCHITECTURAL FIXES

### URL Identity Flow

#### BEFORE Phase 2.6 (Incorrect):
```
URL: what-is-java-12efacf1
 ↓
resolveHierarchy()
 ↓
curriculum: "What is Java?"
 ↓
canonicalSubtopicSlug(subtopic.name)
 ↓
GENERATED: "whatisjava"  ❌ Lost canonical identity
 ↓
Generated URLs use "whatisjava"
```

#### AFTER Phase 2.6 (Correct):
```
URL: what-is-java-12efacf1
 ↓
resolveHierarchy()
 ↓
curriculum: "What is Java?" (ID: 12efacf1...)
 ↓
tutorial_subtopics.external_id = 12efacf1...
 ↓
tutorial_subtopics.id = 414f63eb...
 ↓
tutorial_subtopics.slug = "what-is-java-12efacf1"
 ↓
hierarchy.subtopic.slug = "what-is-java-12efacf1"  ✅ Preserved
 ↓
Generated URLs use canonical slug
```

### Database Identity Chain (Verified Correct)

```
CURRICULUM DB (getDb()):
├── subtopics.id = "12efacf1-b5ad-4b43-9fe4-17ba1cf249e4"
    └── name = "What is Java?"

TUTORIAL DB (getTutorialDb()):
├── tutorial_subtopics
│   ├── id = "414f63eb-cccf-4bd1-bcc0-b52df69ce499"
│   ├── external_id = "12efacf1-b5ad-4b43-9fe4-17ba1cf249e4" ← Maps to curriculum
│   └── slug = "what-is-java-12efacf1" ← Canonical URL
│
└── tutorial_sections
    ├── id = "5326eeb6-c4c8-4218-9687-2b46f94a9bb4"
    ├── subtopic_id = "414f63eb..." ← Maps to tutorial_subtopics.id
    ├── navigation_node_id = "whatisjava"
    └── status = "deployed"
```

**Invariants Enforced:**
1. ✅ `tutorial_subtopics.external_id === curriculum subtopics.id`
2. ✅ `tutorial_sections.subtopic_id === tutorial_subtopics.id`
3. ✅ `tutorial_sections.navigation_node_id === requested navigationNodeId`

---

## 📊 PHASE 2.6 GATES STATUS

| Gate | Description | Status |
|------|-------------|--------|
| 01 | TypeScript compilation | ✅ PASS |
| 02 | Canonical slug preservation | ✅ PASS |
| 03 | external_id mapping query | ✅ PASS |
| 04 | Identity invariant verification | ✅ PASS |
| 05 | Database error handling | ✅ PASS |
| 06 | Canonical URL redirect | ⏳ Code ready, needs implementation |
| 07 | Publish response navigationNodeId | ⏳ Needs fix |
| 08 | Cache failure isolation | ⏳ Needs fix |
| 09 | Complete test suite | ⏳ audit-page-identity.mjs created, others needed |
| 10 | Production verification | ⏳ Awaiting deployment |
| 11 | URL A (canonical) → 200 | ⏳ Needs production test |
| 12 | URL B (legacy) → redirect | ⏳ Needs implementation + test |
| 13 | Invalid node → 404 | ⏳ Needs test |
| 14 | Invalid subtopic → 404 | ⏳ Needs test |
| 15 | Block-agnostic delivery | ✅ Already verified in Phase 2.5 |

---

## 🚫 WHAT WAS NOT CHANGED

**Correctly Preserved:**
- ✅ Database schema (no migrations)
- ✅ `tutorial_sections.subtopic_id` remains `414f63eb...` (correct)
- ✅ D1/C1/S1 block content (unchanged)
- ✅ Block schemas (unchanged)
- ✅ Block renderer (unchanged)
- ✅ TutorialDocument.blocks[] structure (unchanged)
- ✅ Cross-database external_id mapping (correct architecture)

---

## 📋 NEXT ACTIONS

### Immediate (This Session):
1. ✅ Create TutorialPageIdentity.ts
2. ✅ Fix resolveHierarchy() 
3. ✅ Fix URL generation
4. ✅ Create audit-page-identity.mjs
5. ✅ Verify TypeScript
6. ⏳ Complete remaining tasks above

### Before I1/O1 Implementation:
1. Complete all remaining Phase 2.6 tasks
2. Run full audit suite
3. Deploy to production
4. Verify both URLs work correctly
5. Document final gate status

### Only After All Gates Pass:
- Proceed with I1 (Interactive Block v1)
- Proceed with O1 (Output Block v1)
- Continue 18-block expansion

---

## 🔴 CRITICAL RULE

**DO NOT** proceed with additional block implementation (I1, O1, etc.) until:
- ✅ All Phase 2.6 gates pass
- ✅ Production URLs verified
- ✅ Canonical redirect working
- ✅ Publish response fixed
- ✅ Cache failures isolated

This is the foundation gate for universal 18-block delivery.

---

## 📝 CORRECTED UNDERSTANDING

### URL B Resolution (User Correction)
**Previous (incorrect) analysis:** "URL B `whatisjava/whatisjava` cannot resolve because matchesSlug() will fail"

**Actual behavior:** `matchesSlug("What is Java?", "whatisjava")` returns TRUE because:
```typescript
compactSlug("What is Java?") === compactSlug("whatisjava")
"whatisjava" === "whatisjava" // ✅ Match
```

Therefore URL B **does** resolve the curriculum subtopic. The question is whether it should be redirected to the canonical URL (recommended) or accepted as-is.

### Three Defect Classes Identified
1. **URL/Identity:** Canonical slug was being lost during resolution
2. **Publishing:** navigationNodeId missing from response → ZodError
3. **Infrastructure:** Cache invalidation failures + database connection issues

All three must be addressed independently in Phase 2.6.

---

**Status:** Foundation work complete. Testing, verification, and deployment tasks remaining.

**Next Update:** After remaining tasks completed and production verified.
