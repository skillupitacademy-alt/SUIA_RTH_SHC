# UBRC Multi-Brand Theme Contract

**Date:** 2026-09-13  
**Status:** INVESTIGATION REQUIRED  
**Purpose:** Establish how Tutorial Composer blocks render brand-specific themes without storing brand data in block JSON

---

## Contract Objective

**Requirement:** One canonical block (e.g., D1, C1) must render with different themes for:
- RealTutorialHub (RTH)
- SkillUp IT Academy (SUIA)

**Without:**
- ❌ Brand ID in block JSON
- ❌ Theme colors in block JSON
- ❌ Separate block versions per brand
- ❌ Brand-specific block components

**With:**
- ✅ Runtime theme resolution
- ✅ Single canonical block definition
- ✅ Brand-agnostic block content
- ✅ Theme passed as React prop

---

## The Multi-Brand Architecture

### Expected Flow

```
1. User navigates to tutorial page
   → URL or session identifies brand (RTH or SUIA)
   
2. Server-side rendering (SSR)
   → Resolves brand from request context
   → Loads TutorialDocument from tutorial_content table
   → WHERE (subtopic_id, navigation_node_id, brand_id)
   
3. Theme Resolution
   → Brand → Theme mapping service/config
   → RTH → { primary: '#xxx', secondary: '#yyy', ... }
   → SUIA → { primary: '#aaa', secondary: '#bbb', ... }
   
4. Block Rendering
   → TutorialBlockRenderer receives theme prop
   → Each block component receives theme prop
   → Block uses theme.primary, theme.secondary in styles
   
5. Result
   → Same block JSON
   → Different visual presentation per brand
```

---

## Contract Requirements

### 1. Block JSON is Brand-Agnostic

**Stored in:** `tutorial_content.content` (JSONB column)

**Block structure:**
```typescript
{
  id: "uuid",
  type: "definition",
  version: "D1",
  content: {
    page: {
      type: "definition",
      title: "JavaScript Variables",
      // ... content fields
      // ❌ NO brandId field
      // ❌ NO theme field
      // ❌ NO color fields
    }
  }
}
```

**Rule:** Block JSON contains only semantic content, never presentation config or brand identity.

---

### 2. Theme Resolved at Runtime

**Theme structure:**
```typescript
interface DomainTheme {
  primary: string;      // Primary brand color (hex)
  primaryDark: string;  // Darker variant
  secondary: string;    // Secondary/text color
  // ... other theme tokens
}
```

**Resolution mechanism (MUST VERIFY):**
- Where is brand determined? (URL? Session? Database?)
- Where is theme mapping stored? (Config file? Database? Service?)
- How does SSR page component get theme?
- How is theme passed to TutorialBlockRenderer?
- How does each block component receive theme?

---

### 3. Block Components Consume Theme Prop

**Component signature:**
```typescript
function DefinitionD1View({ 
  block, 
  theme,  // ← Runtime-resolved theme
  className 
}: {
  block: DefinitionD1Block;
  theme?: DomainTheme;  // Optional for preview contexts
  className?: string;
}) {
  // Validate theme required
  if (!theme?.primary || !theme?.secondary) {
    throw new Error('Missing required theme');
  }
  
  return (
    <article style={{ color: theme.secondary }}>
      <h1 style={{ color: theme.primary }}>
        {block.content.page.title}
      </h1>
      {/* ... rest of component */}
    </article>
  );
}
```

**Rules:**
- ✅ Theme received as prop (not from context, unless wrapped)
- ✅ Theme used for colors (not hardcoded hex values)
- ✅ Theme validation at component entry
- ✅ Graceful fallback or error if theme missing

---

### 4. Tutorial Content Table Per-Brand Storage

**Table structure (MUST VERIFY):**
```sql
CREATE TABLE tutorial_content (
  id UUID PRIMARY KEY,
  subtopic_id UUID NOT NULL,
  navigation_node_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,  -- ← Brand stored in TABLE COLUMN
  content JSONB NOT NULL,   -- ← Block JSON (brand-agnostic)
  status section_status,
  -- ... metadata columns
  
  UNIQUE(subtopic_id, navigation_node_id, brand_id) 
    WHERE deleted_at IS NULL
);
```

**Query pattern:**
```sql
SELECT content 
FROM tutorial_content
WHERE subtopic_id = ?
  AND navigation_node_id = ?
  AND brand_id = ?  -- ← Brand filter at query time
  AND status = 'published'
  AND deleted_at IS NULL;
```

**Rule:** Same block content can exist multiple times (one per brand), but block JSON itself is brand-agnostic.

---

### 5. LSNB is Brand-Aware

**Verification required:**
- Does `tutorial_navigation_progress` have brand_id column?
- How is LSNB record associated with brand?
- Can same user have different progress per brand?
- How does block_learning_state link to brand?

**Expected structure:**
```sql
CREATE TABLE tutorial_navigation_progress (
  user_id UUID,
  navigation_node_id TEXT,
  -- brand_id column? (VERIFY)
  -- ... progress fields
);

CREATE TABLE block_learning_state (
  user_id UUID,
  navigation_node_id TEXT,
  block_id TEXT,
  block_version TEXT,
  -- brand context inherited from navigation_node_id? (VERIFY)
  -- ... metrics fields
);
```

---

### 6. ILS and RSSB are Brand-Contextual

**Verification required:**
- How does ILS service know which brand's content was viewed?
- Does API route extract brand from session/URL?
- Does block_learning_state record store brand context?
- How does RSSB filter metrics by brand?

**Expected flow:**
```
User views RTH tutorial page
  ↓
ActiveBlockContext detects block
  ↓
BlockTelemetryProvider POST /api/tutorial/ils/block-visit
  ↓
API extracts brand from session/token
  ↓
ILS service records with brand context
  ↓
RSSB queries metrics filtered by brand
```

---

## Audit Checklist (Project AI Must Verify)

### Theme Resolution

- [ ] **Where is brand determined?**
  - File: `___`
  - Mechanism: `___` (URL param? Session? JWT?)
  - Evidence: `___`

- [ ] **Where is theme mapping stored?**
  - File: `___`
  - Structure: `___` (static config? database? service?)
  - RTH theme values: `___`
  - SUIA theme values: `___`

- [ ] **How does SSR page get theme?**
  - File: `___`
  - Function/hook: `___`
  - Evidence: `___`

- [ ] **How is theme passed to TutorialBlockRenderer?**
  - File: `___`
  - Prop chain: `Page → Renderer → Block`
  - Evidence: `___`

### D1 Block Implementation

- [ ] **Does D1 receive theme prop?**
  - File: `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx` (verify path)
  - Signature: `___`
  - Evidence: `___`

- [ ] **Does D1 use theme.primary/secondary?**
  - Locations in code: `___`
  - Hardcoded colors present? `___`
  - Evidence: `___`

- [ ] **Does D1 validate theme?**
  - Validation code: `___`
  - Error handling: `___`
  - Evidence: `___`

- [ ] **Test on RTH:**
  - URL: `___`
  - Visual colors match RTH brand? `___`
  - Console errors? `___`
  - Screenshot: `___`

- [ ] **Test on SUIA:**
  - URL: `___`
  - Visual colors match SUIA brand? `___`
  - Console errors? `___`
  - Screenshot: `___`

### C1 Block Implementation

- [ ] **Does C1 receive theme prop?**
  - File: `packages/ui/src/tutorial/blocks/CodeC1Block.tsx` (verify path)
  - Signature: `___`
  - Evidence: `___`

- [ ] **Does C1 use theme.primary/secondary?**
  - Locations in code: `___`
  - Hardcoded colors present? `___`
  - Evidence: `___`

- [ ] **Does C1 validate theme?**
  - Validation code: `___`
  - Error handling: `___`
  - Evidence: `___`

- [ ] **Test on RTH:**
  - URL: `___`
  - Visual colors match RTH brand? `___`
  - Console errors? `___`
  - Screenshot: `___`

- [ ] **Test on SUIA:**
  - URL: `___`
  - Visual colors match SUIA brand? `___`
  - Console errors? `___`
  - Screenshot: `___`

### Database Schema

- [ ] **tutorial_content has brand_id column?**
  - Schema file: `___`
  - Column definition: `___`
  - Unique constraint includes brand? `___`
  - Evidence: `___`

- [ ] **Same block exists for both brands?**
  - Query used: `___`
  - RTH record ID: `___`
  - SUIA record ID: `___`
  - Block JSON identical? `___`

- [ ] **tutorial_navigation_progress brand handling?**
  - Has brand_id column? `___`
  - Or brand inferred from navigation_node_id? `___`
  - Evidence: `___`

- [ ] **block_learning_state brand handling?**
  - Has brand_id column? `___`
  - Or brand inferred from navigation_node_id? `___`
  - Evidence: `___`

### ILS Integration

- [ ] **How does ILS API know brand?**
  - API route file: `___`
  - Brand extraction mechanism: `___`
  - Evidence: `___`

- [ ] **Does recordBlockVisit include brand?**
  - Service method signature: `___`
  - Brand parameter? `___`
  - Evidence: `___`

- [ ] **Is brand stored in block_learning_state?**
  - Column exists? `___`
  - Or inferred via navigation_node_id? `___`
  - Evidence: `___`

### RSSB Integration

- [ ] **How does RSSB filter by brand?**
  - Component file: `___`
  - Query/filter mechanism: `___`
  - Evidence: `___`

- [ ] **Can user see metrics for both brands?**
  - Expected: No (brand-isolated)
  - Actual: `___`
  - Evidence: `___`

### Composer Integration

- [ ] **Does Composer know about brands?**
  - Admin interface file: `___`
  - Brand selection UI? `___`
  - Evidence: `___`

- [ ] **Can Composer create content for specific brand?**
  - Mechanism: `___`
  - Evidence: `___`

- [ ] **Can same content be published to both brands?**
  - Mechanism: `___`
  - Creates duplicate records? `___`
  - Evidence: `___`

---

## Expected Findings

### If Multi-Brand Contract is Satisfied

✅ **Block JSON is brand-agnostic:**
- No brandId, theme, or color fields in block content
- Same block structure for RTH and SUIA

✅ **Theme resolved at runtime:**
- Brand determined from URL/session/JWT
- Theme mapping in config or service
- Theme passed as prop to blocks

✅ **D1 and C1 use theme prop:**
- Receive theme via BlockComponentProps
- Use theme.primary/secondary for colors
- No hardcoded hex values

✅ **Database stores brand in table column:**
- tutorial_content has brand_id column
- Unique constraint: (subtopic_id, navigation_node_id, brand_id)
- Same block JSON, different records per brand

✅ **ILS and RSSB are brand-contextual:**
- API extracts brand from session
- Metrics isolated per brand
- User progress separate per brand

✅ **Visual verification:**
- D1 on RTH shows RTH colors
- D1 on SUIA shows SUIA colors
- C1 on RTH shows RTH colors
- C1 on SUIA shows SUIA colors

### If Multi-Brand Contract is Violated

❌ **Brand in block JSON:**
- Block content contains brandId
- Block content contains theme colors
- Separate block versions per brand

❌ **Hardcoded colors:**
- D1/C1 use hex literals instead of theme prop
- Theme prop not received
- Theme not validated

❌ **Brand not in database:**
- tutorial_content lacks brand_id column
- Cannot store same content for multiple brands
- Brand logic in application code only

❌ **ILS/RSSB not brand-aware:**
- Metrics mixed across brands
- No brand isolation
- User sees combined progress

❌ **Visual mismatch:**
- D1 shows same colors on both brands
- C1 shows same colors on both brands
- Theme prop not applied

---

## Common Patterns to Look For

### Pattern 1: Static Config Theme Mapping
```typescript
// config/themes.ts
export const BRAND_THEMES = {
  'rth': {
    primary: '#3b82f6',
    secondary: '#0b1b3d',
  },
  'suia': {
    primary: '#10b981',
    secondary: '#1e293b',
  }
};
```

### Pattern 2: Database Theme Storage
```sql
SELECT theme_config 
FROM brands 
WHERE brand_id = 'rth';
```

### Pattern 3: SSR Brand Resolution
```typescript
// pages/tutorial/[slug].tsx
export async function getServerSideProps({ req, params }) {
  const brand = extractBrandFromRequest(req); // URL? Header? Session?
  const theme = getThemeForBrand(brand);
  return { props: { brand, theme } };
}
```

### Pattern 4: Theme Context Provider
```typescript
<ThemeProvider theme={theme}>
  <TutorialRenderer document={document} />
</ThemeProvider>
```

### Pattern 5: Direct Prop Passing
```typescript
<TutorialBlockRenderer 
  block={block} 
  theme={theme}  // Passed directly
/>
```

---

## Anti-Patterns to Flag

### ❌ Anti-Pattern 1: Brand in Block JSON
```json
{
  "type": "definition",
  "version": "D1",
  "content": {
    "page": {
      "brandId": "rth",  // WRONG!
      "title": "..."
    }
  }
}
```

### ❌ Anti-Pattern 2: Theme in Block JSON
```json
{
  "type": "definition",
  "content": {
    "page": {
      "theme": {  // WRONG!
        "primary": "#3b82f6"
      }
    }
  }
}
```

### ❌ Anti-Pattern 3: Hardcoded Colors
```typescript
// WRONG!
<h1 style={{ color: '#3b82f6' }}>
  {block.content.page.title}
</h1>
```

### ❌ Anti-Pattern 4: Brand-Specific Components
```typescript
// WRONG!
function DefinitionD1_RTH({ block }) { /* RTH version */ }
function DefinitionD1_SUIA({ block }) { /* SUIA version */ }
```

### ❌ Anti-Pattern 5: Runtime Brand Switching in Block
```typescript
// WRONG!
function DefinitionD1View({ block }) {
  const brand = useBrand(); // Block should not know about brand
  const color = brand === 'rth' ? '#3b82f6' : '#10b981';
  return <h1 style={{ color }}>{block.content.page.title}</h1>;
}
```

---

## Verification Deliverable

**Project AI must produce:** `docs/ubrc/MULTI-BRAND-AUDIT-REPORT-[DATE].md`

**Report must include:**

1. **Theme Resolution Evidence**
   - Actual files and line numbers
   - Brand determination mechanism
   - Theme mapping source
   - RTH theme values
   - SUIA theme values

2. **D1 Multi-Brand Evidence**
   - Component signature with theme prop
   - Theme usage locations
   - Visual verification (screenshots if possible)
   - Any hardcoded colors found

3. **C1 Multi-Brand Evidence**
   - Component signature with theme prop
   - Theme usage locations
   - Visual verification (screenshots if possible)
   - Any hardcoded colors found

4. **Database Schema Evidence**
   - tutorial_content structure
   - brand_id column presence
   - Unique constraints
   - Sample queries showing multi-brand storage

5. **ILS/RSSB Brand Context Evidence**
   - API brand extraction mechanism
   - Metrics isolation verification
   - Brand context in block_learning_state

6. **Violations Found**
   - Any anti-patterns discovered
   - Any contract violations
   - Recommendations for fixes

7. **Contract Satisfaction Assessment**
   - ✅ Satisfied / ❌ Violated / ⚠️ Partial
   - Evidence summary
   - Recommended actions

---

## Usage Instructions for Project AI

**Step 1:** Read this contract document completely

**Step 2:** Locate actual D1 and C1 implementation files (verify paths)

**Step 3:** Inspect theme prop handling in both blocks

**Step 4:** Find theme resolution mechanism in SSR pages

**Step 5:** Verify database schema has brand_id column

**Step 6:** Check ILS/RSSB brand context handling

**Step 7:** Test visual rendering on RTH and SUIA (if possible)

**Step 8:** Document all findings with file paths and line numbers

**Step 9:** Produce multi-brand audit report

**Step 10:** Report contract satisfaction status

**DO NOT:**
- Assume contract is satisfied without verification
- Implement changes before audit complete
- Create new multi-brand architecture
- Modify existing D1/C1 blocks during audit

**DO:**
- Verify every claim in this contract
- Document actual implementation
- Flag any violations found
- Provide evidence for all findings

---

## Success Criteria

**Audit is complete when:**
- [ ] All checklist items answered with evidence
- [ ] D1 theme handling documented
- [ ] C1 theme handling documented
- [ ] Database brand handling verified
- [ ] ILS brand context verified
- [ ] RSSB brand filtering verified
- [ ] Visual verification attempted (or documented why not possible)
- [ ] Contract satisfaction status determined
- [ ] Audit report produced

**Contract is satisfied when:**
- [ ] Block JSON is brand-agnostic (verified in database)
- [ ] Theme resolved at runtime (mechanism documented)
- [ ] D1 uses theme prop (code verified)
- [ ] C1 uses theme prop (code verified)
- [ ] No hardcoded colors in D1/C1 (grep verified)
- [ ] Database has brand_id in table column (schema verified)
- [ ] ILS API extracts brand (code verified)
- [ ] RSSB filters by brand (code verified)
- [ ] Visual rendering differs by brand (tested or documented)

---

**Document Status:** Investigation contract (verification required)  
**Next Action:** Project AI conducts audit and produces evidence report  
**Do NOT:** Implement or modify code until audit complete

---

**Created:** 2026-09-13  
**Purpose:** Guide project AI investigation of multi-brand theme architecture  
**Deliverable:** Multi-brand audit report with evidence
