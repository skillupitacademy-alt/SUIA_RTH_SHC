# Product Requirements Document (PRD): Unified Auth System

## 1. Product Overview
**Document Intent:** This PRD provides structural, visual, and behavioral requirements for a premium, brand-agnostic authentication system (Login/Signup) serving both **RealTutorialHub** and **SkillUp IT Academy**.

**Objective:** To provide a high-fidelity, frictionless entry point for students that visually reinforces the brand identity while maintaining 100% code parity across the monorepo.

**Architectural Constraint:** The implementation must follow the `BRAND_AGNOSTIC_ARCHITECTURE.md` model, utilizing a single shared `AuthPage.tsx` component driven by `brandConfig.ts`.

---

## 2. Brand Definitions (Data-Driven Injection)

The system must render two distinct brand identities from the same structural template:

### Variant A: RealTutorialHub (AI Tutor)
*   **Primary Color:** Orange (`#d03f00` / `brand.primaryColor`)
*   **Showcase Icon:** AI Tutor (Representing the AI bot)
*   **Value Prop Copy:** "Unlock Your Potential with AI-Powered Learning"
*   **Heading Copy:** "Learn Smarter. Not Harder."

### Variant B: SkillUp IT Academy (Live Mentor)
*   **Primary Color:** Pink (`#f54a8d` / `brand.primaryColor`)
*   **Showcase Icon:** Live Mentor (Representing the expert community)
*   **Value Prop Copy:** "Learn from IT experts, advance your career."
*   **Heading Copy:** "Skill Up. Stand Out."

---

## 3. Page Layout & Information Architecture

### A. Split-Screen Layout (Desktop)
*   **Left Side (Brand Showcase):** 
    *   **Background:** Clean, minimal white background with subtle ambient orbs in the `PrimaryColor`.
    *   **Brand Identity:** Large, high-fidelity 3D-style icon + Bold Heading + Value Prop subtext.
    *   **Trust Module:** A secondary "Showcase Card" (e.g., "AI Tutor is ready") + Social Proof (e.g., "10k+ Learners Joined").
*   **Right Side (Interactive Form):**
    *   **Form Container:** A glassmorphic card with deeply layered shadows.
    *   **Heading:** "Welcome back" (Login) or "Get started" (Signup).
    *   **Inputs:** Premium stylized fields for Name (Signup only), Email, and Password.
    *   **Action Indicator:** Primary CTA Button in `PrimaryColor` with hover effects.
    *   **Social Auth Bridge:** Google and GitHub login bridges.

### B. Mobile Adaptive Layout
*   Stacked configuration.
*   The Brand Showcase transitions to a simplified header.
*   The Form Card becomes full-width with generous padding.

---

## 4. Technical Requirements & Rules

### 1. Unified Component Structure
-   Component Path: `src/share-branding/AuthPage.tsx`
-   Pattern: **Pattern A (Props-based)**.

### 2. Accessibility (WCAG 2.1 AA)
-   **Contrast:** All text over white or colored backgrounds must maintain a `4.5:1` ratio. Use `PrimaryColorDark` for text elements.
-   **Landmarks:** Use `<main>` and `<section>` tags appropriately.
-   **Headings:** Logical hierarchy (`h1` for form title, `h2` for sidebar content).

### 3. Responsive & Premium Polish
-   Use `framer-motion` for fluid mode switching (Login ↔ Signup).
-   No hardcoded brand values in the shared component.
-   Inline styles for brand color injection to ensure Next.js hydration safety.

---

## 5. Verification Plan
-   **Brand Check:** Verify Orange theme on RTH and Pink theme on SkillUp.
-   **Routing:** Confirm `/login` and `/signup` routes in both apps are functional.
-   **Responsiveness:** Verify layouts on 320px (Mobile) and 1920px (Desktop).
-   **Audit:** Zero console errors in development mode.
