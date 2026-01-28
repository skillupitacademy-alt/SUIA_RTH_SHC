# 🛡️ Admin User Journey
**Path**: `docs/pages/admin/ADMIN_JOURNEY.md`

This document defines the restricted access and governance flows for the Admin Platform.

### Codebase Inventory (Traceability)
**Frontend** (`apps/admin-app/src/app/`)
- `page.tsx`: Main Governance Dashboard.
- `login/page.tsx`: Secure Admin Entry.
- `questions/page.tsx`: Question Bank Management (CRUD).
- `users/page.tsx`: User Management.

**Components** (`apps/admin-app/src/components/`)
- `auth/`: `AdminGuard` (RBAC protection).
- `dashboard/`: `AdminStats`, `SecurityHealthPanel`, `ContentReadinessBoard`.
- `content/`: `ContentManager` (Bulk Operations).
- `entry/`: `QuestionEditor` forms.
- `layout/`: `AdminShell` (Sidebar/Header).

---

## 1. Admin Login (Secure Terminal)
*Source: admin-login.md*

### Purpose
Secure entry point for platform administrators ("Secure Governance Terminal").

### UI Structure
- **Layout**: Split Screen (Branding Left, Form Right).
- **Theme**: Dark Mode, Code/Terminal aesthetic.

### Logic
- **Endpoint**: `POST /api/admin/login` (Admin-Specific Auth).
- **Success**: Redirect to Admin Dashboard.
- **Security**: Rate-limited, distinct from user auth.

### Verification
- [ ] Validates admin credentials.
- [ ] Shows "Restricted Access" warning.

---

## 2. Admin Signup (Restricted)
*Source: admin-signup.md*

### Policy
**STRICTLY DISABLED**. There is no public signup for admins.

### Logic
- Any attempt to access `/signup` on Admin App must redirect to `/login`.
- **Future Scope**: Invitation-based flow only (`/invite/accept?token=...`).
