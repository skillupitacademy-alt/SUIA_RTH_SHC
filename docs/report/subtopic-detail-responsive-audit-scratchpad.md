# Subtopic Detail Responsive Audit Scratchpad

Date: 2026-05-02

Routes:
- `http://localhost:3003/start-learning/subtopic/notes?tab=<tab>`
- `http://localhost:3004/start-learning/subtopic/notes?tab=<tab>`

Tabs audited:
- `notes`
- `layman`
- `real-life`
- `technical-deep-dive`
- `code-example`
- `assignments`
- `project`
- `quiz`
- `ai-tutor`
- `progress`

Checklist source:
- `docs/completeproject/SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md`

## Guide Compliance

- Option 2: both brands use the same shared `SubtopicNotesPage` UI and shared note-tab components.
- Option 3: both brands use the same `SubtopicNotesViewData` UI-facing model from `subtopicNotesData.ts`.
- Option 4: app routes stay thin and pass the prepared shared data into the shared UI boundary.
- Brand variation is injected through `brandConfig` and `useBrand`; SkillUp no longer renders hardcoded RealTutorialHub tutor copy.

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
- Checked at `320`, `375`, `768`, and `1280`, including narrow-width 125% zoom cases.

## Result Summary

- Pass: `460/460` automated browser checks passed.
- Pass: no default-layout failures across both brands and all detail tabs.
- Pass: no open-sidebar failures for curriculum or stats sidebars after drawer transition settles.
- Pass: no document-level horizontal overflow at audited breakpoints.
- Pass: no visible child content clips against parent containers.
- Pass: no visible viewport overflow from note content, code blocks, tab footers, assignments, project cards, quiz panels, tutor content, or progress content.
- Pass: RealTutorialHub displays `AI Tutor`; SkillUp displays `Live Mentor` and does not display hardcoded `AI Tutor` copy.

## Issues Found And Fixed

- Detail sidebars were absolute/off-canvas inside the shell and could inflate clipped parent boundaries; both sidebars now use fixed viewport-safe positioning.
- Notes page shell needed `min-w-0`, responsive padding, and wrapping breadcrumbs to prevent nested content pressure.
- Direct `ai-tutor` and `progress` tab URLs had incomplete main content; both now render real shared content.
- Code-heavy tabs had long lines that could pressure containers; code wrappers now use scoped break rules.
- Layman comparison content used a mobile-hostile table; it is now a wrapping card/grid layout.
- Real-life, technical deep dive, code example, assignment, project, and quiz headers/actions now wrap and resize at small widths.
- Technical deep dive diagram/code sections now avoid small-screen clipping.
- Project right sidebar progress/checklist rows now stack or wrap safely at `320px` and `125%` zoom.
- Hardcoded `AI Tutor` labels and hardcoded `RealTutorialHub` code sample copy were moved to brand-driven values.
- Non-ASCII bullets, arrows, and emoji-like artifacts in the audited shared detail UI were replaced with ASCII-safe text.

## Files Reviewed Or Patched

- `apps/realtutorialhub-web/src/app/start-learning/subtopic/notes/page.tsx`
- `apps/skillup-web/src/app/start-learning/subtopic/notes/page.tsx`
- `src/share-branding/SubtopicNotesPage.tsx`
- `src/share-branding/subtopicNotesData.ts`
- `src/share-branding/TutorialEngine/components/notes/NotesLeftSidebar.tsx`
- `src/share-branding/TutorialEngine/components/notes/NotesRightSidebar.tsx`
- `src/share-branding/TutorialEngine/components/notes/NotesMainContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/LaymanExplanationContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/RealLifeExamplesContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/TechnicalDeepDiveContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/CodeExampleContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/AssignmentContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/ProjectContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/QuizContent.tsx`
- `src/share-branding/TutorialEngine/components/notes/TabFooter.tsx`
- `src/share-branding/TutorialEngine/components/subtopic/SubtopicTopBar.tsx`

## Audit Notes

- Development-only React Query Devtools and Next.js overlay controls were excluded from shared UI placement checks.
- Hidden off-canvas drawer contents were excluded from visible-layout checks; opened drawer states were audited separately.
- Drawer checks wait for the 300ms transition to settle before measuring final parent-child boundaries.
- Decorative SVG primitives were excluded where they do not create document/body overflow or visible content clipping.

## Verification

- Automated audit output: `docs/report/subtopic-detail-responsive-audit-results.json`
- Summary:
  - default layout entries: `260`, failures: `0`
  - open sidebar entries: `200`, failures: `0`
  - total entries: `460`, failures: `0`
