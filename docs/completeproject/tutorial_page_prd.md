# Project PRD: RealTutorialHub Tutorial Experience

This document defines the product requirements, design system, and technical architecture of the **RealTutorialHub Tutorial Page**. It is intended to guide high-fidelity Figma mockup generation and implementation of the "Aesthetic Maverick" premium UI.

---

## 1. Visual Language & Core Aesthetic

The platform uses a **Glassmorphism (Frosted Glass)** design system characterized by translucency, layered surfaces, and vibrant background glows.

### Design Tokens (Figma Mapping)
| Property | Value (Aesthetic Mode) | Figma equivalent |
| :--- | :--- | :--- |
| **Backdrop** | `blur(20px)` | Background Blur: 20px |
| **Surface** | `rgba(255, 255, 255, 0.65)` | Linear Gradient: White 65% |
| **Border** | `1px solid rgba(255, 255, 255, 0.3)` | Inner Stroke: White 30% |
| **Shadow** | `0 8px 32px rgba(31, 38, 135, 0.1)` | Drop Shadow: (0, 8, 32) blr 10% op |
| **Inner Shadow**| `0 2px 8px rgba(255, 255, 255, 0.5)` | Inner Shadow: (0, 2, 8) Wht 50% op |
| **Radius** | `18px` | Corner Radius: 18 |

### Typography
- **Headings**: `Outfit`, Sans-serif (Bold/Extra Bold, Tracking: -0.04em)
- **Body**: `Inter`, Sans-serif (Regular/Semi-Bold, Line Height: 1.6-1.7)

---

## 2. Branding & Theming (Domain Themes)

The UI dynamically adapts its accent colors and gradients based on the current learning domain (Full-Stack, Data, Architecture).

### Core Domain: Indigo (Generic)
- **Primary Accent**: `#3d5a9e`
- **Breadcrumb Gradient**: `linear-gradient(135deg, #3b4f7a 0%, #4f6292 50%, #6b82b5 100%)`
- **Progress Fill**: `#f9a825` (Vibrant Saffron)

### Subtopic Block Gradients
- **Notes**: `linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)`
- **Layman**: `linear-gradient(135deg, #e8f0fe 0%, #dce8fd 100%)`
- **Real Life**: `linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)`

---

## 3. Information Architecture & Layout

### 3.1 Global Layout
- **Navbar (Top)**: Fixed height (98px), frosted glass background (`rgba(255, 255, 255, 0.4)`).
- **Sidebar (Left)**: Fixed width (260px), sticky positioning. Scrollbars hidden via `.hide-scrollbar` class.
- **Main Content (Center)**: Fluid width, scrolls independently with a max-width container (approx 1200px-1400px).

### 3.2 Sidebar Components
1. **Quick Actions Grid**: 2x3 grid of buttons (Labeled: Continue, AI Tutor, Progress, Weak Areas, Sessions, Projects).
2. **Curriculum Explorer**: Nested list of topics with icons (✓ Completed, ● Active, 🔒 Locked).
3. **Glossary/Notes Card**: A sticky card at the bottom summarizing key terms in yellow/saffron theme.

### 3.3 Main Page Panels
1. **Learner Flow Dashboard**: A prominent card featuring a progress bar (`completedCount/6`) and quick navigation for assignment paths.
2. **Curriculum Section (The Six Blocks)**:
   - Notes, Layman, Real-Life, Technical, Code, AI Tutor Brief.
   - Each section is rendered as a `design-panel` with consistent spacing (gap: 18px).
3. **Faculty Support Area**:
   - **Live Session Panel**: Form/Status for requesting faculty support.
   - **Project Submission Panel**: List of projects with status indicators (Open/Locked/Submitted).

---

## 4. Interaction Models

### 4.1 AI Tutor Drawer
- **Trigger**: Click "Ask AI Tutor" in the sidebar or the floating FAB.
- **Visual**: Slides in from the right.
- **States**: Controlled by parent (`isAiTutorOpen`) with backdrop dimming.

### 4.2 Sidebar Scroll Logic
- **Condition**: Up/Down arrows appear only when the topic list exceeds the viewport height.
- **Feedback**: Smooth "Scroll to" logic for all sidebar shortcuts.

### 4.3 Progress Tracking
- **Behavior**: Content blocks are marked as "Viewed" after scrolling into view (80% threshold) for 3 seconds.
- **Result**: Immediate progress bar update and potential unlocking of assignment tiers.

---

## 5. Technical Requirements for Figma

> [!TIP]
> **To achieve the "Wow" background glows:**
> 1. Use a standard light grey background (`#f5f6fa`).
> 2. Create large, low-opacity (12%-18%) elliptical blurs (approx 800px width) in **Soft Pink** and **Deep Purple**.
> 3. Layer the main Glassmorphism panels (blurs: 20px) on top of these glows to create the depth effect seen in the mockup.

> [!IMPORTANT]
> **Responsive Logic**:
> - Below 1024px: Sidebar collapses into a hamburger menu.
> - Mobile (375px): All cards stack vertically, and the header becomes sticky with high transparency.
