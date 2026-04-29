# Product Requirements Document (PRD): Tutorial Engine Hierarchy & Learning Interfaces

## 1. Overview & Scope
This document outlines the design and implementation requirements for the **Tutorial Engine's deep hierarchy pages**. It serves as the definitive guide for Figma designers and frontend developers to construct the inner navigation and learning interfaces of the Tutorial Engine.

> [!WARNING]  
> **OUT OF SCOPE: Master Layout**  
> The main dashboard shell (Top Navigation Bar and Left Sidebar) is **already completed** and must be excluded from these designs. The scope of this PRD is strictly limited to the **main content area** within that shell.

### 1.1 Objective
To create a premium, brand-agnostic set of content views that guide a learner from a broad career domain down to a specific subtopic learning block, acting as a "Learning OS" rather than a simple course list.

---

## 2. Global Design Constraints & Aesthetics

> [!IMPORTANT]  
> **FLAT DESIGN MANDATE**  
> Absolutely **NO GRADIENTS** are permitted in these designs. All UI elements must utilize solid colors, flat transparencies, and crisp borders. 

*   **Brand Agnosticism**: Designs must use semantic tokens (e.g., `primaryColor`, `accentColor`) that will be populated via `BrandConfig`.
*   **Depth without Gradients**: Use solid background shapes with low opacity (e.g., `opacity-5` to `opacity-10`) to create visual depth and structure.
*   **Accessibility**: Maintain a strict 4.5:1 contrast ratio for all text against brand-colored surfaces.
*   **Typography**: Clean, modern sans-serif (matching the master layout).

### Brand Implementations
*   **RealTutorialHub (RTH)**: Uses Burnt Orange (`#d03f00`). Emphasizes "AI Tutor" and self-paced learning.
*   **SkillUp IT Academy**: Uses Vibrant Pink (`#f54a8d`). Emphasizes "Live Mentor" and placement-heavy tracking.

---

## 3. View Specifications

The following views represent the drill-down hierarchy of the Tutorial Engine.

### 3.1 Domain Dashboard View (The Broad Specialization)
**Purpose:** Allows the user to select and overview broad career tracks (e.g., Full Stack Development, Data Science).

**UI Layout Requirements:**
*   **Header**: Domain Name & Current overall progress.
*   **Domain Cards/Grid**:
    *   Solid brand-colored badge or icon container.
    *   Data points: Completion %, Skill Level (e.g., Beginner, Advanced), Active Projects count, Pending Assignments count.
    *   Career Readiness Score (Critical for SkillUp).
*   **Action Panel Integration**: Quick summary widgets for Daily/Weekly progress and Gamification (XP/Streak).

### 3.2 Subject Dashboard View (Major Skill Categories)
**Purpose:** Breaks down the selected Domain into major subjects (e.g., Frontend, Backend, Databases).

**UI Layout Requirements:**
*   **Breadcrumbs**: Navigation context (e.g., *Full Stack > Subjects*).
*   **Expandable Accordion Layout**: 
    *   Clean, flat accordion rows for each subject.
    *   **Progress Indicators**: Solid fill progress bars (no gradients) indicating completion percentage.
    *   **Sub-data**: Count of completed vs. pending topics, subject-specific projects, and assignments.

### 3.3 Topic Dashboard View (Focused Competency)
**Purpose:** Details the specific competencies within a Subject.

**UI Layout Requirements:**
*   **List/Grid Hybrid**: Displays modules of learning.
*   **Engine Synchronization Panel**: A dedicated alert/banner section bridging the Exam Engine and Tutorial Engine.
    *   *State*: Displays "Failed Exams", "Weak Topics", and "Recommended Remediation".
    *   *Design*: Flat alert box using a secondary or warning color with clear iconography.

### 3.4 Subtopic Learning Interface (The Core OS)
**Purpose:** The actual interface where learning occurs. This is the most granular level.

**UI Layout Requirements:**
*   **Content Blocks Layout**: A highly structured, readable document view broken into distinct tabs or vertical stacked cards.
*   **Required Blocks**:
    1.  **Notes**: Core academic text.
    2.  **Layman**: Simplified explanation.
    3.  **Real-life**: Practical application examples.
    4.  **Technical**: Deep-dive technical specifications.
    5.  **Code**: Syntax-highlighted code snippets block.
    6.  **AI Tutor / Live Mentor Interaction Box**:
        *   *RTH Mode*: AI chat interface for dynamic explanations and practice prompts.
        *   *SkillUp Mode*: Mentor session scheduler and live chat interface.
    7.  **Assignment Trigger**: A flat CTA button leading to the subtopic assignment.

---

## 4. Dedicated Action Panels
These panels sit alongside or within the hierarchical views to provide operational context.

### 4.1 Assignment & Project Dashboards
**Purpose:** Track pending work and portfolio building.
*   **Assignments**: Tabs for Pending, Submitted, Scores, AI/Mentor Review. 
*   **Projects**: Status trackers for portfolio builds, collaborative milestones, and faculty evaluations.
*   **Design**: Data-dense but clean table or card lists. Use flat status badges (e.g., Solid green for complete, solid orange/pink for pending).

### 4.2 Career Readiness Panel (SkillUp Priority)
**Purpose:** Tracks job-readiness metrics.
*   **Widgets**: Internship eligibility checklist, Resume readiness status, Job application tracker.
*   **Design**: Progress rings (solid strokes) and checklist UI.

---

## 5. Mobile Responsiveness
All inner views must gracefully collapse for mobile devices.
*   **Hierarchy**: Complex accordions and tables must convert to stacked vertical cards.
*   **Bottom Navigation**: Rely on the master layout's bottom nav; ensure content panels provide ample bottom padding to avoid overlap.
*   **Learning Interface**: Subtopic blocks (Layman, Code, Technical) should use a horizontal swipeable tab menu on mobile to save vertical space.

---

## 6. Data Architecture (For Engineering Context)
While Figma focuses on the UI, the components must be designed to accept data via the established `SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md` patterns.
*   The UI must not hardcode content. Use placeholder text lengths that represent realistic dynamic data (e.g., from `tutorial_domains`, `tutorial_subjects`).
*   Brand tokens will be injected at the root level via Context API. Designers should use Figma Variables synced to these tokens.
