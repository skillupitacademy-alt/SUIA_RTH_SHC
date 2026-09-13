# Definition Block Version Architecture

**Status**: Reference Architecture (Final)  
**Version**: 1.3  
**Created**: 2026-08-19  
**Last Updated**: 2026-08-19  
**Purpose**: Define the version-aware architecture for Definition Block (D1-D6) as the **locked reference pattern** for all 18 Tutorial Blocks

---

## Executive Summary

This specification establishes the **Definition Block Version Architecture**, which enables one independently developed `DefinitionBlock` component to support **six pedagogical presentation versions** (D1-D6) while remaining compatible with:

- Universal JSONB `TutorialDocument` model
- Centralized block registry
- Independent React rendering
- System-controlled hierarchy (ID-based, document-level only)
- Runtime brand/theme resolution
- Presentation boundary enforcement (block-layout only, no brand data)

**Definition Block serves as the reference implementation** for the remaining 17 blocks (**137 total presentation versions** across the Tutorial Engine).

**Current Status**: Architecture locked. D1 is the initial implementation version. D2-D6 are extensible through the same version-driven architecture without requiring separate composers or architectural changes.

**Version Nomenclature**: Each block type uses its own version namespace (D1-D6 for Definition, I1-I6 for Introduction, C1-C10 for Code, etc.) to eliminate ambiguity.

---

## 1. Architectural Context

### 1.1 Tutorial Engine Block Architecture

The Tutorial Engine implements a **composable-block architecture**:

```
JSON → Validation → JSONB → Delivery → Renderer
```

**Key Principles**:
- ✅ One JSONB document model (`tutorial_content.content`)
- ✅ One centralized block registry
- ✅ Independent block components (no cross-dependencies)
- ✅ NO separate database table per block type
- ✅ Brand/theme applied at runtime, not in JSON

### 1.2 The 18-Block System

The Tutorial Engine will support **18 independent block types** with **137 total presentation versions**:

| # | Block Type | Versions | Range | Purpose |
|---|------------|----------|-------|---------|
| 1 | IntroductionBlock | 6 | I1-I6 | Context & orientation |
| 2 | ObjectiveBlock | 5 | O1-O5 | Learning goals |
| **3** | **DefinitionBlock** | **6** | **D1-D6** | **Concept explanation** ← THIS SPEC |
| 4 | CodeBlock | 10 | C1-C10 | Code teaching |
| 5 | VisualBlock | 10 | V1-V10 | Visual learning |
| 6 | ComparisonBlock | 8 | CP1-CP8 | Compare/decide |
| 7 | ExecutionBlock | 8 | E1-E8 | Runtime behavior |
| 8 | MemoryBlock | 8 | M1-M8 | Memory/internal model |
| 9 | MistakeBlock | 8 | MT1-MT8 | Errors/debugging |
| 10 | BestPracticeBlock | 7 | BP1-BP7 | Coding practices |
| 11 | SummaryBlock | 6 | S1-S6 | Revision |
| 12 | QuestionBlock | 8 | Q1-Q8 | Concept checking |
| 13 | ExerciseBlock | 8 | EX1-EX8 | Guided practice |
| 14 | TaskBlock | 8 | T1-T8 | Practical application |
| 15 | InteractiveBlock | 6 | INT1-INT6 | Hands-on learning |
| 16 | QuizBlock | 8 | QZ1-QZ8 | Assessment |
| 17 | InterviewBlock | 7 | IV1-IV7 | Interview preparation |
| 18 | ProjectBlock | 8 | P1-P8 | Real-world application |
| | **TOTAL** | **137** | | |

**Definition Block is Block #3 with 6 versions (D1-D6)**.

**Version Naming Convention**: Each block type has its own version namespace scoped to the block type. This eliminates ambiguity (e.g., Introduction I1 vs Definition D1 are clearly different).

### 1.3 Existing Definition Block Audit Status

The Definition Block has been **audited against the Tutorial Component Architecture blueprint** (Audit Score: **171/200**).

**✅ Strengths**:
- Pure rendering component (zero brand logic)
- Fully JSON-driven with strong TypeScript contracts
- Block registry integration (scalable pattern)
- Theme-independent (Tailwind utility classes)
- SSR-compatible (no "use client" directive)
- Semantic HTML (`dl/dt/dd`)
- Zero database/infrastructure dependencies
- XSS-safe

**❌ Gaps (P1/P2)**:
- Not integrated into Tutorial V2 production page (still uses legacy `TutorialDefinitionContent`)
- No dedicated integration tests for edge cases
- Missing explicit ARIA attributes
- No block-level error boundary isolation
- Unused `theme` prop

**Current Status**: Definition Block demonstrates **correct architectural patterns** but requires version-awareness and production integration.

---

## 2. Definition Block Versions (D1-D6)

### 2.1 Version Registry

```typescript
export const DEFINITION_VERSION_REGISTRY = {
  D1: {
    id: "D1",
    label: "Simple Orientation",
    status: "active",
    description: "Basic concept introduction with fundamental elements",
    elements: [
      "title",
      "intro",
      "definition",
      "explanation",
      "example",
      "characteristics",
      "takeaway"
    ],
    requiredElements: [
      "title",
      "intro",
      "definition",
      "explanation",
      "takeaway"
    ]
  },
  
  D2: {
    id: "D2",
    label: "Motivation through Problem/Need",
    status: "planned",
    description: "Definition introduced through a problem or need",
    elements: [],
    requiredElements: []
  },
  
  D3: {
    id: "D3",
    label: "What → Why → Where",
    status: "planned",
    description: "Definition with context and application",
    elements: [],
    requiredElements: []
  },
  
  D4: {
    id: "D4",
    label: "Context → Roadmap",
    status: "planned",
    description: "Definition with learning roadmap",
    elements: [],
    requiredElements: []
  },
  
  D5: {
    id: "D5",
    label: "Real-world Situation → Requirement → Concept",
    status: "planned",
    description: "Definition from real-world scenario",
    elements: [],
    requiredElements: []
  },
  
  D6: {
    id: "D6",
    label: "Complete Lesson Orientation",
    status: "planned",
    description: "Comprehensive definition with all elements",
    elements: [],
    requiredElements: []
  }
} as const;
```

**Note**: D2-D6 element lists are intentionally empty at this stage. Each version's pedagogical contract will be designed separately as we implement that version. **Do not prematurely invent their JSON contracts.**

### 2.2 D1 Version (Implementation Priority)

**D1 (Simple Orientation)** is the first version to be implemented, serving as the reference pattern for all future versions and blocks.

**D1 Content Contract**:
```typescript
interface DefinitionD1Content {
  title: string;              // Required: What is being defined
  intro: string;              // Required: Brief introduction
  definition: string;         // Required: Core definition
  explanation: RichText;      // Required: Detailed explanation (see note below)
  example?: ExampleContent;   // Optional: Concrete example
  characteristics?: string[]; // Optional: Key characteristics list
  takeaway: string;           // Required: Key takeaway message
}
```

**Important Notes**:
1. The `category` field has been **removed** from the content model. Category labels are derived from system-controlled hierarchy at runtime, not authored as free-text fields.
2. `RichText` uses the **platform's existing rich-text contract**, which will be explicitly defined in the Technical Design. Definition Block does not invent its own rich-text structure.
3. The exact schema for `ExampleContent` will be defined in Technical Design based on D1 requirements.

### 2.3 Version Contract Display

The composer UI displays the **version contract** to authors:

```
Version: D1 — Simple Orientation

┌─────────────────────────────────────────────────┐
│ Element              │ Required │ Type           │
├─────────────────────────────────────────────────┤
│ Title                │ Yes      │ String         │
│ Introduction         │ Yes      │ Text           │
│ Definition           │ Yes      │ Text           │
│ Explanation          │ Yes      │ Rich Text      │
│ Example              │ Optional │ Object         │
│ Characteristics      │ Optional │ String Array   │
│ Key Takeaway         │ Yes      │ Text           │
└─────────────────────────────────────────────────┘
```

**Note**: `Category` is NOT an author-editable field. It is derived from system-controlled hierarchy.

---

## 3. Core Architectural Principles

### 3.1 One Composer, Not Six

**❌ WRONG APPROACH**:
```
DefinitionI1Composer.tsx
DefinitionI2Composer.tsx
DefinitionI3Composer.tsx
...
```

**✅ CORRECT APPROACH**:
```typescript
// ONE composer with version-driven configuration
<DefinitionBlockComposer version="I1" />
```

The selected version drives:
- Field display
- Validation rules
- UI layout
- Element requirements

### 3.2 One Version Dropdown

The composer UI has **one version selector**:

```
Definition Version
┌──────────────────────────────────┐
│ D1 — Simple Orientation       ▼ │
└──────────────────────────────────┘
```

**Initial State**: Only D1 is active and implemented.  
**Future State**: D1-D6 dropdown (as each version is designed and implemented).  
**Long-term Expansion**: If additional versions are needed beyond D6, they become D7, D8, etc. The D-series nomenclature is permanent and scoped to DefinitionBlock.

### 3.3 System-Controlled Hierarchy

**CRITICAL REQUIREMENT**: Hierarchy metadata is **system-controlled**, not author-editable.

**❌ WRONG** (hierarchy in author-editable JSON):
```json
{
  "category": "Python Fundamentals",  // ← Author can mismatch
  "title": "What Is Java?"
}
```

**✅ CORRECT** (hierarchy is system metadata):
```typescript
// System knows (ID-based):
const hierarchyMetadata = {
  domainId: "uuid-domain",
  subjectId: "uuid-subject",
  topicId: "uuid-topic",
  subtopicId: "uuid-subtopic"
};

// Names resolved at runtime:
const resolvedHierarchy = {
  domain: "Full Stack Development",
  subject: "Backend Development",
  topic: "Java",
  subtopic: "What is Java?"
};

// Author supplies ONLY content:
const content = {
  title: "What Is Java?",
  intro: "...",
  definition: "...",
  explanation: [],
  example: {},
  characteristics: [],
  takeaway: "..."
};
```

**Hierarchy sources**:
1. URL route parameters
2. Database subtopic record
3. Admin selection context

**Prevention**: Composer generates hierarchy metadata from IDs; author **cannot** accidentally create Java content with Python hierarchy.

**Runtime Labels**: If the UI needs to display a category label like "Java Fundamentals", it is derived from `topicId` resolution, not free-text author input.

### 3.4 The Three-Layer Model

**CRITICAL ARCHITECTURE**: This specification defines three distinct layers that apply to all 18 blocks:

#### Layer A: Author Content
What the author writes (content only, no metadata):

```json
{
  "title": "What Is a Variable?",
  "intro": "Variables are fundamental building blocks...",
  "definition": "A variable is a named storage location...",
  "explanation": ["Variables store data", "..."],
  "example": {
    "code": "x = 5",
    "explanation": "This creates a variable named x"
  },
  "characteristics": [
    "Has a name",
    "Stores a value",
    "Can be reassigned"
  ],
  "takeaway": "Variables let you store and reuse data."
}
```

#### Layer B: Canonical Document
What the platform stores (adds type, version, hierarchy):

```json
{
  "schemaVersion": 1,
  "metadata": {
    "subtopicId": "uuid-subtopic",
    "domainId": "uuid-domain",
    "subjectId": "uuid-subject",
    "topicId": "uuid-topic",
    "createdAt": "2026-08-19T10:00:00Z",
    "updatedAt": "2026-08-19T10:00:00Z"
  },
  "blocks": [
    {
      "id": "def-001",
      "type": "definition",
      "version": "I1",
      "content": {
        "title": "What Is a Variable?",
        "intro": "...",
        "definition": "...",
        "explanation": [],
        "example": {},
        "characteristics": [],
        "takeaway": "..."
      },
      "presentation": {
        "density": "comfortable",
        "layout": "standard"
      }
    }
  ]
}
```

**Critical Hierarchy Rule**: Individual blocks MUST NOT carry their own hierarchy metadata. Hierarchy exists only at the document level (`metadata`). This ensures all blocks in a document belong to the same system-controlled tutorial context.

#### Layer C: Runtime Presentation
What the learner sees (adds brand, theme, navigation):

```
┌─────────────────────────────────────────────┐
│ [SUIA Logo]  Full Stack > Python > ...     │  ← Brand + Theme
├─────────────────────────────────────────────┤
│ ┌─────┐                                     │
│ │ Nav │  ┌──────────────────────────────┐  │
│ │     │  │ 📖 What Is a Variable?       │  │  ← DefinitionBlock
│ │     │  │                              │  │
│ │     │  │ Variables are fundamental... │  │
│ │     │  └──────────────────────────────┘  │
│ └─────┘                                     │
└─────────────────────────────────────────────┘
```

**Flow**:
```
AUTHOR writes content
  ↓
SYSTEM adds type + version + hierarchy IDs
  ↓
CANONICAL DOCUMENT stored in JSONB
  ↓
RUNTIME adds brand + theme + navigation
  ↓
LEARNER sees complete page
```

**This three-layer separation is the core architectural pattern for all 18 blocks.**

---

## 4. Version Disambiguation

### 4.1 Three Separate Concepts

| Concept | Field | Meaning | Scope |
|---------|-------|---------|-------|
| **Document Schema Version** | `schemaVersion: 1` | How the overall Tutorial JSON structure is interpreted | TutorialDocument |
| **Definition Version** | `version: "I1"` | Which pedagogical Definition Block structure is being used | DefinitionBlock |
| **Database Revision** | `tutorial_content.version: 7` | Which saved revision of this content exists | PostgreSQL row |

**CRITICAL**: These are **three different version concepts** and must **never be conflated**.

### 4.2 Version Evolution Path

```
Current State (Implicit, no version identifier)
  ↓
D1 (Explicit Version, active implementation)
  ↓
D2 (Design + implement when needed)
  ↓
D3 (Design + implement when needed)
  ↓
D4 (Design + implement when needed)
  ↓
D5 (Design + implement when needed)
  ↓
D6 (Design + implement when needed)
  ↓
D7, D8, ... (If additional versions needed in future)
```

**Rationale**: Definition Block uses **D-series nomenclature permanently**, scoped to the DefinitionBlock type. The version identifier describes the pedagogical contract, not a temporary naming scheme. If additional versions are needed beyond D6, they become D7, D8, etc.

**Implementation Order**: D1 must pass the qualification gate and become the locked reference pattern before D2-D6 are designed.

---

## 5. Database Architecture

### 5.1 JSONB Document Model (CORRECT)

**✅ USE EXISTING**:
```sql
tutorial_content
  ├── subtopic_id
  ├── difficulty
  ├── content_type
  └── content (JSONB)  ← Stores TutorialDocument with blocks[]
```

**Storage**:
```
tutorial_content.content (JSONB)
  │
  └── TutorialDocument
        │
        ├── Definition I1
        ├── Code C4
        ├── Visual V5
        ├── BestPractice BP3
        ├── Interview IV6
        └── ...
```

### 5.2 DO NOT Create Separate Tables

**❌ WRONG**:
```sql
definition_blocks      ← NO
definition_i1          ← NO
definition_i2          ← NO
definition_versions    ← NO
```

**Rationale**: The existing audit **explicitly concluded** that separate Definition tables are **architecturally incorrect**. The unified JSONB document model is designed to accommodate 18+ blocks without schema changes.

---

## 6. Brand Independence & Presentation Boundary

### 6.1 Zero Brand Data in JSON

**❌ FORBIDDEN IN JSON**:
```json
{
  "brand": "SUIA",
  "primaryColor": "#f54a8d",
  "theme": "skillup",
  "brandLogo": "/assets/suia-logo.png"
}
```

**✅ CORRECT SEPARATION**:
```
URL (user.skillupitacademy.com)
  ↓
Brand Resolution (SUIA)
  ↓
Runtime Theme (Tailwind theme-suia)
  ↓
Tutorial Page Shell
  ↓
DefinitionBlock (brand-agnostic)
```

### 6.2 Presentation Boundary (Block-Layout Configuration Only)

The `presentation` field in blocks is for **block-layout configuration only**. It MUST NOT contain brand-related data.

**❌ FORBIDDEN in `presentation`**:
```json
{
  "presentation": {
    "brand": "SUIA",
    "brandId": "uuid",
    "theme": "skillup",
    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D",
    "logo": "/assets/logo.png",
    "brandAssets": {},
    "brandTypography": {}
  }
}
```

**✅ ALLOWED in `presentation`**:
```json
{
  "presentation": {
    "density": "comfortable",
    "layout": "standard",
    "spacing": "default",
    "emphasis": "balanced"
  }
}
```

**Rule**: `presentation` configures how a block is laid out, not what brand style it uses. Brand remains runtime-controlled.

### 6.3 Brand Resolution Flow

```typescript
// 1. URL determines brand
const brand = resolveBrandFromURL(request.url);
// → "SUIA" or "RTH"

// 2. Load brand theme
const theme = getBrandTheme(brand);
// → { primary: "#f54a8d", ... }

// 3. Pass to shell, NOT to blocks
<TutorialPageShell theme={theme}>
  <DefinitionBlock block={data} />  {/* NO theme prop */}
</TutorialPageShell>
```

**Existing Audit Finding**: Definition Block currently receives unused `theme` prop. This should be **removed** as part of production integration.

**This presentation boundary applies to all 18 blocks.**

---

## 7. Composer Architecture

### 7.1 Definition Block Composer Components

```
DefinitionBlockComposer/
  ├── DefinitionComposerShell.tsx        ← Main container
  ├── VersionSelector.tsx                ← Version dropdown (I1-I6)
  ├── HierarchyDisplay.tsx               ← Read-only hierarchy
  ├── VersionContractDisplay.tsx         ← Shows required elements
  ├── ContentEditor.tsx                  ← Version-driven fields
  ├── PreviewPane.tsx                    ← Live preview
  └── validation/
      ├── i1.schema.ts                   ← I1 validation
      ├── i2.schema.ts                   ← I2 validation (future)
      └── ...
```

### 7.2 Version-Driven Field Generation

```typescript
function ContentEditor({ version }: { version: DefinitionVersion }) {
  const versionConfig = DEFINITION_VERSION_REGISTRY[version];
  
  if (!versionConfig) {
    throw new Error(`Unknown version: ${version}`);
  }
  
  return (
    <div className="space-y-4">
      {versionConfig.elements.map(element => {
        const isRequired = versionConfig.requiredElements.includes(element);
        return (
          <FieldRenderer
            key={element}
            field={element}
            required={isRequired}
            type={getFieldType(element)}
            label={getFieldLabel(element)}
          />
        );
      })}
    </div>
  );
}
```

**Key Point**: Fields are **generated from version configuration**, not hard-coded. The registry's `requiredElements` array determines which fields are mandatory.

**Composer UI Evolution**:
```
┌──────────────────────────────────────────┐
│ DEFINITION BLOCK COMPOSER                │
│                                          │
│ Domain:    [Full Stack Development]      │  ← Read-only
│ Subject:   [Backend Development]         │  ← Read-only
│ Topic:     [Java]                        │  ← Read-only
│ Subtopic:  [What is Java?]               │  ← Read-only
│                                          │
│ Version:   [D1 — Simple Orientation ▼]   │  ← Dropdown
│                                          │
│ Version Contract:                        │
│ ✓ Title          ✓ Explanation          │
│ ✓ Introduction   ○ Example              │
│ ✓ Definition     ○ Characteristics      │
│ ✓ Key Takeaway                           │
│                                          │
│ Content:                                 │
│ ┌────────────────────────────────────┐  │
│ │ Title: [What Is Java?]             │  │  ← Author edits
│ │ Introduction: [...]                │  │
│ │ Definition: [...]                  │  │
│ │ Explanation: [...]                 │  │
│ │ Example: [...]                     │  │
│ │ Characteristics: [...]             │  │
│ │ Key Takeaway: [...]                │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [Preview] [Save Draft] [Publish]         │
└──────────────────────────────────────────┘
```

**Note**: Hierarchy is displayed but NOT editable. Content JSON editor shows only author-writable fields.

### 7.3 Hierarchy Display (Read-Only)

```tsx
interface HierarchyDisplayProps {
  hierarchyIds: {
    domainId: string;
    subjectId: string;
    topicId: string;
    subtopicId: string;
  };
  resolvedNames: {
    domain: string;
    subject: string;
    topic: string;
    subtopic: string;
  };
}

function HierarchyDisplay({ hierarchyIds, resolvedNames }: HierarchyDisplayProps) {
  return (
    <div className="border rounded p-4 bg-slate-50">
      <h3 className="font-semibold mb-2">Content Hierarchy</h3>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="font-medium text-slate-600">Domain:</dt>
          <dd className="text-slate-900">{resolvedNames.domain}</dd>
          <dd className="text-xs text-slate-400">{hierarchyIds.domainId}</dd>
        </div>
        
        <div>
          <dt className="font-medium text-slate-600">Subject:</dt>
          <dd className="text-slate-900">{resolvedNames.subject}</dd>
          <dd className="text-xs text-slate-400">{hierarchyIds.subjectId}</dd>
        </div>
        
        <div>
          <dt className="font-medium text-slate-600">Topic:</dt>
          <dd className="text-slate-900">{resolvedNames.topic}</dd>
          <dd className="text-xs text-slate-400">{hierarchyIds.topicId}</dd>
        </div>
        
        <div>
          <dt className="font-medium text-slate-600">Subtopic:</dt>
          <dd className="text-slate-900">{resolvedNames.subtopic}</dd>
          <dd className="text-xs text-slate-400">{hierarchyIds.subtopicId}</dd>
        </div>
      </dl>
      <p className="text-xs text-slate-500 mt-3 italic">
        ℹ️ Hierarchy is system-controlled and cannot be edited here.
        Category labels displayed to learners are derived from this hierarchy.
      </p>
    </div>
  );
}
```

**Important**: The composer shows both **IDs** (source of truth) and **resolved names** (for human readability). Category labels like "Java Fundamentals" are derived from `topicId` at runtime.

### 7.4 Author Content → Canonical Transformation

```typescript
// Author Content (what the author writes)
interface AuthorContent {
  title: string;
  intro: string;
  definition: string;
  explanation: RichText;
  example?: ExampleContent;
  characteristics?: string[];
  takeaway: string;
}

// System Context (composer knows from admin selection)
interface SystemContext {
  subtopicId: string;
  domainId: string;
  subjectId: string;
  topicId: string;
}

// Canonical Block (storage format)
interface DefinitionBlock {
  id: string;
  type: "definition";
  version: "I1" | "I2" | "I3" | "I4" | "I5" | "I6";
  content: AuthorContent;  // ← No duplicate version field
  presentation?: PresentationConfig;
}

// Canonical TutorialDocument
interface TutorialDocument {
  schemaVersion: 1;
  metadata: DocumentMetadata;
  blocks: Block[];
}

// Transformation function
function transformToCanonical(
  authorContent: AuthorContent,
  context: SystemContext,
  version: DefinitionVersion
): TutorialDocument {
  return {
    schemaVersion: 1,
    metadata: {
      subtopicId: context.subtopicId,
      domainId: context.domainId,
      subjectId: context.subjectId,
      topicId: context.topicId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    blocks: [
      {
        id: generateBlockId(),
        type: "definition",
        version: version,  // ← Version at block level only
        content: authorContent,
        presentation: {}
      }
    ]
  };
}
```

**Key Point**: Version appears **once** at the block level, not duplicated inside `content`.

---

## 8. Rendering Architecture

### 8.1 Universal Rendering Flow

```
tutorial_content.content (JSONB)
  ↓
TutorialDocument
  ↓
TutorialRenderer
  ↓
TutorialBlockRenderer
  ↓
DefinitionBlock (version-aware)
```

### 8.2 Version-Aware Component

```typescript
export function DefinitionBlock({ 
  block,
  className = '' 
}: BlockComponentProps<IDefinitionBlock>) {
  const { version, content } = block;
  
  // Version-specific rendering (NO SILENT FALLBACK)
  switch (version) {
    case "D1":
      return <DefinitionD1View content={content} className={className} />;
    case "D2":
      return <DefinitionD2View content={content} className={className} />;
    case "D3":
      return <DefinitionD3View content={content} className={className} />;
    case "D4":
      return <DefinitionD4View content={content} className={className} />;
    case "D5":
      return <DefinitionD5View content={content} className={className} />;
    case "D6":
      return <DefinitionD6View content={content} className={className} />;
    default:
      // Unknown version = validation failure, not silent fallback
      throw new BlockVersionError(
        `Unknown Definition Block version: ${version}`,
        { blockId: block.id, version }
      );
  }
}
```

**Alternative Pattern** (composition with explicit error):
```typescript
const DEFINITION_RENDERERS: Record<DefinitionVersion, React.ComponentType<any>> = {
  D1: DefinitionD1View,
  D2: DefinitionD2View,
  D3: DefinitionD3View,
  D4: DefinitionD4View,
  D5: DefinitionD5View,
  D6: DefinitionD6View
};

export function DefinitionBlock({ block, className }: BlockComponentProps) {
  const Renderer = DEFINITION_RENDERERS[block.version];
  
  if (!Renderer) {
    throw new BlockVersionError(
      `Unknown Definition Block version: ${block.version}`,
      { blockId: block.id, version: block.version }
    );
  }
  
  return <Renderer content={block.content} className={className} />;
}
```

**CRITICAL**: Unknown versions **MUST throw errors**, not silently fall back to D1. This prevents data corruption from being hidden by implicit fallback rendering.

### 8.3 Production Integration

**Current State** (Legacy):
```tsx
// TutorialPageShell.tsx
{payload.content.definition && (
  <TutorialDefinitionContent 
    payload={payload.content.definition} 
    theme={payload.theme}  {/* ← Remove theme */}
  />
)}
```

**Target State** (Universal Renderer):
```tsx
// TutorialPageShell.tsx
<TutorialRenderer document={payload.content.document} />

// TutorialRenderer.tsx
export function TutorialRenderer({ document }: { document: TutorialDocument }) {
  return (
    <>
      {document.blocks.map(block => (
        <TutorialBlockRenderer key={block.id} block={block} />
      ))}
    </>
  );
}

// TutorialBlockRenderer.tsx
export function TutorialBlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "definition":
      return <DefinitionBlock block={block} />;
    case "code":
      return <CodeBlock block={block} />;
    // ... other blocks
  }
}
```

---

## 9. Type Safety & Validation

### 9.1 TypeScript Type Hierarchy

```typescript
// Base block
interface BaseBlock {
  id: string;
  type: string;
  version: string;  // Required, not optional
  presentation?: PresentationConfig;
}

// Version-specific content types
type DefinitionVersion = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

interface DefinitionD1Content {
  title: string;              // Required
  intro: string;              // Required
  definition: string;         // Required
  explanation: RichText;      // Required
  example?: ExampleContent;   // Optional
  characteristics?: string[]; // Optional
  takeaway: string;           // Required
}

interface DefinitionD2Content {
  // To be defined when D2 is designed
}

// ... D3-D6 content interfaces to be defined later

// Definition Block types (discriminated union by version)
type DefinitionBlock =
  | DefinitionD1Block
  | DefinitionD2Block
  | DefinitionD3Block
  | DefinitionD4Block
  | DefinitionD5Block
  | DefinitionD6Block;

interface DefinitionD1Block extends BaseBlock {
  type: "definition";
  version: "D1";
  content: DefinitionD1Content;  // ← No duplicate version inside content
}

interface DefinitionD2Block extends BaseBlock {
  type: "definition";
  version: "D2";
  content: DefinitionD2Content;
}

// ... D3-D6 block interfaces
```

**Key Point**: Each version has its own `DefinitionD*Block` type with **version at block level**, not nested inside content. This makes TypeScript discrimination work correctly.

### 9.2 Zod Runtime Validation

```typescript
// packages/types/src/tutorial-rich-document/schemas/definition-versions.schema.ts

export const DefinitionD1ContentSchema = z.object({
  title: z.string().min(1).max(200),
  intro: z.string().min(10).max(500),
  definition: z.string().min(10).max(2000),
  explanation: RichTextSchema,
  example: ExampleSchema.optional(),
  characteristics: z.array(z.string().min(1).max(200)).max(10).optional(),
  takeaway: z.string().min(10).max(500)
});

export const DefinitionD1BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal("definition"),
  version: z.literal("D1"),
  content: DefinitionD1ContentSchema,  // ← Direct content, no nested version
  presentation: PresentationConfigSchema.optional()
});

export const DefinitionD2BlockSchema = z.object({
  id: BlockIdSchema,
  type: z.literal("definition"),
  version: z.literal("D2"),
  content: DefinitionD2ContentSchema,  // To be defined
  presentation: PresentationConfigSchema.optional()
});

// ... D3-D6 schemas

// Discriminated union of all Definition Block versions
export const DefinitionBlockSchema = z.discriminatedUnion("version", [
  DefinitionD1BlockSchema,
  DefinitionD2BlockSchema,
  DefinitionD3BlockSchema,
  DefinitionD4BlockSchema,
  DefinitionD5BlockSchema,
  DefinitionD6BlockSchema
]);
```

**Key Point**: Each version has its own complete schema. The discriminated union uses `version` as the discriminator at the **block level**, not nested inside content.

### 9.3 Validation Flow

```
Composer Input
  ↓
Client-side Zod Validation (immediate feedback)
  ↓
API Request
  ↓
Server-side Zod Validation (security boundary)
  ↓
Database JSONB Storage
  ↓
Read/Delivery
  ↓
Server-side Zod Validation (runtime safety)
  ↓
Renderer
```

---

## 10. Definition Block Qualification Gate

Before **I1 is declared complete** and the pattern is replicated to other blocks, it must pass the qualification gate.

### 10.1 Gate Status: Three Stages

| Gate | Existing Component | Reference Architecture | D1 Implementation |
|------|-------------------|----------------------|-------------------|
| **Component Independence** | ✅ Pass | ✅ Pass | 🟡 Theme prop cleanup needed |
| **JSON-Driven** | ✅ Pass | ✅ Pass | 🟡 Needs version awareness |
| **Type-Safe** | ✅ Pass | ✅ Pass | 🟡 Needs version types |
| **Runtime Validated** | 🟡 Basic | ✅ Pass | ❌ Needs D1 schema |
| **Registry** | ✅ Pass | ✅ Pass | 🟡 Needs version registry |
| **Version-Aware** | ❌ Implicit | ✅ Pass | ❌ Not Implemented |
| **Hierarchy-Safe** | ❌ None | ✅ Pass | ❌ Not Implemented |
| **Brand-Independent** | ✅ Pass | ✅ Pass | 🟡 Theme prop cleanup needed |
| **Presentation Boundary** | N/A | ✅ Pass | ❌ Not Implemented |
| **DB-Independent** | ✅ Pass | ✅ Pass | ✅ Pass |
| **Composer-Ready** | ❌ None | ✅ Pass | ❌ Not Implemented |
| **Version-Ready** | ❌ None | ✅ Pass | 🟡 Architecture Ready |
| **Renderer-Ready** | 🟡 Legacy | ✅ Pass | ❌ Not Integrated |
| **SSR-Safe** | ✅ Pass | ✅ Pass | ✅ Pass |
| **Testable** | 🟡 Unit only | ✅ Pass | ❌ Integration tests needed |
| **Security** | ✅ XSS-safe | ✅ Pass | ✅ Pass |
| **Accessibility** | ❌ No ARIA | ✅ Pass | ❌ Missing explicit ARIA |
| **Error Isolation** | ❌ None | ✅ Pass | ❌ No error boundary |

### 10.2 Completion Criteria

**Existing Component**: Definition Block currently passes basic independence, JSON-driven rendering, and security requirements.

**Reference Architecture (This Spec)**: The architectural pattern is **locked and approved**. All architectural decisions are final.

**D1 Implementation**: Before D1 passes the gate:
- All gates must be **✅ Pass** in the "D1 Implementation" column
- D1 must be deployed to production (RTH + SkillUp)
- D1 must be verified working in live Tutorial V2 pages
- Integration tests must pass
- Accessibility audit must pass

**Only then** does Definition Block become the **locked reference pattern** for replication to the remaining 17 blocks.

---

## 11. Implementation Sequence

### Phase 1: D1 Foundation (Priority 1)
1. ❌ Extend `DefinitionBlock` type with `version: "D1"`
2. ❌ Create `DefinitionD1ContentSchema` (Zod)
3. ❌ Create `DEFINITION_VERSION_REGISTRY` with D1 entry
4. ❌ Update `DefinitionBlock.tsx` component for version-aware rendering
5. ❌ Add explicit ARIA attributes
6. ❌ Add error boundary wrapper
7. ❌ Create integration tests
8. ❌ Remove unused `theme` prop

### Phase 2: Composer (Priority 1)
9. ❌ Create `DefinitionBlockComposer` shell
10. ❌ Implement version selector dropdown (D1 only)
11. ❌ Implement hierarchy display (read-only, ID-based)
12. ❌ Implement version contract display
13. ❌ Implement D1 content editor (version-driven fields)
14. ❌ Implement author content → canonical transformation
15. ❌ Create composer validation tests
16. ❌ Enforce presentation boundary (block-layout only)

### Phase 3: Production Integration (Priority 1)
17. ❌ Replace legacy `TutorialDefinitionContent` with universal renderer
18. ❌ Migrate existing Definition content to D1 versioned format
19. ❌ Update Tutorial V2 delivery API
20. ❌ Deploy to production
21. ❌ Verify RTH + SkillUp Tutorial V2 pages
22. ❌ Pass qualification gate (all ✅)

### Phase 4: Lock Reference Pattern
23. ✅ **Definition Block D1 LOCKED as reference architecture**
24. ✅ **Pattern ready for replication to 17 remaining blocks**

### Phase 5: D2-D6 Expansion (Priority 2)
25. ❌ Design D2 pedagogical pattern
26. ❌ Implement D2 schema, renderer, composer
27. ❌ Deploy D2 to production
28. ❌ Repeat for D3, D4, D5, D6

**Note**: Do NOT start CodeBlock, VisualBlock, or other blocks until Definition Block D1 passes the qualification gate. D1 must become the proven reference pattern first.

---

## 12. Replication to Other Blocks

Once **Definition Block I1 passes the qualification gate**, the pattern replicates to 17 other blocks.

### 12.1 Common Architecture for All 18 Blocks

**Every block follows the same contract**:

```typescript
interface Block {
  id: string;
  type: BlockType;     // "definition" | "code" | "visual" | ...
  version: string;     // Block-specific: "I1" | "C1" | "V3" | ...
  content: unknown;    // Block-specific content schema
  presentation?: PresentationConfig;
}
```

**Example multi-block document**:
```json
{
  "schemaVersion": 1,
  "metadata": { "subtopicId": "..." },
  "blocks": [
    { "type": "introduction", "version": "I1", "content": {} },
    { "type": "definition", "version": "I1", "content": {} },
    { "type": "code", "version": "C2", "content": {} },
    { "type": "visual", "version": "V4", "content": {} },
    { "type": "bestpractice", "version": "BP1", "content": {} },
    { "type": "interview", "version": "IV2", "content": {} }
  ]
}
```

### 12.2 Independent Version Registries

**DO NOT create one universal version registry.**

Each block has its own version registry with pedagogical semantics:

```typescript
// Definition Block
DEFINITION_VERSION_REGISTRY = {
  I1: { label: "Simple Orientation", ... },
  I2: { label: "Motivation through Need", ... },
  // ...
}

// Code Block
CODE_VERSION_REGISTRY = {
  C1: { label: "Basic Syntax", ... },
  C2: { label: "Annotated Example", ... },
  C3: { label: "Line-by-Line Execution", ... },
  // ...
}

// Visual Block
VISUAL_VERSION_REGISTRY = {
  V1: { label: "Simple Diagram", ... },
  V2: { label: "Flow Diagram", ... },
  V3: { label: "Comparison Visual", ... },
  // ...
}
```

**Rationale**: Version semantics are pedagogical and block-specific. C1 (Basic Syntax) has different meaning than I1 (Simple Orientation) or V1 (Simple Diagram).

### 12.3 Replication Checklist

For each of the 17 remaining blocks:

- [ ] Create block version registry (e.g., `CODE_VERSION_REGISTRY`)
- [ ] Define version-specific content schemas (e.g., `CodeC1ContentSchema`)
- [ ] Create version-specific block schemas (e.g., `CodeC1BlockSchema`)
- [ ] Create discriminated union schema (e.g., `CodeBlockSchema`)
- [ ] Create version-specific TypeScript types
- [ ] Update block component for version-aware rendering (with explicit error on unknown version)
- [ ] Create block-specific composer with version dropdown
- [ ] Implement read-only hierarchy display
- [ ] Implement version contract display
- [ ] Implement version-driven field generation
- [ ] Implement author content → canonical transformation
- [ ] Add validation tests (client + server)
- [ ] Add rendering tests (all versions)
- [ ] Production integration
- [ ] Pass qualification gate

### 12.4 Next Priority Blocks

1. **CodeBlock** (C1-C10) — Code teaching patterns
2. **VisualBlock** (V1-V10) — Visual learning representations
3. **SummaryBlock** (S1-S6) — Revision patterns

**Critical**: Each block uses the **same architectural pattern** (type + version + content) but **different pedagogical contracts**. No block should invent its own architecture.

---

## 13. Success Criteria

### 13.1 Technical Success
- ✅ One `DefinitionBlockComposer` architecture supports D1-D6 without requiring separate composers
- ✅ D1 is fully implemented and passes qualification gate
- ✅ D2-D6 are extensible through version-driven configuration
- ✅ Version nomenclature scoped to block type (D-series for Definition, eliminating I1 ambiguity with Introduction)
- ✅ Hierarchy is system-controlled (ID-based, no mismatch possible)
- ✅ Version explicitly identified in JSON at block level
- ✅ Unified JSONB storage (no separate tables)
- ✅ Brand-independent (runtime theme only)
- ✅ Presentation boundary enforced (block-layout only, no brand data)
- ✅ Universal renderer integration
- ✅ Type-safe + runtime validated
- ✅ SSR-compatible
- ✅ Accessible (WCAG AA)
- ✅ Error-isolated (boundary catches unknown versions)

### 13.2 Business Success
- Authors can select appropriate pedagogical presentation (I1-I6)
- Content works across RTH + SkillUp without modification
- Adding new versions (I7, I8) doesn't require composer rewrite
- Pattern replicates to CodeBlock, VisualBlock, etc. without architectural changes

### 13.3 Developer Success
- Clear version registry
- Explicit type contracts
- Predictable validation
- No magic/implicit behavior
- Easy to test
- Easy to extend

---

## 14. Non-Goals

**This spec explicitly does NOT cover**:
- ❌ Implementation details of I2-I6 pedagogical patterns (future design work)
- ❌ Migration tooling for legacy Definition content (separate effort)
- ❌ AI-assisted content generation for Definition blocks (separate feature)
- ❌ Definition block analytics/tracking (separate feature)
- ❌ Definition block A/B testing (separate feature)
- ❌ Cross-block dependencies (Definition + Visual linking)
- ❌ Block composition patterns (nested blocks)
- ❌ Asset management for Definition visuals

---

## 15. References

### 15.1 Existing Architecture
- Tutorial Component Architecture Blueprint
- Definition Block Audit Report (171/200 score)
- Tutorial Rich Document Type System (`packages/types/src/tutorial-rich-document/`)
- Block Registry (`packages/types/src/tutorial-rich-document/registry.ts`)
- Tutorial Composer Contracts (`packages/types/src/tutorial-composer/composer-contracts.ts`)

### 15.2 Related Components
- `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx` (current implementation)
- `src/share-branding/LearningExperience/components/TutorialPageShell.tsx` (legacy integration)
- `packages/db-tutorial/src/schema/tutorial-content.ts` (JSONB storage)

### 15.3 Production URLs
- RTH: `https://user.realtutorialhub.com/tutorial-v2/.../whatisjava`
- SkillUp: `https://user.skillupitacademy.com/tutorial-v2/.../whatisjava`

---

## 16. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-08-19 | Initial draft | - |
| 1.1 | 2026-08-19 | **Major corrections**: <br/>• Changed D1-D8 to I1-I6 (removed migration path)<br/>• Corrected 141 → 137 total versions<br/>• Removed `category` from author content<br/>• Made hierarchy ID-based, not name-based<br/>• Established three-layer model explicitly<br/>• Fixed JSON schema consistency (version at block level only)<br/>• Changed unknown version handling (throw error, not fallback)<br/>• Added `requiredElements` to version registry<br/>• Clarified independent version registries per block<br/>• Strengthened composer UI architecture | - |
| 1.2 | 2026-08-19 | **Final cleanup**: <br/>• Removed all remaining D1-D8 migration references<br/>• Corrected "140+ versions" → "137 versions" in Executive Summary<br/>• Clarified "supports I1-I6" → "architecture supports I1-I6, I1 implemented initially"<br/>• Added explicit note: RichText uses platform's existing contract<br/>• Defined presentation boundary (block-layout only, no brand data)<br/>• Added rule: blocks MUST NOT carry their own hierarchy metadata<br/>• Restructured qualification gate (3 stages: Existing/Architecture/I1)<br/>• Removed Phase 5 D-series migration<br/>• Added Phase 4: Lock Reference Pattern checkpoint<br/>• Clarified I-series is permanent nomenclature<br/>• Emphasized: Do NOT start other blocks until I1 passes gate | - |
| **1.3** | **2026-08-19** | **🔒 FINAL - Version Nomenclature Locked**: <br/>• **Changed I1-I6 back to D1-D6 for DefinitionBlock** (version scoped to block type)<br/>• **Eliminated ambiguity**: Introduction=I1-I6, Definition=D1-D6, Code=C1-C10, etc.<br/>• Updated all code examples, schemas, types to D-series<br/>• Updated registry: DEFINITION_VERSION_REGISTRY uses D1-D6<br/>• Updated TypeScript: DefinitionD1Block, DefinitionD1Content, etc.<br/>• Updated Zod schemas: DefinitionD1BlockSchema, DefinitionD1ContentSchema<br/>• Updated composer UI examples to show "D1 — Simple Orientation"<br/>• Updated qualification gate to D1 Implementation<br/>• Updated implementation sequence: Phases 1-5 now reference D1-D6<br/>• Updated success criteria to reflect D-series nomenclature<br/>• **Status changed to: Reference Architecture (Final)**<br/>• **Architecture is now LOCKED** - this is the reference pattern for all 18 blocks | - |

## 17. Approval & Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| **Architecture Review** | - | ✅ **Approved** | 2026-08-19 |
| **Technical Lead** | - | ⏳ Pending Review 1.3 | - |
| **Product Owner** | - | ⏳ Pending Review 1.3 | - |

---

**END OF SPECIFICATION — REVISION 1.3 (FINAL)**

**Status**: 🔒 **LOCKED REFERENCE ARCHITECTURE**

This specification defines the reference pattern for all 18 Tutorial Engine blocks. The architecture is final and approved. Definition Block uses **D1-D6** nomenclature permanently, scoped to the DefinitionBlock type.

**Next Steps**:
1. Technical Design for D1 implementation
2. Implement Phases 1-3 (D1 Foundation, Composer, Production Integration)
3. Pass Qualification Gate
4. Lock D1 as proven reference pattern
5. Replicate architecture to remaining 17 blocks
