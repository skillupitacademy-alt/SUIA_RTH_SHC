# Global UX Baseline

This document defines the mandatory, non-negotiable UX rules for the Quiz Platform. These rules apply to all user-facing pages and components.

## Responsiveness & Layout
- **Ubiquitous Access**: All pages MUST be fully responsive across Mobile, Tablet, Laptop, and Desktop.
- **No Overflow**: Horizontal scrolling is strictly forbidden on any device.
- **Preservation**: No UI elements or interactive controls may be hidden due to screen size unless replaced by a mobile-optimized alternative (e.g., hamburger menu).
- **Chart Balance**: Charts must be proportionally balanced, correctly labeled, and responsive to viewport changes.

## Navigation & Routing
- **Active CTAs**: No visible Call-to-Action (CTA) or link may route to a 404 page.
- **Contextual Back**: Users should always have a logical path back to the Dashboard or the previous meaningful state.

## Data Consistency
- **Single Source of Truth**: If two or more UI elements represent the same data (e.g., Weekly Goal in Sidebar vs. Stats in Dashboard), they MUST share the same authoritative data source.
- **Synchronized State**: Updates to data should propagate across all related UI components simultaneously.

## Quality of Experience
- **Enhancement allowed**: UI/UX may be enhanced for clarity, usability, and visual delight.
- **No Degradation**: UI/UX features MUST NOT be removed or degraded unless explicitly instructed by the user.

## Governance
- All new page contracts MUST reference this baseline.
- Verification checklists must include a responsiveness audit.
