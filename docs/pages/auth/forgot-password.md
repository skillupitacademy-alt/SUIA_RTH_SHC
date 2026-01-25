# Forgot Password Page Contract

## Page
- **Route**: `/forgot-password`
- **Folder**: `docs/pages/auth/forgot-password.md`
- **Category**: Authentication (Pre-Login)

---

## Purpose
Allow a user who has forgotten their password to request a secure password reset link via email **without revealing account existence**.

This page is part of the authentication boundary and must not expose any dashboard or authenticated UI elements.

---

## User Journey
1. User clicks **“Forgot password?”** from Login page
2. User lands on `/forgot-password`
3. User enters email address
4. User submits request
5. System displays neutral success message
6. User receives reset link via email (if account exists)

---

## UI Requirements
- Minimal authentication layout (same as Login / Signup)
- Brand gradient background
- Single card layout
- No dashboard navigation
- No authenticated header items
- Typography follows global scale (−15% applied globally)

---

## Inputs
### Email Address
- Type: `email`
- Required: Yes
- Validation:
  - Must be valid email format
  - Trim whitespace
  - Case-insensitive

---

## CTAs
- **Primary**: “Send reset link”
- **Secondary**: “Back to login”

---

## States

### Idle
- Email input enabled
- Submit disabled until valid email

### Loading
- Submit button disabled
- Inline loader or button spinner

### Success (Always Neutral)
Display **same message regardless of email validity**:
> “If an account exists for this email, a password reset link has been sent.”

### Error
- Network or server error only
- Example:
  > “Something went wrong. Please try again later.”

⚠️ Must NOT show:
- “Email not found”
- “User does not exist”

---

## API Contract (Backend-Facing)

### Request Reset
```
POST /auth/forgot-password
Body:
{
  "email": string
}
```

### Response
- Always return 200 OK (even if email does not exist)
- No user-identifying error messages

---

## Security Constraints
- Must not disclose account existence
- Rate limiting assumed (backend responsibility)
- Email reset token must be:
  - Single-use
  - Time-bound (15–30 minutes)
- Page must be accessible without authentication

---

## Redirect Rules
- On success: stay on same page with success state
- “Back to login” → `/login`

---

## Accessibility
- Label + input association
- Keyboard navigable
- Screen-reader friendly success/error messaging

---

## Analytics / Logging
- Log event: `auth_forgot_password_requested`
- Do not log email address in plaintext

---

## Explicit Non-Goals
- No password reset form here
- No OTP entry
- No dashboard access
- No authentication state mutation

---

## Governance
- Must comply with:
  1. `.agent/AGENT_CONSTITUTION.md`
  2. `docs/execution/PROJECT_BOOTSTRAP.md`
  3. Global UX rules (`UX_BASELINE.md`)
- No database schema changes
- No remote GitHub push without explicit approval

---

## Status
- **Contract State**: STABILIZED
- **Implementation**: In Progress
