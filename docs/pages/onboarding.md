# Onboarding Page – Objective & Contract

---

## Purpose
Collect initial user preferences and professional background to personalize the assessment experience.

---

## Entry Conditions
- User MUST be authenticated.
- User MUST have `onboarded: false` in their profile (or equivalent state).
- User MUST be redirected here immediately after signup or first login.

---

## Expected Behavior

### Profile Setup
- Collect "Target Domain" (e.g., Frontend, Backend).
- Optional: Collect "Skill Level" self-assessment.
- Update the user record in the database upon completion.

### Completion
- "Finish Setup" button updates the user's `onboarded` status.
- Redirects to `/dashboard` upon success.

---

## Data Contract
- Sourced from and persists to `apiClient.auth.updateProfile()`.
- Validates that mandatory fields are filled before allowing submission.

---

## UI Rules
- Use a "Welcome" or "Step-by-step" wizard feel.
- Avoid overwhelming the user with too many questions.

---

## Verification Checklist
- [ ] User cannot access the dashboard until onboarding is complete.
- [ ] Profile updates correctly reflect in the `useAuthStore`.
- [ ] Redirect to `/dashboard` works smoothly.
