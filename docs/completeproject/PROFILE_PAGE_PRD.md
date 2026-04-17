# Product Requirements Document (PRD): Shared Profile Page

## 1. Product Overview
**Document Intent:** This PRD provides complete structural and architectural requirements for the new "Profile Page" on the dashboard.
**Objective:** Enable users to view and edit their profile data (originally collected during onboarding) within a unified, brand-agnostic component that seamlessly adopts the appearance of either RealTutorialHub or SkillUp IT Academy.

## 2. Architectural Constraints
The engineering execution must strictly enforce the rules outlined in:
1. `BRAND_AGNOSTIC_ARCHITECTURE.md`: Follow Pattern A (Props-based root page injection) to ensure complete UI deduplication.
2. `SHARED_BRANDED_UI_SOURCE_OF_TRUTH_MASTER_PLAN.md`: Ensure the frontend apps act purely as thin wrappers. The Profile Page MUST live in `src/share-branding/screens/user/`.

## 3. Required Components Map
*(Note: As per requirements, layout instructions are intentionally omitted. This section defines ONLY the structural capabilities and components.)*

### A. App-Level Thin Wrappers (Consumers)
The framework host apps must contain exactly ONE file each for this route. These wrappers will only intercept the request, load the respective brand config, and mount the unified Profile Screen.
*   `apps/realtutorialhub-web/src/app/profile/page.tsx`
*   `apps/skillup-web/src/app/profile/page.tsx`

### B. Shared Logic & View Models (Source of Truth)
Before creating the UI, the data logic must be structurally decoupled in `src/share-branding/`:
*   `src/share-branding/profile/profileViewData.ts`: Defines the UI-facing ViewModels mapping the underlying `OnboardingData` payload to the specific text fields.
*   `src/share-branding/services/userProfileClient.ts`: Exposes the `getUserProfile()` and `updateUserProfile()` API hooks, safely wrapping the BFF network boundary.

### C. The Core UI Component (Profile Screen)
*   `src/share-branding/screens/user/ProfileScreen.tsx`: The master orchestrator component. It accepts the `BrandConfig` as a prop and wraps itself in the generic Dashboard context.

### D. Editable Data Architecture (Interactive Components)
The profile must permit users to alter their onboarding selections dynamically. This requires splitting the generic card into two states managed by the following components:

#### 1. Form State Manager
*   **State Hook:** Manages the toggle between `isViewing` and `isEditing`.
*   **Dirty State:** Tracks if local data has mutated relative to the server data to enable/disable the "Save" function.

#### 2. The Edit Button Component
*   Must be attached to the view context.
*   **Action `onClick`:** Swaps all text read-only elements into interactive input fields (Dropdowns for Domains/Goals, Text Inputs for Names).
*   **Action `onSave`:** Triggers the `updateUserProfile()` service method. The button must display a loading spinner while the network promise resolves.

#### 3. Brand-Agnostic Input Controls
*   Shared input elements built to blindly absorb `brand.primaryColor` and `brand.secondaryColor` for focus rings and validation borders.
*   Required Interactive Fields to support edit capability (mirroring Onboarding):
    *   Full Name (Text Input)
    *   Education Level (Select Dropdown)
    *   Status (Select Dropdown: Student/Professional)
    *   Primary Goal (Select Dropdown)
    *   Domain & SubDomain (Select Dropdown)
    *   Skill Level (Select Dropdown)
    *   Time Commitment (Select Dropdown)

## 4. Engineering Guardrails
*   **NO Hardcoded Styling:** The edit button and input borders must use `style={{ borderColor: config.secondaryColor }}` rather than hardcoded Tailwind strings.
*   **NO UI in Apps:** The `profile/page.tsx` in the frontend apps must not exceed ~10 lines.
*   **Single Fetch Responsibility:** The Profile Screen must fetch its own data on mount or rely on the global layout context payload. The thin app wrappers must not pass raw backend data down.
