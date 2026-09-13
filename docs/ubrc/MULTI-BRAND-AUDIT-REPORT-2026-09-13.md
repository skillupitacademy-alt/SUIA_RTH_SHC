# UBRC Multi-Brand Theme Audit Report

**Date:** 2026-09-13  
**Auditor:** Project AI (Kiro)  
**Contract Document:** `docs/ubrc/UBRC-MULTI-BRAND-THEME-CONTRACT.md`  
**Purpose:** Verify how D1 and C1 blocks receive brand-specific themes for RealTutorialHub and SkillUp IT Academy

---

## Executive Summary

**CONTRACT STATUS:** ⚠️ **PARTIALLY VERIFIED**

**Code-level theme propagation is supported for D1 and C1. Browser rendering, RSSB behavior, and cross-brand learning-state isolation still require direct verification.**

The D1 (Definition) and C1 (Code) blocks implement multi-brand theme propagation at the code level. Block JSON is brand-agnostic, themes are resolved at runtime, and both blocks use `theme.primary` and `theme.secondary` props throughout their implementations.

**Key Findings:**
- ✅ Block JSON contains NO brand or theme data
- ✅ Theme resolved at runtime via brand-to-theme mapping function
- ✅ D1 and C1 receive and validate theme prop
- ✅ No hardcoded colors found in D1/C1 (all use theme.primary/secondary)
- ✅ Database has brand_id column (table-level, not JSON)
- ✅ ILS API extracts brand via X-Brand header
- ✅ Multi-brand storage confirmed in tutorial_content schema

**Unresolved Points Requiring Verification:**
- ⚠️ Visual verification not performed (browser testing required)
- ⚠️ Cross-brand progress isolation not tested (E2E test required)
- ⚠️ RSSB integration inferred but not directly verified
- ⚠️ Theme validation inconsistency (D1 throws error, C1 uses fallback)
- ⚠️ Database brand isolation inferred via navigation_node_id (not directly proven)
- ⚠️ Complete API route implementation partly inferred

---

## 1. Theme Resolution Evidence

### 1.1 Brand Determination Mechanism

**Location:** Each brand's web app determines its own brand ID

**Evidence:**
- RTH app: `apps/realtutorialhub-web/src/app/api/tutorial/ils/*/route.ts`
  - Sets header: `'X-Brand': 'realtutorialhub'`
  
- SUIA app: `apps/skillup-web/src/app/api/tutorial/ils/*/route.ts`
  - Sets header: `'X-Brand': 'skillup'`

**Mechanism:** Brand is hardcoded per application deployment, not dynamically determined from URL.

---

### 1.2 Theme Mapping Source

**File:** `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts`  
**Function:** `getRuntimeBrandConfig()`  
**Lines:** 84-114

**Implementation:**
```typescript
function getRuntimeBrandConfig(
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>
): Pick<TutorialNavigationTree, 'brand' | 'theme'> {
  
  if (brandId === 'skillup') {
    return {
      brand: {
        name: 'SkillUp IT Academy',
        shortName: 'SUIA',
        tagline: 'Build Skills That Move Careers',
      },
      theme: {
        primary: '#f54a8d',
        primaryDark: '#d63d7a',
        secondary: '#133382',
        activeBackground: '#fff0f6',
        completed: '#08a64a',
      },
    };
  }

  // Default: RealTutorialHub
  return {
    brand: {
      name: 'RealTutorialHub',
      shortName: 'RTH',
      tagline: 'Learn Smarter, Not Harder',
    },
    theme: {
      primary: '#d03f00',
      primaryDark: '#b63600',
      secondary: '#124fd6',
      activeBackground: '#eef3fa',
      completed: '#08a64a',
    },
  };
}
```

**Theme Values:**

| Brand | Name | Primary | Primary Dark | Secondary |
|-------|------|---------|--------------|-----------|
| RTH | RealTutorialHub | `#d03f00` (orange/red) | `#b63600` | `#124fd6` (blue) |
| SUIA | SkillUp IT Academy | `#f54a8d` (pink) | `#d63d7a` | `#133382` (navy blue) |

**Storage:** Static TypeScript function (not database, not config file)

---

### 1.3 SSR Theme Resolution

**File:** Example from `apps/realtutorialhub-web/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`  
**Line:** 149

**Evidence:**
```typescript
const theme = getDomainTheme(resolved.domainSlug);
```

**Note:** This is domain-level theming (different from brand-level theme used in blocks). The brand-level theme comes from `tutorialSidebarDelivery.ts` via navigation tree.

**Actual flow for blocks:**
1. Page fetches navigation tree with brand theme
2. Theme passed to Tutorial components
3. Components pass theme to TutorialBlockRenderer
4. Renderer passes theme to individual blocks

---

### 1.4 Theme Passed to TutorialBlockRenderer

**Type Definition:**  
**File:** `packages/ui/src/tutorial/types.ts`  
**Lines:** 52-59, 80-83

**Evidence:**
```typescript
export type DomainTheme = Record<string, any>;

export interface TutorialRendererProps {
  document: TutorialDocument | null | undefined;
  sectionType?: string;
  theme?: DomainTheme;  // ← Theme prop
  className?: string;
}

export interface BlockComponentProps<T extends TutorialBlock = TutorialBlock> {
  block: T;
  depth?: number;
  theme?: DomainTheme;  // ← Theme prop passed to blocks
  className?: string;
  renderChild?: (block: TutorialBlock, depth: number) => React.ReactNode;
  runtimeContext?: TutorialBlockRuntimeContext;
}
```

**Prop chain:** Page → TutorialRenderer → TutorialBlockRenderer → Block Component

---

## 2. D1 Block Multi-Brand Evidence

### 2.1 D1 Component Signature

**File:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`  
**Lines:** 11-14, 46-54

**Evidence:**
```typescript
export function DefinitionBlock({ 
  block, 
  className = '',
  theme  // ← Receives theme prop
}: BlockComponentProps<IDefinitionBlock>) {
  // Version routing
  switch (block.version) {
    case 'D1':
      return <DefinitionD1View block={block} theme={theme} className={className} />;
    // ...
  }
}

function DefinitionD1View({ 
  block, 
  theme,  // ← Receives theme from router
  className = '' 
}: { 
  block: IDefinitionBlock;
  theme?: DomainTheme;  // ← Optional for preview contexts
  className?: string;
}) {
  // ... implementation
}
```

**✅ CONFIRMED:** D1 receives theme prop via BlockComponentProps

---

### 2.2 D1 Theme Validation

**File:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`  
**Lines:** 58-64

**Evidence:**
```typescript
// Theme is required for canonical locked renderer
if (!theme?.primary || !theme?.secondary) {
  throw new Error(
    `[DefinitionD1View] Missing required brand theme for Definition D1 block ${block.id}`
  );
}

const primary = theme.primary;
const secondary = theme.secondary;
```

**✅ CONFIRMED:** D1 validates theme presence and extracts primary/secondary colors

---

### 2.3 D1 Theme Usage Locations

**File:** `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`  
**Usage count:** 20+ instances

**Evidence (sample):**

| Line | Element | Usage |
|------|---------|-------|
| 77 | Article wrapper | `style={{ color: secondary }}` |
| 85 | Badge text | `style={{ color: primary }}` |
| 90 | Heading | `style={{ color: secondary }}` |
| 92 | Accent line | `style={{ backgroundColor: primary }}` |
| 94 | Intro text | `style={{ color: secondary }}` |
| 99 | Section background | `style={{ backgroundColor: withAlpha(primary, '0d'), borderColor: withAlpha(primary, '66') }}` |
| 100 | Icon circle | `style={{ backgroundColor: primary }}` |
| 105 | Section heading | `style={{ color: primary }}` |
| 106 | Definition text | `style={{ color: secondary }}` |
| 115 | Section icon | `style={{ color: primary }}` |
| 116 | Section heading | `style={{ color: secondary }}` |
| 118 | Explanation text | `style={{ color: secondary }}` |

**Hardcoded colors found:** ❌ NONE (all colors use theme.primary or theme.secondary)

**✅ CONFIRMED:** D1 uses theme prop exclusively, no hardcoded brand colors

---

### 2.4 D1 Visual Verification

**Cannot perform browser testing in this audit session.**

**Recommended manual verification:**
1. Navigate to RTH D1 page: `https://realtutorialhub.com/learn/[domain]/[subject]/[topic]/[subtopic]`
2. Inspect visual colors: Should show orange (`#d03f00`) and blue (`#124fd6`)
3. Navigate to SUIA D1 page: `https://skillup.academy/learn/[domain]/[subject]/[topic]/[subtopic]`  
4. Inspect visual colors: Should show pink (`#f54a8d`) and navy (`#133382`)

**Expected outcome:** Same D1 block JSON, different visual presentation.

---

## 3. C1 Block Multi-Brand Evidence

### 3.1 C1 Component Signature

**File:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`  
**Lines:** 16-24

**Evidence:**
```typescript
export function CodeC1Block({ 
  block, 
  theme: providedTheme  // ← Receives theme prop
}: BlockComponentProps<CodeC1BlockType>) {
  const page = block.content.page;

  // Fallback theme for when theme is not provided
  const theme = providedTheme ?? {
    primary: '#3b82f6',
    primaryDark: '#1e40af',
    secondary: '#0b1b3d',
  };
  // ... implementation
}
```

**✅ CONFIRMED:** C1 receives theme prop via BlockComponentProps

**⚠️ INCONSISTENCY:** C1 has fallback theme for preview contexts (D1 throws error instead)  
**Recommendation:** Standardize validation pattern across all blocks

---

### 3.2 C1 Theme Usage Locations

**File:** `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`  
**Usage count:** 30+ instances

**Evidence (sample):**

| Line | Element | Usage |
|------|---------|-------|
| 103 | Badge | `style={{ color: theme.primaryDark, backgroundColor: withAlpha(theme.primary, '14') }}` |
| 104 | Icon | `style={{ color: theme.primary }}` |
| 107 | Heading | `style={{ color: theme.secondary }}` |
| 110 | Accent line | `style={{ backgroundColor: theme.primary }}` |
| 111 | Intro text | `style={{ color: theme.secondary }}` |
| 117 | Section icon | `style={{ color: theme.primary }}` |
| 118 | Section heading | `style={{ color: theme.secondary }}` |
| 133 | Icon | `style={{ color: theme.primary }}` |
| 134 | Heading | `style={{ color: theme.secondary }}` |
| 136 | Border | `style={{ borderColor: withAlpha(theme.primary, '66') }}` |
| 138 | Border | `style={{ borderColor: withAlpha(theme.primary, '33') }}` |
| 139 | Number badge | `style={{ backgroundColor: theme.primary }}` |
| 142 | Code text | `style={{ color: theme.primaryDark, backgroundColor: withAlpha(theme.primary, '14') }}` |
| 145 | Explanation text | `style={{ color: theme.secondary }}` |

**Hardcoded colors found:** 
- ✅ Terminal window chrome colors (`#ff5f57`, `#febc2e`, `#28c840`) - UI decoration, not brand colors
- ✅ Takeaway section yellow (`#f59e0b`, `#d97706`) - Semantic color, not brand-specific
- ❌ NO hardcoded brand colors

**✅ CONFIRMED:** C1 uses theme prop for ALL brand-related colors

---

### 3.3 C1 Visual Verification

**Cannot perform browser testing in this audit session.**

**Recommended manual verification:**
1. Navigate to RTH C1 page
2. Inspect section headers, icons, borders: Should show RTH orange/blue
3. Navigate to SUIA C1 page
4. Inspect section headers, icons, borders: Should show SUIA pink/navy

**Expected outcome:** Same C1 block JSON, different brand colors in UI.

---

## 4. Database Schema Evidence

### 4.1 tutorial_content Table Structure

**File:** `packages/db-tutorial/migrations/schema.ts`  
**Lines:** 286-310

**Evidence:**
```sql
-- Table definition (from Drizzle schema)
CREATE TABLE tutorial_content (
  id UUID PRIMARY KEY,
  subtopic_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,  -- Page identity
  brand_id TEXT NOT NULL,             -- ← BRAND IN TABLE COLUMN
  content JSONB NOT NULL,              -- ← Block JSON (brand-agnostic)
  status section_status NOT NULL,
  -- ... metadata columns
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Unique constraint (Line 303)
UNIQUE INDEX uq_tutorial_v2_identity_active
  ON (subtopic_id, navigation_node_id, brand_id)
  WHERE deleted_at IS NULL;

-- Delivery index (Line 300)
INDEX idx_tutorial_v2_delivery
  ON (subtopic_id, navigation_node_id, brand_id, status);
```

**✅ CONFIRMED:** 
- Brand stored in TABLE COLUMN (`brand_id TEXT`)
- NOT stored in JSONB content
- Unique constraint includes brand_id (same content can exist per brand)

---

### 4.2 Multi-Brand Storage Pattern

**Query pattern (inferred from schema):**
```sql
-- Fetch tutorial content for specific brand
SELECT content
FROM tutorial_content
WHERE subtopic_id = '...'
  AND navigation_node_id = '...'
  AND brand_id = 'realtutorialhub'  -- or 'skillup'
  AND status = 'published'
  AND deleted_at IS NULL;
```

**Result:** Same block JSON can exist twice (once per brand), but JSON itself contains no brand data.

**✅ CONFIRMED:** Multi-brand storage at table level, not JSON level

---

### 4.3 LSNB and Block Learning State

**Tutorial Navigation Progress:**
- File: `packages/db-tutorial/migrations/schema.ts` (Line 481)
- **Does NOT have brand_id column**
- Brand context inferred via navigation_node_id → tutorial_content.brand_id relationship

**Block Learning State:**
- Searched schema, did NOT find explicit brand_id column
- Brand context inferred via navigation_node_id → tutorial_content.brand_id relationship

**⚠️ Verification Required:** 
- Trace actual database queries to confirm brand isolation
- Check if navigation_node_id uniquely identifies brand-specific content
- Verify constraints prevent cross-brand progress leakage
- Test scenario: Same user, same content, different brands (RTH vs SUIA)

**Current Status:** Brand isolation mechanism **inferred** but not **proven** through direct query verification.

---

## 5. ILS Integration Brand Context

### 5.1 Brand Extraction Mechanism

**RTH API Routes:**
- File: `apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts`
- Line: 57

**Evidence:**
```typescript
const response = await fetch(url.toString(), {
  headers: {
    'Content-Type': 'application/json',
    'X-Brand': 'realtutorialhub',  // ← Hardcoded per app
    'X-User-ID': user.userId,
    'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
  },
  // ...
});
```

**SUIA API Routes:**
- File: `apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts`
- Line: 80

**Evidence:**
```typescript
headers: {
  'X-Brand': 'skillup',  // ← Hardcoded per app
  // ...
}
```

**Mechanism:** Each brand's web app hardcodes its brand ID in API requests via `X-Brand` header.

**✅ CONFIRMED:** ILS API receives brand via HTTP header, not from block JSON.

---

### 5.2 API Server Brand Processing

**Files searched:** 
- `apps/api-server/src/app/api/tutorial/ils/active-time/route.ts` (Line 48)
- `apps/api-server/src/app/api/tutorial/ils/block-completion/route.ts` (Line 49)

**Pattern found:**

```typescript
const identity: AuthenticatedIdentity = {
  userId: context.userId,
  brand: context.brand,  // ← Extracted from header
  sessionId: sessionId !== null && sessionId !== '' ? sessionId : undefined,
};
```

**✅ CONFIRMED:** API server extracts brand from X-Brand header and includes in authenticated identity.

**⚠️ NOT VERIFIED:** Complete `block-visit` route implementation. Pattern inferred from similar routes but not directly observed.

---

## 6. RSSB Integration Brand Context

**Verification Status:** ⚠️ **NOT DIRECTLY VERIFIED**

**File locations searched:** Did not find explicit RSSB filtering code in audit.

**Expected mechanism (inferred from ILS pattern):**
1. RSSB UI calls ILS API with X-Brand header
2. ILS returns metrics filtered by brand
3. User sees only their progress for current brand

**Status:** Implementation pattern inferred from ILS architecture, but not directly observed or tested.

**Required verification:**
1. Locate RSSB component API calls in codebase
2. Verify X-Brand header is sent in RSSB requests
3. Trace API server RSSB handlers for brand filtering logic
4. Test cross-brand isolation (RTH user shouldn't see SUIA progress)
5. Confirm database queries include brand_id WHERE clause

---

## 7. Composer Integration

**Documentation References:**
- `packages/types/src/tutorial-composer/ai-context.ts` (Line 13)
- Comment: `brand, theme (runtime resolution)`

**AI Prompt Generation:**
- `packages/db-tutorial/src/services/definition-d1-prompt-generator.ts` (Lines 25, 198-199)
- `packages/db-tutorial/src/services/code-c1-prompt-generator.ts` (Lines 26, 216-217)

**Evidence:**
```typescript
// From AI context validation tests
// PROHIBITED SYSTEM METADATA
// Do NOT include id, blockId, version, domainId, subjectId, 
// topicId, subtopicId, brandId, theme, status, publishedAt, 
// or schemaVersion
```

**✅ CONFIRMED:** 
- Composer prohibits AI from generating brand or theme in block content
- Brand and theme explicitly listed as "runtime resolution" metadata
- Tests verify rejection of AI-generated brand/theme fields

---

## 8. Contract Violations Found

### ❌ NONE

All anti-patterns checked:
- ❌ Brand in block JSON: **NOT FOUND**
- ❌ Theme in block JSON: **NOT FOUND**
- ❌ Hardcoded brand colors: **NOT FOUND** (D1 and C1 use theme prop)
- ❌ Brand-specific components: **NOT FOUND** (single component per block type)
- ❌ Runtime brand switching in block: **NOT FOUND** (blocks don't access brand)

---

## 9. Unresolved Verification Points

### 9.1 Visual Rendering Not Verified

**Status:** ⚠️ **BROWSER TESTING REQUIRED**

**What needs verification:**
- RTH D1/C1 pages display orange (#d03f00) and blue (#124fd6)
- SUIA D1/C1 pages display pink (#f54a8d) and navy (#133382)
- Same block JSON renders with visually different brand colors

**Why it matters:** Code shows theme.primary/secondary usage, but actual color application in browser has not been observed.

**How to verify:**
1. Navigate to RTH tutorial page with D1 block
2. Inspect element styles in browser DevTools
3. Confirm inline styles use RTH colors
4. Repeat for SUIA brand
5. Take screenshots for documentation

---

### 9.2 Cross-Brand Progress Isolation Not Tested

**Status:** ⚠️ **E2E TEST REQUIRED**

**What needs verification:**
- User completes D1 block on RTH
- Same user views same content on SUIA
- SUIA shows block as incomplete (isolated progress)
- RTH still shows block as complete

**Why it matters:** Database schema suggests isolation via navigation_node_id, but actual query logic and runtime behavior not confirmed.

**How to verify:**
1. Create test user account
2. Complete tutorial content on RTH
3. Check block_learning_state records (should have RTH navigation_node_id)
4. Access same subtopic on SUIA
5. Verify progress not carried over
6. Check database for separate SUIA navigation_node_id records

**Expected database state:**
```sql
-- After RTH completion
SELECT * FROM block_learning_state 
WHERE user_id = 'test-user' 
  AND navigation_node_id LIKE '%realtutorialhub%';
-- Should show completion

-- After SUIA visit
SELECT * FROM block_learning_state 
WHERE user_id = 'test-user' 
  AND navigation_node_id LIKE '%skillup%';
-- Should show fresh state or not exist
```

---

### 9.3 RSSB Brand Filtering Not Verified

**Status:** ⚠️ **CODE TRACE + INTEGRATION TEST REQUIRED**

**What needs verification:**
- Locate RSSB component source code
- Confirm X-Brand header sent in API calls
- Trace API server RSSB handlers
- Verify brand filtering in SQL queries
- Test RSSB UI shows only current brand's progress

**Why it matters:** RSSB behavior was inferred from ILS pattern but not directly observed.

**How to verify:**
1. Search for RSSB UI component files
2. Find API call code (likely uses fetch with headers)
3. Confirm X-Brand header present
4. Locate API server RSSB route handlers
5. Read SQL queries for WHERE brand_id = ? clause
6. Test in browser: RTH user sees only RTH progress

**Files to check:**
- RSSB components: `apps/{brand}-web/src/components/RSSB*.tsx` (location unknown)
- API routes: `apps/api-server/src/app/api/rssb/**/*.ts` (not verified in audit)

---

### 9.4 Database Query Brand Filtering Not Verified

**Status:** ⚠️ **SERVICE LAYER CODE INSPECTION REQUIRED**

**What needs verification:**
- Locate tutorial content service queries
- Confirm WHERE brand_id = ? in SELECT statements
- Verify navigation_node_id uniquely maps to brand
- Check for JOIN statements that might leak cross-brand data

**Why it matters:** Schema has brand_id column, but actual query implementation not confirmed.

**How to verify:**
1. Find tutorial content service: `packages/db-tutorial/src/services/tutorial-*.ts`
2. Read getTutorialContent() or equivalent function
3. Check SQL query or ORM query builder
4. Confirm brand parameter used in WHERE clause
5. Verify no queries fetch content without brand filter

**Expected pattern:**
```typescript
// Good: Brand-filtered query
const content = await db
  .select()
  .from(tutorialContent)
  .where(
    and(
      eq(tutorialContent.subtopicId, subtopicId),
      eq(tutorialContent.navigationNodeId, nodeId),
      eq(tutorialContent.brandId, brandId),  // ← Must be present
      eq(tutorialContent.status, 'published')
    )
  );

// Bad: Missing brand filter
const content = await db
  .select()
  .from(tutorialContent)
  .where(
    and(
      eq(tutorialContent.subtopicId, subtopicId),
      eq(tutorialContent.navigationNodeId, nodeId)
      // ← Missing brand filter, would return wrong brand's content
    )
  );
```

---

### 9.5 Complete API Route Implementation Not Verified

**Status:** ⚠️ **FULL ROUTE CODE READ REQUIRED**

**What needs verification:**
- Read complete block-visit route source
- Confirm brand extraction from X-Brand header
- Verify brand passed to ILS service
- Check error handling for missing brand header

**Why it matters:** Pattern inferred from active-time and block-completion routes, but block-visit route not directly read.

**How to verify:**
1. Read file: `apps/api-server/src/app/api/tutorial/ils/block-visit/route.ts`
2. Confirm this pattern exists:
```typescript
const brand = request.headers.get('X-Brand');
if (!brand) {
  return NextResponse.json({ error: 'Missing brand' }, { status: 400 });
}

const identity: AuthenticatedIdentity = {
  userId: context.userId,
  brand: brand,
  sessionId: sessionId,
};

await ilsService.recordBlockVisit(identity, ...params);
```
3. Verify ILS service signature accepts brand in identity parameter

---

### 9.6 Theme Validation Pattern Inconsistency

**Status:** ⚠️ **DESIGN DECISION REQUIRED**

**Inconsistency found:**
- **D1 (DefinitionBlock):** Throws error if theme missing
  ```typescript
  if (!theme?.primary || !theme?.secondary) {
    throw new Error(`Missing required brand theme for Definition D1 block`);
  }
  ```

- **C1 (CodeC1Block):** Uses fallback theme if missing
  ```typescript
  const theme = providedTheme ?? {
    primary: '#3b82f6',
    primaryDark: '#1e40af',
    secondary: '#0b1b3d',
  };
  ```

**Why it matters:** New blocks need consistent guidance on theme handling.

**Decision needed:**
- **Option A:** All blocks throw error (strict validation)
- **Option B:** All blocks use fallback (graceful degradation)
- **Option C:** Blocks throw in production, use fallback in preview/Composer

**Recommendation:** Choose Option A (strict validation) to catch integration errors early. Document in UBRC guide.

---

## 10. Contract Satisfaction Summary

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Block JSON is brand-agnostic | ✅ SATISFIED | No brandId/theme in block types, AI prompts prohibit |
| Theme resolved at runtime | ✅ SATISFIED | `getRuntimeBrandConfig()` function found |
| D1 receives theme prop | ✅ SATISFIED | `BlockComponentProps<IDefinitionBlock>` includes theme |
| D1 uses theme.primary/secondary | ✅ SATISFIED | 20+ usages found, zero hardcoded brand colors |
| D1 validates theme | ⚠️ INCONSISTENT | Throws error (C1 uses fallback instead) |
| C1 receives theme prop | ✅ SATISFIED | `BlockComponentProps<CodeC1BlockType>` includes theme |
| C1 uses theme.primary/secondary | ✅ SATISFIED | 30+ usages found, zero hardcoded brand colors |
| Database has brand_id column | ✅ SATISFIED | `tutorial_content.brand_id TEXT NOT NULL` |
| Unique constraint includes brand | ✅ SATISFIED | `UNIQUE(subtopic_id, navigation_node_id, brand_id)` |
| ILS API extracts brand | ✅ SATISFIED | `X-Brand` header mechanism found |
| Brand NOT in block JSON | ✅ SATISFIED | Verified in types, tests, and AI prompts |
| Same block for multiple brands | ✅ SATISFIED | Schema allows duplicate records per brand |
| Visual rendering per brand | ⚠️ NOT VERIFIED | Browser testing required |
| Cross-brand progress isolation | ⚠️ NOT VERIFIED | E2E testing required |
| RSSB brand filtering | ⚠️ NOT VERIFIED | Code trace required |
| Database query brand filtering | ⚠️ NOT VERIFIED | Service layer inspection required |

---

## 11. Visual Verification (Manual Testing Required)

**Could NOT be completed in this audit session.**

**Recommended manual test procedure:**

### Test 1: RTH Visual Verification
1. Navigate to RTH tutorial page with D1 block
2. Expected colors:
   - Primary: `#d03f00` (orange/red)
   - Secondary: `#124fd6` (blue)
3. Inspect element → Verify inline styles match
4. Check console for theme validation errors (should be none)

### Test 2: SUIA Visual Verification
1. Navigate to SUIA tutorial page with same D1 block
2. Expected colors:
   - Primary: `#f54a8d` (pink)
   - Secondary: `#133382` (navy)
3. Inspect element → Verify inline styles match
4. Check console for theme validation errors (should be none)

### Test 3: C1 Visual Verification
Repeat Test 1 & 2 with C1 block pages.

### Test 4: Cross-Brand Isolation
1. Login to RTH as user A
2. View tutorial, verify progress tracked
3. Login to SUIA as same user A
4. Verify RTH progress NOT visible (brand-isolated)

---

## 12. Recommendations

### For Documentation

1. **Update contract document** with actual file paths found in audit
2. **Add visual verification screenshots** after manual testing
3. **Document fallback theme pattern** (C1 uses fallback, D1 throws error)
4. **Clarify LSNB brand association** (implicit via navigation_node_id)

### For Development

1. **Standardize theme validation:** D1 throws error, C1 uses fallback - choose one pattern
2. **Add RSSB brand filtering verification:** Confirm cross-brand isolation works
3. **Consider explicit brand_id in block_learning_state:** Currently inferred, could be explicit
4. **Document theme type:** `DomainTheme = Record<string, any>` is too loose, should have interface

### For Testing

1. **Add automated visual regression tests** for RTH vs SUIA colors
2. **Add integration test:** Verify same block JSON renders differently per brand
3. **Add E2E test:** Verify cross-brand progress isolation
4. **Add test:** Verify AI cannot generate brand/theme in block content

---

## 13. Conclusion

**CONTRACT STATUS:** ⚠️ **PARTIALLY VERIFIED — Code-level implementation supported, runtime verification pending**

The multi-brand theme architecture is correctly implemented at the **code level**:

**What Has Been Verified:**
- ✅ Block JSON structure is brand-agnostic
- ✅ Theme resolution function exists and returns brand-specific values
- ✅ D1 and C1 receive theme props via BlockComponentProps
- ✅ D1 and C1 use theme.primary/secondary exclusively (no hardcoded colors)
- ✅ Database schema has brand_id column at table level
- ✅ ILS API proxy sends X-Brand header
- ✅ API server extracts brand from header (verified in active-time/block-completion routes)

**What Requires Verification:**

1. **Visual rendering** (browser testing):
   - RTH pages show orange (#d03f00) and blue (#124fd6)
   - SUIA pages show pink (#f54a8d) and navy (#133382)
   - Same block JSON renders with different colors per brand

2. **Cross-brand progress isolation** (E2E testing):
   - User A completes tutorial on RTH
   - Same user A views same content on SUIA
   - Progress is isolated (SUIA shows fresh start, not RTH completion)

3. **RSSB brand filtering** (integration testing):
   - RSSB UI sends X-Brand header
   - API filters results by brand
   - User sees only current brand's progress

4. **Database query verification** (code trace):
   - Locate actual queries that fetch tutorial_content
   - Confirm WHERE brand_id = ? clause present
   - Verify navigation_node_id relationship ensures brand isolation

5. **Complete API route verification** (code inspection):
   - Read full block-visit route implementation
   - Confirm brand extraction and forwarding
   - Verify ILS service receives brand in identity parameter

6. **Theme validation standardization** (design decision):
   - D1 throws error when theme missing
   - C1 uses fallback theme
   - Choose one pattern for consistency

**Architecture Summary:**
```
Brand App (RTH or SUIA)
  ↓ Sets X-Brand header
ILS API Proxy
  ↓ Forwards brand
API Server
  ↓ Extracts brand from header
Tutorial Service
  ↓ Queries: WHERE brand_id = ? [UNVERIFIED]
Database (tutorial_content)
  ↓ Returns brand-specific record
Runtime Theme Resolution
  ↓ getRuntimeBrandConfig(brandId)
Theme → TutorialBlockRenderer
  ↓ Props chain
Block Component (D1 or C1)
  ↓ Uses theme.primary/secondary
Visual Output [UNVERIFIED]
  ↓ Different colors per brand
```

**Key Strengths:**
- Clean separation: Brand in table column, theme in runtime, neither in JSON
- Single block implementation serves multiple brands
- Type-safe theme propagation via BlockComponentProps
- Explicit AI validation preventing brand/theme in content
- Zero hardcoded brand colors in D1/C1

**Verification Status:**
- ✅ Code audit: COMPLETE (15+ files examined)
- ⚠️ Visual verification: REQUIRES MANUAL BROWSER TESTING
- ⚠️ Cross-brand isolation: REQUIRES E2E TESTING
- ⚠️ RSSB integration: REQUIRES CODE TRACE + INTEGRATION TEST
- ⚠️ Database queries: REQUIRES SERVICE-LAYER CODE INSPECTION
- ⚠️ Complete API routes: REQUIRES FULL ROUTE VERIFICATION

**Status Interpretation:**
This report provides **strong code-level evidence** that the multi-brand theme contract is implemented correctly. However, it should **not be treated as production certification** until the unverified points above are confirmed through:
- Direct browser observation (visual colors)
- End-to-end testing (progress isolation)
- Complete code trace (database queries, API routes, RSSB)

**Recommended Status Wording:**
> "Code-level theme propagation is supported for D1 and C1. Browser rendering, RSSB behavior, and cross-brand learning-state isolation still require direct verification."

**Next Actions:**
1. **Read-only verification phase:** Trace database queries, complete API routes, RSSB components
2. **Browser testing:** Visual verification of RTH vs SUIA colors
3. **E2E testing:** Cross-brand progress isolation
4. **Document findings:** Update this report with verification results
5. **Production certification:** Only after all verification complete

**Suitability for New Block Development:**
✅ **YES** - This pattern is safe to follow for new blocks:
- Use `BlockComponentProps<T>` with theme prop
- Use `theme.primary` and `theme.secondary` exclusively
- Do not store brand or theme in block JSON
- Validate theme presence (choose error or fallback pattern)
- Follow D1/C1 as reference implementations

---

**Report Status:** INITIAL CODE AUDIT COMPLETE — AWAITING RUNTIME VERIFICATION  
**Report Completed:** 2026-09-13  
**Files Verified:** 15+ source files across types, components, services, API routes, schema  
**Contract Compliance:** PARTIALLY VERIFIED (code level only)  
**Ready For:** Reference implementation pattern for new blocks  
**NOT Ready For:** Production certification without runtime verification
