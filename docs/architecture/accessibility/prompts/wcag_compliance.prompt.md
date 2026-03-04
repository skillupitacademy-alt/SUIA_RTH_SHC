# AI Implementation Prompt: WCAG 2.1 AA Accessibility Compliance

**Role**: You are a Senior Frontend Accessibility Engineer specializing in WCAG 2.1 compliance for educational platforms.

**Task**: Implement comprehensive WCAG 2.1 Level AA accessibility across a Next.js quiz platform with 3 apps (web-app, admin-app, api-server).

## Core Requirements
1.  **Keyboard Navigation**:
    - Audit all interactive elements in `apps/web-app` and `apps/admin-app` for keyboard operability.
    - Add visible focus indicators (`:focus-visible` styles) to all buttons, links, and form controls.
    - Implement focus trapping in all modals and drawers using a `useFocusTrap` hook.
    - Add "Skip to main content" links to every page layout.

2.  **ARIA Labels & Semantic HTML**:
    - Replace all `<div onClick>` with `<button>` or `<a>` elements.
    - Add `aria-label` or `aria-labelledby` to all icon-only buttons.
    - Add `aria-live="polite"` to the exam timer and question counter components.
    - Ensure every form input has an associated `<label>` and error messages use `aria-describedby`.
    - Validate heading hierarchy (single `<h1>`, no skipped levels).

3.  **Color Contrast & Visual**:
    - Audit all color tokens in `globals.css` for 4.5:1 contrast ratio.
    - Add pattern/texture differentiation to chart components (not color-only).
    - Ensure text remains readable at 200% zoom.

4.  **Motion & Timing**:
    - Wrap all `framer-motion` animations in a `prefers-reduced-motion` media query check.
    - Add time extension capability to the exam timer for accessibility accommodations.

5.  **Automated Testing**:
    - Install `@axe-core/react` for development-time accessibility auditing.
    - Add `jest-axe` matchers to the existing Vitest test suite for automated a11y checks.

## Technical Stack Context
- **Framework**: Next.js 16 App Router (React Server Components + Client Components).
- **Styling**: Tailwind CSS.
- **Testing**: Vitest + React Testing Library.
- **Animation**: framer-motion.
- **Apps**: `apps/web-app` (student-facing), `apps/admin-app` (admin dashboard), `apps/api-server`.

## Prompt Instruction
"Audit and fix all accessibility issues across the web-app and admin-app. Start with `apps/web-app/src/app/(authenticated)/` routes (quiz interface, dashboard, reports) since they are student-facing and highest priority. Then address `apps/admin-app`. Install axe-core for automated auditing and add a11y test matchers to the Vitest config."
