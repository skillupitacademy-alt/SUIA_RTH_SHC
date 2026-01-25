# Reset Password Page Contract

## Page
- **Route**: `/reset-password`
- **Query Params**: `?token=<reset_token>`
- **Folder**: `docs/pages/auth/reset-password.md`
- **Category**: Authentication (Pre-Login)

---

## Purpose
Allow a user to securely set a new password using a **single-use, time-bound reset token** issued via the Forgot Password flow.

This page finalizes the password recovery process and must remain outside the authenticated application shell.

---

## Preconditions
- User arrives via email link containing a valid reset token
- Token has not expired
- Token has not been used previously

---

## User Journey
1. User clicks reset link from email
2. User lands on `/reset-password?token=...`
3. System validates token
4. User enters new password and confirmation
5. User submits form
6. Password is updated
7. User is redirected to Login with success state

---

## UI Requirements
- Minimal authentication layout (same as Login / Forgot Password)
- Brand gradient background
- Centered card layout
- No dashboard navigation
- No authenticated header items
- Typography respects global −15% scale

---

## Inputs

### New Password
- Type: `password`
- Required: Yes
- Validation rules:
  - Minimum length (backend-defined, e.g. 8+)
  - Must not match recent passwords (backend responsibility)
  - Visibility toggle allowed

### Confirm Password
- Type: `password`
- Required: Yes
- Validation:
  - Must exactly match New Password

---

## CTAs
- **Primary**: “Reset password”
- **Secondary**: “Back to login” (visible after success or failure)

---

## States

### Token Validation (Initial)
- Validate token on page load
- While validating:
  - Show loader
  - Disable inputs

### Invalid / Expired Token
Display clear, non-technical message:
> “This password reset link is invalid or has expired.”

Actions:
- Show “Request a new reset link”
- Link → `/forgot-password`

---

### Idle (Valid Token)
- Password fields enabled
- Submit disabled until validations pass

---

### Loading
- Submit disabled
- Show inline loader or button spinner

---

### Success
Display confirmation message:
> “Your password has been reset successfully. You can now sign in.”

Actions:
- CTA: “Go to login” → `/login`

---

## Error
- Network or unexpected server error only
- Example:
> “Unable to reset password. Please try again.”

⚠️ Must NOT:
- Expose token details
- Reveal backend failure reasons

---

## API Contract (Backend-Facing)

### Reset Password
```
POST /auth/reset-password
Body:
{
  "token": string,
  "newPassword": string
}
```

### Response
- Success → 200 OK
- Invalid / expired token → 400 / 401 (handled gracefully in UI)
- Token must be invalidated after use

---

## Security Constraints
- Token must be:
  - Single-use
  - Time-bound (15–30 minutes)
- Token must be invalidated immediately after successful reset
- Page must not auto-authenticate user after reset
- No password value logged anywhere (client or server)

---

## Redirect Rules
- Success → `/login` (with success flash message)
- Invalid token → stay on page with recovery options
- “Request new reset link” → `/forgot-password`

---

## Accessibility
- Password visibility toggle accessible via keyboard
- Error and success messages announced to screen readers
- Proper label and input association

---

## Analytics / Logging
- Log event: `auth_password_reset_completed`
- Do NOT log token or password values

---

## Explicit Non-Goals
- No OTP-based reset
- No automatic login after reset
- No dashboard access
- No user profile editing

---

## Governance
- Must comply with:
  1. `.agent/AGENT_CONSTITUTION.md`
  2. `docs/execution/PROJECT_BOOTSTRAP.md`
  3. Global UX rules (`UX_BASELINE.md`)
- No database or migration changes
- No remote GitHub push without explicit approval

---

## Status
- **Contract State**: STABILIZED
- **Implementation**: In Progress
