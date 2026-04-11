# Product Requirements Document (PRD): Exam Launch Instruction Manual

## 1. Product Overview

**Objective:** To provide students with a clear, concise, and professional briefing before they begin the 6-step assessment configuration flow. This "Instruction Manual" page ensures students understand the implications of their choices (Domain, Calibration, etc.) and reduces bounce rates by setting expectations for the diagnostic journey.

**Target Context:** Displays immediately after the user initiates the "Launch Exam" flow from the Dashboard, but *prior* to Step 1 (Domain Selection).

---

## 2. Branding & Aesthetic Mandates (STRICT)

> [!IMPORTANT]
> **NO GRADIENTS.** The design must utilize solid brand colors and flat UI elements for a premium, minimalist aesthetic. Do not use `linear-gradient` or `radial-gradient` in styles or background orbs.

### Visual Architecture
- **RealTutorialHub (RTH) Theme:** 
    - **Primary:** Burnt Orange (`#d03f00`)
    - **Secondary:** Deep Slate / Charcoal
    - **Typography:** Technical, clean, high-precision (Inter/Roboto).
- **SkillUp IT Academy Theme:**
    - **Primary:** Vibrant Pink (`#f54a8d`)
    - **Secondary:** Navy Blue (`#133382`)
    - **Typography:** Modern, humanized, growth-oriented (Outfit/Montserrat).

### UI Tokens
- **Borders:** Subtle `border-slate-200` for cards.
- **Shadows:** Soft `shadow-sm` or `shadow-md` for depth (no heavy glows).
- **Background:** High-purity white (`#FFFFFF`) or ultra-light slate (`#F8FAFC`).
- **Interactive States:** Solid color shifts on hover (e.g., `#d03f00` to `#b63600`).

---

## 3. The 6-Step Journey Logic

Figma designs must account for a horizontal or vertical roadmap showing these exactly defined stages:

1.  **Stage 1: Domain Mapping (The Foundation)**
    - *Purpose:* Define the broad engineering or data field.
    - *Icon:* Globe or Map Icon.
2.  **Stage 2: Subject Filtering (The Scope)**
    - *Purpose:* Filter curriculum-aligned subjects based on the domain.
    - *Icon:* Library or Book Icon.
3.  **Stage 3: Topic Isolation (The Focus)**
    - *Purpose:* Identify specific high-impact topics for testing.
    - *Icon:* Target or List-Check Icon.
4.  **Stage 4: Subtopic Precision (The Blueprint)**
    - *Purpose:* Refine the assessment to specific skills/subtopics.
    - *Icon:* Microchip or Precision-Tools Icon.
5.  **Stage 5: Engine Calibration (The Density)**
    - *Purpose:* Configure difficulty levels (Fundamentals to Pro) and question density.
    - *Icon:* Settings-Sliders or Dial Icon.
6.  **Stage 6: Final Summary (The Pre-Flight)**
    - *Purpose:* Review the total mastery points projection and confirm configuration.
    - *Icon:* Clipboard or Rocket Icon.

---

## 4. Brand-Agnostic Implementation Template

The page must be built as a shared component in `src/share-branding/` that renders data injected from `brandConfig.ts`.

### Data Model (`InstructionManualViewData`)
```typescript
interface InstructionManualViewData {
  title: string;              // "Before You Launch"
  subtitle: string;           // "Understand your assessment journey"
  ctaLabel: string;           // "Start Configuration"
  steps: Array<{
    id: string;
    title: string;
    description: string;
    iconName: string;
  }>;
}
```

---

## 5. UI/UX Directives

### A. Non-Gradient Cards
Cards should use a clean "card-deck" layout. Each card represents one of the 6 steps. 
- **Active State:** Solid brand-colored border (2px).
- **Icon Container:** Solid light-contrast background (e.g., `brand.primaryColor` at 5-10% opacity, but flat).

### B. Motion Guidelines
- **No Opacity Fades:** Use transform-based entry (e.g., `y: 20` to `y: 0`).
- **Standard Delay:** Staggered entry for the 6 journey cards.

### C. Call to Action (CTA)
- A prominent, centered button at the bottom: **"I Understand, Start Configuration"**.
- This button must use the `brand.primaryColor` as a solid fill.

---

## 6. PRD References
- Infrastructure: `BRAND_AGNOSTIC_ARCHITECTURE.md`
- Layout Consistency: `SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md`
- Previous Design Philosophy: `START_LEARNING_GATEWAY_PRD.md`

---
*Created by Antigravity AI for RealTutorialHub Ecosystem.*
