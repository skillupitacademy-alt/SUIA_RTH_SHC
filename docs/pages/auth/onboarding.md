# Onboarding Page Contract

## Purpose
Capture essential professional and educational profile data for a personalized user experience.

## Entry Conditions
- User MUST be authenticated.
- User profile MUST be incomplete (Onboarded status: false).

## Expected Behavior
- Guided, multi-step or single-page wizard.
- Capture: Education Level, Professional Status, Experience, and Domain Interest.
- Final "Launch" button that updates profile and redirects to Dashboard.

## UI Rules
- Interactive selection cards for domains.
- Clear progress indicator.
- Action-oriented copy.

## Data Contract
- Uses `PUT /api/auth/profile` to update user data.
- API response must confirm "Onboarded: true" after completion.

## Responsiveness
- Strictly follows [UX_BASELINE.md](../../ux/UX_BASELINE.md).
- Wizard steps must adapt to vertical mobile layouts.

## Known Issues
- None ❌

## Verification Checklist
- [x] Enforced redirect via AuthGuard
- [x] All profile fields persist to Neon Postgres
- [x] Dashboard access granted only after completion
- [x] Responsive selection cards
