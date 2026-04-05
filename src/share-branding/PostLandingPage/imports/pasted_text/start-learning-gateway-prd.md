# Product Requirements Document (PRD): Start Learning Gateway

## 1. Product Overview
**Document Intent:** This PRD provides complete structural, logical, and copy requirements to guide Figma/UI AI agents in generating a high-fidelity replica or evolution of the "Start Learning" gateway page. 

**Objective:** The Gateway serves as a mandatory Mode Selector. Once a student enters the ecosystem, they must intentionally choose between the strict assessment environment (**Exam Engine**) or the guided remediation environment (**Tutorial Engine**).

**Architectural Constraint:** The design *must* adhere to the `BRAND_AGNOSTIC_ARCHITECTURE.md` model. The Figma file should ideally be designed using a base wireframe, with two distinct "Theme Variants" applying the color and text substitutions outlined below.

---

## 2. Brand Definitions (Data-Driven Injection)
Figma must account for these two brand parameters rendering into the exact same structural container:

### Variant A: RealTutorialHub
*   **Primary Color:** Orange (`#d03f00` / `brand.primaryColor`)
*   **Secondary Color:** Deep Blue
*   **Unique Terminology:** "AI Tutor" (used for guidance/help copy)

### Variant B: SkillUp IT Academy
*   **Primary Color:** Bright Pink (`#f54a8d` / `brand.primaryColor`)
*   **Secondary Color:** Navy Blue
*   **Unique Terminology:** "Live Mentor" (used for guidance/help copy)

---

## 3. Page Layout & Information Architecture

The UI is divided into 5 major structural components:

### A. Navigation Header
*   **Left:** Brand Icon (Graduation Cap in Secondary Color) + Dynamic Brand Name.
*   **Right:** "Return Home" text button. 
*   **Styling:** Sticky, frosted glassmorphism effect (`backdrop-blur`).

### B. Hero Section (Split Layout)
*   **Left Side (Text & CTAs):** 
    *   **Headline:** "Enter the Ecosystem." (Massive typography, brand-colored text).
    *   **Subheadline:** "Take strict diagnostic assessments in the Exam Engine to identify your exact knowledge bounds, then jump into guided tutorial sessions with your [AI Tutor / Live Mentor]."
    *   **CTAs:** Two prominent buttons:
        1.  `Enter Exam Engine` (Target icon, deeply shaded Primary Color).
        2.  `Enter Tutorial Engine` (Brain icon, outlined/white background).
*   **Right Side (Visual Mockup):**
    *   A floating, highly-styled dashboard bounding box.
    *   Shows a "Diagnostic Testing Active" progress bar dropping into an "Awaiting Engine Transfer" state, visually bridging the gap between Exam and Tutorial modes.

### C. The Learning Engine Loop (6-Block Grid)
A 3x2 or 2x3 grid of glassmorphic cards representing the ecosystem lifecycle:
1.  **Diagnostic Exams** (Target Icon): "Take rigorous timed assessments to map your exact bounds in the Exam Engine."
2.  **Weakness Analysis** (Trending Up Icon): "Internal algorithms instantly compute and isolate the specific topics you failed."
3.  **[Tutor Label] Transfer** (Brain Icon): "Transition natively into the Tutorial Engine focused explicitly on those weak topics."
4.  **Interactive Coding** (File Edit Icon): "Re-learn fundamentals by repairing adaptive assignment codes inside actual editors."
5.  **Concept Mastery** (Lightbulb Icon): "Validate your newly fortified knowledge against fresh, dynamically generated tests."
6.  **Final Certification** (Award Icon): "Conquer the unified Exam Engine capstone module to earn your verifiable credential."

### D. Smart Remediation & Telemetry (Right Column / Stacked)
A module demonstrating the synchronization between the two engines:
*   **Title:** "Engine Synchronization"
*   **Content:** A mock UI widget showing 3 rows of data:
    *   Row 1: "Linked Lists Architecture" ➔ Badge: **FAILED EXAM** (Red/Pink)
    *   Row 2: "Async Wait Promises" ➔ Badge: **WEAK DIAGNOSTIC** (Amber)
    *   Row 3: "Map & Filter Recursion" ➔ Badge: **FULLY MASTERED** (Emerald)
*   **Interaction:** A CTA at the bottom: "Auto-Deploy Tutorial Sequence ➔"

### E. Capability Logic Table (Bottom Right)
A comparison table clearly defining the architectural boundaries between the two engines:
*   **Headers:** Capabilities | EXAM | TUTORIAL
*   **Rows:**
    *   Timed Diagnostic Tracking (Exam: ✓, Tutorial: ✗)
    *   Automated Weakness Flags (Exam: ✓, Tutorial: ✗)
    *   [AI Tutor / Live Mentor] Guidance (Exam: ✗, Tutorial: ✓)
    *   Interactive Code Sandboxes (Exam: ✗, Tutorial: ✓)
    *   Issue Official Certification (Exam: ✓, Tutorial: ✗)

### F. Exam Difficulty Matrix (Bottom Left)
A visual module showing unlockable difficulty tiers:
*   **Concept:** "Unlock higher diagnostic difficulty levels by fully graduating your Tutorial Engine blocks."
*   **Badges:** 4 distinct visual badges mapping to Levels 1.0 (Base), 2.0 (Inter), 3.0 (Upper), and 4.0 (Pro).

---

## 4. UI/UX Directives for Figma AI
1.  **No Hardcoded Logos:** Do not hardcode a massive RTH or SkillUp logo into the main page body. Text must drive the brand context.
2.  **Glassmorphism:** Emphasize heavily frosted backgrounds (`white/80` or `white/95`) floating over subtle ambient colored orbs in the background.
3.  **Visual Continuity:** The design should feel like a direct continuation of the Landing Page aesthetic (high contrast, generous padding, modern tech/SaaS spacing).
4.  **WCAG Contrast:** Ensure that any text placed over the `PrimaryColor` or `SecondaryColor` backgrounds maintains a `4.5:1` contrast ratio. Use pure white text on deep branding colors, and deep slate/gray text on light pastel backgrounds.
