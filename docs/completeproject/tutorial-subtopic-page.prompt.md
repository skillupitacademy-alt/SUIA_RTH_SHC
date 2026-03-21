# AI Prompt: TutorialSubtopicPage — Complete Implementation Guide

> **File:** `apps/tutorial-app/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`
> **Component Reference:** `TutorialSubtopicPage.jsx`
> **Blueprint References:** `TUTORIAL-ENGINE-BLUEPRINT.md` · `TUTORIAL-ENGINE-CONTENT-FRAMEWORK-EXTENSION.md` · `MASTER-PLATFORM-ARCHITECTURE.md`
> **Status:** Ready for Implementation

---

## PROMPT 1 — Project Context & Codebase Orientation

```
You are working on an EdTech platform called EduFlow.
This is a BYJU's-grade, B2C, direct-to-student learning platform
built as a pnpm Turborepo monorepo.

Read these files before writing any code:

1. apps/tutorial-app/CLAUDE.md
   → Tutorial app AI rules, patterns, and constraints

2. packages/types/src/tutorial-content.types.ts
   → The canonical TutorialContentJSON TypeScript interface
   → All 6 content block type definitions
   → SubtopicFlowProgress interface

3. packages/db-tutorial/src/schema.ts
   → tutorial_content table (JSONB content column)
   → tutorial_progress table
   → subtopic_flow_progress table
   → domain_content_config table

4. packages/auth/src/permissions.ts
   → STUDENT role permissions
   → How to verify a student is enrolled in this subtopic's course

5. apps/tutorial-app/src/server/tutorial-engine/tutorial.engine.ts
   → getSubtopicContent(subtopicId, userId)
   → markBlockComplete(userId, subtopicId, contentType)
   → checkTierUnlock(userId, subtopicId)

6. apps/tutorial-app/src/components/content/ContentTabs.tsx
   → Existing tab navigation component (if it exists)
   → If it doesn't exist yet, you will create it as part of this task

After reading these files, confirm what exists and what needs to be created
before writing any code.
```

---

## PROMPT 2 — Data Model & Types

```
You are implementing the TutorialSubtopicPage component.

Before touching any UI, lock the TypeScript types by reading:
  packages/types/src/tutorial-content.types.ts

The canonical JSON structure stored in tutorial_content.content (JSONB) is:

{
  "notes": {
    "markdown": string
  },
  "layman": {
    "simpleExplanation": string,    // 150–250 words, plain English
    "analogyOrStory": string,       // 1 analogy OR story
    "example1": {
      "company": string,            // Real named entity
      "content": string             // 3–5 sentences
    },
    "example2": {
      "company": string,
      "content": string
    }
  },
  "real_life": {
    "title": string,
    "scenario": string,
    "bullets": Array<{ label: string, detail: string }>,
    "tip": string
  },
  "technical": {
    "markdown": string,
    "bullets": Array<{ term: string, detail: string }>,
    "tip": string
  },
  "code": {
    "language": string,             // "javascript" | "python" | "sql" | "typescript"
    "intro": string,
    "code": string,                 // The actual code string
    "steps": string[]               // Step-by-step explanation array
  },
  "ai_tutor": {
    "greeting": string,
    "qa_pairs": Array<{
      "question": string,
      "answer": string
    }>
  }
}

Create or verify this interface exists in:
  packages/types/src/tutorial-content.types.ts

Also create the SubtopicPageProps interface:

interface SubtopicPageProps {
  params: {
    domainSlug: string
    subjectSlug: string
    topicSlug: string
    subtopicSlug: string
  }
}

And the DomainTheme interface:

interface DomainTheme {
  breadcrumbBg: string      // CSS gradient string
  sidebarAccent: string     // Primary hex color
  activeItem: string        // Slightly lighter accent
  blockLayman: string       // CSS gradient for layman bg
  blockLaymanHeader: string // Hex for layman header text/icons
  blockRealLife: string
  blockRealLifeHeader: string
  blockTechnical: string
  blockTechnicalHeader: string
  blockCode: string
  blockCodeHeader: string
  blockAITutor: string
  blockAITutorHeader: string
  blockNotes: string
  progressFill: string      // Progress bar fill color
  quizBtn: string           // CSS gradient for Take Quiz button
  domainIcon: string        // Emoji icon for domain
}

Verification: Run pnpm typecheck:all — zero errors before proceeding.
```

---

## PROMPT 3 — Server-Side Data Fetching (RSC Pattern)

```
You are implementing the server-side data fetching for TutorialSubtopicPage.

CRITICAL RULE from CLAUDE.md:
  Content blocks are ALWAYS fetched server-side (RSC) — never client-fetched raw.

The page at:
  apps/tutorial-app/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx

Must be a React Server Component (no 'use client' at the top level).

Step 1: Implement the server-side data loader

  import { TutorialEngine } from '@/server/tutorial-engine/tutorial.engine'
  import { getServerSession } from '@tutorial-app/auth/session'
  import { notFound, redirect } from 'next/navigation'
  import { unstable_cache } from 'next/cache'

  export default async function SubtopicPage({ params }: SubtopicPageProps) {

    // 1. Get authenticated user
    const session = await getServerSession()
    if (!session) redirect('/login?redirect=' + encodeURIComponent(currentPath))

    // 2. Resolve slug → IDs
    const subtopic = await resolveSubtopicFromSlugs(params)
    if (!subtopic) notFound()

    // 3. Check enrollment (student must be enrolled in this course)
    const isEnrolled = await TutorialEngine.checkEnrollment(session.userId, subtopic.domainId)
    if (!isEnrolled) redirect('/learn?error=not_enrolled')

    // 4. Fetch content (cached — content rarely changes)
    const content = await getCachedSubtopicContent(subtopic.id)

    // 5. Fetch student progress (NOT cached — changes per user action)
    const progress = await TutorialEngine.getSubtopicFlowProgress(
      session.userId,
      subtopic.id
    )

    // 6. Fetch sidebar data (cached per domain)
    const sidebarData = await getCachedSidebarData(subtopic.domainId, session.userId)

    // 7. Get domain theme config
    const domainConfig = await getCachedDomainConfig(subtopic.domainId)

    return (
      <TutorialSubtopicLayout
        subtopic={subtopic}
        content={content}
        progress={progress}
        sidebar={sidebarData}
        domainConfig={domainConfig}
        userId={session.userId}
      />
    )
  }

Step 2: Implement caching strategy

  // Content is published rarely → cache aggressively
  const getCachedSubtopicContent = unstable_cache(
    async (subtopicId: string) =>
      TutorialEngine.getSubtopicContent(subtopicId),
    ['subtopic-content'],
    {
      revalidate: 3600,  // 1 hour
      tags: [`subtopic-content:${subtopicId}`]
    }
  )

  // Domain config changes almost never → cache for 24 hours
  const getCachedDomainConfig = unstable_cache(
    async (domainId: string) =>
      db.query.domainContentConfig.findFirst({
        where: eq(domainContentConfig.domainId, domainId)
      }),
    ['domain-config'],
    { revalidate: 86400, tags: [`domain-config:${domainId}`] }
  )

  // Student progress is per-user — served fresh from Upstash Redis
  // (stored by markBlockComplete server action — no caching needed)

Step 3: Add ISR revalidation endpoint for admin content updates
  When admin publishes new content:
  → call revalidateTag(`subtopic-content:${subtopicId}`)
  → This is already handled in PHASE-T9-CONTENT-GENERATION.md pipeline

Verification: Page loads server-side, no client-side fetch waterfalls.
Run: pnpm --filter @quiz/tutorial-app run build — must exit 0.
```

---

## PROMPT 4 — Layout Architecture (Server Component Shell)

```
You are implementing the outer layout shell for TutorialSubtopicPage.

Create this file:
  apps/tutorial-app/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx

The layout has 3 structural zones:

ZONE 1 — Navbar (server component, shared across all tutorial pages)
  File: apps/tutorial-app/src/components/layout/TutorialNavbar.tsx
  Props: { userName: string, avatarInitial: string }
  Content:
    - Left: 📚 EduFlow logo (bold, #1a2340)
    - Right: "Dashboard" link | "My Progress" link | bell icon | avatar circle
    - Position: sticky, top: 0, z-index: 100
    - Height: 60px
    - Background: #ffffff, border-bottom: 1px solid #e2e8f0
    - Box shadow: 0 1px 4px rgba(0,0,0,0.08)

ZONE 2 — Breadcrumb strip (server component)
  File: apps/tutorial-app/src/components/layout/DomainBreadcrumb.tsx
  Props: { domain: string, subtopic: string, theme: DomainTheme }
  Content:
    - Background: theme.breadcrumbBg (CSS gradient, domain-specific)
    - Height: 38px
    - Content: [domainIcon] [domain] › [subtopic]
    - Domain text: rgba(255,255,255,0.85), 13px
    - Subtopic text: #ffffff, 13px, font-weight: 600
    - Separator ›: rgba(255,255,255,0.5)

ZONE 3 — Body: sidebar + main (flex layout)
  Container: max-width 1280px, margin: 0 auto
  Sidebar: width 220px, flex-shrink: 0
  Main: flex: 1, min-width: 0 (critical for flex overflow)

IMPORTANT: The body zone MUST wrap in a <div> with display: flex.
The sidebar is sticky within the body (not the viewport).
Use: position: sticky, top: 60px, height: calc(100vh - 60px), overflow-y: auto

Full page structure:
  <div>                                ← Root, background: #f5f6fa
    <TutorialNavbar />                 ← Zone 1: sticky top
    <DomainBreadcrumb />               ← Zone 2: domain color strip
    <div style={{ display: 'flex' }}> ← Zone 3: body
      <Sidebar ... />                  ← Left sidebar (client component)
      <main>                           ← Main content area
        <SubtopicContent ... />        ← All 6 blocks + progress
      </main>
    </div>
  </div>

Verification: Layout renders without horizontal overflow on 1280px viewport.
```

---

## PROMPT 5 — Left Sidebar Component

```
You are implementing the left sidebar for TutorialSubtopicPage.

Create this file:
  apps/tutorial-app/src/components/layout/TutorialSidebar.tsx
  → 'use client' (needs expand/collapse state)

Props interface:
  interface TutorialSidebarProps {
    currentDomain: {
      name: string
      topics: Array<{ name: string; status: SidebarItemStatus; slug: string }>
    }
    topicGroups: Array<{
      name: string
      defaultExpanded: boolean
      items: Array<{ name: string; status: SidebarItemStatus; slug: string }>
    }>
    notes: Array<{ term: string; detail: string }>
    theme: DomainTheme
    activeSubtopicSlug: string
  }

  type SidebarItemStatus = 'completed' | 'active' | 'in_progress' | 'locked' | 'not_started'

StatusIcon sub-component (inline, no separate file):
  - completed:    Filled green circle (#43a047), white ✓ checkmark, 18px
  - active:       Filled circle (theme.sidebarAccent color), white ● dot
  - in_progress:  Half-filled orange circle (#f57c00)
  - locked:       Grey circle (#ccc), 🔒 icon, 10px
  - not_started:  Outline circle only, border: 2px solid #ccc

Sidebar sections (top to bottom):

SECTION 1 — Current Domain Topics (always expanded)
  - Domain name as header: font-weight 700, 13px, background #f8f9fe, border-radius 8
  - Each topic item: flex row, StatusIcon + name, 6px padding, 7px border-radius
  - Active item background: theme.sidebarAccent + "18" (10% opacity hex)
  - Active item text: theme.sidebarAccent, font-weight 600
  - Locked item text: #bbbbbb
  - Completed item text: #4a5568

SECTION 2+ — Collapsible Topic Groups
  - Group header: "Topic" label, expand/collapse toggle (∨ / ›)
  - onClick: toggle expanded state (useState per group index)
  - Items: same StatusIcon + name pattern as Section 1
  - Divider between groups: 1px solid #f0f0f0

QUICK ACTIONS ROW (bottom of sections):
  - 4 circular icon buttons: 💡 ⚙️ 📚 🎯
  - Each: 36px circle, background #f0f2f8, border-radius 50%
  - Box shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Cursor: pointer

SIDEBAR NOTES PANEL (sticky at bottom):
  - Container: margin 8px 12px, padding 12px 14px
  - Background: #fffde7, border-radius 10px, border: 1px solid #ffe082
  - Header: 📋 Notes (font-weight 700, 12.5px, color #5d4037)
  - Each note: term in bold #e65100, detail in #5d4037, font-size 11.5px
  - Max 6 notes visible (overflow hidden, no scroll)

SIDEBAR CONTAINER STYLES:
  width: 220px
  flex-shrink: 0
  background: #ffffff
  border-right: 1px solid #e2e8f0
  padding: 16px 0
  position: sticky
  top: 60px
  height: calc(100vh - 98px)  ← 60px navbar + 38px breadcrumb
  overflow-y: auto

Verification: Sidebar scrolls independently. Active item highlighted correctly.
```

---

## PROMPT 6 — Progress Bar & Take Quiz Header

```
You are implementing the SubtopicHeader section of TutorialSubtopicPage.

Create this file:
  apps/tutorial-app/src/components/content/SubtopicHeader.tsx
  → 'use client' (progress updates dynamically as blocks are completed)

Props interface:
  interface SubtopicHeaderProps {
    subtopicName: string
    completedBlocks: number   // 0–6
    totalBlocks: number       // always 6
    onTakeQuiz: () => void
    theme: DomainTheme
  }

Section 1 — Subtopic Title
  - H1 tag: font-size 32px, font-weight 800, color #1a2340
  - Font family: 'Georgia', serif  ← matches reference images exactly
  - Letter spacing: -0.5px
  - Margin bottom: 14px

Section 2 — Progress Row
  Container: flex row, gap 12px, align-items center

  Progress Track (flex: 1):
    - Container: height 36px, background #f0f2f8, border-radius 8px
    - Border: 1px solid #e2e8f0
    - Inner: flex row, padding 0 14px, gap 10px, align-items center
    - Left icon: ✏️ (14px)
    - Label: "{completedBlocks}/{totalBlocks} Completed" — 13px, #4a5568, font-weight 500
    - Bar track: flex 1, height 8px, background #dde1ef, border-radius 4px
    - Bar fill: width = (completedBlocks/totalBlocks * 100)%, background theme.progressFill
    - Bar fill transition: width 0.5s ease (animated on block completion)
    - Right icons: ⚙️ 🔍 (14px, color #888888)

  Take Quiz Button:
    - Background: theme.quizBtn (CSS gradient)
    - Color: #ffffff
    - Padding: 10px 22px
    - Border-radius: 8px
    - Font-weight: 700, font-size: 14px
    - Border: none
    - Box-shadow: 0 2px 8px rgba(245,124,0,0.35)
    - Cursor: pointer
    - White-space: nowrap
    - onClick: onTakeQuiz prop
    - DISABLED state: opacity 0.5, cursor not-allowed
      → Disabled when completedBlocks < 6
      → Tooltip: "Complete all 6 blocks to unlock the quiz"

  Progress percentage text (optional, shown on hover):
    - Absolute positioned above bar fill
    - "{pct}% complete"

Verification: Progress bar animates correctly when completedBlocks prop changes.
```

---

## PROMPT 7 — Layman Block Component

```
You are implementing the LaymanBlock component — THE MOST IMPORTANT block.

RULE FROM CONTENT-FRAMEWORK-EXTENSION.md:
  Layman Block = Entry Point of Every Subtopic.
  Never skip. Never abbreviate. Never show technical content here.

Create this file:
  apps/tutorial-app/src/components/content/LaymanBlock.tsx
  → Server component (pure display, no state)

Props interface:
  interface LaymanBlockProps {
    data: TutorialContentJSON['layman']
    theme: DomainTheme
    isCompleted: boolean
  }

Layout: Full width card, border-radius 14px, overflow hidden
Box shadow: 0 2px 12px rgba(0,0,0,0.07)
Border: 1px solid #e8edf8

SECTION 1 — Block Header
  Use shared BlockHeader component (see PROMPT 10).
  Props: icon="🎓", title="Layman Explanation", bg, color from theme.blockLaymanHeader

SECTION 2 — Main Content (background: theme.blockLayman)
  Layout: flex row, gap 24px, padding 20px

  LEFT SIDE (flex: 1):
    Paragraph 1 — Simple Explanation:
      - font-size: 14.5px, line-height: 1.75, color: #2d3748
      - margin-bottom: 14px
      - text: data.simpleExplanation

    Analogy Box:
      - background: rgba(255,255,255,0.6)
      - border-radius: 10px, padding: 12px 16px
      - border: 1px solid rgba(255,255,255,0.8)
      - Header row: 📦 icon + "Analogy" label (font-weight 700, 13px, theme.blockLaymanHeader)
      - Content: font-size 13.5px, line-height 1.65, color #4a5568, font-style italic
      - text: data.analogyOrStory

  RIGHT SIDE (width: 180px, flex-shrink: 0):
    Domain-specific illustration (SVG or emoji-based):
      - Web Development: pizza/async cartoon
      - Data Science: chart/graph SVG
      - Data Analyst: table/join diagram SVG
      - Data Engineering: pipeline/flow diagram SVG
    Opacity: 0.9
    Import from: apps/tutorial-app/src/components/illustrations/

SECTION 3 — Examples Row (background: rgba(255,255,255,0.4))
  Layout: CSS grid, 2 columns (1fr 1fr)
  Border top: 1px solid #dce8f8

  Each Example Card:
    - Padding: 14px 20px
    - Left card background: rgba(255,255,255,0.5)
    - Right card background: rgba(255,255,255,0.3)
    - Right card border-left: 1px solid #dce8f8
    - Header: 📊 icon + "Example {n}: {company}" (font-weight 700, 12.5px, theme.blockLaymanHeader)
    - Content: font-size 13px, line-height 1.6, color #4a5568
    - Header margin-bottom: 6px

SECTION 4 — Mark as Read Button (shown only if not completed)
  - Shown at bottom of block when isCompleted === false
  - Button: "Mark as Read → Unlock Real-Life Scenario"
  - Background: theme.blockLaymanHeader, color white, border-radius 8px
  - Padding: 10px 20px, font-weight 600, font-size 13px
  - On click: calls server action markBlockComplete('layman')
  - After click: isCompleted becomes true, button replaced by green ✓ "Completed"

COMPLETED STATE:
  - Small green badge in block header: ✓ Completed
  - Button replaced with completion indicator

Verification: Block renders correctly for all 4 domain themes.
No code syntax, no jargon, no technical terms inside layman block content.
```

---

## PROMPT 8 — Real-Life & Technical Block Components

```
You are implementing RealLifeBlock and TechnicalBlock — the second row.

These two blocks sit side-by-side in a 2-column CSS grid (1fr 1fr).
Wrap them in: <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

──────────────────────────────────────────
A) RealLifeBlock.tsx (Server Component)
──────────────────────────────────────────
Props: { data: TutorialContentJSON['real_life'], theme: DomainTheme, isCompleted: boolean }

Block container:
  border-radius: 14px, overflow: hidden
  box-shadow: 0 2px 12px rgba(0,0,0,0.07)
  border: 1px solid #d4edda

Block header:
  icon: "🏪", title: "Real-Life Scenario"
  bg: theme.blockRealLifeHeader + "15", color: theme.blockRealLifeHeader

Main content (background: theme.blockRealLife, padding: 18px, min-height: 200px):
  Layout: flex row, justify-content space-between, gap 12px

  Left content (flex: 1):
    - Scenario title: font-weight 700, font-size 14px, color #1b5e20, margin-bottom 10px
      text: data.title
    - Scenario body: font-size 13.5px, line-height 1.7, color #2e7d32, margin-bottom 12px
      text: data.scenario
    - Bullets list (flex column, gap 4px):
      Each bullet: flex row, 8px bullet dot (#43a047), text 12.5px, color #2d5a2e
      Format: <strong>{label}</strong> — {detail}

  Right side (font-size 48px, opacity 0.5, flex-shrink 0):
    Domain-appropriate emoji:
      Full Stack → 💻
      Data Analyst → 📊
      Data Science → 🧠
      Data Engineering → ⚙️

Tip bar (bottom, background: #c8e6c9, padding: 8px 16px):
  "💡 Tip: {data.tip}"
  font-size: 12px, color: #1b5e20, font-weight: 500

Mark as Read button: same pattern as LaymanBlock (unlocks Technical block)

──────────────────────────────────────────
B) TechnicalBlock.tsx (Server Component)
──────────────────────────────────────────
Props: { data: TutorialContentJSON['technical'], theme: DomainTheme, isCompleted: boolean, isLocked: boolean }

LOCKED STATE (when isLocked === true):
  - Block header shows 🔒 icon instead of ⚙️
  - Content area shows: "Complete Real-Life Scenario to unlock"
  - Greyed out overlay: background rgba(255,255,255,0.7), blur filter
  - No content visible behind overlay

Block container:
  border-radius: 14px, overflow: hidden
  box-shadow: 0 2px 12px rgba(0,0,0,0.07)
  border: 1px solid #ffe0b2

Block header:
  icon: "⚙️" (or 🔒 if locked), title: "Technical Explanation"
  bg: theme.blockTechnicalHeader + "15", color: theme.blockTechnicalHeader

Main content (background: theme.blockTechnical, padding: 18px, min-height: 200px):
  Intro paragraph: font-size 13.5px, line-height 1.7, color #3e2723, margin-bottom 14px
    text: data.markdown

  Bullets (flex column, gap 10px):
    Each bullet: flex row, 8px orange dot (#ef6c00), content div
      Term: font-weight 700, font-size 13px, color #bf360c
      Detail: font-size 13px, color #4e342e, line-height 1.6

Tip bar (bottom, background: #ffe0b2, padding: 8px 16px):
  "💡 Tip: {data.tip}"
  font-size: 12px, color: #bf360c, font-weight: 500

Mark as Read button: unlocks Code Explanation block

Verification: Locked state shows correctly when Real-Life not completed.
Both blocks equal height within the grid row.
```

---

## PROMPT 9 — Code Explanation & AI Tutor Block Components

```
You are implementing CodeExplanationBlock and AITutorBlock — the third row.

These two blocks sit side-by-side in a 2-column CSS grid (1fr 1fr).

──────────────────────────────────────────
A) CodeExplanationBlock.tsx (Server Component)
──────────────────────────────────────────
Props: { data: TutorialContentJSON['code'], theme: DomainTheme, isCompleted: boolean, isLocked: boolean }

LOCKED STATE: Same overlay pattern as TechnicalBlock.
  Message: "Complete Technical Explanation to unlock"

Block container:
  border-radius: 14px, overflow: hidden
  box-shadow: 0 2px 12px rgba(0,0,0,0.1)
  border: 1px solid #37474f

Block header:
  icon: "💻", title: "Code Explanation"
  bg: "#2e3a45", color: "#90a4ae"

Main content (background: theme.blockCode, padding: 18px):
  Intro text: font-size 13px, color #b0bec5, margin-bottom 12px
    text: data.intro

  CodeHighlight component (inline, no separate file):
    Container: background #1e1e2e, border-radius 8px, padding 16px
    Font: 'Fira Code', 'Courier New', monospace, font-size 13px, line-height 1.7
    Overflow-x: auto

    Line rendering: each line has a line number column + code column
      Line numbers: color #4a5568, user-select none, min-width 20px, text-align right
      Code: color #e0e0e0 (base)

    Syntax highlighting (inline dangerouslySetInnerHTML or token-based):
      Keywords (const, let, var, new, return, async, await): color #80cbc4
      String literals ("...", '...', `...`): color #a5d6a7
      Function/class names (Promise, setTimeout, etc.): color #ffcc80
      Comments (// ...): color #78909c
      Numbers: color #f48fb1

    Language badge (top-right of code container):
      Small pill: background #37474f, color #90a4ae
      Text: data.language (e.g., "javascript", "python")
      Position: absolute top 8px right 8px, font-size 11px

  Steps Explained section (margin-top: 14px):
    Header: "Steps Explained:", font-weight 700, font-size 12.5px, color #90a4ae
    List: flex column, gap 5px
    Each step: flex row, teal dot (#80cbc4), text 12.5px, color #b0bec5, line-height 1.6

Mark as Read button: unlocks AI Tutor block

──────────────────────────────────────────
B) AITutorBlock.tsx ('use client' — needs chat state)
──────────────────────────────────────────
Props: {
  data: TutorialContentJSON['ai_tutor'],
  theme: DomainTheme,
  subtopicId: string,
  userId: string,
  isCompleted: boolean,
  isLocked: boolean
}

State:
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activeQA, setActiveQA] = useState<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

LOCKED STATE: Same overlay, message "Complete Code Explanation to unlock"

Block container:
  border-radius: 14px, overflow: hidden
  box-shadow: 0 2px 12px rgba(0,0,0,0.07)
  border: 1px solid #e1d0ee

Block header:
  icon: "🤖", title: "AI Tutor Chat"
  bg: theme.blockAITutorHeader + "18", color: theme.blockAITutorHeader

Main content (background: theme.blockAITutor, padding: 18px):
  Layout: flex column, min-height: 280px

  Greeting message (static, first render):
    background: rgba(255,255,255,0.6), border-radius: 10px
    padding: 10px 14px, margin-bottom: 14px
    font-size: 13px, color: #4a148c, line-height: 1.6
    border: 1px solid rgba(255,255,255,0.8)
    text: data.greeting

  Chat messages (dynamic, from chatMessages state):
    Map each ChatMessage:
    User message: align-self flex-end, background theme.blockAITutorHeader,
      color white, padding 8px 12px, border-radius 10px, font-size 12.5px
    AI message: align-self flex-start, background rgba(255,255,255,0.7),
      color #4a148c, same padding/radius
    Auto-scroll to bottom on new message (messagesEndRef.current?.scrollIntoView)

  Pre-generated Q&A list (data.qa_pairs):
    Each qa item: collapsible accordion
    Closed: flex row, question text + › arrow, background rgba(255,255,255,0.65)
      border-radius 8px, padding 9px 14px, cursor pointer
      font-size 13px, color #4a148c, font-weight 500
    Open (activeQA === index): shows answer below with ∨ indicator
      Answer: background rgba(255,255,255,0.45), border-radius 0 0 8px 8px
      padding 8px 14px, font-size 12.5px, color #6a1b9a, line-height 1.65
    Note: clicking a Q&A item also adds it to chatMessages as if typed

  Chat input row (bottom):
    Container: flex row, gap 8px, margin-top 14px
      background rgba(255,255,255,0.7), border-radius 8px
      padding 6px 8px, border 1px solid rgba(106,27,154,0.2)

    Input: flex 1, border none, background transparent
      font-size 13px, outline none, color #4a148c
      placeholder: "Type your question..."
      onKeyDown: Enter key triggers send

    Send button: background theme.blockAITutorHeader, color white
      border none, border-radius 6px, width 32px, height 32px
      cursor pointer, content: "➤"

  handleSendMessage function:
    1. Add user message to chatMessages
    2. Clear input
    3. Call streaming API: POST /api/ai-tutor/chat
       Body: { subtopicId, message: chatInput, history: chatMessages }
    4. Stream response into AI message bubble (ReadableStream)
    5. On first token received: also call markBlockComplete('ai_tutor')
       This unlocks the assignment

  IMPORTANT: First successful AI Tutor interaction
    → calls server action markBlockComplete(userId, subtopicId, 'ai_tutor')
    → This unlocks the Assignment tab/button
    → Tracked in subtopic_flow_progress.ai_tutor_first_message_at

Verification: Chat messages render correctly. Streaming works.
Q&A accordion opens/closes. Lock state shows overlay properly.
```

---

## PROMPT 10 — Shared BlockHeader Component & Notes Block

```
You are implementing two shared components used across all content blocks.

──────────────────────────────────────────
A) BlockHeader.tsx (Server Component)
──────────────────────────────────────────
Create: apps/tutorial-app/src/components/content/BlockHeader.tsx

Props interface:
  interface BlockHeaderProps {
    icon: string          // Emoji icon
    title: string         // Block title text
    bg: string            // CSS background (hex with opacity or gradient)
    color: string         // Text and icon color (hex)
    isCompleted?: boolean // Shows ✓ Completed badge if true
    isLocked?: boolean    // Shows 🔒 if true (overrides icon)
  }

Render:
  Container: flex row, align-items center, justify-content space-between
    padding: 12px 16px
    background: props.bg
    border-radius: 12px 12px 0 0
    border-bottom: 1px solid {color}22 (color at ~13% opacity)

  Left side: flex row, gap 8px
    Icon: font-size 18px (locked icon 🔒 if isLocked)
    Title: font-weight 700, font-size 15px, color: props.color
      Font-family: 'Georgia', serif (matches reference images)

  Right side: flex row, gap 8px
    Completed badge (if isCompleted):
      background: #e8f5e9, border-radius 12px, padding 2px 8px
      font-size 11px, color #2e7d32, font-weight 600
      content: "✓ Completed"
    Arrow indicator: "›", color: props.color, opacity 0.6, font-size 16px

──────────────────────────────────────────
B) NotesBlock.tsx (Server Component)
──────────────────────────────────────────
Create: apps/tutorial-app/src/components/content/NotesBlock.tsx

Props interface:
  interface NotesBlockProps {
    notes: Array<{ term: string; detail: string }>
    theme: DomainTheme
  }

Block container: full width
  border-radius: 14px, overflow: hidden
  box-shadow: 0 2px 12px rgba(0,0,0,0.06)
  border: 1px solid #ffe082

Block header:
  icon: "📋", title: "Notes"
  bg: "#fff8e1", color: "#f57f17"

Main content (background: theme.blockNotes, padding: 18px 24px):
  Layout: CSS grid, 2 columns (1fr 1fr), gap: 6px 32px

  Each note item: flex row, gap 8px, padding 4px 0
    Bullet dot: width 8px, height 8px, border-radius 50%
      background #f9a825, margin-top 5px, flex-shrink 0
    Text: font-size 13.5px, color #4a3728, line-height 1.6
      Term: <strong style={{ color: '#e65100' }}>{term}:</strong>
      Detail: plain text after term

  Max 8 notes in 2-column grid (4 per column)
  If more than 8: show "Show all notes" toggle button

Notes block is always visible (not locked, not part of enforced flow)
It serves as a reference/cheat-sheet throughout the learning session.

Verification: Notes render in 2-column grid correctly.
BlockHeader renders correctly for all 6 block types.
```

---

## PROMPT 11 — Server Actions (Progress Tracking)

```
You are implementing the server actions for progress tracking.

RULE FROM CLAUDE.md:
  Progress updates go through Upstash Redis first, DB second (write-behind).
  NEVER update progress synchronously in the same request as content fetch.

Create this file:
  apps/tutorial-app/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from '@tutorial-app/auth/session'
import { TutorialEngine } from '@/server/tutorial-engine/tutorial.engine'
import { redis } from '@/server/cache/redis'

──────────────────────────────────────
Action 1: markBlockComplete
──────────────────────────────────────
export async function markBlockComplete(
  subtopicId: string,
  blockType: 'layman' | 'real_life' | 'technical' | 'code' | 'ai_tutor'
): Promise<{ success: boolean; nextUnlockedBlock: string | null; flowComplete: boolean }>

Implementation:
  1. Get session → verify userId
  2. Check idempotency: redis.get(`progress:${userId}:${subtopicId}:${blockType}`)
     If already marked complete → return { success: true, cached: true }
  3. Write to Redis immediately (optimistic):
     redis.setex(`progress:${userId}:${subtopicId}:${blockType}`, 86400, 'completed')
  4. Enqueue DB write via QStash (write-behind, non-blocking):
     qstash.publishJSON({ url: '/api/workers/mark-progress', body: { userId, subtopicId, blockType, timestamp: new Date() } })
  5. Determine nextUnlockedBlock:
     layman → real_life
     real_life → technical
     technical → code
     code → ai_tutor
     ai_tutor → assignment (special: assignment unlocked separately)
  6. Check if all 5 content blocks now complete → flowComplete: true
  7. If flowComplete: also enqueue QStash event: tutorial.subtopic_content_completed
  8. Return: { success: true, nextUnlockedBlock, flowComplete }

──────────────────────────────────────
Action 2: getFlowProgress
──────────────────────────────────────
export async function getFlowProgress(
  subtopicId: string
): Promise<SubtopicFlowProgress>

Implementation:
  1. Get session → userId
  2. Check Redis first (fast path):
     const cached = await redis.get(`flow:${userId}:${subtopicId}`)
     if (cached) return JSON.parse(cached)
  3. Fall back to DB: query subtopic_flow_progress table
  4. Cache result in Redis (TTL: 5 minutes):
     redis.setex(`flow:${userId}:${subtopicId}`, 300, JSON.stringify(result))
  5. Return progress object

──────────────────────────────────────
Action 3: unlockAssignment
──────────────────────────────────────
export async function unlockAssignment(
  subtopicId: string,
  difficulty: 'simple' | 'mixed' | 'intermediate' | 'expert'
): Promise<{ unlocked: boolean; reason?: string }>

Implementation:
  1. Verify AI Tutor has been interacted with (ai_tutor_first_message_at IS NOT NULL)
  2. Verify all 5 content blocks are marked complete
  3. EXCEPTION: student with ≥80% on Simple tier can skip flow
     Check: tutorial_project_submissions where score >= 80 AND difficulty = 'simple'
  4. If both conditions met → mark assignment as unlocked in DB + Redis
  5. Return { unlocked: true }
  6. If conditions not met → return { unlocked: false, reason: 'Complete all content blocks first' }

Error handling for all actions:
  - Wrap in try/catch
  - Log errors via logger service (Pino)
  - Never throw to client — return { success: false, error: 'friendly message' }
  - Report unexpected errors to Sentry

Verification: Actions work correctly. Redis writes happen before DB writes.
QStash jobs enqueue successfully in dev (use QStash dev server).
```

---

## PROMPT 12 — Domain Theme System

```
You are implementing the domain theme configuration system.

Create this file:
  apps/tutorial-app/src/lib/domain-themes.ts

This file exports the DOMAIN_THEMES record and a helper function.

The 4 confirmed domains and their complete theme configs:

──────────────────────────────────────
FULL STACK / WEB DEVELOPMENT → "indigo"
──────────────────────────────────────
{
  breadcrumbBg: "linear-gradient(135deg, #3b4f7a 0%, #4f6292 50%, #6b82b5 100%)",
  sidebarAccent: "#3d5a9e",
  activeItem: "#4f6aad",
  blockLayman: "linear-gradient(135deg, #e8f0fe 0%, #dce8fd 100%)",
  blockLaymanHeader: "#3d5a9e",
  blockRealLife: "linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)",
  blockRealLifeHeader: "#2e7d46",
  blockTechnical: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
  blockTechnicalHeader: "#e65100",
  blockCode: "linear-gradient(135deg, #263238 0%, #1e272e 100%)",
  blockCodeHeader: "#546e7a",
  blockAITutor: "linear-gradient(135deg, #f3e5f5 0%, #e8d5f0 100%)",
  blockAITutorHeader: "#6a1b9a",
  blockNotes: "linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)",
  progressFill: "#f9a825",
  quizBtn: "linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)",
  domainIcon: "🌐"
}

──────────────────────────────────────
DATA ANALYST → "blue"
──────────────────────────────────────
{
  breadcrumbBg: "linear-gradient(135deg, #1a3a6b 0%, #2557a7 50%, #4472c4 100%)",
  sidebarAccent: "#2557a7",
  activeItem: "#3568b8",
  blockLayman: "linear-gradient(135deg, #e3eeff 0%, #d4e4fb 100%)",
  blockLaymanHeader: "#2557a7",
  blockRealLife: "linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)",
  blockRealLifeHeader: "#2e7d46",
  blockTechnical: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
  blockTechnicalHeader: "#e65100",
  blockCode: "linear-gradient(135deg, #1a2332 0%, #0d1520 100%)",
  blockCodeHeader: "#4a7c9e",
  blockAITutor: "linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)",
  blockAITutorHeader: "#6a1b9a",
  blockNotes: "linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)",
  progressFill: "#f9a825",
  quizBtn: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)",
  domainIcon: "📊"
}

──────────────────────────────────────
DATA SCIENCE → "teal"
──────────────────────────────────────
{
  breadcrumbBg: "linear-gradient(135deg, #1a5c5c 0%, #2e7d72 50%, #4caf9f 100%)",
  sidebarAccent: "#2e7d72",
  activeItem: "#3d9e92",
  blockLayman: "linear-gradient(135deg, #e0f5f2 0%, #d0ece8 100%)",
  blockLaymanHeader: "#2e7d72",
  blockRealLife: "linear-gradient(135deg, #e8f5e9 0%, #d4edda 100%)",
  blockRealLifeHeader: "#2e7d46",
  blockTechnical: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
  blockTechnicalHeader: "#e65100",
  blockCode: "linear-gradient(135deg, #1a2332 0%, #0d1520 100%)",
  blockCodeHeader: "#4a7c7e",
  blockAITutor: "linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)",
  blockAITutorHeader: "#6a1b9a",
  blockNotes: "linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)",
  progressFill: "#f9a825",
  quizBtn: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)",
  domainIcon: "🧠"
}

──────────────────────────────────────
DATA ENGINEERING → "steel"
──────────────────────────────────────
{
  breadcrumbBg: "linear-gradient(135deg, #1c2833 0%, #2e4057 50%, #485e76 100%)",
  sidebarAccent: "#2e4057",
  activeItem: "#3d5470",
  blockLayman: "linear-gradient(135deg, #e8edf5 0%, #d8e4f0 100%)",
  blockLaymanHeader: "#2e4057",
  blockRealLife: "linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)",
  blockRealLifeHeader: "#2e7d46",
  blockTechnical: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
  blockTechnicalHeader: "#e65100",
  blockCode: "linear-gradient(135deg, #1a1f2e 0%, #0d1018 100%)",
  blockCodeHeader: "#546880",
  blockAITutor: "linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)",
  blockAITutorHeader: "#6a1b9a",
  blockNotes: "linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)",
  progressFill: "#f9a825",
  quizBtn: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)",
  domainIcon: "⚙️"
}

──────────────────────────────────────
Helper function:
──────────────────────────────────────
export function getDomainTheme(domainSlug: string): DomainTheme {
  const themeMap: Record<string, keyof typeof DOMAIN_THEMES> = {
    'full-stack': 'indigo',
    'web-development': 'indigo',
    'data-analyst': 'blue',
    'data-analysis': 'blue',
    'data-science': 'teal',
    'data-engineering': 'steel',
  }
  const key = themeMap[domainSlug.toLowerCase()] ?? 'indigo'
  return DOMAIN_THEMES[key]
}

Verification: All 4 themes render correctly in Storybook or via test pages.
Theme switching between domains shows correct breadcrumb and block colors.
```

---

## PROMPT 13 — CLAUDE.md Rules for This Component

```
Add these rules to apps/tutorial-app/CLAUDE.md
under a new section: ## TutorialSubtopicPage Rules

# TutorialSubtopicPage Rules

## File Locations
- Page (RSC):       src/app/(learning)/learn/[d]/[s]/[t]/[sub]/page.tsx
- Layout shell:     src/components/layout/TutorialSubtopicLayout.tsx
- Navbar:           src/components/layout/TutorialNavbar.tsx
- Breadcrumb:       src/components/layout/DomainBreadcrumb.tsx
- Sidebar:          src/components/layout/TutorialSidebar.tsx  ← 'use client'
- BlockHeader:      src/components/content/BlockHeader.tsx
- LaymanBlock:      src/components/content/LaymanBlock.tsx
- RealLifeBlock:    src/components/content/RealLifeBlock.tsx
- TechnicalBlock:   src/components/content/TechnicalBlock.tsx
- CodeBlock:        src/components/content/CodeExplanationBlock.tsx
- AITutorBlock:     src/components/content/AITutorBlock.tsx  ← 'use client'
- NotesBlock:       src/components/content/NotesBlock.tsx
- SubtopicHeader:   src/components/content/SubtopicHeader.tsx ← 'use client'
- Server actions:   src/app/(learning)/learn/.../actions.ts
- Domain themes:    src/lib/domain-themes.ts

## Non-Negotiable Rules

### Content Rules
- Layman block NEVER contains code syntax, technical jargon, or variable names
- Notes block is ALWAYS visible — it is never locked
- Block completion order is STRICT: layman → real_life → technical → code → ai_tutor → assignment
- Assignment is LOCKED until ALL 5 content blocks are completed + 1 AI Tutor message sent
- EXCEPTION: student with ≥80% Simple tier score can bypass content flow

### Component Rules
- Only AITutorBlock, TutorialSidebar, SubtopicHeader use 'use client'
- All other block components are server components (no useState, no useEffect)
- Page.tsx is ALWAYS a server component (no 'use client' at file level)
- Content data is ALWAYS passed as props from RSC — never fetched client-side

### Performance Rules
- Content fetch: unstable_cache (1 hour revalidate) — content rarely changes
- Progress fetch: NO cache — always fresh from Upstash Redis
- Domain config: unstable_cache (24 hour revalidate)
- Progress writes: Redis first (synchronous), DB second (via QStash write-behind)

### Theme Rules
- Domain theme is resolved server-side from domainSlug → getDomainTheme()
- Theme object is passed as prop to ALL child components
- NEVER hardcode colors in components — always use theme.blockXxx properties
- Code block is ALWAYS dark background regardless of domain theme

### Testing Rules
- Each block component has a Storybook story with all 4 domain themes
- AITutorBlock has unit tests for: chat send, Q&A accordion, lock state
- Server actions have integration tests with mocked Redis + QStash
- Locked state tested for all lockable blocks (real_life, technical, code, ai_tutor)
```

---

## PROMPT 14 — Integration Test & Verification Checklist

```
You are writing the final verification checklist for TutorialSubtopicPage.

After implementing all components (Prompts 1–13), run this complete checklist:

──────────────────────────────────────
FUNCTIONAL TESTS
──────────────────────────────────────
□ Page loads server-side with no client-side data waterfalls
□ Content displays correctly for all 4 domain themes
□ Breadcrumb shows correct domain and subtopic name
□ Sidebar highlights active subtopic correctly
□ Progress bar shows correct X/6 count on load
□ Progress bar animates when a block is marked complete

ENFORCED FLOW TESTS
□ Layman block visible and unlocked on first visit
□ Real-Life block LOCKED (overlay visible) on first visit
□ Technical block LOCKED on first visit
□ Code block LOCKED on first visit
□ AI Tutor block LOCKED on first visit
□ Clicking "Mark as Read" on Layman → unlocks Real-Life
□ Clicking "Mark as Read" on Real-Life → unlocks Technical
□ Clicking "Mark as Read" on Technical → unlocks Code
□ Clicking "Mark as Read" on Code → unlocks AI Tutor
□ Sending first message in AI Tutor → unlocks Assignment
□ "Take Quiz" button disabled until all 6 blocks complete
□ "Take Quiz" button enabled when all 6 complete

PROGRESS PERSISTENCE TESTS
□ Refresh page after completing Layman → Layman still shows as completed
□ Real-Life still unlocked after refresh
□ Progress bar still shows correct count after refresh
□ Redis has correct keys: progress:{userId}:{subtopicId}:layman

AI TUTOR TESTS
□ Greeting message renders on load
□ Q&A accordion opens on click, closes on second click
□ Typing a message and pressing Enter sends it
□ AI response streams character by character (not all at once)
□ User and AI messages render in correct bubble styles
□ Clicking a Q&A item adds it to chat history

DOMAIN THEME TESTS
□ Web Development (indigo): breadcrumb is indigo gradient ✓
□ Data Analyst (blue): breadcrumb is blue gradient ✓
□ Data Science (teal): breadcrumb is teal gradient ✓
□ Data Engineering (steel): breadcrumb is steel/dark gradient ✓
□ Code block is dark regardless of domain ✓
□ AI Tutor block is purple regardless of domain ✓
□ Notes block is yellow/warm regardless of domain ✓

PERFORMANCE TESTS
□ Lighthouse score: LCP < 2.5s
□ No layout shift on block unlock (CLS = 0)
□ Content visible without JavaScript (SSR works)
□ Sidebar scrolls independently of main content

TYPE SAFETY TESTS
□ pnpm typecheck:all — zero errors
□ All block props match TutorialContentJSON types exactly
□ DomainTheme interface fully satisfied by all 4 theme objects

BUILD TESTS
□ pnpm --filter @quiz/tutorial-app run build — exits 0
□ No 'use client' on page.tsx
□ No server actions called from server components directly
□ No circular imports between packages

──────────────────────────────────────
KNOWN ISSUES TO WATCH FOR
──────────────────────────────────────
⚠️  Grid layout breaks below 900px viewport — mobile layout is Phase T later
⚠️  CodeHighlight uses dangerouslySetInnerHTML — ensure code content
    is from trusted source only (DB) — never from user input directly
⚠️  AI Tutor streaming requires ReadableStream support
    → Add polyfill check for older browsers
⚠️  Progress bar 0.5s animation may flash on initial load
    → Use opacity transition instead of width for first render
```

---

## File Creation Order (Execute Prompts in This Sequence)

```
STEP 1:  PROMPT 2  → Lock TypeScript types in packages/types/
STEP 2:  PROMPT 12 → Create domain-themes.ts
STEP 3:  PROMPT 10 → Create BlockHeader.tsx and NotesBlock.tsx
STEP 4:  PROMPT 4  → Create layout shell (Navbar, Breadcrumb, body structure)
STEP 5:  PROMPT 5  → Create TutorialSidebar.tsx
STEP 6:  PROMPT 6  → Create SubtopicHeader.tsx (progress bar)
STEP 7:  PROMPT 7  → Create LaymanBlock.tsx (most important)
STEP 8:  PROMPT 8  → Create RealLifeBlock.tsx + TechnicalBlock.tsx
STEP 9:  PROMPT 9  → Create CodeExplanationBlock.tsx + AITutorBlock.tsx
STEP 10: PROMPT 11 → Create server actions (progress tracking)
STEP 11: PROMPT 3  → Wire server-side data fetching in page.tsx
STEP 12: PROMPT 13 → Update CLAUDE.md with all new rules
STEP 13: PROMPT 14 → Run full verification checklist
STEP 14: PROMPT 1  → Final codebase orientation check (confirm all files exist)
```

---

*Prompt Version: 1.0 | Component: TutorialSubtopicPage.jsx*
*Blueprint: TUTORIAL-ENGINE-BLUEPRINT.md + CONTENT-FRAMEWORK-EXTENSION.md*
*Status: READY FOR CLAUDE CODE EXECUTION*
