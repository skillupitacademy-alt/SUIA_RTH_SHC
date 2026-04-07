# Product Requirements Document (PRD): Unified Home Dashboard

## 1. Product Overview
**Document Intent:** This PRD provides complete structural, logical, and copy requirements to guide Figma/UI AI agents in generating a high-fidelity replica of the "Post-Login Home Dashboard".

**Objective:** If the Gateway is the "Mode Selector", the Home Dashboard is the "Telemetry Command Center". It provides instant situational awareness of the student's progress and utilizes algorithmic deduction to prompt the Single Next Best Action.

**Architectural Constraint:** The design *must* adhere strictly to the `BRAND_AGNOSTIC_ARCHITECTURE.md` model. The Figma file must be designed using a single unified wireframe layout. Brand distinction is purely handled via Config Injection (colors and typography), not structural divergence.

---

## 2. Universal Theme Directives & Brand Injections

**CRITICAL THEME CONSTRAINT:** BOTH brands operate natively in a highly premium, clean **Light Mode**. There is no "Dark Theme" variant. Both variants must use bright, airy `slate-50` or pure white background substrates, utilizing heavily frosted glass components (`backdrop-blur-xl bg-white/70`) over subtle ambient pastel glows.

### Variant A: RealTutorialHub (RTH)
*   **Theme Mode:** Light / Airy Glassmorphism
*   **Primary Accent Color:** Vibrant Orange (`#d03f00`)
*   **Secondary Accent Color:** Deep Blue
*   **Terminology Injection:** "AI Tutor", "Algorithmic Skill Graph", "System Online"
*   **Ambient Glow:** Soft, highly blurred radial orange meshes drifting quietly behind the content cards.

### Variant B: SkillUp IT Academy
*   **Theme Mode:** Light / Airy Glassmorphism
*   **Primary Accent Color:** Bright Pink (`#f54a8d`)
*   **Secondary Accent Color:** Navy Blue
*   **Terminology Injection:** "Live Mentor", "Career Competency Map", "Welcome to the Academy"
*   **Ambient Glow:** Soft, highly blurred radial pink and blue meshes drifting quietly behind the content cards.

---

## 3. Information Architecture: The SaaS Bento Grid

The UI Abandons legacy vertical-scrolling layouts in favor of a modern "SaaS Bento Box" grid system.

### A. Global Framing
*   **Sticky Left Sidebar Navigation:** Isolated vertical menu containing icons for: Dashboard (Active), Exam Engine, Tutorial Engine, Node Map, Certificates, Settings.
*   **Global App Ribbon (Top):** Minimalist top header housing a highly visible universal Search Bar, a "Day Streak" flame counter, and the User Avatar dropdown.

### B. Workspace Layout (Asymmetric 60/40 Split)
The primary canvas is split into two logical columns populated by heavy-radius (`rounded-[2.5rem]`) glass cards.

#### Column 1: The Engine Feed (60% Width)
*   **1. Hero Action Card (Top):** 
    *   **Concept:** Computes their exact status and serves one massive, unmissable CTA. 
    *   **Copy Matrix:** If failed exam ➔ *"Resume [AI Tutor/Live Mentor] Remediation for Linked Lists"*. If on a streak ➔ *"Take the Level 2.0 Diagnostic Capstone"*.
    *   **Visuals:** Deeply infused with the brand's Primary Color.
*   **2. Engine Synopsis Widget (Middle):** 
    *   **Concept:** A mini progress bar visually tracking their position within the 6-part Learning Engine Loop (Diagnostic ➔ Analysis ➔ Tutor ➔ Code ➔ Master ➔ Certify).
*   **3. Activity Log (Bottom):** 
    *   **Concept:** A cascading list of system updates (e.g., "Passed JavaScript Hooks exam with 82%", "Scheduled Mentorship for Tuesday").

#### Column 2: The Telemetry Stack (40% Width)
*   **4. Competency Radar Chart:**
    *   **Concept:** A multi-axis geometric "Spider Web" or "Hexagon" chart that visually maps their exact strength in different coding disciplines (e.g., Logic, Syntax, Memory, Speed) based *strictly* on Exam Engine metrics. 
    *   **Title:** Takes the brand's specific `Telemetry Label`.
*   **5. Capstone Unlock Widget:**
    *   **Concept:** A gamification card showing a locked "Official Certification" badge and a progress ring (e.g., "75% to Tier 2 Unlock").

---

## 4. UI/UX Figma Generation Rules

1.  **Strictly No Dark Mode Assets:** Figma must not interpret the RTH Orange as a dark mode prompt. Rely heavily on white and light grays `#f8fafc`. Use the bright primary colors purely for active borders, icons, text highlights, and massive CTA buttons.
2.  **Card Elevation:** Do not use heavy black drop shadows. Emulate physical depth by using dual-layer styling: a 1px inner white sheen (`inset 0 1px 0 rgba(255,255,255,0.5)`) plus a highly diffuse, low-opacity spread shadow (`box-shadow: 0 20px 40px rgba(0,0,0,0.04)`).
3.  **Data Emphasis:** Focus incredibly heavily on typographic hierarchy. Big numbers (like "82%" or "14 Day Streak") should physically dominate the space inside their respective widgets, utilizing a heavy bold font (e.g., Inter Black or Outfit Bold) shaded in the brand's Primary Color.
