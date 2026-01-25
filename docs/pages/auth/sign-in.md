# Sign In Page Contract

## Purpose
Allow registered users to securely access their accounts via email and password credentials.

## Entry Conditions
- Publicly accessible.
- Redirect to Dashboard if already authenticated.

## Expected Behavior
- Validation of email format and password presence.
- Clear error messaging for invalid credentials.
- Redirection to Dashboard upon successful authentication.
- Link to Sign Up for new users.

## UI Rules
- Centralized, clean form layout.
- High-contrast primary button for "Sign In".
- "Forgot Password" link (placeholder if not implemented).

## Data Contract
- Uses `POST /api/auth/login`.
- Stores JWT in secure cookies or authoritative local storage.

## Responsiveness
- Strictly follows [UX_BASELINE.md](../../ux/UX_BASELINE.md).
- Form should stack vertically on narrow Viewports.

## Known Issues
- None ❌

## Verification Checklist
- [x] Renders correctly on mobile/desktop
- [x] Rejects invalid credentials with messaging
- [x] Redirects to Dashboard on success
- [x] Link to Sign Up is functional
