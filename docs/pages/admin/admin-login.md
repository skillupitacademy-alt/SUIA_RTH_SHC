# Page Contract: Admin Login
**Route**: `/login` (Admin App)

## 1. Visual Structure
*   **Layout**: Split Screen (Visual Left, Form Right).
*   **Visual Side**: Dark mode, "Secure Governance Terminal" branding, dynamic tech background.
*   **Form Side**:
    *   "Welcome Back" Header.
    *   Email Input (Icon: Mail).
    *   Password Input (Icon: Lock).
    *   "Authenticate" Button (Primary Color).
    *   Footer: "Restricted Access System v1.0.x".

## 2. Logic & Interactions
*   **On Submit**:
    *   Validate inputs.
    *   Call `apiClient.admin.login(email, password)` (New dedicated method).
    *   **Loading State**: Show spinner in button.
    *   **Error State**: Show red alert box above form.
    *   **Success**:
        *   Store Token.
        *   Redirect to `/` (Dashboard).

## 3. Security
*   Redirect to Dashboard if already authenticated.
*   Clear existing tokens on load (ensure clean session start).
*   Rate limiting handling (display user-friendly message if 429).
