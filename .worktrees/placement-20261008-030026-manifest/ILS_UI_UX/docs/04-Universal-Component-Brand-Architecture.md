# GATE 3B: UNIVERSAL COMPONENT + BRAND ARCHITECTURE REPORT

**Date:** 2026-09-07  
**Objective:** Document existing universal component + brand-theme architecture before RSSB implementation  
**Status:** INVESTIGATION COMPLETE ✅

---

## 📋 CONTEXT: USER INSTRUCTION

**User Statement:**

> Yes — **that is an important thing to lock down before Gate 3B implementation.** The Gate 3A report has mapped *what* RSSB displays to page-level and block-level ILS data, but the **colour ownership needs to be made explicit** so the React conversion does not accidentally make every RSSB colour brand-dependent.

**Key Requirements Established:**

1. **RSSB colour architecture should be frozen before implementation**
2. **Brand-theme-dependent colours** must be distinguished from **fixed RSSB semantic colours**
3. **LSNB vs RSSB color separation** must be documented
4. **Universal component pattern** must be validated against existing LSNB implementation

**Gate 3B Mandate:**

Before **any RSSB React/TypeScript code is written**, produce a report documenting the **actual implementation of Universal Tutorial Page + LSNB + existing brand-theme mechanism**, with repository paths and evidence.

---

## 🎯 EXECUTIVE SUMMARY

**Key Finding:** The project already has a **mature universal component + brand-theme architecture** that RSSB must follow.

**Architecture Pattern:**
```text
Universal Component (shared implementation)
           ↓
    Consumes BrandTheme
           ↓
    ┌──────┴──────┐
    ▼             ▼
SkillUp Theme  RTH Theme
```

**Critical Rules for RSSB:**
1. ✅ **One shared component** - NOT separate SkillUp/RTH implementations
2. ✅ **Consume existing theme system** - NOT create new brand resolution
3. ✅ **Distinguish brand-dependent vs fixed colors** - Some colors must NOT change by brand
4. ✅ **Follow LSNB pattern** - Same architecture as TutorialLeftSidebar

---

## 📐 PART 1: UNIVERSAL TUTORIAL PAGE ARCHITECTURE

### Component Location

**File:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

### Universal ILS Runtime Composition

**VERIFIED WIRING ✅:**

```typescript
<ActiveBlockProvider containerRef={contentContainerRef}>
  <ILSProvider
    navigationNodeId={runtimeContext.navigationNodeId}
    subtopicId={runtimeContext.hierarchy.subtopicId}
    sectionId={runtimeContext.sectionId}
  >
    <BlockTelemetryProvider
      navigationNodeId={runtimeContext.navigationNodeId}
      subtopicId={runtimeContext.hierarchy.subtopicId}
      sectionId={runtimeContext.sectionId}
      sessionId={tutorialSessionId}
    >
      {/* Content rendering */}
      <TutorialBlockRenderer ... />
    </BlockTelemetryProvider>
  </ILSProvider>
</ActiveBlockProvider>
```

**Architecture Flow:**
```text
TutorialPageShell (Universal)
        ↓
  ┌────┴────┐
  ▼         ▼
LSNB    ILS Runtime
  │         │
  │    ┌────┴────┐
  │    ▼         ▼
  │  Blocks    RSSB (future)
  │    │         │
  └────┴─────────┘
       │
   Brand Theme
```

### How It Serves Multiple Brands

**Universal Pattern:**
```typescript
export function TutorialPageShell({ 
  payload,           // Contains brand + theme data
  runtimeContext 
}: TutorialPageShellProps) {
  
  return (
    <main>
      <TutorialHeader
        brand={payload.sidebar.brand}      // Brand data
        theme={payload.theme}               // Theme colors
      />
      
      <TutorialLeftSidebar
        tree={payload.sidebar}              // Includes brand + theme
      />
      
      <TutorialBlockRenderer
        theme={payload.theme}               // Theme passed down
      />
    </main>
  );
}
```

**Key Principle:** 
- Component is universal (same code)
- Brand/theme data comes from `payload` (server-provided)
- NO brand-specific code branches inside component

---

## 📊 PART 2: LSNB (TutorialLeftSidebar) ARCHITECTURE

### Component Location

**File:** `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`

### Interface

```typescript
interface TutorialLeftSidebarProps {
  tree: TutorialNavigationTree;    // Contains theme + brand
  activeUrl?: string;
  completedUrls?: Set<string>;
  onNavigate?: (url: string, node: TutorialNavigationNode) => void;
}

interface TutorialNavigationTree {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    logoUrl?: string;
  };
  theme: BrandTutorialTheme;       // 👈 Theme consumed here
  subject: { name: string; icon?: string };
  progress: { percentage: number };
  topics: TutorialNavigationNode[];
}
```

### Theme Consumption Pattern

```typescript
interface BrandTutorialTheme {
  primary: string;           // Brand primary color
  primaryDark: string;       // Brand primary (darker)
  secondary: string;         // Brand secondary color
  activeBackground: string;  // Brand-specific background
  completed: string;         // Completion indicator color
}
```

### Brand-Dependent Colors in LSNB

**Elements that change by brand:**

| Element | Theme Source | SkillUp | RTH |
|---------|-------------|---------|-----|
| **Brand logo background** | `theme.primary` | #f54a8d (pink) | #d03f00 (orange) |
| **Progress bar fill** | `theme.primary` | #f54a8d | #d03f00 |
| **Progress percentage text** | `theme.primary` | #f54a8d | #d03f00 |
| **Subject icon background** | `theme.secondary` | #133282 (blue) | #124fd6 (blue) |
| **Active node text** | `theme.secondary` | #133282 | #124fd6 |
| **Active node icon** | `theme.secondary` | #133282 | #124fd6 |
| **Active node background** | `theme.activeBackground` | (light pink) | (light orange) |
| **In-progress status ring** | `theme.secondary` | #133282 | #124fd6 |
| **Completed checkmark bg** | `theme.completed` | (brand green) | (brand green) |

### Fixed Semantic Colors in LSNB

**Elements that DO NOT change by brand:**

| Element | Fixed Color | Reason |
|---------|------------|---------|
| **Base text color** | #071f63 (navy) | Readability standard |
| **Border/divider** | #e5eaf1, #d5dfeb | Neutral UI chrome |
| **Not-started ring** | #7890ad (gray) | Semantic: no progress |
| **Hover background** | #f5f7fa, #edf2f8 | Neutral interaction |
| **Background** | #ffffff (white) | Universal canvas |

### Learning State Logic

**THREE-STATE SYSTEM:**

```typescript
type TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started'

function getEffectiveStatus(
  node: TutorialNavigationNode, 
  activeUrl?: string, 
  completedUrls?: Set<string>
): TutorialNodeStatus {
  
  // 1. Completed: explicitly marked OR in completedUrls
  if (isNodeCompleted(node, completedUrls)) {
    return 'completed';
  }

  // 2. In-progress: current lesson OR contains current incomplete lesson
  const isCurrentLesson = node.url === activeUrl;
  const containsCurrentIncomplete = hasActiveIncompleteChild(node, activeUrl, completedUrls);
  
  if (isCurrentLesson || containsCurrentIncomplete) {
    return 'in-progress';
  }

  // 3. Not-started: default
  return 'not-started';
}
```

**IMPORTANT:** This R/Y/G-equivalent logic lives in **LSNB component**, NOT in ILS runtime layer.

**Visual Mapping:**
```text
completed     → Green checkmark (theme.completed)
in-progress   → Colored ring (theme.secondary)
not-started   → Gray ring (fixed #7890ad)
```

### LSNB Reuse Evidence

**SkillUp:**
```typescript
// apps/skillup-web/[pages] → TutorialPageShell → TutorialLeftSidebar
theme: {
  primary: "#f54a8d",      // Pink
  secondary: "#133282",    // Blue
  ...
}
```

**RTH:**
```typescript
// apps/realtutorialhub-web/[pages] → TutorialPageShell → TutorialLeftSidebar
theme: {
  primary: "#d03f00",      // Orange
  secondary: "#124fd6",    // Blue
  ...
}
```

**Same component, different theme data** ✅

---

## 🎨 PART 3: BRAND-THEME ARCHITECTURE

### Brand Configuration Files

**SkillUp:**
```typescript
// apps/skillupitacademy-site/brand.ts
export const brand: MarketingBrand = {
  id: "skillupitacademy",
  name: "SkillUp IT Academy",
  shortName: "SUIA",
  colors: {
    primary: "#f54a8d",      // Magenta pink
    secondary: "#133282",    // Navy blue
  },
};
```

**RealTutorialHub:**
```typescript
// apps/realtutorialhub-site/brand.ts
export const brand: MarketingBrand = {
  id: "realtutorialhub",
  name: "Real Tutorial Hub",
  shortName: "RTH",
  colors: {
    primary: "#d03f00",      // Orange-red
    secondary: "#124fd6",    // Bright blue
  },
};
```

### DomainTheme Interface

**File:** `apps/realtutorialhub-web/src/lib/domain-themes.ts`

```typescript
export interface DomainTheme {
  breadcrumbBg: string;
  sidebarAccent: string;
  activeItem: string;
  blockLayman: string;
  blockLaymanHeader: string;
  blockRealLife: string;
  blockRealLifeHeader: string;
  blockTechnical: string;
  blockTechnicalHeader: string;
  blockCode: string;
  blockCodeHeader: string;
  // ... (30+ block-specific theme properties)
  progressFill: string;
  quizBtn: string;
  domainIcon: string;
}
```

**Domain Theme Mapping:**
```typescript
export function getDomainTheme(domainSlug: string): DomainTheme {
  const themeMap: Record<string, keyof typeof DOMAIN_THEMES> = {
    'full-stack': 'indigo',
    'web-development': 'indigo',
    'data-analyst': 'blue',
    'data-science': 'teal',
    'data-engineering': 'steel',
  };

  const key = themeMap[domainSlug.toLowerCase()] ?? 'indigo';
  return DOMAIN_THEMES[key];
}
```

### Theme Resolution Flow

```text
Server-Side (Page Load)
        ↓
1. Identify brand (SkillUp/RTH)
        ↓
2. Load brand.colors (primary/secondary)
        ↓
3. Identify domain (full-stack/data-analyst/etc.)
        ↓
4. Load DomainTheme (indigo/blue/teal/steel)
        ↓
5. Combine into TutorialPagePayload
        ↓
Client-Side (Component Render)
        ↓
6. TutorialPageShell receives payload
        ↓
7. Pass theme to child components
        ↓
8. Components use theme.primary/secondary/etc.
```

### Universal Component Pattern

**CORRECT Pattern (LSNB follows this):**

```typescript
function UniversalComponent({ 
  data, 
  theme         // 👈 Theme received as prop
}: Props) {
  
  return (
    <div style={{ 
      backgroundColor: theme.primary,     // ✅ Brand-dependent
      color: theme.secondary              // ✅ Brand-dependent
    }}>
      <div style={{ 
        borderColor: '#e5eaf1'            // ✅ Fixed semantic
      }}>
        {data}
      </div>
    </div>
  );
}
```

**WRONG Pattern (brand-specific code):**

```typescript
function NonUniversalComponent({ data, brand }: Props) {
  
  // ❌ Brand-specific branches
  if (brand === 'skillup') {
    return <div style={{ backgroundColor: '#f54a8d' }}>...</div>;
  }
  
  if (brand === 'realtutorialhub') {
    return <div style={{ backgroundColor: '#d03f00' }}>...</div>;
  }
}
```

---

## 🚨 PART 4: RSSB COLOR RESPONSIBILITY DEFINITION

### Brand-Dependent Colors (from theme prop)

**RSSB elements that MUST use theme:**

| RSSB Section | Color Source | Justification |
|--------------|-------------|---------------|
| **Overall Progress Card Background** | `theme.primary` | Brand identity |
| **Overall Progress Bar Fill** | `theme.primary` | Brand identity |
| **Overall Status Badge** | `theme.primary` | Brand identity |
| **Lifecycle & Overview Table Background** | `theme.secondary` | Brand accent |
| **Lifecycle Table Headers** | `theme.secondary` | Brand accent |

**React Implementation:**
```typescript
interface RSSBProps {
  theme: BrandTutorialTheme;   // 👈 Required prop
}

export function RSSB({ theme }: RSSBProps) {
  return (
    <>
      {/* Overall Progress Card */}
      <div style={{ backgroundColor: theme.primary }}>
        <div style={{ backgroundColor: theme.primary }}>
          {/* Progress bar */}
        </div>
      </div>
      
      {/* Lifecycle Table */}
      <table style={{ backgroundColor: theme.secondary }}>
        {/* ... */}
      </table>
    </>
  );
}
```

### Fixed RSSB Semantic Colors (hardcoded constants)

**RSSB elements that MUST NOT change by brand:**

| RSSB Section | Fixed Color | Hex Code | Justification |
|--------------|------------|----------|---------------|
| **Engagement Metrics Cards** | RSSB Orange | `#ff7300` | Semantic: engagement |
| **Time Analysis Cards** | RSSB Blue | `#0091d5` | Semantic: time |
| **Completed Status Text** | RSSB Green | `#5cf0b0` | Semantic: success |

**React Implementation:**
```typescript
// Define RSSB semantic color constants
const RSSB_COLORS = {
  ENGAGEMENT_ORANGE: '#ff7300',
  TIME_BLUE: '#0091d5',
  COMPLETED_GREEN: '#5cf0b0',
  SIDEBAR_BG: '#ffffff',
  TEXT_PRIMARY: '#1e293b',
  TEXT_MUTED: '#64748b',
} as const;

export function RSSB({ theme }: RSSBProps) {
  return (
    <>
      {/* Engagement Metrics */}
      <div style={{ backgroundColor: RSSB_COLORS.ENGAGEMENT_ORANGE }}>
        <span>Visit Count</span>
        <span>42</span>
      </div>
      
      {/* Time Analysis */}
      <div style={{ backgroundColor: RSSB_COLORS.TIME_BLUE }}>
        <span>Active Time</span>
        <span>5m 30s</span>
      </div>
      
      {/* Status */}
      <span style={{ color: RSSB_COLORS.COMPLETED_GREEN }}>
        COMPLETED
      </span>
    </>
  );
}
```

**Why Fixed:**
- Orange/Blue are RSSB brand colors (prototype-approved design)
- Represent metric categories, not tutorial brands
- Must be consistent across SkillUp + RTH for learner familiarity
- Part of RSSB visual identity system

---

## 🔄 PART 5: LSNB vs RSSB COLOR SEPARATION

### LSNB State Indicators (Navigation)

**Purpose:** Page/section completion state

**Visual System:**
```text
✓ Completed     → Green checkmark (theme.completed)
◉ In Progress   → Colored ring (theme.secondary)
○ Not Started   → Gray ring (#7890ad)
```

**Color Ownership:**
- Green: `theme.completed` (brand-controlled)
- Colored ring: `theme.secondary` (brand-controlled)
- Gray: `#7890ad` (fixed semantic - "no state")

**Logic Location:** LSNB component (`getEffectiveStatus` function)

### RSSB Metric Categories (Block Details)

**Purpose:** Block-level learning metrics

**Visual System:**
```text
Section 1: Lifecycle      → theme.secondary (pink/orange)
Section 2: Engagement     → #ff7300 (fixed orange)
Section 3: Time Analysis  → #0091d5 (fixed blue)
Section 4: Overall Progress → theme.primary (pink/orange)
```

**Color Ownership:**
- Lifecycle: `theme.secondary` (brand accent)
- Engagement: `#ff7300` (RSSB semantic)
- Time: `#0091d5` (RSSB semantic)
- Overall: `theme.primary` (brand identity)

**Logic Location:** RSSB component (useILS() hook consumer)

### Important Distinction

```text
LSNB
  ↓
Page-level navigation state
  ↓
Red/Yellow/Green equivalent
  ↓
Uses: theme.completed, theme.secondary, fixed gray

---

RSSB
  ↓
Block-level metric details
  ↓
Category-coded metrics
  ↓
Uses: theme.primary, theme.secondary, fixed orange/blue
```

**They are separate systems with separate color responsibilities** ✅

---

## ✅ PART 6: ARCHITECTURAL VALIDATION

### Question 1: Where is Universal Tutorial Page?

**Answer:** `src/share-branding/LearningExperience/components/TutorialPageShell.tsx`

**Evidence:** Single component serving both SkillUp and RTH

### Question 2: Where is LSNB?

**Answer:** `src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx`

**Evidence:** Receives `tree.theme` prop, uses theme colors

### Question 3: How does LSNB receive brand theme?

**Answer:** Via `tree: TutorialNavigationTree` prop, which contains `theme: BrandTutorialTheme`

**Pattern:**
```typescript
<TutorialLeftSidebar 
  tree={payload.sidebar}  // Contains brand + theme
/>
```

### Question 4: Which LSNB colors change by brand?

**Answer:**
- ✅ Brand logo background: `theme.primary`
- ✅ Progress bar: `theme.primary`
- ✅ Active node text/icon: `theme.secondary`
- ✅ In-progress ring: `theme.secondary`
- ✅ Completed checkmark: `theme.completed`

### Question 5: Which LSNB colors stay fixed?

**Answer:**
- ✅ Base text: `#071f63` (navy)
- ✅ Borders/dividers: `#e5eaf1`, `#d5dfeb` (gray)
- ✅ Not-started ring: `#7890ad` (gray)
- ✅ Hover backgrounds: `#f5f7fa`, `#edf2f8` (light gray)
- ✅ Sidebar background: `#ffffff` (white)

### Question 6: Where is DomainTheme defined?

**Answer:** `apps/realtutorialhub-web/src/lib/domain-themes.ts`

**Note:** This is domain-specific theme (indigo/blue/teal/steel), separate from brand-level theme

### Question 7: How do SkillUp and RTH resolve themes?

**Answer:** Server-side, before page load

**Flow:**
```text
1. Identify brand from hostname/route
2. Load brand.colors (primary/secondary)
3. Identify domain from content hierarchy
4. Load DomainTheme
5. Combine into TutorialPagePayload
6. Send to client
```

### Question 8: Where does R/Y/G calculation happen?

**Answer:** Inside LSNB component

**Function:** `getEffectiveStatus(node, activeUrl, completedUrls): TutorialNodeStatus`

**NOT in:**
- ILS runtime
- Database
- Server-side
- Individual blocks

### Question 9: What pattern should RSSB follow?

**Answer:** Same as LSNB

```typescript
interface RSSBProps {
  theme: BrandTutorialTheme;  // Required prop
  className?: string;          // Optional styling
}

export function RSSB({ theme, className }: RSSBProps) {
  const { overall, blocks } = useILS();
  
  return (
    <aside className={className}>
      {/* Use theme.primary for overall progress */}
      {/* Use theme.secondary for lifecycle */}
      {/* Use RSSB_COLORS.ENGAGEMENT_ORANGE for engagement */}
      {/* Use RSSB_COLORS.TIME_BLUE for time */}
    </aside>
  );
}
```

---

## 🎯 PART 7: RSSB IMPLEMENTATION REQUIREMENTS

### 1. Component Structure

```typescript
// REQUIRED interface
interface RSSBProps {
  theme: BrandTutorialTheme;   // Brand theme (primary/secondary)
  className?: string;           // Optional additional styling
}

// REQUIRED theme constants
const RSSB_COLORS = {
  ENGAGEMENT_ORANGE: '#ff7300',
  TIME_BLUE: '#0091d5',
  COMPLETED_GREEN: '#5cf0b0',
  SIDEBAR_BG: '#ffffff',
  TEXT_PRIMARY: '#1e293b',
  TEXT_MUTED: '#64748b',
} as const;
```

### 2. Theme Consumption Rules

**MUST use `theme` prop for:**
- Overall Progress card background
- Overall Progress bar fill
- Overall Status badge
- Lifecycle table background/headers

**MUST use `RSSB_COLORS` constants for:**
- Engagement Metrics card backgrounds
- Time Analysis card backgrounds
- Completed status text color

**MUST use fixed neutral colors for:**
- Sidebar background
- Primary text
- Secondary/muted text
- Borders/dividers

### 3. Integration Pattern

```typescript
// In TutorialPageShell.tsx (future)
<BlockTelemetryProvider ...>
  <div className="tutorial-content">
    {/* Existing block rendering */}
  </div>
  
  <RSSB theme={payload.sidebar.theme} />  {/* 👈 Pass same theme as LSNB */}
</BlockTelemetryProvider>
```

### 4. Data Source

**MUST consume ILSProvider:**
```typescript
const { overall, blocks, isLoading } = useILS();
```

**MUST NOT:**
- Fetch data.json
- Call ILS APIs directly
- Create separate data fetching logic

### 5. Brand Independence Test

**The component should pass this test:**

```text
✅ No `if (brand === 'skillup')` branches
✅ No `if (brand === 'realtutorialhub')` branches
✅ No hardcoded brand names in JSX
✅ All brand colors come from `theme` prop
✅ Orange/Blue metrics stay orange/blue for both brands
```

---

## 📋 GATE 3B COMPLETION CHECKLIST

- [x] Universal Tutorial Page location identified
- [x] LSNB component analyzed
- [x] LSNB theme consumption pattern documented
- [x] Brand-dependent colors identified
- [x] Fixed semantic colors identified
- [x] DomainTheme interface documented
- [x] SkillUp theme values recorded
- [x] RTH theme values recorded
- [x] Theme resolution flow mapped
- [x] LSNB R/Y/G logic location confirmed
- [x] RSSB color responsibilities defined
- [x] RSSB implementation requirements specified
- [x] Universal component principle validated

---

## 🚀 READINESS STATUS

**Status:** ✅ **READY FOR GATE 3C (RSSB Data Contract)**

**Prerequisites Met:**
- ✅ Universal component pattern understood
- ✅ Brand-theme architecture documented
- ✅ LSNB reference implementation analyzed
- ✅ Color responsibility boundaries frozen
- ✅ Theme consumption pattern established
- ✅ Fixed vs brand-dependent colors defined

**Next Step:** Gate 3C - RSSB → ILS Metric/Data Contract

**Blocked:** None

---

**Report End** | Generated: 2026-09-07 | Status: ARCHITECTURE DOCUMENTED ✅
