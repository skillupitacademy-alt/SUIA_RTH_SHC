# 🧩 Launch Evaluation Engine Components (Figma Input)

The following core components represent the constituent elements of the Launch Evaluation journey, identified for the Figma design process.

## 1. HUD Header (Global)
*   **Step Indicator**: Title and sub-text (e.g., "Knowledge Mapping / Select Topics").
*   **Breadcrumb Context**: Dynamic path string (e.g., "Math / Algebra / Linear").
*   **Project Branding**: "Launch Evaluation" lockup.
*   **Expert Mode Toggle**: Switch between "Basic" and "Advanced" rulesets.

## 2. Configuration Steps (Step-Specific)

### Step 1: Domain Selection
*   **Domain Gallery**: Grid of interactive cards.
*   **Domain Card**: Includes Icon, Title, Description, Category Badge, and "Coverage" percentage tag.

### Steps 2-4: Subject/Topic/Subtopic Refinement
*   **Selection Grid**: Multi-select cluster of chips.
*   **Topic Chip**: Rounded item with title and active toggle state.

### Step 5: Engine Calibration
*   **Tier Selector (High Impact)**: Large cards for "Mixed / Simple / Expert" difficulty.
*   **Density Selector**: Numerical cards (10, 20, 30, 40) for question volume control.

## 3. Assessment Summary (Side Pillar)
*   **Configuration Manifest**: Aggregated list of selected Domains, Subjects, and Topics.
*   **Calibration Metadata**: Indicators for Difficulty and Question Count.
*   **Point Projection**: Calculated mastery points for the session.
*   **Launch CTA**: "Launch Exam / Start Mission" primary trigger.

## 4. Navigation & Global Controls
*   **Navigation Footer**: Container for directional actions.
*   **Back Action**: Button to return to previous configuration level.
*   **Advance Action**: Button for "Continue Journey / Calibrate Engine / Launch".
*   **Pagination Cluster**: "Page X of Y" indicator with Left/Right arrows (for large grids).

## 5. Overlays & Dialogs
*   **Active Session Banner**: Notification to resume an ongoing exam.
*   **Status/Error Bar**: Banner for network errors or constraint validations (e.g., "Max 4 Topics").
*   **Exit Guard Dialog**: UI-blocker to confirm navigation away from unsaved setup.
*   **Preflight Modal**: Detailed summary card for final mission confirmation.
*   **Loading Skeleton**: Placeholder layout showing question blocks and sidebar during evaluation prep.
