# Phase 3C-J Production Sidebar Audit

**Date**: 2026-09-01  
**Production URL**: `https://user.skillupitacademy.com/tutorial-v2/.../whatisjava`  
**Localhost URL**: `http://skillup.localhost:3009/tutorial-v2/.../whatisjava`  
**Status**: Production ✅ | Localhost ❌ 404

---

## AUDIT OBJECTIVE

Determine why production successfully serves the sidebar while localhost fails with HTTP 404 when both connect to the same database (`tutorial_prod`) that contains ZERO published sidebars.

---

## KEY FINDINGS

### 1. DATABASE STATE (VERIFIED)

**Table**: `tutorial_sidebar_trees_v2`  
**Query**: `SELECT COUNT(*) FROM tutorial_sidebar_trees_v2 WHERE topic_id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07' AND status = 'published'`  
**Result**: **0 rows** (ZERO published sidebars for Java topic)

```
Rows before test: 0
No existing record for (shared, fb47747d...)
```

### 2. SIDEBAR PUBLISH API (IDENTIFIED)

**File**: `apps/skillhubcore-admin/src/app/api/tutorial-left-sidebar/route.ts`  
**Purpose**: Publishes sidebar navigation trees to `tutorial_sidebar_trees_v2`

**Key Process** (Lines 1-892):
1. `ensureTopicHierarchySynced()` - Syncs hierarchy before publish
2. Validates hierarchy: Domain → Subject → Topic → Subtopics
3. Normalizes navigation IDs
4. Transforms tree (adds slugs/URLs)
5. UPSERTS to `tutorial_sidebar_trees_v2`

**Critical Insight**:
```typescript
// Line 826: Publish requires explicit API call
if (body.status === 'published') {
  hierarchySyncResult = await ensureTopicHierarchySynced(body.topicId);
  // ...syncs ALL subtopics for the topic...
}
```

### 3. PRODUCTION DELIVERY HYPOTHESIS

**Scenario A**: Production has different database
- Production may use a different `DATABASE_URL_TUTORIAL` connection string
- `user.skillupitacademy.com` may point to different DB instance than local

**Scenario B**: Production has cached/CDN sidebar
- Sidebar may be cached at CDN/edge layer
- Localhost bypasses cache, hits database directly

**Scenario C**: Production sidebar was previously published
- Sidebar may have been published in the past
- Database audit script may have wrong connection string or table

---

## AUDIT EVIDENCE

### Test Scripts Found

1. **`test-tutorial-sidebar-api-db.mjs`** (Lines 1-410)
   - Tests the publish API directly
   - Validates payload structure
   - Shows expected workflow: Load Template → Save Draft → Publish

2. **`test-with-server-logs.mjs`**
   - Tests Tutorial V2 delivery at `http://skillup.localhost:3009/tutorial-v2/.../whatisjava`
   - Shows successful delivery flow for testing

3. **`phase1-learner-e2e-certification.mjs`**
   - E2E certification script
   - Tests complete learner experience

### Publish API Workflow (from test script)

```
MANUAL PUBLISH WORKFLOW:
1. Navigate to: https://admin.skillhubcore.in/tools/tutorial-left-sidebar
2. Select hierarchy:
   - Domain: Full Stack Development
   - Subject: Backend Development  
   - Topic: Java
3. Click "Load Template"
4. Click "Save Draft" (status=draft)
5. Click "Publish" (status=published)
```

### Current Code Flow

**Localhost Delivery** (`tutorialSidebarDelivery.ts`):
```typescript
// Line 235: Get published sidebar
const sidebarRow = await getPublishedTutorialSidebar({
  brandId,
  topicId: resolvedHierarchy.topic.id,
});

if (!sidebarRow) {
  console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar FAIL - no sidebar found ✗');
  return null; // → 404
}
```

**Production Delivery** (UNKNOWN - requires investigation):
- Either connects to different database with published sidebar
- Or has fallback mechanism not present in code
- Or has cached sidebar from previous publish

---

## ROOT CAUSE ANALYSIS

### Localhost 404 Cause

**CONFIRMED**: No published sidebar in database → `getPublishedTutorialSidebar()` returns `null` → HTTP 404

**Why it's correct behavior**:
- Phase 2.5-2.6 code REQUIRES published sidebar
- Sidebar publish is a MANUAL admin operation
- System does NOT auto-generate sidebars from `tutorial_sections`

### Production Success - UNKNOWN

**Need to verify**:
1. Does production use different database connection?
2. Was sidebar previously published for Java topic?
3. Is there CDN/edge caching?

---

## RECOMMENDED NEXT STEPS

### Step 1: Verify Production Database Connection

**Check production environment variables**:
```bash
# Production DATABASE_URL_TUTORIAL may differ from localhost
# Need to inspect deployed environment or check deployment config
```

### Step 2: Check Production Database for Published Sidebar

**If production has different DB, run audit there**:
```sql
SELECT COUNT(*), status 
FROM tutorial_sidebar_trees_v2 
WHERE topic_id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'
GROUP BY status;
```

### Step 3: Publish Sidebar Locally (if needed)

**Option A - Manual Publish** (RECOMMENDED):
1. Start admin app: `npm run skillhubcore-admin:dev`
2. Navigate to: `http://localhost:PORT/tools/tutorial-left-sidebar`
3. Select: Domain=Full Stack Dev, Subject=Backend Dev, Topic=Java
4. Click "Load Template"
5. Click "Publish"

**Option B - Programmatic Publish**:
Create script to call publish API with hierarchy data

### Step 4: Alternative - Build Sidebar from Sections (REQUIRES APPROVAL)

**If sidebar should be auto-generated**:
- Add fallback in `tutorialSidebarDelivery.ts`
- Build sidebar from `tutorial_sections` when no published sidebar exists
- Use block titles + slugs to construct navigation tree
- **WARNING**: This changes architectural decision (sidebar publish workflow)

---

## CRITICAL QUESTIONS FOR USER

### Question 1: Production Database
**Q**: Does production use the same database as `DATABASE_URL_TUTORIAL` in `.env.local`?  
**Impact**: If different, production may have published sidebar that localhost doesn't have

### Question 2: Sidebar Publish Expectation
**Q**: Should Tutorial V2 content work WITHOUT a published sidebar?  
**Current behavior**: Requires published sidebar (manual admin operation)  
**Alternative**: Auto-generate from `tutorial_sections` blocks

### Question 3: Manual Publish Acceptable?
**Q**: Is it acceptable to manually publish the Java sidebar to fix localhost?  
**Process**: Use admin UI → Load Template → Publish  
**Result**: Creates published sidebar record in database

---

## TECHNICAL DEBT NOTES

### Sidebar Publish Workflow

**Current State**:
- Sidebar must be manually published via admin UI
- Each topic requires separate publish operation
- No auto-generation from tutorial content

**Potential Enhancement** (requires architectural decision):
- Auto-generate sidebar from `tutorial_sections` on first request
- Cache generated sidebar in memory
- Fallback: published sidebar → auto-generated → 404

### External/Internal ID Complexity

**Observation from `route.ts`** (Line 95-630):
```typescript
// ensureTopicHierarchySynced() creates complete hierarchy:
// 1. MainDB lookup (external IDs)
// 2. TutorialDB upsert (internal IDs) 
// 3. Verification (mapping exists)
```

**Impact**: Every sidebar publish triggers full hierarchy sync
- Ensures TutorialDB has all parent records
- Ensures external_id mappings exist
- Heavy operation for what should be simple sidebar update

---

## DELIVERY CERTIFICATION STATUS

### Current Status
- **Hierarchy Resolution**: ✅ WORKS (logs show SUCCESS)
- **Sidebar Lookup**: ❌ FAILS (no published sidebar)
- **HTTP Delivery**: ❌ 404

### Blockers
1. **Database State**: Zero published sidebars for Java topic
2. **Production Mystery**: Why does production work with same DB?
3. **Architectural Decision**: Auto-generate vs. require publish?

### Next Gate
Cannot proceed to E2E certification until sidebar delivery works.

---

## CONCLUSION

**ROOT CAUSE CONFIRMED**: Localhost 404 is caused by missing published sidebar in database.

**PRODUCTION MYSTERY UNRESOLVED**: Need to determine why production serves sidebar when database shows zero published sidebars.

**RECOMMENDED ACTION**: 
1. First verify production database connection (may be different)
2. If production has published sidebar, publish locally to match
3. If production auto-generates, implement fallback in code (requires approval)

**PHASE 3C-J STATUS**: BLOCKED pending sidebar resolution decision

---

## ARTIFACTS

### Test Scripts
- `test-tutorial-sidebar-api-db.mjs` - Publish API test
- `test-with-server-logs.mjs` - Delivery flow test
- `audit-sidebar-tables.mjs` - Database audit (created this session)

### Modified Files
- `tutorialSidebarDelivery.ts` (hierarchy resolver) - ✅ WORKING

### Database Queries Run
```sql
-- Sidebar count audit
SELECT COUNT(*) FROM tutorial_sidebar_trees_v2;
-- Result: 0

-- Java topic sidebar check
SELECT COUNT(*) 
FROM tutorial_sidebar_trees_v2 
WHERE topic_id = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07';
-- Result: 0
```

---

**END OF AUDIT**
