# Tutorial Engine: UI/UX Architecture PRD

This document maps the architectural requirements for the **Tutorial Engine** interface. It synthesizes the specific constituent layout blocks derived from the "RealTutorialHub Tutorial Experience" legacy plan, but aggressively re-factors them to enforce the strict **BRAND_AGNOSTIC_ARCHITECTURE** and **Flat Light-Mode Glassmorphism** rules from the Home Dashboard.

---

## 1. Visual Override & Aesthetic Enforcement

We are officially **deprecating** the "wow" aesthetic (Deep Purple/Soft Pink ethereal glows, Indigo gradients, yellow Saffron highlights). The design must align 100% with the sober dashboard architecture established previously.

1. **The Canvas**: Pure Flat `bg-slate-50`. Zero elliptical blurs or backdrop illumination.
2. **Surface Panels**: Flat `bg-white` structural frames with explicit 1px `border-gray-200` boundaries and uniform `shadow-sm` elevation.
3. **Dynamic Theming**: Hardcoded colors are illegal. The UI must map dynamically to both RealTutorialHub (Orange) and SkillUp (Pink).
   *   Elements previously calling for "Vibrant Saffron" or "Indigo Gradients" must now use `brandConfig.primaryColor` or secondary accents.
   *   Text elements must globally utilize `brandConfig.tutorLabel` (AI Tutor vs. Live Mentor).

---

## 2. Layout & Information Architecture

The Tutorial Engine will operate using the familiar 60/40 Split Bento Grid logic.

### 2.1 Pinned Navigation Control (Left Sidebar)
*   **Quick Actions Grid**: A 2x3 grid of functional button blocks (Labeled: Continue, [Tutor Label], Progress, Weak Areas, Sessions, Projects).
*   **Curriculum Explorer**: A nested list of syllabus topics utilizing state icons:
    *   ✓ Completed `text-emerald-500`
    *   ● Active `text-[primaryColor]`
    *   🔒 Locked `text-slate-400`
*   **Glossary/Notes Dock**: A sticky reference card firmly anchored at the bottom of the sidebar list.

### 2.2 Active Learning Canvas (Main Left Pillar - 60%)
*   **Learner Flow Dashboard**: A prominent, monolithic tracker at the top of the viewport dictating macro completion across the curriculum map (e.g. `completedCount/6`).
*   **The Six Curriculum Blocks**: Renders the core pedagogical content dynamically without relying on the legacy gradient blocks (No more `linear-gradient(135deg, #fffde7...)`). Uses pristine `bg-white` cards with high-contrast text layout:
    1.  Context Notes
    2.  Layman Explanation
    3.  Real-Life Application
    4.  Technical Specification
    5.  Interactive Code Sandbox (Built-in code terminal)
    6.  [Tutor Label] Briefing 

### 2.3 Remediation & Support Control (Right Pillar - 40%)
*   **Targeted Weakness Map (Engine Sync)**: Imported data flag identifying the exact failure point from the Exam Engine that triggered this tutorial (e.g. `<Badge> Failed Diagnostic Exam: Linked Lists </Badge>`).
*   **Faculty Support Area**:
    *   **Live Session Panel**: Contextual request module for faculty interaction.
    *   **Project Submission Panel**: Evaluated workflow nodes showing status indicators (Open/Locked/Submitted).
*   **Capstone Mastery CTA**: The final anchored component at the bottom of the timeline bridging the user back into the **Exam Engine** to finalize certification.

---

## 4. Interaction Models & Transitions

1. **[Tutor Label] Drawer Action**:
   *   **Trigger**: Clicking the "Ask [Tutor Label]" Quick Action item or floating FAB element.
   *   **Visual**: A frosted window sliding unconditionally from the right-hand side of the viewport, presenting an instant chat interface without tearing the user away from the active curriculum block.
2. **Passive Progress Tracking**:
   *   Scrolling through the 6 Curriculum Blocks tracks view-persistence. Entering a target intersection bound (80% block visibility threshold for >3 seconds) automatically clears the node limit and visually flips the structural state from locked to checked.
3. **No-Scroll HUD Policy**:
   *   Vertical navigation on lists inside the sidebar acts conditionally. Up/Down paging chevrons should render only when items break the vertical height, minimizing messy native scrolling bars outside the core learning canvas.
