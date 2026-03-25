# 🚀 Launch Evaluation Page PRD

## 1. Overview
The **Launch Evaluation Page** (Step-by-Step Configuration) is a high-fidelity wizard that guides users through setting up their assessment. It ensures a scientifically balanced exam by calibrating domains, subjects, and engine difficulty.

### Goals
*   **Precision**: Enable granular selection of knowledge nodes (Domain -> Subject -> Topic -> Subtopic).
*   **Validation**: Enforce mode-based constraints (Basic vs. Advanced) to prevent cognitive overload.
*   **Trust**: Use a "Preflight" check to confirm readiness before a transactional launch.
*   **Full-Width Immersion**: A borderless, desktop-first experience that avoids page-scrolling.

---

## 2. Journey Steps & Components

### Step 1: Strategic Ecosystem (Domain Selection)
*   **Component**: `DomainCard`
*   **Logic**: Single-select only.
*   **Visuals**: Large cards with illustrative icons (Code, Shield, Cloud, etc.) and "Coverage" indicators.

### Step 2: Curriculum Calibration (Subject Selection)
*   **Component**: `TopicChip`
*   **Logic**: Multi-select. Basic: Max 2 | Advanced: Max 4.

### Step 3: Knowledge Mapping (Topic Selection)
*   **Component**: `TopicChip`
*   **Logic**: Multi-select. Basic: Max 3 | Advanced: Max 4.

### Step 4: Expert Precision (Subtopic Selection)
*   **Component**: `TopicChip`
*   **Note**: Bypassed in **Basic Mode**.
*   **Logic**: Multi-select up to 4 subtopics.

### Step 5: Engine Calibration (Difficulty & Density)
*   **Component**: `EngineCalibrationLayout`
*   **Difficulty Tiers**: Mixed (Standard), Simple (Foundations), Expert (Advanced).
*   **Density Tiers**: Toggle-based selection of question counts (10, 20, 30, 40).
*   **Assessment Summary (Side Pillar)**: Displays a running manifest of all selections, points, and the launch trigger.

---

## 3. Layout & Information Architecture (Figma Ready)

### 3.1. Screen Regions (100dvh Navigation)
*   **HUD Header (12% Height)**:
    *   **Left**: Step Title & Description (e.g., "Select Domain").
    *   **Center**: Breadcrumb path (`Domain / Subject / Topic`).
    *   **Right**: "Launch Evaluation" Branding & Mode Toggle (Basic/Advanced).
*   **Control Row (8% Height)**:
    *   **Right**: Pagination controls (`Page X of Y`) for card-heavy steps.
*   **Main Engine Slot (68% Height)**:
    *   **Grid**: 3x2 or 3x3 grid of cards/chips.
    *   **Sidebar (Step 5 Only)**: Right-aligned Summary Pillar (35% width).
*   **Navigation Footer (12% Height)**:
    *   **Left**: "BACK" button (Pink secondary).
    *   **Right**: "CONTINUE / LAUNCH" button (Pink Primary, Large).

### 3.2. Visual Hierarchy & States
1.  **Step Heading**: Primary focus to orient the user.
2.  **Selection Grid**: High-contrast cards with distinct "Selected" states (Pink borders/glow).
3.  **Active Progress**: The "Breadcrumb" in the header updates in real-time.
4.  **Loading Overlay**: A frosted-glass (backdrop-blur) overlay with a "Syncing Engine..." pulse during data fetches or launch.

### 3.3. Dialogs & Transitions
*   **Exit Guard**: Prevents accidental data loss if the user navigates away mid-setup.
*   **Preflight Modal**: A centered dialog showing the final "Mission Profile" before the POST request.
*   **Transition (loading.tsx)**: A skeleton state of the Exam HUD to provide immediate visual feedback during redirect.

---

## 4. Technical Requirements
*   **State Management**: Complex local state tracking selections across 5 levels.
*   **Idempotency**: Launch requests must include a `UUID` to prevent double-billing/session creation on retry.
*   **API Resilience**: Background "Heartbeat" to keep the session alive during long selection phases.

---

## 5. Design Tokens
*   **Card Radius**: `1.25rem` (Engines) to `2rem` (Layouts).
*   **Colors**: 
    *   **Active Selection**: `#FF2D55` (Pink).
    *   **Engine Background**: `#2D2D2D` (Dark mode aesthetic for calibration).
    *   **Status Green**: `#10B981` (Success).
*   **Animation**: Fade-in/Slide-in (`duration-300`) for step transitions.
