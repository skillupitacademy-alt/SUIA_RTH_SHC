# Exam Launch Evaluation Configuration: UI/UX Architecture

This document defines the interface and layout logic for the Exam Launch Configuration flow. It heavily inherits the **Light Mode Glassmorphism** rules established in the Home Dashboard and operates strictly under the `BRAND_AGNOSTIC_ARCHITECTURE` parameters. Be very careful to respect the **HUD Spatial Normalization** (h-530 frame, no-scroll policy) established in previous Knowledge Items.

## 1. Global Aesthetic & Theming Rules
1. **The Canvas**: Flat `bg-slate-50` background. **Zero** blurred meshes or dark gradient backgrounds. 
2. **Glassmorphism Focus**: Interactive elements reside inside `bg-white` structural frames with 1px `border-gray-200` lines and soft `shadow-sm` elevations.
3. **Primary Injection**: The `brandConfig.primaryColor` is heavily restricted. It is ONLY used for:
   - The "Launch Exam" primary CTA.
   - 2px focus rings (`ring-[primaryColor]`) around active selected Topic/Domain cards.
   - Text highlights (`text-[primaryColor]`) on active breadcrumbs.
   - Small functional accents (e.g. active pagination dot).

## 2. Layout Structure: The Split Pillar Architecture
The Configuration Gateway utilizes a locked viewport (HUD Normalization) to prevent layout jitter across steps.

*   **Left Column (65% Width) — The Configuration Frame**:
    *   **Strict h-530 Frame**: The interaction box where Grid Cards render is height-locked.
    *   **No Scrolling Policy**: If Domains/Topics exceed the frame, they must wrap to a *new page* via a Bottom Pagination Cluster, **never** via an overflow scrollbar. 
*   **Right Column (35% Width) — Assessment Summary Pillar**:
    *   Sticky "Mission Manifest" card summarizing real-time selected elements contextually.

## 3. Core Component Specs

### 1. HUD Header (Top Anchored)
*   **Breadcrumb Context**: `text-slate-400 font-semibold text-sm` rendering path (e.g., `Domain / Math / Algebra`). Active node glows with `brandConfig.primaryColor`.
*   **Expert Mode Toggle**: Native Shadcn/Radix-style toggle switch. Small, subtle `bg-gray-200` turning to `brandConfig.primaryColor` when active.
*   **Project Lockup**: Replaces hardcoded brand text. Injects `brandConfig.name` into a crisp, minimal header block.

### 2. Configuration Action Grids (The h-530 Frame)

**Step 1: Domain Selection Gallery**
*   **Hierarchical Root**: This step serves as the root container. Examples of primary Domains include: "Full Stack Development", "Data Science", "Data Engineering", "Cybersecurity".
*   Arranged in a dynamic responsive grid.
*   **Card Styling**: Flat `bg-white` rounded-2xl. Hovering creates a `-translate-y-1` floating generic lift and deepens shadow.
*   **Active State**: Gains a bold `border-2 border-[primaryColor]` and subtle inset glow (`bg-[primaryColor]/5`).

**Steps 2-4: Subject/Topic/Subtopic Refinement**
*   **Contextual Hierarchy**: The available Subjects must dynamically render based *strictly* on the Domain selected in Step 1 (e.g. if "Full Stack Development" is picked, Subjects like "Front End", "Back End", "Database Architecture" appear). Topics and Subtopics follow the exact same cascading hierarchical restriction.
*   **Selection Clusters**: Wrap natively. Pills (Chips) have `rounded-full px-4 py-2 border border-gray-200 bg-white font-bold text-slate-700`.
*   Active Chips invert to filled `bg-[primaryColor] text-white`.

**Step 5: Engine Calibration**
*   **Tier Selector (High Impact)**: 3 large horizontal or vertical "Bento" style cards mapping 'Mixed / Simple / Expert'. 
*   **Density Selector**: Numerical dials or square un-styled toggles (10 / 20 / 30 / 40) aligned horizontally.

### 3. Assessment Summary (The Right Pillar)
*   Container: High-contrast `bg-white` (or reverse `bg-slate-900` if isolation is needed, similar to Dashboard Telemetry edge cases) with deep `shadow-lg` separating it from the `slate-50` backdrop.
*   **Configuration Manifest**: A bulleted or pill-list rendering selected constraints in real time.
*   **Point Projection**: Large, bold typography (`text-3xl font-black text-slate-800`).
*   **Launch CTA**: "Launch Evaluation" button. Full width, `py-4`, `bg-[primaryColor] text-white shadow-xl hover:opacity-90`.

### 4. Navigation & Global Controls (Bottom Anchored)
*   Always pinned *below* the h-530 Configuration Frame.
*   **Pagination Cluster**: Centered numerical nodes or arrows bridging pages of configuration items maintaining the strict "No Scroll" policy.
*   **Forward/Back Actions**: Bold Left/Right anchored text links + Chevrons.

### 5. Dialogs, Overlays & Preflight Modals (Headless Context)
*   All dialogs (Exit Guard, Validation Status Bar, Preflight Summary) lock the background scroll and present a strictly centered frosted `backdrop-blur-md` overlay pane.
*   **Active Banner**: Absolute top `w-full` alert bar rendering standard notification hues (Yellow/Orange) communicating resume states, bypassing brand configs to maintain universal urgency linguistics.
