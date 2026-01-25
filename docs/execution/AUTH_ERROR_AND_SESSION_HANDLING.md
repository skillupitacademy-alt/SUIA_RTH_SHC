# Authentication Error Handling & Session Navigation Control
**Authority**: `.agent/AGENT_CONSTITUTION.md`
**Scope**: `apps/admin-app`, `apps/web-app` (where applicable)

## 1. Error Categories & UI
### Network Failures
*   **Trigger**: Fetch failure, Timeout, 5xx errors.
*   **UI**: Generic "Connection failed" inline banner. *No Alerts*.
*   **Action**: Allow retry. Do not clear session immediately unless 401/403 received.

### Invalid Credentials
*   **Trigger**: 401 on Login.
*   **UI**: "Invalid email or password." (Generic to prevent enumeration).
*   **Action**: Clear password field. Keep email.

### Session Expiry / Forced Logout
*   **Trigger**: 401 on Protected Route, Token Refresh Failure.
*   **UI**: Toast/Modal "Session expired. Please log in again."
*   **Action**: Redirect to `/login`. Clear all storage.

## 2. Browser Navigation Enforcement (Strict Mode)
### Back Button Handling
*   **Objective**: Prevent users from navigating "back" resulting in ambiguous state, or leaving a secured workflow unintentionally.
*   **Mechanism**:
    *   Listen to `popstate` event on authenticated routes.
    *   Intercept navigation.
    *   **Modal**: "Warning: Navigation Detected. If you go back, you will be logged out."
    *   **Confirm**: Call `logout()`, clear tokens, redirect to `/login`.
    *   **Cancel**: Stay on page (push state back).

### Forward Navigation Handling
*   **Objective**: Prevent user from clicking "Forward" to access a restricted page after logging out.
*   **Mechanism**:
    *   `AuthGuard` must re-validate token on mount.
    *   Disable/Partially mitigate browser cache mechanism (Cache-Control headers).

## 3. Implementation Plan
### Phase 2: UI Error Handling
*   Scan for `alert()`.
*   Replace with `ErrorBanner` component.
*   Update Login Pages (`admin-app`, `web-app`) to use this component.

### Phase 3: Session & Navigation
*   Create `NavigationGuard` component.
*   Implement `usePreventBack` hook.
*   Integrate into `AdminLayout` (and `DashboardLayout` for web-app if required).

### Phase 4: Hardening
*   Update `AuthGuard` to verify session validity via API (ping `me` endpoint) or check token expiration client-side rigorously.
*   Clear sensitive data from State Stores on logout.
