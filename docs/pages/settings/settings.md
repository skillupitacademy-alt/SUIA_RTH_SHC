# Settings Page – Objective & Contract

---

## Purpose
Allow users to view their account profile, manage preferences, and perform account-level actions like Logging Out.

---

## Entry Conditions
- User MUST be authenticated.
- Unauthorized users MUST be redirected to `/login`.

---

## Expected Behavior

### Profile Section
- Display User Name, Email, and Role.
- Show "Onboarded" status.

### Account Actions
- Provide a clear "Logout" action.
- Confirmation modal or immediate redirection on logout.

---

## Data Contract
- Data sourced from `useAuthStore`.
- No sensitive data (like tokens) visible in plain text.
- Fallback for missing user data (e.g., "Guest").

---

## UI Rules
- Do NOT show password update unless functional.
- Do NOT show delete account unless functional.

---
+
+## Verification Checklist
+- [x] User details match logged-in session.
+- [x] Logout button clears store and redirects.
+- [x] Profile is read-only unless edit is implemented.
