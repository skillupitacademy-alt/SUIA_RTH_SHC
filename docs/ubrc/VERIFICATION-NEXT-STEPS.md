# Multi-Brand Theme Verification - Next Steps

**Date:** 2026-09-13  
**Current Status:** Code audit complete, runtime verification pending  
**Primary Report:** `MULTI-BRAND-AUDIT-REPORT-2026-09-13.md`

---

## Quick Status Summary

### ✅ What Has Been Verified (Code Level)

- Block JSON contains no brand or theme data
- Theme resolution function exists (`getRuntimeBrandConfig()`)
- D1 and C1 blocks receive theme via `BlockComponentProps`
- D1 and C1 use `theme.primary`/`theme.secondary` exclusively
- Zero hardcoded brand colors in block implementations
- Database schema has `brand_id` column at table level
- ILS API proxies send `X-Brand` header
- API server extracts brand from header (confirmed in active-time/block-completion routes)

### ⚠️ What Requires Verification (Runtime/Integration)

6 unresolved verification points remain before production certification.

---

## Verification Checklist

### 1. Visual Rendering Verification

**Priority:** HIGH  
**Effort:** Low (5-10 minutes)  
**Requires:** Browser access to RTH and SUIA

**Steps:**
1. Navigate to RTH tutorial page with D1 block
   - URL pattern: `https://realtutorialhub.com/learn/[domain]/[subject]/[topic]/[subtopic]`
2. Open browser DevTools → Inspect D1 block elements
3. Verify inline styles use RTH theme colors:
   - Primary: `#d03f00` (orange/red)
   - Secondary: `#124fd6` (blue)
4. Take screenshot for documentation
5. Navigate to SUIA tutorial page with same D1 block
   - URL pattern: `https://skillup.academy/learn/[domain]/[subject]/[topic]/[subtopic]`
6. Verify inline styles use SUIA theme colors:
   - Primary: `#f54a8d` (pink)
   - Secondary: `#133382` (navy)
7. Take screenshot for documentation
8. Repeat steps 1-7 for C1 block

**Expected Outcome:**
- Same block JSON renders with different visual colors per brand
- No console errors related to missing theme

**Evidence to Collect:**
- Screenshots of RTH D1 block (orange/blue colors)
- Screenshots of SUIA D1 block (pink/navy colors)
- Screenshots of RTH C1 block
- Screenshots of SUIA C1 block
- Browser DevTools element inspection showing inline styles

**Where to Document:**
- Update Section 2.4 and 3.3 in `MULTI-BRAND-AUDIT-REPORT-2026-09-13.md`
- Change status from "NOT VERIFIED" to "✅ VERIFIED" with evidence

---

### 2. Cross-Brand Progress Isolation Test

**Priority:** HIGH  
**Effort:** Medium (15-20 minutes)  
**Requires:** Test user account, database access

**Steps:**
1. Create test user account (or use existing test account)
2. Login to RTH as test user
3. Navigate to tutorial with D1/C1 blocks
4. Complete the tutorial content (trigger ILS block completion)
5. Query database to confirm completion recorded:
   ```sql
   SELECT * FROM block_learning_state 
   WHERE user_id = 'test-user-id'
     AND navigation_node_id LIKE '%realtutorialhub%';
   ```
6. Login to SUIA as same test user
7. Navigate to same tutorial content (same subtopic, different brand)
8. Verify RSSB shows block as incomplete (NOT carried over from RTH)
9. Query database to confirm separate state:
   ```sql
   SELECT * FROM block_learning_state 
   WHERE user_id = 'test-user-id'
     AND navigation_node_id LIKE '%skillup%';
   ```
10. Expected: No record exists OR record shows incomplete state

**Expected Outcome:**
- RTH completion recorded with RTH navigation_node_id
- SUIA shows fresh/incomplete state (not RTH completion)
- Database has separate records (or no SUIA record yet)
- navigation_node_id differs between brands for same content

**Evidence to Collect:**
- Database query results showing RTH completion
- Database query results showing SUIA fresh state
- Screenshots of RSSB on RTH (showing completion)
- Screenshots of RSSB on SUIA (showing incomplete)
- Confirmation that navigation_node_id includes brand identifier

**Where to Document:**
- Update Section 9.2 in audit report
- Add new section: "Cross-Brand Isolation Test Results"

---

### 3. RSSB Brand Filtering Verification

**Priority:** MEDIUM  
**Effort:** High (30-45 minutes)  
**Requires:** Code access, browser DevTools

**Steps:**

**Part A: Code Trace**
1. Locate RSSB UI component files
   - Search for: `RSSB*.tsx`, `progress*.tsx`, `sidebar*.tsx` in apps/{brand}-web
2. Find API call code in RSSB components
3. Verify `X-Brand` header sent in fetch/API calls
4. Locate API server RSSB route handlers
   - Check: `apps/api-server/src/app/api/rssb/**/*.ts`
5. Read SQL queries or ORM calls for brand filtering
6. Confirm `WHERE brand_id = ?` clause present

**Part B: Browser Testing**
1. Login to RTH
2. Open browser DevTools → Network tab
3. Navigate to tutorial page (RSSB should load)
4. Inspect RSSB API requests
5. Verify request headers include `X-Brand: realtutorialhub`
6. Inspect response payload
7. Verify response contains only RTH progress data
8. Repeat for SUIA brand

**Expected Outcome:**
- RSSB components send `X-Brand` header
- API server filters results by brand
- RTH user sees only RTH progress
- SUIA user sees only SUIA progress
- No cross-brand data leakage

**Evidence to Collect:**
- File paths of RSSB components
- Code snippet showing X-Brand header in API call
- File paths of API server RSSB handlers
- SQL query showing brand filtering
- Network tab screenshots showing X-Brand header
- Response payload samples (RTH vs SUIA)

**Where to Document:**
- Update Section 6 in audit report
- Update Section 9.3 with findings

---

### 4. Database Query Brand Filtering Verification

**Priority:** HIGH  
**Effort:** Medium (20-30 minutes)  
**Requires:** Code access

**Steps:**
1. Locate tutorial content service files
   - Check: `packages/db-tutorial/src/services/tutorial-*.ts`
   - Check: `packages/db-tutorial/src/services/content-*.ts`
2. Find query functions that fetch tutorial content
   - Look for: `getTutorialContent()`, `fetchContent()`, `loadTutorial()`
3. Read query implementation (SQL or ORM)
4. Verify `WHERE brand_id = ?` clause present
5. Check for JOIN statements that might bypass brand filtering
6. Verify no queries fetch content without brand parameter
7. Trace parameter flow from API route → service → query

**Expected Pattern:**
```typescript
const content = await db
  .select()
  .from(tutorialContent)
  .where(
    and(
      eq(tutorialContent.subtopicId, subtopicId),
      eq(tutorialContent.navigationNodeId, navigationNodeId),
      eq(tutorialContent.brandId, brandId),  // ← Must be present
      eq(tutorialContent.status, 'published')
    )
  );
```

**Anti-Pattern to Check For:**
```typescript
// Missing brand filter - would return wrong brand's content
const content = await db
  .select()
  .from(tutorialContent)
  .where(
    and(
      eq(tutorialContent.subtopicId, subtopicId),
      eq(tutorialContent.navigationNodeId, navigationNodeId)
      // ← Missing brand filter!
    )
  );
```

**Expected Outcome:**
- All content queries include brand filter
- No queries bypass brand filtering
- Brand parameter traced from API → service → query

**Evidence to Collect:**
- File path of tutorial content service
- Function name and line number of query
- Code snippet showing WHERE brand_id clause
- Confirmation no queries omit brand filter

**Where to Document:**
- Update Section 9.4 in audit report
- Add code snippet to Section 4 (Database Schema Evidence)

---

### 5. Complete API Route Verification

**Priority:** MEDIUM  
**Effort:** Low (10-15 minutes)  
**Requires:** Code access

**Steps:**
1. Read file: `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts`
2. Verify brand extraction pattern:
   ```typescript
   const brand = request.headers.get('X-Brand');
   if (!brand) {
     return NextResponse.json({ error: 'Missing brand' }, { status: 400 });
   }
   ```
3. Verify brand passed to ILS service:
   ```typescript
   const identity: AuthenticatedIdentity = {
     userId: context.userId,
     brand: brand,
     sessionId: sessionId,
   };
   
   await ilsService.recordBlockVisit(identity, ...params);
   ```
4. Confirm ILS service signature accepts brand in identity parameter
5. Repeat for any other ILS routes not yet verified

**Expected Outcome:**
- block-visit route follows same pattern as active-time/block-completion
- Brand extracted from X-Brand header
- Brand passed to ILS service via identity object
- Error handling for missing brand header

**Evidence to Collect:**
- Confirmation file exists at expected path
- Code snippet showing brand extraction
- Code snippet showing ILS service call with brand

**Where to Document:**
- Update Section 5.2 in audit report
- Update Section 9.5 with findings

---

### 6. Theme Validation Pattern Decision

**Priority:** LOW  
**Effort:** Low (discussion/decision)  
**Requires:** Team decision or architectural choice

**Current Inconsistency:**
- D1: Throws error if theme missing
- C1: Uses fallback theme if missing

**Options:**

**Option A: Strict Validation (Recommended)**
- All blocks throw error if theme missing
- Catches integration errors early
- Forces correct theme propagation
- Update C1 to match D1 pattern

**Option B: Graceful Degradation**
- All blocks use fallback theme if missing
- Prevents runtime crashes
- May hide integration issues
- Update D1 to match C1 pattern

**Option C: Context-Aware Validation**
- Throw error in production/canonical renderer
- Use fallback in preview/Composer mode
- Requires runtime context detection
- More complex but flexible

**Recommendation:** Choose Option A (strict validation)

**Steps:**
1. Review options with team
2. Make decision
3. Update block implementation to match chosen pattern
4. Document pattern in UBRC guide
5. Add validation test to block checklist

**Where to Document:**
- Update Section 9.6 in audit report
- Add rule to `UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`
- Add to `NEW-BLOCK-QUICK-START-CHECKLIST.md`

---

## Verification Order Recommendation

**Phase 1: Quick Wins (30 minutes)**
1. Visual rendering verification (#1)
2. Complete API route verification (#5)

**Phase 2: Critical Path (1 hour)**
3. Database query brand filtering (#4)
4. Cross-brand progress isolation test (#2)

**Phase 3: Integration Testing (1 hour)**
5. RSSB brand filtering verification (#3)

**Phase 4: Standardization (30 minutes)**
6. Theme validation pattern decision (#6)

**Total Estimated Effort:** ~3 hours

---

## After Verification Complete

### Update Documentation

1. **Audit Report** (`MULTI-BRAND-AUDIT-REPORT-2026-09-13.md`)
   - Change status from "PARTIALLY VERIFIED" to "✅ VERIFIED"
   - Update all "⚠️ NOT VERIFIED" entries with evidence
   - Add verification results to each section
   - Update conclusion with final certification

2. **Authoritative Guide** (`UBRC-NEW-BLOCK-AUTHORITATIVE-GUIDE.md`)
   - Add multi-brand audit findings
   - Document verified file paths
   - Add theme validation pattern rule
   - Include reference to audit report

3. **Quick Start Checklist** (`NEW-BLOCK-QUICK-START-CHECKLIST.md`)
   - Add theme prop requirement
   - Add theme validation requirement
   - Document theme.primary/secondary usage
   - Link to multi-brand contract

4. **Multi-Brand Theme Contract** (`UBRC-MULTI-BRAND-THEME-CONTRACT.md`)
   - Add "Verification Status: ✅ VERIFIED" section
   - Link to audit report
   - Update examples with actual file paths

### Production Certification

Only after ALL verification complete:
- Mark contract as "✅ PRODUCTION CERTIFIED"
- Approve pattern for new block development
- Use as reference implementation

---

## Contact / Questions

If verification reveals issues:
1. Document the issue in audit report
2. Update contract status to "⚠️ ISSUES FOUND"
3. Create fix plan before production certification
4. Re-run verification after fixes applied

---

**Document Status:** Ready for verification phase  
**Next Action:** Begin Phase 1 (Visual + API route verification)  
**Estimated Completion:** 3 hours of verification work
