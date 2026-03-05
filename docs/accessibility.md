# Accessibility: WCAG 2.1 AA Compliance
*Phase G1: Inclusive Assessment Platform*

## 📜 Architectural Objective
To ensure the quiz platform is fully accessible to students with disabilities — including those who use screen readers, keyboard-only navigation, or have visual impairments — by meeting **WCAG 2.1 Level AA** standards across all 3 apps.

---

## 🏗️ 1. Keyboard Navigation & Focus Management

### A. Quiz Interface
- **Action**: Ensure all quiz buttons (Next, Previous, Submit, answer options) are reachable via `Tab` key with visible focus indicators.
- **Focus Trap**: When a modal opens (e.g., "Are you sure you want to submit?"), focus must be trapped within the modal until it's dismissed.
- **Exam Navigation**: Arrow keys should cycle through answer options. `Enter` selects. `Tab` moves between question navigation and answer area.

### B. Dashboard & Admin
- **Action**: All interactive elements (dropdowns, charts, filters, data tables) must be operable via keyboard.
- **Skip Links**: Add "Skip to main content" link at the top of every page.

---

## 🎨 2. Color & Visual Accessibility

### A. Contrast Ratios
- **Standard**: All text must meet minimum **4.5:1** contrast ratio (AA standard).
- **Large Text** (18px+ or 14px bold): **3:1** minimum.
- **Action**: Audit all color tokens in `globals.css` and Tailwind config against WCAG contrast requirements.
- **Charts**: Use patterns/textures in addition to color to distinguish data series (for colorblind users).

### B. Font & Spacing
- **Action**: Ensure all text can be resized up to 200% without content overflow or clipping.
- **Line Height**: Minimum 1.5x font size for body text.

---

## 🗣️ 3. Screen Reader Support (ARIA)

### A. Semantic HTML
- **Action**: Replace all `<div onClick>` patterns with proper `<button>` or `<a>` elements.
- **Landmarks**: Use `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>` landmarks on every page.
- **Headings**: Ensure proper heading hierarchy (single `<h1>` per page, no skipped levels).

### B. Dynamic Content
- **Live Regions**: Use `aria-live="polite"` for exam timer countdown updates.
- **Quiz State**: Announce question number changes ("Question 5 of 20") to screen readers via `aria-live`.
- **Loading States**: Use `aria-busy="true"` on containers while loading.
- **Results**: Ensure score/feedback content is immediately readable by screen readers after submission.

### C. Form Controls
- All form inputs must have associated `<label>` elements (not just placeholder text).
- Error messages must be linked via `aria-describedby`.
- Required fields marked with `aria-required="true"`.

---

## ⏱️ 4. Timing & Interaction

### A. Exam Timer
- **Action**: Provide option to extend time for students with accommodations.
- **Warning**: Visual AND audible warning at 5-minute and 1-minute marks.
- **No Auto-Advance**: Questions should NOT auto-advance on a timer — student must explicitly navigate.

### B. Animations
- **Action**: Respect `prefers-reduced-motion` media query. Disable all non-essential animations when OS setting is enabled.
- **Implementation**: Wrap `framer-motion` animations in a `prefers-reduced-motion` check.

---

## 🛡️ Compliance Checklist
- [ ] Keyboard navigation audit (all 3 apps)
- [ ] Color contrast audit (automated via axe-core)
- [ ] Screen reader testing (NVDA on Windows, VoiceOver on Mac)
- [ ] ARIA labels on all interactive elements
- [ ] Focus management in modals and drawers
- [ ] `prefers-reduced-motion` support
- [ ] Skip navigation links
- [ ] Form label associations
- [ ] Heading hierarchy validation
- [ ] Exam timer accommodation support

---

## 📈 Impact
WCAG compliance makes the platform usable by **15-20% more students** (WHO estimates of global disability). Many educational institutions and government contracts **legally require** WCAG AA compliance (ADA in US, EN 301 549 in EU).

*Document Version: 1.0*
