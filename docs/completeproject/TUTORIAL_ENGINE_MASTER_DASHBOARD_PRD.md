# Product Requirements Document (PRD): Tutorial Engine Master Dashboard

## 1. Overview & Scope
This document outlines the design and implementation requirements for the **Tutorial Engine Master Dashboard**. This serves as the "Learning OS" command center, providing learners with a top-level view of their domains, progress, assignments, projects, and career readiness.

This document is intended for Figma designers to create the high-fidelity UI components for this dashboard, ensuring it supports both **RealTutorialHub** and **SkillUp IT Academy** through a unified, brand-agnostic architecture.

---

## 2. Global Design Constraints & Aesthetics

> [!IMPORTANT]  
> **FLAT DESIGN MANDATE**  
> Absolutely **NO GRADIENTS** are permitted in these designs. The reference image may contain subtle gradients or drop shadows, but the final Figma designs must strictly utilize solid colors, flat transparencies, and crisp borders.

*   **Brand Agnosticism**: All UI components must be designed using semantic tokens (e.g., `primaryColor`, `secondaryColor`, `brandMark`) instead of hardcoded colors.
*   **Visual Depth**: Use solid background shapes with low opacity (e.g., `opacity-5`, `opacity-10`) to create depth without relying on CSS gradients or complex shadows.
*   **Accessibility**: Maintain a strict 4.5:1 contrast ratio for all text against brand-colored surfaces.
*   **Typography**: Clean, modern sans-serif fonts.

### Brand Implementations
*   **RealTutorialHub (RTH)**: 
    *   **Theme**: Burnt Orange (`#d03f00`).
    *   **Focus**: AI-Powered Learning, self-paced, exam-heavy. Features the "AI Tutor".
*   **SkillUp IT Academy**: 
    *   **Theme**: Vibrant Pink (`#f54a8d`).
    *   **Focus**: Live Mentor-Guided Learning, placement-heavy. Features the "Live Mentor".

---

## 3. Structural Layout Tiers

The Master Dashboard is composed of several distinct modules. Designers should treat these as independent widgets that snap into a CSS Grid/Flexbox layout.

### 3.1 Top Header Bar
**Purpose**: Global status and quick actions.
*   **Dashboard Title & Subtitle**: E.g., "Tutorial Engine Dashboard / Your personalized learning command center".
*   **Gamification Widgets**:
    *   Day Streak Card (Fire icon + count).
    *   XP Points Card (Star icon + count).
    *   Learner Level Badge (Ribbon icon + level text).
*   **Utility**: Notification Bell icon.
*   **User Profile**: Avatar, Name, and Role (e.g., "Learner") with a dropdown chevron.

### 3.2 Left Sidebar Navigation Panel
**Purpose**: Primary application routing.
*   **Brand Header**: Brand Logo and Tagline (e.g., "AI-Powered Learning" for RTH, "Mentor-Guided Learning" for SkillUp).
*   **Primary Action**: Highlighted "Dashboard" button (using solid `primaryColor`).
*   **Section 1: Tutorial Engine**: Domains, Subjects, Topics, My Learning, AI Tutor (RTH - include a "New" badge) / Live Mentor (SkillUp), Assignments, Projects, Bookmarks, Notes.
*   **Section 2: Exam Engine**: Launch Exam, Practice Tests, My Results.
*   **Section 3: Career**: Career Readiness, Resume Builder, Certifications.
*   **Footer**: Help & Support icon.

---

## 4. Main Dashboard Widgets (Content Area)

### 4.1 Welcome Hero Section
A prominent top-level banner split into three core functions:
1.  **Welcome Back Card**: Personalized greeting, motivational text. Features a "Continue Learning" module showing the current active lesson (e.g., "Async/Await in JavaScript") with a flat progress bar and a solid `primaryColor` "Resume Now" button.
2.  **Tutor/Mentor Quick Access Card**: 
    *   *RTH Mode*: Features an AI Tutor avatar/illustration with a "Chat with AI Tutor" CTA.
    *   *SkillUp Mode*: Features a human Mentor avatar with a "Book Mentor Session" CTA.
3.  **Today's Progress Summary Card**: 
    *   *Header Action*: "View All" text link.
    *   *Grid*: Four mini-stats (Time Spent, Lessons Completed, Daily Goal %, and XP Earned) with corresponding icons.
    *   *Footer*: Motivational subtext (e.g., "Great progress! Keep it up! 🚀").

### 4.2 Learning Progress Overview Card
*   **Header Action**: "This Week" time-range dropdown selector.
*   **Visual**: A large circular progress indicator (donut chart) showing overall course/domain completion. Strictly use solid colored strokes, no gradients.
*   **Breakdown**: A vertical list of currently active subjects (e.g., Frontend Development, Backend Development) with icons, flat thin progress bars, and percentage labels.
*   **Footer Action**: "View Detailed Analytics →" text link centered at the bottom.

### 4.3 My Domains Card Grid
*   **Header Action**: "View All" text link.
*   **Layout**: A grid of domain cards (e.g., Full Stack Development, Data Science, DevOps).
*   **Card Anatomy**: 
    *   Domain Icon (inside a flat, low-opacity colored circle).
    *   Domain Title.
    *   Completion % and flat progress bar.
    *   Skill Level Badge (e.g., "Advanced", "Beginner" using flat pastel background colors).
    *   Subject count (e.g., "8/12 Subjects").

### 4.4 Engine Synchronization Card
**Purpose**: Bridges the Exam Engine and Tutorial Engine by highlighting knowledge gaps.
*   **Header Action**: "View All" text link.
*   **List Items**: Topics identified via exams.
    *   Failed Topics (Red/Danger flat badge).
    *   Weak Diagnostic Topics (Orange/Warning flat badge).
    *   Mastered Concepts (Green/Success flat badge).
*   **Footer Action**: "Auto-Deploy Tutorial Sequence →" CTA centered at the bottom to immediately launch remedial learning.

### 4.5 Assignments Management Card
*   **Header Action**: "View All" text link.
*   **Tabs**: Pending (with notification badge e.g., "3"), Submitted, Reviewed, Graded.
*   **List Items**: Assignment Icon (e.g., Document), Assignment Title, Category context (e.g., "React Basics"), and Due Date (highlighted in red if upcoming).
*   **Footer Action**: "View All Assignments →" text link centered at the bottom.

### 4.6 Projects Card
*   **Header Action**: "View All" text link.
*   **List Items**: Project Icon (e.g., Shopping bag, Chat bubble), Project Title, Project Type (e.g., "Full Stack Project").
*   **Visual**: Flat horizontal progress bar indicating completion status with percentage text on the right.
*   **Footer Action**: "View All Projects →" text link centered at the bottom.

### 4.7 Career Readiness Card
**Purpose**: Essential for SkillUp's placement-heavy model, but present in both.
*   **Header Action**: "View All" text link.
*   **Metrics Grid**: (Each card includes a specific icon like Document, Target, Briefcase, Ribbon)
    *   Resume Score (Percentage + "Good"/"Needs Work").
    *   Skills Match (Percentage + "High"/"Low").
    *   Job Applications (Count for "This Month").
    *   Certification (Completed / Total count).
*   **Footer Action**: "View Career Dashboard →" text link centered at the bottom.

### 4.8 Bottom Tip / Smart Guidance Bar
*   **Visual**: A full-width, low-profile banner at the bottom of the dashboard.
*   **Content**: Dynamic learning recommendations or AI/Mentor study reinforcement tips (e.g., "Tip: Use the AI Tutor regularly to clear doubts").

---

## 5. Engineering & Data Implementation Notes
*   All data displayed in these mockups must be driven by view-models as per `SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md`. Do not hardcode content into the React components.
*   The layout must be responsive. On mobile devices, the Sidebar collapses into a hamburger menu, and the multi-column widget grid stacks vertically.
