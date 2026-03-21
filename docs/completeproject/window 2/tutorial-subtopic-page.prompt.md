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

# TUTORIAL SUBTOPIC PAGE — COMPLETE IMPLEMENTATION PROMPT
## Append to: tutorial-subtopic-page_prompt.md
## Section: NEW PROMPT 15 — Section Preview + Detail Navigation + Theme Toggle

> This prompt supersedes and extends the layout described in Prompts 4–10.
> It introduces: (1) Section preview cards with click-to-detail navigation,
> (2) Full detail page per block with back navigation,
> (3) Multi-theme color toggle system persisted per user.
> Read ALL existing prompts (1–14) before implementing this prompt.

---

## PROMPT 15A — Mental Model: How the Page Now Works

```
BEFORE (old model):
  All 6 blocks fully expanded on one page — everything visible at once.

NOW (new model):
  The subtopic page shows a MASTER VIEW with 6 PREVIEW CARDS.
  Each preview card shows a teaser of the block content (2–3 lines)
  with a clear visual CTA: "Click to explore →"
  
  When user clicks a preview card → navigates to a BLOCK DETAIL PAGE
  showing the full content of that one block, prominently displayed.
  
  Back button on detail page → returns to the master subtopic page.
  Scroll position on master page is preserved on back navigation.

  This mirrors how premium learning apps (BYJU's, Khan Academy) work:
  Overview page → gives context and orientation
  Detail page    → gives deep focused learning
```

---

## PROMPT 15B — Master View (Subtopic Overview Page) Layout

```
FILE: apps/tutorial-app/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx

This is the MASTER VIEW — the overview page showing all 6 blocks as cards.

═══════════════════════════════════════════════════════
OVERALL PAGE STRUCTURE (top to bottom):
═══════════════════════════════════════════════════════

1. TutorialNavbar (sticky, always visible)
   — same as existing implementation (Prompt 4)
   — adds: ThemeToggle button on the right side of navbar (see Prompt 15E)

2. DomainBreadcrumb strip
   — same as existing implementation (Prompt 4)
   — colors come from active theme (not just domain)

3. Body zone: Sidebar (left) + Main content (right)

═══════════════════════════════════════════════════════
SIDEBAR: unchanged from Prompt 5
═══════════════════════════════════════════════════════
  — Shows domain → topic → subtopic hierarchy
  — Active subtopic highlighted
  — Notes panel at bottom (always visible, always unlocked)

═══════════════════════════════════════════════════════
MAIN CONTENT AREA — NEW STRUCTURE:
═══════════════════════════════════════════════════════

SECTION A: SubtopicHeader (same as Prompt 6)
  — Subtopic title (H1, 32px, Georgia serif)
  — Progress bar: X/6 Completed (filled based on blocksCompleted count)
  — Take Quiz button (disabled until all 6 complete)

SECTION B: Theme Toggle Row (NEW — see Prompt 15E)
  — Inline row of color swatches BELOW the progress bar
  — Label: "Theme:" followed by 5–6 colored circle buttons
  — Currently active theme has a ring indicator
  — Clicking a swatch instantly switches all block card colors

SECTION C: Block Preview Cards Grid (NEW CORE FEATURE)

  Layout: CSS grid
    — Row 1: Layman card (full width — 1 column spanning full width)
    — Row 2: Real-Life card + Technical card (2 columns, 1fr 1fr)
    — Row 3: Code card + AI Tutor card (2 columns, 1fr 1fr)
    — Row 4: Notes card (full width — 1 column spanning full width)

  Each preview card is a TEASER — it shows:
    1. Block header (icon + title + completion badge)
    2. A short preview of the content (2–4 lines, truncated with ellipsis)
    3. A "Click to explore" CTA at the bottom
    4. A lock overlay if the block is locked

═══════════════════════════════════════════════════════
BLOCK PREVIEW CARD SPECIFICATION (applies to all 6):
═══════════════════════════════════════════════════════

Container:
  border-radius: 14px
  overflow: hidden
  box-shadow: 0 2px 12px rgba(0,0,0,0.07)
  border: 1px solid {block-specific border color}
  cursor: pointer (if not locked)
  transition: transform 0.15s, box-shadow 0.15s
  hover (if not locked):
    transform: translateY(-2px)
    box-shadow: 0 6px 20px rgba(0,0,0,0.12)

Block Header (same as BlockHeader component from Prompt 10):
  icon + title + completion badge
  Background: theme-specific block header color
  Height: 48px

Preview Body:
  Background: theme-specific block background color
  Padding: 14px 18px 0 18px
  Min-height: 110px

  LAYMAN preview body:
    Show first 2 sentences of data.layman.simpleExplanation
    Truncate after 120 characters with "..."
    Below text: small grey tags showing "📦 Analogy  📊 2 Examples"
    These tags tell the user what's inside without showing it

  REAL-LIFE preview body:
    Show data.real_life.title in bold (#1b5e20, 13px)
    Show first sentence of data.real_life.scenario truncated at 100 chars
    Below: "📌 {bullet count} key steps inside"

  TECHNICAL preview body:
    Show first sentence of data.technical.markdown truncated at 100 chars
    Below: show first 2 bullet TERMS only (not details), greyed out
    Format: "• {term1}  • {term2}  • ..."

  CODE preview body:
    Show data.code.intro text (full, it's short)
    Below: language badge pill (e.g. "javascript" or "python")
    Show first line of the code block only, in monospace, dark bg,
    truncated: "const myPromise = new Promise(..."

  AI TUTOR preview body:
    Show data.ai_tutor.greeting truncated at 80 chars
    Below: show 2 sample question pills from qa_pairs:
    "What is X?" and "How does Y work?" as clickable-looking tags

  NOTES preview body:
    Show first 3 note terms and details from notes.markdown parsed
    Format: "• Term: detail" for each
    Truncate detail at 50 chars each

CTA Footer (bottom of every preview card):
  Height: 44px
  Background: rgba(255,255,255,0.5) for unlocked
  Background: rgba(200,200,200,0.3) for locked
  Border-top: 1px solid rgba(0,0,0,0.06)
  Padding: 0 18px
  Display: flex, align-items: center, justify-content: space-between

  Left side (if UNLOCKED and NOT completed):
    Text: "Click to explore" in theme.blockXxxHeader color, 13px, font-weight 600
    Arrow: "→" animated on hover (moves right 4px)

  Left side (if COMPLETED):
    Text: "✓ Completed — Review anytime" in #2e7d32, 13px
    Icon: green checkmark badge

  Left side (if LOCKED):
    Text: "🔒 Complete {previous block name} to unlock"
    Color: #999999, 13px
    No hover effect, cursor: default

  Right side (if UNLOCKED):
    Small circular arrow icon indicating "open in detail view"
    Color: theme.blockXxxHeader, opacity 0.6

LOCK OVERLAY (for locked blocks):
  Position: absolute, inset: 0
  Background: rgba(245,245,245,0.75)
  Backdrop-filter: blur(2px)
  Display: flex, align-items: center, justify-content: center
  Center content:
    🔒 icon (32px)
    Text: "Complete {previous block} first"
    Font-size: 13px, color #999, text-align: center
  The block header IS still visible above the overlay (overlay starts below header)

onClick handler (for unlocked blocks only):
  router.push(`/learn/${domainSlug}/${subjectSlug}/${topicSlug}/${subtopicSlug}/${blockType}`)
  Saves scroll position: sessionStorage.setItem('subtopic-scroll', window.scrollY)
  Block type values: 'layman' | 'real-life' | 'technical' | 'code' | 'ai-tutor' | 'notes'
```

---

## PROMPT 15C — Block Detail Page (Full Content View)

```
FILE: apps/tutorial-app/src/app/(learning)/learn/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[blockType]/page.tsx

This is the DETAIL VIEW for a single block — full content, prominently displayed.

═══════════════════════════════════════════════════════
ROUTE STRUCTURE:
═══════════════════════════════════════════════════════

  Master page:  /learn/full-stack/javascript/promises/js-promises
  Detail pages: /learn/full-stack/javascript/promises/js-promises/layman
                /learn/full-stack/javascript/promises/js-promises/real-life
                /learn/full-stack/javascript/promises/js-promises/technical
                /learn/full-stack/javascript/promises/js-promises/code
                /learn/full-stack/javascript/promises/js-promises/ai-tutor
                /learn/full-stack/javascript/promises/js-promises/notes

  [blockType] param values: 'layman' | 'real-life' | 'technical' | 'code' | 'ai-tutor' | 'notes'

═══════════════════════════════════════════════════════
DETAIL PAGE LAYOUT (top to bottom):
═══════════════════════════════════════════════════════

ZONE 1 — Navbar (same sticky TutorialNavbar, same ThemeToggle button)

ZONE 2 — Detail Breadcrumb (MODIFIED for detail view):
  Pattern: [DomainIcon] [Domain] › [Subject] › [Topic] › [Subtopic] › [Block Name]
  The last segment (Block Name) is in white, bold, larger (14px vs 13px)
  Background: same theme.breadcrumbBg as master page

  LEFT SIDE: Back button
    "‹ Back to [Subtopic Name]"
    Color: rgba(255,255,255,0.9)
    Font-size: 13px, font-weight: 600
    Cursor: pointer
    onClick:
      router.back()  ← uses browser history (preserves master scroll)
      Falls back to: router.push(`/learn/.../[subtopicSlug]`) if no history

ZONE 3 — Detail Page Body (NO sidebar on detail page)

  The detail page is FULL WIDTH with a centered content column:
    max-width: 860px
    margin: 0 auto
    padding: 32px 24px

  SECTION 1: Block Title Header
    Large block icon (40px emoji)
    Block name: H1, font-size: 28px, font-weight: 800, Georgia serif, color #1a2340
    Subtopic name below: font-size: 15px, color: #718096
    Completion badge (if completed): "✓ Completed" green pill

  SECTION 2: Block Navigation Pills (NEW)
    Horizontal row of 6 pill buttons, one per block
    Shows all 6 block names as pills: Notes | Layman | Real-Life | Technical | Code | AI Tutor
    Active block pill: filled background (theme.blockXxxHeader color), white text
    Completed block pill: green border, green text
    Locked block pill: grey, cursor not-allowed, 🔒 icon
    Unlocked but not active: outlined, clickable → navigates to that block's detail page
    This allows students to jump between blocks without going back to master page

  SECTION 3: Full Block Content
    This is where the COMPLETE block content renders — fully expanded, no truncation
    Use the EXACT same block components from Prompts 7, 8, 9, 10 but WITHOUT the
    preview truncation — full content shown:

    For LAYMAN block detail:
      Full simpleExplanation paragraph (no truncation)
      Full analogyOrStory in styled analogy box
      Both example cards (example1 and example2) in 2-column grid
        Each card shows full company name + full content text
      "Mark as Read" button at bottom (if not completed)

    For REAL-LIFE block detail:
      Scenario title (bold, themed color)
      Full scenario paragraph
      All bullet points (label + detail for each)
      Tip bar at the bottom
      "Mark as Read" button (if not completed)

    For TECHNICAL block detail:
      Full markdown paragraph (rendered via ReactMarkdown)
      All bullet points (term: bold + detail for each)
      Tip bar at bottom
      "Mark as Read" button (if not completed)

    For CODE block detail:
      Intro sentence
      Full code block with syntax highlighting and line numbers
        Language badge pill in top-right corner
      All "Steps Explained" items listed below the code
      "Mark as Read" button (if not completed)

    For AI TUTOR block detail:
      Full greeting message
      ALL qa_pairs as expandable accordion items (not just 2)
      Full live chat interface:
        Chat history (if any messages exist from previous session)
        Question input + send button
        Streaming response support (Upstash Vector search, NOT Anthropic API)
      First message sent → marks block complete, unlocks Assignment

    For NOTES block detail:
      Full markdown rendered via ReactMarkdown
      All notes in 2-column grid
      Export button: "Copy Notes" → copies plain text to clipboard
      No lock, always accessible

  SECTION 4: Block Completion Action
    Shown only for blocks that are NOT yet completed AND NOT locked:

    Button: "Mark as Read → Unlock [Next Block Name]"
    Width: 100%, padding: 14px
    Background: theme.blockXxxHeader color (block-specific)
    Color: white, font-weight: 700, font-size: 15px
    Border-radius: 10px
    Box-shadow: 0 4px 14px {theme.blockXxxHeader}40

    On click:
      1. Call markBlockComplete(subtopicId, blockType) server action
      2. Show success state: button becomes "✓ Completed!" with green background
      3. After 1.5s: show "Continue to [Next Block] →" button
      4. Clicking "Continue" navigates to next block detail page

    EXCEPTION — AI Tutor block:
      No "Mark as Read" button
      Instead: "Send your first message to unlock Assignment"
      The block auto-completes on first message sent

  SECTION 5: Block Footer Navigation
    Two buttons side by side:
    ← Previous Block    |    Next Block →
    If on first block (Notes is always first): previous button disabled
    If on last block (AI Tutor): next button shows "Take Assignment →" (if all complete)

═══════════════════════════════════════════════════════
BACK NAVIGATION BEHAVIOR (critical UX detail):
═══════════════════════════════════════════════════════

  When user clicks "‹ Back to [Subtopic Name]" on the detail page:
  1. router.back() is called — uses browser's native back navigation
  2. The master page is restored from Next.js router cache
  3. Scroll position is restored from sessionStorage key 'subtopic-scroll'
     Implementation in master page:
       useEffect(() => {
         const saved = sessionStorage.getItem('subtopic-scroll')
         if (saved) window.scrollTo(0, parseInt(saved))
         sessionStorage.removeItem('subtopic-scroll')
       }, [])
  4. The block card that was clicked now shows its completion state updated
     (because progress was updated via server action during detail page visit)
  5. Progress bar on master page reflects the new completion count

  IMPORTANT: On back navigation, the master page progress bar must
  re-fetch the latest progress. Use router.refresh() after scroll restore
  if the block was just completed.
```

---

## PROMPT 15D — Block Detail Page: Server Component Data Fetching

```
FILE: apps/tutorial-app/src/app/(learning)/learn/[d]/[s]/[t]/[sub]/[blockType]/page.tsx

This is a React Server Component (RSC) — no 'use client' at file level.

interface BlockDetailPageProps {
  params: {
    domainSlug: string
    subjectSlug: string
    topicSlug: string
    subtopicSlug: string
    blockType: 'layman' | 'real-life' | 'technical' | 'code' | 'ai-tutor' | 'notes'
  }
}

export default async function BlockDetailPage({ params }: BlockDetailPageProps) {

  // 1. Auth (same as master page)
  const session = await getServerSession()
  if (!session) redirect('/login')

  // 2. Resolve subtopic from slugs (same as master page)
  const subtopic = await resolveSubtopicFromSlugs(params)
  if (!subtopic) notFound()

  // 3. Enrollment check (same as master page)
  const isEnrolled = await TutorialEngine.checkEnrollment(session.userId, subtopic.domainId)
  if (!isEnrolled) redirect('/learn?error=not_enrolled')

  // 4. Fetch content (same cache — 1 hour revalidate)
  const content = await getCachedSubtopicContent(subtopic.id)

  // 5. Fetch progress (fresh — no cache)
  const progress = await TutorialEngine.getSubtopicFlowProgress(session.userId, subtopic.id)

  // 6. Check if this block is accessible
  //    blockType access rules:
  //    'notes'     → always accessible
  //    'layman'    → always accessible (first block)
  //    'real-life' → requires layman completed
  //    'technical' → requires real-life completed
  //    'code'      → requires technical completed
  //    'ai-tutor'  → requires code completed
  const isAccessible = checkBlockAccessibility(params.blockType, progress)
  if (!isAccessible) {
    redirect(`/learn/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/${params.subtopicSlug}`)
  }

  // 7. Map blockType URL param to content key
  const blockKeyMap = {
    'layman':    'layman',
    'real-life': 'real_life',
    'technical': 'technical',
    'code':      'code',
    'ai-tutor':  'ai_tutor',
    'notes':     'notes'
  }
  const contentKey = blockKeyMap[params.blockType]
  const blockContent = content[contentKey]

  // 8. Get domain theme
  const domainConfig = await getCachedDomainConfig(subtopic.domainId)

  return (
    <BlockDetailLayout
      subtopic={subtopic}
      blockType={params.blockType}
      blockContent={blockContent}
      allContent={content}        // needed for Notes sidebar and block nav pills
      progress={progress}
      domainConfig={domainConfig}
      userId={session.userId}
    />
  )
}

// Block accessibility check function
function checkBlockAccessibility(
  blockType: string,
  progress: SubtopicFlowProgress
): boolean {
  switch (blockType) {
    case 'notes':    return true
    case 'layman':   return true
    case 'real-life': return progress.layman_completed
    case 'technical': return progress.real_life_completed
    case 'code':      return progress.technical_completed
    case 'ai-tutor':  return progress.code_completed
    default:          return false
  }
}
```

---

## PROMPT 15E — Theme Toggle System (Multi-Color Themes)

```
This is the multi-theme color toggle discussed in the platform architecture.
Students can switch between visual themes. Their preference is persisted.

═══════════════════════════════════════════════════════
THEME ARCHITECTURE:
═══════════════════════════════════════════════════════

There are TWO layers of theming:

LAYER 1 — Domain Theme (automatic, set by domain):
  Full Stack     → Indigo theme
  Data Analyst   → Blue theme
  Data Science   → Teal theme
  Data Engineering → Steel/Dark theme
  This is the DEFAULT theme for the domain.
  It determines breadcrumb gradient and sidebar accent color.

LAYER 2 — Student Color Preference (manual, persisted):
  Student can override block card colors by choosing one of these presets:
  
  1. "Classic"  → warm parchment tones (matches reference image screenshots)
     blockLayman:    #eef4ff → #e8f0ff
     blockRealLife:  #fff8e8 → #fff3d4
     blockTechnical: #fff0ee → #ffe8e4
     blockCode:      #1e2d3d (always dark, never changes)
     blockAITutor:   #f5eeff → #ede0ff
     blockNotes:     #fffde7 → #fff8e1

  2. "Midnight"  → dark mode, deep navy backgrounds
     blockLayman:    #1a2540 → #1e2e50
     blockRealLife:  #1a2a1a → #1e321e
     blockTechnical: #2a1a18 → #321e1c
     blockCode:      #0d1018 (darker dark)
     blockAITutor:   #1e1530 → #261840
     blockNotes:     #1a1810 → #22200c
     All text colors shift to light variants

  3. "Pastel"  → soft, light, airy feel
     blockLayman:    #f0f7ff → #e8f2ff
     blockRealLife:  #f5fff0 → #eefce8
     blockTechnical: #fff5f0 → #ffeee8
     blockCode:      #1e2d3d (code always dark)
     blockAITutor:   #faf0ff → #f5e8ff
     blockNotes:     #fffff0 → #fefee8

  4. "Forest"  → deep greens and earth tones
     blockLayman:    #e8f5e8 → #dff0df
     blockRealLife:  #fff3e0 → #ffe8c8
     blockTechnical: #f0ece0 → #e8e4d4
     blockCode:      #1a2018 (dark green tinted)
     blockAITutor:   #f0e8f8 → #e8ddf4
     blockNotes:     #faf5e8 → #f5eed8

  5. "Ocean"  → blues, teals, seafoam
     blockLayman:    #e8f4f8 → #deeef5
     blockRealLife:  #e8f8f5 → #ddf4ef
     blockTechnical: #e8eef8 → #dde8f5
     blockCode:      #0d1820 (deep ocean dark)
     blockAITutor:   #f0e8f8 → #e8ddf4
     blockNotes:     #f8f5e8 → #f4eedc

  6. "Saffron"  → warm Indian brand tones (warm for Indian audience)
     blockLayman:    #fff8e8 → #fff3d4
     blockRealLife:  #fff0e0 → #ffe8cc
     blockTechnical: #fff5e8 → #ffede0
     blockCode:      #1e1808 (warm dark)
     blockAITutor:   #fdf0ff → #fae8ff
     blockNotes:     #fffde0 → #fff8cc

═══════════════════════════════════════════════════════
THEME TOGGLE UI COMPONENT:
═══════════════════════════════════════════════════════

FILE: apps/tutorial-app/src/components/ui/ThemeToggle.tsx
'use client' — manages theme preference state

Props: { currentTheme: string, onThemeChange: (theme: string) => void }

Visual:
  Container: flex row, align-items center, gap: 8px
  Label: "Theme:" — font-size 12px, color #718096, font-weight 600

  6 color swatch buttons (one per theme):
    Each: width 22px, height 22px, border-radius 50%
    Color swatches:
      Classic   → #eef4ff with indigo border
      Midnight  → #1a2540 (dark navy)
      Pastel    → #f0f7ff (pale blue)
      Forest    → #e8f5e8 (pale green)
      Ocean     → #e8f4f8 (seafoam)
      Saffron   → #fff8e8 (warm amber)
    Active theme: extra ring — box-shadow: 0 0 0 2px white, 0 0 0 4px {swatchColor}
    Hover: scale(1.15) transition
    Title attribute: theme name (shows on hover as native tooltip)

  Placement options:
    A) In the Navbar — right side, before the avatar
    B) Below the progress bar on the master subtopic page
    
    USE OPTION B (below progress bar) as primary placement.
    Also add a compact version in the Navbar (just 3 dots icon that expands).

═══════════════════════════════════════════════════════
THEME PERSISTENCE:
═══════════════════════════════════════════════════════

Student's theme choice is stored in:
  1. localStorage key: 'rth-tutorial-theme'
     → Instant on next page load (no flash)
     → Available even without login

  2. If student is logged in: also write to user preferences via server action:
     updateUserPreference('tutorial_theme', themeName)
     → Stored in users table: preferences JSONB column
     → Syncs across devices

Loading order (to prevent flash of wrong theme):
  1. Read localStorage synchronously in a <script> tag in <head>
     (before React hydration — prevents theme flash)
  2. Apply theme class to <html> element: <html data-tutorial-theme="classic">
  3. CSS variables react to data-tutorial-theme attribute
     Use CSS attribute selectors:
       [data-tutorial-theme="midnight"] { --block-layman-bg: #1a2540; ... }
       [data-tutorial-theme="classic"]  { --block-layman-bg: #eef4ff; ... }
  4. All block components use CSS variables for background:
       style={{ background: 'var(--block-layman-bg)' }}
     This way theme switch is instant — no re-render needed

═══════════════════════════════════════════════════════
CSS VARIABLES SETUP (in globals.css):
═══════════════════════════════════════════════════════

:root, [data-tutorial-theme="classic"] {
  --block-layman-bg: linear-gradient(135deg, #eef4ff 0%, #e8f0ff 100%);
  --block-reallife-bg: linear-gradient(135deg, #fff8e8 0%, #fff3d4 100%);
  --block-technical-bg: linear-gradient(135deg, #fff0ee 0%, #ffe8e4 100%);
  --block-code-bg: linear-gradient(135deg, #1e2d3d 0%, #0d1018 100%);
  --block-aitutor-bg: linear-gradient(135deg, #f5eeff 0%, #ede0ff 100%);
  --block-notes-bg: linear-gradient(135deg, #fffde7 0%, #fff8e1 100%);
  --block-text-primary: #1a2340;
  --block-text-secondary: #4a5568;
}

[data-tutorial-theme="midnight"] {
  --block-layman-bg: linear-gradient(135deg, #1a2540 0%, #1e2e50 100%);
  --block-reallife-bg: linear-gradient(135deg, #1a2a1a 0%, #1e321e 100%);
  --block-technical-bg: linear-gradient(135deg, #2a1a18 0%, #321e1c 100%);
  --block-code-bg: linear-gradient(135deg, #0d1018 0%, #060810 100%);
  --block-aitutor-bg: linear-gradient(135deg, #1e1530 0%, #261840 100%);
  --block-notes-bg: linear-gradient(135deg, #1a1810 0%, #22200c 100%);
  --block-text-primary: #e8edf8;
  --block-text-secondary: #a0aec0;
}

[data-tutorial-theme="pastel"] {
  --block-layman-bg: linear-gradient(135deg, #f0f7ff 0%, #e8f2ff 100%);
  --block-reallife-bg: linear-gradient(135deg, #f5fff0 0%, #eefce8 100%);
  --block-technical-bg: linear-gradient(135deg, #fff5f0 0%, #ffeee8 100%);
  --block-code-bg: linear-gradient(135deg, #1e2d3d 0%, #0d1018 100%);
  --block-aitutor-bg: linear-gradient(135deg, #faf0ff 0%, #f5e8ff 100%);
  --block-notes-bg: linear-gradient(135deg, #fffff0 0%, #fefee8 100%);
  --block-text-primary: #2d3748;
  --block-text-secondary: #4a5568;
}

[data-tutorial-theme="forest"] {
  --block-layman-bg: linear-gradient(135deg, #e8f5e8 0%, #dff0df 100%);
  --block-reallife-bg: linear-gradient(135deg, #fff3e0 0%, #ffe8c8 100%);
  --block-technical-bg: linear-gradient(135deg, #f0ece0 0%, #e8e4d4 100%);
  --block-code-bg: linear-gradient(135deg, #1a2018 0%, #0d120c 100%);
  --block-aitutor-bg: linear-gradient(135deg, #f0e8f8 0%, #e8ddf4 100%);
  --block-notes-bg: linear-gradient(135deg, #faf5e8 0%, #f5eed8 100%);
  --block-text-primary: #1a2a1a;
  --block-text-secondary: #4a5a3a;
}

[data-tutorial-theme="ocean"] {
  --block-layman-bg: linear-gradient(135deg, #e8f4f8 0%, #deeef5 100%);
  --block-reallife-bg: linear-gradient(135deg, #e8f8f5 0%, #ddf4ef 100%);
  --block-technical-bg: linear-gradient(135deg, #e8eef8 0%, #dde8f5 100%);
  --block-code-bg: linear-gradient(135deg, #0d1820 0%, #060e14 100%);
  --block-aitutor-bg: linear-gradient(135deg, #f0e8f8 0%, #e8ddf4 100%);
  --block-notes-bg: linear-gradient(135deg, #f8f5e8 0%, #f4eedc 100%);
  --block-text-primary: #0d2a3a;
  --block-text-secondary: #2a4a5a;
}

[data-tutorial-theme="saffron"] {
  --block-layman-bg: linear-gradient(135deg, #fff8e8 0%, #fff3d4 100%);
  --block-reallife-bg: linear-gradient(135deg, #fff0e0 0%, #ffe8cc 100%);
  --block-technical-bg: linear-gradient(135deg, #fff5e8 0%, #ffede0 100%);
  --block-code-bg: linear-gradient(135deg, #1e1808 0%, #100e04 100%);
  --block-aitutor-bg: linear-gradient(135deg, #fdf0ff 0%, #fae8ff 100%);
  --block-notes-bg: linear-gradient(135deg, #fffde0 0%, #fff8cc 100%);
  --block-text-primary: #2a1a00;
  --block-text-secondary: #5a4010;
}

IMPORTANT: Code block background is ALWAYS dark (never changes with theme).
Code block text colors are ALWAYS light (white/cyan/green on dark).
Only the 5 non-code blocks change with theme.
```

---

## PROMPT 15F — Animation & Micro-Interaction Specifications

```
These animations make the page feel alive and premium. Implement all of them.

═══════════════════════════════════════════════════════
PAGE LOAD ANIMATIONS (master view):
═══════════════════════════════════════════════════════

  On master page load, block preview cards animate in with stagger:
  
  CSS keyframes:
    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  
  Apply to each block card with staggered delay:
    Layman card:    animation-delay: 0ms
    Real-Life card: animation-delay: 60ms
    Technical card: animation-delay: 120ms
    Code card:      animation-delay: 180ms
    AI Tutor card:  animation-delay: 240ms
    Notes card:     animation-delay: 300ms
  
  Duration: 0.3s ease-out
  Fill-mode: both (cards start invisible until their delay)
  Wrap in @media (prefers-reduced-motion: no-preference) {  }

═══════════════════════════════════════════════════════
BLOCK CARD HOVER (master view):
═══════════════════════════════════════════════════════

  On hover of unlocked block card:
    transform: translateY(-3px)
    box-shadow: 0 8px 24px rgba(0,0,0,0.13)
    transition: transform 0.18s ease, box-shadow 0.18s ease
  
  CTA arrow "→" moves right on card hover:
    transform: translateX(4px)
    transition: transform 0.2s ease

═══════════════════════════════════════════════════════
BLOCK UNLOCK ANIMATION:
═══════════════════════════════════════════════════════

  When a block becomes unlocked (after completing previous block):
  
  The lock overlay fades out:
    @keyframes unlockReveal {
      0%   { opacity: 1; filter: blur(2px); }
      50%  { opacity: 0.5; filter: blur(1px); }
      100% { opacity: 0; filter: blur(0); display: none; }
    }
    Duration: 0.5s ease-out
  
  The CTA footer changes from locked to unlocked state with fade:
    transition: background 0.3s, color 0.3s

═══════════════════════════════════════════════════════
PROGRESS BAR ANIMATION:
═══════════════════════════════════════════════════════

  When block is marked complete and completedBlocks count increases:
    Bar fill width transitions: transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1)
  
  Completion pulse (when all 6 complete):
    @keyframes completePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.4); }
      50%       { box-shadow: 0 0 0 8px rgba(245, 166, 35, 0); }
    }
    Applied to Take Quiz button: animation: completePulse 1.5s ease 3 (plays 3 times)

═══════════════════════════════════════════════════════
THEME SWITCH ANIMATION:
═══════════════════════════════════════════════════════

  When student clicks a theme swatch:
    All block card backgrounds transition smoothly:
    transition: background 0.35s ease, color 0.35s ease (on all block body divs)
  
  Active swatch indicator:
    ring appears with: transition: box-shadow 0.2s ease

═══════════════════════════════════════════════════════
DETAIL PAGE ENTRANCE:
═══════════════════════════════════════════════════════

  On detail page load (navigated from master):
    Full block content slides up:
    @keyframes detailReveal {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    Duration: 0.35s ease-out
    Applied to the block content section

  Block nav pills row entrance:
    Each pill staggers in left to right:
    animation-delay: index * 40ms
```

---

## PROMPT 15G — File Creation Order for This Feature

```
Execute in this exact sequence. Do not skip steps.

STEP 1: CSS Variables (globals.css)
  Add all 6 theme variable sets to globals.css
  Add theme-flash-prevention script to layout.tsx <head>
  Test: change data-tutorial-theme on <html> → block colors change

STEP 2: ThemeToggle Component
  Create: src/components/ui/ThemeToggle.tsx
  Test: swatches render, clicking changes data-tutorial-theme, localStorage persists

STEP 3: Block Preview Card Component
  Create: src/components/content/BlockPreviewCard.tsx
  Props: { blockType, blockContent, isCompleted, isLocked, theme, subtopicSlug, domainSlug, subjectSlug, topicSlug }
  Test: all 6 preview card variants render with correct teaser content

STEP 4: Update Master Page Layout
  Update: page.tsx — replace full block renders with BlockPreviewCard grid
  Add scroll-position save on card click
  Add scroll-position restore on mount
  Test: clicking a card navigates to detail route

STEP 5: Block Detail Page Route
  Create: src/app/(learning)/learn/[d]/[s]/[t]/[sub]/[blockType]/page.tsx
  Create: src/components/layout/BlockDetailLayout.tsx
  Test: /js-promises/layman loads layman full content

STEP 6: Block Navigation Pills
  Create: src/components/content/BlockNavPills.tsx
  Test: active pill highlighted, locked pills greyed, clicking navigates

STEP 7: Back Navigation
  Add back button to DomainBreadcrumb (detail variant)
  Test: back button returns to master page at correct scroll position

STEP 8: Animations
  Add all CSS keyframes to globals.css
  Apply stagger delays to BlockPreviewCard components
  Test: cards animate on load, hover effects work, unlock animation triggers

STEP 9: Theme + Domain Integration
  Ensure theme preference overrides domain theme for block body colors
  Domain theme still controls: breadcrumb gradient, sidebar accent, progress fill
  Student theme controls: block body backgrounds only
  Test: switch theme → only block bodies change, breadcrumb stays domain-colored

STEP 10: Verification Checklist
  □ Master page shows 6 preview cards with correct teaser content
  □ Locked cards show overlay with correct "Complete X first" message
  □ Clicking unlocked card navigates to /[subtopicSlug]/[blockType]
  □ Detail page shows full content for correct block
  □ Back button returns to master page at saved scroll position
  □ Block nav pills show correct completion state for all 6 blocks
  □ Clicking a pill navigates to that block's detail page
  □ Mark as Read button marks block complete in Redis
  □ After completing a block → back to master → that card shows ✓ Completed
  □ Progress bar count increments correctly on master page
  □ All 6 themes render correctly (Classic, Midnight, Pastel, Forest, Ocean, Saffron)
  □ Theme switch is instant (CSS variables, no re-render)
  □ Theme persists in localStorage across page refreshes
  □ Theme persists in user preferences DB across devices
  □ Code block background stays dark in ALL themes
  □ Block card stagger animation plays on master page load
  □ Hover effect works on all unlocked cards
  □ Unlock animation plays when previous block is completed
  □ Lighthouse mobile score ≥ 90 after this feature
  □ pnpm typecheck:all → zero errors
  □ pnpm test → 1138+ passing
```

---

## PROMPT 15H — Rules to Add to CLAUDE.md

```
Add this section to apps/tutorial-app/CLAUDE.md
under: ## TutorialSubtopicPage Rules → NEW subsection: ### Navigation & Theme Rules

### Navigation & Theme Rules

MASTER vs DETAIL view:
  - Master page (/learn/.../[subtopicSlug]) shows 6 preview cards — NEVER full blocks
  - Detail page (/learn/.../[subtopicSlug]/[blockType]) shows ONE full block
  - Never render full block content on the master page — only teaser previews
  - Master page uses BlockPreviewCard component — NEVER the full block components
  - Detail page uses full block components — never truncated

Routing:
  - Back navigation ALWAYS uses router.back() first, not router.push()
  - Scroll position saved to sessionStorage before navigating to detail
  - Scroll position restored from sessionStorage on master page mount
  - Detail page redirects to master if block is not accessible (locked)

Theme system:
  - Block body backgrounds come from CSS variables — NEVER hardcoded hex in JSX
  - Domain theme controls: breadcrumb, sidebar, progress bar, quiz button
  - Student theme preference controls: block card backgrounds ONLY
  - Code block background is ALWAYS dark — exempt from all theme changes
  - Theme applied via data-tutorial-theme attribute on <html> element
  - Theme loaded from localStorage synchronously (before hydration) to prevent flash

BlockPreviewCard rules:
  - Preview text ALWAYS truncated (max 120 chars for explanations, 100 for scenarios)
  - CTA footer ALWAYS present on every card
  - Locked cards show overlay — block header is visible, content is blurred
  - No block-specific logic in BlockPreviewCard — it receives all content as props

BlockNavPills rules:
  - Shows on detail page only — not on master page
  - Completed blocks show green, locked blocks show grey with 🔒
  - Active block shows filled theme color
  - Clicking locked pill does nothing (cursor: not-allowed)
  - Notes pill is ALWAYS unlocked and clickable
```

---

## PROMPT 16 — Version A: The "Aesthetic Maverick" (Premium Glassmorphism)

> Use this version for a "Wow" student experience. It features high-end effects inspired by Apple and modern EdTech leaders.

### CSS Architecture
```css
/* Core Wow Tokens */
:root[data-design-version="aesthetic"] {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: 1px solid rgba(255, 255, 255, 0.2);
  --glass-blur: blur(20px);
  --premium-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --accent-glow: 0 0 15px var(--sidebar-accent);
}

.premium-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--premium-shadow);
  border-radius: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12);
}
```

### Aesthetic Requirements
1. **Typography**: Use 'Outfit' for headers with `letter-spacing: -0.02em`. Use 'Inter' for body text with `line-height: 1.6`.
2. **Icons**: Use high-fidelity dual-tone SVG icons or Lottie animations for block headers.
3. **Gradients**: Use "Mesh Gradients" for background section highlights to create depth.
4. **Micro-interactions**: Implement a "magnetic" feel on the 'Take Quiz' button (follows cursor slightly).

---

## PROMPT 17 — Version B: The "Logic Legend" (Minimalist Enterprise)

> Use this version for high-performance, distraction-free learning environment.

### CSS Architecture
```css
:root[data-design-version="logic"] {
  --solid-bg: #ffffff;
  --solid-border: 1px solid #e2e8f0;
  --enterprise-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.logic-card {
  background: var(--solid-bg);
  border: var(--solid-border);
  box-shadow: var(--enterprise-shadow);
  border-radius: 8px;
}
```

### Functional Requirements
1. **Speed**: Zero `backdrop-filter` or heavy gradients to ensure 100/100 Lighthouse performance.
2. **Contrast**: AA/AAA WCAG compliance on all text-background pairings.
3. **Precision**: "Pixel-perfect" alignment with fixed 8px grid system.

---

## PROMPT 18 — Version Selection & Preference Persistence

1. **Detection**: Read `localStorage.getItem('rth-design-version')`. Default to 'aesthetic'.
2. **Toggle**: Add "Design Mode" toggle in settings (Aesthetic vs. Logic).
3. **Persistence**: Save selection to `users.preferences.design_version` in DB via server action.


*Prompt Version: 2.0 | Extends: tutorial-subtopic-page_prompt.md Prompts 1–14*
*New in v2.0: Section preview cards, block detail navigation, multi-theme toggle*
*Status: READY FOR IMPLEMENTATION — append to tutorial-subtopic-page_prompt.md*


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


---

## Updated File Creation Order (Execute in This Sequence)

```
STEP 1:  PROMPT 2  → Lock TypeScript types in packages/types/
STEP 2:  PROMPT 12 → Create domain-themes.ts
STEP 3:  PROMPT 10 → Create BlockHeader.tsx and NotesBlock.tsx
STEP 4:  PROMPT 16/17 → Setup CSS Tokens for Version A/B in globals.css
STEP 5:  PROMPT 4  → Create layout shell (Navbar, Breadcrumb, body structure)
STEP 6:  PROMPT 5  → Create TutorialSidebar.tsx
STEP 7:  PROMPT 6  → Create SubtopicHeader.tsx (progress bar)
STEP 8:  PROMPT 7  → Create LaymanBlock.tsx (most important)
STEP 9:  PROMPT 8  → Create RealLifeBlock.tsx + TechnicalBlock.tsx
STEP 10: PROMPT 9  → Create CodeExplanationBlock.tsx + AITutorBlock.tsx
STEP 11: PROMPT 11 → Create server actions (progress tracking)
STEP 12: PROMPT 3  → Wire server-side data fetching in page.tsx
STEP 13: PROMPT 13 → Update CLAUDE.md with all new rules
STEP 14: PROMPT 14 → Run full verification checklist
STEP 15: PROMPT 18 → Implement Version Selection logic
```

---

*Prompt Version: 2.1 | Includes Version A (Aesthetic Maverick) and Version B (Logic Legend)*
*Status: READY FOR CLAUDE CODE EXECUTION*

---

## PROMPT 19 â€” Image Support System

### Storage Configuration

Cloudflare R2 is already configured in this project. Do not add or rename storage env vars.

Use only these exact variable names:

```bash
STORAGE_PROVIDER="r2"
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_ENDPOINT
```

Use `R2_ENDPOINT` directly in any S3-compatible client. Reuse an existing storage abstraction if one already exists.

### Scope

- Add image support to 5 of 6 content blocks
- `ai_tutor` stays image-free
- Support two image types:
  - `svg_standard` for hardcoded SVG components
  - `r2_custom` for admin-uploaded images via Cloudflare R2

### Canonical Data Rules

- `notes`, `layman`, `real_life`, `technical`, and `code` may each include an optional `image`
- `svg_standard` requires `svgKey` and must not include `url`
- `r2_custom` requires `url` and must not include `svgKey`
- All non-decorative images require descriptive `alt` text
- CDN URLs must use the trusted `https://cdn.realtutorialhub.com/` base

### Files to Update Later

- `content-json-schema.md` for `ContentImage` and image-aware content types
- `PHASE-T1-TUTORIAL-FOUNDATION.md` for the future image migration note
- `LMS-VIBE-CODING-PROMPTS.md` for the T8 admin upload workflow

### Prompt 19 Rollout Note

When this feature is implemented, the T8 admin editor should:

- let admins choose SVG or R2 image mode
- preview the image before publish
- store the final image data in JSON content
- keep the AI Tutor block unchanged

The image migration filename is `0001_image_support.sql`.
