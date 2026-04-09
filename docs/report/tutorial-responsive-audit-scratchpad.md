# Tutorial Responsive Audit Scratchpad

Date: 2026-04-08
Route: `http://localhost:3003/tutorial`
Checklist sources:
- `docs/completeproject/responsive-audit-checklist.md`
- `docs/completeproject/responsive-guidelines.md`
- `docs/completeproject/responsive-engineering-system.md`

## Breakpoints audited

`320, 375, 480, 640, 768, 1024, 1280, 1440, 1920`

## Result summary

- Pass: no page-level horizontal overflow at any audited breakpoint.
- Pass: `document.documentElement.scrollWidth <= window.innerWidth` at every audited breakpoint.
- Pass: `125%` zoom validation is clean at `320`, `768`, `1280`, and `1920`.
- Pass: cards, forms, sidebar content, and drawer content remain readable and contained across the audited widths.

## Actual issue found and fixed

- The desktop tutorial layout used `lg:ml-[260px]` on the main content shell while the page also constrained content with a centered `max-w-[1200px]` container.
- At desktop widths, especially around `1280`, that offset pushed the content column too far right and clipped the `Advanced` assignment path card.
- The page still reported `bodyOverflow=false` and `docOverflow=false` because `overflow-x-hidden` masked the spill, which does not satisfy the audit checklist.
- Fix applied in `src/share-branding/TutorialEnginePage.tsx`:
  - replaced the desktop left margin layout with internal desktop left padding so the content column now fits beside the fixed sidebar instead of rendering outside the viewport

## Current responsive state

Files reviewed for this route:
- `apps/realtutorialhub-web/src/app/tutorial/page.tsx`
- `src/share-branding/TutorialEnginePage.tsx`
- `src/share-branding/TutorialEngine/components/Sidebar.tsx`
- `src/share-branding/TutorialEngine/components/LearnerFlowDashboard.tsx`
- `src/share-branding/TutorialEngine/components/CurriculumSection.tsx`
- `src/share-branding/TutorialEngine/components/FacultySupport.tsx`
- `src/share-branding/TutorialEngine/components/AITutorDrawer.tsx`

Validated behaviors:
- The learner progress panel and all three assignment path buttons are fully visible on desktop after the layout fix.
- Mobile navigation remains usable through tablet widths, with the menu button present and the curriculum drawer content wrapping correctly.
- Curriculum cards, code example, live session form, and project assignment rows stay within parent containers without visible spill.
- Typography remains readable at the required checkpoints of `320`, `768`, `1280`, and `1920`.

## Remaining notes

- Raw DOM scans still report off-canvas items:
  - the hidden mobile sidebar at smaller widths
  - the hidden AI tutor drawer at desktop widths
- Those are expected because they are translated off-screen until opened; they do not create page overflow or visible misalignment in the default page state.

## Verification snapshot

- Automated audit output: `docs/report/tutorial-responsive-audit-results.json`
- Confirmed for every audited breakpoint:
  - `docOverflow=false`
  - `bodyOverflow=false`
- Confirmed for `125%` zoom at `320`, `768`, `1280`, `1920`:
  - `docOverflow=false`
  - `bodyOverflow=false`
