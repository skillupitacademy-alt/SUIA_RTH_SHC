# 🧑‍✈️ Admin Platform Specification

This document consolidates the execution plans, authentication strategies, and dashboard requirements for the Admin Governance Terminal.

---

## 1. Authentication Strategy
*Source: ADMIN_AUTHENTICATION.md*

### Objectives
Implement a secure, isolated authentication system for platform administrators. This system must be distinct from the public user authentication.

### Security Boundaries
*   **Isolation**: Admin sessions must be logically separated from User sessions.
*   **Token Scoping**: Admin JWTs must contain specific claims (`role: 'admin'` or `scope: 'admin'`) and must NOT be valid for User routes.
*   **API Isolation**:
    *   `/api/admin/*`: Accepts ONLY Admin Tokens.
    *   `/api/auth/*` (User): Rejects Admin Tokens for user actions.
    *   `/api/admin/auth/*`: Dedicated endpoints for admin auth.

### Authentication Flows

#### A. Admin Login
- **Endpoint**: `POST /api/admin/auth/login` (Distinct from `/api/auth/login`)
- **Credentials**: Email/Password
- **Response**: Returns `adminAccessToken` (short-lived) and `adminRefreshToken` (httpOnly cookie).

#### B. Admin Signup (Restricted)
- **Policy**: Public admin signup is **DISABLED**.
- **Mechanism**:
    - Initial Root Admin seed via script/CLI.
    - Subsequent admins invited by Root Admin via "User Moderation" panel.

### Token Model
- **Access Token**: JWT, 15-minute expiry. Payroll: `{ sub: uuid, role: 'admin', permissions: [] }`.
- **Refresh Token**: Opaque/JWT, 7-day expiry, stored in secure cookie path `/api/admin`.

---

## 2. Dashboard Execution Plan
*Source: ADMIN_DASHBOARD_EXECUTION.md*

### Overview
Implement extreme scalability for session monitoring and reorganize the UI for a focused governance experience.

### Backend: Optimized Session Tracking
- Implement keyset or offset-based pagination at the database level for `AdminEngine.getLiveSessions`.
- Add total count for pagination metadata.

### Frontend: Horizontal Header & Reorganized Sidebar
- **AdminShell**: Move "ADMIN CORE" logo to the header. Label sidebar as "Platform Control".
- **Governance Terminal**: Expand to use 100% of available viewport width.
- **LiveSessionsList**: Implement pagination controls.

---

## 3. Password Recovery Flow
*Source: ADMIN_PASSWORD_PLAN.md*

### Goal
Implement a secure, production-ready password recovery system specifically for the Admin App.

### UI Requirements
- Step 1: Request reset link (`/forgot-password`).
- Step 2: Set new password using token (`/reset-password`).
- Login Page: Add link to `/forgot-password`.

### API Integration
- Uses existing `AuthService.forgotPassword`.
- **Verification**: The reset link must lead back to the Admin App's reset page, not the Web App.

---

## 4. Product Requirements & Detailed Spec
*Source: ADMIN_DASHBOARD_SPEC.md*

### Overview
The Admin Dashboard is the control center of the platform. It answers one core question: "Is the platform secure, healthy, and delivering quality assessments?"

### Key Modules

#### User & Account Overview
- **Visible**: Total users, new users, verified vs unverified, locked accounts.
- **Filtering (Discovery_Orchestrator)**:
-     - **Identity**: Multi-field search (Name/Email).
-     - **Access**: Role-based isolation (Admin/User).
-     - **Activity**: Real-time signal tracking (Online/Idle/Offline).
-     - **Security**: Block status (Blocked/Active) and Verification (Pending/Verified).
- **Why**: Track growth and detect suspicious activity.

#### Roles & Permissions (RBAC)
- **Visible**: Role list, user counts per role, assignment history.
- **Why**: Prevent privilege escalation.

#### Security & Login Health
- **Visible**: Login attempts (success/fail), active sessions, suspicious activity.
- **Why**: Detect brute-force attacks and monitor health.

#### Question Bank Health & Management
- **Metrics**: Total questions, difficulty distribution (30/30/40), active vs inactive.
    - **Skills**: Global matrix management (ID, Name, Category, Mapping Type) with direct CRUD, decoupled from strict hierarchy.
- **Workflow**: 5-step classification wizard (Domain -> Subject -> Topic -> Subtopic -> Question).

#### Exam Blueprint Monitoring
- **Visible**: Blueprints generated, scope context, generation success/failure logs.
- **Why**: Audit exam configuration integrity.

#### Scoring Analytics
- **Visible**: Avg scores by domain/difficulty, pass/fail trends, gap analysis.
- **Why**: Measure exam quality and difficulty balance.

#### Restriction Matrix
- **Restricted**: Passwords, User Secrets, Individual Answer Data (Privacy).

