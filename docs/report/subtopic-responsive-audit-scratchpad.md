# Subtopic Responsive Audit Scratchpad

Date: 2026-05-01

Routes:
- `http://localhost:3003/start-learning/subtopic`
- `http://localhost:3004/start-learning/subtopic`

Checklist source:
- `docs/completeproject/SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md`

## Breakpoints Audited

Default zoom:
- `320`
- `375`
- `480`
- `640`
- `768`
- `1024`
- `1280`
- `1440`
- `1920`

125% zoom:
- `320`
- `768`
- `1280`
- `1920`

Open sidebar states:
- `left-open`
- `right-open`
- Checked at `320`, `375`, `480`, `768`, `1280`, and `1920`, including narrow-width 125% zoom cases.

## Result Summary

- Pass: both subtopic pages render the same shared `SubtopicViewPage` layout.
- Pass: both app routes remain thin route consumers using shared brand config and shared subtopic view data.
- Pass: RealTutorialHub displays `AI Tutor`; SkillUp displays `Live Mentor` with no visible RealTutorialHub tutor copy.
- Pass: no document-level or body-level horizontal overflow at any audited breakpoint.
- Pass: no visible shared subtopic UI elements overflow the viewport.
- Pass: no shared subtopic child component overflows or crops against a bounded parent container.
- Pass: default layout and both open sidebar states are clean at the audited zoom checkpoints.

## Issues Found And Fixed

- Mobile topbar controls exceeded the available width at `320px`; lower-priority labels now hide progressively.
- Tablet topbar course breadcrumbs clipped at `768px`; breadcrumbs now appear from `lg` where enough room exists.
- The header title, metadata, and progress summary used row layout too early; they now stack/wrap until `lg`.
- The roadmap used fixed-width two-row card rails and arrows; it now uses a responsive grid with contained square cards.
- Off-canvas sidebars used absolute/fixed widths that could crop or inflate parent boundaries; they now use fixed positioning plus safe small-screen viewport widths.
- Sidebar and right-panel rows now use `min-w-0`, wrapping text, and shrink-stable badges/icons.
- SkillUp-specific tutor copy now comes from `brand.tutorLabel` instead of hardcoded `AI Tutor`.
- Non-ASCII bullet/emoji content in the audited subtopic UI was replaced with ASCII-safe text.

## Current Responsive State

Files reviewed or patched:
- `apps/realtutorialhub-web/src/app/start-learning/subtopic/page.tsx`
- `apps/skillup-web/src/app/start-learning/subtopic/page.tsx`
- `src/share-branding/SubtopicViewPage.tsx`
- `src/share-branding/subtopicPageData.ts`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicTopBar.tsx`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicSidebar.tsx`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicRightPanel.tsx`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicHeader.tsx`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicContentGrid.tsx`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicTabs.tsx`
- `src/share-branding/TutorialEngine/components/notes/TabFooter.tsx`

Validated behaviors:
- Topbar action buttons, brand mark, dashboard link, streak, XP, and profile controls remain contained at mobile, tablet, and desktop widths.
- Header title, description, metadata chips, and progress summary wrap without touching or crossing the card boundary.
- Roadmap cards keep icon, title, and XP badge inside fixed square card dimensions.
- Footer engine badges wrap inside the content column without horizontal clipping.
- Curriculum and stats sidebars fit inside the viewport when opened at the narrowest zoomed checkpoints.
- Sidebar rows, progress cards, achievements, weakness analysis, tutor input, and example chips stay inside their parent panels.

## Audit Notes

- Development-only React Query Devtools controls are excluded from shared page UI checks when present.
- Hidden off-canvas sidebar states are excluded from visible-layout checks; opened sidebars were audited separately.
- Decorative SVG primitives are excluded from content overflow findings when they do not affect document/body overflow or visible UI placement.

## Verification

- Automated audit output: `docs/report/subtopic-responsive-audit-results.json`
- Type checks:
  - `pnpm --filter @quiz/realtutorialhub-web type-check`
  - `pnpm --filter @quiz/skillup-web type-check`

Confirmed for all audited entries:
- `bodyOverflow=false`
- `docOverflow=false`
- `viewportOverflowCount=0`
- `clippedContentCount=0`
- `parentBoundaryCount=0`
