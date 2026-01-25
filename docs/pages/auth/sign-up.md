# Sign Up Page Contract

## Purpose
Enable new users to create an account on the Quiz Platform.

## Entry Conditions
- Publicly accessible.
- Redirect to Dashboard if already authenticated.

## Expected Behavior
- Capture Name, Email, and Password.
- Enforcement of strong password criteria (if applicable).
- Automatic login and redirection to Onboarding upon successful registration.
- Link to Sign In for existing users.

## UI Rules
- Clean, focused form layout.
- Clear distinction between "Create Account" and "Sign In".

## Data Contract
- Uses `POST /api/auth/signup`.
- Resulting session must mark user as "Not Onboarded".

## Responsiveness
- Strictly follows [UX_BASELINE.md](../../ux/UX_BASELINE.md).
- Form elements must be easily tappable on mobile.

## Known Issues
- None ❌

## Verification Checklist
- [x] Responsive layout across devices
- [x] Validates all required fields
- [x] Redirects to Onboarding for new users
- [x] Prevents duplicate email registration
