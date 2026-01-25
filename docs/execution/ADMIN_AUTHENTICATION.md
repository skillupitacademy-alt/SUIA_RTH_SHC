# Admin Authentication Strategy
**Authority**: `.agent/AGENT_CONSTITUTION.md`
**Scope**: `apps/admin-app` (Frontend), `apps/api-server` (Backend)

## 1. Objectives
Implement a secure, isolated authentication system for platform administrators. This system must be distinct from the public user authentication.

## 2. Security Boundaries
*   **Isolation**: Admin sessions must be logically separated from User sessions.
*   **Token Scoping**: Admin JWTs must contain specific claims (`role: 'admin'` or `scope: 'admin'`) and must NOT be valid for User routes.
*   **API Isolation**:
    *   `/api/admin/*`: Accepts ONLY Admin Tokens.
    *   `/api/auth/*` (User): Rejects Admin Tokens for user actions.
    *   `/api/admin/auth/*`: **NEW** Dedicated endpoints for admin auth.

## 3. Authentication Flows

### A. Admin Login
1.  **UI**: `apps/admin-app/src/app/login/page.tsx`
2.  **Endpoint**: `POST /api/admin/auth/login` (Distinct from `/api/auth/login`)
3.  **Credentials**: Email/Password
4.  **Response**: Returns `adminAccessToken` (short-lived) and `adminRefreshToken` (httpOnly cookie).

### B. Admin Signup (Restricted)
*   **Policy**: Public admin signup is **DISABLED**.
*   **Mechanism**:
    *   Initial Root Admin seed via script/CLI.
    *   Subsequent admins invited by Root Admin via "User Moderation" panel (Invite Link or Direct Creation).
    *   NO `/signup` route in `admin-app`.

## 4. Token Model
*   **Access Token**: JWT, 15-minute expiry. Payroll: `{ sub: uuid, role: 'admin', permissions: [] }`.
*   **Refresh Token**: Opaque/JWT, 7-day expiry, stored in secure cookie path `/api/admin`.

## 5. Audit & Logging
*   All admin auth events (Success, Failure, Logout) must be logged to `admin_audit_logs` table.
*   Log fields: `adminId`, `ipAddress`, `userAgent`, `action`, `timestamp`.

## 6. Implementation Plan
1.  **Database**: Verify `admins` table or `users` table with distinct role separation. (Decision: Use `users` table with `role='admin'` but strict service-level isolation, OR distinct `admins` table. *Decision: Use existing Users table but enforce Role check at Service Layer strict boundary*).
2.  **Backend**:
    *   Create `AdminAuthService`.
    *   Create `/api/admin/auth` endpoints.
    *   Implement Admin Strategy in Passport/Guard.
3.  **Frontend**:
    *   Refine `apps/admin-app/src/app/login` to use new endpoint.
    *   Ensure `AdminGuard` validates specific admin token claims.
