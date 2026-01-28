# 🔐 Auth User Journey
**Path**: `docs/pages/auth/AUTH_JOURNEY.md`

This document serves as the **Single Source of Truth** for the entire Authentication & Onboarding user journey.


### Codebase Inventory (Traceability)
**Frontend** (`apps/web-app/src/app/`)
- `signup/page.tsx`: Registration Page.
- `login/page.tsx`: Sign In Page.
- `onboarding/page.tsx`: Profile Completion Wizard.
- `forgot-password/page.tsx`: Recovery Request.
- `reset-password/page.tsx`: Password Update.

**Components** (`apps/web-app/src/components/`)
- `auth/AuthForms.tsx`: Shared Login/Signup form logic.
- `auth/AuthGuard.tsx`: Client-side protected route wrapper.
- `onboarding/OnboardingWizard.tsx`: Multi-step profile form.

---

## 1. Sign Up Page

*Source: sign-up.md*

### Purpose
Enable new users to create an account on the Quiz Platform.

### Expected Behavior
- Capture Name, Email, and Password.
- Enforcement of strong password criteria.
- Automatic login and redirection to **Onboarding** upon successful registration.
- Link to Sign In for existing users.

### Data Contract
- **Endpoint**: `POST /api/auth/signup`
- **Result**: Session created, `user.onboarded = false`.

### Verification
- [ ] Responsive layout.
- [ ] Prevents duplicate email registration.
- [ ] Redirects to Onboarding.

---

## 2. Onboarding Page
*Source: onboarding.md*

### Purpose
Capture essential professional and educational profile data for a personalized user experience.

### Entry Conditions
- User MUST be authenticated.
- User profile MUST be incomplete (`onboarded: false`).

### Expected Behavior
- **Wizard**: Capture Education Level, Professional Status, Experience, Domain Interest.
- **Finish**: Updates profile -> Redirects to **Dashboard**.

### Data Contract
- **Endpoint**: `PUT /api/auth/profile`
- **Result**: `user.onboarded = true`.

### Verification
- [ ] Enforced redirect via AuthGuard.
- [ ] All profile fields persist to database.

---

## 3. Sign In Page
*Source: sign-in.md*

### Purpose
Allow registered users to securely access their accounts.

### Expected Behavior
- Validation of email format and password presence.
- Redirection to **Dashboard** upon success.
- Link to Sign Up and Forgot Password.

### Data Contract
- **Endpoint**: `POST /api/auth/login`
- **Result**: Session created (JWT HttpOnly cookie).

### Verification
- [ ] Rejects invalid credentials.
- [ ] Redirects to Dashboard.

---

## 4. Forgot Password Page
*Source: forgot-password.md*

### Purpose
Allow users to request a password reset link without revealing account existence.

### Expected Behavior
- Input: Email Address.
- Output: "If an account exists, a link has been sent." (Neutral Message).
- Security: Must NOT disclose if email exists or not.

### Data Contract
- **Endpoint**: `POST /api/auth/forgot-password`
- **Result**: Single-use token sent via email or mocked in dev log.

---

## 5. Reset Password Page
*Source: reset-password.md*

### Purpose
Securely set a new password using a time-bound token.

### Entry Conditions
- URL Query: `?token=<valid_jwt>`

### Expected Behavior
- Validate token on load.
- Input: New Password + Confirm Password.
- Success: Password updated -> Redirect to **Sign In**.

### Data Contract
- **Endpoint**: `POST /api/auth/reset-password`
- **Result**: Password hash updated, all sessions invalidated.

### Verification
- [ ] Invalid/Expired token shows error.
- [ ] Successful reset allows login with new password.
